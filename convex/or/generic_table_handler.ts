import { Table } from 'convex-helpers/server'
import { type AsObjectValidator, type Infer } from 'convex/values'

import { diff, type IChange } from 'json-diff-ts'

import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { MergeResult } from '../types'

/**
 * Helper type to extract fields from a Table definition
 */
export type TableFields<TTable extends Table<any, any>> = 
  TTable extends Table<infer TValidator, any> 
    ? Infer<AsObjectValidator<TValidator>>
    : never

/**
 * Configuration for a generic non-timeseries or_* table handler
 */
export interface TableConfig<TTable extends Table<any, any>, TFields> {
  /** The main table definition */
  table: TTable
  /** The changes table name */
  changesTableName: string
  /** The primary identifier field name */
  identifierField: keyof TFields
  /** The index name for querying by identifier */
  indexName: string
  /** Custom diff options (optional) */
  diffOptions?: {
    keysToSkip?: string[]
    embeddedObjKeys?: Record<string, string>
  }
  /** Entity name for parameter naming (e.g., 'model', 'provider', 'app') */
  entityName: string
}

/**
 * Creates a generic handler for non-timeseries or_* tables
 */
export function createOrTableHandler<TTable extends Table<any, any>, TFields extends Record<string, any>>(
  config: TableConfig<TTable, TFields>
) {
  type IdentifierType = TFields[keyof Pick<TFields, typeof config.identifierField>]
  type IdentifierParam = Record<typeof config.identifierField, IdentifierType>

  const defaultDiffOptions = {
    keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
    ...config.diffOptions,
  }

  return {
    /**
     * Get an entity by its primary identifier
     */
    get: async (ctx: QueryCtx, identifier: IdentifierParam) => {
      return await ctx.db
        .query(config.table.name)
        .withIndex(config.indexName, (q) => 
          q.eq(config.identifierField as string, identifier[config.identifierField])
        )
        .first()
    },

    /**
     * Compare two objects to find changes
     */
    diff: <T extends object>(from: T, to: T) => {
      return diff(from, to, defaultDiffOptions)
    },

    /**
     * Insert changes into the changes table
     */
    insertChanges: async (
      ctx: MutationCtx,
      args: IdentifierParam & { snapshot_at: number; changes: IChange[] }
    ) => {
      await ctx.db.insert(config.changesTableName, args)
    },

    /**
     * Merge an entity - handles insert/update/stable logic
     */
    merge: async (
      ctx: MutationCtx,
      entityData: Record<typeof config.entityName, TFields>
    ): Promise<MergeResult> => {
      const entity = entityData[config.entityName]
      const identifierValue = entity[config.identifierField]
      const identifier = { [config.identifierField]: identifierValue } as IdentifierParam

      const existing = await ctx.db
        .query(config.table.name)
        .withIndex(config.indexName, (q) => 
          q.eq(config.identifierField as string, identifierValue)
        )
        .first()

      const changes = diff(existing || {}, entity, defaultDiffOptions)

      // Record changes if any exist
      if (changes.length > 0) {
        await ctx.db.insert(config.changesTableName, {
          ...identifier,
          snapshot_at: entity.snapshot_at,
          changes,
        })
      }

      // Handle new entity
      if (!existing) {
        const docId = await ctx.db.insert(config.table.name, entity)
        return {
          action: 'insert' as const,
          docId,
          changes,
        }
      }

      // Handle existing entity with no changes
      if (changes.length === 0) {
        if (existing.snapshot_at < entity.snapshot_at) {
          await ctx.db.patch(existing._id, {
            snapshot_at: entity.snapshot_at,
          })
        }

        return {
          action: 'stable' as const,
          docId: existing._id,
          changes,
        }
      }

      // Handle existing entity with changes
      await ctx.db.replace(existing._id, entity)
      return {
        action: 'replace' as const,
        docId: existing._id,
        changes,
      }
    },
  }
}

/**
 * Pre-configured handlers for all non-timeseries or_* tables
 * 
 * Usage example:
 * ```typescript
 * import { OrModels, OrModelFields } from './or_models'
 * 
 * const OrModelsHandler = createOrTableHandler<typeof OrModels, OrModelFields>({
 *   table: OrModels,
 *   changesTableName: 'or_models_changes',
 *   identifierField: 'slug',
 *   indexName: 'by_slug',
 *   entityName: 'model',
 *   diffOptions: { embeddedObjKeys: { variants: '$value' } },
 * })
 * 
 * // Then use it like:
 * const result = await OrModelsHandler.merge(ctx, { model: modelData })
 * const existing = await OrModelsHandler.get(ctx, { slug: 'some-model' })
 * ```
 */

// Note: These would typically be created in their respective files, but showing as examples:

// Example usage for or_models:
// export const OrModelsHandler = createOrTableHandler({
//   table: OrModels,
//   changesTableName: 'or_models_changes',
//   identifierField: 'slug',
//   indexName: 'by_slug',
//   entityName: 'model',
//   diffOptions: {
//     embeddedObjKeys: {
//       input_modalities: '$value',
//       output_modalities: '$value',
//       variants: '$value',
//     },
//   },
// })

// Example usage for or_providers:
// export const OrProvidersHandler = createOrTableHandler({
//   table: OrProviders,
//   changesTableName: 'or_providers_changes',
//   identifierField: 'slug',
//   indexName: 'by_slug',
//   entityName: 'provider',
// })

// Example usage for or_apps:
// export const OrAppsHandler = createOrTableHandler({
//   table: OrApps,
//   changesTableName: 'or_apps_changes',
//   identifierField: 'app_id',
//   indexName: 'by_app_id',
//   entityName: 'app',
// })

// Example usage for or_endpoints:
// export const OrEndpointsHandler = createOrTableHandler({
//   table: OrEndpoints,
//   changesTableName: 'or_endpoints_changes',
//   identifierField: 'uuid',
//   indexName: 'by_uuid',
//   entityName: 'endpoint',
//   diffOptions: {
//     embeddedObjKeys: {
//       supported_parameters: '$value',
//     },
//   },
// })

// Example usage for or_authors:
// export const OrAuthorsHandler = createOrTableHandler({
//   table: OrAuthors,
//   changesTableName: 'or_authors_changes',
//   identifierField: 'uuid',
//   indexName: 'by_uuid',
//   entityName: 'author',
// })