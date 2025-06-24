import { useMemo } from 'react'

import fuzzysort from 'fuzzysort'
import { parseAsString, useQueryState } from 'nuqs'

import { useOrModels } from './api'

export function useFilteredModels() {
  const [search] = useQueryState('search', parseAsString.withDefault(''))
  const models = useOrModels()

  const filteredModels = useMemo(() => {
    if (!models || !search.trim()) return models

    const query = search.toLowerCase().trim()
    return fuzzysort.go(query, models, { key: 'name' }).map((result) => result.obj)
  }, [models, search])

  return filteredModels
}
