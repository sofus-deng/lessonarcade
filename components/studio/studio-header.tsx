/**
 * Studio Header Component
 *
 * LA3-P0-02: Studio header with workspace switcher and sign-out
 * LA3-P2-03: Added navigation links for Studio pages
 *
 * @module components/studio/studio-header
 */

import { LogOut, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkspaceSwitcher } from './workspace-switcher'
import { signOutAction } from '@/app/auth/signout/action'
import Link from 'next/link'

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
          <div className="flex items-center gap-6">
            <WorkspaceSwitcher
              currentWorkspaceId={currentWorkspaceId}
              workspaces={workspaces}
              redirectTo={redirectTo}
            />
            {/* Studio Navigation */}
            <nav
              className="hidden md:flex items-center gap-4"
              aria-label="Studio navigation"
            >
              <Link
                href="/studio"
                className="text-sm font-medium text-la-muted hover:text-la-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg rounded"
              >
                Dashboard
              </Link>
              <Link
                href="/studio/lessons"
                className="text-sm font-medium text-la-muted hover:text-la-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg rounded"
              >
                Lessons
              </Link>
              <Link
                href="/studio/insights"
                className="flex items-center gap-2 text-sm font-medium text-la-muted hover:text-la-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg rounded"
              >
                <BarChart3 className="h-4 w-4" />
                Insights
              </Link>
            </nav>
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
