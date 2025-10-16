import { atomizeChangeset, diff, type Options as DiffOptions } from 'json-diff-ts'

import type { OrViewsChangeFields } from '../../db/or/views/changes'
import { materializeModelEndpoints } from '../materialize/main'

type MaterializedSnapshot = ReturnType<typeof materializeModelEndpoints>

type ChangeDraft = Omit<OrViewsChangeFields, 'crawl_id' | 'previous_crawl_id'>

const DIFF_OPTIONS: DiffOptions = {
  keysToSkip: ['updated_at', 'unavailable_at', 'stats', 'or_added_at', 'model.or_added_at'],
  embeddedObjKeys: {
    // models
    input_modalities: '$value',
    output_modalities: '$value',

    // endpoints
    supported_parameters: '$value',
    'model.input_modalities': '$value',
    'model.output_modalities': '$value',

    // providers
    datacenters: '$value',
  },
  treatTypeChangeAsReplace: true,
}

type ChangeIdentifiers = Partial<
  Pick<OrViewsChangeFields, 'model_slug' | 'provider_slug' | 'provider_tag_slug' | 'endpoint_uuid'>
>

type EntityAdapter<T> = {
  entityType: OrViewsChangeFields['entity_type']
  getKey(entity: T): string
  identifiers(before?: T, after?: T): ChangeIdentifiers
}

const modelAdapter: EntityAdapter<MaterializedSnapshot['models'][number]> = {
  entityType: 'model',
  getKey: (model) => model.slug,
  identifiers: (_before, after) => ({ model_slug: (after ?? _before)?.slug }),
}

const providerAdapter: EntityAdapter<MaterializedSnapshot['providers'][number]> = {
  entityType: 'provider',
  getKey: (provider) => provider.slug,
  identifiers: (_before, after) => ({ provider_slug: (after ?? _before)?.slug }),
}

const endpointAdapter: EntityAdapter<MaterializedSnapshot['endpoints'][number]> = {
  entityType: 'endpoint',
  getKey: (endpoint) => endpoint.uuid,
  identifiers: (before, after) => {
    const current = after ?? before
    return {
      model_slug: current?.model.slug,
      provider_slug: current?.provider.slug,
      provider_tag_slug: current?.provider.tag_slug,
      endpoint_uuid: current?.uuid,
    }
  },
}

export function computeMaterializedChanges(args: {
  previous: MaterializedSnapshot
  current: MaterializedSnapshot
  previous_crawl_id: string
  crawl_id: string
}): OrViewsChangeFields[] {
  const drafts: ChangeDraft[] = [
    ...computeEntityChanges(modelAdapter, args.previous.models, args.current.models),
    ...computeEntityChanges(endpointAdapter, args.previous.endpoints, args.current.endpoints),
    ...computeEntityChanges(providerAdapter, args.previous.providers, args.current.providers),
  ]

  return drafts.map((change) => ({
    ...change,
    crawl_id: args.crawl_id,
    previous_crawl_id: args.previous_crawl_id,
  }))
}

function computeEntityChanges<T>(
  adapter: EntityAdapter<T>,
  previous: T[],
  current: T[],
): ChangeDraft[] {
  const changes: ChangeDraft[] = []

  const previousMap = new Map(previous.map((entity) => [adapter.getKey(entity), entity]))
  const currentMap = new Map(current.map((entity) => [adapter.getKey(entity), entity]))

  const slugs = new Set([...previousMap.keys(), ...currentMap.keys()].sort())

  for (const slug of slugs) {
    const before = previousMap.get(slug)
    const after = currentMap.get(slug)

    if (!after) {
      changes.push({
        entity_type: adapter.entityType,
        change_kind: 'delete',
        ...adapter.identifiers(before, undefined),
      })
      continue
    }

    if (!before) {
      changes.push({
        entity_type: adapter.entityType,
        change_kind: 'create',
        ...adapter.identifiers(undefined, after),
      })
      continue
    }

    const identifiers = adapter.identifiers(before, after)
    const diffItems = processDiff(before, after)

    for (const item of diffItems) {
      changes.push({
        ...identifiers,
        ...item,
        entity_type: adapter.entityType,
        change_kind: 'update',
      })
    }
  }

  return changes
}

function extractSegments(path: string): string[] {
  let trimmed = path.startsWith('$') ? path.slice(1) : path
  if (trimmed.startsWith('.')) trimmed = trimmed.slice(1)
  if (!trimmed) return []

  return trimmed
    .split('.')
    .map((segment) => segment.replace(/\[.*?\]/g, '').replace(/^['"]|['"]$/g, ''))
    .filter((segment) => segment.length > 0)
}

function getValueAtSegments(source: Record<string, any>, segments: string[]) {
  let current: any = source
  for (const segment of segments) {
    if (current == null) return undefined
    current = current[segment]
  }
  return current
}

type ProcessedDiffItem = {
  path?: string
  path_level_1?: string
  path_level_2?: string
  before: unknown
  after: unknown
}

export function processDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): ProcessedDiffItem[] {
  const changeset = diff(before, after, DIFF_OPTIONS)

  const items: ProcessedDiffItem[] = []

  for (const change of atomizeChangeset(changeset)) {
    const segments = extractSegments(change.path)
    if (!segments.length) continue

    const path = segments.join('.')
    const beforeValue = getValueAtSegments(before, segments)
    const afterValue = getValueAtSegments(after, segments)
    if (beforeValue === undefined && afterValue === undefined) continue

    items.push({
      path,
      path_level_1: segments[0],
      path_level_2: segments[1],
      before: beforeValue,
      after: afterValue,
    })
  }

  return items
}
