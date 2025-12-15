"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BuildInfo {
  version: string
  timestamp: string
}

interface StorageInfo {
  fileCount: number
  latestSlugs: string[]
}

interface RateLimiterInfo {
  enabled: boolean
  maxRequests: number
  windowHours: number
}

interface GeminiConfig {
  hasApiKey: boolean
}

interface HealthData {
  build: BuildInfo
  storage: StorageInfo
  rateLimiter: RateLimiterInfo
  gemini: GeminiConfig
}

export function HealthInfo() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHealthData() {
      try {
        const response = await fetch("/api/studio/health")
        if (!response.ok) {
          throw new Error(`Failed to fetch health data: ${response.statusText}`)
        }
        const data = await response.json()
        setHealthData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchHealthData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-la-muted rounded w-1/4"></div>
              <div className="h-3 bg-la-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            <h3 className="font-semibold">Error Loading Health Data</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!healthData) {
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Build Info */}
      <Card>
        <CardHeader>
          <CardTitle>Build Information</CardTitle>
          <CardDescription>Application version and build details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Version:</span>
              <span className="ml-2 text-la-muted">{healthData.build.version}</span>
            </div>
            <div>
              <span className="font-medium">Current Time:</span>
              <span className="ml-2 text-la-muted">{healthData.build.timestamp}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Information</CardTitle>
          <CardDescription>User lessons storage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">User Lessons Count:</span>
              <span className="ml-2 text-la-muted">{healthData.storage.fileCount}</span>
            </div>
            {healthData.storage.latestSlugs.length > 0 && (
              <div>
                <span className="font-medium">Latest 5 Slugs:</span>
                <ul className="mt-1 ml-2 text-sm text-la-muted list-disc list-inside">
                  {healthData.storage.latestSlugs.map((slug, index) => (
                    <li key={index}>{slug}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiter Info */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiter</CardTitle>
          <CardDescription>API rate limiting configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Status:</span>
              <span className={`ml-2 ${healthData.rateLimiter.enabled ? 'text-green-600' : 'text-red-600'}`}>
                {healthData.rateLimiter.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="font-medium">Limit:</span>
              <span className="ml-2 text-la-muted">
                {healthData.rateLimiter.maxRequests} requests per {healthData.rateLimiter.windowHours} hour(s)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gemini Config */}
      <Card>
        <CardHeader>
          <CardTitle>Gemini Configuration</CardTitle>
          <CardDescription>AI service configuration status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">API Key:</span>
              <span className={`ml-2 ${healthData.gemini.hasApiKey ? 'text-green-600' : 'text-red-600'}`}>
                {healthData.gemini.hasApiKey ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}