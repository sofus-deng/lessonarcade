# Screenshots Guide

This directory contains visual assets for the LessonArcade press kit. All screenshots should follow the naming conventions and guidelines below.

## Naming Convention

All screenshots should use the following format:
```
{feature}-{action}-{state}.{ext}
```

### Components:
- **feature**: The main feature being showcased (e.g., voice-player, analytics, studio)
- **action**: The specific action or view (e.g., playing, paused, dashboard)
- **state**: Optional state descriptor (e.g., active, empty, error)
- **ext**: File extension (prefer .png for quality, .webp for size)

### Examples:
- `voice-player-playing.png` - Voice player in active playback state
- `analytics-dashboard-empty.png` - Analytics dashboard with no data
- `studio-auth-login.png` - Studio authentication login screen
- `demo-lesson-selection.png` - Demo page showing lesson selection

## Required Screenshots

### 1. Core Application Screens
- [ ] `demo-homepage.png` - Main demo page showing lesson selection
- [ ] `demo-lesson-grid.png` - Grid view of available lessons
- [ ] `demo-lesson-detail.png` - Individual lesson detail view
- [ ] `demo-voice-lesson.png` - Voice-enabled lesson in action

### 2. Voice Player Screens
- [ ] `voice-player-idle.png` - Voice player before playback starts
- [ ] `voice-player-playing.png` - Voice player during audio playback
- [ ] `voice-player-paused.png` - Voice player in paused state
- [ ] `voice-player-controls.png` - Close-up of playback controls
- [ ] `voice-player-language-toggle.png` - Language switcher (EN/ZH)

### 3. Studio & Analytics Screens
- [ ] `studio-login.png` - Basic authentication login screen
- [ ] `studio-dashboard.png` - Main studio dashboard
- [ ] `analytics-overview.png` - Voice analytics overview page
- [ ] `analytics-completion-rates.png` - Completion rate metrics
- [ ] `analytics-top-interruptions.png` - Interruption points analysis
- [ ] `analytics-language-breakdown.png` - Language usage statistics

### 4. Technical Screens
- [ ] `api-response-success.png` - Successful API response example
- [ ] `api-response-error.png` - Error handling example
- [ ] `rate-limit-active.png` - Rate limiting in action
- [ ] `telemetry-events.png` - Telemetry event logging

### 5. Mobile Responsive Screens
- [ ] `mobile-lesson-list.png` - Lesson list on mobile device
- [ ] `mobile-voice-player.png` - Voice player on mobile device
- [ ] `mobile-analytics.png` - Analytics view on mobile device

## Screenshot Guidelines

### Technical Requirements
- **Resolution**: Minimum 1920x1080 for desktop, 375x667 for mobile
- **Format**: PNG for high-quality images, WebP for optimized web use
- **File Size**: Keep under 2MB per image
- **Browser**: Use Chrome/Firefox with developer tools reset

### Visual Guidelines
- **Clean State**: Clear browser cache and cookies before capturing
- **Consistent UI**: Use the same theme/settings across all screenshots
- **No Personal Data**: Blur or remove any sensitive information
- **Highlight Features**: Use subtle annotations if needed (optional)

### Content Guidelines
- **Real Data**: Use realistic lesson content and analytics data
- **Active State**: Show interactive elements in their active state
- **Complete Flow**: Capture key user journey steps
- **Error States**: Include error handling examples where relevant

## Annotation Guidelines (Optional)

If adding annotations to screenshots:
- **Color**: Use a consistent color scheme (e.g., blue #3B82F6)
- **Arrows**: Simple, clean arrows pointing to key features
- **Text**: Minimal text, using sans-serif fonts
- **Boxes**: Subtle highlights around important areas

## File Organization

```
screenshots/
├── README.md                 # This file
├── .gitkeep                 # Placeholder to ensure directory is tracked
├── desktop/                 # Desktop screenshots (1920x1080+)
│   ├── core/               # Core application screens
│   ├── voice/              # Voice player specific
│   ├── studio/             # Studio and analytics
│   └── technical/          # Technical/API screenshots
└── mobile/                  # Mobile screenshots (375x667)
    ├── core/
    ├── voice/
    └── studio/
```

## Image Optimization

Before committing:
1. **Compress images**: Use tools like TinyPNG or ImageOptim
2. **Remove metadata**: Strip EXIF data for privacy
3. **Consistent naming**: Follow the convention strictly
4. **Check file sizes**: Ensure images are web-optimized

## Usage in Documentation

These screenshots are used in:
- Press kit materials and presentations
- GitHub repository README
- Technical documentation
- Marketing materials
- Demo recordings

## Quality Checklist

Before adding a screenshot:
- [ ] Resolution meets requirements
- [ ] File follows naming convention
- [ ] Image is properly compressed
- [ ] No sensitive information visible
- [ ] Content is relevant and current
- [ ] Visual quality is sharp and clear

---

**Note**: Do not commit binary files directly to this directory. Use the `.gitkeep` file to ensure the directory structure is tracked, and add screenshots as needed following the guidelines above.