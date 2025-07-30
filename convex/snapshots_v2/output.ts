import type { Infer } from 'convex/values'

import * as DB from '@/convex/db'

import { internal } from '../_generated/api'
import type { ActionCtx } from '../_generated/server'

type ModelWithEndpoints = {
  model: Infer<typeof DB.OrModels.vTable.validator>
  endpoints: Infer<typeof DB.OrEndpoints.vTable.validator>[]
}

type OutputResult = {
  name: string
  insert?: number
  stable?: number
  update?: number
}

export function outputToDB(ctx: ActionCtx) {
  return {
    modelEndpoints: async ({ model, endpoints }: ModelWithEndpoints) => {
      const r1: OutputResult = await ctx.runMutation(internal.openrouter.output.models, {
        items: [model],
      })
      const r2: OutputResult = await ctx.runMutation(internal.openrouter.output.endpoints, {
        items: endpoints,
      })
    },
  }
}
