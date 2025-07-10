'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { PageContainer } from './page-container'
import { SnapshotStatus } from './snapshot-status'
import { ThemeButton } from './ui/theme-button'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={cn(
        'rounded px-3 py-1.5 text-muted-foreground hover:text-foreground',
        isActive && 'bg-muted text-foreground',
      )}
    >
      {children}
    </Link>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-background">
        <PageContainer className="flex items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-mono text-lg font-medium text-neutral-700 dark:text-neutral-400"
            >
              ORCHID
            </Link>
          </div>

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
        </PageContainer>
      </header>
      {children}
    </>
  )
}
