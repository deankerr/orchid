import { useId, useRef } from 'react'

import { CircleXIcon, SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'

import { Label } from '../ui/label'

export function SearchInput({
  value = '',
  onValueChange,
  label,
  placeholder,
  hideLabel = false,
}: {
  value?: string
  onValueChange?: (value: string) => void
  label?: string
  placeholder?: string
  hideLabel?: boolean
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClearInput = () => {
    onValueChange?.('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={!label || hideLabel ? 'sr-only' : undefined}>
        {label ?? 'Search'}
      </Label>
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          className="peer w-64 px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
          placeholder={placeholder ?? 'Search...'}
          type="search"
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <SearchIcon size={16} />
        </div>
        {value && (
          <button
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear input"
            onClick={handleClearInput}
          >
            <CircleXIcon size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
