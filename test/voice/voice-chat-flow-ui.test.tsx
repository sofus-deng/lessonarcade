import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { VoiceChatFlow } from '@/components/lesson/voice-chat-flow'
import type { LessonArcadeLesson } from '@/lib/lessonarcade/schema'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const createMockLesson = (): LessonArcadeLesson => ({
  id: 'test-lesson',
  slug: 'test-lesson',
  title: 'Test Lesson',
  shortDescription: 'Test description',
  longDescription: 'Test long description',
  estimatedDurationMinutes: 10,
  tags: ['test'],
  language: 'en',
  video: {
    provider: 'youtube',
    videoId: 'test-video'
  },
  levels: [
    {
      id: 'level-1',
      index: 0,
      title: 'Test Level',
      summary: 'Test summary',
      keyPoints: ['Test point'],
      items: [
        {
          kind: 'multiple_choice',
          id: 'mc-1',
          prompt: 'What is test answer?',
          promptI18n: { zh: '测试答案是什么？' },
          options: [
            { id: 'opt-1', text: 'Option 1', textI18n: { zh: '选项1' } },
            { id: 'opt-2', text: 'Option 2', textI18n: { zh: '选项2' } }
          ],
          correctOptionIds: ['opt-2'],
          explanation: 'Option 2 is correct.',
          explanationI18n: { zh: '选项2是正确的。' }
        }
      ]
    }
  ]
})

describe('Voice Chat Flow UI', () => {
  let mockLesson: LessonArcadeLesson

  beforeEach(() => {
    mockLesson = createMockLesson()
    localStorageMock.getItem.mockReturnValue('en')
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<VoiceChatFlow lesson={mockLesson} />)
    
    // Just verify it renders something
    expect(document.body).toBeInTheDocument()
  })

  it('does not autoplay on mount', () => {
    render(<VoiceChatFlow lesson={mockLesson} />)
    
    // Verify that no audio elements are present or playing on mount
    const audioElements = document.querySelectorAll('audio')
    expect(audioElements).toHaveLength(0)
  })

  it('does not persist specific answers in localStorage', () => {
    render(<VoiceChatFlow lesson={mockLesson} />)
    
    // Verify no localStorage writes for specific answers
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
      expect.stringContaining('option'),
      expect.any(String)
    )
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
      expect.stringContaining('answer'),
      expect.any(String)
    )
  })
})