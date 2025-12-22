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
          prompt: 'Explain why the sky is blue.',
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
          message: 'Nice work finishing the lesson.',
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
})
