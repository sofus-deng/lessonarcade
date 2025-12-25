#!/bin/bash

# Hosted URL Helper Script for LessonArcade
# Prints the Cloud Run URL from .hosted_url file for quick Devpost submission

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .hosted_url file exists
if [ ! -f ".hosted_url" ]; then
    echo -e "${RED}[ERROR]${NC} .hosted_url file not found."
    echo ""
    echo "To create this file, run the deployment script:"
    echo -e "  ${GREEN}./scripts/cloud-run/deploy.sh${NC}"
    echo ""
    echo "This will deploy to Cloud Run and save the URL to .hosted_url."
    exit 1
fi

# Read and print the URL
HOSTED_URL=$(cat .hosted_url)

# Check if file is empty
if [ -z "$HOSTED_URL" ]; then
    echo -e "${RED}[ERROR]${NC} .hosted_url file is empty."
    echo ""
    echo "Run the deployment script to generate a new URL:"
    echo -e "  ${GREEN}./scripts/cloud-run/deploy.sh${NC}"
    exit 1
fi

# Output the URL
echo "$HOSTED_URL"
