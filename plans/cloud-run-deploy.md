# Cloud Run Deployment Guide for LessonArcade

This guide explains how to deploy the LessonArcade Next.js 16 application to Google Cloud Run using Docker with standalone output.

## Overview

The application uses:
- Next.js 16 with App Router
- pnpm as package manager
- Node.js 24 runtime (Next.js 16 requires Node.js 20.9+, we're using Node 24)
- Basic Authentication for /studio routes
- Optional AI services (Gemini, ElevenLabs)

## Required Environment Variables

### Required for Production
- `STUDIO_BASIC_AUTH_USER` - Username for protecting /studio routes
- `STUDIO_BASIC_AUTH_PASS` - Password for protecting /studio routes
- `LOGGING_SALT` - Random string for IP hashing in structured logs

### Optional (for full functionality)
- `GEMINI_API_KEY` - Google AI Studio API key for lesson generation
- `ELEVENLABS_API_KEY` - ElevenLabs API key for voice synthesis
- `ELEVENLABS_VOICE_ID_EN` - English voice ID (default: Adam)
- `ELEVENLABS_VOICE_ID_ZH` - Chinese voice ID (default: Zhao)
- `ELEVENLABS_MODEL_ID` - ElevenLabs model ID (default: eleven_multilingual_v2)

### Cloud Run Specific
- `PORT` - Automatically set by Cloud Run (typically 8080)
- `HOSTNAME` - Set to 0.0.0.0 for Cloud Run compatibility

**Note:** Cloud Run injects the PORT environment variable and the container must listen on 0.0.0.0:$PORT. This is handled in our Dockerfile and Next.js configuration.

## Local Docker Development

### Building the Docker Image

```bash
# Build the Docker image
docker build -t lessonarcade:latest .

# Or with a specific tag
docker build -t lessonarcade:v1.0.0 .
```

### Running Locally

```bash
# Run with environment variables from .env file (mimicking Cloud Run contract)
docker run -p 9090:8080 -e PORT=8080 --env-file .env lessonarcade:latest

# Or pass environment variables directly
docker run -p 9090:8080 \
  -e PORT=8080 \
  -e STUDIO_BASIC_AUTH_USER=admin \
  -e STUDIO_BASIC_AUTH_PASS=secure-password \
  -e LOGGING_SALT=random-salt-string \
  lessonarcade:latest
```

### Testing Routes Locally

After starting the container, test these routes:

1. **Public Demo**: http://localhost:9090/demo
   - Should load the demo page without authentication

2. **Voice Lesson**: http://localhost:9090/demo/voice/effective-meetings
   - Should load the voice lesson page (requires ELEVENLABS_API_KEY for audio)

3. **Protected Studio**: http://localhost:9090/studio
   - Should prompt for Basic Authentication
   - Use credentials from STUDIO_BASIC_AUTH_USER/PASS

## Cloud Run Deployment

### Deployment Commands

```bash
# Deploy to Cloud Run
gcloud run deploy lessonarcade \
  --image gcr.io/PROJECT-ID/lessonarcade:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars STUDIO_BASIC_AUTH_USER=admin \
  --set-env-vars STUDIO_BASIC_AUTH_PASS=secure-password \
  --set-env-vars LOGGING_SALT=random-salt-string
```

### Configuration Recommendations

#### Minimum Instances
- Set to 0 for cost optimization (cold starts ~2-3 seconds)
- Set to 1 for consistent performance (additional cost)

#### CPU Allocation
- CPU always allocated: Yes (recommended for consistent performance)
- Without CPU allocation: May experience latency spikes

#### Concurrency
- Default: 80 requests per container
- For this app: 20-40 is recommended due to potential AI processing

#### Memory
- Minimum: 512MiB
- Recommended: 1GiB (for AI processing and voice generation)

#### Cost Considerations

| Configuration | Approx. Monthly Cost (us-central1) |
|----------------|------------------------------------|
| 0 min instances, 512MiB, CPU on-demand | $0-5 |
| 0 min instances, 1GiB, CPU always on | $5-15 |
| 1 min instance, 1GiB, CPU always on | $15-25 |

*Note: Actual costs depend on traffic and AI API usage*

### Setting Up Secrets

For production, use Google Secret Manager:

```bash
# Create secrets
gcloud secrets create studio-auth-user --replication-policy="automatic"
gcloud secrets create studio-auth-pass --replication-policy="automatic"
gcloud secrets create logging-salt --replication-policy="automatic"

# Add secret values
echo -n "admin" | gcloud secrets versions add studio-auth-user --data-file=-
echo -n "secure-password" | gcloud secrets versions add studio-auth-pass --data-file=-
echo -n "random-salt-string" | gcloud secrets versions add logging-salt --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding studio-auth-user \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy with secrets
gcloud run deploy lessonarcade \
  --image gcr.io/PROJECT-ID/lessonarcade:latest \
  --set-secrets STUDIO_BASIC_AUTH_USER=studio-auth-user:latest \
  --set-secrets STUDIO_BASIC_AUTH_PASS=studio-auth-pass:latest \
  --set-secrets LOGGING_SALT=logging-salt:latest
```

## Dockerfile Details

The Dockerfile uses a multi-stage build:

1. **Base Stage**: Node.js 24 Alpine with pnpm
2. **Dependencies Stage**: Installs all dependencies
3. **Builder Stage**: Builds the Next.js application with standalone output
4. **Runner Stage**: Minimal runtime with only necessary files

### Key Features

- Uses Next.js standalone output for minimal image size (~150MB vs ~500MB)
- Copies only necessary files from node_modules
- Includes proxy.ts middleware for Basic Authentication (no renaming needed)
- Runs as non-root user for security
- Listens on PORT environment variable (Cloud Run compatible)
- Uses Node.js 24 for Next.js 16 compatibility (Next.js 16 requires Node.js 20.9+)

## Troubleshooting

### Common Issues

1. **Port Issues**
   - Ensure container listens on PORT (not hardcoded 3000)
   - Cloud Run automatically sets PORT to 8080
   - Local testing uses port 9090 to avoid conflicts

2. **Authentication Issues**
   - Verify STUDIO_BASIC_AUTH_USER/PASS are set
   - Check browser doesn't have cached credentials

3. **Build Failures**
   - Ensure pnpm-lock.yaml is present
   - Check Node.js version compatibility (20.9+)

4. **Memory Issues**
   - Increase memory allocation if AI processing fails
   - Monitor Cloud Run logs for OOM errors

### Monitoring

```bash
# View logs
gcloud logs tail "projects/PROJECT-ID/logs/run.googleapis.com%2Fstdout"

# Check metrics
gcloud monitoring metrics list --filter="run.googleapis.com"
```

## CI/CD Integration

For automated deployment, consider:

1. **GitHub Actions**: Build and push to Artifact Registry on merge
2. **Cloud Build**: Trigger on repository push
3. **Deployment Script**: Automated deployment with environment-specific configs

Example GitHub Actions workflow:

```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: actions/checkout@v3
    
    - name: Google Auth
      id: auth
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}
    
    - name: Build and Push
      uses: google-github-actions/deploy-cloudrun@v1
      with:
        image: gcr.io/${{ secrets.GCP_PROJECT }}/lessonarcade
        service: lessonarcade
        region: us-central1