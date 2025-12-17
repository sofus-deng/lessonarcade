# Bilingual Quiz Items + UI Language Toggle Implementation Plan

## Overview
This plan outlines the implementation of bilingual support for LessonArcade quiz items with a UI language toggle, allowing users to switch between English and Chinese (zh) languages.

## Technical Architecture

### 1. Schema Extensions (lib/lessonarcade/schema.ts)

#### I18nText Type
```typescript
// Extensible internationalization text type
const i18nTextSchema = z.record(z.string(), z.string()).optional()

// Type for language codes
export type LanguageCode = "en" | "zh" | string
export type I18nText = Record<LanguageCode, string>
```

#### Schema Extensions
- **Multiple Choice Item**: Add optional `promptI18n`, `explanationI18n`, and extend options with `textI18n`
- **Open Ended Item**: Add optional `promptI18n`, `guidanceI18n`, `placeholderI18n`
- **Checkpoint Item**: Add optional `messageI18n`, `actionHintI18n`

### 2. Localization Helper (lib/lessonarcade/i18n.ts)

```typescript
// Helper function to get localized text with fallback
export function getLocalizedText(
  i18nText: I18nText | undefined,
  fallbackText: string,
  language: LanguageCode
): string {
  if (!i18nText || !i18nText[language]) {
    return fallbackText
  }
  return i18nText[language]
}
```

### 3. Language Toggle Component (components/ui/language-toggle.tsx)

```typescript
// Toggle component with EN / 中文 options
// Uses shadcn/ui button styling
// Includes motion micro-interactions
// Positioned in top-right of lesson player
```

### 4. Lesson Player Updates (components/lesson/lesson-player.tsx)

#### State Management
```typescript
// Add displayLanguage state with localStorage persistence
const [displayLanguage, setDisplayLanguage] = useState<LanguageCode>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('la:displayLanguage')
    return saved || 'en'
  }
  return 'en'
})

// Persist language changes
const handleLanguageChange = (language: LanguageCode) => {
  setDisplayLanguage(language)
  if (typeof window !== 'undefined') {
    localStorage.setItem('la:displayLanguage', language)
  }
}
```

#### Props Passing
- Pass `displayLanguage` to all item components
- Update `renderItem` function to include language prop

### 5. Item Component Updates

#### Multiple Choice Item (components/lesson/items/multiple-choice-item.tsx)
- Use `getLocalizedText` for prompt, explanation, and option text
- Add `displayLanguage` prop

#### Open Ended Item (components/lesson/items/open-ended-item.tsx)
- Use `getLocalizedText` for prompt, guidance, and placeholder
- Add `displayLanguage` prop

#### Checkpoint Item (components/lesson/items/checkpoint-item.tsx)
- Use `getLocalizedText` for message and actionHint
- Add `displayLanguage` prop

### 6. Demo Data Updates (data/demo-lessons/effective-meetings.json)

Add Chinese translations for at least:
- 1 multiple choice item (prompt + options + explanation)
- 1 open ended item (prompt + guidance + placeholder)
- 1 checkpoint item (message + actionHint)

Example structure:
```json
{
  "prompt": "What is the most important element to include in a meeting invitation?",
  "promptI18n": {
    "zh": "会议邀请中最重要的元素是什么？"
  },
  "options": [
    {
      "id": "a",
      "text": "A list of all potential topics",
      "textI18n": {
        "zh": "所有潜在主题的列表"
      }
    }
  ]
}
```

## Implementation Steps

### Phase 1: Schema & Infrastructure
1. Update schema.ts with I18nText type and extended item schemas
2. Create localization helper function
3. Add displayLanguage state to lesson-player.tsx with localStorage persistence

### Phase 2: UI Components
1. Create language toggle component
2. Update lesson-player.tsx to include language toggle in top-right
3. Pass displayLanguage to all item components

### Phase 3: Item Component Updates
1. Update multiple-choice-item.tsx to use localized text
2. Update open-ended-item.tsx to use localized text
3. Update checkpoint-item.tsx to use localized text

### Phase 4: Content & Testing
1. Add Chinese translations to effective-meetings.json
2. Test language toggle functionality
3. Verify fallback behavior
4. Ensure existing lessons still work

### Phase 5: Quality Assurance
1. Run pnpm lint and fix issues
2. Run pnpm build and fix issues
3. Commit and push to main branch

## Testing Strategy

### Functional Tests
- Language toggle switches between EN and 中文
- Translated content displays correctly when language is switched
- Untranslated content falls back to original English text
- Language preference persists across page reloads
- Existing lessons without translations work unchanged

### Route Tests
- `/demo/lesson/effective-meetings` with language toggle
- `/demo/lesson/react-hooks-intro` (should work unchanged)

### Quality Gates
- `pnpm lint` passes without errors
- `pnpm build` completes successfully
- No TypeScript errors
- All UI components maintain premium styling

## Design Considerations

### UI/UX
- Language toggle positioned in top-right for easy access
- Smooth transitions between language switches
- Consistent styling with existing shadcn/ui components
- Motion micro-interactions for toggle interaction

### Performance
- Minimal re-renders when language changes
- Efficient localStorage access
- Optimized fallback logic

### Extensibility
- I18nText designed to support additional languages in future
- Language toggle can be extended for more languages
- Schema remains backward compatible

## File Structure Changes

```
lib/lessonarcade/
├── schema.ts (modified)
└── i18n.ts (new)

components/
├── ui/
│   └── language-toggle.tsx (new)
└── lesson/
    ├── lesson-player.tsx (modified)
    └── items/
        ├── multiple-choice-item.tsx (modified)
        ├── open-ended-item.tsx (modified)
        └── checkpoint-item.tsx (modified)

data/demo-lessons/
└── effective-meetings.json (modified)
```

## Success Criteria

1. Users can toggle between EN and 中文 languages
2. Translated content displays correctly in the selected language
3. Untranslated content gracefully falls back to English
4. Language preference persists across sessions
5. Existing lessons continue to work without modifications
6. All quality gates pass (lint, build, no errors)