import Link from 'next/link'

import { DevBreakpointIndicator } from '@/components/dev-utils/dev-breakpoint-indicator'
import { FeatureFlag } from '@/components/dev-utils/feature-flag'
import { SnapshotStatusIndicator } from '@/components/snapshot-status-indicator'
import { Button } from '@/components/ui/button'

import { AppNav } from './app-nav'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 md:px-6 lg:px-12">
      <header className="flex items-center justify-start gap-6 py-4">
        <Button variant="link" className="-ml-4 font-mono text-base" asChild>
          <Link href="/">ORCHID</Link>
        </Button>

        <AppNav />

        <FeatureFlag flag="snapshots">
          <div className="flex items-center justify-end gap-3">
            <SnapshotStatusIndicator />
          </div>
        </FeatureFlag>
      </header>
      {children}
      <DevBreakpointIndicator />
    </div>
  )
}
