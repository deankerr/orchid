import { useState } from 'react'

import { api } from '@/convex/_generated/api'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { cn } from '@/lib/utils'

import { EntityBadge } from './entity-badge'

export function OREntityCombobox({
  value,
  onValueChange,
  placeholder = 'Search models/providers...',
  className,
}: {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const models = useCachedQuery(api.models.list, {}, 'models-list')
  const providers = useCachedQuery(api.providers.list, {}, 'providers-list')

  const isLoading = models === undefined || providers === undefined

  const selected =
    models?.find((model) => model.slug === value) ||
    providers?.find((provider) => provider.slug === value)

  // workaround for correctly resetting command list scroll
  const [highlighted, setHighlighted] = useState('')
  const [search, setSearch] = useState('')
  const setInputValue = (v: string) => {
    setSearch(v)
    if (v === '') {
      const firstItem = models?.[0]?.slug ?? providers?.[0]?.slug
      setHighlighted(firstItem ?? '')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[300px] justify-between font-normal', className)}
        >
          {selected ? (
            <EntityBadge name={selected.name} slug={selected.slug} className="flex-1" />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command
          value={highlighted}
          onValueChange={setHighlighted}
          filter={(value, search) => {
            if (value.includes(search)) return 1
            return 0
          }}
          loop
        >
          <CommandInput value={search} onValueChange={setInputValue} />

          <CommandList>
            <CommandEmpty>{isLoading ? 'Loading...' : 'No results found.'}</CommandEmpty>

            {models && (
              <CommandGroup heading="Models">
                {models.map((m) => (
                  <CommandItem
                    key={m.slug}
                    value={m.slug}
                    onSelect={(currentValue) => {
                      onValueChange?.(currentValue)
                      setOpen(false)
                    }}
                  >
                    <EntityBadge name={m.name} slug={m.slug} className="flex-1" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {providers && (
              <CommandGroup heading="Providers">
                {providers.map((p) => (
                  <CommandItem
                    key={p.slug}
                    value={p.slug}
                    onSelect={(currentValue) => {
                      onValueChange?.(currentValue)
                      setOpen(false)
                    }}
                  >
                    <EntityBadge name={p.name} slug={p.slug} className="flex-1" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
