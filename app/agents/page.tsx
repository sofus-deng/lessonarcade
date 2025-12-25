import { ElevenLabsConversation } from "@/components/agents/elevenlabs-conversation"

/**
 * Agents Page
 *
 * A standalone page for ElevenLabs voice conversations.
 * Renders the ElevenLabsConversation component with a simple layout.
 *
 * This page does not disturb existing navigation and is accessible at /agents.
 */
export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-la-bg" data-testid="la-agents-page">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-la-surface mb-2">
            Voice Conversation with AI Agent
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Have a natural voice conversation with an AI agent. Click the button below to start.
            Please note that microphone permission is required for this feature to work.
          </p>
        </div>

        {/* Conversation Component */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <ElevenLabsConversation />
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-sm text-gray-500">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Click "Start Conversation" to begin</li>
            <li>Grant microphone permission when prompted</li>
            <li>Speak naturally with AI agent</li>
            <li>Click "Stop Conversation" to end</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
