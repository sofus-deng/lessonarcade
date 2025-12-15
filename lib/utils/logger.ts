import { NextRequest } from "next/server"
import { createHash } from "crypto"

export type LogEvent = "studio_generate" | "studio_publish"
export type ErrorCode = "RATE_LIMIT" | "AUTH" | "VALIDATION" | "GEMINI_ERROR" | "SLUG_COLLISION" | null

interface LogEntry {
  event: LogEvent
  ok: boolean
  ipHash: string
  mode?: "quick" | "accurate"
  elapsedMs: number
  errorCode?: ErrorCode
}

/**
 * Hashes an IP address using SHA-256 with a salt from environment variables
 * @param ip - The IP address to hash
 * @returns The hashed IP address
 */
function hashIP(ip: string): string {
  const salt = process.env.LOGGING_SALT || "default-salt"
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

/**
 * Extracts the client IP from the request
 * @param request - The Next.js request object
 * @returns The client IP address
 */
function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
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
  
  // Fall back to a default value
  return 'unknown'
}

/**
 * Logs a structured JSON entry for Studio API events
 * @param event - The type of event
 * @param request - The Next.js request object
 * @param ok - Whether the operation was successful
 * @param mode - The generation mode (quick/accurate)
 * @param elapsedMs - The elapsed time in milliseconds
 * @param errorCode - The error code if any
 */
export function logStudioEvent(
  event: LogEvent,
  request: NextRequest,
  ok: boolean,
  mode?: "quick" | "accurate",
  elapsedMs?: number,
  errorCode?: ErrorCode
): void {
  const ip = getClientIP(request)
  const ipHash = hashIP(ip)
  
  const logEntry: LogEntry = {
    event,
    ok,
    ipHash,
    elapsedMs: elapsedMs || 0,
  }
  
  if (mode) {
    logEntry.mode = mode
  }
  
  if (errorCode) {
    logEntry.errorCode = errorCode
  }
  
  // Output as a single JSON line
  console.log(JSON.stringify(logEntry))
}

/**
 * Creates a performance timer for measuring elapsed time
 */
export class Timer {
  private startTime: number
  
  constructor() {
    this.startTime = Date.now()
  }
  
  /**
   * Gets the elapsed time in milliseconds
   * @returns The elapsed time in milliseconds
   */
  getElapsed(): number {
    return Date.now() - this.startTime
  }
}