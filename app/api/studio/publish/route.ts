import { NextRequest, NextResponse } from "next/server"
import { saveUserLesson } from "@/lib/lessonarcade/storage"
import { lessonArcadeLessonSchema } from "@/lib/lessonarcade/schema"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lesson } = body

    // Validate the lesson data
    const validationResult = lessonArcadeLessonSchema.safeParse(lesson)
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('; ')
      
      return NextResponse.json(
        { error: `Invalid lesson data: ${errorMessages}` },
        { status: 400 }
      )
    }

    // Save the lesson
    const slug = await saveUserLesson(validationResult.data)

    return NextResponse.json({ 
      success: true, 
      slug,
      message: "Lesson published successfully" 
    })

  } catch (error) {
    console.error("Error publishing lesson:", error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish lesson" },
      { status: 500 }
    )
  }
}