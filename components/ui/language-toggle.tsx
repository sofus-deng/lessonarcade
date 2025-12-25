"use client"

import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/ui/cn'
import type { LanguageCode } from '@/lib/lessonarcade/schema'

interface LanguageToggleProps {
  currentLanguage: LanguageCode
  onLanguageChange: (language: LanguageCode) => void
  className?: string
}

export function LanguageToggle({ 
  currentLanguage, 
  onLanguageChange, 
  className 
}: LanguageToggleProps) {
  const languages = [
    { code: 'en' as LanguageCode, label: 'EN', flag: '🇺🇸' },
    { code: 'zh' as LanguageCode, label: 'ZH', flag: '🇨🇳' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "inline-flex rounded-lg border border-la-border bg-la-surface p-1 shadow-sm",
        "focus-within:ring-2 focus-within:ring-la-accent/50 focus-within:ring-offset-2 focus-within:ring-offset-la-bg",
        className
      )}
    >
      {languages.map((lang) => (
        <motion.div key={lang.code} className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLanguageChange(lang.code)}
              className={cn(
                "relative z-10 px-3 py-1.5 text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-la-surface",
                currentLanguage === lang.code
                  ? "bg-la-primary text-white shadow-sm"
                  : "text-la-muted hover:text-la-bg hover:bg-la-muted/20"
              )}
            >
              <span className="mr-1.5">{lang.flag}</span>
              {lang.label}
            </Button>
          </motion.div>
          
          {currentLanguage === lang.code && (
            <motion.div
              layoutId="activeLanguage"
              className="absolute inset-0 z-0 rounded-md bg-la-primary shadow-sm"
              initial={false}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
