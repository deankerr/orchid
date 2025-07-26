import { internalMutation } from '../_generated/server'
import * as ORApps from '../db/or/apps'
import * as ORAuthors from '../db/or/authors'
import * as OREndpoints from '../db/or/endpoints'
import * as OREndpointStats from '../db/or/endpointStats'
import * as OREndpointUptimes from '../db/or/endpointUptimes'
import * as ORModelAppLeaderboards from '../db/or/modelAppLeaderboards'
import * as ORModels from '../db/or/models'
import * as ORModelTokenStats from '../db/or/modelTokenStats'
import * as ORProviders from '../db/or/providers'

// * Entity upsert functions
export const apps = internalMutation(ORApps.upsert.define())
export const authors = internalMutation(ORAuthors.upsert.define())
export const endpoints = internalMutation(OREndpoints.upsert.define())
export const endpointStats = internalMutation(OREndpointStats.upsert.define())
export const endpointUptimes = internalMutation(OREndpointUptimes.upsert.define())
export const modelAppLeaderboards = internalMutation(ORModelAppLeaderboards.upsert.define())
export const models = internalMutation(ORModels.upsert.define())
export const modelStats = internalMutation(ORModels.updateStats.define())
export const modelTokenStats = internalMutation(ORModelTokenStats.upsert.define())
export const providers = internalMutation(ORProviders.upsert.define())
