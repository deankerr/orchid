import { WithoutSystemFields } from 'convex/server'

import { atomizeChangeset, diff, type Options as DiffOptions } from 'json-diff-ts'

import { Doc } from '../../_generated/dataModel'
import { materializeModelEndpoints } from '../materialize/main'

type MaterializedSnapshot = ReturnType<typeof materializeModelEndpoints>

type ChangeFields = WithoutSystemFields<Doc<'or_views_changes'>>
type ChangeDraft = Omit<ChangeFields, 'crawl_id' | 'previous_crawl_id'>

const DIFF_OPTIONS: DiffOptions = {
  keysToSkip: [
    'updated_at',
    'unavailable_at',
    'stats',
    'status',
    'or_added_at',
    'model.or_added_at',
    'provider.icon_url',
  ],
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

export function computeMaterializedChanges(args: {
  previous: MaterializedSnapshot
  current: MaterializedSnapshot
  previous_crawl_id: string
  crawl_id: string
}): ChangeFields[] {
  const previousModels = new Map(args.previous.models.map((m) => [m.slug, m]))
  const currentModels = new Map(args.current.models.map((m) => [m.slug, m]))

  const previousEndpoints = new Map(args.previous.endpoints.map((e) => [e.uuid, e]))
  const currentEndpoints = new Map(args.current.endpoints.map((e) => [e.uuid, e]))

  const previousProviders = new Map(args.previous.providers.map((p) => [p.slug, p]))
  const currentProviders = new Map(args.current.providers.map((p) => [p.slug, p]))

  const drafts: ChangeDraft[] = [
    ...computeEntityChanges('model', previousModels, currentModels, (m) => ({
      model_slug: m.slug,
    })),
    ...computeEntityChanges('endpoint', previousEndpoints, currentEndpoints, (e) => ({
      model_slug: e.model.slug,
      provider_slug: e.provider.slug,
      provider_tag_slug: e.provider.tag_slug,
      endpoint_uuid: e.uuid,
    })),
    ...computeEntityChanges('provider', previousProviders, currentProviders, (p) => ({
      provider_slug: p.slug,
    })),
  ]

  return drafts.map((change) => ({
    ...change,
    crawl_id: args.crawl_id,
    previous_crawl_id: args.previous_crawl_id,
  })) as ChangeFields[]
}

function computeEntityChanges<T>(
  entityType: 'model' | 'endpoint' | 'provider',
  previousMap: Map<string, T>,
  currentMap: Map<string, T>,
  getIdentifiers: (entity: T) => Record<string, string>,
): ChangeDraft[] {
  const changes: ChangeDraft[] = []

  const keys = new Set([...previousMap.keys(), ...currentMap.keys()].sort())

  for (const key of keys) {
    const before = previousMap.get(key)
    const after = currentMap.get(key)

    if (!after) {
      changes.push({
        entity_type: entityType,
        change_kind: 'delete',
        ...getIdentifiers(before!),
      } as ChangeDraft)
      continue
    }

    if (!before) {
      changes.push({
        entity_type: entityType,
        change_kind: 'create',
        ...getIdentifiers(after),
      } as ChangeDraft)
      continue
    }

    const identifiers = getIdentifiers(before)
    const diffItems = processDiff(before as any, after as any)

    for (const item of diffItems) {
      changes.push({
        ...identifiers,
        ...item,
        entity_type: entityType,
        change_kind: 'update',
      } as ChangeDraft)
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
