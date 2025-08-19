import { createChangesFunctions, createChangesTable } from '../../lib/changesTable'

// * Model changes table for schema definition
export const table = createChangesTable()

// * Model changes functions (created after schema is defined)
export const { listByEntityId, listByCrawlId, insertEvents } =
  createChangesFunctions('or_model_changes')
