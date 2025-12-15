import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"

// Explicitly declare Node.js runtime for filesystem access
export const runtime = "nodejs"

/**
 * API endpoint for health diagnostics
 * Returns system information for administrative purposes
 */
export async function GET() {
  try {
    // Build info
    const buildInfo = {
      version: process.env.npm_package_version || "0.1.0",
      timestamp: new Date().toISOString(),
    }

    // Storage info
    const storageInfo = await getStorageInfo()

    // Rate limiter info
    const rateLimiterInfo = {
      enabled: true, // Rate limiter is always enabled in our implementation
      maxRequests: 10,
      windowHours: 1,
    }

    // Gemini config
    const geminiConfig = {
      hasApiKey: !!process.env.GEMINI_API_KEY,
    }

    const healthData = {
      build: buildInfo,
      storage: storageInfo,
      rateLimiter: rateLimiterInfo,
      gemini: geminiConfig,
    }

    return NextResponse.json(healthData)
  } catch {
    console.error("Error fetching health data")
    return NextResponse.json(
      { error: "Failed to fetch health data" },
      { status: 500 }
    )
  }
}

/**
 * Gets storage information about user lessons
 */
async function getStorageInfo() {
  const userLessonsDir = join(process.cwd(), "data", "user-lessons")
  
  try {
    const files = await readdir(userLessonsDir)
    
    // Filter out .gitkeep and only include .json files
    const jsonFiles = files.filter(file => 
      file.endsWith('.json') && file !== '.gitkeep'
    )
    
    // Get file stats to sort by modification time
    const fileStats = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = join(userLessonsDir, file)
        const stats = await stat(filePath)
        return {
          file,
          slug: file.replace('.json', ''),
          mtime: stats.mtime,
        }
      })
    )
    
    // Sort by modification time (newest first) and get latest 5
    const latestFiles = fileStats
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, 5)
      .map(item => item.slug)
    
    return {
      fileCount: jsonFiles.length,
      latestSlugs: latestFiles,
    }
  } catch {
    // If directory doesn't exist or other error, return empty info
    return {
      fileCount: 0,
      latestSlugs: [],
    }
  }
}