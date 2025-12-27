/**
 * Sign-in Form Client Component
 *
 * LA3-P0-02: Client-side sign-in form
 *
 * @module app/auth/demo-signin/sign-in-form
 */

'use client'

import { useFormState } from 'react-dom'
import {
  signInAction,
  signInAsDemoOwnerAction,
  signInAsDemoEditorAction,
  signInAsDemoViewerAction,
  SignInState,
} from '../signin/action'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SignInForm() {
  const [state, formAction] = useFormState<SignInState | null, FormData>(signInAction, null)

  return (
    <>
      {/* Sign-in Form */}
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-la-surface mb-2">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            className="w-full"
          />
        </div>

        {state?.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">
              {state.error}
            </p>
          </div>
        )}

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-la-border" />
        <span className="px-4 text-sm text-la-muted">or</span>
        <div className="flex-1 border-t border-la-border" />
      </div>

      {/* Quick Demo Sign-in */}
      <div className="space-y-3">
        <p className="text-sm text-la-muted text-center">
          Quick demo sign-in:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <form action={signInAsDemoOwnerAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full text-xs"
            >
              Owner
            </Button>
          </form>
          <form action={signInAsDemoEditorAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full text-xs"
            >
              Editor
            </Button>
          </form>
          <form action={signInAsDemoViewerAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full text-xs"
            >
              Viewer
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
