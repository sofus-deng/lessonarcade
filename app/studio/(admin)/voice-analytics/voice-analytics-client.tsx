"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VoiceAnalyticsClientProps {
  filters: {
    days: number
    engine: string
    languageCode: string
    reason: string
  }
}

function VoiceAnalyticsClientInner({ filters }: VoiceAnalyticsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    const newUrl = `${pathname}?${params.toString()}`
    router.push(newUrl)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Days Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Period</label>
            <Select
              value={filters.days.toString()}
              onValueChange={(value) => updateFilter("days", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 day</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Engine Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Engine</label>
            <Select
              value={filters.engine}
              onValueChange={(value) => updateFilter("engine", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engines</SelectItem>
                <SelectItem value="browser">Browser</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select
              value={filters.languageCode}
              onValueChange={(value) => updateFilter("languageCode", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Stop Reason</label>
            <Select
              value={filters.reason}
              onValueChange={(value) => updateFilter("reason", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="user_stop">User Stop</SelectItem>
                <SelectItem value="navigation">Navigation</SelectItem>
                <SelectItem value="rate_limited">Rate Limited</SelectItem>
                <SelectItem value="cooldown_blocked">Cooldown Blocked</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function VoiceAnalyticsClient(props: VoiceAnalyticsClientProps) {
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <VoiceAnalyticsClientInner {...props} />
    </Suspense>
  )
}