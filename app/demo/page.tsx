import { Metadata } from "next"
import { getDemoLessonSummaries } from "@/lib/lessonarcade/loaders"
import { DemoLessonGrid } from "@/components/demo/DemoLessonGrid"
import { BrandSwitcher } from "@/components/demo/BrandSwitcher"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Demo Lessons | LessonArcade",
  description: "Try our interactive demo lessons and experience the power of playable learning.",
  keywords: ["demo", "interactive lessons", "learning", "education"],
  openGraph: {
    title: "Demo Lessons | LessonArcade",
    description: "Try our interactive demo lessons and experience the power of playable learning.",
    type: "website",
  },
}

export default async function DemoPage() {
  const demoLessons = await getDemoLessonSummaries()

  return (
    <div data-testid="la-demo-page" className="min-h-screen bg-la-bg">
      {/* Brand Switcher (dev only) */}
      <BrandSwitcher />

      {/* Header Section */}
      <div className="bg-la-surface border-b border-la-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-la-bg mb-4">
              Try Our Demo Lessons
            </h1>
            <p className="text-xl text-la-muted max-w-3xl mx-auto mb-8">
              Experience interactive learning with our carefully crafted demo lessons. 
              Each demo showcases different domains and learning styles.
            </p>
            
            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-la-accent text-la-bg hover:bg-la-accent/90">
                <Link href="/studio">
                  Create Your Own Lesson
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/agents">
                  Voice Conversation
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Lessons Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DemoLessonGrid lessons={demoLessons} />
      </main>

      {/* Bottom CTA Section */}
      <div className="bg-la-surface border-t border-la-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-la-bg mb-4">
              Ready to Create Your Own Lessons?
            </h2>
            <p className="text-la-muted mb-6 max-w-2xl mx-auto">
              Transform your teaching videos into interactive, engaging learning experiences 
              that captivate your audience and drive real results.
            </p>
            <Button asChild size="lg" className="bg-la-primary text-la-surface hover:bg-la-primary/90">
              <Link href="/studio">
                Get Started with Lesson Studio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
