import * as Transforms from '../transforms'

export function consolidateVariants(models: ReturnType<typeof Transforms.models.parse>[]) {
  return Map.groupBy(models, (m) => m.slug)
    .values()
    .map((variants) => {
      const [first, ...rest] = variants.sort((a, b) => a.name.length - b.name.length)
      const { variant, ...base } = first
      return {
        ...base,
        variants: [variant, ...rest.map((m) => m.variant)].filter(Boolean) as string[],
      }
    })
    .toArray()
}
export type ConsolidatedModel = ReturnType<typeof consolidateVariants>[number]
