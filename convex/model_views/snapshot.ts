import * as R from 'remeda'
import z4 from 'zod/v4'
import { orFetch } from '../openrouter/client'
import type { ModelView } from './table'
import { ModelStrictSchema, ModelTransformSchema } from './schemas'

export async function snapshot({ epoch }: { epoch: number }) {
  const result = await orFetch('/api/frontend/models', {
    schema: z4.object({
      data: z4.unknown().array(),
    }),
  })

  // store raw snapshot data
  // ? return raw result and store in caller
  // const file_id = await store(ctx, {
  //   data: result.data,
  //   key: `/api/frontend/models`,
  //   timestamp: epoch,
  // })

  const modelVariants: z4.infer<typeof ModelTransformSchema>[] = []
  const transform: { index: number; error: z4.ZodError }[] = []
  const strict: { index: number; error: z4.ZodError }[] = []

  for (const [index, record] of result.data.entries()) {
    const r1 = ModelTransformSchema.safeParse(record)
    if (r1.success) modelVariants.push(r1.data)
    else transform.push({ index, error: r1.error })

    const r2 = ModelStrictSchema.safeParse(record)
    if (r2.error) strict.push({ index, error: r2.error })
  }

  const models = consolidateVariants(modelVariants).map(R.addProp('epoch', epoch))

  return { models, issues: { transform, strict } }
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
