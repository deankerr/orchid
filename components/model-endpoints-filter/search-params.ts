import * as R from 'remeda'

import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

import { attributesMap } from '../attributes'
import { SORT_OPTIONS, type SortDirection, type SortOption } from './sort'

export function useModelFilterSearchParams() {
  const attributeParsers = R.fromEntries(
    [...attributesMap.keys()].map((key) => [key, parseAsBoolean.withDefault(false)]),
  )

  const parsers = {
    ...attributeParsers,
    q: parseAsString.withDefault(''),
    pricing: parseAsStringEnum<'all' | 'free' | 'paid'>(['all', 'free', 'paid']).withDefault('all'),
    sort: parseAsStringEnum<SortOption>(SORT_OPTIONS.map((o) => o.value)).withDefault('tokens_7d'),
    dir: parseAsStringEnum<SortDirection>(['asc', 'desc']).withDefault('desc'),
  }

  return useQueryStates(parsers, {
    history: 'replace',
    shallow: true,
  })
}
