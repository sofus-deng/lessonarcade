"use client"

import { motion } from "motion/react"
import { ReactNode, useRef } from "react"

interface FadeInSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right"
  once?: boolean
}

export function FadeInSection({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  direction = "up",
  once = true,
}: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 40, opacity: 0 }
      case "down":
        return { y: -40, opacity: 0 }
      case "left":
        return { x: 40, opacity: 0 }
      case "right":
        return { x: -40, opacity: 0 }
      default:
        return { y: 40, opacity: 0 }
    }
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitialPosition()}
      whileInView={{ 
        x: 0, 
        y: 0, 
        opacity: 1 
      }}
      viewport={{ 
        once: once, 
        amount: 0.3 
      }}
      transition={{ 
        duration: duration, 
        delay: delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  )
}