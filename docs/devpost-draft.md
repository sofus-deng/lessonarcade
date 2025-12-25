# Devpost Submission Write-Up

**Copy-paste this content directly to Devpost.**

---

## Project Details

- **PROJECT_NAME** = LessonArcade
- **ONE_LINE_PITCH** = AI-Powered Voice Lessons for Modern Education — Transform traditional lessons into interactive, voice-enabled learning experiences with natural AI narration.
- **HOSTED_URL** = [Cloud Run URL for judging]
- **REPO_URL** = [GitHub repository URL]
- **DEMO_VIDEO_URL** = [YouTube/Vimeo link, <= 3 minutes]

---

## Problem

Traditional e-learning platforms face significant challenges in delivering engaging, accessible educational content:

1. **Static Content**: Text-heavy lessons lack engagement and fail to capture learner attention
2. **Language Barriers**: Limited multilingual support excludes non-English speakers
3. **Accessibility Gaps**: Visual-only content is inaccessible to visually impaired learners
4. **No Analytics**: Educators lack insights into learner engagement and completion rates
5. **Complex Infrastructure**: Deploying and scaling voice-enabled applications requires significant technical expertise and resources

These barriers prevent educators from creating truly inclusive and engaging learning experiences that reach diverse global audiences.

---

## Solution / What It Does

**LessonArcade** is a voice-first educational platform that transforms traditional lessons into interactive, AI-powered learning experiences.

Key features include:

- **Natural AI Voice Narration**: Using ElevenLabs' advanced text-to-speech API, lessons are delivered with human-like voices in multiple languages
- **Interactive Controls**: Learners can pause, resume, and stop narration at any point
- **Bilingual Support**: Full English and Chinese language support with automatic language detection
- **Conversational AI Agents**: Real-time voice conversations for interactive Q&A sessions
- **Advanced Guardrails**: Acknowledgment system, cooldown periods, and multi-tier rate limiting to prevent abuse
- **Comprehensive Analytics**: Real-time voice usage telemetry tracking completion rates, replay patterns, and interruption points
- **Privacy-First Design**: All telemetry uses hashed IP addresses with no personal data collection

---

## How We Built It

We built LessonArcade using modern web technologies and Google Cloud infrastructure:

### Google Cloud Technologies
- **Gemini AI**: Content generation and lesson enhancement through Google's advanced AI models, integrated via both Google AI Studio API (development) and Vertex AI (production)
- **Google Cloud Run**: Serverless deployment with automatic scaling, ensuring the application handles traffic spikes efficiently while maintaining cost-effectiveness
- **Google Artifact Registry**: Container image storage for Docker deployments
- **Google Cloud Secrets Manager**: Secure management of API keys and sensitive configuration

### Partner Technology
- **ElevenLabs API**: High-quality, natural-sounding voice synthesis in multiple languages
- **ElevenLabs Agents**: Conversational AI for real-time voice interactions and Q&A

### Core Stack
- **Next.js 16**: React framework with App Router for server-side rendering and optimal performance
- **pnpm**: Fast, disk space efficient package manager for dependency management
- **TypeScript**: Type-safe development throughout the codebase
- **Tailwind CSS**: Utility-first styling for rapid UI development

### Testing & Quality
- **Vitest**: Fast unit testing framework for component and utility testing
- **Playwright**: End-to-end testing across browsers for reliability
- **ESLint**: Code linting and style enforcement

---

## Architecture Overview

LessonArcade follows a modern, cloud-native architecture:

**Frontend Layer**: Next.js 16 application with App Router, React 19, and TypeScript. The UI is built with Tailwind CSS and Radix UI components for accessibility.

**API Layer**: Server-side API routes handle voice synthesis, analytics, and conversational AI. Voice requests go through a multi-tier rate limiter before calling ElevenLabs TTS API. Conversational features use ElevenLabs Agents via WebSocket connections.

**AI Integration**: Gemini AI is integrated through two paths — Google AI Studio API for local development and Vertex AI for production deployments using Application Default Credentials.

**Analytics System**: Real-time telemetry tracks voice usage metrics including completion rates, replay patterns, and interruption points. All data is anonymized using hashed IP addresses.

**Deployment**: Docker containerization with multi-stage builds deploys to Google Cloud Run. The service automatically scales based on traffic and uses Cloud Secrets Manager for secure configuration.

**Guardrails**: An acknowledgment system ensures user consent, cooldown periods prevent abuse, and rate limiting operates at minute/hour/day windows.

---

## Challenges

1. **Voice Synchronization**: Coordinating audio playback with lesson content across different browsers and devices required careful timing management and event handling.

2. **Rate Limiting & Abuse Prevention**: Implementing effective guardrails without degrading user experience required designing a multi-tier rate limiting system with configurable windows.

3. **Multi-Language Support**: Ensuring consistent voice quality and proper language detection across English and Chinese content demanded careful configuration of ElevenLabs voice presets.

4. **Privacy-First Analytics**: Building a comprehensive analytics system while maintaining strict privacy standards required designing a hashing-based approach for IP addresses and ensuring no personal data collection.

5. **Cloud Run Deployment**: Configuring health checks, environment variables, and service accounts for production deployment on Cloud Run required understanding Google Cloud's serverless infrastructure.

---

## Accomplishments

1. **Fully Functional Voice System**: Built a complete voice narration system with ElevenLabs integration, supporting multiple languages and voice presets.

2. **Conversational AI Integration**: Successfully integrated ElevenLabs Agents for real-time voice conversations, enabling interactive Q&A sessions.

3. **Comprehensive Analytics Dashboard**: Created a privacy-first analytics system that provides actionable insights into learner engagement without collecting personal data.

4. **Production-Ready Deployment**: Established a complete Cloud Run deployment pipeline with automated scaling, health checks, and secure secret management.

5. **Robust Testing Suite**: Achieved high test coverage with Vitest for unit tests and Playwright for end-to-end testing across browsers.

6. **Bilingual Support**: Implemented full English and Chinese language support with automatic language detection and appropriate voice selection.

7. **Advanced Guardrails**: Built a sophisticated abuse prevention system with acknowledgments, cooldowns, and multi-tier rate limiting.

---

## What We Learned

1. **Voice API Best Practices**: Learned how to optimize ElevenLabs API calls through intelligent chunking, caching, and request deduplication.

2. **Cloud Run Optimization**: Gained deep understanding of serverless deployment, including health check configuration, environment variable management, and automatic scaling behavior.

3. **Privacy-First Design**: Learned practical techniques for building analytics systems that respect user privacy while still providing valuable insights.

4. **Rate Limiting Strategies**: Discovered effective patterns for implementing rate limiting that balance security with user experience.

5. **TypeScript in Full-Stack Development**: Appreciated the value of type safety across the entire stack, from frontend components to API routes.

6. **Testing at Scale**: Learned best practices for organizing and maintaining both unit and end-to-end tests as the application grows.

---

## What's Next

**Short-term Enhancements:**
- Additional language support (Spanish, French, Japanese)
- Mobile-responsive optimizations for tablet devices
- Enhanced voice chat mode with more interactive features
- Lesson studio with visual content editor

**Long-term Vision:**
- Custom voice cloning for personalized learning
- Real-time collaboration features for group lessons
- AI-powered content generation from source materials
- Integration with learning management systems (LMS)
- Advanced analytics with machine learning insights

---

*Demo script available at: [demo script link placeholder]*
