import { getLocalizedText } from '@/lib/lessonarcade/i18n'
import type {
  LessonArcadeLesson,
  LessonArcadeItem,
  LessonArcadeMultipleChoiceItem,
  LessonArcadeOpenEndedItem,
  LessonArcadeCheckpointItem,
  LanguageCode
} from '@/lib/lessonarcade/schema'

export type ChatRole = 'system' | 'user'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  ts: number
}

export type ChatFlowState = {
  lessonSlug: string
  levelIndex: number
  itemIndex: number
  started: boolean
  finished: boolean
  messages: ChatMessage[]
  answeredCount: number
  correctCount: number
  displayLanguage: LanguageCode
  includeKeyPoints: boolean
}

export type ChatFlowInitOptions = {
  displayLanguage?: LanguageCode
  includeKeyPoints?: boolean
}

export type ChatFlowAnswerPayload =
  | { kind: 'multiple_choice'; optionId: string }
  | { kind: 'open_ended'; text: string }

const DEFAULT_LANGUAGE: LanguageCode = 'en'

const createMessageId = (state: ChatFlowState, indexOffset: number, ts: number) =>
  `${state.lessonSlug}-${ts}-${state.messages.length + indexOffset}`

const appendMessages = (
  state: ChatFlowState,
  newMessages: Array<{ role: ChatRole; text: string }>
): ChatFlowState => {
  const ts = Date.now()
  const messages = newMessages.map((message, index) => ({
    id: createMessageId(state, index, ts),
    role: message.role,
    text: message.text,
    ts
  }))

  return {
    ...state,
    messages: [...state.messages, ...messages]
  }
}

const getCurrentLevel = (lesson: LessonArcadeLesson, state: ChatFlowState) =>
  lesson.levels[state.levelIndex]

const getCurrentItem = (lesson: LessonArcadeLesson, state: ChatFlowState) =>
  getCurrentLevel(lesson, state).items[state.itemIndex]

const formatOptionLabel = (index: number) => String.fromCharCode(65 + index)

const buildLevelIntroMessages = (
  lesson: LessonArcadeLesson,
  state: ChatFlowState
): Array<{ role: ChatRole; text: string }> => {
  const level = getCurrentLevel(lesson, state)
  const messages: Array<{ role: ChatRole; text: string }> = [
    {
      role: 'system',
      text: `Level ${state.levelIndex + 1}: ${level.title}`
    }
  ]

  if (state.includeKeyPoints && level.keyPoints.length > 0) {
    messages.push({
      role: 'system',
      text: `Key points: ${level.keyPoints.join(' · ')}`
    })
  }

  return messages
}

const buildPromptText = (
  item: LessonArcadeItem,
  language: LanguageCode
): string => {
  if (item.kind === 'multiple_choice') {
    const multipleChoiceItem = item as LessonArcadeMultipleChoiceItem
    const prompt = getLocalizedText(
      multipleChoiceItem.promptI18n,
      multipleChoiceItem.prompt,
      language
    )
    const optionsText = multipleChoiceItem.options
      .map((option, index) => {
        const optionText = getLocalizedText(option.textI18n, option.text, language)
        return `${formatOptionLabel(index)}. ${optionText}`
      })
      .join('\n')
    return `${prompt}\nOptions:\n${optionsText}`
  }

  if (item.kind === 'open_ended') {
    const openEndedItem = item as LessonArcadeOpenEndedItem
    return getLocalizedText(openEndedItem.promptI18n, openEndedItem.prompt, language)
  }

  const checkpointItem = item as LessonArcadeCheckpointItem
  return getLocalizedText(checkpointItem.messageI18n, checkpointItem.message, language)
}

const buildMultipleChoiceFeedback = (
  item: LessonArcadeMultipleChoiceItem,
  optionId: string,
  language: LanguageCode
): { text: string; isCorrect: boolean; selectedLabel: string } => {
  const selectedIndex = item.options.findIndex(option => option.id === optionId)
  const selectedOption = item.options[selectedIndex]
  const selectedLabel = selectedOption
    ? `${formatOptionLabel(selectedIndex)}. ${getLocalizedText(selectedOption.textI18n, selectedOption.text, language)}`
    : 'Unknown option'

  const correctOptionIds = new Set(item.correctOptionIds)
  const isCorrect = correctOptionIds.has(optionId)
  const correctOptions = item.options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => correctOptionIds.has(option.id))
    .map(({ option, index }) => {
      const optionText = getLocalizedText(option.textI18n, option.text, language)
      return `${formatOptionLabel(index)}. ${optionText}`
    })

  const feedbackPrefix = isCorrect ? 'Correct.' : 'Incorrect.'
  const answerLabel = correctOptions.length > 1 ? 'Correct answers' : 'Correct answer'
  const feedback = `${feedbackPrefix} ${answerLabel}: ${correctOptions.join(', ')}`

  return {
    text: feedback,
    isCorrect,
    selectedLabel
  }
}

export const initChatFlow = (
  lesson: LessonArcadeLesson,
  options: ChatFlowInitOptions = {}
): ChatFlowState => {
  return {
    lessonSlug: lesson.slug,
    levelIndex: 0,
    itemIndex: 0,
    started: false,
    finished: false,
    messages: [],
    answeredCount: 0,
    correctCount: 0,
    displayLanguage: options.displayLanguage ?? DEFAULT_LANGUAGE,
    includeKeyPoints: options.includeKeyPoints ?? true
  }
}

export const startChatFlow = (
  state: ChatFlowState,
  lesson: LessonArcadeLesson
): ChatFlowState => {
  if (state.started || state.finished) {
    return state
  }

  const introMessages = buildLevelIntroMessages(lesson, state)
  const currentItem = getCurrentItem(lesson, state)
  const prompt = buildPromptText(currentItem, state.displayLanguage)
  const withIntro = appendMessages(state, introMessages)
  const withPrompt = appendMessages(withIntro, [{ role: 'system', text: prompt }])

  return {
    ...withPrompt,
    started: true
  }
}

export const submitAnswer = (
  state: ChatFlowState,
  lesson: LessonArcadeLesson,
  payload: ChatFlowAnswerPayload
): ChatFlowState => {
  if (state.finished) {
    return state
  }

  const currentItem = getCurrentItem(lesson, state)

  if (payload.kind === 'multiple_choice' && currentItem.kind === 'multiple_choice') {
    const feedback = buildMultipleChoiceFeedback(
      currentItem,
      payload.optionId,
      state.displayLanguage
    )
    const withUser = appendMessages(state, [
      { role: 'user', text: feedback.selectedLabel }
    ])
    const withFeedback = appendMessages(withUser, [
      { role: 'system', text: feedback.text }
    ])

    return {
      ...withFeedback,
      answeredCount: state.answeredCount + 1,
      correctCount: state.correctCount + (feedback.isCorrect ? 1 : 0)
    }
  }

  if (payload.kind === 'open_ended' && currentItem.kind === 'open_ended') {
    const withUser = appendMessages(state, [
      { role: 'user', text: payload.text }
    ])
    return appendMessages(withUser, [
      { role: 'system', text: 'Received.' }
    ])
  }

  return state
}

export const nextStep = (
  state: ChatFlowState,
  lesson: LessonArcadeLesson
): ChatFlowState => {
  if (state.finished || !state.started) {
    return state
  }

  const level = getCurrentLevel(lesson, state)
  const isLastItemInLevel = state.itemIndex >= level.items.length - 1
  const isLastLevel = state.levelIndex >= lesson.levels.length - 1

  if (isLastItemInLevel && isLastLevel) {
    const summaryParts = [
      'Lesson complete.',
      state.answeredCount > 0
        ? `Score: ${state.correctCount}/${state.answeredCount} correct.`
        : null
    ].filter(Boolean)

    const withSummary = appendMessages(state, [
      { role: 'system', text: summaryParts.join(' ') }
    ])

    return {
      ...withSummary,
      finished: true
    }
  }

  if (isLastItemInLevel) {
    const levelComplete = appendMessages(state, [
      { role: 'system', text: `Level ${state.levelIndex + 1} complete.` }
    ])
    const nextLevelState: ChatFlowState = {
      ...levelComplete,
      levelIndex: state.levelIndex + 1,
      itemIndex: 0
    }
    const introMessages = buildLevelIntroMessages(lesson, nextLevelState)
    const withIntro = appendMessages(nextLevelState, introMessages)
    const nextItem = getCurrentItem(lesson, nextLevelState)
    const prompt = buildPromptText(nextItem, nextLevelState.displayLanguage)
    return appendMessages(withIntro, [{ role: 'system', text: prompt }])
  }

  const advancedState: ChatFlowState = {
    ...state,
    itemIndex: state.itemIndex + 1
  }
  const nextItem = getCurrentItem(lesson, advancedState)
  const prompt = buildPromptText(nextItem, advancedState.displayLanguage)
  return appendMessages(advancedState, [{ role: 'system', text: prompt }])
}
