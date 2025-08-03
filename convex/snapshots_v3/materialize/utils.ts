import z4 from 'zod/v4'

import { gunzipSync } from 'fflate'

import { type ActionCtx } from '../../_generated/server'
import * as Transforms from '../transforms'

const textDecoder = new TextDecoder()

/**
 * Fetch a gzip-compressed blob from Convex storage, decompress it and
 * return its `.data` payload as an array (normalised from single objects).
 */
export async function getFromStorage(
  ctx: ActionCtx,
  storageId: string,
): Promise<{ data: unknown[] | null }> {
  try {
    const blob = await ctx.storage.get(storageId)
    if (!blob) return { data: null }

    const decompressed = gunzipSync(new Uint8Array(await blob.arrayBuffer()))
    const raw = JSON.parse(textDecoder.decode(decompressed))

    const UnwrapDataSchema = z4
      .object({ data: z4.unknown() })
      .transform(({ data }) => (Array.isArray(data) ? data : [data]) as unknown[])

    return { data: UnwrapDataSchema.parse(raw) }
  } catch (error) {
    console.error('Failed to get data from storage:', error)
    return { data: null }
  }
}

/** Tiny helper to return the first matching element or undefined. */
export function pick<T>(arr: T[], pred: (v: T) => boolean): T | undefined {
  for (const v of arr) if (pred(v)) return v
  return undefined
}

export function consolidateVariants(models: ReturnType<typeof Transforms.models.parse>[]) {
  return Map.groupBy(models, (m: any) => m.slug)
    .values()
    .map((variants: any[]) => {
      const [first, ...rest] = variants.sort((a, b) => a.name.length - b.name.length)
      const { variant, ...base } = first
      return {
        ...base,
        variants: [variant, ...rest.map((m) => m.variant)].filter(Boolean),
      }
    })
    .toArray()
}
export type ConsolidatedModel = ReturnType<typeof consolidateVariants>[number]
