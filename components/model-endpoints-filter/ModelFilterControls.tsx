'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

import { SearchInput } from '../search-input'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { FilterCheckbox } from './FilterCheckbox'
import { NATURAL_SORT_DIRECTIONS, type SortDirection, type SortOption } from './types'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'created', label: 'Recently Added' },
  { value: 'tokens_7d', label: 'Tokens (7d)' },
  { value: 'tokens_30d', label: 'Tokens (30d)' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'input_price', label: 'Input Price' },
  { value: 'output_price', label: 'Output Price' },
  { value: 'context', label: 'Context Length' },
  { value: 'throughput', label: 'Throughput' },
  { value: 'latency', label: 'Latency' },
]

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
  sort: parseAsStringEnum<SortOption>(sortOptions.map((o) => o.value)).withDefault('tokens_7d'),
  dir: parseAsStringEnum<SortDirection>(['asc', 'desc']).withDefault('desc'),
}

interface ModelFilterControlsProps {
  resultCount?: number
  totalCount?: number
}

export function ModelFilterControls({ resultCount, totalCount }: ModelFilterControlsProps) {
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
    const naturalDirection = NATURAL_SORT_DIRECTIONS[value]
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
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchInput
            value={filters.q}
            onChange={handleSearchChange}
            placeholder="Search models..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-[200px]">
            <Select value={filters.sort} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDirectionToggle}
            className="px-3"
            title={`Sort ${filters.dir === 'asc' ? 'ascending' : 'descending'}`}
          >
            {filters.dir === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Filter Checkboxes */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
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
              label="JSON Response"
              checked={filters.json}
              onChange={(checked: boolean) => handleFilterChange('json', checked)}
            />
            <FilterCheckbox
              label="Free Tier"
              checked={filters.free}
              onChange={(checked: boolean) => handleFilterChange('free', checked)}
            />
            <FilterCheckbox
              label="Prompt Caching"
              checked={filters.cache}
              onChange={(checked: boolean) => handleFilterChange('cache', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Result Count */}
      {typeof resultCount === 'number' && typeof totalCount === 'number' && (
        <div className="text-sm text-muted-foreground">
          Showing {resultCount.toLocaleString()} of {totalCount.toLocaleString()} models
        </div>
      )}
    </div>
  )
}

// Export the parsers for use in the main page component
export { filterParsers }
