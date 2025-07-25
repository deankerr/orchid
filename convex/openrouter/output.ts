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
export const apps = ORApps.upsert.internalMutation
export const authors = ORAuthors.upsert.internalMutation
export const endpoints = OREndpoints.upsert.internalMutation
export const endpointStats = OREndpointStats.upsert.internalMutation
export const endpointUptimes = OREndpointUptimes.upsert.internalMutation
export const modelAppLeaderboards = ORModelAppLeaderboards.upsert.internalMutation
export const models = ORModels.upsert.internalMutation
export const modelStats = ORModels.updateStats.internalMutation
export const modelTokenStats = ORModelTokenStats.upsert.internalMutation
export const providers = ORProviders.upsert.internalMutation
