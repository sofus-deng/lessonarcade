/**
 * Pure gamification domain model with no side effects.
 * All functions are testable and deterministic.
 */

export type BadgeId = "first-lesson" | "five-lessons" | "perfect-score" | "three-day-streak";

export interface Badge {
  id: BadgeId;
  label: string;
  description: string;
}

export interface LessonRunInput {
  lessonId: string;
  score: number;
  maxScore: number;
  correctCount: number;
  completedAt: Date;
  mode: "focus" | "arcade";
}

export interface LessonRunSummary {
  lessonId: string;
  score: number;
  maxScore: number;
  completedAt: string; // ISO date string
  mode: "focus" | "arcade";
}

export interface GamificationState {
  totalLessonsCompleted: number;
  totalRuns: number;
  currentStreakDays: number;
  longestStreakDays: number;
  badgesUnlocked: BadgeId[];
  history: LessonRunSummary[];
  bestScoresByLesson: Record<string, LessonRunSummary>;
}

/**
 * Badge definitions for the gamification system.
 */
export const BADGES: Record<BadgeId, Badge> = {
  "first-lesson": {
    id: "first-lesson",
    label: "First Lesson",
    description: "Complete your first lesson",
  },
  "five-lessons": {
    id: "five-lessons",
    label: "Five Lessons",
    description: "Complete 5 lessons",
  },
  "perfect-score": {
    id: "perfect-score",
    label: "Perfect Score",
    description: "Achieve maximum points on a lesson",
  },
  "three-day-streak": {
    id: "three-day-streak",
    label: "3-Day Streak",
    description: "Complete lessons on 3 consecutive days",
  },
};

/**
 * Get the initial empty gamification state.
 */
export function getInitialGamificationState(): GamificationState {
  return {
    totalLessonsCompleted: 0,
    totalRuns: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    badgesUnlocked: [],
    history: [],
    bestScoresByLesson: {},
  };
}

/**
 * Get YYYY-MM-DD string from a Date in the local timezone.
 */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the difference in days between two YYYY-MM-DD date strings.
 */
function getDayDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Update the streak based on a new completion date and the most recent activity date.
 */
function updateStreak(
  currentStreakDays: number,
  longestStreakDays: number,
  newCompletionDate: string,
  mostRecentActivityDate: string | null
): { currentStreakDays: number; longestStreakDays: number } {
  // If no previous activity, start a new streak
  if (!mostRecentActivityDate) {
    return { currentStreakDays: 1, longestStreakDays: Math.max(longestStreakDays, 1) };
  }

  // If same day, don't change the streak
  if (newCompletionDate === mostRecentActivityDate) {
    return { currentStreakDays, longestStreakDays };
  }

  const dayDiff = getDayDifference(newCompletionDate, mostRecentActivityDate);

  // If exactly 1 day after, increment streak
  if (dayDiff === 1) {
    const newStreak = currentStreakDays + 1;
    return {
      currentStreakDays: newStreak,
      longestStreakDays: Math.max(longestStreakDays, newStreak),
    };
  }

  // If more than 1 day after, reset streak to 1
  return { currentStreakDays: 1, longestStreakDays: Math.max(longestStreakDays, 1) };
}

/**
 * Check which badges should be unlocked based on the current state and run.
 */
function checkBadgeUnlocks(
  state: GamificationState,
  run: LessonRunInput
): BadgeId[] {
  const newlyUnlocked: BadgeId[] = [];

  // first-lesson: unlocked when totalLessonsCompleted becomes 1
  if (state.totalLessonsCompleted === 0 && !state.badgesUnlocked.includes("first-lesson")) {
    newlyUnlocked.push("first-lesson");
  }

  // five-lessons: unlocked when totalLessonsCompleted reaches 5 or more
  if (state.totalLessonsCompleted === 4 && !state.badgesUnlocked.includes("five-lessons")) {
    newlyUnlocked.push("five-lessons");
  }

  // perfect-score: unlocked when score === maxScore in a run
  if (run.score === run.maxScore && !state.badgesUnlocked.includes("perfect-score")) {
    newlyUnlocked.push("perfect-score");
  }

  // three-day-streak: checked after streak is updated
  // This will be handled after the streak is calculated

  return newlyUnlocked;
}

/**
 * Update the best score for a lesson.
 * Best is defined as highest score; if scores tie, prefer the latest completedAt.
 */
function updateBestScore(
  bestScoresByLesson: Record<string, LessonRunSummary>,
  runSummary: LessonRunSummary
): Record<string, LessonRunSummary> {
  const currentBest = bestScoresByLesson[runSummary.lessonId];

  if (!currentBest) {
    return { ...bestScoresByLesson, [runSummary.lessonId]: runSummary };
  }

  // If new score is higher, it's the new best
  if (runSummary.score > currentBest.score) {
    return { ...bestScoresByLesson, [runSummary.lessonId]: runSummary };
  }

  // If scores are equal, prefer the latest completedAt
  if (runSummary.score === currentBest.score) {
    if (runSummary.completedAt > currentBest.completedAt) {
      return { ...bestScoresByLesson, [runSummary.lessonId]: runSummary };
    }
  }

  return bestScoresByLesson;
}

/**
 * Apply a lesson run to the gamification state.
 *
 * This function:
 * - Updates totalLessonsCompleted and totalRuns
 * - Calculates and updates the learning streak
 * - Evaluates badge unlock conditions
 * - Updates bestScoresByLesson
 * - Appends the run to history
 *
 * @param state - Current gamification state
 * @param run - The lesson run to apply
 * @returns Updated state and list of newly unlocked badges
 */
export function applyLessonRun(
  state: GamificationState,
  run: LessonRunInput
): { state: GamificationState; newlyUnlockedBadges: BadgeId[] } {
  const newTotalRuns = state.totalRuns + 1;
  const newTotalLessonsCompleted = state.totalLessonsCompleted + 1;

  // Get the most recent activity date from history
  const mostRecentActivityDate =
    state.history.length > 0
      ? getLocalDateString(new Date(state.history[state.history.length - 1].completedAt))
      : null;

  // Calculate the new completion date
  const newCompletionDate = getLocalDateString(run.completedAt);

  // Update streak
  const { currentStreakDays, longestStreakDays } = updateStreak(
    state.currentStreakDays,
    state.longestStreakDays,
    newCompletionDate,
    mostRecentActivityDate
  );

  // Create run summary
  const runSummary: LessonRunSummary = {
    lessonId: run.lessonId,
    score: run.score,
    maxScore: run.maxScore,
    completedAt: run.completedAt.toISOString(),
    mode: run.mode,
  };

  // Update best scores
  const bestScoresByLesson = updateBestScore(state.bestScoresByLesson, runSummary);

  // Create new state with updated values
  const newState: GamificationState = {
    totalLessonsCompleted: newTotalLessonsCompleted,
    totalRuns: newTotalRuns,
    currentStreakDays,
    longestStreakDays,
    badgesUnlocked: [...state.badgesUnlocked],
    history: [...state.history, runSummary],
    bestScoresByLesson,
  };

  // Check for badge unlocks (before streak update)
  const newlyUnlockedBadges = checkBadgeUnlocks(state, run);

  // Check three-day-streak badge after streak is updated
  const finalNewlyUnlockedBadges = [...newlyUnlockedBadges];
  if (
    currentStreakDays >= 3 &&
    !state.badgesUnlocked.includes("three-day-streak") &&
    !finalNewlyUnlockedBadges.includes("three-day-streak")
  ) {
    finalNewlyUnlockedBadges.push("three-day-streak");
  }

  // Add newly unlocked badges to state
  newState.badgesUnlocked = [...new Set([...newState.badgesUnlocked, ...finalNewlyUnlockedBadges])];

  return { state: newState, newlyUnlockedBadges: finalNewlyUnlockedBadges };
}

/**
 * Get all badges (both locked and unlocked) for a given state.
 */
export function getAllBadges(): Badge[] {
  return Object.values(BADGES);
}

/**
 * Get unlocked badges for a given state.
 */
export function getUnlockedBadges(state: GamificationState): Badge[] {
  return state.badgesUnlocked.map((id) => BADGES[id]);
}

/**
 * Get locked badges for a given state.
 */
export function getLockedBadges(state: GamificationState): Badge[] {
  const allBadgeIds = Object.keys(BADGES) as BadgeId[];
  const lockedIds = allBadgeIds.filter((id) => !state.badgesUnlocked.includes(id));
  return lockedIds.map((id) => BADGES[id]);
}
