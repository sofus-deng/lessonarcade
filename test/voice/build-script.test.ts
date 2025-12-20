import { describe, it, expect } from 'vitest'
import { buildVoiceScript } from '@/lib/lessonarcade/voice/build-script'
import type { LessonArcadeLesson, LessonArcadeMultipleChoiceItem, LessonArcadeOpenEndedItem, LessonArcadeCheckpointItem } from '@/lib/lessonarcade/schema'

// Mock lesson data for testing
const createMockLesson = (): LessonArcadeLesson => ({
  id: 'test-lesson',
  slug: 'test-lesson',
  title: 'Test Lesson',
  shortDescription: 'A test lesson',
  longDescription: 'A detailed test lesson description',
  estimatedDurationMinutes: 30,
  tags: ['test'],
  language: 'en',
  video: {
    provider: 'youtube',
    videoId: 'test-video-id'
  },
  levels: [
    {
      id: 'level-1',
      index: 0,
      title: 'Introduction Level',
      summary: 'Introduction to topic',
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      items: [
        {
          kind: 'multiple_choice',
          id: 'mc-item-1',
          prompt: 'What is capital of France?',
          promptI18n: {
            zh: '法国的首都是什么？'
          },
          options: [
            {
              id: 'option-1',
              text: 'London',
              textI18n: {
                zh: '伦敦'
              }
            },
            {
              id: 'option-2',
              text: 'Paris',
              textI18n: {
                zh: '巴黎'
              }
            },
            {
              id: 'option-3',
              text: 'Berlin',
              textI18n: {
                zh: '柏林'
              }
            }
          ],
          correctOptionIds: ['option-2'],
          explanation: 'Paris is capital of France.',
          explanationI18n: {
            zh: '巴黎是法国的首都。'
          }
        } as LessonArcadeMultipleChoiceItem,
        {
          kind: 'open_ended',
          id: 'oe-item-1',
          prompt: 'Describe your favorite hobby.',
          promptI18n: {
            zh: '描述你最喜欢的爱好。'
          },
          placeholder: 'Enter your answer here...',
          placeholderI18n: {
            zh: '在此输入您的答案...'
          },
          guidance: 'Be specific and provide examples.',
          guidanceI18n: {
            zh: '请具体并提供例子。'
          }
        } as LessonArcadeOpenEndedItem,
        {
          kind: 'checkpoint',
          id: 'cp-item-1',
          message: 'Great job completing this section!',
          messageI18n: {
            zh: '完成这部分做得很好！'
          },
          actionHint: 'Click Next to continue.',
          actionHintI18n: {
            zh: '点击下一步继续。'
          }
        } as LessonArcadeCheckpointItem
      ]
    }
  ]
})

describe('buildVoiceScript', () => {
  const mockLesson = createMockLesson()

  it('should throw error for invalid level index', () => {
    expect(() => buildVoiceScript({
      lesson: mockLesson,
      levelIndex: -1,
      itemIndex: 0,
      displayLanguage: 'en',
      includeKeyPoints: true
    })).toThrow('Invalid level index: -1')

    expect(() => buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 999,
      itemIndex: 0,
      displayLanguage: 'en',
      includeKeyPoints: true
    })).toThrow('Invalid level index: 999')
  })

  it('should throw error for invalid item index', () => {
    expect(() => buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: -1,
      displayLanguage: 'en',
      includeKeyPoints: true
    })).toThrow('Invalid item index: -1')

    expect(() => buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 999,
      displayLanguage: 'en',
      includeKeyPoints: true
    })).toThrow('Invalid item index: 999')
  })

  it('should build script for multiple choice item in English', () => {
    const script = buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 0,
      displayLanguage: 'en',
      includeKeyPoints: true
    })

    expect(script).toContain('Introduction Level')
    expect(script).toContain('Key points:')
    expect(script).toContain('Key point 1')
    expect(script).toContain('Key point 2')
    expect(script).toContain('Key point 3')
    expect(script).toContain('What is capital of France?')
    expect(script).toContain('The options are:')
    expect(script).toContain('A. London')
    expect(script).toContain('B. Paris')
    expect(script).toContain('C. Berlin')
  })

  it('should build script for multiple choice item in Chinese', () => {
    const script = buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 0,
      displayLanguage: 'zh',
      includeKeyPoints: true
    })

    expect(script).toContain('Introduction Level')
    expect(script).toContain('重點：')
    expect(script).toContain('法国的首都是什么？')
    expect(script).toContain('選項是：')
    expect(script).toContain('A. 伦敦')
    expect(script).toContain('B. 巴黎')
    expect(script).toContain('C. 柏林')
  })

  it('should build script for open ended item in English', () => {
    const script = buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 1,
      displayLanguage: 'en',
      includeKeyPoints: false
    })

    expect(script).toContain('Introduction Level')
    expect(script).not.toContain('Key points:')
    expect(script).toContain('Describe your favorite hobby.')
    expect(script).toContain('Please answer.')
  })

  it('should build script for open ended item in Chinese', () => {
    const script = buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 1,
      displayLanguage: 'zh',
      includeKeyPoints: false
    })

    expect(script).toContain('Introduction Level')
    expect(script).not.toContain('重點：')
    expect(script).toContain('描述你最喜欢的爱好。')
    expect(script).toContain('請作答。')
  })

  it('should build script for checkpoint item in English', () => {
    const script = buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 2,
      displayLanguage: 'en',
      includeKeyPoints: false
    })

    expect(script).toContain('Introduction Level')
    expect(script).not.toContain('Key points:')
    expect(script).toContain('Great job completing this section!')
    expect(script).toContain('Click Next to continue.')
  })

  it('should build script for checkpoint item in Chinese', () => {
    const script = buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 2,
      displayLanguage: 'zh',
      includeKeyPoints: false
    })

    expect(script).toContain('Introduction Level')
    expect(script).not.toContain('重點：')
    expect(script).toContain('完成这部分做得很好！')
    expect(script).toContain('点击下一步继续。')
  })

  it('should handle missing i18n translations gracefully', () => {
    const lessonWithoutI18n = { ...mockLesson }
    // Remove i18n from first multiple choice option
    const mcItem = lessonWithoutI18n.levels[0].items[0] as LessonArcadeMultipleChoiceItem
    mcItem.options = [
      {
        id: 'option-1',
        text: 'London',
        textI18n: undefined
      },
      ...mcItem.options.slice(1)
    ]

    const script = buildVoiceScript({
      lesson: lessonWithoutI18n,
      levelIndex: 0,
      itemIndex: 0,
      displayLanguage: 'zh',
      includeKeyPoints: true
    })

    // Should fall back to English text
    expect(script).toContain('A. London')
  })

  it('should handle checkpoint without action hint', () => {
    const lessonWithoutActionHint = { ...mockLesson }
    // Remove action hint from checkpoint
    const cpItem = lessonWithoutActionHint.levels[0].items[2] as LessonArcadeCheckpointItem
    const checkpointWithoutHint: LessonArcadeCheckpointItem = {
      ...cpItem,
      actionHint: undefined,
      actionHintI18n: undefined
    }
    lessonWithoutActionHint.levels[0].items[2] = checkpointWithoutHint

    const script = buildVoiceScript({
      lesson: lessonWithoutActionHint,
      levelIndex: 0,
      itemIndex: 2,
      displayLanguage: 'en',
      includeKeyPoints: false
    })

    expect(script).toContain('Great job completing this section!')
    expect(script).not.toContain('Click Next to continue.')
  })

  it('should include key points only when requested', () => {
    const scriptWithKeyPoints = buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 0,
      displayLanguage: 'en',
      includeKeyPoints: true
    })

    const scriptWithoutKeyPoints = buildVoiceScript({
      lesson: mockLesson,
      levelIndex: 0,
      itemIndex: 0,
      displayLanguage: 'en',
      includeKeyPoints: false
    })

    expect(scriptWithKeyPoints).toContain('Key points:')
    expect(scriptWithKeyPoints).toContain('Key point 1')

    expect(scriptWithoutKeyPoints).not.toContain('Key points:')
    expect(scriptWithoutKeyPoints).not.toContain('Key point 1')
  })

  it('should handle level without key points', () => {
    const lessonWithoutKeyPoints = { ...mockLesson }
    lessonWithoutKeyPoints.levels[0].keyPoints = []

    const script = buildVoiceScript({
      lesson: lessonWithoutKeyPoints,
      levelIndex: 0,
      itemIndex: 0,
      displayLanguage: 'en',
      includeKeyPoints: true
    })

    expect(script).toContain('Introduction Level')
    expect(script).not.toContain('Key points:')
  })

  it('should format options with correct letter prefixes', () => {
    // Create a lesson with more options to test letter prefixing
    const lessonWithManyOptions = { ...mockLesson }
    const mcItem = lessonWithManyOptions.levels[0].items[0] as LessonArcadeMultipleChoiceItem
    mcItem.options = [
      { id: 'a', text: 'First option', textI18n: {} },
      { id: 'b', text: 'Second option', textI18n: {} },
      { id: 'c', text: 'Third option', textI18n: {} },
      { id: 'd', text: 'Fourth option', textI18n: {} },
      { id: 'e', text: 'Fifth option', textI18n: {} }
    ]

    const script = buildVoiceScript({
      lesson: lessonWithManyOptions,
      levelIndex: 0,
      itemIndex: 0,
      displayLanguage: 'en',
      includeKeyPoints: false
    })

    expect(script).toContain('A. First option')
    expect(script).toContain('B. Second option')
    expect(script).toContain('C. Third option')
    expect(script).toContain('D. Fourth option')
    expect(script).toContain('E. Fifth option')
  })
})