# CI/CD Contest Fixes Plan

## Overview

This document outlines the changes needed to prepare the CI/CD workflows for the AI Partner Catalyst hackathon submission.

## Changes Required

### 1. Fix `.github/workflows/ci.yml`

#### Current Issue
The `PLAYWRIGHT_WEB_SERVER_CMD` environment variable is set to `"pnpm start --port 3100"`, but this may not correctly pass the port to Next.js.

#### Fix Required
Update line 61 in `.github/workflows/ci.yml`:

```yaml
# Before:
PLAYWRIGHT_WEB_SERVER_CMD: "pnpm start --port 3100"

# After:
PLAYWRIGHT_WEB_SERVER_CMD: "pnpm start -- -p 3100"
```

The `--` flag is required to pass arguments through to the underlying Next.js start command.

### 2. Add Playwright Browser Caching in CI

#### Current State
No caching for Playwright browsers exists in the CI workflow.

#### Fix Required
Add a new step after "Install dependencies" to cache Playwright browsers:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-playwright-
```

This will:
- Cache the Playwright browser binaries in `~/.cache/ms-playwright`
- Use the OS and lockfile hash as the cache key
- Reduce CI runtime by avoiding browser downloads on each run
- Improve test reliability by reducing flakiness from network issues

### 3. Handle `.github/workflows/deploy.yml`

#### Current Issue
The deploy workflow runs automatically on every push to `main`, but it requires VPS SSH secrets that may not be configured. This causes CI failures.

#### Fix Required
Change the workflow trigger from automatic `push` to manual `workflow_dispatch`:

```yaml
# Before:
on:
  push:
    branches: [main]

# After:
on:
  workflow_dispatch:  # Manual trigger only
```

Add a comment at the top of the file:

```yaml
# NOTE: This workflow is disabled for automatic execution.
# Cloud Run is the primary contest deployment path.
# This VPS deploy workflow is only for manual use if needed.
name: Deploy
```

This ensures:
- No automatic failures due to missing VPS secrets
- Cloud Run remains the primary deployment path for the contest
- Manual deployment to VPS is still available if needed

## Updated CI Workflow Structure

After applying all fixes, the `.github/workflows/ci.yml` will look like:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-playwright-

      - name: Run linter
        run: pnpm lint

      - name: Run typecheck
        run: pnpm typecheck

      - name: Run unit tests
        run: pnpm test

      - name: Build application
        run: pnpm build

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        env:
          PLAYWRIGHT_WEB_SERVER_CMD: "pnpm start -- -p 3100"
        run: pnpm test:e2e

      - name: Upload Playwright HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload Playwright test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-test-results
          path: test-results/
          retention-days: 30
```

## Updated Deploy Workflow Structure

After applying the fix, the `.github/workflows/deploy.yml` will look like:

```yaml
# NOTE: This workflow is disabled for automatic execution.
# Cloud Run is the primary contest deployment path.
# This VPS deploy workflow is only for manual use if needed.
name: Deploy

on:
  workflow_dispatch:  # Manual trigger only

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: ci

    steps:
      # ... rest of the workflow unchanged
```

## Verification Steps

After implementing these changes:

1. Push to `main` branch
2. Verify CI workflow runs successfully
3. Verify Playwright tests pass with the corrected webServer command
4. Verify deploy workflow no longer runs automatically
5. Verify deploy workflow can be triggered manually via GitHub Actions UI

## Benefits

- **Faster CI**: Playwright browser caching reduces runtime by 30-60 seconds
- **More Reliable**: Reduced flakiness from network issues during browser downloads
- **Clean CI History**: No failures from missing VPS deployment secrets
- **Clear Deployment Path**: Cloud Run is clearly the primary deployment method
