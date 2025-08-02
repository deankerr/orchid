import { asyncMap } from 'convex-helpers'
import type { Infer } from 'convex/values'
import * as R from 'remeda'

import * as DB from '@/convex/db'

import { createMetricsCollector, decide } from '../comparison/decision'
import type { ProcessContext, TransformTypes } from '../types'

// * Local types for consolidated models in this process
type NewModel = Infer<typeof DB.OrModels.vTable.validator>
type NewEndpoint = Infer<typeof DB.OrEndpoints.vTable.validator>

// * Main standard process using new architecture
export async function standard(processCtx: ProcessContext) {
  console.log('🔄 Running standard process (v2)...')

  const metrics = createMetricsCollector()

  // * Step 1: Get and consolidate models
  const consolidatedModels = await processCtx.sources.models().then(consolidateVariants)
  console.log(`🔀 Consolidated into ${consolidatedModels.length} unique models`)

  // * Step 2: Process endpoints for each model
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

  // * Step 3: Get existing data for comparison
  const [existingModels, existingEndpoints] = await Promise.all([
    processCtx.state.models(),
    processCtx.state.endpoints(),
  ])

  // * Step 4: Process models and endpoints with new decision logic
  for (const { model, endpoints } of modelEndpoints) {
    // Decide what to do with the model
    const modelOutcome = decide('or_models', model, existingModels, metrics)
    
    // Write the decision (skip stable items automatically)
    await processCtx.outputs.write(modelOutcome)

    // Process endpoints for this model
    for (const endpoint of endpoints) {
      const endpointOutcome = decide('or_endpoints', endpoint, existingEndpoints, metrics)
      await processCtx.outputs.write(endpointOutcome)
    }
  }

  // * Step 5: Return metrics summary
  const allMetrics = metrics.all()
  const totalModels = allMetrics.find(m => m.name === 'or_models')?.total ?? 0
  const totalEndpoints = allMetrics.find(m => m.name === 'or_endpoints')?.total ?? 0

  console.log(`✅ Standard process completed: ${totalModels} models, ${totalEndpoints} endpoints`)

  return {
    models: totalModels,
    endpoints: totalEndpoints,
    metrics: allMetrics,
  }
}

// * Process endpoints for a single model (unchanged logic)
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

// * Consolidate variants logic (unchanged)
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