import { describe, it, expect } from 'vitest'
import { getBrandPreset, BRAND_PRESETS, type BrandId } from '@/lib/branding/brandPresets'

describe('getBrandPreset', () => {
  it('resolves known brand ids', () => {
    const defaultPreset = getBrandPreset('lessonarcade-default')
    expect(defaultPreset.id).toBe('lessonarcade-default')
    expect(defaultPreset.primaryColor).toBe('#6366f1')
    expect(defaultPreset.accentColor).toBe('#14b8a6')
    expect(defaultPreset.backgroundColor).toBe('#1e293b')

    const warmPaper = getBrandPreset('warm-paper')
    expect(warmPaper.id).toBe('warm-paper')
    expect(warmPaper.primaryColor).toBe('#d97706')
    expect(warmPaper.accentColor).toBe('#059669')
    expect(warmPaper.backgroundColor).toBe('#fffbeb')

    const nightClassroom = getBrandPreset('night-classroom')
    expect(nightClassroom.id).toBe('night-classroom')
    expect(nightClassroom.primaryColor).toBe('#8b5cf6')
    expect(nightClassroom.accentColor).toBe('#f43f5e')
    expect(nightClassroom.backgroundColor).toBe('#0f172a')
  })

  it('falls back to lessonarcade-default for unknown strings', () => {
    const unknown = getBrandPreset('unknown-brand')
    expect(unknown.id).toBe('lessonarcade-default')
    expect(unknown.primaryColor).toBe('#6366f1')
  })

  it('falls back to lessonarcade-default for undefined', () => {
    const undefinedPreset = getBrandPreset(undefined)
    expect(undefinedPreset.id).toBe('lessonarcade-default')
    expect(undefinedPreset.primaryColor).toBe('#6366f1')
  })

  it('falls back to lessonarcade-default for null', () => {
    const nullPreset = getBrandPreset(null)
    expect(nullPreset.id).toBe('lessonarcade-default')
    expect(nullPreset.primaryColor).toBe('#6366f1')
  })

  it('falls back to lessonarcade-default for empty string', () => {
    const emptyPreset = getBrandPreset('')
    expect(emptyPreset.id).toBe('lessonarcade-default')
    expect(emptyPreset.primaryColor).toBe('#6366f1')
  })
})

describe('BRAND_PRESETS', () => {
  it('contains all expected brand ids', () => {
    const expectedIds: BrandId[] = ['lessonarcade-default', 'warm-paper', 'night-classroom']
    const actualIds = Object.keys(BRAND_PRESETS) as BrandId[]

    expect(actualIds).toEqual(expectedIds)
  })

  it('each preset has all required properties', () => {
    const requiredKeys = ['id', 'label', 'description', 'logoText', 'primaryColor', 'accentColor', 'surfaceColor', 'backgroundColor']

    Object.values(BRAND_PRESETS).forEach((preset) => {
      requiredKeys.forEach((key) => {
        expect(preset).toHaveProperty(key)
      })
    })
  })

  it('each preset has valid color values', () => {
    const colorRegex = /^#[0-9a-fA-F]{6}$/

    Object.values(BRAND_PRESETS).forEach((preset) => {
      expect(preset.primaryColor).toMatch(colorRegex)
      expect(preset.accentColor).toMatch(colorRegex)
      expect(preset.surfaceColor).toMatch(colorRegex)
      expect(preset.backgroundColor).toMatch(colorRegex)
    })
  })
})
