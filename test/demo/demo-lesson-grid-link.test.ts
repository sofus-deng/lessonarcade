import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('DemoLessonGrid CTA', () => {
  it('includes the Voice Chat link for demo lessons', () => {
    const filePath = join(process.cwd(), 'components', 'demo', 'DemoLessonGrid.tsx')
    const contents = readFileSync(filePath, 'utf8')

    expect(contents).toContain('/demo/voice-chat/')
    expect(contents).toContain('Voice Chat')
  })
})
