import { asyncMap } from 'convex-helpers'
import type { Infer } from 'convex/values'
import * as R from 'remeda'

import * as DB from '@/convex/db'

import type { ProcessContext } from '../context'
import type { TransformTypes } from '../types'

// Local type for consolidated models in this process
type NewModel = Infer<typeof DB.OrModels.vTable.validator>
type NewEndpoint = Infer<typeof DB.OrEndpoints.vTable.validator>

export async function standard(processCtx: ProcessContext) {
  console.log('🔄 Running standard process...')

  const consolidatedModels = await processCtx.sources.models().then(consolidateVariants)

  console.log(`🔀 Consolidated into ${consolidatedModels.length} unique models`)

  // 3. Process endpoints for each model functionally
  const modelEndpointResults = await asyncMap(consolidatedModels, async (cmodel) => {
    const model: NewModel = {
      ...cmodel,
      snapshot_at: processCtx.config.snapshot_at,
      stats: {},
    }

    try {
      return await processModelEndpoints(processCtx, model)
    } catch (error) {
      console.error(`❌ Failed to process endpoints for ${model.slug}`, error)
      return { model, endpoints: [] }
    }
  })

  for (const result of modelEndpointResults) {
    await processCtx.outputs.modelEndpoints(result)
  }

  // 4. Output results
  return {
    models: consolidatedModels.length,
    endpoints: modelEndpointResults.length,
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
