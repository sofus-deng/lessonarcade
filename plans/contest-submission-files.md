# Contest Submission Files Plan

## Files to Create

### 1. LICENSE (Apache-2.0)

**Location**: Root directory

**Purpose**: Open source license required by Devpost for contest submission. The license must be visible at the top of the repository page.

**Content**: Standard Apache-2.0 license with copyright notice.

```apache
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   [... full Apache-2.0 license text ...]

   END OF TERMS AND CONDITIONS

   Copyright 2025 LessonArcade Contributors

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### 2. artifacts/progress.html

**Location**: `artifacts/progress.html`

**Purpose**: Visual progress tracker for work items (la1-p0-01, la1-p0-02, la1-p0-03, la3-p0-02, la3-p0-03, la3-p0-04).

**Features**:
- Dark theme matching project aesthetic
- Statistics dashboard (total, completed, in progress, pending)
- Work item cards with status badges
- JavaScript for updating stats based on data-status attributes
- Responsive design

**Work Items**:
| ID | Title | Description |
|----|-------|-------------|
| LA1-P0-01 | Submission Requirements Extraction | Extract and document MUST-HAVES from Devpost challenge pages |
| LA1-P0-02 | CI/CD Workflow Fixes | Fix PLAYWRIGHT_WEB_SERVER_CMD and add Playwright browser caching |
| LA1-P0-03 | VPS Deploy Workflow Handling | Convert deploy.yml to workflow_dispatch only or remove |
| LA3-P0-02 | LICENSE File Creation | Add Apache-2.0 license file to root of repository |
| LA3-P0-03 | README.md Rewrite | Create judge-friendly README with pitch, tech stack, setup, and deployment info |
| LA3-P0-04 | Submission Documentation | Create docs/submission.md with Devpost write-up sections and pre-submit checklist |

## Files Already Created

### 1. docs/submission.md

**Location**: `docs/submission.md`

**Purpose**: Comprehensive submission requirements and Devpost write-up draft.

**Contents**:
- MUST-HAVES checklist from Devpost
- Devpost write-up sections:
  - Problem statement
  - Solution description
  - How it uses Google Cloud + partner tech
  - Architecture overview
  - What's next
- Pre-submit checklist

### 2. README.md

**Location**: `README.md`

**Purpose**: Judge-friendly README for contest submission.

**Contents**:
- One-line pitch
- What the app does (voice-first angle)
- Tech stack (Google Cloud Run + Gemini + ElevenLabs)
- Local dev setup with env vars
- How to run tests (lint/typecheck/vitest/playwright)
- Deployment overview (Cloud Run + secrets)
- Privacy/data handling note
- Architecture diagram

### 3. plans/ci-cd-contest-fixes.md

**Location**: `plans/ci-cd-contest-fixes.md`

**Purpose**: Detailed plan for CI/CD workflow fixes.

**Contents**:
- Fix for PLAYWRIGHT_WEB_SERVER_CMD
- Playwright browser caching implementation
- VPS deploy workflow handling

## Implementation Order

1. Create LICENSE file (Apache-2.0)
2. Create artifacts/progress.html
3. Update .github/workflows/ci.yml (fixes documented in ci-cd-contest-fixes.md)
4. Update .github/workflows/deploy.yml (fixes documented in ci-cd-contest-fixes.md)
5. Run tests to verify all changes
6. Commit and push to main

## Verification Checklist

After implementation:

- [ ] LICENSE file exists in root directory
- [ ] LICENSE is Apache-2.0
- [ ] README.md is updated with judge-friendly content
- [ ] docs/submission.md exists with all sections
- [ ] artifacts/progress.html exists and displays correctly
- [ ] .github/workflows/ci.yml has correct PLAYWRIGHT_WEB_SERVER_CMD
- [ ] .github/workflows/ci.yml has Playwright browser caching
- [ ] .github/workflows/deploy.yml is workflow_dispatch only
- [ ] pnpm lint passes
- [ ] pnpm typecheck passes
- [ ] CI=1 pnpm test passes
- [ ] pnpm test:e2e passes
- [ ] All changes committed to main
