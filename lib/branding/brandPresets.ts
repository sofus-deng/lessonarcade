/**
 * Brand preset definitions for LessonArcade theming system.
 *
 * This module provides a simple brand/theme system that allows different
 * LessonArcade deployments to have their own logo/title and color palette.
 */

/**
 * Supported brand identifiers.
 */
export type BrandId = "lessonarcade-default" | "warm-paper" | "night-classroom";

/**
 * Brand preset configuration.
 */
export interface BrandPreset {
  /** Unique identifier for this brand */
  id: BrandId;
  /** Human-readable label for UI display */
  label: string;
  /** Description of the brand/theme */
  description: string;
  /** Logo text to display */
  logoText: string;
  /** Primary color for buttons, links, and key interactive elements */
  primaryColor: string;
  /** Accent color for highlights, badges, and secondary actions */
  accentColor: string;
  /** Surface color for cards, modals, and elevated elements */
  surfaceColor: string;
  /** Background color for the main page background */
  backgroundColor: string;
}

/**
 * Registry of all available brand presets.
 */
export const BRAND_PRESETS: Record<BrandId, BrandPreset> = {
  "lessonarcade-default": {
    id: "lessonarcade-default",
    label: "LessonArcade Default",
    description: "The original LessonArcade design with deep blue-slate background",
    logoText: "LessonArcade",
    primaryColor: "#6366f1",
    accentColor: "#14b8a6",
    surfaceColor: "#f8fafc",
    backgroundColor: "#1e293b",
  },
  "warm-paper": {
    id: "warm-paper",
    label: "Warm Paper",
    description: "A lighter, paper-like warm palette",
    logoText: "LessonArcade",
    primaryColor: "#d97706",
    accentColor: "#059669",
    surfaceColor: "#fef3c7",
    backgroundColor: "#fffbeb",
  },
  "night-classroom": {
    id: "night-classroom",
    label: "Night Classroom",
    description: "A darker, more cinematic palette",
    logoText: "LessonArcade",
    primaryColor: "#8b5cf6",
    accentColor: "#f43f5e",
    surfaceColor: "#1e1b4b",
    backgroundColor: "#0f172a",
  },
};

/**
 * Get a brand preset by ID.
 *
 * @param id - The brand ID to look up (e.g., from env var or query string)
 * @returns The matching brand preset, or the default preset if the ID is unknown
 */
export function getBrandPreset(id?: string | null): BrandPreset {
  if (id && id in BRAND_PRESETS) {
    return BRAND_PRESETS[id as BrandId];
  }
  return BRAND_PRESETS["lessonarcade-default"];
}
