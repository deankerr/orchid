import { createChangesFunctions, createChangesTableHelper } from './changesLib'

// * Model changes table for schema definition
export const { table, vTable } = createChangesTableHelper('or_model_changes')

// * Model changes functions (created after schema is defined)
export const { listByEntityId, listByCrawlId, insertEvents } =
  createChangesFunctions('or_model_changes')
