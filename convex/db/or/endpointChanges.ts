import { createChangesFunctions, createChangesTableHelper } from './changesLib'

// * Endpoint changes table for schema definition
export const { table, vTable } = createChangesTableHelper('or_endpoint_changes')

// * Endpoint changes functions (created after schema is defined)
export const { listByEntityId, listByCrawlId, insertEvents } =
  createChangesFunctions('or_endpoint_changes')
