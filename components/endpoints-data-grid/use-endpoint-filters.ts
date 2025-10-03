import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'

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

export function useEndpointFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      has: parseAsAttributeArray,
      not: parseAsAttributeArray,
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

  // Helper to clear all filters
  const clearAllFilters = () => {
    setFilters({
      has: [],
      not: [],
    })
  }

  // Calculate active filter count
  const activeFilterCount = filters.has.length + filters.not.length

  return {
    modalityFilters,
    attributeFilters,
    setModalityFilter,
    setAttributeFilter,
    clearAllFilters,
    activeFilterCount,
  }
}

export type { FilterMode, AttributeFilterState, ModalityFilterState, ModalityName }
