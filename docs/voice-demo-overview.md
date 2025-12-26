## Voice Demo Overview

LessonArcade includes a production-ready Voice Demo that turns any JSON lesson into a narrated, interactive experience. The system streams TTS narration, inserts checks for understanding after each key concept, and records telemetry for every playback and interaction.

There are two primary flows:

- `/demo/voice/effective-meetings` – a linear, lesson-style walkthrough where the voice coach guides the learner step by step.
- `/demo/voice-chat/effective-meetings` – a chat-style conversational flow that uses the same lesson data but feels more like talking to a tutor.

The demo can be deployed as a standalone Cloud Run service following `docs/voice-demo-playbook.md`. Once deployed, teams can record the stable public URL in `voice-demo-url.txt` (see `voice-demo-url.example`) and share it with reviewers, demo participants, or internal stakeholders.
