/**
 * Browser-safe localStorage wrapper for gamification state.
 * All localStorage access is isolated in this module.
 */

import type { GamificationState } from "./gamification";
import { getInitialGamificationState } from "./gamification";

export const GAMIFICATION_STORAGE_KEY = "lessonarcade_progress_v1";

/**
 * Load the gamification state from localStorage.
 *
 * Returns the initial state if:
 * - window is not available (server-side rendering)
 * - no stored value exists
 * - JSON parsing fails
 */
export function loadGamificationStateSafe(): GamificationState {
  if (typeof window === "undefined") {
    return getInitialGamificationState();
  }

  try {
    const stored = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!stored) {
      return getInitialGamificationState();
    }

    const parsed = JSON.parse(stored) as GamificationState;
    return parsed;
  } catch (error) {
    // If parsing fails, return initial state
    console.warn("Failed to parse gamification state from localStorage:", error);
    return getInitialGamificationState();
  }
}

/**
 * Save the gamification state to localStorage.
 *
 * Does nothing if window is not available (server-side rendering).
 */
export function saveGamificationStateSafe(state: GamificationState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save gamification state to localStorage:", error);
  }
}

/**
 * Clear the gamification state from localStorage.
 *
 * Does nothing if window is not available (server-side rendering).
 * This is primarily useful for testing or resetting progress.
 */
export function clearGamificationStateSafe(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(GAMIFICATION_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear gamification state from localStorage:", error);
  }
}
