import { createChangesFunctions, createChangesTable } from '../../lib/changesTable'

// * Provider changes table for schema definition
export const table = createChangesTable()

// * Provider changes functions (created after schema is defined)
export const { listByEntityId, listByCrawlId, insertEvents, clearTable } =
  createChangesFunctions('or_provider_changes')
