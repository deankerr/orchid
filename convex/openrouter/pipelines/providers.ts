import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import { storeSnapshotData } from '../archive'
import { output } from '../output'
import type { Entities } from '../registry'
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
  const issues: Issue[] = []

  const data = await source.providers()

  // Store raw response for archival
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

  const providers: (typeof Entities.providers.table.$content)[] = items.map((provider) => ({
    ...provider,
    snapshot_at,
  }))

  const results = await output(ctx, {
    entities: [
      {
        name: 'providers',
        items: providers,
      },
    ],
  })

  await ctx.runMutation(internal.openrouter.snapshot.insertResult, {
    snapshot_at,
    run_id,
    pipeline: 'providers',
    results,
    issues,
  })
}
