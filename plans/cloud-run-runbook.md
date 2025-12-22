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
gcloud services enable iamcredentials.googleapis.com
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

### 5. Workload Identity Federation (GitHub Actions) Setup

This one-time setup enables GitHub Actions to authenticate to GCP without storing service account keys:

```bash
# Set your variables
export PROJECT_ID="your-project-id"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Create a service account for GitHub Actions
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions deployments" \
    --display-name="GitHub Actions"

# Grant the service account necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.workloadIdentityUser"

# Create the Workload Identity Pool
gcloud iam workload-identity-pools create github-pool \
    --location="global" \
    --description="GitHub Actions pool"

# Get the pool ID and create the provider
POOL_ID=$(gcloud iam workload-identity-pools describe github-pool \
    --location="global" \
    --format="value(name)")

gcloud iam workload-identity-pools providers create github-provider \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --issuer-url="https://token.actions.githubusercontent.com"

# Get the provider name for GitHub configuration
PROVIDER_NAME=$(gcloud iam workload-identity-pools providers describe github-provider \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --format="value(name)")

# Allow the GitHub repository to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding github-actions@${PROJECT_ID}.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"

echo "Workload Identity Federation setup complete!"
echo "Add these to your GitHub repository secrets:"
echo "GCP_WIF_PROVIDER: ${PROVIDER_NAME}"
echo "GCP_SERVICE_ACCOUNT: github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
echo "GCP_PROJECT_ID: ${PROJECT_ID}"
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

## CI Deploy (GitHub Actions)

The project includes an automated CI/CD pipeline using GitHub Actions that deploys to Cloud Run on every push to the main branch.

### Required GitHub Variables/Secrets

Configure these in your GitHub repository settings under Secrets and variables > Actions:

**Secrets** (encrypted, not visible in logs):
- `GCP_WIF_PROVIDER`: The Workload Identity Provider name from the setup step
- `GCP_SERVICE_ACCOUNT`: The service account email (e.g., `github-actions@your-project.iam.gserviceaccount.com`)
- `GCP_PROJECT_ID`: Your Google Cloud project ID

**Variables** (visible, not secret):
- `GCP_REGION`: Cloud Run region (default: `us-central1`)
- `AR_REPO`: Artifact Registry repository name (default: `lessonarcade`)
- `CLOUD_RUN_SERVICE`: Cloud Run service name (default: `lessonarcade`)

### CI/CD Flow

1. **Quality Gate** (runs on every push to main):
   - Checks out code
   - Sets up Node.js (>=20.9) and pnpm
   - Installs dependencies with frozen lockfile
   - Runs linting, tests, build, and presskit checks

2. **Deploy** (only on successful quality gate):
   - Authenticates to GCP using Workload Identity Federation
   - Builds Docker image with git SHA as tag
   - Pushes image to Artifact Registry
   - Deploys to Cloud Run with existing environment variables

### Important Notes

- **No secrets in logs**: The workflow never prints or logs secret values
- **Environment variables**: All Cloud Run environment variables (STUDIO_BASIC_AUTH_*, LOGGING_SALT, API keys) are assumed to be already configured in the Cloud Run service
- **Manual triggers**: The workflow can also be triggered manually via the GitHub Actions UI

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

5. **GitHub Actions Issues**
   - Verify Workload Identity Federation setup is correct
   - Check that service account has required permissions
   - Ensure GitHub secrets are properly configured

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

# Delete Workload Identity Pool (if no longer needed)
gcloud iam workload-identity-pools delete github-pool --location=global