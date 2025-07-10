import { cn } from '@/lib/utils'

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('space-y-4 px-6 py-8 lg:px-12', className)}>{children}</div>
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="font-mono text-2xl font-medium tracking-tight">{children}</h1>
}
