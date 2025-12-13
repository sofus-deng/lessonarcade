# Scoring System Architecture Diagram

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> LessonPlayer
    LessonPlayer --> AnswerState
    LessonPlayer --> ScoringState
    
    AnswerState --> MultipleChoiceItem
    AnswerState --> OpenEndedItem
    AnswerState --> CheckpointItem
    
    MultipleChoiceItem --> calculateMultipleChoiceScore
    calculateMultipleChoiceScore --> updateScoringState
    
    updateScoringState --> ScoringState
    ScoringState --> LevelHeader
    ScoringState --> LevelSidebar
    
    LevelHeader --> LevelStats
    LevelSidebar --> ProgressIndicators
```

## Component Data Flow

```mermaid
graph TD
    A[LessonPlayer] --> B[AnswerState]
    A --> C[ScoringState]
    A --> D[LevelHeader]
    A --> E[LevelSidebar]
    A --> F[MultipleChoiceItem]
    A --> G[OpenEndedItem]
    A --> H[CheckpointItem]
    
    B --> F
    B --> G
    C --> D
    C --> E
    
    F --> I[handleSubmitAnswer]
    G --> I
    I --> J[updateScoringState]
    J --> C
    
    D --> K[LevelStats]
    E --> L[ProgressIndicators]
```

## Scoring Logic Flow

```mermaid
flowchart TD
    A[User selects answer] --> B{Item type?}
    B -->|Multiple Choice| C[Calculate score]
    B -->|Open Ended| D[Mark as answered, 0 points]
    B -->|Checkpoint| E[No action]
    
    C --> F{Is correct?}
    F -->|Yes| G[Increase streak]
    F -->|No| H[Reset streak]
    
    G --> I[Update total score]
    H --> I
    D --> I
    I --> J[Update UI]
```

## State Structure

```mermaid
classDiagram
    class LessonPlayer {
        -currentLevelIndex: number
        -answeredItems: Record<string, AnswerState>
        -scoringState: ScoringState
        +handleAnswerSelect(itemId, optionIds)
        +handleSubmitAnswer(itemId, item)
        +updateScoringState(itemId, item, isCorrect, points)
    }
    
    class AnswerState {
        +selectedOptions: string[]
        +isSubmitted: boolean
        +isCorrect?: boolean
        +pointsEarned?: number
    }
    
    class ScoringState {
        +totalScore: number
        +levelScores: Record<string, number>
        +streak: number
        +answeredItems: Record<string, AnswerState>
    }
    
    LessonPlayer --> AnswerState
    LessonPlayer --> ScoringState