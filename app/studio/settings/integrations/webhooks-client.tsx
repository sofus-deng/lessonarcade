'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Check, X, Clock } from 'lucide-react'

interface Webhook {
  id: string
  url: string
  eventType: string
  isActive: boolean
  createdAt: Date
  lastTriggered: Date | null
  lastStatus: number | null
}

interface WebhooksClientProps {
  webhooks: Webhook[]
}

/**
 * Client component for managing webhook endpoints
 *
 * LA3-P2-02: Webhook-based integration PoC
 * This component provides UI for:
 * - Listing existing webhooks
 * - Adding new webhooks
 * - Toggling active/inactive status
 * - Deleting webhooks
 */
export function WebhooksClient({ webhooks }: WebhooksClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddWebhook = async () => {
    setIsAdding(true)
    try {
      const response = await fetch('/api/studio/settings/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, eventType: 'LESSON_COMMENT_CREATED' }),
      })

      if (!response.ok) throw new Error('Failed to add webhook')

      setNewUrl('')
      setShowAddForm(false)
      window.location.reload() // Simple refresh for PoC
    } catch (error) {
      console.error('Error adding webhook:', error)
      alert('Failed to add webhook. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/studio/settings/integrations/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) throw new Error('Failed to update webhook')
      window.location.reload()
    } catch (error) {
      console.error('Error toggling webhook:', error)
      alert('Failed to update webhook. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      const response = await fetch(`/api/studio/settings/integrations/webhooks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete webhook')
      window.location.reload()
    } catch (error) {
      console.error('Error deleting webhook:', error)
      alert('Failed to delete webhook. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-la-surface">Webhook Endpoints</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Webhook</CardTitle>
            <CardDescription>
              Enter the URL where webhook events will be sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-la-surface">Webhook URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-la-surface">Event Type</label>
                <div className="mt-1 p-2 bg-la-bg rounded border">
                  <span className="text-sm">Lesson comment created</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddWebhook} disabled={!newUrl || isAdding}>
                  {isAdding ? 'Adding...' : 'Add Webhook'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-la-muted">No webhooks configured yet.</p>
            <p className="text-sm text-la-muted mt-2">
              Add a webhook to receive notifications when lesson comments are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{webhook.eventType}</Badge>
                    </div>
                    <div className="font-mono text-sm text-la-surface break-all">
                      {webhook.url}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-la-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {new Date(webhook.createdAt).toLocaleString()}
                      </span>
                      {webhook.lastTriggered && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                        </span>
                      )}
                      {webhook.lastStatus !== null && (
                        <span className="flex items-center gap-1">
                          {webhook.lastStatus >= 200 && webhook.lastStatus < 300 ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-red-500" />
                          )}
                          Status: {webhook.lastStatus || 'Error'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(webhook.id, webhook.isActive)}
                      title={webhook.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {webhook.isActive ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(webhook.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
