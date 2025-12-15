import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware to protect Studio routes with HTTP Basic Authentication
 * Applies to /studio and /api/studio routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path requires authentication
  if (pathname.startsWith('/studio') || pathname.startsWith('/api/studio')) {
    // Get credentials from environment variables
    const authUser = process.env.STUDIO_BASIC_AUTH_USER
    const authPass = process.env.STUDIO_BASIC_AUTH_PASS

    // If credentials are not set, allow access (for development)
    if (!authUser || !authPass) {
      console.warn("Studio Basic Auth credentials not configured. Allowing access for development.")
      return NextResponse.next()
    }

    // Check for Basic Auth header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return createAuthResponse()
    }

    // Verify credentials
    try {
      const base64Credentials = authHeader.split(' ')[1]
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
      const [username, password] = credentials.split(':')

      if (username !== authUser || password !== authPass) {
        return createAuthResponse()
      }
    } catch {
      return createAuthResponse()
    }
  }

  // Allow request to proceed
  return NextResponse.next()
}

/**
 * Creates a 401 Unauthorized response with Basic Auth challenge
 */
function createAuthResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: 'Authentication required' }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="Lesson Studio"'
      }
    }
  )
}

/**
 * Configure the matcher to specify which paths the middleware should run on
 */
export const config = {
  matcher: ['/studio/:path*', '/api/studio/:path*']
}