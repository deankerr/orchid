import { createChangesFunctions, createChangesTableHelper } from './changesLib'

// * Provider changes table for schema definition
export const { table, vTable } = createChangesTableHelper('or_provider_changes')

// * Provider changes functions (created after schema is defined)
export const { listByEntityId, listByCrawlId, insertEvents } =
  createChangesFunctions('or_provider_changes')
