import Link from 'next/link'

import { DevBreakpointIndicator } from '@/components/dev-utils/dev-breakpoint-indicator'
import { Button } from '@/components/ui/button'

import { AppNav } from './app-nav'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 md:px-6 lg:px-12">
      <header className="flex items-center justify-start gap-6 py-4">
        <Button mode="link" underline="solid" className="font-mono" size="lg" asChild>
          <Link href="/">ORCHID</Link>
        </Button>

        <AppNav />
      </header>
      {children}
      <DevBreakpointIndicator />
    </div>
  )
}
