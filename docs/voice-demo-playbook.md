# Voice Demo Deployment Playbook

This playbook provides step-by-step instructions for deploying the LessonArcade Voice Demo to Google Cloud Run and recording the stable public URL for sharing with reviewers, demo participants, or internal stakeholders.

## Prerequisites

Before deploying the Voice Demo, ensure you have:

- **Node.js 20+** installed locally
- **pnpm** package manager installed (recommended) or npm/yarn
- **A Google Cloud project** with Cloud Run enabled
- **gcloud CLI** installed and authenticated
- **Docker** installed and running

### Google Cloud Setup

If you haven't already set up your Google Cloud project:

```bash
# Install gcloud CLI (macOS)
brew install google-cloud-sdk

# Initialize gcloud
gcloud init

# Authenticate
gcloud auth login

# Enable required APIs (one-time setup)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com aiplatform.googleapis.com

# Grant Vertex AI permissions to Cloud Run service account (one-time setup)
PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.user"
```

## Local Sanity Check

Before deploying, verify that the application builds correctly and all tests pass.

### Install Dependencies

```bash
pnpm install
```

### Run Quality Checks

```bash
# Lint the code
pnpm lint

# Run unit tests
pnpm test

# Run end-to-end tests in CI mode
pnpm test:e2e:ci

# Run smoke tests
pnpm test:smoke
```

All commands should complete successfully before proceeding to deployment.

### Run Locally for Manual Inspection

```bash
# Start the development server
pnpm dev

# Or build and run the production build locally
pnpm build
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to manually inspect the application.

## Build and Deploy to Cloud Run

The project provides deployment scripts under `scripts/cloud-run/` that automate the entire process.

### Set Environment Variables

```bash
# Required: Set your Google Cloud project ID
export GCP_PROJECT_ID="your-project-id"

# Optional: Override defaults (these are already set in deploy.sh)
export GCP_REGION="us-central1"
export CLOUD_RUN_SERVICE="lessonarcade"
export AR_REPO="lessonarcade"
```

### Deploy Using the Deployment Script

The deployment script performs the following steps:
1. Validates prerequisites (gcloud, Docker, authentication)
2. Builds the Docker image
3. Pushes the image to Artifact Registry
4. Deploys to Cloud Run
5. Retrieves and outputs the hosted URL

```bash
# Run the deployment script
./scripts/cloud-run/deploy.sh
```

The script will output the final hosted URL:

```
=== HOSTED URL FOR DEVPOST SUBMISSION ===
HOSTED_URL=https://lessonarcade-xxxxx.a.run.app
=========================================

Quick retrieval: pnpm hosted:url
```

### Run Smoke Tests After Deployment

Once deployment completes, verify that the service is responding correctly:

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe lessonarcade --region=us-central1 --format="value(status.url)")

# Run smoke tests
./scripts/cloud-run/smoke-test.sh $SERVICE_URL
```

The smoke test script verifies:
- `/demo` returns 200 (public demo page)
- `/demo/voice/effective-meetings` returns 200 (voice lesson)
- `/demo/voice-chat/effective-meetings` returns 200 (voice chat)
- `/studio` returns 401 without authentication
- `/studio/voice-analytics` returns 401 without authentication

### Quick URL Retrieval

After deployment, you can quickly retrieve the hosted URL anytime:

```bash
# Using the helper script
./scripts/cloud-run/hosted-url.sh

# Or using the npm script
pnpm hosted:url
```

## Voice Demo Entry Points

The LessonArcade Voice Demo provides two primary flows for experiencing voice-enabled lessons:

### Linear Voice Walkthrough

**Route:** `/demo/voice/effective-meetings`

This route demonstrates a linear, lesson-style voice walkthrough where:
- The lesson content is narrated using AI text-to-speech (ElevenLabs)
- Users can pause, resume, and stop narration at any point
- Step-by-step checks for understanding are presented as the lesson progresses
- Telemetry is captured for every playback and interaction

### Conversational Voice Chat

**Route:** `/demo/voice-chat/effective-meetings`

This route demonstrates a chat-style, conversational flow built on the same lesson data:
- Users interact with the lesson content through guided voice prompts
- The conversation flow adapts based on user responses
- Built on the same underlying lesson JSON data as the linear walkthrough
- Provides a more interactive, dialogue-based learning experience

Both routes use the same lesson data from `data/demo-lessons/effective-meetings.json`, showcasing how the Voice Demo can transform any JSON lesson into different interactive experiences.

## Recording the Final Public URL

After successful deployment, Cloud Run will provide a service URL (e.g., `https://lessonarcade-xxxxx.a.run.app`). This URL should be recorded using the stable URL metadata convention.

### Using the voice-demo-url Convention

The repository provides a template file `voice-demo-url.example` at the root. To record your deployed Voice Demo URL:

1. **Copy the template:**
   ```bash
   cp voice-demo-url.example voice-demo-url.txt
   ```

2. **Edit the file and replace the placeholder:**
   ```
   # This file documents the stable public URL for the LessonArcade Voice Demo.
   # Copy this file to voice-demo-url.txt (ignored by Git) and replace the placeholder URL with your actual deployed Voice Demo URL.
   https://YOUR-VOICE-DEMO-URL.example.com
   ```
   
   Replace `https://YOUR-VOICE-DEMO-URL.example.com` with your actual deployed URL, e.g.:
   ```
   https://lessonarcade-abc123.a.run.app
   ```

3. **Share the URL:**
   - The `voice-demo-url.txt` file is ignored by Git (see `.gitignore`)
   - In private forks or internal deployments, teams can use this file to share the URL
   - The repository never commits the real URL, only the `.example` template

### Important Notes

- **The application does not depend on `voice-demo-url.txt` at runtime.** This file is purely for human convenience (reviewers, demo participants, internal stakeholders).
- **Do not commit the real URL to the repository.** Only the `voice-demo-url.example` template is tracked by Git.
- **The deployment script also writes the URL to `.hosted_url`** (also gitignored) for quick retrieval via `pnpm hosted:url`.

## Troubleshooting

### Deployment Fails

If the deployment script fails, check:

1. **Prerequisites:**
   ```bash
   # Verify gcloud is authenticated
   gcloud auth list
   
   # Verify Docker is running
   docker ps
   ```

2. **Configuration:**
   ```bash
   # Verify GCP_PROJECT_ID is set
   echo $GCP_PROJECT_ID
   ```

3. **Logs:**
   ```bash
   # View Cloud Run logs
   gcloud logs tail "projects/$GCP_PROJECT_ID/logs/run.googleapis.com%2Fstdout" \
       --limit=50 \
       --filter="resource.labels.service_name=lessonarcade"
   ```

### Smoke Tests Fail

If smoke tests fail after deployment:

1. **Verify the service is deployed:**
   ```bash
   gcloud run services describe lessonarcade --region=us-central1
   ```

2. **Check the service URL is correct:**
   ```bash
   SERVICE_URL=$(gcloud run services describe lessonarcade --region=us-central1 --format="value(status.url)")
   echo $SERVICE_URL
   ```

3. **Test manually with curl:**
   ```bash
   curl -I $SERVICE_URL/demo/voice/effective-meetings
   ```

For more detailed troubleshooting, see [`docs/deploy-cloud-run.md`](docs/deploy-cloud-run.md).

## Additional Resources

- **Cloud Run Deployment Runbook:** [`docs/deploy-cloud-run.md`](docs/deploy-cloud-run.md)
- **Deployment Script:** [`scripts/cloud-run/deploy.sh`](../scripts/cloud-run/deploy.md)
- **Smoke Test Script:** [`scripts/cloud-run/smoke-test.sh`](../scripts/cloud-run/smoke-test.sh)
- **URL Helper Script:** [`scripts/cloud-run/hosted-url.sh`](../scripts/cloud-run/hosted-url.sh)
