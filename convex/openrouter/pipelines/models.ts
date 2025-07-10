import * as R from 'remeda'
import type z4 from 'zod/v4'

import type { ActionCtx } from '../../_generated/server'
import { storeSnapshotData } from '../archive'
import { output } from '../output'
import { validateArray } from '../validation'
import { ModelStrictSchema, ModelTransformSchema } from '../validators/models'

export async function modelsPipeline(
  ctx: ActionCtx,
  {
    snapshot_at,
    run_id,
    source,
  }: {
    snapshot_at: number
    run_id: string
    source: { models: () => Promise<unknown[]> }
  },
) {
  const started_at = Date.now()
  const data = await source.models()
  await storeSnapshotData(ctx, {
    run_id,
    snapshot_at,
    type: 'models',
    data,
  })

  const { items: modelVariants, issues } = validateArray(
    data,
    ModelTransformSchema,
    ModelStrictSchema,
  )

  const models = consolidateVariants(modelVariants).map((m) => ({
    ...m,
    snapshot_at,
    stats: {},
  }))

  const results = await output(ctx, {
    entities: [
      {
        name: 'models',
        items: models,
      },
    ],
  })

  return {
    data: models,
    metrics: {
      entities: results,
      issues,
      started_at,
      ended_at: Date.now(),
    },
  }
}

function consolidateVariants(models: z4.infer<typeof ModelTransformSchema>[]) {
  // models are duplicated per variant, consolidate them into the single entity with a variants list
  // use the model with shortest name as the base, e.g. "DeepSeek R1" instead of "DeepSeek R1 (free)"
  return Map.groupBy(models, (m) => m.slug)
    .values()
    .map((variants) => {
      const [first, ...rest] = variants.sort((a, b) => a.name.length - b.name.length)
      const { variant, ...base } = first
      return {
        ...base,
        variants: R.pipe([variant, ...rest.map((m) => m.variant)], R.filter(R.isDefined)),
      }
    })
    .toArray()
}
