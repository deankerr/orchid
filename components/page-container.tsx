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
  return <div className={cn('space-y-4 py-8', className)}>{children}</div>
}

export function PageLoading() {
  return (
    <PageContainer className="grid grow place-content-center pt-0">
      <LoaderSquare />
    </PageContainer>
  )
}

export function PageHeader({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)} {...props}>
      {children}
    </div>
  )
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="flex items-center gap-3 font-mono text-2xl font-medium tracking-tight">
      {children}
    </h1>
  )
}
