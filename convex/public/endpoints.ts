import { query } from '../_generated/server'
import * as OREndpoints from '../db/or/endpoints'

export const list = query(OREndpoints.list.define())
