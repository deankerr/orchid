import * as OREndpoints from '../../db/or/endpoints'

// * queries
export const list = OREndpoints.list.query

// * snapshots
export const upsert = OREndpoints.upsert.internalMutation
