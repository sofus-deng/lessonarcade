import { NextRequest } from "next/server"
import { createHash } from "crypto"

interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory rate limiter for API endpoints
 * Limits requests based on IP address with a sliding window
 */
class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 60 * 60 * 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs // Default: 1 hour
  }

  /**
   * Checks if a request from the given IP is allowed
   * @param request - The Next.js request object
   * @returns Object with allowed status and retry information
   */
  checkLimit(request: NextRequest): { allowed: boolean; retryAfter?: number } {
    const ip = this.getClientIP(request)
    const now = Date.now()
    
    // Get or create entry for this IP
    let entry = this.store.get(ip)
    
    if (!entry) {
      // First request from this IP
      entry = { count: 1, resetTime: now + this.windowMs }
      this.store.set(ip, entry)
      return { allowed: true }
    }
    
    // Check if the window has expired
    if (now > entry.resetTime) {
      // Reset the counter
      entry.count = 1
      entry.resetTime = now + this.windowMs
      return { allowed: true }
    }
    
    // Check if under the limit
    if (entry.count < this.maxRequests) {
      entry.count++
      return { allowed: true }
    }
    
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  /**
   * Checks multiple rate limits for a request
   * @param request - The Next.js request object
   * @param limits - Array of limits with custom keys
   * @returns Object with allowed status and retry information
   */
  checkMultipleLimits(
    request: NextRequest,
    limits: Array<{ key: string, maxRequests: number, windowMs: number }>
  ): { allowed: boolean; retryAfter?: number; exceededLimit?: string } {
    for (const limit of limits) {
      const identifier = limit.key === 'ip'
        ? this.getClientIP(request)
        : limit.key === 'fingerprint'
        ? this.getFingerprint(request)
        : limit.key
      
      const now = Date.now()
      let entry = this.store.get(identifier)
      
      if (!entry) {
        // First request for this identifier
        entry = { count: 1, resetTime: now + limit.windowMs }
        this.store.set(identifier, entry)
        continue
      }
      
      // Check if the window has expired
      if (now > entry.resetTime) {
        // Reset the counter
        entry.count = 1
        entry.resetTime = now + limit.windowMs
        continue
      }
      
      // Check if under the limit
      if (entry.count < limit.maxRequests) {
        entry.count++
        continue
      }
      
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      return {
        allowed: false,
        retryAfter,
        exceededLimit: limit.key
      }
    }
    
    return { allowed: true }
  }

  /**
   * Extracts the client IP from the request
   */
  private getClientIP(request: NextRequest): string {
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
   * Creates a fingerprint from user agent and accept language headers
   * Uses LOGGING_SALT from environment for additional security
   */
  private getFingerprint(request: NextRequest): string {
    const salt = process.env.LOGGING_SALT || "default-salt"
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const acceptLanguage = request.headers.get('accept-language') || 'unknown'
    
    return createHash('sha256')
      .update(`${salt}:${userAgent}:${acceptLanguage}`)
      .digest('hex')
  }

  /**
   * Cleanup expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Create singleton instances for different limits
export const generateRateLimiter = new RateLimiter(10, 60 * 60 * 1000) // 10 requests per hour
export const publishRateLimiter = new RateLimiter(10, 60 * 60 * 1000) // 10 requests per hour
export const ttsRateLimiter = new RateLimiter(10, 60 * 60 * 1000) // 10 requests per hour for IP

// Cleanup expired entries every 5 minutes
setInterval(() => {
  generateRateLimiter.cleanup()
  publishRateLimiter.cleanup()
  ttsRateLimiter.cleanup()
}, 5 * 60 * 1000)