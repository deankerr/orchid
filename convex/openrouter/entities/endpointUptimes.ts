import * as OREndpointUptimes from '../../db/or/endpointUptimes'

// * queries
export const getLatest = OREndpointUptimes.getLatest.query

// * snapshots
export const upsert = OREndpointUptimes.upsert.internalMutation
