import { defineSchema, defineTable } from 'convex/server'
import { v, type Infer } from 'convex/values'

export const schema = defineSchema({
  // Core model data (shared across endpoints)
  models: defineTable({
    modelKey: v.string(), // Original 'id' field
    displayName: v.string(), // Original 'name' field
    modelCreated: v.number(), // When added to OpenRouter
    description: v.string(),
    architecture: v.object({
      inputModalities: v.array(v.string()),
      outputModalities: v.array(v.string()),
      tokenizer: v.string(),
      instructType: v.optional(v.union(v.string(), v.null())),
    }),
    contextLength: v.optional(v.number()),
    huggingFaceId: v.optional(v.string()),
    supportedParameters: v.array(v.string()),
  }).index('by_modelKey', ['modelKey']),

  // Endpoint-specific information
  modelEndpoints: defineTable({
    modelKey: v.string(), // Reference to models table
    providerName: v.string(),
    contextLength: v.number(),
    maxCompletionTokens: v.optional(v.number()),
    maxPromptTokens: v.optional(v.number()),
    quantization: v.optional(v.string()),
    status: v.optional(v.number()),

    // Pricing information - all values are stored as numbers
    pricing: v.object({
      prompt: v.number(),
      completion: v.number(),
      image: v.optional(v.number()),
      request: v.optional(v.number()),
      webSearch: v.optional(v.number()),
      internalReasoning: v.optional(v.number()),
      inputCacheRead: v.optional(v.number()),
      inputCacheWrite: v.optional(v.number()),
      discount: v.optional(v.number()),
    }),

    // Parameters supported by this endpoint
    supportedParameters: v.array(v.string()),
  })
    .index('by_modelKey', ['modelKey'])
    .index('by_providerName', ['providerName']),
})

export const vModel = schema.tables.models.validator
export type VModel = Infer<typeof vModel>
export const vModelEndpoint = schema.tables.modelEndpoints.validator
export type VModelEndpoint = Infer<typeof vModelEndpoint>

export default schema
