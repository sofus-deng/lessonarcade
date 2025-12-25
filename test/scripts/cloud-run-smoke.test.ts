import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('cloud-run smoke script', () => {
  it('includes the voice chat demo route check', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'cloud-run', 'smoke-test.sh')
    const scriptContents = readFileSync(scriptPath, 'utf8')

    expect(scriptContents).toContain('/demo/voice-chat/effective-meetings')
  })
})
