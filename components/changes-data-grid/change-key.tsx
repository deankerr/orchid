import { cn } from '@/lib/utils'

export function ChangeKey({ children, ...props }: React.ComponentProps<'div'>) {
  const processedChildren =
    typeof children === 'string'
      ? children.replace(/_/g, '_\u200B') // Insert zero-width space after underscores
      : children

  return (
    <div className={cn('text-[95%] text-neutral-200', props.className)} {...props}>
      {processedChildren}
    </div>
  )
}
