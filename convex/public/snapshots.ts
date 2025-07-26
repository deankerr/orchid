import { query } from '../_generated/server'
import * as SnapshotArchives from '../db/snapshot/archives'
import * as SnapshotRuns from '../db/snapshot/runs'

export const getSnapshotStatus = query(SnapshotRuns.getStatus.define())
export const getSnapshotRuns = query(SnapshotRuns.list.define())
export const getSnapshotArchives = query(SnapshotArchives.getBySnapshotAt.define())