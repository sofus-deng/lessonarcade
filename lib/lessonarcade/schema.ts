import { z } from "zod"

// Internationalization text type - extensible record of language code to text
const i18nTextSchema = z.record(z.string(), z.string()).optional()

// Base video schema
const videoSchema = z.object({
  provider: z.string(),
  videoId: z.string(),
  startAtSeconds: z.number().optional(),
  endAtSeconds: z.number().optional(),
})

// Multiple choice option schema
const multipleChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  textI18n: i18nTextSchema,
})

// Base item schema with discriminator
const baseItemSchema = z.object({
  kind: z.enum(["multiple_choice", "open_ended", "checkpoint"]),
  id: z.string(),
  prompt: z.string().optional(),
})

// Multiple choice item schema
const multipleChoiceItemSchema = baseItemSchema.extend({
  kind: z.literal("multiple_choice"),
  options: z.array(multipleChoiceOptionSchema).min(1, "Multiple choice questions must have at least one option"),
  correctOptionIds: z.array(z.string()).min(1, "Multiple choice questions must have at least one correct option"),
  explanation: z.string().optional(),
  explanationI18n: i18nTextSchema,
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  points: z.number().optional(),
}).merge(z.object({
  prompt: z.string(),
  promptI18n: i18nTextSchema,
}))

// Open ended item schema
const openEndedItemSchema = baseItemSchema.extend({
  kind: z.literal("open_ended"),
  placeholder: z.string().optional(),
  placeholderI18n: i18nTextSchema,
  guidance: z.string().optional(),
  guidanceI18n: i18nTextSchema,
  maxCharacters: z.number().optional(),
}).merge(z.object({
  prompt: z.string(),
  promptI18n: i18nTextSchema,
}))

// Checkpoint item schema
const checkpointItemSchema = baseItemSchema.extend({
  kind: z.literal("checkpoint"),
  message: z.string(),
  messageI18n: i18nTextSchema,
  actionHint: z.string().optional(),
  actionHintI18n: i18nTextSchema,
})

// Discriminated union for all item types
const lessonArcadeItemSchema = z.discriminatedUnion("kind", [
  multipleChoiceItemSchema,
  openEndedItemSchema,
  checkpointItemSchema,
])

// Time range schema for levels
const timeRangeSchema = z.object({
  startSeconds: z.number(),
  endSeconds: z.number(),
}).optional()

// Level schema
const lessonArcadeLevelSchema = z.object({
  id: z.string(),
  index: z.number(),
  title: z.string(),
  summary: z.string(),
  timeRange: timeRangeSchema,
  keyPoints: z.array(z.string()),
  items: z.array(lessonArcadeItemSchema),
})

// Main lesson schema
const lessonArcadeLessonSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string(),
  longDescription: z.string().optional(),
  estimatedDurationMinutes: z.number().optional(),
  tags: z.array(z.string()),
  language: z.string(),
  video: videoSchema,
  levels: z.array(lessonArcadeLevelSchema).min(1, "Lessons must have at least one level"),
})

// Export schemas
export {
  videoSchema,
  i18nTextSchema,
  multipleChoiceOptionSchema,
  baseItemSchema,
  multipleChoiceItemSchema,
  openEndedItemSchema,
  checkpointItemSchema,
  lessonArcadeItemSchema,
  timeRangeSchema,
  lessonArcadeLevelSchema,
  lessonArcadeLessonSchema,
}

// Export inferred types
export type LessonArcadeVideo = z.infer<typeof videoSchema>
export type I18nText = z.infer<typeof i18nTextSchema>
export type LanguageCode = string
export type LessonArcadeMultipleChoiceOption = z.infer<typeof multipleChoiceOptionSchema>
export type LessonArcadeBaseItem = z.infer<typeof baseItemSchema>
export type LessonArcadeMultipleChoiceItem = z.infer<typeof multipleChoiceItemSchema>
export type LessonArcadeOpenEndedItem = z.infer<typeof openEndedItemSchema>
export type LessonArcadeCheckpointItem = z.infer<typeof checkpointItemSchema>
export type LessonArcadeItem = z.infer<typeof lessonArcadeItemSchema>
export type LessonArcadeTimeRange = z.infer<typeof timeRangeSchema>
export type LessonArcadeLevel = z.infer<typeof lessonArcadeLevelSchema>
export type LessonArcadeLesson = z.infer<typeof lessonArcadeLessonSchema>
