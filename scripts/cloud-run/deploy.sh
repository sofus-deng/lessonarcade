#!/bin/bash

# Cloud Run Deployment Script for LessonArcade
# This script builds, pushes, and deploys the application to Cloud Run
# Outputs the final hosted URL for Devpost submission

# --- Configuration ---
# Environment variables with sensible defaults
GCP_PROJECT_ID="${GCP_PROJECT_ID:-}"
GCP_REGION="${GCP_REGION:-us-central1}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-lessonarcade}"
AR_REPO="${AR_REPO:-lessonarcade}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# --- Optional Environment Variables ---
# Set these in your environment or modify here
# Required for production
STUDIO_BASIC_AUTH_USER="${STUDIO_BASIC_AUTH_USER:-admin}"
STUDIO_BASIC_AUTH_PASS="${STUDIO_BASIC_AUTH_PASS:-secure-password}"
LOGGING_SALT="${LOGGING_SALT:-$(openssl rand -hex 16)}"

# Optional AI API keys (set in environment to avoid hardcoding)
# ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-}"
# GEMINI_API_KEY="${GEMINI_API_KEY:-}"

# --- Script ---
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate required tools
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        log_error "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        log_error "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check if user is authenticated with gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        log_error "Not authenticated with gcloud. Run 'gcloud auth login' first."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

# Validate configuration
validate_config() {
    log_info "Validating configuration..."
    
    if [ -z "$GCP_PROJECT_ID" ]; then
        log_error "GCP_PROJECT_ID is required. Set it as environment variable:"
        log_error "  export GCP_PROJECT_ID=your-project-id"
        exit 1
    fi
    
    log_info "Configuration validated."
    log_info "Project ID: $GCP_PROJECT_ID"
    log_info "Region: $GCP_REGION"
    log_info "Service Name: $CLOUD_RUN_SERVICE"
    log_info "Repository: $AR_REPO"
    log_info "Image Tag: $IMAGE_TAG"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    IMAGE_NAME="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${CLOUD_RUN_SERVICE}:${IMAGE_TAG}"
    
    docker build -t "${IMAGE_NAME}" .
    
    log_info "Docker image built successfully: ${IMAGE_NAME}"
}

# Push to Artifact Registry
push_image() {
    log_info "Pushing image to Artifact Registry..."
    
    IMAGE_NAME="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${CLOUD_RUN_SERVICE}:${IMAGE_TAG}"
    
    # Push the image
    docker push "${IMAGE_NAME}"
    
    log_info "Image pushed successfully to Artifact Registry."
}

# Deploy to Cloud Run
deploy_service() {
    log_info "Deploying to Cloud Run..."
    
    IMAGE_NAME="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${CLOUD_RUN_SERVICE}:${IMAGE_TAG}"
    
    # Prepare environment variables
    ENV_VARS=(
        "STUDIO_BASIC_AUTH_USER=${STUDIO_BASIC_AUTH_USER}"
        "STUDIO_BASIC_AUTH_PASS=${STUDIO_BASIC_AUTH_PASS}"
        "LOGGING_SALT=${LOGGING_SALT}"
    )
    
    # Add optional API keys if present
    if [ -n "$ELEVENLABS_API_KEY" ]; then
        ENV_VARS+=("ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}")
        log_info "ElevenLabs API key will be set (value hidden)"
    fi
    
    if [ -n "$GEMINI_API_KEY" ]; then
        ENV_VARS+=("GEMINI_API_KEY=${GEMINI_API_KEY}")
        log_info "Gemini API key will be set (value hidden)"
    fi
    
    # Construct the --set-env-vars flag
    ENV_VARS_FLAG=""
    for var in "${ENV_VARS[@]}"; do
        if [ -n "$ENV_VARS_FLAG" ]; then
            ENV_VARS_FLAG="${ENV_VARS_FLAG},"
        fi
        ENV_VARS_FLAG="${ENV_VARS_FLAG}${var}"
    done
    
    # Deploy to Cloud Run
    gcloud run deploy "${CLOUD_RUN_SERVICE}" \
        --image="${IMAGE_NAME}" \
        --region="${GCP_REGION}" \
        --platform=managed \
        --allow-unauthenticated \
        --set-env-vars="${ENV_VARS_FLAG}" \
        --memory=1Gi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=10 \
        --concurrency=20
    
    log_info "Deployment completed successfully!"
}

# Get service URL and output for Devpost submission
get_service_url() {
    log_info "Retrieving service URL..."
    
    SERVICE_URL=$(gcloud run services describe "${CLOUD_RUN_SERVICE}" \
        --region="${GCP_REGION}" \
        --format="value(status.url)")
    
    log_info "Service is available at: ${SERVICE_URL}"
    log_info "Demo page: ${SERVICE_URL}/demo"
    log_info "Studio (requires auth): ${SERVICE_URL}/studio"
    
    # Output the hosted URL for Devpost submission (single line, easy to parse)
    echo ""
    echo "=== HOSTED URL FOR DEVPOST SUBMISSION ==="
    echo "HOSTED_URL=${SERVICE_URL}"
    echo "==========================================="
}

# Main execution
main() {
    log_info "Starting Cloud Run deployment for LessonArcade..."
    
    check_prerequisites
    validate_config
    build_image
    push_image
    deploy_service
    get_service_url
    
    log_info "Deployment completed successfully!"
    log_info "Use the HOSTED_URL above for your Devpost submission."
}

# Run the main function
main "$@"
