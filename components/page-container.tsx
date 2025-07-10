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

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="font-mono text-2xl font-medium tracking-tight">{children}</h1>
}
