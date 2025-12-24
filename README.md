# LessonArcade

**AI-Powered Voice Lessons for Modern Education** — Transform traditional lessons into interactive, voice-enabled learning experiences with natural AI narration.

## What It Does

LessonArcade is a voice-first educational platform that delivers engaging, accessible lessons through AI-powered voice narration. Users can browse interactive lessons, listen to natural-sounding narration powered by ElevenLabs, and control playback with pause, resume, and stop functionality. The platform features bilingual support (English and Chinese), advanced guardrails to prevent abuse, and comprehensive analytics for tracking learner engagement.

### Key Features

- **Natural AI Voice Narration** — High-quality text-to-speech using ElevenLabs API with customizable voice presets
- **Interactive Controls** — Pause, resume, and stop narration at any point
- **Bilingual Support** — Full English and Chinese language support with automatic detection
- **Advanced Guardrails** — Acknowledgment system, cooldown periods, and multi-tier rate limiting
- **Voice Analytics** — Real-time telemetry tracking completion rates, replay patterns, and interruption points
- **Privacy-First Design** — All telemetry uses hashed IP addresses with no personal data collection

## Technology Stack

### Core Framework
- **Next.js 16** — React framework with App Router for server-side rendering
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling

### Google Cloud Hosting & Services
- **Google Cloud Run** — Serverless deployment with automatic scaling
- **Gemini AI** — Content generation and lesson enhancement
- **Google Artifact Registry** — Container image storage
- **Google Cloud Secrets Manager** — Secure API key management

### Partner Technology
- **ElevenLabs** — Industry-leading AI voice synthesis for natural narration
- **ElevenLabs API** — Multi-language text-to-speech with customizable voice presets

### Testing & Quality
- **Vitest** — Fast unit testing framework
- **Playwright** — End-to-end testing across browsers
- **ESLint** — Code linting and style enforcement

## Local Development Setup

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LessonArcade
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:

```bash
# Google AI Studio API Key for Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Basic Authentication for Lesson Studio
STUDIO_BASIC_AUTH_USER=your_admin_username
STUDIO_BASIC_AUTH_PASS=your_admin_password

# Salt for IP hashing in structured logs
LOGGING_SALT=random_salt_string_here

# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Default voice IDs for different languages
ELEVENLABS_VOICE_ID_EN=your_english_voice_id
ELEVENLABS_VOICE_ID_ZH=your_chinese_voice_id

# Voice Presets for AI Voice
VOICE_TTS_VOICE_ID_EN_INSTRUCTOR=your_voice_id
VOICE_TTS_VOICE_ID_EN_NARRATOR=your_voice_id
VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR=your_voice_id
VOICE_TTS_VOICE_ID_ZH_NARRATOR=your_voice_id
```

### Running the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running Tests

### Linting
```bash
pnpm lint
```

### Type Checking
```bash
pnpm typecheck
```

### Unit Tests
```bash
pnpm test
```

### End-to-End Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests in CI mode
pnpm test:e2e:ci
```

## Deployment

### Cloud Run Deployment (Primary Contest Path)

The application is deployed on Google Cloud Run for automatic scaling and cost-effective hosting.

#### Prerequisites
- Google Cloud project with Cloud Run API enabled
- `gcloud` CLI installed and authenticated
- Artifact Registry configured

#### Deployment Steps

1. Build and push the Docker image:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/lessonarcade
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy lessonarcade \
  --image gcr.io/PROJECT_ID/lessonarcade \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

3. Configure required secrets in Cloud Run:
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `STUDIO_BASIC_AUTH_USER`
- `STUDIO_BASIC_AUTH_PASS`
- `LOGGING_SALT`
- Voice preset IDs (e.g., `VOICE_TTS_VOICE_ID_EN_INSTRUCTOR`)

#### Automated Deployment
Use the provided deployment script:
```bash
./scripts/cloud-run/deploy.sh
```

### Health Check
Verify deployment with the smoke test:
```bash
./scripts/cloud-run/smoke.sh
```

## Privacy & Data Handling

LessonArcade is designed with privacy as a core principle:

- **No Personal Data Collection** — User IP addresses are hashed before storage
- **Aggregated Analytics** — Only aggregated metrics are collected (completion rates, replay counts)
- **No User Tracking** — No cookies, tracking pixels, or third-party analytics
- **Secure Secrets** — All API keys and sensitive configuration are managed via Google Cloud Secrets Manager
- **Data Minimization** — Only the minimum data required for voice analytics is collected

## Architecture

```mermaid
graph TB
    A[User Browser] --> B[Next.js 16 App]
    B --> C[Voice API Routes]
    B --> D[Studio Analytics]
    C --> E[ElevenLabs TTS API]
    C --> F[Rate Limiter]
    C --> G[Telemetry Emitter]
    D --> H[Voice Analytics Dashboard]
    G --> H
    B --> I[Google Cloud Run]
    I --> J[Artifact Registry]
    I --> K[Cloud Secrets Manager]
```

## Demo

Try the live demo at [demo-url-placeholder] (replace with actual Cloud Run URL)

## Devpost Submission Checklist

This checklist ensures the repository is strictly contest-compliant per Devpost rules.

### Hosted Project URL
- [ ] **Public URL to deployed application** for judging and testing
  - Must be accessible to judges without authentication barriers
  - Recommended: Google Cloud Run deployment

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

*See [`docs/submission.md`](docs/submission.md) for complete submission requirements and pre-submit checklist.*

## Contributing

This project is open source under the Apache-2.0 license. Contributions are welcome!

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

## Support

For questions or issues, please open an issue in the repository.

---

**Built for the AI Partner Catalyst Hackathon — ElevenLabs Challenge**
