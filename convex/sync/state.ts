import { ConvexError } from 'convex/values'
import { internal } from '../_generated/api'
import { type ActionCtx } from '../_generated/server'

export type ModelList = Array<{
  modelId: string
  author: string
  slug: string
  permaslug: string
  variant?: string
  topEndpointId?: string
}>

export type EndpointIdsList = Array<{
  modelId: string
  endpointIds: string[]
}>

export async function insertModelList(ctx: ActionCtx, args: { epoch: number; modelList: ModelList }) {
  const { epoch, modelList } = args

  return await ctx.runMutation(internal.snapshots.insertSnapshot, {
    resourceType: 'model-list',
    epoch,
    data: { success: true, data: modelList },
  })
}

export async function getModelList(ctx: ActionCtx, args: { epoch: number }) {
  const { epoch } = args

  const snapshot = await ctx.runQuery(internal.snapshots.get, {
    resourceType: 'model-list',
    epoch,
  })

  if (!snapshot || !('data' in snapshot.data)) {
    throw new ConvexError({ message: 'model-list not found', epoch })
  }

  const { data: modelList } = snapshot.data
  return modelList as ModelList
}

export async function insertEndpointIdsList(
  ctx: ActionCtx,
  args: { epoch: number; endpointIdsList: EndpointIdsList },
) {
  const { epoch, endpointIdsList } = args

  return await ctx.runMutation(internal.snapshots.insertSnapshot, {
    resourceType: 'endpoint-ids-list',
    epoch,
    data: { success: true, data: endpointIdsList },
  })
}

export async function getEndpointIdsList(ctx: ActionCtx, args: { epoch: number }) {
  const { epoch } = args

  const snapshot = await ctx.runQuery(internal.snapshots.get, {
    resourceType: 'endpoint-ids-list',
    epoch,
  })

  if (!snapshot || !('data' in snapshot.data)) {
    throw new ConvexError({ message: 'endpoint-ids-list not found', epoch })
  }

  const { data: endpointIdsList } = snapshot.data
  return endpointIdsList as EndpointIdsList
}
