# Cloud Run Deployment Runbook

This runbook provides step-by-step instructions for deploying LessonArcade to Google Cloud Run.

## Prerequisites

Before you begin, ensure you have:

1. Google Cloud SDK (gcloud) installed
2. Docker installed and running
3. A Google Cloud project with billing enabled
4. Appropriate permissions to create Cloud Run services and Artifact Registry repositories

## One-Time Setup

### 1. Set Up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Create Artifact Registry Repository

```bash
# Create a Docker repository in Artifact Registry
export REGION="us-central1"
export AR_REPO="lessonarcade"

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

### 4. Set Up Authentication for Deployment

```bash
# Authenticate with gcloud (if not already done)
gcloud auth login

# For automated deployments, set up service account authentication
gcloud auth application-default login
```

## Deployment Process

### 1. Configure Environment Variables

Create a copy of the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```bash
# Required for production
STUDIO_BASIC_AUTH_USER="admin"
STUDIO_BASIC_AUTH_PASS="secure-password"
LOGGING_SALT="random-salt-string"

# Optional (for full functionality)
ELEVENLABS_API_KEY="your-elevenlabs-key"
GEMINI_API_KEY="your-gemini-key"
```

### 2. Run the Deployment Script

The deployment script automates the entire process:

```bash
# Make the script executable (if not already done)
chmod +x scripts/cloud-run/deploy.sh

# Run the deployment
# Option 1: Edit the script variables directly
./scripts/cloud-run/deploy.sh

# Option 2: Set environment variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export SERVICE_NAME="lessonarcade"
export AR_REPO="lessonarcade"
export IMAGE_TAG="latest"

# Set required environment variables
export STUDIO_BASIC_AUTH_USER="admin"
export STUDIO_BASIC_AUTH_PASS="secure-password"
export LOGGING_SALT="random-salt-string"

# Set optional API keys
export ELEVENLABS_API_KEY="your-elevenlabs-key"
export GEMINI_API_KEY="your-gemini-key"

# Run the script
./scripts/cloud-run/deploy.sh
```

### 3. Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Build the Docker image
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/lessonarcade:latest .

# Push to Artifact Registry
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/lessonarcade:latest

# Deploy to Cloud Run
gcloud run deploy lessonarcade \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/lessonarcade:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=20 \
    --set-env-vars STUDIO_BASIC_AUTH_USER=admin \
    --set-env-vars STUDIO_BASIC_AUTH_PASS=secure-password \
    --set-env-vars LOGGING_SALT=random-salt-string
```

## Setting Environment Variables Safely

### Option 1: Using Secret Manager (Recommended for Production)

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
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding studio-auth-user \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding studio-auth-pass \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding logging-salt \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Deploy with secrets
gcloud run deploy lessonarcade \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/lessonarcade:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-secrets STUDIO_BASIC_AUTH_USER=studio-auth-user:latest \
    --set-secrets STUDIO_BASIC_AUTH_PASS=studio-auth-pass:latest \
    --set-secrets LOGGING_SALT=logging-salt:latest
```

### Option 2: Using gcloud run services update

```bash
# Update environment variables for an existing service
gcloud run services update lessonarcade \
    --region=$REGION \
    --set-env-vars STUDIO_BASIC_AUTH_USER=admin,STUDIO_BASIC_AUTH_PASS=secure-password,LOGGING_SALT=random-salt-string
```

### Option 3: Using Google Cloud Console

1. Go to Cloud Run in the Google Cloud Console
2. Select your service
3. Click on the "DEPLOYMENTS" tab
4. Click "Edit & Deploy New Revision"
5. Scroll to the "Variables and Secrets" section
6. Add or update environment variables

## Post-Deployment Checks

After deployment, verify the service is working correctly:

### 1. Check Service Status

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe lessonarcade \
    --region=$REGION \
    --format="value(status.url)")

echo "Service URL: $SERVICE_URL"
```

### 2. Test Public Endpoints

```bash
# Test the demo page (should work without authentication)
curl -I $SERVICE_URL/demo

# Test a specific voice lesson
curl -I $SERVICE_URL/demo/voice/effective-meetings
```

### 3. Test Protected Endpoint

```bash
# Test the studio endpoint (should return 401 without auth)
curl -I $SERVICE_URL/studio

# Test with authentication
curl -I -u admin:secure-password $SERVICE_URL/studio
```

### 4. Check Logs

```bash
# View recent logs
gcloud logs tail "projects/$PROJECT_ID/logs/run.googleapis.com%2Fstdout" \
    --limit=50 \
    --filter="resource.labels.service_name=lessonarcade"
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify STUDIO_BASIC_AUTH_USER and STUDIO_BASIC_AUTH_PASS are set correctly
   - Check browser doesn't have cached credentials

2. **Build Failures**
   - Ensure pnpm-lock.yaml is present
   - Check Node.js version compatibility (20.9+)

3. **Deployment Failures**
   - Verify Artifact Registry repository exists
   - Check Docker authentication with Artifact Registry
   - Ensure you have the necessary IAM permissions

4. **Runtime Errors**
   - Check Cloud Run logs for errors
   - Verify all required environment variables are set
   - Ensure the application is listening on the PORT provided by Cloud Run

### Getting Help

1. Check the [Cloud Run documentation](https://cloud.google.com/run/docs)
2. Review the [troubleshooting guide](https://cloud.google.com/run/docs/troubleshooting)
3. Examine the application logs in Cloud Logging

## Cleanup

To remove the deployed service and resources:

```bash
# Delete the Cloud Run service
gcloud run services delete lessonarcade --region=$REGION

# Delete the Artifact Registry repository (optional)
gcloud artifacts repositories delete $AR_REPO --location=$REGION

# Delete secrets (if using Secret Manager)
gcloud secrets delete studio-auth-user
gcloud secrets delete studio-auth-pass
gcloud secrets delete logging-salt