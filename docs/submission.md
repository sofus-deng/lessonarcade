# AI Partner Catalyst Hackathon - Submission Requirements

## Devpost Submission Checklist

This checklist ensures the repository is strictly contest-compliant per Devpost rules.

### Hosted Project URL
- [ ] **Public URL to deployed application** for judging and testing
  - Must be accessible to judges without authentication barriers
  - Recommended: Google Cloud Run deployment
  - URL format: `https://[project-name]-[hash].a.run.app`
  - **Quick retrieval**: After deploying with `./scripts/cloud-run/deploy.sh`, use `pnpm hosted:url` to get the URL anytime without committing it to git

### Public Open Source Repository
- [ ] **Public GitHub repository** with visible license
  - Repository must be publicly accessible
  - LICENSE file included at repository root (Apache-2.0)
  - License must be visible on repository landing page
  - Repository contains all necessary source code, assets, and instructions
  - Repository is functional and can be successfully installed and run

### Demo Video Requirements
- [ ] **Public YouTube or Vimeo link** (<= 3 minutes)
  - Video uploaded to YouTube or Vimeo
  - Made publicly visible (no private/unlisted restrictions)
  - Duration: approximately 3 minutes or less
  - Content requirements:
    - [ ] Overview of what the project does
    - [ ] Explanation of how the project solves a problem
    - [ ] Footage showing the project functioning on the target platform
    - [ ] No third-party trademarks or copyrighted music (unless permission granted)

### English Requirement
- [ ] **All submission materials in English**
  - Text description in English
  - Demo video in English OR includes English subtitles
  - Testing instructions in English
  - If non-English content is present, provide English translations

### AI Usage Limitation
- [ ] **Only allowed Google Cloud AI tools at runtime**
  - Google Gemini API (via Google AI Studio or Vertex AI)
  - ElevenLabs API (partner integration for voice synthesis)
  - **No other AI APIs are used by the product at runtime**
  - Development tools (e.g., AI coding assistants) may be used during development but must not be part of the deployed application

---

## Challenge-Specific Requirements

### Challenge Selection
- [ ] **ElevenLabs Challenge** selected (LessonArcade uses ElevenLabs + Google Cloud AI)

### Project Requirements
- [ ] Project addresses the ElevenLabs Challenge: "Use ElevenLabs and Google Cloud AI to make your app conversational, intelligent, and voice-driven"
- [ ] Solution integrates both Google Cloud products (Gemini) AND ElevenLabs products
- [ ] Project is newly created during contest period (Nov 17 - Dec 31, 2025)
- [ ] Project runs on web platform (Next.js web application)

### Technology Constraints
- [ ] Uses Google Cloud AI tools (Gemini models via Vertex AI or API)
- [ ] Uses ElevenLabs products (API for voice synthesis)
- [ ] No other AI tools permitted (only Google Cloud + Partner's built-in AI features)
- [ ] No use of services that directly compete with Google Cloud for cloud platform capabilities

### Content Restrictions
- [ ] No derogatory, offensive, threatening, defamatory, or discriminatory content
- [ ] No unlawful content or content violating applicable laws
- [ ] No third-party advertising, slogans, logos indicating sponsorship
- [ ] Original work - no third-party intellectual property violations
- [ ] No content violating third-party publicity, privacy, or IP rights

### Eligibility
- [ ] Team members are above age of majority in their jurisdiction
- [ ] Not a resident of ineligible countries (Italy, Brazil, Quebec, Crimea, Cuba, Iran, Syria, North Korea, Sudan, Belarus, Russia, Ukraine regions, Afghanistan, Antarctica, China, Djibouti, Iraq, Kazakhstan, Somalia, Venezuela, Vietnam, Western Sahara)
- [ ] Not on OFAC's SDN list or Department of Commerce denied lists
- [ ] Not an employee/contractor of Google, Partners, Devpost, or their affiliates

---

## Devpost Write-Up

**The canonical Devpost write-up content is located in [`docs/devpost-draft.md`](devpost-draft.md).**

Copy the content from that file directly to Devpost for your submission. It includes all required sections:
- Problem
- Solution / What it does
- How we built it
- Architecture overview
- Challenges
- Accomplishments
- What we learned
- What's next

Remember to fill in the placeholders at the top of [`docs/devpost-draft.md`](devpost-draft.md):
- `PROJECT_NAME`
- `ONE_LINE_PITCH`
- `HOSTED_URL` (Cloud Run URL for judging - use `pnpm hosted:url` after deployment)
- `REPO_URL`
- `DEMO_VIDEO_URL`

---

## Pre-Submit Checklist

### Code & Repository
- [ ] LICENSE file added (Apache-2.0)
- [ ] README.md updated with judge-friendly content
- [ ] All source code committed to repository
- [ ] Repository is public and accessible
- [ ] No sensitive data (API keys, secrets) in repository
- [ ] Playwright artifacts (.gitignore updated) not committed

### Testing
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm typecheck` passes with no errors
- [ ] `CI=1 pnpm test` passes all unit tests
- [ ] `pnpm test:e2e` passes all Playwright tests
- [ ] Playwright webServer starts reliably on port 3100

### CI/CD
- [ ] `.github/workflows/ci.yml` fixed with correct PLAYWRIGHT_WEB_SERVER_CMD
- [ ] Playwright browser caching added to CI workflow
- [ ] `.github/workflows/deploy.yml` changed to workflow_dispatch only
- [ ] CI pipeline runs successfully on push to main

### Documentation
- [ ] docs/submission.md created with all sections
- [ ] docs/devpost-draft.md created with Devpost write-up
- [ ] Progress tracking HTML file added for work items
- [ ] Local dev setup instructions complete
- [ ] Deployment instructions for Cloud Run included
- [ ] Privacy/data handling note included

### Devpost Submission
- [ ] Hosted project URL (Cloud Run) tested and accessible
  - **Quick retrieval**: Use `pnpm hosted:url` after deployment to get the URL without committing it
- [ ] Demo video uploaded to YouTube/Vimeo and made public
- [ ] Video is 3 minutes or less
- [ ] Video shows project functioning
- [ ] Video is in English or has English subtitles
- [ ] Text description completed with all required sections
- [ ] Challenge selected: ElevenLabs Challenge

---

*Last updated: December 2025*
