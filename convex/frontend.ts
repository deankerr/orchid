import { v } from 'convex/values'

import { query } from './_generated/server'
import { OrEndpoints } from './or/or_endpoints'
import { OrModels } from './or/or_models'

export const getOrModel = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(OrModels.name)
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const listOrModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query(OrModels.name).collect()
  },
})

// * dev queries
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query(OrModels.name).collect()
    const endpoints = await ctx.db.query(OrEndpoints.name).collect()

    return models.map((model) => ({
      ...model,
      endpoints: endpoints.filter((e) => e.model_slug === model.slug),
    }))
  },
})

export const getLatestProcessedSnapshotAt = query({
  args: {},
  handler: async (ctx) => {
    // Find the latest epoch from processed models
    const latestModel = await ctx.db.query(OrModels.name).order('desc').first()

    if (!latestModel) {
      return null
    }

    return latestModel.snapshot_at
  },
})

export const getTokenizerCounts = query({
  args: {},
  returns: v.record(v.string(), v.number()),
  handler: async (ctx) => {
    const models = await ctx.db.query('or_models').collect()

    const tokenizerCounts: Record<string, number> = {}

    for (const model of models) {
      const tokenizer = model.tokenizer
      tokenizerCounts[tokenizer] = (tokenizerCounts[tokenizer] || 0) + 1
    }

    return tokenizerCounts
  },
})

export const getModelEndpointStats = query({
  args: {},
  returns: v.object({
    totalModels: v.number(),
    totalEndpoints: v.number(),
    modelsWithZeroEndpoints: v.number(),
    modelsWithEndpoints: v.number(),
    endpointStats: v.object({
      min: v.number(),
      max: v.number(),
      mean: v.number(),
      median: v.number(),
      mode: v.number(),
      modeCount: v.number(),
    }),
    distribution: v.record(v.string(), v.number()),
  }),
  handler: async (ctx) => {
    const models = await ctx.db.query('or_models').collect()
    const endpoints = await ctx.db.query('or_endpoints').collect()

    // Create a map of model slug to endpoint count
    const modelEndpointCounts: Record<string, number> = {}

    // Initialize all models with 0 endpoints
    for (const model of models) {
      modelEndpointCounts[model.slug] = 0
    }

    // Count endpoints per model
    for (const endpoint of endpoints) {
      if (modelEndpointCounts.hasOwnProperty(endpoint.model_slug)) {
        modelEndpointCounts[endpoint.model_slug]++
      }
    }

    const endpointCounts = Object.values(modelEndpointCounts)
    const modelsWithZeroEndpoints = endpointCounts.filter((count) => count === 0).length
    const nonZeroEndpointCounts = endpointCounts.filter((count) => count > 0)

    // Calculate statistics for models with endpoints
    const stats = {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      mode: 0,
      modeCount: 0,
    }

    if (nonZeroEndpointCounts.length > 0) {
      const sorted = [...nonZeroEndpointCounts].sort((a, b) => a - b)

      stats.min = sorted[0]
      stats.max = sorted[sorted.length - 1]
      stats.mean =
        Math.round((sorted.reduce((sum, count) => sum + count, 0) / sorted.length) * 100) / 100

      // Median
      const mid = Math.floor(sorted.length / 2)
      stats.median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]

      // Mode (most frequent count)
      const frequency: Record<number, number> = {}
      for (const count of sorted) {
        frequency[count] = (frequency[count] || 0) + 1
      }

      let maxFreq = 0
      for (const [count, freq] of Object.entries(frequency)) {
        if (freq > maxFreq) {
          maxFreq = freq
          stats.mode = parseInt(count)
          stats.modeCount = freq
        }
      }
    }

    // Create distribution (how many models have X endpoints)
    const distribution: Record<string, number> = {}
    for (const count of endpointCounts) {
      const key = count.toString()
      distribution[key] = (distribution[key] || 0) + 1
    }

    return {
      totalModels: models.length,
      totalEndpoints: endpoints.length,
      modelsWithZeroEndpoints,
      modelsWithEndpoints: nonZeroEndpointCounts.length,
      endpointStats: stats,
      distribution,
    }
  },
})

export const getTopModelsWithMostEndpoints = query({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
      endpointCount: v.number(),
      variants: v.array(v.string()),
      contextLength: v.number(),
      tokenizer: v.string(),
      inputModalities: v.array(v.string()),
      outputModalities: v.array(v.string()),
      instructType: v.optional(v.string()),
      createdAt: v.number(),
      endpoints: v.array(
        v.object({
          provider: v.string(),
          uuid: v.string(),
          pricing: v.object({
            input: v.number(),
            output: v.number(),
          }),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const models = await ctx.db.query('or_models').collect()
    const endpoints = await ctx.db.query('or_endpoints').collect()

    // Create a map of model slug to endpoints
    const modelEndpoints: Record<string, typeof endpoints> = {}
    for (const endpoint of endpoints) {
      if (!modelEndpoints[endpoint.model_slug]) {
        modelEndpoints[endpoint.model_slug] = []
      }
      modelEndpoints[endpoint.model_slug].push(endpoint)
    }

    // Create model details with endpoint counts
    const modelDetails = models
      .map((model) => {
        const modelEndpointList = modelEndpoints[model.slug] || []
        return {
          slug: model.slug,
          name: model.name,
          endpointCount: modelEndpointList.length,
          variants: model.variants,
          contextLength: model.context_length,
          tokenizer: model.tokenizer,
          inputModalities: model.input_modalities,
          outputModalities: model.output_modalities,
          instructType: model.instruct_type,
          createdAt: model.or_created_at,
          endpoints: modelEndpointList.map((endpoint) => ({
            provider: endpoint.provider_name,
            uuid: endpoint.uuid,
            pricing: {
              input: endpoint.pricing.input || 0,
              output: endpoint.pricing.output || 0,
            },
          })),
        }
      })
      .filter((model) => model.endpointCount > 0)
      .sort((a, b) => b.endpointCount - a.endpointCount)
      .slice(0, 10)

    return modelDetails
  },
})

export const getVariantStats = query({
  args: {},
  returns: v.object({
    variantCounts: v.record(v.string(), v.number()),
    totalVariants: v.number(),
    modelsWithMultipleVariants: v.number(),
  }),
  handler: async (ctx) => {
    const models = await ctx.db.query('or_models').collect()

    const variantCounts: Record<string, number> = {}
    let modelsWithMultipleVariants = 0

    for (const model of models) {
      if (model.variants.length > 1) {
        modelsWithMultipleVariants++
      }

      for (const variant of model.variants) {
        variantCounts[variant] = (variantCounts[variant] || 0) + 1
      }
    }

    const totalVariants = Object.values(variantCounts).reduce((sum, count) => sum + count, 0)

    return {
      variantCounts,
      totalVariants,
      modelsWithMultipleVariants,
    }
  },
})

export const getStringLengthStats = query({
  args: {},
  returns: v.object({
    modelNames: v.object({
      min: v.number(),
      max: v.number(),
      mean: v.number(),
      median: v.number(),
      longest: v.array(v.object({ name: v.string(), length: v.number() })),
    }),
    modelSlugs: v.object({
      min: v.number(),
      max: v.number(),
      mean: v.number(),
      median: v.number(),
      longest: v.array(v.object({ slug: v.string(), length: v.number() })),
    }),
    modelPermaslugs: v.object({
      min: v.number(),
      max: v.number(),
      mean: v.number(),
      median: v.number(),
      longest: v.array(v.object({ permaslug: v.string(), length: v.number() })),
    }),
    providerNames: v.object({
      min: v.number(),
      max: v.number(),
      mean: v.number(),
      median: v.number(),
      longest: v.array(v.object({ name: v.string(), length: v.number() })),
    }),
  }),
  handler: async (ctx) => {
    const models = await ctx.db.query('or_models').collect()
    const endpoints = await ctx.db.query('or_endpoints').collect()

    // Get unique provider names
    const providerNames = Array.from(new Set(endpoints.map((e) => e.provider_name)))

    const calculateStats = (values: string[], getTop = 5) => {
      const lengths = values.map((v) => v.length).sort((a, b) => a - b)
      const mean =
        Math.round((lengths.reduce((sum, len) => sum + len, 0) / lengths.length) * 100) / 100
      const median =
        lengths.length % 2 === 0
          ? (lengths[Math.floor(lengths.length / 2) - 1] +
              lengths[Math.floor(lengths.length / 2)]) /
            2
          : lengths[Math.floor(lengths.length / 2)]

      const longest = values
        .map((v) => ({ name: v, length: v.length }))
        .sort((a, b) => b.length - a.length)
        .slice(0, getTop)

      return {
        min: lengths[0],
        max: lengths[lengths.length - 1],
        mean,
        median,
        longest: longest.map((item) => ({
          name: item.name,
          length: item.length,
        })),
      }
    }

    return {
      modelNames: {
        ...calculateStats(models.map((m) => m.name)),
        longest: calculateStats(models.map((m) => m.name)).longest.map((item) => ({
          name: item.name,
          length: item.length,
        })),
      },
      modelSlugs: {
        ...calculateStats(models.map((m) => m.slug)),
        longest: calculateStats(models.map((m) => m.slug)).longest.map((item) => ({
          slug: item.name,
          length: item.length,
        })),
      },
      modelPermaslugs: {
        ...calculateStats(models.map((m) => m.permaslug)),
        longest: calculateStats(models.map((m) => m.permaslug)).longest.map((item) => ({
          permaslug: item.name,
          length: item.length,
        })),
      },
      providerNames: {
        ...calculateStats(providerNames),
        longest: calculateStats(providerNames).longest.map((item) => ({
          name: item.name,
          length: item.length,
        })),
      },
    }
  },
})

export const getProviderStats = query({
  args: {},
  returns: v.object({
    totalProviders: v.number(),
    providerEndpointCounts: v.record(v.string(), v.number()),
    topProviders: v.array(
      v.object({
        name: v.string(),
        endpointCount: v.number(),
        uniqueModels: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const endpoints = await ctx.db.query('or_endpoints').collect()

    const providerEndpointCounts: Record<string, number> = {}
    const providerModelSets: Record<string, Set<string>> = {}

    for (const endpoint of endpoints) {
      const provider = endpoint.provider_name
      providerEndpointCounts[provider] = (providerEndpointCounts[provider] || 0) + 1

      if (!providerModelSets[provider]) {
        providerModelSets[provider] = new Set()
      }
      providerModelSets[provider].add(endpoint.model_slug)
    }

    const topProviders = Object.entries(providerEndpointCounts)
      .map(([name, endpointCount]) => ({
        name,
        endpointCount,
        uniqueModels: providerModelSets[name].size,
      }))
      .sort((a, b) => b.endpointCount - a.endpointCount)
      .slice(0, 15)

    return {
      totalProviders: Object.keys(providerEndpointCounts).length,
      providerEndpointCounts,
      topProviders,
    }
  },
})

export const getModelTokenMetricsStats = query({
  args: {},
  returns: v.object({
    topModelsByTokens: v.array(
      v.object({
        modelVariant: v.string(),
        totalTokens: v.string(), // BigInt as string
        inputTokens: v.string(),
        outputTokens: v.string(),
        requestCount: v.string(),
        dayCount: v.number(),
      }),
    ),
    topModelsByRequests: v.array(
      v.object({
        modelVariant: v.string(),
        totalTokens: v.string(),
        inputTokens: v.string(),
        outputTokens: v.string(),
        requestCount: v.string(),
        dayCount: v.number(),
      }),
    ),
    totalRecords: v.number(),
    dateRange: v.object({
      from: v.number(),
      to: v.number(),
    }),
  }),
  handler: async (ctx) => {
    const oneMonthAgo = 1747872000000

    // Get all metrics from the last month using the timestamp index
    const metrics = await ctx.db
      .query('or_model_token_metrics')
      .withIndex('by_timestamp', (q) => q.gte('timestamp', oneMonthAgo))
      .collect()

    // Group by model:variant
    const aggregated: Record<
      string,
      {
        inputTokens: bigint
        outputTokens: bigint
        requestCount: bigint
        dayCount: number
        timestamps: Set<number>
      }
    > = {}

    for (const metric of metrics) {
      const key = `${metric.model_slug}:${metric.model_variant}`

      if (!aggregated[key]) {
        aggregated[key] = {
          inputTokens: 0n,
          outputTokens: 0n,
          requestCount: 0n,
          dayCount: 0,
          timestamps: new Set(),
        }
      }

      aggregated[key].inputTokens += BigInt(metric.input_tokens || 0)
      aggregated[key].outputTokens += BigInt(metric.output_tokens || 0)
      aggregated[key].requestCount += BigInt(metric.request_count || 0)
      aggregated[key].timestamps.add(metric.timestamp)
    }

    // Convert to array with calculated totals
    const results = Object.entries(aggregated).map(([modelVariant, data]) => ({
      modelVariant,
      totalTokens: (data.inputTokens + data.outputTokens).toString(),
      inputTokens: data.inputTokens.toString(),
      outputTokens: data.outputTokens.toString(),
      requestCount: data.requestCount.toString(),
      dayCount: data.timestamps.size,
    }))

    // Sort by total tokens (descending)
    const topModelsByTokens = results
      .sort((a, b) => {
        const aTotal = BigInt(a.totalTokens)
        const bTotal = BigInt(b.totalTokens)
        if (aTotal > bTotal) return -1
        if (aTotal < bTotal) return 1
        return 0
      })
      .slice(0, 20)

    // Sort by request count (descending)
    const topModelsByRequests = results
      .sort((a, b) => {
        const aRequests = BigInt(a.requestCount)
        const bRequests = BigInt(b.requestCount)
        if (aRequests > bRequests) return -1
        if (aRequests < bRequests) return 1
        return 0
      })
      .slice(0, 20)

    // Calculate date range
    const timestamps = metrics.map((m) => m.timestamp)
    const minTimestamp = Math.min(...timestamps)
    const maxTimestamp = Math.max(...timestamps)

    return {
      topModelsByTokens,
      topModelsByRequests,
      totalRecords: metrics.length,
      dateRange: {
        from: minTimestamp || oneMonthAgo,
        to: maxTimestamp || Date.now(),
      },
    }
  },
})
