# Voice Lesson Player UI Enhancement Specification

## Overview
This document specifies the UI enhancements to the voice lesson player component to support voice preset selection.

## Component Location
`components/lesson/voice-lesson-player.tsx`

## New State Management

### State Variables
```typescript
// Preset-related state
const [availablePresets, setAvailablePresets] = useState<AvailablePreset[]>([])
const [selectedPresetKey, setSelectedPresetKey] = useState<string>(() => {
  // Initialize from localStorage or default
  if (typeof window !== 'undefined') {
    return localStorage.getItem('la:voicePresetKey') || ''
  }
  return ''
})
const [presetsLoading, setPresetsLoading] = useState(true)
const [presetsError, setPresetsError] = useState<string | null>(null)
```

### Data Types
```typescript
interface AvailablePreset {
  presetKey: string
  label: string
  languageCode: 'en' | 'zh'
}
```

## UI Components

### Preset Selector Placement
The preset selector should be placed in the voice controls section, below the voice engine toggle and above the status indicator.

### Segmented Control (Primary UI)
```typescript
// Render when presets.length <= 5
<div className="flex items-center gap-2">
  <span className="text-sm text-la-muted">Voice:</span>
  <div className="flex gap-1">
    {availablePresets
      .filter(preset => preset.languageCode === displayLanguage)
      .map(preset => (
        <Button
          key={preset.presetKey}
          variant={selectedPresetKey === preset.presetKey ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetChange(preset.presetKey)}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}
  </div>
</div>
```

### Dropdown (Fallback UI)
```typescript
// Render when presets.length > 5
<div className="flex items-center gap-2">
  <span className="text-sm text-la-muted">Voice:</span>
  <select
    value={selectedPresetKey}
    onChange={(e) => handlePresetChange(e.target.value)}
    className="text-xs px-2 py-1 border border-la-border rounded"
  >
    <option value="">Select voice...</option>
    {availablePresets
      .filter(preset => preset.languageCode === displayLanguage)
      .map(preset => (
        <option key={preset.presetKey} value={preset.presetKey}>
          {preset.label}
        </option>
      ))}
  </select>
</div>
```

## Lifecycle Management

### Component Mount
```typescript
useEffect(() => {
  // Fetch presets when AI voice engine is selected
  if (voiceEngine === 'ai' && isAIVoiceAvailable) {
    fetchPresets()
  }
}, [voiceEngine, isAIVoiceAvailable])

const fetchPresets = async () => {
  setPresetsLoading(true)
  setPresetsError(null)
  
  try {
    const response = await fetch('/api/voice/presets')
    const data = await response.json()
    
    if (data.ok) {
      setAvailablePresets(data.presets)
      
      // Validate selected preset is still available
      if (selectedPresetKey) {
        const isStillAvailable = data.presets.some(
          preset => preset.presetKey === selectedPresetKey
        )
        
        if (!isStillAvailable) {
          // Fall back to first available preset for current language
          const fallbackPreset = data.presets.find(
            preset => preset.languageCode === displayLanguage
          )
          if (fallbackPreset) {
            handlePresetChange(fallbackPreset.presetKey)
          }
        }
      }
    } else {
      setPresetsError(data.error?.message || 'Failed to load presets')
    }
  } catch (error) {
    setPresetsError('Network error loading presets')
  } finally {
    setPresetsLoading(false)
  }
}
```

### Preset Change Handler
```typescript
const handlePresetChange = (presetKey: string) => {
  setSelectedPresetKey(presetKey)
  
  // Persist to localStorage
  if (typeof window !== 'undefined') {
    if (presetKey) {
      localStorage.setItem('la:voicePresetKey', presetKey)
    } else {
      localStorage.removeItem('la:voicePresetKey')
    }
  }
  
  // Stop any current playback to apply new voice
  stopSpeech()
}
```

## Integration with TTS API

### Update fetchAudioChunk Function
```typescript
const fetchAudioChunk = async (text: string, signal: AbortSignal): Promise<Blob> => {
  const requestBody: any = {
    text,
    rate: speechRate,
    lang: displayLanguage
  }
  
  // Use preset if available, otherwise use voiceId
  if (selectedPresetKey) {
    requestBody.voicePreset = selectedPresetKey
  } else if (selectedVoiceId) {
    requestBody.voiceId = selectedVoiceId
  }
  
  const response = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal
  })
  
  // ... rest of existing error handling
}
```

## Error Handling

### Preset Loading Error
```typescript
{presetsError && (
  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
    Voice presets unavailable: {presetsError}
  </div>
)}
```

### No Presets Available
```typescript
{!presetsLoading && availablePresets.length === 0 && (
  <div className="text-xs text-la-muted">
    No voice presets configured
  </div>
)}
```

### No Presets for Current Language
```typescript
{!presetsLoading && 
 availablePresets.length > 0 && 
 availablePresets.filter(p => p.languageCode === displayLanguage).length === 0 && (
  <div className="text-xs text-la-muted">
    No voice presets available for {displayLanguage === 'en' ? 'English' : 'Chinese'}
  </div>
)}
```

## Responsive Design

### Mobile Layout
- Stack controls vertically on small screens
- Use full-width buttons for preset selection
- Ensure touch-friendly button sizes

### Desktop Layout
- Keep horizontal layout for preset selector
- Optimize button spacing
- Maintain consistent alignment with other controls

## Accessibility

### Keyboard Navigation
- Preset selector must be keyboard navigable
- Support arrow keys for segmented control
- Support Tab/Enter for selection

### Screen Reader Support
- Proper ARIA labels for preset selector
- Announce preset changes to screen readers
- Provide context for preset selection

### Focus Management
- Clear focus indicators for selected preset
- Logical tab order through controls
- Focus trapping in modal dialogs (if any)

## Performance Considerations

### Preset Fetching
- Fetch presets only when AI voice engine is selected
- Cache presets in component state
- Avoid unnecessary re-fetches

### State Updates
- Batch state updates to prevent re-renders
- Use useCallback for event handlers
- Optimize re-render conditions

### Memory Management
- Clean up fetch requests on unmount
- Remove event listeners properly
- Clear localStorage if needed

## Testing Strategy

### Unit Tests
1. Test preset fetching on mount
2. Test preset change handling
3. Test localStorage persistence
4. Test fallback behavior for unavailable presets
5. Test language filtering of presets

### Integration Tests
1. Test complete flow with preset selection
2. Test TTS API integration with presets
3. Test error handling scenarios
4. Test responsive behavior

### Visual Tests
1. Verify segmented control appearance
2. Verify dropdown fallback appearance
3. Test error state display
4. Verify responsive layout

## Migration Notes

### Backward Compatibility
- Existing voiceId state maintained for browser engine
- No breaking changes to existing API
- Graceful fallback if no presets configured

### Data Migration
- No existing data to migrate
- New localStorage key: `la:voicePresetKey`
- Optional - doesn't break if missing

## Future Enhancements

1. **Voice Preview**
   - Add preview button for each preset
   - Play sample text with selected voice
   - Visual feedback during preview

2. **Preset Categories**
   - Group presets by category (e.g., Male, Female, Accent)
   - Expandable/collapsible sections
   - Category filtering

3. **Custom Presets**
   - Allow users to create custom presets
   - Store user preferences
   - Sync with user accounts