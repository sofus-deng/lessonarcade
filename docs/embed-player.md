# Embeddable LessonArcade Player

The LessonArcade embeddable player allows you to embed interactive lessons directly into your own website, blog, or Learning Management System (LMS). Using a simple iframe snippet, you can deliver the same engaging, gamified learning experience that users get on the LessonArcade platform, complete with checkpoints, scoring, and progress tracking.

The embeddable player is designed to be lightweight and easy to integrate. It works entirely within an iframe, so it won't interfere with your existing site's styling or functionality. The player automatically handles lesson loading, user interactions, and completion tracking, sending all analytics back to your LessonArcade workspace.

## How to Use

To embed a lesson, simply add an iframe element to your HTML with the appropriate source URL. The URL structure is:

```
/embed/[workspaceSlug]/lesson/[lessonSlug]
```

For example, to embed the "Effective Meetings" demo lesson:

```html
<iframe
  src="https://YOUR-DEPLOYED-URL/embed/demo/lesson/effective-meetings"
  width="100%"
  height="640"
  frameborder="0"
  allowfullscreen
></iframe>
```

Replace `YOUR-DEPLOYED-URL` with your actual LessonArcade deployment URL.

## URL Structure

The embed URL follows this pattern:

- `workspaceSlug` - The workspace containing the lesson (e.g., "demo")
- `lessonSlug` - The unique identifier for the lesson (e.g., "effective-meetings")

### Available Demo Lessons

The following demo lessons are available for embedding in Phase 3:

- `effective-meetings` - Effective Meetings
- `react-hooks-intro` - React Hooks Introduction
- `design-feedback-basics` - Design Feedback Basics
- `decision-making-uncertainty` - Decision-Making Under Uncertainty
- `feedback-that-lands` - Giving Feedback That Lands
- `effective-one-on-ones` - Running Effective 1:1s

## Phase 3 Limitations

In the current Phase 3 release:

- Only the "demo" workspace is supported for embedding
- Only public demo lessons can be embedded
- No authentication or workspace switching UI is available
- The player is read-only (users cannot create or edit lessons)

Future releases will expand these capabilities to support multi-workspace embedding and authenticated experiences.

## Analytics and Tracking

The embeddable player uses the same lesson player components and backend as the main LessonArcade demo. This means:

- All lesson runs are automatically recorded to your workspace
- Gamification, scoring, and completion tracking work identically
- Analytics data is captured and available in your LessonArcade dashboard

No additional configuration is required—the embed player sends lesson completion data to your backend automatically.

## Styling and Branding

The embed player respects your LessonArcade brand configuration:

- Use the `NEXT_PUBLIC_BRAND_ID` environment variable to set the default brand
- Override the brand dynamically using the `brand` query parameter: `?brand=warm-paper`

Available brand presets:
- `lessonarcade-default` - The original LessonArcade design
- `warm-paper` - A lighter, paper-like warm palette
- `night-classroom` - A darker, more cinematic palette

## Sizing and Responsiveness

The embed player is designed to be responsive and fill its container:

- Set `width="100%"` to make the iframe responsive to its container
- Set `height` to an appropriate value for your layout (e.g., `640px` or `800px`)
- The player content will scroll internally if needed

For best results, ensure the iframe has sufficient height to display the lesson content without excessive scrolling.

## Accessibility

The embed player includes keyboard navigation support and focus management:

- Users can navigate through lesson items using the Tab key
- Focus states are clearly visible for interactive elements
- The player respects screen reader announcements for completion status

## Troubleshooting

### Lesson Not Found

If you see a "Lesson Not Found" error:

- Verify the lesson slug is correct (check the Available Demo Lessons section)
- Ensure your deployment URL is correct
- Check that the lesson exists in your workspace

### Workspace Not Available

If you see a "Workspace Not Available" error:

- In Phase 3, only the "demo" workspace is supported
- Future releases will support embedding lessons from your own workspaces

### Styling Issues

If the embed player doesn't display correctly:

- Ensure the iframe has explicit width and height attributes
- Check that your CSS doesn't override iframe styles
- Verify your browser supports iframes (most modern browsers do)
