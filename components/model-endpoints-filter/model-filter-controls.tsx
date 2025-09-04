'use client'

import { SortAscIcon, SortDescIcon } from 'lucide-react'

import { cn } from '../../lib/utils'
import { attributesMap, type AttributeCapabilityKey, type AttributeDef } from '../attributes'
import { SearchInput } from '../shared/search-input'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { AttributeCheckbox } from './attribute-checkbox'
import { PricingControl } from './pricing-control'
import { useModelFilterSearchParams } from './search-params'
import { SORT_OPTIONS, type SortDirection, type SortOption } from './sort'

export function ModelFilterControls() {
  const [filters, setFilters] = useModelFilterSearchParams()

  const handleDirectionToggle = () => {
    const newDirection: SortDirection = filters.dir === 'asc' ? 'desc' : 'asc'
    setFilters({ dir: newDirection })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-2">
      {/* Search Row */}
      <SearchInput
        value={filters.q}
        onChange={(value) => setFilters({ q: value })}
        placeholder="Search models..."
        className="w-full"
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <Fieldset legend="Attributes">
          <div className="flex flex-wrap items-center gap-2">
            {[...attributesMap.entries()]
              .filter(
                (e): e is [AttributeCapabilityKey, AttributeDef] => e[1].type === 'capability',
              )
              .map(([key]) => (
                <AttributeCheckbox
                  key={key}
                  attributeKey={key}
                  checked={filters[key]}
                  onChange={(checked: boolean) => setFilters({ [key]: checked })}
                />
              ))}
          </div>
        </Fieldset>

        {/* Pricing and Sort  */}
        <div className="flex justify-between gap-3 sm:grid">
          <Fieldset legend="Pricing">
            <PricingControl
              className="sm:w-full"
              value={filters.pricing}
              onValueChange={(value) => setFilters({ pricing: value })}
            />
          </Fieldset>

          <Fieldset legend="Sort">
            <div className="flex items-center gap-1">
              <Select
                value={filters.sort}
                onValueChange={(value: SortOption) => setFilters({ sort: value })}
              >
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
          </Fieldset>
        </div>
      </div>
    </div>
  )
}

function Fieldset({
  legend,
  className,
  children,
  ...props
}: { legend: string } & React.ComponentProps<'fieldset'>) {
  return (
    <fieldset className={cn('space-y-1', className)} {...props}>
      <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {legend}
      </legend>
      {children}
    </fieldset>
  )
}
