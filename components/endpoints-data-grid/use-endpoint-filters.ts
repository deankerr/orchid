import { SortingState } from '@tanstack/react-table'
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

import { AttributeName } from '@/lib/attributes'

type FilterMode = 'include' | 'exclude' | 'any'

type ModalityName = 'image_input' | 'file_input' | 'audio_input' | 'image_output'

type AttributeFilterState = Partial<Record<AttributeName | ModalityName, FilterMode>>

type ModalityFilterState = {
  image_input: boolean
  file_input: boolean
  audio_input: boolean
  image_output: boolean
}

// Parser for arrays of attribute/modality names
const parseAsAttributeArray = parseAsArrayOf(parseAsString).withDefault([])

const MODALITIES: ModalityName[] = ['image_input', 'file_input', 'audio_input', 'image_output']

export function useEndpointFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      has: parseAsAttributeArray,
      not: parseAsAttributeArray,
      sort: parseAsString,
      order: parseAsStringEnum(['asc', 'desc']),
    },
    {
      history: 'push',
      shallow: true,
    },
  )

  // Extract modality filters from has list
  const modalityFilters: ModalityFilterState = {
    image_input: filters.has.includes('image_input'),
    file_input: filters.has.includes('file_input'),
    audio_input: filters.has.includes('audio_input'),
    image_output: filters.has.includes('image_output'),
  }

  // Build attribute filters from has/not lists
  const attributeFilters: AttributeFilterState = {}
  for (const attr of filters.has) {
    attributeFilters[attr as AttributeName | ModalityName] = 'include'
  }
  for (const attr of filters.not) {
    attributeFilters[attr as AttributeName | ModalityName] = 'exclude'
  }

  // Helper to update modality filters (only supports toggling include)
  const setModalityFilter = (key: ModalityName, value: boolean) => {
    const currentHas = filters.has.filter((a) => a !== key)

    if (value) {
      setFilters({ has: [...currentHas, key] })
    } else {
      setFilters({ has: currentHas })
    }
  }

  // Helper to update attribute filters
  const setAttributeFilter = (key: AttributeName, value: FilterMode) => {
    const currentHas = filters.has.filter((a) => a !== key)
    const currentNot = filters.not.filter((a) => a !== key)

    if (value === 'include') {
      setFilters({
        has: [...currentHas, key],
        not: currentNot,
      })
    } else if (value === 'exclude') {
      setFilters({
        has: currentHas,
        not: [...currentNot, key],
      })
    } else {
      // 'any' - remove from both lists
      setFilters({
        has: currentHas,
        not: currentNot,
      })
    }
  }

  // Helper to update search
  const setGlobalFilter = (value: string) => {
    setFilters({ q: value })
  }

  // Convert URL state to TanStack SortingState
  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.order === 'desc' }]
    : [{ id: 'modelAddedAt', desc: true }]

  // Helper to update sorting from TanStack's onSortingChange
  const onSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const newSorting =
      typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue

    if (newSorting.length === 0) {
      setFilters({ sort: null, order: null })
    } else {
      const sort = newSorting[0]
      setFilters({
        sort: sort.id,
        order: sort.desc ? 'desc' : 'asc',
      })
    }
  }

  const clearAttributeFilters = () => {
    // Only keep modalities
    const currentModalities = filters.has.filter((a) => MODALITIES.includes(a as ModalityName))

    setFilters({
      has: currentModalities,
      not: [],
    })
  }

  const clearModalityFilters = () => {
    // Keep only non-modality attributes
    const currentAttributes = filters.has.filter((a) => !MODALITIES.includes(a as ModalityName))

    setFilters({
      has: currentAttributes,
    })
  }

  const clearAllFilters = () => {
    setFilters({
      has: [],
      not: [],
    })
  }

  const setFocusSearch = (query: string) => {
    setFilters({
      q: query,
      has: [],
      not: [],
      sort: null,
      order: null,
    })
  }

  // Derived counts
  const activeModalityCount = Object.values(modalityFilters).filter(Boolean).length

  // Active attribute count = Total active filters - Modality filters
  // Note: Modalities only exist in 'has', so 'not' is purely attributes
  const activeAttributeCount = filters.has.length - activeModalityCount + filters.not.length

  const hasActiveSorting = filters.sort !== null
  const hasActiveModalityFilters = activeModalityCount > 0
  const hasActiveAttributeFilters = activeAttributeCount > 0
  const hasAnyActiveFilters = hasActiveModalityFilters || hasActiveAttributeFilters || !!filters.q

  return {
    globalFilter: filters.q,
    setGlobalFilter,
    sorting,
    onSortingChange,
    modalityFilters,
    attributeFilters,
    setModalityFilter,
    setAttributeFilter,
    clearAttributeFilters,
    clearModalityFilters,
    clearAllFilters,
    setFocusSearch,
    activeModalityCount,
    activeAttributeCount,
    hasActiveFilters: hasAnyActiveFilters,
    hasActiveAttributeFilters,
    hasActiveModalityFilters,
    hasActiveSorting,
  }
}

export type { FilterMode, AttributeFilterState, ModalityFilterState, ModalityName }
