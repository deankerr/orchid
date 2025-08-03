'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

import { cn } from '../../lib/utils'
import { SearchInput } from '../shared/search-input'
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
  pricing: parseAsStringEnum<'all' | 'free' | 'paid'>(['all', 'free', 'paid']).withDefault('all'),
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

  const handlePricingChange = (value: 'all' | 'free' | 'paid') => {
    setFilters({ pricing: value === 'all' ? null : value })
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
    <div className="space-y-2">
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

      {/* Filter Groups */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {/* Input Modalities */}
        <FieldSet legend="Input Modalities">
          <FilterCheckbox
            label="Image"
            checked={filters.img}
            onChange={(checked: boolean) => handleFilterChange('img', checked)}
          />
          <FilterCheckbox
            label="File"
            checked={filters.file}
            onChange={(checked: boolean) => handleFilterChange('file', checked)}
          />
        </FieldSet>

        {/* Capabilities */}
        <FieldSet legend="Capabilities">
          <FilterCheckbox
            label="Reasoning"
            checked={filters.reason}
            onChange={(checked: boolean) => handleFilterChange('reason', checked)}
          />
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
            label="Cache"
            checked={filters.cache}
            onChange={(checked: boolean) => handleFilterChange('cache', checked)}
          />
        </FieldSet>

        {/* Pricing */}
        <FieldSet legend="Pricing">
          <Select value={filters.pricing} onValueChange={handlePricingChange}>
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Paid/Free</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </FieldSet>
      </div>
    </div>
  )
}

// Export the parsers for use in the main page component
export { filterParsers }

function FieldSet({
  legend,
  className,
  children,
  ...props
}: {
  legend: string
} & React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-sm border bg-card p-3 sm:min-w-0 sm:flex-1',
        className,
      )}
      {...props}
    >
      <legend className="px-2 text-sm font-medium text-muted-foreground">{legend}</legend>
      {children}
    </fieldset>
  )
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
} & Omit<React.ComponentProps<'fieldset'>, 'onChange'>) {
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
