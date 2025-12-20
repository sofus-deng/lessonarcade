# Voice Presets Architecture Diagram

## System Flow

```mermaid
graph TD
    A[Client: Voice Lesson Player] -->|1. Load Component| B[Check localStorage for saved preset]
    B -->|2. Fetch presets| C[GET /api/voice/presets]
    C -->|3. Read env vars| D[Preset Registry]
    D -->|4. Return sanitized list| C
    C -->|5. Return presets| A
    A -->|6. User selects preset| E[Update localStorage]
    A -->|7. Request TTS| F[POST /api/voice/tts]
    F -->|8. Resolve preset| G[Preset Registry]
    G -->|9. Get voiceId| H[Validate against allowed set]
    H -->|10. Generate audio| I[ElevenLabs API]
    I -->|11. Return audio| F
    F -->|12. Return audio| A

    subgraph "Server Side"
        D
        G
        H
        C
        F
    end

    subgraph "Environment Variables"
        J[ELEVENLABS_VOICE_ID_EN]
        K[ELEVENLABS_VOICE_ID_ZH]
        L[VOICE_TTS_VOICE_ID_EN_INSTRUCTOR]
        M[VOICE_TTS_VOICE_ID_EN_NARRATOR]
        N[VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR]
        O[VOICE_TTS_VOICE_ID_ZH_NARRATOR]
    end

    D --> J
    D --> K
    D --> L
    D --> M
    D --> N
    D --> O
```

## Component Architecture

```mermaid
graph LR
    subgraph "Client Components"
        A[voice-lesson-player.tsx]
        B[Preset Selector UI]
        C[localStorage Manager]
    end

    subgraph "API Layer"
        D[/api/voice/presets]
        E[/api/voice/tts]
    end

    subgraph "Core Logic"
        F[preset-registry.ts]
        G[voice/constants.ts]
        H[voice/chunk-text.ts]
    end

    subgraph "External Services"
        I[ElevenLabs API]
    end

    A --> B
    A --> C
    B --> D
    A --> E
    D --> F
    E --> F
    F --> G
    E --> H
    E --> I
```

## Data Flow

### Preset Resolution Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as /api/voice/tts
    participant Registry as Preset Registry
    participant Env as Environment
    participant ElevenLabs

    Client->>API: POST with voicePreset
    API->>Registry: resolvePreset(voicePreset)
    Registry->>Env: Read VOICE_TTS_VOICE_ID_*
    Env-->>Registry: Return voiceId
    Registry-->>API: Return resolved voiceId
    API->>API: Validate voiceId
    API->>ElevenLabs: Request TTS with voiceId
    ElevenLabs-->>API: Return audio
    API-->>Client: Return audio
```

### Preset List Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as /api/voice/presets
    participant Registry as Preset Registry
    participant Env as Environment

    Client->>API: GET /api/voice/presets
    API->>Registry: getAvailablePresets()
    Registry->>Env: Read all VOICE_TTS_VOICE_ID_*
    Env-->>Registry: Return available presets
    Registry->>Registry: Sanitize (remove voiceIds)
    Registry-->>API: Return {presetKey, label, languageCode}
    API-->>Client: Return preset list
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> Loading: Component mounts
    Loading --> Ready: Presets loaded
    Loading --> Error: API error
    
    Ready --> Selecting: User clicks selector
    Selecting --> Ready: Preset selected
    Selecting --> Playing: User plays audio
    
    Playing --> Paused: User pauses
    Paused --> Playing: User resumes
    Playing --> Ready: Audio completes
    Playing --> Error: Audio error
    
    Error --> Loading: Retry
    Ready --> [*]: Component unmounts
```

## Environment Variable Mapping

```mermaid
graph TD
    A[Environment Variables] --> B[Preset Registry]
    
    subgraph "Default Voices (Backward Compatible)"
        C[ELEVENLABS_VOICE_ID_EN]
        D[ELEVENLABS_VOICE_ID_ZH]
    end
    
    subgraph "New Preset Voices"
        E[VOICE_TTS_VOICE_ID_EN_INSTRUCTOR]
        F[VOICE_TTS_VOICE_ID_EN_NARRATOR]
        G[VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR]
        H[VOICE_TTS_VOICE_ID_ZH_NARRATOR]
    end
    
    C --> B
    D --> B
    E --> B
    F --> B
    G --> B
    H --> B
    
    B --> I[Available Presets]
    I --> J[en_instructor: English Instructor]
    I --> K[en_narrator: English Narrator]
    I --> L[zh_instructor: 中文讲师]
    I --> M[zh_narrator: 中文旁白]