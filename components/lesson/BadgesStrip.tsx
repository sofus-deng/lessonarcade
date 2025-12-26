/**
 * BadgesStrip component for displaying unlocked badges.
 *
 * Renders a horizontal list of badges that are unlocked.
 * Visually highlights badges that are newly unlocked.
 */

"use client";

import { motion } from "motion/react";
import type { Badge, BadgeId } from "@/lib/lessonarcade/gamification";

export interface BadgesStripProps {
  allBadges: Badge[];
  unlockedBadgeIds: BadgeId[];
  newlyUnlockedBadgeIds?: BadgeId[];
}

export function BadgesStrip({
  allBadges,
  unlockedBadgeIds,
  newlyUnlockedBadgeIds = [],
}: BadgesStripProps) {
  // Filter to only show unlocked badges
  const unlockedBadges = allBadges.filter((badge) => unlockedBadgeIds.includes(badge.id));

  if (unlockedBadges.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-3 mb-6"
      data-testid="la-badges-strip"
    >
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-la-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <h3 className="text-sm font-medium text-la-muted">Badges</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {unlockedBadges.map((badge, index) => {
          const isNewlyUnlocked = newlyUnlockedBadgeIds.includes(badge.id);

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
              className={`
                relative px-4 py-2 rounded-lg border
                ${isNewlyUnlocked ? "bg-la-accent/10 border-la-accent" : "bg-la-surface border-la-border"}
              `}
            >
              {isNewlyUnlocked && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-la-accent rounded-full"
                >
                  <motion.div
                    className="absolute inset-0 bg-la-accent rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  />
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                <BadgeIcon badgeId={badge.id} />
                <div>
                  <div className="text-sm font-medium text-la-bg">{badge.label}</div>
                  <div className="text-xs text-la-muted">{badge.description}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function BadgeIcon({ badgeId }: { badgeId: BadgeId }) {
  switch (badgeId) {
    case "first-lesson":
      return (
        <svg className="w-5 h-5 text-la-primary" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
        </svg>
      );
    case "five-lessons":
      return (
        <svg className="w-5 h-5 text-la-primary" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    case "perfect-score":
      return (
        <svg className="w-5 h-5 text-la-accent" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "three-day-streak":
      return (
        <svg className="w-5 h-5 text-la-primary" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      );
    default:
      return null;
  }
}
