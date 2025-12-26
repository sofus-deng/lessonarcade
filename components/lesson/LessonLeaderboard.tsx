/**
 * LessonLeaderboard component for displaying local leaderboard per lesson.
 *
 * Filters history by lessonId, sorts by score descending (then completedAt descending),
 * and renders the top 5 runs in a simple table.
 */

"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LessonRunSummary } from "@/lib/lessonarcade/gamification";

export interface LessonLeaderboardProps {
  lessonId: string;
  history: LessonRunSummary[];
}

export function LessonLeaderboard({ lessonId, history }: LessonLeaderboardProps) {
  // Filter history by lessonId
  const lessonHistory = history.filter((run) => run.lessonId === lessonId);

  // Sort by score descending, then completedAt descending
  const sortedHistory = [...lessonHistory].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score; // Higher score first
    }
    return b.completedAt.localeCompare(a.completedAt); // Latest first if scores tie
  });

  // Get top 5 runs
  const topRuns = sortedHistory.slice(0, 5);

  if (topRuns.length === 0) {
    return null;
  }

  // Format date for display
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-6"
      data-testid="la-leaderboard"
    >
      <Card className="bg-la-surface border-la-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-la-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <CardTitle className="text-lg text-la-bg">Your Best Runs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-la-border/20">
                  <th className="text-left py-2 px-3 text-xs font-medium text-la-muted uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-la-muted uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-la-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-la-muted uppercase tracking-wider">
                    Mode
                  </th>
                </tr>
              </thead>
              <tbody>
                {topRuns.map((run, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="border-b border-la-border/10 last:border-0 hover:bg-la-border/5"
                  >
                    <td className="py-2 px-3">
                      <RankBadge rank={index + 1} />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-la-bg">{run.score}</span>
                        <span className="text-la-muted text-sm">/ {run.maxScore}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-sm text-la-muted">
                      {formatDate(run.completedAt)}
                    </td>
                    <td className="py-2 px-3">
                      <ModeBadge mode={run.mode} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-400/20 text-gray-400 text-xs font-bold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-la-border/20 text-la-muted text-xs">
      {rank}
    </span>
  );
}

function ModeBadge({ mode }: { mode: "focus" | "arcade" }) {
  if (mode === "focus") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-la-primary/10 text-la-primary">
        Focus
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-la-accent/10 text-la-accent">
      Arcade
    </span>
  );
}
