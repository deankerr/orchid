import type { z } from 'zod/v4'

import type { outputToDB } from './output'
import { apps } from './transforms/apps'
import { endpoints } from './transforms/endpoints'
import { modelAuthor } from './transforms/modelAuthor'
import { models } from './transforms/models'
import { providers } from './transforms/providers'
import { uptimes } from './transforms/uptimes'

// Transform result types - inferred from our transform schemas
export type TransformTypes = {
  models: z.infer<typeof models>
  endpoints: z.infer<typeof endpoints>
  apps: z.infer<typeof apps>
  providers: z.infer<typeof providers>
  uptimes: z.infer<typeof uptimes>
  modelAuthor: z.infer<typeof modelAuthor>
}

// Output handlers - simple functions that write arrays of items
export type Outputs = ReturnType<typeof outputToDB>

// Run configuration
export interface RunConfig {
  run_id: string
  snapshot_at: number
  sources: 'remote' | 'archive'
}
