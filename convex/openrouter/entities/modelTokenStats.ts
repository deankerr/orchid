import * as ORModelTokenStats from '../../db/or/modelTokenStats'

// * queries
export const get = ORModelTokenStats.get.query

// * snapshots
export const upsert = ORModelTokenStats.upsert.internalMutation
