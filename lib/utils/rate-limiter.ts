import { NextRequest } from "next/server"

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
   * Cleanup expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now()
    for (const [ip, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(ip)
      }
    }
  }
}

// Create singleton instances for different limits
export const generateRateLimiter = new RateLimiter(10, 60 * 60 * 1000) // 10 requests per hour
export const publishRateLimiter = new RateLimiter(10, 60 * 60 * 1000) // 10 requests per hour

// Cleanup expired entries every 5 minutes
setInterval(() => {
  generateRateLimiter.cleanup()
  publishRateLimiter.cleanup()
}, 5 * 60 * 1000)