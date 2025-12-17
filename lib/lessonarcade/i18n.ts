import type { I18nText, LanguageCode } from './schema'

/**
 * Gets localized text from an I18nText object with fallback to the original text.
 * 
 * @param i18nText - The internationalization text object (optional)
 * @param fallbackText - The fallback text to use when translation is missing
 * @param language - The target language code
 * @returns The localized text or fallback if translation is not available
 */
export function getLocalizedText(
  i18nText: I18nText | undefined,
  fallbackText: string,
  language: LanguageCode
): string {
  // If no i18n text provided, return fallback
  if (!i18nText) {
    return fallbackText
  }
  
  // If translation exists for the target language, return it
  if (i18nText[language]) {
    return i18nText[language]
  }
  
  // Otherwise return the fallback text
  return fallbackText
}