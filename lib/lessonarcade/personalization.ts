/**
 * Pure personalization domain model with no side effects.
 * All functions are testable and deterministic.
 *
 * This module provides a rule-based personalization engine that generates
 * tailored next-step suggestions after a lesson is completed.
 *
 * The engine is designed to be LLM-ready for future AI integration while
 * providing clear, deterministic behavior with the current rule-based approach.
 */

/**
 * Types of personalized suggestions that can be shown to learners.
 */
export type PersonalizationSuggestionType =
  | "review_levels"
  | "retry_lesson"
  | "try_voice_mode"
  | "next_lesson"
  | "celebrate";

/**
 * Context data used to generate personalized suggestions.
 */
export interface PersonalizationContext {
  /** Workspace identifier (e.g., "demo") */
  workspaceSlug: string;
  /** Lesson identifier slug */
  lessonSlug: string;
  /** Mode in which the lesson was completed */
  mode: "focus" | "arcade";
  /** Score achieved in the lesson (null if not applicable) */
  score: number | null;
  /** Maximum possible score (null if not applicable) */
  maxScore: number | null;
  /** Number of times this lesson has been attempted */
  totalRunsForLesson: number;
  /** Current streak of consecutive days with completed lessons */
  streakDays: number;
  /** When the lesson was completed */
  completedAt: Date;
}

/**
 * A personalized suggestion for the learner's next step.
 */
export interface PersonalizationSuggestion {
  /** Stable identifier for this suggestion type */
  id: string;
  /** Type of suggestion */
  type: PersonalizationSuggestionType;
  /** Short title for the suggestion */
  title: string;
  /** 1-2 line description of the suggestion */
  description: string;
  /** Optional URL for the primary CTA button */
  primaryActionHref?: string;
  /** Optional label for the primary CTA button */
  primaryActionLabel?: string;
}

/**
 * Score thresholds for personalization rules.
 */
const SCORE_THRESHOLD_LOW = 0.6; // 60%
const SCORE_THRESHOLD_HIGH = 0.9; // 90%

/**
 * Calculate the score percentage from score and maxScore.
 * Returns null if score or maxScore is null, zero, or negative.
 */
function calculateScorePercent(score: number | null, maxScore: number | null): number | null {
  if (score === null || maxScore === null || maxScore <= 0) {
    return null;
  }
  return score / maxScore;
}

/**
 * Build personalized suggestions based on the learner's context.
 *
 * This function uses deterministic rules to generate 1-3 tailored suggestions
 * that help learners decide what to do next after completing a lesson.
 *
 * The rules consider:
 * - Score percentage (low, mid, high)
 * - Number of attempts on this lesson
 * - Current learning streak
 * - Mode used (focus vs arcade)
 *
 * All suggestions are encouraging and non-judgmental, focusing on growth
 * rather than punishment.
 *
 * @param context - The context data for generating suggestions
 * @returns An array of 1-3 personalized suggestions
 */
export function buildPersonalizationSuggestions(
  context: PersonalizationContext
): PersonalizationSuggestion[] {
  const { lessonSlug, mode, score, maxScore, totalRunsForLesson, streakDays } = context;

  const scorePercent = calculateScorePercent(score, maxScore);
  const suggestions: PersonalizationSuggestion[] = [];

  // Build URLs for CTAs
  const retryUrl = `/demo/lesson/${lessonSlug}`;
  const voiceUrl = `/demo/voice/${lessonSlug}`;
  const voiceChatUrl = `/demo/voice-chat/${lessonSlug}`;

  // Rule 1: Low score (< 60%) - Suggest retry
  if (scorePercent !== null && scorePercent < SCORE_THRESHOLD_LOW) {
    if (totalRunsForLesson >= 3) {
      // Multiple attempts with low scores - emphasize steady improvement
      suggestions.push({
        id: "steady-improvement",
        type: "retry_lesson",
        title: "Keep up the effort!",
        description: "You're making progress with each attempt. Try again to solidify your understanding.",
        primaryActionHref: retryUrl,
        primaryActionLabel: "Try Again",
      });
    } else {
      // First or second attempt - encourage review
      suggestions.push({
        id: "low-score-review",
        type: "retry_lesson",
        title: "Review this lesson once more",
        description: "Going through the material again will help reinforce key concepts.",
        primaryActionHref: retryUrl,
        primaryActionLabel: "Replay Lesson",
      });
    }
  }

  // Rule 2: Mid score (60-89%) - Suggest review levels
  if (scorePercent !== null && scorePercent >= SCORE_THRESHOLD_LOW && scorePercent < SCORE_THRESHOLD_HIGH) {
    suggestions.push({
      id: "mid-score-review",
      type: "review_levels",
      title: "Revisit a few key levels",
      description: "You're on the right track! Reviewing some levels will help you master the material.",
    });

    // Optional: Suggest voice mode as an alternative way to learn
    if (mode === "focus") {
      suggestions.push({
        id: "mid-score-voice",
        type: "try_voice_mode",
        title: "Try voice mode for variety",
        description: "Experience the lesson in a new way with voice interaction.",
        primaryActionHref: voiceUrl,
        primaryActionLabel: "Try Voice Mode",
      });
    }
  }

  // Rule 3: High score (≥ 90%) - Celebrate and suggest next steps
  if (scorePercent !== null && scorePercent >= SCORE_THRESHOLD_HIGH) {
    suggestions.push({
      id: "high-score-celebrate",
      type: "celebrate",
      title: "Excellent work!",
      description: "You've demonstrated strong understanding of this material.",
    });

    // Suggest voice mode or next lesson as the next step
    if (mode === "focus") {
      suggestions.push({
        id: "high-score-voice",
        type: "try_voice_mode",
        title: "Challenge yourself with voice mode",
        description: "Test your skills with voice interaction for a different experience.",
        primaryActionHref: voiceUrl,
        primaryActionLabel: "Try Voice Mode",
      });
    } else {
      suggestions.push({
        id: "high-score-voice-chat",
        type: "try_voice_mode",
        title: "Try voice chat mode",
        description: "Have a conversation about what you've learned.",
        primaryActionHref: voiceChatUrl,
        primaryActionLabel: "Start Voice Chat",
      });
    }
  }

  // Rule 4: No score data (null) - Provide a general encouraging suggestion
  if (scorePercent === null) {
    suggestions.push({
      id: "no-score-encourage",
      type: "next_lesson",
      title: "Great job completing this lesson!",
      description: "Continue your learning journey by exploring more content.",
    });

    // Suggest voice mode as an alternative
    suggestions.push({
      id: "no-score-voice",
      type: "try_voice_mode",
      title: "Try voice mode",
      description: "Experience the lesson with voice interaction for a different approach.",
      primaryActionHref: voiceUrl,
      primaryActionLabel: "Try Voice Mode",
    });
  }

  // Rule 5: Streak-based encouragement
  if (streakDays >= 3 && suggestions.length < 3) {
    suggestions.push({
      id: "streak-encourage",
      type: "celebrate",
      title: `${streakDays}-day streak! 🔥`,
      description: "You're building great momentum. Keep it going!",
    });
  }

  // Ensure we always return at least one suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      id: "default-continue",
      type: "next_lesson",
      title: "Keep learning!",
      description: "Continue your journey by exploring more lessons.",
    });
  }

  // Return at most 3 suggestions
  return suggestions.slice(0, 3);
}

/**
 * Get the total number of runs for a specific lesson from the gamification history.
 *
 * @param history - Array of lesson run summaries
 * @param lessonId - The lesson ID to count runs for
 * @returns The number of runs for the specified lesson
 */
export function getTotalRunsForLesson(
  history: Array<{ lessonId: string }>,
  lessonId: string
): number {
  return history.filter((run) => run.lessonId === lessonId).length;
}
