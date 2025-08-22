'use client'

import { SortAscIcon, SortDescIcon } from 'lucide-react'
import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

import { cn } from '../../lib/utils'
import { attributes, type AttributeKey } from '../attributes'
import { SearchInput } from '../shared/search-input'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SORT_CONFIG, SORT_OPTIONS, type SortDirection, type SortOption } from './sort'

const filterParsers = {
  // Text search
  q: parseAsString.withDefault(''),

  // Model attributes
  img: parseAsBoolean.withDefault(false),
  file: parseAsBoolean.withDefault(false),
  reason: parseAsBoolean.withDefault(false),

  // Endpoint attributes
  tools: parseAsBoolean.withDefault(false),
  json: parseAsBoolean.withDefault(false),
  struct: parseAsBoolean.withDefault(false),
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
    <div className="space-y-4">
      {/* Search Row */}
      <SearchInput
        value={filters.q}
        onChange={handleSearchChange}
        placeholder="Search models..."
        className="w-full"
      />

      {/* Attributes Row */}
      <div className="space-y-1">
        <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Attributes
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AttributeCheckbox
            attributeKey="imageInput"
            checked={filters.img}
            onChange={(checked: boolean) => handleFilterChange('img', checked)}
          />
          <AttributeCheckbox
            attributeKey="fileInput"
            checked={filters.file}
            onChange={(checked: boolean) => handleFilterChange('file', checked)}
          />
          <AttributeCheckbox
            attributeKey="reasoning"
            checked={filters.reason}
            onChange={(checked: boolean) => handleFilterChange('reason', checked)}
          />
          <AttributeCheckbox
            attributeKey="tools"
            checked={filters.tools}
            onChange={(checked: boolean) => handleFilterChange('tools', checked)}
          />
          <AttributeCheckbox
            attributeKey="jsonObject"
            checked={filters.json}
            onChange={(checked: boolean) => handleFilterChange('json', checked)}
          />
          <AttributeCheckbox
            attributeKey="structuredOutputs"
            checked={filters.struct}
            onChange={(checked: boolean) => handleFilterChange('struct', checked)}
          />
          <AttributeCheckbox
            attributeKey="promptCaching"
            checked={filters.cache}
            onChange={(checked: boolean) => handleFilterChange('cache', checked)}
          />
        </div>
      </div>

      {/* Pricing and Sort Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Pricing
          </div>
          <PricingSegmentedControl value={filters.pricing} onValueChange={handlePricingChange} />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Sort
          </div>

          <div className="flex items-center gap-1">
            <Select value={filters.sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
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
                <SortAscIcon className="h-4 w-4" />
              ) : (
                <SortDescIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export the parsers for use in the main page component
export { filterParsers }

function PricingSegmentedControl({
  value,
  onValueChange,
}: {
  value: 'all' | 'free' | 'paid'
  onValueChange: (value: 'all' | 'free' | 'paid') => void
}) {
  const options = [
    { value: 'all' as const, label: 'All' },
    { value: 'free' as const, label: 'Free' },
    { value: 'paid' as const, label: 'Paid' },
  ]

  return (
    <div className="grid h-9 w-fit grid-flow-col items-center justify-center rounded border border-input">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
            value === option.value
              ? 'bg-input/30 text-foreground'
              : 'border-transparent text-card-foreground hover:bg-input/30 hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function AttributeCheckbox({
  attributeKey,
  checked,
  onChange,
}: {
  attributeKey: AttributeKey
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const config = attributes[attributeKey]
  const id = `filter-${attributeKey}`

  return (
    <Label
      htmlFor={id}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 font-mono font-medium whitespace-nowrap text-card-foreground uppercase transition-colors select-none hover:bg-input/30 hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        checked ? 'bg-input/30 text-accent-foreground' : '',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onChange(checked === true)}
        className="mr-1.5 h-4 w-4"
      />
      <span className="flex-shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{config.icon}</span>
      {config.label}
    </Label>
  )
}
