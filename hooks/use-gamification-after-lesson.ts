/**
 * Hook for handling gamification updates after lesson completion.
 *
 * This hook:
 * - Runs only once when a lesson transitions from "not completed" to "completed"
 * - Loads current GamificationState
 * - Builds a LessonRunInput from current lesson data
 * - Calls applyLessonRun and receives updated state plus newlyUnlockedBadges
 * - Saves updated state to localStorage
 * - Exposes updated GamificationState and newlyUnlockedBadges
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { GamificationState, BadgeId } from "@/lib/lessonarcade/gamification";
import { applyLessonRun } from "@/lib/lessonarcade/gamification";
import { loadGamificationStateSafe, saveGamificationStateSafe } from "@/lib/lessonarcade/gamification-storage";

export interface UseGamificationAfterLessonResult {
  gamificationState: GamificationState;
  newlyUnlockedBadges: BadgeId[];
}

export interface UseGamificationAfterLessonOptions {
  lessonId: string;
  isCompleted: boolean;
  score: number;
  maxScore: number;
  correctCount: number;
  mode: "focus" | "arcade";
}

/**
 * Hook to handle gamification updates after lesson completion.
 *
 * @param options - Lesson completion data
 * @returns Gamification state and newly unlocked badges
 */
export function useGamificationAfterLesson(
  options: UseGamificationAfterLessonOptions
): UseGamificationAfterLessonResult {
  const { lessonId, isCompleted, score, maxScore, correctCount, mode } = options;

  // Initialize state from localStorage on first render
  const [gamificationState, setGamificationState] = useState<GamificationState>(() =>
    loadGamificationStateSafe()
  );
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<BadgeId[]>([]);

  // Track if we've already processed this completion
  const processedRef = useRef(false);

  useEffect(() => {
    // Only process on first completion
    if (!isCompleted || processedRef.current) {
      return;
    }

    processedRef.current = true;

    // Build LessonRunInput
    const runInput = {
      lessonId,
      score,
      maxScore,
      correctCount,
      completedAt: new Date(),
      mode,
    };

    // Apply lesson run using functional update to get latest state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGamificationState((currentState) => {
      const { state: updatedState, newlyUnlockedBadges: newBadges } = applyLessonRun(
        currentState,
        runInput
      );

      // Save updated state
      saveGamificationStateSafe(updatedState);

      // Update newly unlocked badges
      setNewlyUnlockedBadges(newBadges);

      return updatedState;
    });
  }, [isCompleted, lessonId, score, maxScore, correctCount, mode]);

  return {
    gamificationState,
    newlyUnlockedBadges,
  };
}
