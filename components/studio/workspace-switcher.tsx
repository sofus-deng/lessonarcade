/**
 * Workspace Switcher Component
 *
 * LA3-P0-02: Workspace switcher dropdown for Studio
 *
 * @module components/studio/workspace-switcher
 */

'use client'

import { useTransition } from 'react'
import { Building2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { switchWorkspaceAction } from '@/app/studio/switch-workspace/action'

interface Workspace {
  id: string
  name: string
  slug: string
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string
  workspaces: Workspace[]
  redirectTo?: string
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  workspaces,
  redirectTo = '/studio',
}: WorkspaceSwitcherProps) {
  const [isPending, startTransition] = useTransition()

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId)

  const handleWorkspaceChange = (workspaceId: string) => {
    const formData = new FormData()
    formData.append('workspaceId', workspaceId)
    formData.append('redirectTo', redirectTo)
    startTransition(() => {
      switchWorkspaceAction(formData)
    })
  }

  if (!currentWorkspace) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-la-muted" />
      <Select
        value={currentWorkspaceId}
        onValueChange={handleWorkspaceChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              {workspace.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
