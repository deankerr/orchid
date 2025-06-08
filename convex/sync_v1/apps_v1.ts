import { defineTable } from 'convex/server'
import { ConvexError, v, type AsObjectValidator, type Infer } from 'convex/values'
import { openrouter } from '../openrouter/client'
import { z } from 'zod'
import type { MutationCtx } from '../_generated/server'

export const appsTable = defineTable({
  app_id: v.number(),
  origin_created_at: v.number(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  main_url: v.optional(v.string()),
  origin_url: v.string(),
  source_code_url: v.optional(v.string()),
  epoch: v.number(),
}).index('by_app_id', ['app_id'])

export const vAppsFields = appsTable.validator.fields

export const appTokensTable = defineTable({
  app_id: v.number(),
  total_tokens: v.number(),
  model_permaslug: v.string(),
  model_variant: v.optional(v.string()),
  epoch: v.number(),
}).index('by_app_id_epoch', ['app_id', 'epoch'])

export const vAppTokensFields = appTokensTable.validator.fields

const OpenRouterAppSchema = z
  .object({
    app_id: z.number(),
    total_tokens: z.coerce.number(),
    app: z.object({
      id: z.number(),
      created_at: z.string(),
      description: z.string().nullable(),
      title: z.string().nullable(),
      main_url: z.string().nullable(),
      origin_url: z.string(),
      source_code_url: z.string().nullable(),
    }),
  })
  .array()

export async function fetchApps(args: { permaslug: string; variant?: string }) {
  const result = await openrouter.frontend.stats.app({
    permaslug: args.permaslug,
    variant: args.variant,
    limit: 20,
  })
  if (!result.success) throw new ConvexError('failed to get apps')

  const data = OpenRouterAppSchema.parse(result.data)
  const apps = data.map((app) => ({
    app_id: app.app_id,
    origin_created_at: new Date(app.app.created_at).getTime(),
    title: app.app.title || undefined,
    description: app.app.description || undefined,
    main_url: app.app.main_url || undefined,
    origin_url: app.app.origin_url,
    source_code_url: app.app.source_code_url || undefined,
  }))

  const appTokens = data.map((app) => ({
    app_id: app.app_id,
    total_tokens: app.total_tokens,
  }))

  return { apps, appTokens }
}

export async function mergeApps(ctx: MutationCtx, apps: Infer<AsObjectValidator<typeof vAppsFields>>[]) {
  for (const app of apps) {
    const existingApp = await ctx.db
      .query('apps_v1')
      .withIndex('by_app_id', (q) => q.eq('app_id', app.app_id))
      .first()
    if (existingApp) {
      await ctx.db.patch(existingApp._id, app)
    } else {
      await ctx.db.insert('apps_v1', app)
    }
  }
}

export async function mergeAppTokens(
  ctx: MutationCtx,
  appTokens: Infer<AsObjectValidator<typeof vAppTokensFields>>[],
) {
  for (const appToken of appTokens) {
    const existingAppToken = await ctx.db
      .query('app_tokens_v1')
      .withIndex('by_app_id_epoch', (q) => q.eq('app_id', appToken.app_id))
      .first()
    if (existingAppToken) {
      await ctx.db.patch(existingAppToken._id, appToken)
    } else {
      await ctx.db.insert('app_tokens_v1', appToken)
    }
  }
}
