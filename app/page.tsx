import { Navigation } from "@/components/layout/navigation"
import { HeroSection } from "@/components/layout/hero-section"
import { PillarsSection } from "@/components/layout/pillars-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-la-bg">
      <Navigation />
      <main>
        <HeroSection />
        <PillarsSection />
      </main>
    </div>
  )
}
