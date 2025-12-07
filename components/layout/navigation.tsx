"use client"

import { Button } from "@/components/ui/button"
import { motion } from "motion/react"

export function Navigation() {
  return (
    <motion.nav 
      className="w-full border-b border-la-border/20 bg-la-bg/95 backdrop-blur-sm sticky top-0 z-50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-la-surface">
              Lesson<span className="text-la-accent">Arcade</span>
            </h1>
          </div>

          {/* Navigation Links and CTAs */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-la-surface hover:text-la-accent">
              For creators
            </Button>
            <Button variant="ghost" className="text-la-surface hover:text-la-accent">
              For teams
            </Button>
            <Button className="bg-la-accent text-la-bg hover:bg-la-accent/90">
              Try LessonArcade
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}