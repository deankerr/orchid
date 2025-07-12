import * as R from 'remeda'

import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import { storeSnapshotData } from '../archive'
import { OrProviders } from '../entities/providers'
import type { UpsertResult } from '../output'
import { validateArray, type Issue } from '../validation'
import { ProviderStrictSchema, ProviderTransformSchema } from '../validators/providers'

export async function providersPipeline(
  ctx: ActionCtx,
  {
    snapshot_at,
    run_id,
    source,
  }: {
    snapshot_at: number
    run_id: string
    source: {
      providers: () => Promise<unknown[]>
    }
  },
) {
  const started_at = Date.now()
  const issues: Issue[] = []

  const data = await source.providers()
  await storeSnapshotData(ctx, {
    run_id,
    snapshot_at,
    type: 'providers',
    data,
  })

  const { items, issues: validationIssues } = validateArray(
    data,
    ProviderTransformSchema,
    ProviderStrictSchema,
  )

  issues.push(...validationIssues)

  const providers: (typeof OrProviders.$content)[] = items.map((provider) => ({
    ...provider,
    snapshot_at,
  }))

  const results = await ctx.runMutation(internal.openrouter.entities.providers.upsert, {
    items: providers,
  })

  return {
    data: undefined,
    metrics: {
      entities: [
        {
          ...R.countBy(results, (v: UpsertResult) => v.action),
          name: 'providers',
        },
      ],
      issues,
      started_at,
      ended_at: Date.now(),
    },
  }
}
