import { cn } from '@/lib/utils'

export function PricingControl({
  value,
  onValueChange,
  className,
  ...props
}: {
  value: 'all' | 'free' | 'paid'
  onValueChange: (value: 'all' | 'free' | 'paid') => void
} & React.ComponentProps<'div'>) {
  const options = [
    { value: 'all' as const, label: 'All' },
    { value: 'free' as const, label: 'Free' },
    { value: 'paid' as const, label: 'Paid' },
  ]

  return (
    <div
      className={cn(
        'grid h-9 w-fit auto-cols-fr grid-flow-col divide-x rounded-sm border border-input',
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
            value === option.value
              ? 'bg-input/30 text-foreground'
              : 'border-transparent text-muted-foreground hover:bg-input/30 hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
