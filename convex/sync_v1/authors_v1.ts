import { defineTable } from 'convex/server'
import { v, type AsObjectValidator, type Infer } from 'convex/values'
import { diff } from 'json-diff-ts'
import { z } from 'zod'
import type { MutationCtx } from '../_generated/server'

export const authorsTable = defineTable({
  uuid: v.string(),
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  origin_created_at: v.string(),
  origin_updated_at: v.string(),
  epoch: v.number(),
}).index('by_slug', ['slug'])

export const vAuthorFields = authorsTable.validator.fields

const OpenRouterModelAuthorSchema = z.object({
  author: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  }),
})

export function parseAuthorRecord(record: unknown) {
  const parsed = OpenRouterModelAuthorSchema.parse(record)

  return {
    uuid: parsed.author.id,
    slug: parsed.author.slug,
    name: parsed.author.name,
    description: parsed.author.description || undefined,
    origin_created_at: parsed.author.created_at,
    origin_updated_at: parsed.author.updated_at,
  }
}

export async function mergeAuthor(ctx: MutationCtx, author: Infer<AsObjectValidator<typeof vAuthorFields>>) {
  const existingAuthor = await ctx.db
    .query('authors_v1')
    .withIndex('by_slug', (q) => q.eq('slug', author.slug))
    .first()

  const diffResults = diff(existingAuthor || {}, author, {
    keysToSkip: ['_id', '_creationTime', 'epoch'],
  })
  await ctx.db.insert('authors_v1_diff', { name: author.name, epoch: author.epoch, diff: diffResults })

  if (existingAuthor) return await ctx.db.replace(existingAuthor._id, author)
  return await ctx.db.insert('authors_v1', author)
}
