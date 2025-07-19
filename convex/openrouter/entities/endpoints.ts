import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'
import * as R from 'remeda'

import { diff as jsonDiff, type IChange } from 'json-diff-ts'

import { internalMutation, query, type MutationCtx } from '../../_generated/server'
import { getModelVariantSlug, hoursBetween } from '../../shared'
import { Table2 } from '../../table2'
import { countResults } from '../output'
import { getCurrentSnapshotTimestamp } from '../snapshot'

export const OrEndpoints = Table2('or_endpoints', {
  uuid: v.string(),
  name: v.string(),

  model_slug: v.string(),
  model_permaslug: v.string(),
  model_variant: v.string(),

  provider_slug: v.string(),
  provider_name: v.string(),

  context_length: v.number(),
  quantization: v.optional(v.string()),
  supported_parameters: v.array(v.string()),

  capabilities: v.object({
    // provider dependent
    completions: v.boolean(),
    chat_completions: v.boolean(),

    tools: v.boolean(),
    multipart_messages: v.boolean(),
    stream_cancellation: v.boolean(),
    byok: v.boolean(),

    // model dependent
    image_input: v.boolean(),
    file_input: v.boolean(),
    reasoning: v.boolean(),
  }),

  limits: v.object({
    input_tokens: v.optional(v.number()),
    output_tokens: v.optional(v.number()),

    images_per_prompt: v.optional(v.number()),
    tokens_per_image: v.optional(v.number()),

    rpm: v.optional(v.number()),
    rpd: v.optional(v.number()),
  }),

  data_policy: v.object({
    training: v.boolean(),
    retains_prompts: v.optional(v.boolean()),
    retention_days: v.optional(v.number()),
    requires_user_ids: v.optional(v.boolean()),
    can_publish: v.optional(v.boolean()),
  }),

  pricing: v.object({
    // per token
    input: v.optional(v.number()),
    output: v.optional(v.number()),
    image_input: v.optional(v.number()),
    reasoning_output: v.optional(v.number()), // (1) perplexity/sonar-deep-research

    cache_read: v.optional(v.number()),
    cache_write: v.optional(v.number()),

    // flat rate
    web_search: v.optional(v.number()), // (3) perplexity/sonar-reasoning-pro perplexity/sonar-pro perplexity/sonar-deep-research
    per_request: v.optional(v.number()), // (6) gpt-4o(-mini)-search-preview perplexity/sonar(-reasoning) perplexity/llama-3.1[...]

    // e.g. 0.25, already applied to the other pricing fields
    discount: v.optional(v.number()), // rare
  }),

  variable_pricings: v.optional(
    v.array(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
  ),

  stats: v.optional(
    v.object({
      p50_throughput: v.number(),
      p50_latency: v.number(),
      request_count: v.number(),
    }),
  ),

  uptime_average: v.optional(v.number()),

  status: v.number(),

  is_disabled: v.boolean(),
  is_moderated: v.boolean(),

  or_model_created_at: v.number(),

  snapshot_at: v.number(),
})

export const OrEndpointsChanges = Table2('or_endpoints_changes', {
  uuid: v.string(),
  snapshot_at: v.number(),
  changes: v.array(v.record(v.string(), v.any())),
})

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime', 'snapshot_at', 'stats', 'uptime_average'],
    embeddedObjKeys: {
      supported_parameters: '$value',
    },
  })

const recordChanges = async (
  ctx: MutationCtx,
  { content, changes }: { content: { uuid: string; snapshot_at: number }; changes: IChange[] },
) => {
  if (changes.length === 0) return
  const { uuid, snapshot_at } = content
  await ctx.db.insert(OrEndpointsChanges.name, { uuid, snapshot_at, changes })
}

export const upsert = internalMutation({
  args: {
    items: v.array(OrEndpoints.content),
  },
  handler: async (ctx, { items }) => {
    const results = await asyncMap(items, async (item) => {
      const existing = await ctx.db
        .query(OrEndpoints.name)
        .withIndex('by_uuid', (q) => q.eq('uuid', item.uuid))
        .first()
      const changes = diff(existing ?? {}, item)

      // Record changes
      await recordChanges(ctx, { content: item, changes })

      // Insert
      if (!existing) {
        await ctx.db.insert(OrEndpoints.name, item)
        return { action: 'insert' }
      }

      // Stable - no changes, but update stats and uptime_average (excluded from diff)
      if (changes.length === 0) {
        await ctx.db.patch(existing._id, {
          snapshot_at: item.snapshot_at,
          stats: item.stats,
          uptime_average: item.uptime_average,
        })
        return { action: 'stable' }
      }

      // Update
      await ctx.db.replace(existing._id, item)
      return { action: 'update' }
    })

    return countResults(results, 'endpoints')
  },
})

// * queries
export const list = query({
  handler: async (ctx) => {
    const snapshot_at = await getCurrentSnapshotTimestamp(ctx)
    const results = await ctx.db
      .query('or_endpoints')
      .collect()
      .then(
        (res) =>
          res
            .map((endp) => ({
              ...endp,
              staleness_hours: hoursBetween(endp.snapshot_at, snapshot_at),
            }))
            .filter((endp) => endp.staleness_hours < 1), // NOTE: remove all stale endpoints
      )

    return Map.groupBy(results, (r) => getModelVariantSlug(r.model_slug, r.model_variant))
      .entries()
      .flatMap(([model_variant_slug, endpoints]) => {
        const totalRequests = endpoints.reduce(
          (sum, endp) => sum + (endp.stats?.request_count ?? 0),
          0,
        )

        return endpoints.map((endp) => ({
          ...endp,
          limits: {
            ...endp.limits,
            output_tokens: endp.limits.output_tokens ?? endp.context_length,
          },
          model_variant_slug,
          traffic_share: R.isDefined(endp.stats?.request_count)
            ? (endp.stats?.request_count ?? 0) / totalRequests
            : undefined,
        }))
      })
      .toArray()
  },
})
