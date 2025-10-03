import { CheckIcon, FilterIcon, XIcon } from 'lucide-react'

import { AttributeName, attributes } from '@/lib/attributes'
import { SpriteIconName } from '@/lib/sprite-icons'

import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Separator } from '../ui/separator'
import { SpriteIcon } from '../ui/sprite-icon'
import { useEndpointFilters, type FilterMode } from './use-endpoint-filters'

export function FilterControls() {
  const {
    modalityFilters,
    attributeFilters,
    setModalityFilter,
    setAttributeFilter,
    clearAllFilters,
    activeFilterCount,
  } = useEndpointFilters()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <FilterIcon />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[460px]" align="start">
        <div className="space-y-4">
          {/* Modalities */}
          <FilterSection title="Modalities">
            <div className="grid grid-cols-2 gap-2">
              <ModalityToggle
                icon="image-up"
                label="Image Input"
                checked={modalityFilters.image_input}
                onCheckedChange={(checked) => setModalityFilter('image_input', checked)}
              />
              <ModalityToggle
                icon="file-spreadsheet"
                label="File Input"
                checked={modalityFilters.file_input}
                onCheckedChange={(checked) => setModalityFilter('file_input', checked)}
              />
              <ModalityToggle
                icon="audio-lines"
                label="Audio Input"
                checked={modalityFilters.audio_input}
                onCheckedChange={(checked) => setModalityFilter('audio_input', checked)}
              />
              <ModalityToggle
                icon="image-down"
                label="Image Output"
                checked={modalityFilters.image_output}
                onCheckedChange={(checked) => setModalityFilter('image_output', checked)}
              />
            </div>
          </FilterSection>

          <Separator />

          {/* Features */}
          <FilterSection title="Features">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <AttributeFilter
                name="reasoning"
                label="Reasoning"
                mode={attributeFilters.reasoning ?? 'any'}
                onChange={(mode) => setAttributeFilter('reasoning', mode)}
              />
              <AttributeFilter
                name="tools"
                label="Tools"
                mode={attributeFilters.tools ?? 'any'}
                onChange={(mode) => setAttributeFilter('tools', mode)}
              />
              <AttributeFilter
                name="response_format"
                label="Response Format"
                mode={attributeFilters.response_format ?? 'any'}
                onChange={(mode) => setAttributeFilter('response_format', mode)}
              />
              <AttributeFilter
                name="structured_outputs"
                label="Structured Outputs"
                mode={attributeFilters.structured_outputs ?? 'any'}
                onChange={(mode) => setAttributeFilter('structured_outputs', mode)}
              />
              <AttributeFilter
                name="caching"
                label="Caching"
                mode={attributeFilters.caching ?? 'any'}
                onChange={(mode) => setAttributeFilter('caching', mode)}
              />
              <AttributeFilter
                name="native_web_search"
                label="Native Web Search"
                mode={attributeFilters.native_web_search ?? 'any'}
                onChange={(mode) => setAttributeFilter('native_web_search', mode)}
              />
              <AttributeFilter
                name="moderated"
                label="Moderated"
                mode={attributeFilters.moderated ?? 'any'}
                onChange={(mode) => setAttributeFilter('moderated', mode)}
              />
              <AttributeFilter
                name="free"
                label="Free"
                mode={attributeFilters.free ?? 'any'}
                onChange={(mode) => setAttributeFilter('free', mode)}
              />
            </div>
          </FilterSection>

          <Separator />

          {/* Status */}
          <FilterSection title="Status">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <AttributeFilter
                name="gone"
                label="Gone"
                mode={attributeFilters.gone ?? 'any'}
                onChange={(mode) => setAttributeFilter('gone', mode)}
              />
              <AttributeFilter
                name="disabled"
                label="Disabled"
                mode={attributeFilters.disabled ?? 'any'}
                onChange={(mode) => setAttributeFilter('disabled', mode)}
              />
              <AttributeFilter
                name="deranked"
                label="Deranked"
                mode={attributeFilters.deranked ?? 'any'}
                onChange={(mode) => setAttributeFilter('deranked', mode)}
              />
            </div>
          </FilterSection>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase">{title}</div>
      {children}
    </div>
  )
}

function ModalityToggle({
  icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: SpriteIconName
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`flex items-center gap-2 rounded-sm border px-2 py-1.5 transition-colors ${
        checked ? 'border-accent-foreground/20 bg-accent' : 'border-transparent hover:bg-accent/50'
      }`}
    >
      <SpriteIcon name={icon} className="size-4" />
      <span className="text-sm">{label}</span>
    </button>
  )
}

function AttributeFilter({
  name,
  label,
  mode,
  onChange,
}: {
  name: AttributeName
  label: string
  mode: FilterMode
  onChange: (mode: FilterMode) => void
}) {
  const nextMode = (current: FilterMode): FilterMode => {
    if (current === 'any') return 'include'
    if (current === 'include') return 'exclude'
    return 'any'
  }

  const attribute = attributes[name]

  return (
    <button
      type="button"
      onClick={() => onChange(nextMode(mode))}
      className="flex items-center justify-between gap-2 rounded-sm px-2 py-1 text-left text-sm transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-2">
        <SpriteIcon name={attribute.icon} className="size-4" />
        <span className={mode === 'any' ? 'text-muted-foreground' : ''}>{label}</span>
      </div>
      <FilterModeIndicator mode={mode} />
    </button>
  )
}

function FilterModeIndicator({ mode }: { mode: FilterMode }) {
  if (mode === 'include') {
    return (
      <div className="flex size-5 items-center justify-center rounded-xs border border-green-500/30 bg-green-500/20 text-green-400">
        <CheckIcon className="size-3.5" />
      </div>
    )
  }

  if (mode === 'exclude') {
    return (
      <div className="flex size-5 items-center justify-center rounded-xs border border-red-500/30 bg-red-500/20 text-red-400">
        <XIcon className="size-3.5" />
      </div>
    )
  }

  return <div className="size-5 rounded-xs border bg-muted" />
}
