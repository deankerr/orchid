import { query } from '../_generated/server'
import * as OREndpointUptimes from '../db/or/endpointUptimes'

export const getLatest = query(OREndpointUptimes.getLatest.define())
