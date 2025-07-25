import * as ORModelAppLeaderboards from '../../db/or/modelAppLeaderboards'

// * queries
export const get = ORModelAppLeaderboards.get.query

// * snapshots
export const upsert = ORModelAppLeaderboards.upsert.internalMutation
