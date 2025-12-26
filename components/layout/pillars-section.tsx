"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FadeInSection } from "./fade-in-section"
import { motion } from "motion/react"
import { Video, Users, GraduationCap } from "lucide-react"
import Link from "next/link"

const pillars = [
  {
    icon: Video,
    title: "For creators",
    description: "Wrap your existing videos in minutes with questions, prompts, and recap moments. No editing timeline, no complex tooling.",
    features: ["Quick setup", "No editing required", "Interactive elements"],
    delay: 0.2
  },
  {
    icon: Users,
    title: "For teams & training",
    description: "Deliver bite-size, trackable lessons to your team. See who watched, who understood, and where people get stuck.",
    features: ["Team analytics", "Progress tracking", "Insights dashboard"],
    delay: 0.4
  },
  {
    icon: GraduationCap,
    title: "For learners",
    description: "Stay awake and engaged. Play through short challenges, unlock progress, and quickly review what actually matters.",
    features: ["Gamified learning", "Progress rewards", "Quick reviews"],
    delay: 0.6
  }
]

export function PillarsSection() {
  return (
    <section className="py-20 bg-la-bg px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <FadeInSection direction="up" className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-la-surface mb-4">
            Built for everyone in learning ecosystem
          </h2>
          <p className="text-xl text-la-muted max-w-3xl mx-auto">
            Whether you are creating content, managing teams, or hungry to learn, LessonArcade adapts to your needs
          </p>
        </FadeInSection>
        
        {/* Pillars Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <FadeInSection key={index} direction="up" delay={pillar.delay}>
              <motion.div
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                <Card className="h-full border-la-border/20 bg-la-surface shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center pb-4">
                    <motion.div
                      className="w-16 h-16 bg-la-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      whileHover={{ 
                        scale: 1.1,
                        backgroundColor: "rgba(99, 102, 241, 0.2)"
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <pillar.icon className="w-8 h-8 text-la-primary" aria-hidden="true" />
                    </motion.div>
                    <CardTitle className="text-2xl font-bold text-la-bg">
                      {pillar.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <CardDescription className="text-la-muted text-base leading-relaxed">
                      {pillar.description}
                    </CardDescription>
                    
                    <div className="space-y-2 pt-4">
                      {pillar.features.map((feature, featureIndex) => (
                        <motion.div
                          key={featureIndex}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: pillar.delay + 0.8 + featureIndex * 0.1,
                            duration: 0.5
                          }}
                        >
                          <div className="w-2 h-2 bg-la-accent rounded-full" aria-hidden="true" />
                          <span className="text-sm text-la-bg font-medium">
                            {feature}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeInSection>
          ))}
        </div>
        
        {/* Call to Action */}
        <FadeInSection direction="up" delay={0.8} className="text-center mt-16">
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="bg-gradient-to-r from-la-primary to-la-accent p-1 rounded-lg">
              <div className="bg-la-bg rounded-lg px-8 py-6">
                <h2 className="text-2xl font-bold text-la-surface mb-2">
                  Ready to transform your learning experience?
                </h2>
                <p className="text-la-muted mb-4">
                  Join thousands of creators, teams, and learners already using LessonArcade
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild className="bg-la-accent text-la-bg hover:bg-la-accent/90 font-medium py-3 px-6 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg">
                    <Link href="/studio">
                      Start creating lessons
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-la-border text-la-surface hover:bg-la-muted/20 font-medium py-3 px-6 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg">
                    <Link href="#case-studies">
                      View case studies
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </FadeInSection>
      </div>
    </section>
  )
}
