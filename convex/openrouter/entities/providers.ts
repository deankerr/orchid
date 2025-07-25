import * as ORProviders from '../../db/or/providers'

// * queries
export const list = ORProviders.list.query

// * snapshots
export const upsert = ORProviders.upsert.internalMutation
