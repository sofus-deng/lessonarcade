"use client"

import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import Link from "next/link"

export function Navigation() {
  return (
    <motion.nav 
      className="w-full border-b border-la-border/20 bg-la-bg/95 backdrop-blur-sm sticky top-0 z-50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-la-surface hover:text-la-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg rounded">
              Lesson<span className="text-la-accent">Arcade</span>
            </Link>
          </div>

          {/* Navigation Links and CTAs */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button asChild variant="ghost" className="text-la-surface hover:text-la-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg">
              <Link href="#creators">
                For creators
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-la-surface hover:text-la-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg">
              <Link href="#teams">
                For teams
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-la-surface hover:text-la-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg">
              <Link href="/agents">
                Voice Conversation
              </Link>
            </Button>
            <Button asChild className="bg-la-accent text-la-bg hover:bg-la-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg">
              <Link href="/demo">
                Try LessonArcade
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
