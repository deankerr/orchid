import * as ORModels from '../../db/or/models'

// * queries
export const get = ORModels.get.query
export const list = ORModels.list.query

// * snapshots
export const upsert = ORModels.upsert.internalMutation
export const updateStats = ORModels.updateStats.internalMutation
