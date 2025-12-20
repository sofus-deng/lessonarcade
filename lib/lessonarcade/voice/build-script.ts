import { getLocalizedText } from '@/lib/lessonarcade/i18n'
import type { LessonArcadeLesson, LanguageCode } from '@/lib/lessonarcade/schema'

/**
 * Parameters for building a voice script
 */
export interface BuildVoiceScriptParams {
  lesson: LessonArcadeLesson
  levelIndex: number
  itemIndex: number
  displayLanguage: LanguageCode
  includeKeyPoints: boolean
}

/**
 * Builds a voice script for the specified lesson item
 * 
 * Rules:
 * - Level title first
 * - Key points (if includeKeyPoints and present), prefixed with a short intro
 * - Then item content based on type:
 *   - multiple_choice: prompt + options intro + each option with letter prefix
 *   - open_ended: prompt + short instruction
 *   - checkpoint: message (+ optional actionHint)
 * 
 * @param params The parameters for building the voice script
 * @returns A string containing the complete voice script
 */
export function buildVoiceScript(params: BuildVoiceScriptParams): string {
  const { lesson, levelIndex, itemIndex, displayLanguage, includeKeyPoints } = params
  
  // Validate indices
  if (levelIndex < 0 || levelIndex >= lesson.levels.length) {
    throw new Error(`Invalid level index: ${levelIndex}`)
  }
  
  const level = lesson.levels[levelIndex]
  if (itemIndex < 0 || itemIndex >= level.items.length) {
    throw new Error(`Invalid item index: ${itemIndex}`)
  }
  
  const item = level.items[itemIndex]
  const script: string[] = []
  
  // Add level title first
  script.push(level.title)
  
  // Add key points if requested and available
  if (includeKeyPoints && level.keyPoints && level.keyPoints.length > 0) {
    const keyPointsIntro = displayLanguage === 'zh' ? '重點：' : 'Key points:'
    script.push(keyPointsIntro)
    level.keyPoints.forEach(point => {
      script.push(point)
    })
  }
  
  // Add item content based on type
  switch (item.kind) {
    case 'multiple_choice':
      // Add the prompt
      script.push(getLocalizedText(
        item.promptI18n,
        item.prompt,
        displayLanguage
      ))
      
      // Add options intro
      const optionsIntro = displayLanguage === 'zh' ? '選項是：' : 'The options are:'
      script.push(optionsIntro)
      
      // Add each option with letter prefix
      item.options.forEach((option, index) => {
        const letterPrefix = String.fromCharCode(65 + index) // A, B, C, ...
        const optionText = getLocalizedText(
          option.textI18n,
          option.text,
          displayLanguage
        )
        script.push(`${letterPrefix}. ${optionText}`)
      })
      break
      
    case 'open_ended':
      // Add the prompt
      script.push(getLocalizedText(
        item.promptI18n,
        item.prompt,
        displayLanguage
      ))
      
      // Add short instruction
      const instruction = displayLanguage === 'zh' ? '請作答。' : 'Please answer.'
      script.push(instruction)
      break
      
    case 'checkpoint':
      // Add the message
      script.push(getLocalizedText(
        item.messageI18n,
        item.message,
        displayLanguage
      ))
      
      // Add action hint if available
      if (item.actionHint) {
        script.push(getLocalizedText(
          item.actionHintI18n,
          item.actionHint,
          displayLanguage
        ))
      }
      break
  }
  
  // Join all parts with spaces and return
  return script.join(' ')
}