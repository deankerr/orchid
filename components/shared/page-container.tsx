import { cn } from '@/lib/utils'

import { LoaderSquare } from './loader'

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
  loading?: boolean
}) {
  return <div className={cn('space-y-6 py-8', className)}>{children}</div>
}

export function PageLoading() {
  return (
    <div className="pointer-events-none absolute inset-0 grid grow place-content-center">
      <LoaderSquare />
    </div>
  )
}

export function PageHeader({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {children}
    </div>
  )
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="flex items-center gap-3 font-mono text-2xl tracking-tight">{children}</h1>
}
