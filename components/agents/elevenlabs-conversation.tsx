"use client"

import { useConversation } from "@elevenlabs/react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

/**
 * ElevenLabsConversation Component
 *
 * A React component that provides a voice conversation interface with ElevenLabs Agents.
 * Uses the useConversation hook from @elevenlabs/react to manage conversation state.
 *
 * Features:
 * - Start/Stop conversation buttons
 * - Microphone permission request (only on user click)
 * - Status display (connected/disconnected, speaking)
 * - Error handling and display
 */
export function ElevenLabsConversation() {
  const conversation = useConversation()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Handle starting a conversation
   *
   * 1. Request microphone permission
   * 2. Fetch signed URL from API
   * 3. Start WebRTC session with ElevenLabs
   */
  const handleStart = async () => {
    setError(null)
    setIsLoading(true)

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Get signed URL from our API route
      const response = await fetch("/api/get-signed-url")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to get signed URL")
      }

      const { signedUrl } = await response.json()

      // Start conversation session with signed URL
      // Using signedUrl from API endpoint for WebRTC connection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await conversation.startSession(signedUrl as any)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start conversation"
      setError(errorMessage)
      console.error("Failed to start conversation:", err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle stopping a conversation
   *
   * Ends the active WebRTC session with ElevenLabs
   */
  const handleStop = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await conversation.endSession()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to stop conversation"
      setError(errorMessage)
      console.error("Failed to stop conversation:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Determine if conversation is connected based on status
  const isConnected = conversation.status === "connected"

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status Display */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Connection:</span>
          <span
            className={`font-medium ${
              isConnected ? "text-green-600" : "text-gray-500"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Speaking:</span>
          <span
            className={`font-medium ${
              conversation.isSpeaking ? "text-la-accent" : "text-gray-500"
            }`}
          >
            {conversation.isSpeaking ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      {!isConnected ? (
        <Button
          onClick={handleStart}
          disabled={isLoading}
          className="min-w-[180px]"
        >
          {isLoading ? "Starting..." : "Start Conversation"}
        </Button>
      ) : (
        <Button
          onClick={handleStop}
          disabled={isLoading}
          variant="destructive"
          className="min-w-[180px]"
        >
          {isLoading ? "Stopping..." : "Stop Conversation"}
        </Button>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-2 rounded-md">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Info Text */}
      {!isConnected && !error && (
        <p className="text-xs text-gray-500 text-center max-w-md">
          Click "Start Conversation" to begin. Your browser will request microphone permission.
        </p>
      )}
    </div>
  )
}
