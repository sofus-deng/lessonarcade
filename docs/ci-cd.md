# CI/CD Documentation

This document describes the continuous integration and continuous deployment setup for LessonArcade.

## Overview

The project uses GitHub Actions for both CI (Continuous Integration) and CD (Continuous Deployment):

- **CI Workflow** (`.github/workflows/ci.yml`): Runs on pull requests and pushes to main
- **Deploy Workflow** (`.github/workflows/deploy.yml`): Runs on pushes to main after CI succeeds

## CI Workflow

### Triggers

- Pull requests targeting `main`
- Pushes to `main`

### CI Steps

1. **Checkout code**: Clone the repository
2. **Setup Node.js**: Install Node.js 20
3. **Setup pnpm**: Install pnpm package manager
4. **Cache pnpm store**: Cache dependencies for faster builds
5. **Install dependencies**: `pnpm install --frozen-lockfile`
6. **Run linter**: `pnpm lint`
7. **Run typecheck**: `pnpm typecheck`
8. **Run unit tests**: `pnpm test` (Vitest with jsdom environment)
9. **Build application**: `pnpm build`
10. **Install Playwright browsers**: `pnpm exec playwright install --with-deps`
11. **Run E2E tests**: `pnpm test:e2e`
12. **Upload artifacts**: Playwright HTML report and test results

### Playwright in CI

Playwright is configured to run with a production server for determinism:

- **Environment variable**: `PLAYWRIGHT_WEB_SERVER_CMD="pnpm start --port 3100"`
- **Base URL**: `http://127.0.0.1:3100`
- **Port**: 3100

The production server (`pnpm start`) is used instead of the dev server because:
- Build output is required (must run `pnpm build` first)
- More consistent and deterministic test results
- Closer to production environment

### Artifacts

The following artifacts are uploaded after each CI run (retained for 30 days):

- `playwright-report`: HTML report for E2E tests
- `playwright-test-results`: Test results and traces

## Deploy Workflow

### Triggers

- Pushes to `main` (only after CI succeeds)

### Deploy Steps

1. **Checkout code**: Clone the repository
2. **Setup SSH key**: Configure SSH for VPS access
3. **Deploy to VPS**: Update code and restart service
4. **Health check**: Verify the application is running
5. **Cleanup**: Remove SSH key

### VPS Deployment Process

The deployment is idempotent and follows these steps:

```bash
cd "$VPS_APP_DIR"
git fetch --all
git reset --hard origin/main
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart "$VPS_SERVICE_NAME"
```

### Health Check

After deployment, a health check is performed:

```bash
curl -fsS http://127.0.0.1:3100/
```

The deployment fails if the health check returns a non-200 status code.

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret | Description | Example |
|--------|-------------|---------|
| `VPS_HOST` | IP address or hostname of the VPS | `192.0.2.1` or `example.com` |
| `VPS_USER` | SSH username for the VPS | `deploy` or `ubuntu` |
| `VPS_SSH_KEY` | Private SSH key for VPS authentication | The contents of your private key file |
| `VPS_APP_DIR` | Absolute path to the application directory on the VPS | `/var/www/lessonarcade` |
| `VPS_SERVICE_NAME` | Systemd service name for the application | `lessonarcade` |

### Setting up SSH Key

1. Generate a new SSH key pair (or use an existing one):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/lessonarcade_deploy -C "github-actions-deploy"
   ```

2. Add the public key to the VPS:
   ```bash
   ssh-copy-id -i ~/.ssh/lessonarcade_deploy.pub user@your-vps-host
   ```

3. Copy the private key content and add it as `VPS_SSH_KEY` in GitHub Secrets:
   ```bash
   cat ~/.ssh/lessonarcade_deploy
   ```

## Server Prerequisites

The VPS must have the following installed and configured:

### Required Software

- **Node.js**: Version 20 or later
- **pnpm**: Latest version (install via npm: `npm install -g pnpm`)
- **git**: For pulling code updates
- **systemd**: For service management

### Application Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/lessonarcade.git /var/www/lessonarcade
   cd /var/www/lessonarcade
   ```

2. **Install dependencies**:
   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Build the application**:
   ```bash
   pnpm build
   ```

### Systemd Service

Create a systemd service file at `/etc/systemd/system/lessonarcade.service`:

```ini
[Unit]
Description=LessonArcade Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lessonarcade
ExecStart=/usr/bin/pnpm start --port 3100
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable lessonarcade
sudo systemctl start lessonarcade
```

### Firewall Configuration

Ensure port 3100 is accessible (if needed externally):

```bash
sudo ufw allow 3100
```

For production, consider using a reverse proxy like Nginx to serve the application on port 80/443.

## Testing Locally

To test the CI workflow locally before pushing:

```bash
# Run all CI steps
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install --with-deps
PLAYWRIGHT_WEB_SERVER_CMD="pnpm start --port 3100" pnpm test:e2e
```

## Troubleshooting

### CI Failures

- **Lint errors**: Run `pnpm lint` locally to see and fix issues
- **Type errors**: Run `pnpm typecheck` locally to see and fix issues
- **Test failures**: Run `pnpm test` or `pnpm test:e2e` locally to debug
- **Build failures**: Check build logs for dependency or configuration issues

### Deploy Failures

- **SSH connection errors**: Verify `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` secrets are correct
- **Permission errors**: Ensure the VPS user has write permissions to `VPS_APP_DIR` and sudo access to restart the service
- **Service restart failures**: Check service logs with `sudo journalctl -u lessonarcade -n 50`
- **Health check failures**: Verify the application is running on port 3100 with `curl http://127.0.0.1:3100/`

### Playwright Issues

- **Browser installation failures**: Ensure the runner has sufficient disk space
- **Timeout errors**: Increase timeout in `playwright.config.ts` if tests are slow
- **Flaky tests**: Check the HTML report artifact for detailed failure information

## Additional Notes

- The CI workflow uses `forbidOnly: !!process.env.CI` to prevent `test.only` from accidentally being committed
- Playwright retries failed tests twice in CI (`retries: process.env.CI ? 2 : 0`)
- The pnpm store is cached to speed up dependency installation
- Artifacts are retained for 30 days for debugging purposes
