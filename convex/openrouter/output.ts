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
import * as SnapshotArchives from '../db/snapshot/archives'
import * as SnapshotRuns from '../db/snapshot/runs'

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

// * Snapshot functions
export const insertSnapshotRun = internalMutation(SnapshotRuns.insertRun.define())
export const updateSnapshotRun = internalMutation(SnapshotRuns.updateRun.define())
export const insertSnapshotArchive = internalMutation(SnapshotArchives.insertArchiveRecord.define())
