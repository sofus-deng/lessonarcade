# Demo Video Guide for Devpost Submission

This guide provides a copy-paste ready script for recording a <=3 minute Devpost demo video for LessonArcade.

## Video Structure (3 minutes total)

| Segment | Duration | Purpose |
|---------|----------|---------|
| 0:00-0:20 | 20s | Introduction and problem statement |
| 0:20-1:20 | 60s | Solution overview and key features |
| 1:20-2:30 | 70s | Live demonstration of the application |
| 2:30-3:00 | 30s | Conclusion and call-to-action |

---

## Segment 1: Introduction (0:00-0:20)

### Spoken Lines
"Hi, I'm presenting LessonArcade, an AI-powered voice-first educational platform. Traditional e-learning faces significant challenges: static content lacks engagement, language barriers exclude non-English speakers, and visually-impaired learners face accessibility gaps. LessonArcade transforms traditional lessons into interactive, voice-enabled learning experiences."

### On-Screen Actions
1. Show the LessonArcade home page (https://your-hosted-url/)
2. Highlight the hero section with "Turn teaching videos into playable lessons"
3. Briefly scroll through the pillars section

### Visual Elements
- Show the LessonArcade logo prominently
- Highlight the "Play a demo lesson" and "Voice Conversation" buttons

---

## Segment 2: Solution Overview (0:20-1:20)

### Spoken Lines
"LessonArcade uses ElevenLabs advanced text-to-speech API for natural AI voice narration in multiple languages. Learners can pause, resume, and stop narration at any point. We offer full English and Chinese language support with automatic language detection. Our conversational AI agents enable real-time voice conversations for interactive Q&A sessions. We've built advanced guardrails including acknowledgment systems, cooldown periods, and multi-tier rate limiting to prevent abuse. Our comprehensive analytics track completion rates, replay patterns, and interruption points, all with privacy-first design using hashed IP addresses."

### On-Screen Actions
1. Navigate to the Demo Lessons page (/demo)
2. Show the demo lesson grid with available lessons
3. Click on one demo lesson to show the lesson player
4. Demonstrate the voice controls (play, pause, stop)
5. Show the conversation status indicators

### Visual Elements
- Show the "Voice Conversation" button in navigation
- Highlight the conversation status (Connected/Disconnected, Speaking)
- Show the voice control buttons in the lesson player

---

## Segment 3: Live Demonstration (1:20-2:30)

### Spoken Lines
"Let me show you how LessonArcade works in action. I'll start by navigating to our Voice Conversation page. Here, you can have a natural voice conversation with an AI agent. The interface shows your connection status and whether the AI is speaking. To start, you simply click 'Start Conversation' and grant microphone permission when prompted. The AI agent responds in real-time with natural-sounding voice. You can stop the conversation at any time. For lessons, you can browse our demo lessons, select one, and experience interactive voice narration with checkpoints and challenges. The platform automatically detects the lesson language and selects the appropriate voice preset."

### On-Screen Actions
1. Click on "Voice Conversation" in the navigation
2. Show the Agents page (/agents)
3. **With Mic:** Click "Start Conversation", show the microphone permission prompt (but don't actually record voice), show the "Connected" status, then click "Stop Conversation"
4. **No-Mic Fallback:** Skip clicking "Start Conversation", instead hover over the button, show the info text below explaining how it works, then navigate back to Demo page
5. Navigate to Demo Lessons page (/demo)
6. Click on a demo lesson (e.g., "Introduction to React Hooks")
7. Show the lesson player with voice controls
8. Hover over the voice control buttons to show tooltips
9. Scroll through the lesson content to show checkpoints

### Visual Elements
- Show the conversation status indicators (Connection: Connected/Disconnected, Speaking: Yes/No)
- Highlight the Start/Stop Conversation buttons
- Show the lesson player interface with voice controls
- Display checkpoint items and challenge items

---

## Segment 4: Conclusion (2:30-3:00)

### Spoken Lines
"LessonArcade is built on Google Cloud Run for serverless deployment with automatic scaling. We use Gemini AI for content enhancement and ElevenLabs for voice synthesis. Our platform is production-ready with comprehensive testing, bilingual support, and privacy-first analytics. We're excited to show you how LessonArcade can transform education. Thank you for watching."

### On-Screen Actions
1. Navigate back to the home page (/)
2. Show the hero section again
3. Briefly show the "For creators" section
4. End with the LessonArcade logo

### Visual Elements
- Show the LessonArcade logo prominently
- Display the "Try LessonArcade" button
- Show the contact or CTA section

---

## No-Mic Fallback Flow

Use this flow if you cannot record with microphone permissions:

### Purpose
Demonstrates the ElevenLabs Agents page functionality without requesting microphone access.

### Modified On-Screen Actions for Segment 3
1. Navigate to the Agents page (/agents)
2. **Do NOT click "Start Conversation"**
3. Hover over the "Start Conversation" button
4. Show the info text below the button: "Click 'Start Conversation' to begin. Your browser will request microphone permission."
5. Show the status indicators (Connection: Disconnected, Speaking: No)
6. Show the "How it works" section below the conversation component:
   - Click "Start Conversation" to begin
   - Grant microphone permission when prompted
   - Speak naturally with AI agent
   - Click "Stop Conversation" to end
7. Navigate back to Demo Lessons page and continue with lesson demonstration

### Modified Spoken Lines for Segment 3
"Let me show you how LessonArcade works in action. I'll start by navigating to our Voice Conversation page. Here, you can have a natural voice conversation with an AI agent. The interface shows your connection status and whether the AI is speaking. To start, you simply click 'Start Conversation' and grant microphone permission when prompted. The AI agent responds in real-time with natural-sounding voice. You can stop the conversation at any time. For lessons, you can browse our demo lessons, select one, and experience interactive voice narration with checkpoints and challenges. The platform automatically detects the lesson language and selects the appropriate voice preset."

---

## Recording Tips

### Preparation
1. Clear browser cache and cookies
2. Disable browser extensions that might interfere
3. Test microphone and speakers beforehand
4. Ensure stable internet connection
5. Use a screen recording tool (OBS, Loom, or built-in screen recorder)

### Best Practices
- Speak clearly and at a moderate pace
- Use a quiet recording environment
- Keep mouse movements smooth and deliberate
- Hover over buttons briefly before clicking
- Allow time for page loads between actions
- Use a consistent screen resolution (1920x1080 recommended)

### Common Issues
- **Page load delays:** Allow extra time for page transitions
- **Microphone permission:** If the prompt appears, acknowledge it verbally
- **Voice playback:** If voice doesn't play, mention it as a demo limitation
- **Browser notifications:** Disable notifications before recording

---

## Final Checklist

After recording the video:

- [ ] Video duration is <= 3 minutes
- [ ] Video shows all key features (voice narration, conversation, lessons)
- [ ] Audio is clear and understandable
- [ ] Screen recording is smooth and visible
- [ ] Upload video to YouTube or Vimeo
- [ ] Set video visibility to "Public" (not private or unlisted)
- [ ] Copy the video URL
- [ ] Update `docs/devpost-draft.md` with the video URL:
  ```markdown
  - **DEMO_VIDEO_URL** = https://youtube.com/watch?v=YOUR_VIDEO_ID
  ```
- [ ] Verify video is publicly accessible
- [ ] Test video playback from the URL
- [ ] Run `pnpm devpost:fields` to verify all Devpost fields are ready

---

## Quick Reference: pnpm devpost:fields

After uploading your video, run this command to get all Devpost submission fields:

```bash
pnpm devpost:fields
```

This will output:
```
PROJECT_NAME=LessonArcade
ONE_LINE_PITCH=AI-Powered Voice Lessons for Modern Education...
HOSTED_URL=https://your-cloud-run-url.a.run.app
REPO_URL=https://github.com/your-username/lessonarcade
DEMO_VIDEO_URL=https://youtube.com/watch?v=YOUR_VIDEO_ID
```

Copy these values directly to your Devpost submission form.

---

*Last updated: December 2025*
