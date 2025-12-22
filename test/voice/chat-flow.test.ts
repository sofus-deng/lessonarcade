import { describe, it, expect } from 'vitest'
import {
  initChatFlow,
  startChatFlow,
  submitAnswer,
  nextStep
} from '@/lib/lessonarcade/voice/chat-flow'
import type {
  LessonArcadeLesson,
  LessonArcadeMultipleChoiceItem,
  LessonArcadeOpenEndedItem,
  LessonArcadeCheckpointItem
} from '@/lib/lessonarcade/schema'

const createMockLesson = (): LessonArcadeLesson => ({
  id: 'lesson-1',
  slug: 'lesson-1',
  title: 'Mock Lesson',
  shortDescription: 'Short description',
  longDescription: 'Long description',
  estimatedDurationMinutes: 20,
  tags: ['mock'],
  language: 'en',
  video: {
    provider: 'youtube',
    videoId: 'video-1'
  },
  levels: [
    {
      id: 'level-1',
      index: 0,
      title: 'Basics',
      summary: 'Basics summary',
      keyPoints: ['Key point A', 'Key point B'],
      items: [
        {
          kind: 'multiple_choice',
          id: 'mc-1',
          prompt: 'What is 2 + 2?',
          promptI18n: { zh: '2 + 2 等于多少？' },
          options: [
            { id: 'option-1', text: '3', textI18n: { zh: '三' } },
            { id: 'option-2', text: '4', textI18n: { zh: '四' } }
          ],
          correctOptionIds: ['option-2'],
          explanation: '2 + 2 = 4.',
          explanationI18n: { zh: '2 + 2 = 4。' }
        } as LessonArcadeMultipleChoiceItem,
        {
          kind: 'open_ended',
          id: 'oe-1',
          prompt: 'Explain why sky is blue.',
          promptI18n: { zh: '解释天空为什么是蓝色的。' }
        } as LessonArcadeOpenEndedItem
      ]
    },
    {
      id: 'level-2',
      index: 1,
      title: 'Wrap Up',
      summary: 'Wrap up summary',
      keyPoints: ['Key point C'],
      items: [
        {
          kind: 'checkpoint',
          id: 'cp-1',
          message: 'Nice work finishing lesson.',
          messageI18n: { zh: '完成课程，做得好。' }
        } as LessonArcadeCheckpointItem
      ]
    }
  ]
})

describe('chat flow state machine', () => {
  it('startChatFlow produces opening + first prompt', () => {
    const lesson = createMockLesson()
    const state = initChatFlow(lesson, { displayLanguage: 'en', includeKeyPoints: true })
    const started = startChatFlow(state, lesson)

    expect(started.started).toBe(true)
    expect(started.messages).toHaveLength(3)
    expect(started.messages[0].text).toContain('Level 1')
    expect(started.messages[1].text).toContain('Key points')
    expect(started.messages[2].text).toContain('What is 2 + 2?')
  })

  it('submitAnswer for multiple_choice adds user + feedback messages', () => {
    const lesson = createMockLesson()
    const state = startChatFlow(initChatFlow(lesson), lesson)
    const answered = submitAnswer(state, lesson, {
      kind: 'multiple_choice',
      optionId: 'option-2'
    })

    expect(answered.messages).toHaveLength(state.messages.length + 2)
    const [userMessage, feedbackMessage] = answered.messages.slice(-2)
    expect(userMessage.role).toBe('user')
    expect(userMessage.text).toContain('4')
    expect(feedbackMessage.role).toBe('system')
    expect(feedbackMessage.text).toContain('Correct')
    expect(answered.answeredCount).toBe(1)
    expect(answered.correctCount).toBe(1)
  })

  it('open_ended submit adds user + received messages', () => {
    const lesson = createMockLesson()
    const state = startChatFlow(initChatFlow(lesson), lesson)
    const moved = nextStep(state, lesson)
    const answered = submitAnswer(moved, lesson, {
      kind: 'open_ended',
      text: 'Because of atmospheric scattering.'
    })

    expect(answered.messages).toHaveLength(moved.messages.length + 2)
    const [userMessage, receivedMessage] = answered.messages.slice(-2)
    expect(userMessage.role).toBe('user')
    expect(receivedMessage.role).toBe('system')
    expect(receivedMessage.text).toContain('Received')
    expect(answered.answeredCount).toBe(0)
    expect(answered.correctCount).toBe(0)
  })

  it('nextStep advances through items, levels, and ends the lesson', () => {
    const lesson = createMockLesson()
    let state = startChatFlow(initChatFlow(lesson), lesson)

    state = nextStep(state, lesson)
    expect(state.levelIndex).toBe(0)
    expect(state.itemIndex).toBe(1)

    state = nextStep(state, lesson)
    expect(state.levelIndex).toBe(1)
    expect(state.itemIndex).toBe(0)
    expect(state.messages.some(message => message.text.includes('Level 1 complete'))).toBe(true)

    state = nextStep(state, lesson)
    expect(state.finished).toBe(true)
    expect(state.messages[state.messages.length - 1].text).toContain('Lesson complete')
  })

  // New tests for stats tracking behavior
  describe('stats tracking', () => {
    it('answeredCount and correctCount increment only for multiple choice', () => {
      const lesson = createMockLesson()
      let state = startChatFlow(initChatFlow(lesson), lesson)

      // Answer multiple choice correctly
      state = submitAnswer(state, lesson, {
        kind: 'multiple_choice',
        optionId: 'option-2'
      })
      expect(state.answeredCount).toBe(1)
      expect(state.correctCount).toBe(1)

      // Move to open ended
      state = nextStep(state, lesson)
      
      // Answer open ended
      state = submitAnswer(state, lesson, {
        kind: 'open_ended',
        text: 'Some answer'
      })
      // Stats should not change for open ended
      expect(state.answeredCount).toBe(1)
      expect(state.correctCount).toBe(1)
    })

    it('incorrect multiple choice increments answeredCount but not correctCount', () => {
      const lesson = createMockLesson()
      const state = startChatFlow(initChatFlow(lesson), lesson)
      const answered = submitAnswer(state, lesson, {
        kind: 'multiple_choice',
        optionId: 'option-1' // Incorrect answer
      })

      expect(answered.answeredCount).toBe(1)
      expect(answered.correctCount).toBe(0)
    })

    it('checkpoint items do not affect stats', () => {
      const lesson = createMockLesson()
      let state = startChatFlow(initChatFlow(lesson), lesson)
      
      // Answer multiple choice
      state = submitAnswer(state, lesson, {
        kind: 'multiple_choice',
        optionId: 'option-2'
      })
      
      // Move to open ended
      state = nextStep(state, lesson)
      
      // Answer open ended
      state = submitAnswer(state, lesson, {
        kind: 'open_ended',
        text: 'Some answer'
      })
      
      // Move to checkpoint
      state = nextStep(state, lesson)
      
      // Checkpoint should not affect stats
      expect(state.answeredCount).toBe(1)
      expect(state.correctCount).toBe(1)
    })

    it('multiple correct answers in multiple choice are handled correctly', () => {
      const lessonWithMultipleCorrect: LessonArcadeLesson = {
        ...createMockLesson(),
        levels: [
          {
            ...createMockLesson().levels[0],
            items: [
              {
                kind: 'multiple_choice',
                id: 'mc-multi',
                prompt: 'Select all correct options',
                promptI18n: { zh: '选择所有正确选项' },
                options: [
                  { id: 'opt-1', text: 'Option 1', textI18n: { zh: '选项1' } },
                  { id: 'opt-2', text: 'Option 2', textI18n: { zh: '选项2' } },
                  { id: 'opt-3', text: 'Option 3', textI18n: { zh: '选项3' } }
                ],
                correctOptionIds: ['opt-1', 'opt-3'],
                explanation: 'Options 1 and 3 are correct.',
                explanationI18n: { zh: '选项1和3是正确的。' }
              } as LessonArcadeMultipleChoiceItem
            ]
          }
        ]
      }

      const state = startChatFlow(initChatFlow(lessonWithMultipleCorrect), lessonWithMultipleCorrect)
      
      // Select one correct answer
      const answered1 = submitAnswer(state, lessonWithMultipleCorrect, {
        kind: 'multiple_choice',
        optionId: 'opt-1'
      })
      expect(answered1.answeredCount).toBe(1)
      expect(answered1.correctCount).toBe(1)

      // Select incorrect answer
      const answered2 = submitAnswer(state, lessonWithMultipleCorrect, {
        kind: 'multiple_choice',
        optionId: 'opt-2'
      })
      expect(answered2.answeredCount).toBe(1)
      expect(answered2.correctCount).toBe(0)
    })

    it('stats are preserved across level transitions', () => {
      const lesson = createMockLesson()
      let state = startChatFlow(initChatFlow(lesson), lesson)

      // Answer multiple choice in level 1
      state = submitAnswer(state, lesson, {
        kind: 'multiple_choice',
        optionId: 'option-2'
      })
      expect(state.answeredCount).toBe(1)
      expect(state.correctCount).toBe(1)

      // Move to open ended in level 1
      state = nextStep(state, lesson)
      state = submitAnswer(state, lesson, {
        kind: 'open_ended',
        text: 'Some answer'
      })

      // Move to checkpoint (level transition)
      state = nextStep(state, lesson)
      expect(state.levelIndex).toBe(1)
      
      // Stats should be preserved
      expect(state.answeredCount).toBe(1)
      expect(state.correctCount).toBe(1)
    })

    it('finished state includes summary with stats', () => {
      const lesson = createMockLesson()
      let state = startChatFlow(initChatFlow(lesson), lesson)

      // Complete all items
      state = submitAnswer(state, lesson, {
        kind: 'multiple_choice',
        optionId: 'option-2'
      })
      state = nextStep(state, lesson)
      state = submitAnswer(state, lesson, {
        kind: 'open_ended',
        text: 'Some answer'
      })
      state = nextStep(state, lesson)
      state = nextStep(state, lesson)

      expect(state.finished).toBe(true)
      expect(state.answeredCount).toBe(1)
      expect(state.correctCount).toBe(1)
      expect(state.messages[state.messages.length - 1].text).toContain('Score: 1/1')
    })
  })
})
