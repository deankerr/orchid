'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { FeatureFlag } from '@/components/dev-utils/feature-flag'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)
  return (
    <Button
      variant="ghost"
      className={cn(isActive ? 'bg-accent/50 text-accent-foreground' : 'text-muted-foreground')}
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

      <FeatureFlag flag="providers">
        <NavLink href="/providers">Providers</NavLink>
      </FeatureFlag>

      <FeatureFlag flag="changes">
        <NavLink href="/changes">Changes</NavLink>
      </FeatureFlag>
    </nav>
  )
}
