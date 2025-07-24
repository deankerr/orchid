'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
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

export function AppNav() {
  return (
    <nav className="flex grow items-center gap-2 text-sm font-medium">
      <NavLink href="/models">Models</NavLink>
      <NavLink href="/providers">Providers</NavLink>
      <NavLink href="/snapshots">Snapshots</NavLink>
    </nav>
  )
}
