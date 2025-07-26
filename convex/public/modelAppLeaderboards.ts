import { query } from '../_generated/server'
import * as ORModelAppLeaderboards from '../db/or/modelAppLeaderboards'

export const get = query(ORModelAppLeaderboards.get.define())
