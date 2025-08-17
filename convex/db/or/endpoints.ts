import { asyncMap } from 'convex-helpers'
import { defineTable } from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, type QueryCtx } from '../../_generated/server'
import { createTableVHelper } from '../../table3'

export const table = defineTable({
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

  icon_url: v.optional(v.string()),

  snapshot_at: v.number(),
})
  .index('by_uuid', ['uuid'])
  .index('by_model_slug', ['model_slug'])

export const vTable = createTableVHelper('or_endpoints', table.validator)

export async function list(ctx: QueryCtx) {
  return await ctx.db.query(vTable.name).collect()
}

// * snapshots
export const upsert = internalMutation({
  args: { items: v.array(vTable.validator) },
  handler: async (ctx, args) => {
    await asyncMap(args.items, async (item) => {
      const existing = await ctx.db
        .query(vTable.name)
        .withIndex('by_uuid', (q) => q.eq('uuid', item.uuid))
        .first()

      // Insert
      if (!existing) {
        return await ctx.db.insert(vTable.name, item)
      }

      const uptime_average = item.uptime_average ?? existing.uptime_average

      // Update
      return await ctx.db.replace(existing._id, { ...item, uptime_average })
    })
  },
})
