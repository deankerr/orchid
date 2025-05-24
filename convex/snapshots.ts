import { v } from 'convex/values'
import pako from 'pako'
import { internalMutation, internalQuery, query } from './_generated/server'
import type { ModelEndpointsPack } from './sync'
import { z } from 'zod'

export const insertSnapshot = internalMutation({
  args: {
    category: v.string(),
    key: v.string(),
    batchTimestamp: v.number(),
    data: v.record(v.string(), v.any()),
  },
  handler: async (ctx, { category, key, batchTimestamp, data }) => {
    const json = JSON.stringify(data)
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json))
    const compressed = pako.deflate(json)

    await ctx.db.insert('snapshots', {
      category,
      key,
      batchTimestamp,
      hash,
      data: compressed.buffer,
      size: compressed.length,
    })
  },
})

export const deleteAllSnapshots = internalMutation({
  handler: async (ctx) => {
    const snapshots = await ctx.db.query('snapshots').collect()
    for (const snapshot of snapshots) {
      await ctx.db.delete(snapshot._id)
    }
  },
})

export const getSnapshotBatchMetadata = internalQuery({
  args: {
    batchTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const batches = await ctx.db
      .query('snapshots')
      .withIndex('by_batchTimestamp', (q) => q.eq('batchTimestamp', args.batchTimestamp))
      .collect()

    return batches.map((b) => ({
      id: b._id,
      category: b.category,
      key: b.key,
      batchTimestamp: b.batchTimestamp,
      hash: b.hash,
      size: b.size,
    }))
  },
})

export const assessConstraints = internalMutation({
  handler: async (ctx) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_category', (q) => q.eq('category', 'model_endpoints'))
      .order('desc')
      .first()
    if (!snapshot) {
      console.log('No model endpoints found')
      return
    }

    const modelEndpoints: { all: ModelEndpointsPack[] } = JSON.parse(
      pako.inflate(snapshot.data, { to: 'string' }),
    )

    // Test constraints for models
    const modelHasTextOutputAlwaysTrue = z.object({
      has_text_output: z.literal(true),
    })

    const modelHiddenAlwaysFalse = z.object({
      hidden: z.literal(false),
    })

    // Test constraints for endpoints
    const endpointFreeVariantConsistency = z
      .object({
        is_free: z.boolean(),
        variant: z.string(),
      })
      .refine((data) => {
        return (data.is_free && data.variant === 'free') || (!data.is_free && data.variant !== 'free')
      }, "is_free and variant='free' must be consistent")

    const endpointIsHiddenAlwaysFalse = z.object({
      is_hidden: z.literal(false),
    })

    const endpointIsDisabledAlwaysFalse = z.object({
      is_disabled: z.literal(false),
    })

    // Process each pack
    for (const pack of modelEndpoints.all) {
      // Test models constraints
      if ('models' in pack && Array.isArray(pack.models)) {
        for (const model of pack.models) {
          // Test: has_text_output is always true
          const hasTextResult = modelHasTextOutputAlwaysTrue.safeParse(model)
          if (!hasTextResult.success) {
            console.log(`TEST FAILED: models.has_text_output_always_true - Model:`, model)
          }

          // Test: hidden is always false
          const hiddenResult = modelHiddenAlwaysFalse.safeParse(model)
          if (!hiddenResult.success) {
            console.log(`TEST FAILED: models.hidden_always_false - Model:`, model)
          }
        }
      }

      // Test endpoints constraints
      if ('endpoints' in pack && Array.isArray(pack.endpoints)) {
        for (const endpoint of pack.endpoints) {
          if (endpoint.is_disabled) {
            continue // NOTE: endpoint is considered dead/gone, may be in an inconsistent state
          }

          // Test: is_free and variant consistency
          const freeVariantResult = endpointFreeVariantConsistency.safeParse(endpoint)
          if (!freeVariantResult.success) {
            console.log(`TEST FAILED: endpoints.free_variant_consistency - Endpoint:`, endpoint)
          }

          // Test: is_hidden is always false
          const hiddenResult = endpointIsHiddenAlwaysFalse.safeParse(endpoint)
          if (!hiddenResult.success) {
            console.log(`TEST FAILED: endpoints.is_hidden_always_false - Endpoint:`, endpoint)
          }

          // Test: is_disabled is always false
          const disabledResult = endpointIsDisabledAlwaysFalse.safeParse(endpoint)
          if (!disabledResult.success) {
            console.log(`TEST FAILED: endpoints.is_disabled_always_false - Endpoint:`, endpoint)
          }
        }
      }
    }

    // Informational check: models with context_length mismatch
    for (const pack of modelEndpoints.all) {
      if (
        'models' in pack &&
        Array.isArray(pack.models) &&
        'endpoints' in pack &&
        Array.isArray(pack.endpoints)
      ) {
        for (const model of pack.models) {
          // Find endpoints for this model
          const modelEndpoints = pack.endpoints

          // Check if any endpoint has matching context_length
          const hasMatchingEndpoint = modelEndpoints.some(
            (endpoint) => endpoint.context_length === model.context_length,
          )

          if (!hasMatchingEndpoint && modelEndpoints.length > 0) {
            console.log(
              `CONTEXT_LENGTH MISMATCH - Model: ${model.slug || 'unknown'} (context_length: ${model.context_length})`,
            )
            modelEndpoints.forEach((endpoint) => {
              console.log(
                `  Endpoint: ${endpoint.name || 'unknown'} (context_length: ${endpoint.context_length})`,
              )
            })
          }
        }
      }
    }

    console.log('Constraint assessment completed')
  },
})

export const getLatestModelEndpointsSnapshot = query({
  handler: async (ctx) => {
    const snapshot = await ctx.db
      .query('snapshots')
      .withIndex('by_category', (q) => q.eq('category', 'model_endpoints'))
      .order('desc')
      .first()
    if (!snapshot) {
      return null
    }

    const modelEndpoints: { all: ModelEndpointsPack[] } = JSON.parse(
      pako.inflate(snapshot.data, { to: 'string' }),
    )

    return modelEndpoints.all.map((pack) => {
      return {
        model: pack.model,
        endpoints: pack.endpoints,
        uptimes: pack.uptimes,
        // apps: pack.apps,
      }
    })
  },
})
