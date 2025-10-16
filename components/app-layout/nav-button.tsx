'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NavButton({
  href,
  className,
  children,
  ...props
}: { href: string } & React.ComponentProps<typeof Button>) {
  const pathname = usePathname()
  const isActive = pathname === href
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
