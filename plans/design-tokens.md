# LessonArcade Design Tokens

This document provides a concise reference for all design tokens used in the LessonArcade project. Design tokens are the single source of truth for design decisions, ensuring consistency across the application.

## Colors

Color tokens use the `la-` prefix and are defined as CSS custom properties in [`globals.css`](../app/globals.css).

### Core Palette
- `--la-bg`: #1e293b - Deep blue-slate background
- `--la-surface`: #f8fafc - Soft neutral surface (light mode) / #f1f5f9 (dark mode)
- `--la-primary`: #6366f1 - Violet/indigo primary color
- `--la-accent`: #14b8a6 - Teal/aqua accent color
- `--la-muted`: #64748b - Muted gray for secondary text
- `--la-border`: #e2e8f0 - Light border color

### Semantic Mappings
- `--background`: Maps to `--la-bg`
- `--foreground`: Maps to `--la-surface`

### Usage Examples
```tsx
// Background colors
<div className="bg-la-bg">Main background</div>
<div className="bg-la-surface">Card surface</div>

// Text colors
<p className="text-la-surface">Primary text on dark bg</p>
<p className="text-la-muted">Secondary text</p>

// Interactive elements
<button className="bg-la-primary text-white hover:bg-la-primary/90">
  Primary button
</button>
<button className="border border-la-border text-la-surface">
  Outline button
</button>
```

## Typography

Typography tokens are defined in the @theme inline configuration in [`globals.css`](../app/globals.css).

### Font Families
- `--font-sans`: Geist Sans (system UI fallback)
- `--font-mono`: Geist Mono (for code)

### Type Scale
- `--text-4xl`: 2.25rem - Hero headings
- `--text-3xl`: 1.875rem - Large headings
- `--text-2xl`: 1.5rem - Section headings
- `--text-xl`: 1.25rem - Card titles
- `--text-lg`: 1.125rem - Large body text
- `--text-base`: 1rem - Default body text
- `--text-sm`: 0.875rem - Small text
- `--text-xs`: 0.75rem - Caption text

### Usage Examples
```tsx
<h1 className="text-4xl font-bold text-la-surface">
  Hero heading
</h1>
<h2 className="text-2xl font-semibold text-la-surface">
  Section heading
</h2>
<p className="text-base text-la-muted">
  Body text content
</p>
<p className="text-sm text-la-muted">
  Secondary information
</p>
```

## Spacing

Spacing tokens provide consistent gaps and padding throughout the interface.

### Layout Spacing
- `--container-padding`: 1rem - Default container padding
- `--section-gap`: 4rem - Vertical spacing between sections
- `--card-gap`: 2rem - Spacing between cards

### Usage Examples
```tsx
// Section spacing
<section className="py-16 lg:py-24">
  {/* Content with section-gap equivalent */}
</section>

// Container with consistent padding
<div className="px-4 sm:px-6 lg:px-8">
  {/* Content with container-padding */}
</div>

// Card spacing
<div className="grid gap-8 lg:gap-12">
  {/* Cards with card-gap equivalent */}
</div>
```

## Border Radius

The project uses Tailwind's default radius scale with consistent applications.

### Common Values
- `rounded-md`: 6px - Default for buttons and inputs
- `rounded-lg`: 8px - Cards and larger elements
- `rounded-xl`: 12px - Special containers
- `rounded-2xl`: 16px - Hero elements and featured cards

### Usage Examples
```tsx
// Buttons
<button className="rounded-md">Default button</button>

// Cards
<Card className="rounded-lg">Card content</Card>

// Featured elements
<div className="rounded-2xl">Featured content</div>
```

## Shadows

Shadows are used to create depth and hierarchy in the interface.

### Shadow Scale
- `shadow-sm`: Subtle elevation for cards
- `shadow-md`: Standard elevation
- `shadow-lg`: Higher elevation for dropdowns
- `shadow-xl`: Modal and overlay elevation
- `shadow-2xl`: Hero elements and featured cards

### Usage Examples
```tsx
// Cards
<Card className="shadow-sm">Standard card</Card>

// Elevated elements
<div className="shadow-lg">Dropdown content</div>

// Featured elements
<div className="shadow-2xl">Hero card</div>
```

## Motion

Motion tokens are defined through consistent animation patterns using Framer Motion.

### Duration
- `0.3s`: Quick transitions (hover states, micro-interactions)
- `0.6s`: Standard transitions (fade-ins, slide animations)
- `1.5s`: Slow animations (progress bars, loading states)

### Easing
- `easeOut`: Most animations (natural deceleration)
- `easeInOut`: Repeating animations (floating elements)

### Common Patterns
- Fade in sections: `FadeInSection` component with configurable delay
- Hover states: Scale transformations with `duration: 0.3s`
- Page transitions: Slide animations with `duration: 0.6s`
- Floating elements: Infinite animations with `duration: 3s`

### Usage Examples
```tsx
// Fade in section
<FadeInSection direction="up" delay={0.2}>
  <div>Content that fades in</div>
</FadeInSection>

// Hover animation
<motion.div
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Interactive element
</motion.div>

// Floating animation
<motion.div
  animate={{ y: [0, -10, 0] }}
  transition={{ 
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }}
>
  Floating badge
</motion.div>
```

## Guidelines

### Do
- ✅ Use design tokens instead of hardcoded values
- ✅ Keep motion timings consistent with established patterns
- ✅ Use semantic color tokens for better maintainability
- ✅ Apply consistent spacing using the defined scale
- ✅ Use the FadeInSection component for scroll animations

### Don't
- ❌ Hardcode colors, spacing, or timing values
- ❌ Mix different animation durations without reason
- ❌ Create custom color values that don't align with the palette
- ❌ Use arbitrary spacing values that break the rhythm
- ❌ Apply animations without considering performance impact

## Implementation Notes

- All tokens are defined in [`app/globals.css`](../app/globals.css) using CSS custom properties
- Tailwind v4 @theme inline configuration maps these tokens to utility classes
- Dark mode variations are handled through media queries in the CSS
- Components should reference tokens by their Tailwind utility names (e.g., `bg-la-primary`)
- When adding new tokens, follow the established naming convention with the `la-` prefix