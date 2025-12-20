import { NextResponse } from "next/server"
import { getAvailablePresets } from "@/lib/lessonarcade/voice/preset-registry"

// Configure runtime for Node.js
export const runtime = "nodejs"

export async function GET() {
  try {
    const presets = getAvailablePresets()
    
    return NextResponse.json({
      ok: true,
      presets
    })
  } catch (error) {
    console.error('Error fetching voice presets:', error)
    
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: "INTERNAL_ERROR", 
          message: "Failed to retrieve voice presets" 
        } 
      },
      { status: 500 }
    )
  }
}