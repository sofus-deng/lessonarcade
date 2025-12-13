# Scoring Implementation Plan for LessonArcade Demo Lesson

## Overview
This plan outlines the implementation of basic answering + scoring mechanics for the Demo Lesson, including multiple choice scoring, streak tracking, and UI updates.

## Implementation Steps

### 1. Enhanced State Management in LessonPlayer

#### New Interfaces
```typescript
interface AnswerState {
  selectedOptions: string[]  // Current selected options
  isSubmitted: boolean       // Whether the answer has been submitted/locked
  isCorrect?: boolean        // Whether the answer is correct (for multiple choice)
  pointsEarned?: number      // Points earned for this answer
}

interface ScoringState {
  totalScore: number         // Total points across all levels
  levelScores: Record<string, number>  // Points per level ID
  streak: number             // Current consecutive correct answers
  answeredItems: Record<string, AnswerState>  // Enhanced answer tracking
}
```

#### State Updates
- Replace `selectedAnswers` with `answeredItems` using `AnswerState` interface
- Add `scoringState` to track scores and streak
- Update `handleAnswerSelect` to handle submission and scoring

### 2. Scoring Logic Implementation

#### Multiple Choice Scoring Function
```typescript
const calculateMultipleChoiceScore = (item: LessonArcadeMultipleChoiceItem, selectedOptions: string[]) => {
  // Check if answer is correct
  const isCorrect = 
    selectedOptions.length === item.correctOptionIds.length &&
    selectedOptions.every(option => item.correctOptionIds.includes(option))
  
  // Calculate points
  const points = isCorrect ? (item.points || 1) : 0
  
  return { isCorrect, points }
}
```

#### Answer Submission Handler
```typescript
const handleSubmitAnswer = (itemId: string, item: LessonArcadeItem) => {
  if (item.kind === 'multiple_choice') {
    const currentAnswer = answeredItems[itemId]
    if (currentAnswer && !currentAnswer.isSubmitted) {
      // First submission - calculate score and update streak
      const { isCorrect, points } = calculateMultipleChoiceScore(item, currentAnswer.selectedOptions)
      
      // Update answered items
      setAnsweredItems(prev => ({
        ...prev,
        [itemId]: {
          ...currentAnswer,
          isSubmitted: true,
          isCorrect,
          pointsEarned: points
        }
      }))
      
      // Update scoring state
      updateScoringState(itemId, item, isCorrect, points)
    }
  } else if (item.kind === 'open_ended') {
    // Mark as answered but no points
    const currentAnswer = answeredItems[itemId]
    if (currentAnswer && !currentAnswer.isSubmitted) {
      setAnsweredItems(prev => ({
        ...prev,
        [itemId]: {
          ...currentAnswer,
          isSubmitted: true,
          pointsEarned: 0
        }
      }))
    }
  }
}
```

### 3. Streak Logic Implementation

```typescript
const updateScoringState = (itemId: string, item: LessonArcadeItem, isCorrect: boolean, points: number) => {
  // Find which level this item belongs to
  const level = lesson.levels.find(l => l.items.some(i => i.id === itemId))
  const levelId = level?.id || ''
  
  setScoringState(prev => {
    const newLevelScores = { ...prev.levelScores }
    newLevelScores[levelId] = (newLevelScores[levelId] || 0) + points
    
    // Update streak based on multiple choice correctness
    let newStreak = prev.streak
    if (item.kind === 'multiple_choice') {
      if (isCorrect) {
        newStreak = prev.streak + 1
      } else {
        newStreak = 0
      }
    }
    
    return {
      totalScore: prev.totalScore + points,
      levelScores: newLevelScores,
      streak: newStreak,
      answeredItems: prev.answeredItems
    }
  })
}
```

### 4. UI Updates

#### Level Header Stats Component
```typescript
const LevelStats = ({ levelId }: { levelId: string }) => {
  const level = lesson.levels.find(l => l.id === levelId)
  if (!level) return null
  
  const answeredCount = level.items.filter(item => 
    answeredItems[item.id]?.isSubmitted
  ).length
  
  const levelScore = scoringState.levelScores[levelId] || 0
  
  return (
    <motion.div 
      className="flex items-center gap-6 text-sm"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      key={`${levelId}-${answeredCount}-${levelScore}-${scoringState.streak}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-la-muted">Answered:</span>
        <span className="font-medium text-la-bg">{answeredCount}/{level.items.length}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-la-muted">Points:</span>
        <span className="font-medium text-la-primary">{levelScore}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-la-muted">Streak:</span>
        <motion.span 
          className="font-medium text-la-accent"
          animate={{ scale: scoringState.streak > 0 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          🔥 {scoringState.streak}
        </motion.span>
      </div>
    </motion.div>
  )
}
```

#### Sidebar Progress Indicators
```typescript
// In LevelSidebar component, add progress indicator to each level button
const getLevelProgress = (levelId: string) => {
  const level = levels.find(l => l.id === levelId)
  if (!level) return { answered: 0, total: 0, points: 0 }
  
  const answered = level.items.filter(item => answeredItems[item.id]?.isSubmitted).length
  const points = scoringState.levelScores[levelId] || 0
  
  return { answered, total: level.items.length, points }
}
```

### 5. Multiple Choice Item Interaction Updates

#### Lock Answers After Submission
- Add `isLocked` prop to MultipleChoiceItem
- Disable option clicks after submission
- Add "Change Answer" button if needed (optional for this step)

#### Enhanced Feedback
- Show points earned after submission
- Display streak impact (e.g., "Streak +1!" or "Streak reset")

### 6. Animation Enhancements

- Animate stats row updates in LevelHeader
- Add micro-interactions for streak changes
- Smooth transitions for progress indicators in sidebar

## File Changes Summary

1. **components/lesson/lesson-player.tsx**
   - Add new state interfaces
   - Implement scoring logic
   - Add streak tracking
   - Pass enhanced props to child components

2. **components/lesson/level-header.tsx**
   - Add LevelStats component
   - Display answered count, points, and streak

3. **components/lesson/level-sidebar.tsx**
   - Add progress indicators per level
   - Show answered items count and points

4. **components/lesson/items/multiple-choice-item.tsx**
   - Add answer locking mechanism
   - Enhance feedback display
   - Show points earned

## Testing Checklist

- [ ] Multiple choice items score correctly
- [ ] Streak increases on correct answers
- [ ] Streak resets on incorrect answers
- [ ] Open-ended items don't affect streak
- [ ] Checkpoint items don't affect scoring
- [ ] UI updates show correct values
- [ ] Animations work smoothly
- [ ] Build passes without errors
- [ ] Lint passes without warnings