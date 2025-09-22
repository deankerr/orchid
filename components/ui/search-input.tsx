import { SearchIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from './button'
import { Input } from './input'

interface SearchInputProps extends React.ComponentProps<typeof Input> {
  onClear?: () => void
}

export function SearchInput({ className, value, onClear, ...props }: SearchInputProps) {
  const hasValue = typeof value === 'string' && value.length > 0

  return (
    <div className={cn('relative', className)}>
      <SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} className={cn('ps-9', hasValue && 'pe-8')} {...props} />
      {hasValue && onClear && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute end-1.5 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          onClick={onClear}
          type="button"
        >
          <XIcon className="h-3 w-3" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}
