# Voice Chat Flow (LA2-P1-04)

## Route
- `/demo/voice-chat/[slug]`
- Optional query param `displayLanguage=en|zh` (fallback to `la:displayLanguage` or `en`)

## UI Behavior
- Header shows lesson title, item progress (N / total), and current level name.
- Main area is a chat transcript of system/instructor prompts and user replies.
- Input area:
  - Multiple choice: option buttons; selecting an option submits and reveals “Next”.
  - Open ended: textarea + Submit; adds a “Received.” system reply; then “Next”.
  - Checkpoint: system message + “Continue” button.
- Minimal voice controls (Play/Pause/Stop/Replay) are colocated with the chat flow and always target the current item.

## State Machine
- `initChatFlow`: sets `started=false`, `finished=false`, indexes at 0/0, clears messages/stats.
- `startChatFlow`: posts level intro + key points (optional), then first item prompt.
- `submitAnswer`: adds user message; multiple choice adds feedback + updates stats; open ended adds “Received.”
- `nextStep`: advances items/levels, posts level-complete message, and finishes with a summary.

## Privacy + Guardrails
- Transcript only stores message text; no per-question selections beyond what’s in the chat log.
- Minimal stats are limited to `answeredCount` and `correctCount` for multiple choice.
- **No autoplay guarantee:** voice playback never starts on engine toggle, preset change, language change, route change, or item navigation. Only explicit Play triggers audio.
