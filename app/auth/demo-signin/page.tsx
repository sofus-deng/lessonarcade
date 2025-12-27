/**
 * Demo Sign-in Page
 *
 * LA3-P0-02: Minimal demo sign-in page
 *
 * IMPORTANT: This is NOT production-grade authentication.
 * This is a demo-only implementation for Phase 3 SaaS development.
 *
 * @module app/auth/demo-signin/page
 */

import { Metadata } from 'next'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = {
  title: 'Sign In | LessonArcade Studio',
  description: 'Sign in to access LessonArcade Studio',
}

export default function DemoSignInPage() {
  return (
    <div className="min-h-screen bg-la-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-la-surface rounded-lg border border-la-border p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-la-surface mb-2">
              Sign In
            </h1>
            <p className="text-la-muted">
              Access LessonArcade Studio
            </p>
          </div>

          {/* Demo Warning */}
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Demo Mode:</strong> This is a demo-only sign-in for Phase 3
              SaaS development. This is NOT production-grade authentication.
            </p>
          </div>

          {/* Sign-in Form */}
          <SignInForm />

          {/* Demo Credentials Hint */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Demo Identities:</strong>
              <br />
              • Demo Owner – Full access
              <br />
              • Demo Editor – Can add comments
              <br />
              • Demo Viewer – Read-only, cannot post comments
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-la-muted mt-6">
          LessonArcade Studio - Phase 3 Demo
        </p>
      </div>
    </div>
  )
}
