# LessonArcade Press Kit

A comprehensive press kit for LessonArcade, featuring AI-powered voice lessons with bilingual support and advanced analytics.

## Quick Links

- [Pitch Deck](./pitch-deck.md) - 10-slide overview of LessonArcade
- [Architecture Diagrams](./diagrams/) - System and deployment architecture
- [Screenshots](./screenshots/) - Visual assets and guidelines
- [Demo Video Guide](./video/) - Recording script and shot list

## About LessonArcade

LessonArcade is an innovative educational platform that transforms traditional lessons into interactive, voice-enabled experiences. Built with Next.js 16 and deployed on Google Cloud Run, it features:

- **AI Voice Integration**: Powered by ElevenLabs with customizable presets
- **Bilingual Support**: Full English and Chinese language support
- **Advanced Guardrails**: Acknowledgment, cooldown, and rate limiting systems
- **Telemetry & Analytics**: Comprehensive voice usage analytics at `/studio/voice-analytics`
- **Cloud-Native Architecture**: Scalable deployment on Google Cloud Run with Basic Auth protection

## Key Features

### Voice System Architecture
- Script building and chunking queue system
- Multi-tier rate limiting (minute/hour/day windows)
- Request deduplication and caching
- Preset-based voice management

### Analytics & Telemetry
- Real-time voice usage tracking
- Completion and replay rate metrics
- Interruption point analysis
- Privacy-first data collection with IP hashing

### Deployment
- Docker containerization with multi-stage builds
- Google Cloud Run with automatic scaling
- Environment-based configuration
- Basic Auth for admin routes

## How to Use for a Demo

### Prerequisites
1. Access to a deployed LessonArcade instance
2. Studio credentials (Basic Auth)
3. Optional: ElevenLabs API key for full voice functionality

### Demo Flow (5 minutes)

1. **Introduction** (30 seconds)
   - Navigate to the demo page
   - Show the lesson selection interface
   - Highlight bilingual support

2. **Voice Lesson Demo** (2 minutes)
   - Select a voice-enabled lesson (e.g., "Effective Meetings")
   - Play the AI voice narration
   - Demonstrate pause/resume/stop controls
   - Show rate limiting in action (if applicable)

3. **Studio Analytics** (1.5 minutes)
   - Access `/studio` with Basic Auth
   - Navigate to Voice Analytics
   - Show real-time telemetry data
   - Explain completion rates and user engagement metrics

4. **Technical Overview** (1 minute)
   - Explain the guardrails system
   - Show the chunking queue architecture
   - Highlight Cloud Run deployment benefits

### Talking Points

- "Our voice system processes lessons through a sophisticated chunking queue that optimizes for both performance and cost"
- "We implement multi-tier guardrails including acknowledgment, cooldown periods, and intelligent rate limiting"
- "All telemetry is collected with privacy in mind, using hashed identifiers and aggregated analytics"
- "The entire system runs on Google Cloud Run, providing automatic scaling and cost-effective deployment"

### Demo Environment Setup

For a complete demo experience, ensure these environment variables are configured:
- `ELEVENLABS_API_KEY`: For voice synthesis
- `STUDIO_BASIC_AUTH_USER`/`STUDIO_BASIC_AUTH_PASS`: For studio access
- `LOGGING_SALT`: For secure telemetry hashing

## Technical Specifications

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Docker + Google Cloud Run
- **Voice Provider**: ElevenLabs API
- **Authentication**: Basic Auth for admin routes

## Contact Information

For technical inquiries or partnership opportunities, please refer to the project repository or contact the development team.

---

*This press kit is maintained as part of the LessonArcade project. For the most up-to-date information, please check the latest version in the repository.*