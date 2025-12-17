# Bilingual Feature Architecture Diagram

## System Architecture

```mermaid
graph TB
    subgraph "UI Layer"
        LP[Lesson Player]
        LT[Language Toggle]
        MCI[Multiple Choice Item]
        OEI[Open Ended Item]
        CPI[Checkpoint Item]
    end
    
    subgraph "State Management"
        LS[localStorage<br/>la:displayLanguage]
        DL[displayLanguage State]
    end
    
    subgraph "Helper Layer"
        I18N[getLocalizedText Helper]
    end
    
    subgraph "Data Layer"
        ES[Enhanced Schema]
        EM[Effective Meetings<br/>with i18n data]
        RM[React Hooks Intro<br/>original data]
    end
    
    LT --> DL
    DL --> LS
    LS --> DL
    DL --> I18N
    LP --> LT
    LP --> DL
    DL --> MCI
    DL --> OEI
    DL --> CPI
    MCI --> I18N
    OEI --> I18N
    CPI --> I18N
    I18N --> ES
    ES --> EM
    ES --> RM
    
    style LT fill:#e1f5fe
    style I18N fill:#f3e5f5
    style ES fill:#e8f5e8
```

## Data Flow for Text Localization

```mermaid
sequenceDiagram
    participant User
    participant LT as Language Toggle
    participant LP as Lesson Player
    participant IC as Item Component
    participant I18N as getLocalizedText
    participant Data as Lesson Data
    
    User->>LT: Clicks language toggle
    LT->>LP: Updates displayLanguage
    LP->>LP: Saves to localStorage
    LP->>IC: Passes displayLanguage prop
    IC->>I18N: getLocalizedText(i18nText, fallback, language)
    I18N->>Data: Checks for translation
    Data-->>I18N: Returns translation or undefined
    I18N-->>IC: Returns localized text or fallback
    IC-->>User: Displays localized content
```

## Schema Extension Structure

```mermaid
classDiagram
    class I18nText {
        +Record~string, string~
    }
    
    class MultipleChoiceOption {
        +string id
        +string text
        +I18nText textI18n
    }
    
    class MultipleChoiceItem {
        +string id
        +string prompt
        +I18nText promptI18n
        +MultipleChoiceOption[] options
        +string[] correctOptionIds
        +string explanation
        +I18nText explanationI18n
    }
    
    class OpenEndedItem {
        +string id
        +string prompt
        +I18nText promptI18n
        +string placeholder
        +I18nText placeholderI18n
        +string guidance
        +I18nText guidanceI18n
    }
    
    class CheckpointItem {
        +string id
        +string message
        +I18nText messageI18n
        +string actionHint
        +I18nText actionHintI18n
    }
    
    I18nText --> MultipleChoiceOption
    I18nText --> MultipleChoiceItem
    I18nText --> OpenEndedItem
    I18nText --> CheckpointItem
```

## Component Hierarchy with Language Support

```mermaid
graph TD
    LP[Lesson Player] --> LT[Language Toggle]
    LP --> LS[Lesson Summary]
    LP --> LH[Level Header]
    LP --> IC[Item Container]
    
    IC --> MCI[Multiple Choice Item]
    IC --> OEI[Open Ended Item]
    IC --> CPI[Checkpoint Item]
    
    LP -.->|displayLanguage| MCI
    LP -.->|displayLanguage| OEI
    LP -.->|displayLanguage| CPI
    
    MCI --> GT[getLocalizedText]
    OEI --> GT
    CPI --> GT
    
    style LP fill:#e3f2fd
    style LT fill:#fff3e0
    style GT fill:#f1f8e9