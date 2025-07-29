import * as R from 'remeda'
import type { ProcessContext } from '../types'
import type { Sources } from '../sources'

export async function standard(processCtx: ProcessContext<Sources>) {
  console.log('🔄 Running standard process...')
  
  // 1. Get models (already transformed)
  const modelsSource = processCtx.sources.models
  const modelsResults = await modelsSource.retrieve()
  const validModels = modelsResults.filter(r => r.success).map(r => r.data)
  
  console.log(`📦 Got ${validModels.length} valid models (${modelsResults.length - validModels.length} errors)`)
  
  // 2. Consolidate variants
  const consolidatedModels = consolidateVariants(validModels)
  console.log(`🔀 Consolidated into ${consolidatedModels.length} unique models`)
  
  // 3. Process endpoints for each model/variant combination
  const endpoints: any[] = []
  
  for (const model of consolidatedModels) {
    for (const variant of model.variants) {
      try {
        const endpointsSource = processCtx.sources.endpoints({ 
          permaslug: model.permaslug, 
          variant 
        })
        
        const endpointsResults = await endpointsSource.retrieve()
        const validEndpoints = endpointsResults.filter(r => r.success).map(r => r.data)
        
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
        
      } catch (error) {
        console.log(`❌ Failed to process endpoints for ${model.slug}:${variant} - ${error}`)
      }
    }
  }
  
  console.log(`🔗 Created ${endpoints.length} endpoint records`)
  
  // 4. Output results
  await processCtx.outputs.models?.(consolidatedModels)
  await processCtx.outputs.endpoints?.(endpoints)
  
  return {
    models: consolidatedModels.length,
    endpoints: endpoints.length,
  }
}

function consolidateVariants(models: any[]) {
  // models are duplicated per variant, consolidate them into the single entity with a variants list
  // use the model with shortest name as the base, e.g. "DeepSeek R1" instead of "DeepSeek R1 (free)"
  return Map.groupBy(models, (m: any) => m.slug)
    .values()
    .map((variants) => {
      const [first, ...rest] = variants.sort((a: any, b: any) => a.name.length - b.name.length)
      const { variant, ...base } = first
      return {
        ...base,
        variants: R.pipe([variant, ...rest.map((m: any) => m.variant)], R.filter(R.isDefined)),
      }
    })
    .toArray()
}
