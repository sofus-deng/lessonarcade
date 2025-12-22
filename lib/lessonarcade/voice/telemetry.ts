import { z } from "zod"
import { createHash } from "crypto"
import { NextRequest } from "next/server"
import { mkdir, appendFile } from "node:fs/promises"
import path from "node:path"

// Import client-safe functions
export { createTextHash, createSessionId } from './telemetry-client'

// Use dynamic import for fs to avoid client-side bundling issues
const fs = typeof window === 'undefined' ? { mkdir, appendFile } : null

/**
 * Schema for voice telemetry events
 * Version 1 - Initial implementation
 */
export const VoiceTelemetryEventSchema = z.object({
  schemaVersion: z.literal(1),
  ts: z.string(), // ISO timestamp
  event: z.enum([
    "voice_play",
    "voice_pause", 
    "voice_resume",
    "voice_stop",
    "voice_end",
    "voice_error"
  ]),
  lessonSlug: z.string(),
  levelIndex: z.number(),
  itemIndex: z.number(),
  engine: z.enum(["browser", "ai"]),
  languageCode: z.string(),
  voicePresetKey: z.string().optional(),
  rate: z.number(),
  textLen: z.number(),
  textHash: z.string(), // SHA-256 hash of script text only
  sessionId: z.string(),
  ipHash: z.string().optional(), // Server-derived only
  fingerprintHash: z.string().optional(), // Server-derived only
  deduped: z.boolean().optional(),
  reason: z.enum([
    "user_stop",
    "navigation", 
    "rate_limited",
    "cooldown_blocked",
    "error"
  ]).optional()
})

export type VoiceTelemetryEvent = z.infer<typeof VoiceTelemetryEventSchema>

/**
 * Hashes an IP address using SHA-256 with a salt from environment variables
 */
function hashIP(ip: string): string {
  const salt = process.env.LOGGING_SALT || "default-salt"
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

/**
 * Hashes a fingerprint using SHA-256 with a salt from environment variables
 */
function hashFingerprint(userAgent: string, acceptLanguage: string): string {
  const salt = process.env.LOGGING_SALT || "default-salt"
  return createHash("sha256")
    .update(`${salt}:${userAgent}:${acceptLanguage}`)
    .digest("hex")
}

/**
 * Extracts the client IP from the request
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return 'unknown'
}

/**
 * Gets the daily telemetry file path based on current date
 */
function getDailyFilePath(): string {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const fileName = `events-${today}.jsonl`
  // Use path module only on server side
  if (typeof window === 'undefined') {
    return path.join(process.cwd(), 'data', 'voice-analytics', fileName)
  }
  return ''
}

/**
 * Safely appends a telemetry event to the daily JSONL file
 * Creates directory if missing
 */
export async function appendTelemetryEvent(
  event: VoiceTelemetryEvent,
  request?: NextRequest
): Promise<void> {
  try {
    // Only proceed if fs is available (server-side)
    if (!fs) {
      return
    }

    // Add server-side derived hashes if request is provided
    if (request) {
      const ip = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const acceptLanguage = request.headers.get('accept-language') || 'unknown'
      
      event.ipHash = hashIP(ip)
      event.fingerprintHash = hashFingerprint(userAgent, acceptLanguage)
    }

    // Validate the event
    const validatedEvent = VoiceTelemetryEventSchema.parse(event)
    
    // Ensure directory exists
    const filePath = getDailyFilePath()
    const dir = filePath.substring(0, filePath.lastIndexOf('/'))
    await fs.mkdir(dir, { recursive: true })
    
    // Append to JSONL file
    const jsonLine = JSON.stringify(validatedEvent) + '\n'
    await fs.appendFile(filePath, jsonLine, 'utf8')
  } catch (error) {
    // Telemetry failures should never break the application
    console.error('Failed to append telemetry event:', error)
  }
}