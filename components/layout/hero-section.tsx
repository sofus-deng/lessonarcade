"use client"

import { Button } from "@/components/ui/button"
import { FadeInSection } from "./fade-in-section"
import { motion } from "motion/react"
import { Play, CheckCircle, BarChart3 } from "lucide-react"

export function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-la-bg px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <FadeInSection direction="up" delay={0.2}>
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-la-surface mb-6 leading-tight">
                Turn teaching videos into
                <span className="text-la-accent"> playable lessons</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-la-muted mb-8 max-w-2xl mx-auto lg:mx-0">
                LessonArcade transforms training clips, webinars, and teaching videos into interactive sessions with checkpoints, quick challenges, and recap cards – built for creators, teams, and curious learners.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-la-accent text-la-bg hover:bg-la-accent/90 text-lg px-8 py-3"
                >
                  Play a demo lesson
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-la-border text-la-surface hover:bg-la-muted/20 text-lg px-8 py-3"
                >
                  For creators
                </Button>
              </div>
            </div>
          </FadeInSection>

          {/* Hero Visual */}
          <FadeInSection direction="right" delay={0.4}>
            <div className="relative">
              <motion.div
                className="bg-la-surface rounded-2xl shadow-2xl p-6 border border-la-border/20"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Video Thumbnail Placeholder */}
                <div className="relative rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-la-primary/20 to-la-accent/20 h-48 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/20" />
                  <motion.div
                    className="relative z-10 bg-la-accent rounded-full p-4 cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-8 h-8 text-la-bg" fill="currentColor" />
                  </motion.div>
                </div>
                
                {/* Lesson Info */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-la-bg">
                    Introduction to React Hooks
                  </h3>
                  <p className="text-la-muted text-sm">
                    12 min • 5 checkpoints • 3 challenges
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-la-border/30 rounded-full h-2">
                    <motion.div 
                      className="bg-la-accent h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "35%" }}
                      transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                    />
                  </div>
                  
                  {/* Interactive Elements */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-la-muted text-sm">
                      <CheckCircle className="w-4 h-4 text-la-accent" />
                      <span>2 completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-la-muted text-sm">
                      <BarChart3 className="w-4 h-4 text-la-primary" />
                      <span>85% score</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 bg-la-primary text-la-surface rounded-lg px-3 py-2 text-sm font-medium shadow-lg"
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Interactive
              </motion.div>
              
              <motion.div
                className="absolute -bottom-4 -left-4 bg-la-accent text-la-bg rounded-lg px-3 py-2 text-sm font-medium shadow-lg"
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
              >
                Engaging
              </motion.div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  )
}