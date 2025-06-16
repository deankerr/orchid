import * as R from 'remeda'
import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import { validateArray } from '../openrouter/validation'
import type { ModelView } from './table'
import { ModelStrictSchema, ModelTransformSchema } from './schemas'

export async function snapshot({ epoch }: { epoch: number }) {
  const result = await orFetch('/api/frontend/models', {
    schema: z4.object({
      data: z4.unknown().array(),
    }),
  })

  const { items: modelVariants, issues } = validateArray(result.data, ModelTransformSchema, ModelStrictSchema)

  const models: ModelView[] = consolidateVariants(modelVariants).map(R.addProp('epoch', epoch))

  return { models, issues }
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
