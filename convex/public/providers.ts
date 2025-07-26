import { query } from '../_generated/server'
import * as ORProviders from '../db/or/providers'

export const list = query(ORProviders.list.define())
