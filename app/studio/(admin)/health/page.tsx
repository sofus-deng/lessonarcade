import { Metadata } from "next"
import { HealthInfo } from "@/components/studio/health-info"

export const metadata: Metadata = {
  title: "Studio Health Diagnostics | LessonArcade",
  description: "Administrative diagnostics for LessonArcade Studio",
}

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-la-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-la-surface mb-4">
              Studio Health Diagnostics
            </h1>
            <p className="text-lg text-la-muted">
              Administrative diagnostics and system information
            </p>
          </div>

          {/* Health Information */}
          <div className="space-y-6">
            <HealthInfo />
          </div>
        </div>
      </div>
    </div>
  )
}