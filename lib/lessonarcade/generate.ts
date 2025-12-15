import { generateContent } from "@/lib/ai/gemini"
import { fetchYouTubeOEmbed, extractVideoId } from "@/lib/youtube/oembed"
import { lessonArcadeLessonSchema, type LessonArcadeLesson } from "./schema"

/**
 * Generation modes for lesson creation
 */
export type GenerationMode = "quick" | "accurate"

/**
 * Input parameters for lesson generation
 */
export interface LessonGenerationInput {
  youtubeUrl: string
  generationMode: GenerationMode
  transcriptText?: string
  language?: string
  desiredLevelCount?: number
  desiredItemsPerLevel?: number
}

/**
 * JSON Schema for Gemini structured output
 * Based on the lessonArcadeLessonSchema
 */
const lessonGenerationSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Unique identifier for the lesson" },
    slug: { type: "string", description: "URL-friendly slug for the lesson" },
    title: { type: "string", description: "Title of the lesson" },
    shortDescription: { type: "string", description: "Brief description of the lesson" },
    longDescription: { type: "string", description: "Detailed description of the lesson" },
    estimatedDurationMinutes: { type: "number", description: "Estimated duration in minutes" },
    tags: { 
      type: "array", 
      items: { type: "string" },
      description: "Tags for categorizing the lesson"
    },
    language: { type: "string", description: "Language code (e.g., 'en')" },
    video: {
      type: "object",
      properties: {
        provider: { type: "string", enum: ["youtube"] },
        videoId: { type: "string", description: "YouTube video ID" },
        startAtSeconds: { type: "number" },
        endAtSeconds: { type: "number" }
      },
      required: ["provider", "videoId"]
    },
    levels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique identifier for the level" },
          index: { type: "number", description: "Zero-based index of the level" },
          title: { type: "string", description: "Title of the level" },
          summary: { type: "string", description: "Summary of what this level covers" },
          timeRange: {
            type: "object",
            properties: {
              startSeconds: { type: "number" },
              endSeconds: { type: "number" }
            }
          },
          keyPoints: {
            type: "array",
            items: { type: "string" },
            description: "Key learning points for this level"
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: { 
                  type: "string", 
                  enum: ["multiple_choice", "open_ended", "checkpoint"],
                  description: "Type of item"
                },
                id: { type: "string", description: "Unique identifier for the item" },
                prompt: { type: "string", description: "Question or prompt for the item" },
                // Multiple choice specific
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      text: { type: "string" }
                    },
                    required: ["id", "text"]
                  }
                },
                correctOptionIds: {
                  type: "array",
                  items: { type: "string" }
                },
                explanation: { type: "string" },
                difficulty: { 
                  type: "string", 
                  enum: ["easy", "medium", "hard"] 
                },
                points: { type: "number" },
                // Open ended specific
                placeholder: { type: "string" },
                guidance: { type: "string" },
                maxCharacters: { type: "number" },
                // Checkpoint specific
                message: { type: "string" },
                actionHint: { type: "string" }
              },
              required: ["kind", "id"]
            }
          }
        },
        required: ["id", "index", "title", "summary", "keyPoints", "items"]
      }
    }
  },
  required: ["id", "slug", "title", "shortDescription", "language", "video", "levels"]
}

/**
 * Generates a lesson based on the specified mode
 */
export async function generateLessonDualMode(
  input: LessonGenerationInput
): Promise<LessonArcadeLesson> {
  const {
    youtubeUrl,
    generationMode,
    transcriptText,
    language = "en",
    desiredLevelCount = 3,
    desiredItemsPerLevel = 4
  } = input

  // Validate inputs
  if (!youtubeUrl) {
    throw new Error("YouTube URL is required")
  }

  if (generationMode === "accurate" && (!transcriptText || transcriptText.trim().length === 0)) {
    throw new Error("Transcript text is required for accurate mode")
  }

  // Fetch YouTube metadata
  const metadata = await fetchYouTubeOEmbed(youtubeUrl)
  const videoId = extractVideoId(youtubeUrl)

  if (!videoId) {
    throw new Error("Could not extract video ID from YouTube URL")
  }

  // Build prompt based on mode
  const prompt = buildGenerationPrompt({
    generationMode,
    metadata,
    transcriptText,
    language,
    desiredLevelCount,
    desiredItemsPerLevel
  })

  // Generate lesson with retry mechanism
  const lesson = await generateWithRetry(prompt, 2)

  return lesson
}

/**
 * Builds the generation prompt based on mode
 */
function buildGenerationPrompt({
  generationMode,
  metadata,
  transcriptText,
  language,
  desiredLevelCount,
  desiredItemsPerLevel
}: {
  generationMode: GenerationMode
  metadata: { title: string; authorName: string }
  transcriptText?: string
  language: string
  desiredLevelCount: number
  desiredItemsPerLevel: number
}): string {
  const basePrompt = `You are an expert educational content creator. Generate a comprehensive interactive lesson based on the following information:

Video Title: "${metadata.title}"
Channel: "${metadata.authorName}"
Language: "${language}"
Number of Levels: ${desiredLevelCount}
Items per Level: ${desiredItemsPerLevel}

Create a lesson with the following structure:
- ${desiredLevelCount} progressive levels
- Each level should have ${desiredItemsPerLevel} items (mix of multiple_choice, open_ended, and checkpoint)
- Include multiple choice questions with clear correct answers
- Include open-ended questions for reflection
- Include checkpoint items to mark progress
- Each level should build upon the previous one
- Include key learning points for each level
- Generate appropriate tags for categorization

`

  if (generationMode === "quick") {
    return `${basePrompt}QUICK MODE: Generate this lesson based only on the video title and channel information. 
DO NOT pretend to have watched the video. Create content that would be educational and relevant based on the title alone.
DO NOT include precise timestamps in timeRange - only include timeRange if you can make a reasonable estimate.
Be honest about the limitations - focus on creating a useful, topic-driven lesson that could apply to a video with this title.

The content should be general enough to apply to any video with this topic, but specific enough to be valuable for learning.`
  } else {
    return `${basePrompt}ACCURATE MODE: Generate this lesson based on the following transcript. Align the levels and items to the actual content segments in the transcript.
Include timeRange values that correspond to the actual content timing in the transcript.
Reference specific key points that are actually present in the transcript.
Ensure the lesson accurately reflects the content covered in the video.

TRANSCRIPT:
${transcriptText}

Create a lesson that accurately follows the transcript's structure and content.`
  }
}

/**
 * Generates content with retry mechanism and validation
 */
async function generateWithRetry(prompt: string, maxRetries: number): Promise<LessonArcadeLesson> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Generate content
      const response = await generateContent(
        "gemini-1.5-flash",
        prompt,
        {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseSchema: lessonGenerationSchema
        }
      )

      // Extract the generated lesson data
      const lessonData = response.candidates?.[0]?.content?.parts?.[0]?.text

      if (!lessonData) {
        throw new Error("No content generated from Gemini")
      }

      // Parse JSON if it's a string
      let parsedLesson: unknown
      try {
        parsedLesson = typeof lessonData === 'string' ? JSON.parse(lessonData) : lessonData
      } catch {
        throw new Error("Failed to parse generated JSON content")
      }

      // Validate with Zod schema
      const validationResult = lessonArcadeLessonSchema.safeParse(parsedLesson)

      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join('; ')

        if (attempt < maxRetries) {
          lastError = new Error(`Validation failed: ${errorMessages}`)
          continue // Retry with repair prompt
        } else {
          throw new Error(`Lesson validation failed after ${maxRetries + 1} attempts: ${errorMessages}`)
        }
      }

      return validationResult.data

    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error during generation")
      
      if (attempt < maxRetries) {
        console.warn(`Generation attempt ${attempt + 1} failed, retrying...`, lastError.message)
        continue
      }
    }
  }

  throw lastError || new Error("Failed to generate lesson after all retries")
}

/**
 * Creates a safe slug from lesson title
 */
export function createLessonSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .slice(0, 50) // Limit length
}

/**
 * Generates a unique lesson ID
 */
export function generateLessonId(): string {
  return `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}