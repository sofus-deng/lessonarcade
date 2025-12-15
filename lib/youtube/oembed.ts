/**
 * YouTube oEmbed API integration
 * Fetches video metadata without requiring OAuth
 */

export interface YouTubeMetadata {
  title: string
  authorName: string
  authorUrl?: string
  thumbnailUrl?: string
  thumbnailWidth?: number
  thumbnailHeight?: number
}

export interface YouTubeOEmbedResponse {
  title: string
  author_name: string
  author_url?: string
  thumbnail_url?: string
  thumbnail_width?: number
  thumbnail_height?: number
  type: string
  version: string
  provider_name: string
  provider_url: string
  width?: number
  height?: number
  html?: string
}

/**
 * Validates if a URL is a proper YouTube URL
 * Supports both youtube.com/watch and youtu.be formats
 */
export function validateYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  // YouTube URL patterns
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+(&[\w-]+=[\w-]*)*$/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+(\?[\w-]+=[\w-]*)*$/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+(\?[\w-]+=[\w-]*)*$/
  ]

  return youtubePatterns.some(pattern => pattern.test(url.trim()))
}

/**
 * Extracts video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  if (!validateYouTubeUrl(url)) {
    return null
  }

  const trimmedUrl = url.trim()

  // Extract from youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmedUrl.match(/youtube\.com\/watch\?v=([\w-]+)/)
  if (watchMatch) {
    return watchMatch[1]
  }

  // Extract from youtu.be/VIDEO_ID
  const youtuBeMatch = trimmedUrl.match(/youtu\.be\/([\w-]+)/)
  if (youtuBeMatch) {
    return youtuBeMatch[1]
  }

  // Extract from youtube.com/embed/VIDEO_ID
  const embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([\w-]+)/)
  if (embedMatch) {
    return embedMatch[1]
  }

  return null
}

/**
 * Fetches YouTube video metadata using the oEmbed API
 * @param youtubeUrl - The YouTube video URL
 * @returns Promise<YouTubeMetadata> - Video metadata
 * @throws Error - If URL is invalid or API request fails
 */
export async function fetchYouTubeOEmbed(youtubeUrl: string): Promise<YouTubeMetadata> {
  // Validate URL
  if (!validateYouTubeUrl(youtubeUrl)) {
    throw new Error('Invalid YouTube URL. Please provide a valid YouTube video URL.')
  }

  // Extract video ID for additional validation
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) {
    throw new Error('Could not extract video ID from YouTube URL.')
  }

  // Build oEmbed URL
  const oEmbedUrl = new URL('https://www.youtube.com/oembed')
  oEmbedUrl.searchParams.append('url', youtubeUrl)
  oEmbedUrl.searchParams.append('format', 'json')

  try {
    // Fetch oEmbed data
    const response = await fetch(oEmbedUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LessonArcade/1.0'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Video not found or may be private.')
      } else if (response.status === 403) {
        throw new Error('Video embedding is disabled by the uploader.')
      } else {
        throw new Error(`Failed to fetch video metadata: ${response.status} ${response.statusText}`)
      }
    }

    const data: YouTubeOEmbedResponse = await response.json()

    // Transform response to our interface
    const metadata: YouTubeMetadata = {
      title: data.title || 'Unknown Title',
      authorName: data.author_name || 'Unknown Channel',
      authorUrl: data.author_url,
      thumbnailUrl: data.thumbnail_url,
      thumbnailWidth: data.thumbnail_width,
      thumbnailHeight: data.thumbnail_height
    }

    return metadata

  } catch (error) {
    if (error instanceof Error) {
      // Re-throw our custom errors
      if (error.message.includes('Invalid YouTube URL') || 
          error.message.includes('Video not found') || 
          error.message.includes('embedding is disabled') ||
          error.message.includes('Could not extract video ID')) {
        throw error
      }
      
      // Handle network errors
      if (error.message.includes('fetch')) {
        throw new Error('Network error while fetching video metadata. Please check your connection.')
      }
    }

    throw new Error('Failed to fetch YouTube video metadata. Please try again.')
  }
}

/**
 * Creates a safe filename from video title
 */
export function createSafeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .slice(0, 50) // Limit length
}