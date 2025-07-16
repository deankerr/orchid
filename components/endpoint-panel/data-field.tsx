import { cn } from '@/lib/utils'

export function DataField({
  label,
  children,
  className,
  ...props
}: { label: string } & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex min-w-36 flex-col gap-1.5 bg-muted p-2.5 text-base', className)}
      {...props}
    >
      <div className="text-[10px] uppercase">{label}</div>
      <div>{children}</div>
    </div>
  )
}
