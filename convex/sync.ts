import { ConvexError } from 'convex/values'
import { isResponseError } from 'up-fetch'
import { internal } from './_generated/api'
import { internalAction } from './_generated/server'
import { orClient } from './openrouter/fetch'

function getHourlyTimestamp() {
  const now = Date.now()
  const date = new Date(now)
  date.setMinutes(0, 0, 0) // Set minutes, seconds, and milliseconds to 0
  return date.getTime()
}

async function fetchModels() {
  const modelKeys = await orClient.v1.models()
  if ('error' in modelKeys) {
    throw new ConvexError({ message: '/api/v1/models', error: modelKeys.error })
  }

  const modelDetails = await orClient.frontend.models()
  if ('error' in modelDetails) {
    throw new ConvexError({ message: '/api/frontend/models', error: modelDetails.error })
  }

  const models: { id: string; permaslug: string }[] = []
  const orphaned: unknown[] = []

  for (const details of modelDetails.data) {
    if (details.permaslug === 'openrouter/auto') {
      continue // not an actual model
    }

    const modelKey = modelKeys.data.find((m) => m.name === details.name)
    if (modelKey) {
      models.push({ ...details, id: modelKey.id })
    } else {
      orphaned.push(details)
    }
  }

  console.log('models:', models.length, 'orphaned:', orphaned.length)
  return { models, orphaned }
}

export type ModelEndpointsPack = {
  model: any
  endpoints: any
  uptimes: Record<string, any>
  apps: any
}

export const models = internalAction({
  handler: async (ctx) => {
    const batchTimestamp = getHourlyTimestamp()
    const batchMetadata = await ctx.runQuery(internal.snapshots.getSnapshotBatchMetadata, { batchTimestamp })
    if (batchMetadata.length > 0) {
      console.log('batch already exists, skipping')
      return
    }

    const { models, orphaned } = await fetchModels()

    const allModels: ModelEndpointsPack[] = []

    for (const model of models) {
      const params = {
        permaslug: model.permaslug,
        variant: model.id.split(':')[1] || 'standard',
      }

      try {
        const endpointsResponse = await orClient.frontend.stats.endpoints(params)

        if ('error' in endpointsResponse) {
          throw new ConvexError({ message: `/api/frontend/stats/endpoints`, error: endpointsResponse.error })
        }

        const uptimes: Record<string, any> = {}
        for (const endpoint of endpointsResponse.data) {
          const uptimeResponse = await orClient.frontend.stats.uptimeHourly({ id: endpoint.id })
          if ('error' in uptimeResponse) {
            throw new ConvexError({
              message: `/api/frontend/stats/uptimeHourly`,
              error: uptimeResponse.error,
            })
          }
          uptimes[endpoint.id] = uptimeResponse.data.history
        }

        const appResponse = await orClient.frontend.stats.app(params)
        if ('error' in appResponse) {
          throw new ConvexError({ message: `/api/frontend/stats/app`, error: appResponse.error })
        }

        allModels.push({
          model,
          endpoints: endpointsResponse.data,
          uptimes,
          apps: appResponse.data,
        })
      } catch (err) {
        if (isResponseError(err)) {
          console.error({
            params,
            url: err.request.url,
            err,
          })
        } else {
          console.error({ params, err })
        }
      }
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'model_endpoints',
      key: 'all',
      batchTimestamp,
      data: { all: allModels },
    })

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      category: 'model',
      key: 'orphaned',
      batchTimestamp,
      data: { orphaned },
    })
  },
})
