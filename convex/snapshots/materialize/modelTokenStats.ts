import type { Infer } from 'convex/values'
import type z4 from 'zod/v4'

import * as DB from '@/convex/db'

import { internal } from '../../_generated/api'
import { type ActionCtx } from '../../_generated/server'
import * as Transforms from '../transforms'

function aggregateTokenMetrics({
  stats,
  days,
  now = Date.now(),
}: {
  stats: Array<{ timestamp: number; input: number; output: number; requests: number }>
  days: number
  now?: number
}) {
  const cutoff = now - days * 24 * 60 * 60 * 1000
  const window = stats.filter((m) => m.timestamp >= cutoff)
  return {
    tokens: window.reduce((s, m) => s + m.input + m.output, 0),
    requests: window.reduce((s, m) => s + m.requests, 0),
  }
}

export async function calculateModelStatsFromBundle(
  ctx: ActionCtx,
  bundle: { data: { modelAuthors: Array<unknown> } },
  snapshot_at: number,
) {
  const modelStatsMap = new Map<string, Infer<typeof DB.OrModels.vTable.validator>['stats']>()
  const modelTokenStats: Infer<typeof DB.OrModelTokenStats.vTable.validator>[] = []
  const authorNameMap = new Map<string, string>()
  const issues: { source: string; error: z4.ZodError }[] = []

  for (const raw of bundle.data.modelAuthors) {
    const parsed = Transforms.modelAuthor.safeParse(raw)
    if (!parsed.success) {
      issues.push({ source: 'modelAuthor', error: parsed.error })
      continue
    }

    authorNameMap.set(parsed.data.author.slug, parsed.data.author.name)

    for (const m of parsed.data.modelsWithStats) {
      const { model_permaslug, model_variant, stats } = m
      modelTokenStats.push({ ...m, snapshot_at })

      const stats7d = aggregateTokenMetrics({ stats, days: 7 })

      if (!modelStatsMap.has(model_permaslug)) modelStatsMap.set(model_permaslug, {})
      modelStatsMap.get(model_permaslug)![model_variant] = {
        tokens_7d: stats7d.tokens,
      }
    }
  }

  if (modelTokenStats.length)
    await ctx.runMutation(internal.db.or.modelTokenStats.upsert, { items: modelTokenStats })

  return { modelStatsMap, authorNameMap, modelTokenStats, issues }
}
