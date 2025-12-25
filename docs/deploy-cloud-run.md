# Cloud Run Deployment Runbook

This runbook provides step-by-step, copy-paste runnable instructions for deploying LessonArcade to Google Cloud Run.

## Quick Start (Primary Path for Devpost Submission)

For the fastest path to deploy and get your hosted URL for Devpost, use the provided deployment scripts:

```bash
# 1. Set your project ID (required)
export GCP_PROJECT_ID="your-project-id"

# 2. Enable required APIs (one-time setup)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com aiplatform.googleapis.com

# 3. Grant Vertex AI permissions to Cloud Run service account (one-time setup)
PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.user"

# 4. Run the deployment script
./scripts/cloud-run/deploy.sh

# The script will output: HOSTED_URL=https://your-service-url.a.run.app
# Use this URL for your Devpost submission
```

**Optional: Run smoke tests after deployment:**
```bash
# Get the URL from the deploy script output or:
SERVICE_URL=$(gcloud run services describe lessonarcade --region=us-central1 --format="value(status.url)")

# Run smoke tests
./scripts/cloud-run/smoke-test.sh $SERVICE_URL
```

## Prerequisites

Before you begin, ensure you have:

1. **Google Cloud SDK (gcloud) installed**
    ```bash
    # Install gcloud CLI (macOS)
    brew install google-cloud-sdk

    # Initialize gcloud
    gcloud init
    ```

2. **Docker installed and running**
    ```bash
    # Verify Docker is running
    docker ps
    ```

3. **A Google Cloud project with billing enabled**
    ```bash
    # Create or select a project
    gcloud projects create PROJECT_ID
    gcloud config set project PROJECT_ID
    ```

4. **Appropriate permissions** (roles):
    - `roles/run.admin` - Cloud Run Admin
    - `roles/artifactregistry.writer` - Artifact Registry Writer
    - `roles/secretmanager.admin` - Secret Manager Admin
    - `roles/serviceusage.serviceUsageAdmin` - Enable APIs

## One-Time Setup

### 1. Enable Required APIs

Enable the Cloud Run, Cloud Build, Artifact Registry, Secret Manager, and Vertex AI APIs:

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

### 2. Create Artifact Registry Repository

Create a Docker repository in Artifact Registry:

```bash
# Set your region
export REGION="us-central1"
export AR_REPO="lessonarcade"

# Create the repository
gcloud artifacts repositories create $AR_REPO \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for LessonArcade"
```

### 3. Authenticate Docker with Artifact Registry

```bash
# Configure Docker authentication
gcloud auth configure-docker $REGION-docker.pkg.dev
```

### 4. Set Up Authentication

```bash
# Authenticate with gcloud
gcloud auth login

# For automated deployments, set up application default login
gcloud auth application-default login
```

### 5. Set Up Vertex AI IAM Permissions (Required for Production Mode)

For Vertex AI integration, grant the Cloud Run service account the necessary permissions:

```bash
# Get the project number and service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant Vertex AI User role to the Cloud Run service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/aiplatform.user"

# Verify the permission was granted
gcloud projects get-iam-policy $PROJECT_ID \
    --filter="serviceAccount:$SERVICE_ACCOUNT" \
    --flatten="bindings[].members" \
    --format="table(bindings.role,bindings.members)"
```

**Note**: The `roles/aiplatform.user` role allows the service account to invoke Vertex AI models. This is the minimum required permission for Vertex AI operations.

## Setting Environment Variables Securely

**IMPORTANT: Never commit secrets to git.** Use Google Cloud Secret Manager for sensitive values.

### Option 1: Using Secret Manager (Recommended for Production)

Create secrets for sensitive values:

```bash
# Create secrets
gcloud secrets create gemini-api-key --replication-policy="automatic"
gcloud secrets create elevenlabs-api-key --replication-policy="automatic"
gcloud secrets create studio-auth-user --replication-policy="automatic"
gcloud secrets create studio-auth-pass --replication-policy="automatic"
gcloud secrets create logging-salt --replication-policy="automatic"

# Add secret values (replace with your actual values)
echo -n "your-gemini-api-key" | gcloud secrets versions add gemini-api-key --data-file=-
echo -n "your-elevenlabs-api-key" | gcloud secrets versions add elevenlabs-api-key --data-file=-
echo -n "admin" | gcloud secrets versions add studio-auth-user --data-file=-
echo -n "your-secure-password" | gcloud secrets versions add studio-auth-pass --data-file=-
echo -n "random-salt-string" | gcloud secrets versions add logging-salt --data-file=-

# Grant Cloud Run service account access to secrets
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding elevenlabs-api-key \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding studio-auth-user \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding studio-auth-pass \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding logging-salt \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
```

### Option 2: Using Environment Variables (For Non-Sensitive Values Only)

For non-sensitive configuration values, you can use environment variables directly:

```bash
# Voice preset IDs (these are not secrets)
export VOICE_TTS_VOICE_ID_EN_INSTRUCTOR="your-voice-id"
export VOICE_TTS_VOICE_ID_EN_NARRATOR="your-voice-id"
export VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR="your-voice-id"
export VOICE_TTS_VOICE_ID_ZH_NARRATOR="your-voice-id"
```

## AI Configuration Options

LessonArcade supports two modes for Gemini AI integration:

### Developer API Key Mode (Development)

For local development and testing, use the Google AI Studio API key:

```bash
# Set GEMINI_API_KEY as a secret
echo -n "your-gemini-api-key" | gcloud secrets versions add gemini-api-key --data-file=-
```

### Vertex AI Mode (Production - Recommended)

For production deployments, use Vertex AI with Application Default Credentials (ADC):

```bash
# Set Vertex AI configuration as environment variables (not secrets)
export GCP_PROJECT_ID=$PROJECT_ID
export GCP_REGION="us-central1"
export GCP_VERTEX_MODEL="gemini-2.0-flash-exp"
```

**Benefits of Vertex AI Mode**:
- Uses Application Default Credentials (ADC) for authentication
- No API key management required
- Better security and scalability
- Seamless integration with Cloud Run service accounts
- Enterprise-grade access controls

## Deployment Script Details

### Using the Deployment Script (Recommended)

The project includes a deployment script that automates the entire process:

```bash
# Make the script executable (if not already)
chmod +x scripts/cloud-run/deploy.sh

# Set environment variables for deployment
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"  # Optional, defaults to us-central1
export CLOUD_RUN_SERVICE="lessonarcade"  # Optional, defaults to lessonarcade

# Set required environment variables (non-sensitive ones)
export STUDIO_BASIC_AUTH_USER="admin"
export STUDIO_BASIC_AUTH_PASS="secure-password"
export LOGGING_SALT="random-salt-string"

# Set Vertex AI configuration (production mode)
export GCP_PROJECT_ID=$GCP_PROJECT_ID
export GCP_REGION="us-central1"
export GCP_VERTEX_MODEL="gemini-2.0-flash-exp"

# Set API keys (optional - can also use Secret Manager)
export ELEVENLABS_API_KEY="your-elevenlabs-key"
export GEMINI_API_KEY="your-gemini-key"

# Run the deployment script
./scripts/cloud-run/deploy.sh
```

**Script Output:**
The script will output the final hosted URL at the end:
```
=== HOSTED URL FOR DEVPOST SUBMISSION ===
HOSTED_URL=https://lessonarcade-xxxxx.a.run.app
===========================================
```

Use this URL for your Devpost submission.

### Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Set variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export AR_REPO="lessonarcade"
export CLOUD_RUN_SERVICE="lessonarcade"
export IMAGE_TAG="latest"

# Build the Docker image
docker build -t $GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/$AR_REPO/$CLOUD_RUN_SERVICE:$IMAGE_TAG .

# Push to Artifact Registry
docker push $GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/$AR_REPO/$CLOUD_RUN_SERVICE:$IMAGE_TAG

# Deploy to Cloud Run with environment variables
gcloud run deploy $CLOUD_RUN_SERVICE \
    --image=$GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/$AR_REPO/$CLOUD_RUN_SERVICE:$IMAGE_TAG \
    --region=$GCP_REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=20 \
    --set-env-vars=STUDIO_BASIC_AUTH_USER=admin,STUDIO_BASIC_AUTH_PASS=secure-password,LOGGING_SALT=random-salt-string,GCP_PROJECT_ID=$GCP_PROJECT_ID,GCP_REGION=us-central1,GCP_VERTEX_MODEL=gemini-2.0-flash-exp
```

## Smoke Testing

The project includes a smoke test script to verify your deployment:

```bash
# Make the script executable (if not already)
chmod +x scripts/cloud-run/smoke-test.sh

# Get the service URL from deployment or:
SERVICE_URL=$(gcloud run services describe lessonarcade --region=us-central1 --format="value(status.url)")

# Run smoke tests
./scripts/cloud-run/smoke-test.sh $SERVICE_URL

# Or with auth credentials
STUDIO_BASIC_AUTH_USER=admin STUDIO_BASIC_AUTH_PASS=secure-password ./scripts/cloud-run/smoke-test.sh $SERVICE_URL
```

**Smoke Test Coverage:**
- GET /demo (public demo page) - expects 200
- GET /demo/voice/effective-meetings (voice lesson) - expects 200
- GET /demo/voice-chat/effective-meetings (voice chat) - expects 200
- GET /studio (without auth) - expects 401
- GET /studio/voice-analytics (without auth) - expects 401
- GET /studio (with auth, if credentials provided) - expects 200

## Verify the Deployed Service

### Get the Service URL

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe lessonarcade \
    --region=us-central1 \
    --format="value(status.url)")

echo "Service URL: $SERVICE_URL"
```

### Test with curl

```bash
# Test the demo page (should return 200)
curl -I $SERVICE_URL/demo

# Test a specific voice lesson
curl -I $SERVICE_URL/demo/voice/effective-meetings

# Test the Vertex AI API endpoint (GET for config check)
curl $SERVICE_URL/api/ai/gemini

# Test the studio endpoint (should return 401 without auth)
curl -I $SERVICE_URL/studio

# Test with authentication
curl -I -u admin:secure-password $SERVICE_URL/studio
```

### Test with Browser

Open the following URLs in your browser:

- Demo page: `https://YOUR_SERVICE_URL/demo`
- Voice lesson: `https://YOUR_SERVICE_URL/demo/voice/effective-meetings`
- Studio (requires auth): `https://YOUR_SERVICE_URL/studio`
- Vertex AI API (GET): `https://YOUR_SERVICE_URL/api/ai/gemini`

## Port Expectations

Cloud Run automatically injects a `PORT` environment variable into your container. Your application must:

1. **Listen on the port specified by the `PORT` environment variable**
2. **NOT hardcode a specific port**

The project's [`Dockerfile`](../Dockerfile) is already configured correctly:

```dockerfile
# Cloud Run will override with PORT env var
EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME=0.0.0.0
```

Next.js automatically reads the `PORT` environment variable, so no code changes are needed.

## Health Check Configuration

Cloud Run automatically configures a default TCP startup probe with these values:

- `timeoutSeconds: 240`
- `periodSeconds: 240`
- `failureThreshold: 1`

This means Cloud Run will wait up to 240 seconds for your container to start accepting connections on the configured port.

For most Next.js applications, the default TCP probe is sufficient. If you need custom health checks, you can configure them:

```bash
# Example: Configure HTTP startup probe
gcloud run deploy lessonarcade \
    --image=$IMAGE_URL \
    --region=$REGION \
    --startup-probe httpGet.path=/,httpGet.port=8080,initialDelaySeconds=0,failureThreshold=3,timeoutSeconds=1,periodSeconds=10
```

## Common Failures

### Port Issues

**Symptom:** Service fails to start with "Container failed to start" or "Health check failed"

**Cause:** Application is not listening on the correct port.

**Solution:**
- Ensure your application reads the `PORT` environment variable
- Do not hardcode a specific port in your application
- Verify the Dockerfile sets `ENV PORT=8080` (Cloud Run will override this)

**Check logs:**
```bash
gcloud logs tail "projects/$PROJECT_ID/logs/run.googleapis.com%2Fstdout" \
    --limit=50 \
    --filter="resource.labels.service_name=lessonarcade"
```

### Health Check Failures

**Symptom:** Service starts but then crashes repeatedly

**Cause:** Health check probe is failing.

**Solutions:**
1. **Increase timeout for slow-starting applications:**
    ```bash
    gcloud run deploy lessonarcade \
        --image=$IMAGE_URL \
        --region=$REGION \
        --startup-probe tcpSocket.port=8080,initialDelaySeconds=30,failureThreshold=3,timeoutSeconds=10,periodSeconds=10
    ```

2. **Configure HTTP health check endpoint** (if using custom health checks):
    ```bash
    gcloud run deploy lessonarcade \
        --image=$IMAGE_URL \
        --region=$REGION \
        --startup-probe httpGet.path=/health,httpGet.port=8080
    ```

3. **Check application logs for startup errors:**
    ```bash
    gcloud logs tail "projects/$PROJECT_ID/logs/run.googleapis.com%2Fstdout" \
        --limit=100 \
        --filter="resource.labels.service_name=lessonarcade"
    ```

### Missing Environment Variables

**Symptom:** Application starts but fails at runtime with "undefined" or "missing API key" errors

**Cause:** Required environment variables or secrets are not configured.

**Solution:**

1. **List current environment variables:**
    ```bash
    gcloud run services describe lessonarcade \
        --region=$REGION \
        --format="value(spec.template.spec.containers[0].env)"
    ```

2. **Add missing environment variables:**
    ```bash
    gcloud run services update lessonarcade \
        --region=$REGION \
        --update-env-vars=KEY1=VALUE1,KEY2=VALUE2
    ```

3. **Add missing secrets:**
    ```bash
    gcloud run services update lessonarcade \
        --region=$REGION \
        --update-secrets=SECRET_NAME=secret-name:latest
    ```

4. **Verify secret access:**
    ```bash
    # Check if service account has access to secrets
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
    SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    gcloud secrets get-iam-policy SECRET_NAME
    ```

### Vertex AI Permission Errors

**Symptom:** API calls to Vertex AI fail with "Permission denied" or "Access denied" errors

**Cause:** Cloud Run service account does not have the necessary IAM permissions.

**Solution:**

1. **Verify service account has Vertex AI User role:**
    ```bash
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
    SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    gcloud projects get-iam-policy $PROJECT_ID \
        --filter="serviceAccount:$SERVICE_ACCOUNT" \
        --format="table(bindings.role)"
    ```

2. **Grant Vertex AI User role if missing:**
    ```bash
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/aiplatform.user"
    ```

3. **Check Vertex AI API is enabled:**
    ```bash
    gcloud services list --enabled | grep aiplatform
    ```

4. **Enable Vertex AI API if needed:**
    ```bash
    gcloud services enable aiplatform.googleapis.com
    ```

### Build Failures

**Symptom:** Docker build fails during deployment

**Cause:** Issues with dependencies or build configuration.

**Solutions:**

1. **Check Node.js version compatibility** (Next.js 16 requires Node 20.9+):
    ```bash
    node --version
    ```

2. **Verify pnpm-lock.yaml is present:**
    ```bash
    ls -la pnpm-lock.yaml
    ```

3. **Build locally to debug:**
    ```bash
    docker build -t test-build .
    ```

4. **Check build logs:**
    ```bash
    gcloud builds list --limit=10
    gcloud builds log BUILD_ID
    ```

### Permission Errors

**Symptom:** "Permission denied" or "Access denied" errors

**Cause:** Insufficient IAM permissions.

**Solution:**

1. **Verify your IAM roles:**
    ```bash
    gcloud projects get-iam-policy $PROJECT_ID --filter="user:YOUR_EMAIL"
    ```

2. **Grant required roles:**
    ```bash
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="user:YOUR_EMAIL" \
        --role="roles/run.admin"
    ```

## Cleanup

To remove the deployed service and resources:

```bash
# Delete the Cloud Run service
gcloud run services delete lessonarcade --region=$REGION

# Delete the Artifact Registry repository (optional)
gcloud artifacts repositories delete $AR_REPO --location=$REGION

# Delete secrets (if using Secret Manager)
gcloud secrets delete gemini-api-key
gcloud secrets delete elevenlabs-api-key
gcloud secrets delete studio-auth-user
gcloud secrets delete studio-auth-pass
gcloud secrets delete logging-salt
```

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [Next.js on Cloud Run Guide](https://docs.cloud.google.com/run/docs/quickstarts/frameworks/deploy-nextjs-service)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Environment Variables Documentation](https://docs.cloud.google.com/run/docs/configuring/services/environment-variables)
- [Health Checks Documentation](https://docs.cloud.google.com/run/docs/configuring/healthchecks)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
