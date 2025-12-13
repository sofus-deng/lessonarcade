# Final Scoring Implementation Plan (Updated with Constraints)

## Key Constraints Applied

1. **Single Submission Impact**: Streak and scoring only affected on FIRST submission per multiple choice item
2. **Simple Locking**: Lock answers after first selection, NO "Change answer" functionality
3. **Open-ended Storage Only**: Store open-ended answers but they don't affect scoring

## Implementation Details

### State Structure
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

### Critical Implementation Rules

1. **Multiple Choice Items**:
   - On first selection: Immediately lock and submit
   - Calculate score and update streak ONLY on this first submission
   - Subsequent clicks are ignored (locked state)
   - Use `isSubmitted` flag to prevent re-scoring

2. **Open-Ended Items**:
   - Store answer in textarea
   - Mark as "answered" when non-empty
   - 0 points, no streak impact

3. **Checkpoint Items**:
   - No interaction needed
   - 0 points, no scoring impact

### File Modifications

1. **components/lesson/lesson-player.tsx**:
   - Replace `selectedAnswers` with `answeredItems` (AnswerState)
   - Add `scoringState` for scores and streak
   - Implement `handleSubmitAnswer` with single-submission logic
   - Pass `isLocked` prop to MultipleChoiceItem

2. **components/lesson/items/multiple-choice-item.tsx**:
   - Add `isLocked` prop
   - Disable clicks when `isLocked` is true
   - Remove "Change answer" functionality (not in this step)
   - Show points earned after locking

3. **components/lesson/level-header.tsx**:
   - Add LevelStats component
   - Display: answered count, points earned, current streak

4. **components/lesson/level-sidebar.tsx**:
   - Add progress indicators per level
   - Show answered items count and points per level

### UI Elements

**Level Header Stats**:
```
Answered: 2/3  |  Points: 25  |  Streak: 🔥 2
```

**Sidebar Level Indicators**:
- Visual checkmark or progress bar
- Points earned per level
- Answered items count

## Animation Plan

- Animate stats row updates (opacity/transform)
- Streak fire icon pulse on increase
- Smooth transitions for progress indicators
- Micro-interactions on option selection (before locking)