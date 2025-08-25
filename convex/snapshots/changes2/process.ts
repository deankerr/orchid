import { type AsObjectValidator, type Infer } from 'convex/values'

import { diff, type Options } from 'json-diff-ts'

import * as DB from '@/convex/db'

import type { CrawlArchiveBundle } from '../crawl'

type ProcessBundleArgs = {
  fromBundle: CrawlArchiveBundle
  toBundle: CrawlArchiveBundle
}

export function processBundleChanges({ fromBundle, toBundle }: ProcessBundleArgs) {
  const changes = [
    ...providerChanges({ fromBundle, toBundle }),
    ...modelEndpointChanges({ fromBundle, toBundle }),
  ]

  return changes
}

type EntityMetadata = Infer<
  AsObjectValidator<
    Pick<
      typeof DB.OrChanges.vTable.doc.fields,
      | 'entity_id'
      | 'entity_display_name'
      | 'model_variant_slug'
      | 'endpoint_uuid'
      | 'provider_slug'
      | 'provider_id'
    >
  >
>

type ChangeBase = {
  entity_type: Infer<typeof DB.OrChanges.vTable.validator.fields.entity_type>
  crawl_id: string
  from_crawl_id: string
  is_display: boolean
}

function providerChanges({ fromBundle, toBundle }: ProcessBundleArgs) {
  const fromEntityMap = new Map(fromBundle.data.providers.map((entity) => [entity.name, entity]))
  const toEntityMap = new Map(toBundle.data.providers.map((entity) => [entity.name, entity]))

  const entityIds = new Set([...fromEntityMap.keys(), ...toEntityMap.keys()])
  const changes: Infer<AsObjectValidator<typeof DB.OrChanges.vTable.validator>>[] = []

  for (const entityId of entityIds) {
    const fromEntity = fromEntityMap.get(entityId)
    const toEntity = toEntityMap.get(entityId)

    const entityChanges = computeEntityChanges({
      fromEntity,
      toEntity,
      extractMetadata: (item) => ({
        entity_id: item.name,
        entity_display_name: item.displayName,
        provider_slug: item.slug,
        provider_id: item.name,
      }),
      changeBase: {
        entity_type: 'provider',
        from_crawl_id: fromBundle.crawl_id,
        crawl_id: toBundle.crawl_id,
        is_display: false,
      },
      diffOptions: {
        keysToSkip: ['ignoredProviderModels'],
        treatTypeChangeAsReplace: false,
      },
    })

    changes.push(...entityChanges)
  }

  return changes
}

function modelEndpointChanges({ fromBundle, toBundle }: ProcessBundleArgs) {
  const fromEntityMap = new Map(fromBundle.data.models.map((entity) => [entity.model.slug, entity]))
  const toEntityMap = new Map(toBundle.data.models.map((entity) => [entity.model.slug, entity]))

  const entityIds = new Set([...fromEntityMap.keys(), ...toEntityMap.keys()])
  const changes: Infer<AsObjectValidator<typeof DB.OrChanges.vTable.validator>>[] = []

  for (const entityId of entityIds) {
    const fromEntity = fromEntityMap.get(entityId)
    const toEntity = toEntityMap.get(entityId)

    // * models
    const modelChanges = computeEntityChanges({
      fromEntity: fromEntity?.model,
      toEntity: toEntity?.model,
      extractMetadata: (item) => ({
        entity_id: item.slug,
        entity_display_name: item.name,
        model_variant_slug: item.slug,
      }),
      changeBase: {
        entity_type: 'model',
        from_crawl_id: fromBundle.crawl_id,
        crawl_id: toBundle.crawl_id,
        is_display: false,
      },
      diffOptions: {
        keysToSkip: ['endpoint', 'updated_at'],
        embeddedObjKeys: { input_modalities: '$value', output_modalities: '$value' },
        treatTypeChangeAsReplace: false,
      },
    })

    changes.push(...modelChanges)

    // * endpoints inner loop
    const fromEndpoints = fromEntity?.endpoints || []
    const toEndpoints = toEntity?.endpoints || []

    const fromEndpointMap = new Map(fromEndpoints.map((ep) => [ep.id, ep]))
    const toEndpointMap = new Map(toEndpoints.map((ep) => [ep.id, ep]))

    const endpointIds = new Set([...fromEndpointMap.keys(), ...toEndpointMap.keys()])

    for (const endpointId of endpointIds) {
      const fromEndpoint = fromEndpointMap.get(endpointId)
      const toEndpoint = toEndpointMap.get(endpointId)

      const endpointChanges = computeEntityChanges({
        fromEntity: fromEndpoint,
        toEntity: toEndpoint,
        extractMetadata: (ep) => ({
          entity_id: ep.id,
          entity_display_name: ep.name,
          endpoint_uuid: ep.id,
          model_variant_slug: ep.model_variant_slug,
          provider_slug: ep.provider_slug,
          provider_id: ep.provider_name,
        }),
        changeBase: {
          entity_type: 'endpoint',
          from_crawl_id: fromBundle.crawl_id,
          crawl_id: toBundle.crawl_id,
          is_display: false,
        },
        diffOptions: {
          keysToSkip: ['stats', 'provider_info', 'model'],
          embeddedObjKeys: { supported_parameters: '$value' },
          treatTypeChangeAsReplace: false,
        },
      })

      changes.push(...endpointChanges)
    }
  }

  return changes
}

/**
 * Computes changes for a single entity diff
 * Generic function that produces change records based on the difference between two entities
 */
function computeEntityChanges({
  fromEntity,
  toEntity,
  extractMetadata,
  changeBase,
  diffOptions,
}: {
  fromEntity: Record<string, any> | undefined
  toEntity: Record<string, any> | undefined
  extractMetadata: (entity: any) => EntityMetadata
  changeBase: ChangeBase
  diffOptions: Options
}) {
  if (!fromEntity && toEntity) {
    // * created
    return [
      {
        ...changeBase,
        ...extractMetadata(toEntity),
        change_action: 'create' as const,
        change_root_key: '',
        change_body: toEntity,
      },
    ]
  }

  if (fromEntity && !toEntity) {
    // * deleted
    return [
      {
        ...changeBase,
        ...extractMetadata(fromEntity),
        change_action: 'delete' as const,
        change_root_key: '',
        change_body: fromEntity,
      },
    ]
  }

  if (fromEntity && toEntity) {
    // * updated
    const entityDiff = diff(fromEntity, toEntity, diffOptions)
    return entityDiff.map((item) => ({
      ...changeBase,
      ...extractMetadata(toEntity),
      change_action: 'update' as const,
      change_root_key: item.key,
      change_body: item,
    }))
  }

  return []
}
