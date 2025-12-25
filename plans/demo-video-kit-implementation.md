# Demo Video Kit Implementation Plan (LA1-P0-07)

## Overview
Create a demo-video kit that makes recording repeatable and low-friction, without requiring ad-hoc manual steps. This includes documentation, helper scripts, and workflow improvements for Devpost submission.

## Implementation Steps

### 1. Create docs/demo-video.md

Create a comprehensive demo video guide with:

**Shot-by-shot sequence with timestamps:**
- **0:00-0:20**: Introduction and problem statement
- **0:20-1:20**: Solution overview and key features
- **1:20-2:30**: Live demonstration of the application
- **2:30-3:00**: Conclusion and call-to-action

**For each segment include:**
1. Exact timestamp range
2. Spoken lines (or subtitle text)
3. Exact on-screen actions to take in the app
4. Visual elements to highlight

**No-mic fallback flow:**
- Alternative demonstration path that shows ElevenLabs Agents page without requesting microphone permissions
- Focus on showing the UI, conversation component, and status indicators

**Final checklist:**
- Upload video to YouTube/Vimeo
- Update DEMO_VIDEO_URL placeholder in docs/devpost-draft.md
- Verify video is publicly accessible
- Confirm video is <= 3 minutes

### 2. Create scripts/devpost/print-fields.sh

Create a bash script that prints Devpost submission fields in stable format:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Extract PROJECT_NAME and ONE_LINE_PITCH from docs/devpost-draft.md
PROJECT_NAME=$(grep "PROJECT_NAME" docs/devpost-draft.md | sed 's/.*= //')
ONE_LINE_PITCH=$(grep "ONE_LINE_PITCH" docs/devpost-draft.md | sed 's/.*= //')

# Get HOSTED_URL from .hosted_url file
if [ ! -f ".hosted_url" ]; then
    echo -e "${RED}[ERROR]${NC} .hosted_url file not found. Run 'pnpm hosted:url' after deployment."
    HOSTED_URL="[ERROR: Run 'pnpm hosted:url' after deployment]"
else
    HOSTED_URL=$(cat .hosted_url)
fi

# Get REPO_URL from git remote origin
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "[ERROR: No git remote origin found]")

# Normalize to HTTPS URL if SSH
REPO_URL=$(echo "$REPO_URL" | sed 's|git@github.com:|https://github.com/|' | sed 's|\.git$||')

# Get DEMO_VIDEO_URL from docs/devpost-draft.md
DEMO_VIDEO_URL=$(grep "DEMO_VIDEO_URL" docs/devpost-draft.md | sed 's/.*= //')

# Print fields in stable format
echo "PROJECT_NAME=$PROJECT_NAME"
echo "ONE_LINE_PITCH=$ONE_LINE_PITCH"
echo "HOSTED_URL=$HOSTED_URL"
echo "REPO_URL=$REPO_URL"
echo "DEMO_VIDEO_URL=$DEMO_VIDEO_URL"
```

### 3. Add pnpm script "devpost:fields" to package.json

Add to the scripts section in package.json:
```json
"devpost:fields": "bash scripts/devpost/print-fields.sh"
```

### 4. Update docs/submission.md

Update the section that references Devpost field retrieval to include:
```markdown
### Quick Devpost Field Retrieval

The fastest way to copy Devpost submission fields is to run:
```bash
pnpm devpost:fields
```

This prints all required fields in a stable format:
- PROJECT_NAME
- ONE_LINE_PITCH
- HOSTED_URL (from .hosted_url file)
- REPO_URL (from git remote origin)
- DEMO_VIDEO_URL (from docs/devpost-draft.md)
```

### 5. Update artifacts/progress.html for la1-p0-07

Add a new work item card for la1-p0-07 with:
- ID: LA1-P0-07
- Title: Demo Video Kit
- Description: Create demo-video kit with docs/demo-video.md, helper scripts, and Devpost field automation
- Status: In Progress
- Notes: Final manual step is to upload video and paste link into docs/devpost-draft.md

### 6. Run All Checks

Execute the following commands to verify the implementation:
```bash
pnpm lint
pnpm typecheck
pnpm audit:english
CI=1 pnpm test
pnpm test:e2e
```

### 7. Commit and Push to Main

If all checks pass:
- Use conventional commit message: `feat(la1-p0-07): add demo-video kit with automation scripts`
- Commit and push directly to main (no PR required)

## Key Requirements

- All content must be English-only (pnpm audit:english must pass)
- No product behavior changes beyond adding documentation and helper scripts
- Demo video script must be copy-paste ready for <= 3 minute video
- No-mic fallback flow must demonstrate ElevenLabs Agents page without microphone permissions
- Helper scripts must handle missing .hosted_url gracefully with clear error messages

## Testing Checklist

- [ ] docs/demo-video.md exists and contains all required sections
- [ ] scripts/devpost/print-fields.sh is executable and works correctly
- [ ] pnpm devpost:fields runs successfully
- [ ] docs/submission.md updated with reference to pnpm devpost:fields
- [ ] artifacts/progress.html updated with la1-p0-07 work item
- [ ] pnpm lint passes
- [ ] pnpm typecheck passes
- [ ] pnpm audit:english passes
- [ ] CI=1 pnpm test passes
- [ ] pnpm test:e2e passes
- [ ] Changes committed and pushed to main

## Files to Create/Modify

**Create:**
- docs/demo-video.md
- scripts/devpost/print-fields.sh

**Modify:**
- package.json (add devpost:fields script)
- docs/submission.md (add quick field retrieval section)
- artifacts/progress.html (add la1-p0-07 work item)
