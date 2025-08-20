import { createChangesFunctions, createChangesTable } from '../../lib/changesTable'

// * Endpoint changes table for schema definition
export const table = createChangesTable()

// * Endpoint changes functions (created after schema is defined)
export const { listByEntityId, listByCrawlId, insertEvents, clearTable } =
  createChangesFunctions('or_endpoint_changes')
