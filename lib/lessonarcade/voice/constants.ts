/**
 * Constants for voice/text-to-speech functionality
 */

// Conservative default max characters for TTS requests
// Based on ElevenLabs documentation:
// - Free plans: 2,500 characters
// - Paid plans: 5,000 characters
// - API models: 10,000-40,000 characters depending on model
export const DEFAULT_TTS_MAX_CHARS = 5000;

/**
 * Get the maximum characters for TTS requests from environment or default
 * @returns The maximum number of characters allowed per TTS request
 */
export function getTtsMaxChars(): number {
  const envValue = process.env.VOICE_TTS_MAX_CHARS;
  if (!envValue) return DEFAULT_TTS_MAX_CHARS;
  
  const parsed = parseInt(envValue, 10);
  if (isNaN(parsed) || parsed <= 0) {
    console.warn(
      `Invalid VOICE_TTS_MAX_CHARS value: "${envValue}". Using default: ${DEFAULT_TTS_MAX_CHARS}`
    );
    return DEFAULT_TTS_MAX_CHARS;
  }
  
  return parsed;
}