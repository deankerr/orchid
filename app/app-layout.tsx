'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { DevBreakpointIndicator } from '@/components/dev-breakpoint-indicator'
import { SnapshotStatus } from '@/components/snapshot-status'
import { Button } from '@/components/ui/button'
import { ThemeButton } from '@/components/ui/theme-button'
import { cn } from '@/lib/utils'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)
  return (
    <Button
      variant="ghost"
      className={cn(
        isActive ? 'bg-accent text-accent-foreground dark:bg-accent/50' : 'text-muted-foreground',
      )}
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 sm:px-6 lg:px-12">
      <header className="flex items-center justify-start gap-6 py-4">
        <Button variant="link" className="-ml-4 font-mono text-base" asChild>
          <Link href="/">ORCHID</Link>
        </Button>

        <nav className="flex grow items-center gap-2 text-sm font-medium">
          <NavLink href="/models">Models</NavLink>
          <NavLink href="/providers">Providers</NavLink>
        </nav>

        <div className="flex items-center justify-end gap-3">
          <Link href="/snapshots">
            <SnapshotStatus />
          </Link>
          <ThemeButton />
        </div>
      </header>
      {children}
      <DevBreakpointIndicator />
    </div>
  )
}
