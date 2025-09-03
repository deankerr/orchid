'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { FeatureFlag } from '@/components/dev-utils/feature-flag'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function NavLink({
  href,
  className,
  children,
  ...props
}: { href: string } & React.ComponentProps<typeof Button>) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)
  return (
    <Button
      variant="ghost"
      className={cn(
        isActive ? 'bg-accent/50 text-accent-foreground' : 'text-muted-foreground',
        className,
      )}
      {...props}
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

      <NavLink href="/changes">Changes</NavLink>

      <FeatureFlag flag="dev">
        <div className="ml-auto flex gap-2 font-mono">
          <NavLink href="/dev/components" className="border border-dashed">
            Components
          </NavLink>

          <NavLink href="/dev/changes" className="border border-dashed">
            Changes
          </NavLink>
        </div>
      </FeatureFlag>
    </nav>
  )
}
