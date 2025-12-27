/**
 * Studio Header Component
 *
 * LA3-P0-02: Studio header with workspace switcher and sign-out
 *
 * @module components/studio/studio-header
 */

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkspaceSwitcher } from './workspace-switcher'
import { signOutAction } from '@/app/auth/signout/action'

interface Workspace {
  id: string
  name: string
  slug: string
}

interface StudioHeaderProps {
  currentWorkspaceId: string
  workspaces: Workspace[]
  redirectTo?: string
}

export function StudioHeader({
  currentWorkspaceId,
  workspaces,
  redirectTo = '/studio',
}: StudioHeaderProps) {
  return (
    <header className="border-b border-la-border bg-la-surface">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Workspace Switcher */}
          <div className="flex items-center gap-4">
            <WorkspaceSwitcher
              currentWorkspaceId={currentWorkspaceId}
              workspaces={workspaces}
              redirectTo={redirectTo}
            />
          </div>

          {/* Right: Sign Out */}
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
