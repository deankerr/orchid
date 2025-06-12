import * as R from 'remeda'
import z4 from 'zod/v4'
import { internalAction, type ActionCtx } from '../_generated/server'
import { store } from '../files'
import { orFetch } from '../openrouter/client'
import type { ModelView } from './table'
import { validateModelRecords } from './validate'

async function snapshot(ctx: ActionCtx, { epoch }: { epoch: number }) {
  const result = await orFetch('/api/frontend/models', {
    schema: z4.object({
      data: z4.unknown().array(),
    }),
  })

  // store raw snapshot data
  // ? return raw result and store in caller
  const file_id = await store(ctx, {
    data: result.data,
    key: `/api/frontend/models`,
    timestamp: epoch,
  })

  const { modelVariants, issues } = validateModelRecords(result.data)
  const models = consolidateVariants(modelVariants).map(R.addProp('epoch', epoch))

  return { models, issues, file_id }
}

type ModelVariant = Omit<ModelView, 'epoch' | 'variants'> & { variant?: string }

export function consolidateVariants(models: ModelVariant[]) {
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

export const snapnow = internalAction({
  handler: async (ctx) => {
    const { models, issues, file_id } = await snapshot(ctx, { epoch: 1 })
    console.log(
      'models:',
      models.length,
      'issues.transform',
      issues.transform.length,
      'issues.strict',
      issues.strict.length,
      'file_id:',
      file_id,
    )
  },
})
