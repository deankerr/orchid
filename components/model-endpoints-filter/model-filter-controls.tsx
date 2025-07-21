'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

import { SearchInput } from '../search-input'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SORT_CONFIG, SORT_OPTIONS, type SortDirection, type SortOption } from './sort'

const filterParsers = {
  // Text search
  q: parseAsString.withDefault(''),

  // Model capabilities
  img: parseAsBoolean.withDefault(false),
  file: parseAsBoolean.withDefault(false),
  reason: parseAsBoolean.withDefault(false),

  // Endpoint features
  tools: parseAsBoolean.withDefault(false),
  json: parseAsBoolean.withDefault(false),
  free: parseAsBoolean.withDefault(false),
  cache: parseAsBoolean.withDefault(false),

  // Sort
  sort: parseAsStringEnum<SortOption>(SORT_OPTIONS.map((o) => o.value)).withDefault('tokens_7d'),
  dir: parseAsStringEnum<SortDirection>(['asc', 'desc']).withDefault('desc'),
}

export function ModelFilterControls() {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    history: 'replace',
    shallow: true,
  })

  const handleSearchChange = (value: string) => {
    setFilters({ q: value || null })
  }

  const handleFilterChange = (key: keyof typeof filters, value: boolean) => {
    setFilters({ [key]: value || null })
  }

  const handleSortChange = (value: SortOption) => {
    // Set sort and reset to natural direction
    const naturalDirection = SORT_CONFIG[value].naturalDirection
    setFilters({
      sort: value,
      dir: naturalDirection,
    })
  }

  const handleDirectionToggle = () => {
    const newDirection: SortDirection = filters.dir === 'asc' ? 'desc' : 'asc'
    setFilters({ dir: newDirection })
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchInput
            value={filters.q}
            onChange={handleSearchChange}
            placeholder="Search models..."
            className="w-full"
          />
        </div>
        <Select value={filters.sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDirectionToggle}
          title={`Sort ${filters.dir === 'asc' ? 'ascending' : 'descending'}`}
        >
          {filters.dir === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filter Checkboxes */}
      <div className="rounded-sm border bg-card p-3">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-3">
          {/* Model Capabilities */}
          <FilterCheckbox
            label="Image Input"
            checked={filters.img}
            onChange={(checked: boolean) => handleFilterChange('img', checked)}
          />
          <FilterCheckbox
            label="File Input"
            checked={filters.file}
            onChange={(checked: boolean) => handleFilterChange('file', checked)}
          />
          <FilterCheckbox
            label="Reasoning"
            checked={filters.reason}
            onChange={(checked: boolean) => handleFilterChange('reason', checked)}
          />

          {/* Endpoint Features */}
          <FilterCheckbox
            label="Tools"
            checked={filters.tools}
            onChange={(checked: boolean) => handleFilterChange('tools', checked)}
          />
          <FilterCheckbox
            label="JSON"
            checked={filters.json}
            onChange={(checked: boolean) => handleFilterChange('json', checked)}
          />
          <FilterCheckbox
            label="Free"
            checked={filters.free}
            onChange={(checked: boolean) => handleFilterChange('free', checked)}
          />
          <FilterCheckbox
            label="Caching"
            checked={filters.cache}
            onChange={(checked: boolean) => handleFilterChange('cache', checked)}
          />
        </div>
      </div>
    </div>
  )
}

// Export the parsers for use in the main page component
export { filterParsers }

interface FilterCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function FilterCheckbox({ label, checked, onChange }: FilterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={label}
        checked={checked}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <Label htmlFor={label} className="cursor-pointer text-sm font-normal whitespace-nowrap">
        {label}
      </Label>
    </div>
  )
}
