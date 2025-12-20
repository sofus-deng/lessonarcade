import { NextRequest, NextResponse } from "next/server"
import { ttsRateLimiter } from "@/lib/utils/rate-limiter"
import { Timer } from "@/lib/utils/logger"
import { createHash } from "crypto"
import { getTtsMaxChars } from "@/lib/lessonarcade/voice/constants"

// Configure runtime for Node.js
export const runtime = "nodejs"

// Cache for TTS responses
const ttsCache = new Map<string, { data: Buffer; timestamp: number }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

// Add TTS event type to logger
type TTSEvent = "voice_tts"
type TTSErrorCode = "RATE_LIMIT" | "AUTH" | "VALIDATION" | "ELEVENLABS_ERROR" | null

interface TTSLogEntry {
  event: TTSEvent
  ok: boolean
  ipHash: string
  textLength: number
  textHash: string
  voiceId: string
  language: string
  rate: number
  elapsedMs: number
  errorCode?: TTSErrorCode
  cached?: boolean
}

/**
 * Hashes an IP address using SHA-256 with a salt from environment variables
 */
function hashIP(ip: string): string {
  const salt = process.env.LOGGING_SALT || "default-salt"
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
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
 * Logs a structured JSON entry for TTS events
 */
function logTTSEvent(
  request: NextRequest,
  ok: boolean,
  textLength: number,
  textHash: string,
  voiceId: string,
  language: string,
  rate: number,
  elapsedMs?: number,
  errorCode?: TTSErrorCode,
  cached?: boolean
): void {
  const ip = getClientIP(request)
  const ipHash = hashIP(ip)
  
  const logEntry: TTSLogEntry = {
    event: "voice_tts",
    ok,
    ipHash,
    textLength,
    textHash,
    voiceId,
    language,
    rate,
    elapsedMs: elapsedMs || 0,
  }
  
  if (errorCode) {
    logEntry.errorCode = errorCode
  }
  
  if (cached !== undefined) {
    logEntry.cached = cached
  }
  
  // Output as a single JSON line
  console.log(JSON.stringify(logEntry))
}

/**
 * Creates a cache key for TTS requests
 */
function createCacheKey(text: string, language: string, voiceId: string, rate: number): string {
  return createHash('sha256')
    .update(`${text}:${language}:${voiceId}:${rate}`)
    .digest('hex')
}

/**
 * Cleans up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now()
  for (const [key, entry] of ttsCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      ttsCache.delete(key)
    }
  }
}

// Cleanup cache every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000)

export async function POST(request: NextRequest) {
  const timer = new Timer()
  const maxChars = getTtsMaxChars()
  
  try {
    // Check ElevenLabs API key
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      logTTSEvent(
        request,
        false,
        0,
        "",
        "",
        "",
        1,
        timer.getElapsed(),
        "AUTH"
      )
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "AUTH", 
            message: "ElevenLabs API key not configured" 
          } 
        },
        { status: 500 }
      )
    }

    // Parse request body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      logTTSEvent(
        request,
        false,
        0,
        "",
        "",
        "",
        1,
        timer.getElapsed(),
        "VALIDATION"
      )
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "VALIDATION", 
            message: "Invalid JSON in request body" 
          } 
        },
        { status: 400 }
      )
    }

    // Validate required fields
    const { text, voiceId, rate = 1.0, lang = "en" } = body as {
      text: string
      voiceId?: string
      rate: number
      lang: string
    }
    
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      logTTSEvent(
        request,
        false,
        0,
        "",
        voiceId || "",
        lang,
        rate,
        timer.getElapsed(),
        "VALIDATION"
      )
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "VALIDATION", 
            message: "Text is required and must be a non-empty string" 
          } 
        },
        { status: 400 }
      )
    }

    // Validate text length against maxChars from constants
    if (text.length > maxChars) {
      logTTSEvent(
        request,
        false,
        text.length,
        createHash('sha256').update(text).digest('hex'),
        voiceId || "",
        lang,
        rate,
        timer.getElapsed(),
        "VALIDATION"
      )
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "VALIDATION", 
            message: `Text too long. Maximum allowed is ${maxChars} characters, but received ${text.length}.`,
            maxChars 
          } 
        },
        { status: 400 }
      )
    }

    // Validate rate
    if (typeof rate !== "number" || rate < 0.5 || rate > 2.0) {
      logTTSEvent(
        request,
        false,
        text.length,
        createHash('sha256').update(text).digest('hex'),
        (voiceId as string) || "",
        lang,
        rate,
        timer.getElapsed(),
        "VALIDATION"
      )
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "VALIDATION", 
            message: "Rate must be a number between 0.5 and 2.0" 
          } 
        },
        { status: 400 }
      )
    }

    // Validate language
    if (!["en", "zh"].includes(lang)) {
      logTTSEvent(
        request,
        false,
        text.length,
        createHash('sha256').update(text).digest('hex'),
        (voiceId as string) || "",
        lang,
        rate,
        timer.getElapsed(),
        "VALIDATION"
      )
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "VALIDATION", 
            message: "Language must be 'en' or 'zh'" 
          } 
        },
        { status: 400 }
      )
    }

    // Determine voice ID based on language if not provided
    const finalVoiceId = (voiceId as string) || (
      lang === "zh"
        ? process.env.ELEVENLABS_VOICE_ID_ZH || "Zhao"
        : process.env.ELEVENLABS_VOICE_ID_EN || "Adam"
    )

    // Apply two-tier rate limiting
    const rateLimitResult = ttsRateLimiter.checkMultipleLimits(request, [
      { key: 'ip', maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 requests per hour per IP
      { key: 'fingerprint', maxRequests: 30, windowMs: 24 * 60 * 60 * 1000 } // 30 requests per day per fingerprint
    ])

    if (!rateLimitResult.allowed) {
      const textHash = createHash('sha256').update(text).digest('hex')
      logTTSEvent(
        request,
        false,
        text.length,
        textHash,
        finalVoiceId,
        lang,
        rate,
        timer.getElapsed(),
        "RATE_LIMIT"
      )
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "RATE_LIMIT", 
            message: "Rate limit exceeded. Please try again later.",
            retryAfterSeconds: rateLimitResult.retryAfter
          } 
        },
        { status: 429 }
      )
    }

    // Create cache key and check cache
    const cacheKey = createCacheKey(text, lang, finalVoiceId as string, rate)
    const cachedEntry = ttsCache.get(cacheKey)
    
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      const textHash = createHash('sha256').update(text).digest('hex')
      logTTSEvent(
        request,
        true,
        text.length,
        textHash,
        finalVoiceId as string,
        lang,
        rate,
        timer.getElapsed(),
        undefined,
        true // cached
      )
      
      return new NextResponse(cachedEntry.data as BodyInit, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=600', // 10 minutes
        },
      })
    }

    // Prepare ElevenLabs API request
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"
    
    const requestBody = {
      text,
      model_id: modelId,
      language_code: lang === "zh" ? "zh" : "en",
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
        rate: rate
      }
    }

    // Call ElevenLabs API
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const textHash = createHash('sha256').update(text).digest('hex')
      logTTSEvent(
        request,
        false,
        text.length,
        textHash,
        finalVoiceId as string,
        lang,
        rate,
        timer.getElapsed(),
        "ELEVENLABS_ERROR"
      )
      
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: "ELEVENLABS_ERROR", 
            message: `ElevenLabs API error: ${response.status} ${response.statusText}` 
          } 
        },
        { status: 500 }
      )
    }

    // Get audio data
    const audioBuffer = Buffer.from(await response.arrayBuffer())
    
    // Cache the response
    ttsCache.set(cacheKey, {
      data: audioBuffer,
      timestamp: Date.now()
    })

    // Log successful request
    const textHash = createHash('sha256').update(text).digest('hex')
    logTTSEvent(
      request,
      true,
      text.length,
      textHash,
      finalVoiceId,
      lang,
      rate,
      timer.getElapsed()
    )

    // Return audio response
    return new NextResponse(audioBuffer as BodyInit, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=600', // 10 minutes
      },
    })

  } catch (error) {
    console.error('TTS API error:', error)
    
    logTTSEvent(
      request,
      false,
      0,
      "",
      "",
      "",
      1,
      timer.getElapsed(),
      "ELEVENLABS_ERROR"
    )
    
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: "ELEVENLABS_ERROR", 
          message: "Internal server error" 
        } 
      },
      { status: 500 }
    )
  }
}