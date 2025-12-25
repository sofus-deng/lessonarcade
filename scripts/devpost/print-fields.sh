#!/bin/bash

# Devpost Fields Printer for LessonArcade
# Prints Devpost submission fields in a stable format for easy copy-paste

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docs/devpost-draft.md exists
if [ ! -f "docs/devpost-draft.md" ]; then
    echo -e "${RED}[ERROR]${NC} docs/devpost-draft.md not found."
    exit 1
fi

# Extract PROJECT_NAME from docs/devpost-draft.md
PROJECT_NAME=$(grep "^- \*\*PROJECT_NAME\*\* =" docs/devpost-draft.md | sed 's/.*= //' | tr -d '\r')

# Extract ONE_LINE_PITCH from docs/devpost-draft.md
ONE_LINE_PITCH=$(grep "^- \*\*ONE_LINE_PITCH\*\* =" docs/devpost-draft.md | sed 's/.*= //' | tr -d '\r')

# Get HOSTED_URL from .hosted_url file
if [ ! -f ".hosted_url" ]; then
    echo -e "${RED}[ERROR]${NC} .hosted_url file not found."
    echo ""
    echo "To create this file, run the deployment script:"
    echo -e "  ${GREEN}./scripts/cloud-run/deploy.sh${NC}"
    echo ""
    echo "Or use the existing helper:"
    echo -e "  ${GREEN}pnpm hosted:url${NC}"
    echo ""
    echo "This will print the Cloud Run URL. To save it to .hosted_url, run:"
    echo -e "  ${GREEN}pnpm hosted:url > .hosted_url${NC}"
    exit 1
fi

# Read and validate HOSTED_URL
HOSTED_URL=$(cat .hosted_url | tr -d '\r\n')

# Check if file is empty
if [ -z "$HOSTED_URL" ]; then
    echo -e "${RED}[ERROR]${NC} .hosted_url file is empty."
    echo ""
    echo "Run the deployment script to generate a new URL:"
    echo -e "  ${GREEN}./scripts/cloud-run/deploy.sh${NC}"
    exit 1
fi

# Get REPO_URL from git remote origin
REPO_URL=$(git remote get-url origin 2>/dev/null | tr -d '\r')

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}[ERROR]${NC} No git remote origin found."
    echo ""
    echo "Make sure you have a git remote set up:"
    echo -e "  ${GREEN}git remote add origin https://github.com/your-username/lessonarcade.git${NC}"
    exit 1
fi

# Normalize to HTTPS URL if SSH
REPO_URL=$(echo "$REPO_URL" | sed 's|git@github.com:|https://github.com/|' | sed 's|\.git$||')

# Get DEMO_VIDEO_URL from docs/devpost-draft.md
DEMO_VIDEO_URL=$(grep "^- \*\*DEMO_VIDEO_URL\*\* =" docs/devpost-draft.md | sed 's/.*= //' | tr -d '\r')

# Check if DEMO_VIDEO_URL is still a placeholder
if [[ "$DEMO_VIDEO_URL" == *"["* ]] || [[ "$DEMO_VIDEO_URL" == *"placeholder"* ]]; then
    echo -e "${YELLOW}[INFO]${NC} DEMO_VIDEO_URL is still a placeholder."
    echo ""
    echo "After uploading your demo video to YouTube or Vimeo:"
    echo "1. Update docs/devpost-draft.md with your video URL"
    echo "2. Run ${GREEN}pnpm devpost:fields${NC} again to verify"
    echo ""
fi

# Print fields in stable format
echo "PROJECT_NAME=$PROJECT_NAME"
echo "ONE_LINE_PITCH=$ONE_LINE_PITCH"
echo "HOSTED_URL=$HOSTED_URL"
echo "REPO_URL=$REPO_URL"
echo "DEMO_VIDEO_URL=$DEMO_VIDEO_URL"
