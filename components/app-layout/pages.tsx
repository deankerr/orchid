import { cn } from '@/lib/utils'

import { LoaderSquare } from '../shared/loader'

export function PageContainer({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main data-slot="page-container" className={cn('flex flex-col px-3', className)} {...props} />
  )
}

export function PageHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header"
      className={cn('flex flex-col gap-2 bg-background px-3 py-2 md:py-3', className)}
      {...props}
    />
  )
}

// Page title and description components
export function PageTitle({ className, ...props }: React.ComponentProps<'h1'>) {
  return (
    <h1
      className={cn('flex items-center gap-3 font-mono tracking-tight md:text-lg', className)}
      {...props}
    />
  )
}

export function PageDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function PageLoading() {
  return <LoaderSquare className="m-auto" />
}
