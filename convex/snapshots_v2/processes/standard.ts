import { asyncMap } from 'convex-helpers'
import type { Infer } from 'convex/values'
import * as R from 'remeda'

import * as DB from '@/convex/db'

import type { ProcessContext } from '../context'
import { diffItem } from '../differ'
import type { TransformTypes } from '../types'

// Local type for consolidated models in this process
type NewModel = Infer<typeof DB.OrModels.vTable.validator>
type NewEndpoint = Infer<typeof DB.OrEndpoints.vTable.validator>

export async function standard(processCtx: ProcessContext) {
  console.log('🔄 Running standard process...')

  const consolidatedModels = await processCtx.sources.models().then(consolidateVariants)

  console.log(`🔀 Consolidated into ${consolidatedModels.length} unique models`)

  // 3. Process endpoints for each model functionally
  const modelEndpoints = await asyncMap(consolidatedModels, async (cmodel) => {
    const model: NewModel = {
      ...cmodel,
      snapshot_at: processCtx.config.snapshot_at,
      stats: {}, // Empty stats - we don't care about these anymore
    }

    try {
      return await processModelEndpoints(processCtx, model)
    } catch (error) {
      console.error(`❌ Failed to process endpoints for ${model.slug}`, error)
      return { model, endpoints: [] }
    }
  })

  // Get existing data for diffing
  const [existingModels, existingEndpoints] = await Promise.all([
    processCtx.state.existingModels(),
    processCtx.state.existingEndpoints(),
  ])

  // Create lookup maps for efficient diffing
  const existingModelsMap = new Map(existingModels.map((m: any) => [m.slug, m]))
  const existingEndpointsMap = new Map(existingEndpoints.map((e: any) => [e.uuid, e]))

  // Initialize metrics
  const metrics: Record<string, { insert: number; update: number; stable: number; name: string }> =
    {}
  function trackMetric(table: string, kind: string) {
    if (!metrics[table]) {
      metrics[table] = { insert: 0, update: 0, stable: 0, name: table }
    }
    metrics[table][kind as keyof (typeof metrics)[string]]++
  }

  // Process models and endpoints with diffing
  for (const { model, endpoints } of modelEndpoints) {
    // Diff and emit model
    const existingModel = existingModelsMap.get(model.slug)
    const modelResult = diffItem('or_models', model, existingModel)

    trackMetric(modelResult.table, modelResult.kind)

    // Only emit insert/update to outputs (skip stable)
    if (modelResult.kind !== 'stable') {
      await processCtx.outputs.write(modelResult)
    }

    // Diff and emit endpoints
    for (const endpoint of endpoints) {
      const existingEndpoint = existingEndpointsMap.get(endpoint.uuid)
      const endpointResult = diffItem('or_endpoints', endpoint, existingEndpoint)

      trackMetric(endpointResult.table, endpointResult.kind)

      // Only emit insert/update to outputs (skip stable)
      if (endpointResult.kind !== 'stable') {
        await processCtx.outputs.write(endpointResult)
      }
    }
  }

  // 4. Output results with metrics
  const totalEndpoints = modelEndpoints.reduce((sum, { endpoints }) => sum + endpoints.length, 0)
  return {
    models: consolidatedModels.length,
    endpoints: totalEndpoints,
    metrics,
  }
}

async function processModelEndpoints(processCtx: ProcessContext, model: NewModel) {
  const endpoints: NewEndpoint[] = []

  for (const variant of model.variants) {
    const validEndpoints = await processCtx.sources.endpoints({
      permaslug: model.permaslug,
      variant,
    })

    // Enhance endpoints with model data (similar to existing pipeline)
    for (const endpoint of validEndpoints) {
      endpoints.push({
        ...endpoint,
        model_slug: model.slug,
        model_permaslug: model.permaslug,
        capabilities: {
          ...endpoint.capabilities,
          image_input: model.input_modalities.includes('image'),
          file_input: model.input_modalities.includes('file'),
        },
        or_model_created_at: model.or_created_at,
        snapshot_at: processCtx.config.snapshot_at,
      })
    }
  }

  return { model, endpoints }
}

function consolidateVariants(models: TransformTypes['models'][]) {
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
