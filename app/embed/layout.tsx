/**
 * Embed Layout
 *
 * Minimal layout for the embeddable LessonArcade player.
 * This layout provides brand theming support without site chrome
 * (navigation, hero, footer) since the player is designed to be
 * embedded in an iframe on external sites.
 */

import { BrandThemeProvider } from "@/components/layout/BrandThemeProvider"
import { getBrandPreset } from "@/lib/branding/brandPresets"

// Get brand from environment variable, default to lessonarcade-default
const brandId = process.env.NEXT_PUBLIC_BRAND_ID || "lessonarcade-default"
const brandPreset = getBrandPreset(brandId)

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BrandThemeProvider brandId={brandPreset.id}>
      {children}
    </BrandThemeProvider>
  )
}
