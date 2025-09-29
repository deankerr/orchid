import { useId, useRef, useState } from 'react'

import { CircleXIcon, SearchIcon } from 'lucide-react'
import { useDebounce } from 'rooks'

import { Input } from '@/components/ui/input'

import { Label } from '../ui/label'

export function SearchInput({
  initialValue = '',
  onValueChange,
  label,
  hideLabel = false,
}: {
  initialValue?: string
  onValueChange?: (value: string) => void
  label?: string
  hideLabel?: boolean
}) {
  const id = useId()

  const [searchValue, setSearchValue] = useState(initialValue)
  const setValueDebounced = useDebounce((value) => onValueChange?.(value), 500)

  const inputRef = useRef<HTMLInputElement>(null)
  const handleClearInput = () => {
    setSearchValue('')
    setValueDebounced('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label ?? 'Text search'}
      </Label>
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          className="peer ps-9 pe-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
          placeholder="Search..."
          type="search"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
            setValueDebounced(e.target.value)
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <SearchIcon size={16} />
        </div>
        {searchValue && (
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
