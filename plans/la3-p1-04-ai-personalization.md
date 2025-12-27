# AI Personalization - Planning Document

## Overview

LessonArcade uses analytics and rule-based logic to propose personalized next steps to learners after completing a lesson. The system analyzes learner performance (score percentage, attempt count, learning streak) and provides tailored suggestions to guide continued learning.

## v0.3 Implementation (Current)

### Rule-Based Personalization Engine

The current implementation uses a deterministic rule-based approach to generate personalized suggestions:

**Location:** `lib/lessonarcade/personalization.ts`

**Core Function:** `buildPersonalizationSuggestions(context: PersonalizationContext): PersonalizationSuggestion[]`

**Input Context:**
- `workspaceSlug`: Workspace identifier (e.g., "demo")
- `lessonSlug`: Lesson identifier slug
- `mode`: Lesson completion mode ("focus" or "arcade")
- `score`: Score achieved in the lesson
- `maxScore`: Maximum possible score
- `totalRunsForLesson`: Number of attempts on this lesson
- `streakDays`: Current learning streak
- `completedAt`: Completion timestamp

**Suggestion Types:**
- `review_levels`: Revisit specific levels for reinforcement
- `retry_lesson`: Replay the entire lesson
- `try_voice_mode`: Try voice or voice-chat mode for variety
- `next_lesson`: Advance to the next lesson
- `celebrate`: Celebrate achievements

**Rule Logic:**

| Score Range | Primary Suggestion | Secondary Suggestion |
|-------------|-------------------|---------------------|
| < 60% | `retry_lesson` | - |
| 60-89% | `review_levels` | `try_voice_mode` (optional) |
| ≥ 90% | `celebrate` | `next_lesson` or `try_voice_mode` |

**Special Handling:**
- If `totalRunsForLesson >= 3` with low scores, emphasize "steady improvement" messaging
- If `streakDays >= 3`, add streak-based encouragement
- Always return at least one suggestion
- Maximum of 3 suggestions per completion

### UI Integration

**Location:** `components/lesson/lesson-summary.tsx`

The personalized suggestions are displayed in a card component that:
- Only appears when the lesson is completed
- Shows 1-3 suggestions with titles, descriptions, and optional CTAs
- Uses `role="status"` and `aria-live="polite"` for accessibility
- Has `data-testid="la-personalized-suggestions"` for testing

**Data Flow:**
1. Lesson completes → `useGamificationAfterLesson` updates gamification state
2. `PersonalizationContext` is built from lesson data and gamification state
3. `buildPersonalizationSuggestions()` generates suggestions
4. Suggestions are rendered in the UI

### Alignment with Lesson Runs DB Logging

The personalization system aligns with the existing lesson runs backend logging:
- Lesson completion data is logged via `POST /api/lesson-runs`
- Local gamification state tracks history for personalization
- Score, mode, and completion time are consistent across systems

### Testing

**Unit Tests:** `test/lessonarcade/personalization.test.ts`
- Low score case (< 60%) → includes `retry_lesson` with replay URL
- Mid score case (60-89%) → includes `review_levels`
- High score case (≥ 90%) → includes `celebrate` and advance/voice suggestion
- Null/zero maxScore → returns default suggestion
- Multiple runs with low scores → steady improvement message
- Streak-based encouragement
- URL generation for different modes

**E2E Tests:** `e2e/gamification.spec.ts`
- Personalized suggestions are shown after lesson completion
- Suggestions are not shown when lesson is not completed
- Accessibility attributes are correct (`role="status"`, `aria-live="polite"`)

## Future v1+ Direction

### LLM Integration

The current rule-based system is designed to be LLM-ready. Future versions will integrate with AI models (Gemini, GLM, or others) to provide more sophisticated personalization:

**Use Cases:**
1. **Per-Question Analysis**
   - Analyze which specific questions were missed
   - Identify patterns in mistakes (e.g., always missing questions about a specific topic)
   - Suggest which levels to replay based on question-level performance

2. **Free-Text Answer Analysis**
   - Evaluate open-ended responses for understanding
   - Provide specific feedback on content quality
   - Identify misconceptions or gaps in knowledge

3. **Micro-Coaching Messages**
   - Generate personalized encouragement based on performance
   - Provide specific tips for improvement
   - Celebrate achievements with personalized messages

4. **Adaptive Path Generation**
   - Suggest which lessons to skip based on demonstrated mastery
   - Recommend prerequisite lessons for struggling topics
   - Create custom learning paths based on individual progress

### Potential API Surface

**Endpoint:** `POST /api/personalized-path`

**Request:**
```json
{
  "learnerId": "pseudonymous-id",
  "lessonSlug": "react-hooks-intro",
  "performance": {
    "score": 75,
    "maxScore": 100,
    "questionResults": [
      {
        "questionId": "q1",
        "isCorrect": true,
        "timeSpent": 5.2,
        "attempts": 1
      },
      {
        "questionId": "q2",
        "isCorrect": false,
        "timeSpent": 8.1,
        "attempts": 2
      }
    ]
  },
  "context": {
    "totalRunsForLesson": 2,
    "streakDays": 3,
    "completedLessons": ["lesson-1", "lesson-2"]
  }
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "type": "review_levels",
      "levelIds": ["level-2", "level-4"],
      "reason": "You missed questions about useEffect dependencies in these levels"
    },
    {
      "type": "try_voice_mode",
      "lessonSlug": "react-hooks-intro",
      "reason": "Voice mode can help reinforce your understanding through conversation"
    }
  ],
  "adaptivePath": {
    "recommendedNext": "lesson-3",
    "skippableLessons": ["lesson-4"],
    "prerequisiteLessons": []
  },
  "microCoaching": "Great effort on the useState questions! For useEffect, focus on understanding the dependency array."
}
```

### Privacy Considerations

**Principles:**
1. **No Raw PII**: Store only pseudonymous learner IDs (e.g., UUIDs)
2. **Minimal Data Collection**: Collect only data necessary for personalization
3. **Clear Consent**: Provide opt-in/opt-out for AI features
4. **Data Retention**: Define clear retention policies for learner data
5. **Local-First**: Keep gamification state local; only send aggregated data to AI services

**Implementation Guidelines:**
- Hash or anonymize any identifiers before sending to external AI services
- Store AI-generated suggestions locally to avoid repeated API calls
- Provide users with visibility into what data is used for personalization
- Allow users to reset their personalization data

### Technical Considerations

**LLM Integration Options:**
1. **Direct API Calls**: Call Gemini/GLM APIs directly from the backend
2. **Edge Functions**: Use Vercel Edge Functions for low-latency AI responses
3. **Caching**: Cache AI responses to reduce costs and improve performance
4. **Fallback**: Always fall back to rule-based system if AI is unavailable

**Performance:**
- Personalization should not block lesson completion
- Use asynchronous API calls with optimistic UI updates
- Implement request deduplication for rapid retries

**Cost Management:**
- Implement rate limiting for AI API calls
- Use smaller models for simple personalization
- Cache responses for similar performance patterns

## Conclusion

The v0.3 implementation provides a solid foundation for AI-powered personalization. The rule-based system is deterministic, testable, and designed to be easily extended with LLM capabilities. Future versions will leverage AI models to provide more nuanced, per-question level personalization while maintaining the same user-facing API.
