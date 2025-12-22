# Voice Chat Flow (LA2-P1-04)

## Route
- `/demo/voice-chat/[slug]`
- Optional query param `displayLanguage=en|zh` (fallback to `la:displayLanguage` or `en`)

## UI Behavior
- Header shows lesson title, item progress (N / total), current level name, and minimal stats for answerable items.
- Main area is a chat transcript of system/instructor prompts and user replies.
- Input area:
  - Multiple choice: option buttons; selecting an option locks the UI, shows compact correctness feedback, and reveals "Next".
  - Open ended: textarea + Submit; stores text in component state only, adds a "Received." system reply, then shows "Next".
  - Checkpoint: system message + "Continue" button.
- Minimal voice controls (Play/Pause/Stop/Replay) are colocated with the chat flow and always target the current item.

## Answering + Minimal Stats
- **Interactive Answering UI**:
  - Multiple choice options lock immediately after submission to prevent changes
  - Compact "Correct" or "Incorrect" feedback is shown without revealing the correct answer (following main player behavior)
  - Open-ended answers are stored only in component state (ephemeral) and not persisted
  - Checkpoint items render with a single "Continue" action
- **Minimal Stats Tracking**:
  - Tracks `answeredCount` and `correctCount` for multiple choice items only
  - Exposes `totalCount` for answerable items (multiple choice + open ended) to show progress
  - No persistence of specific selected options or free-text answers
  - Stats are displayed in the header during the lesson and in a comprehensive end summary
- **End Summary View**:
  - Compact summary card showing completion status, answeredCount/totalCount, and correctCount/answeredCount
  - CTAs for "Replay lesson" (resets stats and starts over) and "Back to demos" (/demo)
  - Consistent styling with existing design tokens and motion
  - Maintains no-autoplay guardrails

## State Machine
- `initChatFlow`: sets `started=false`, `finished=false`, indexes at 0/0, clears messages/stats.
- `startChatFlow`: posts level intro + key points (optional), then first item prompt.
- `submitAnswer`: adds user message; multiple choice adds feedback + updates stats; open ended adds "Received."
- `nextStep`: advances items/levels, posts level-complete message, and finishes with a summary.

## Privacy + Guardrails
- Transcript only stores message text; no per-question selections beyond what's in the chat log.
- Minimal stats are limited to `answeredCount` and `correctCount` for multiple choice.
- Open-ended answers are never persisted to localStorage or any storage.
- **No autoplay guarantee:** voice playback never starts on engine toggle, preset change, language change, route change, or item navigation. Only explicit Play triggers audio.

## Demo Entry + CI Smoke + Telemetry Parity
- Demo cards now include a "Voice Chat" CTA linking to `/demo/voice-chat/[slug]`.
- Cloud Run smoke script checks `/demo/voice-chat/effective-meetings` returns 200 post-deploy.
- Minimal voice controls emit the same privacy-safe telemetry events as voice mode without autoplay.
