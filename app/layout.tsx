import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrandThemeProvider } from "@/components/layout/BrandThemeProvider";
import { getBrandPreset } from "@/lib/branding/brandPresets";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Get brand from environment variable, default to lessonarcade-default
const brandId = process.env.NEXT_PUBLIC_BRAND_ID || "lessonarcade-default";
const brandPreset = getBrandPreset(brandId);

export const metadata: Metadata = {
  title: "LessonArcade - Turn Teaching Videos into Playable Lessons",
  description: "Transform training clips, webinars, and teaching videos into interactive sessions with checkpoints, quick challenges, and recap cards. Built for creators, teams, and curious learners.",
  keywords: ["interactive learning", "video lessons", "education", "training", "engagement"],
  authors: [{ name: "LessonArcade Team" }],
  openGraph: {
    title: "LessonArcade - Turn Teaching Videos into Playable Lessons",
    description: "Transform your teaching videos into engaging, interactive lessons that keep learners engaged and track their progress.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LessonArcade - Turn Teaching Videos into Playable Lessons",
    description: "Transform your teaching videos into engaging, interactive lessons that keep learners engaged and track their progress.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <BrandThemeProvider brandId={brandPreset.id}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </BrandThemeProvider>
    </html>
  );
}
