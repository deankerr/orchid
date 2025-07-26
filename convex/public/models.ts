import { query } from '../_generated/server'
import * as ORModels from '../db/or/models'

export const get = query(ORModels.get.define())
export const list = query(ORModels.list.define())
