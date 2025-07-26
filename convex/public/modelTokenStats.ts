import { query } from '../_generated/server'
import * as ORModelTokenStats from '../db/or/modelTokenStats'

export const get = query(ORModelTokenStats.get.define())
