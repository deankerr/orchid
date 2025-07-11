import { literals } from 'convex-helpers/validators'

import { OrApps, OrAppsFn } from './entities/apps'
import { OrAuthors, OrAuthorsFn } from './entities/authors'
import { OrEndpoints, OrEndpointsFn } from './entities/endpoints'
import { OrModels, OrModelsFn } from './entities/models'
import { OrProviders, OrProvidersFn } from './entities/providers'

export type EntityName = keyof typeof Entities

export const Entities = {
  apps: {
    table: OrApps,
    fn: OrAppsFn,
  },

  authors: {
    table: OrAuthors,
    fn: OrAuthorsFn,
  },

  endpoints: {
    table: OrEndpoints,
    fn: OrEndpointsFn,
  },

  models: {
    table: OrModels,
    fn: OrModelsFn,
  },

  providers: {
    table: OrProviders,
    fn: OrProvidersFn,
  },
}

export const vEntityName = literals(...(Object.keys(Entities) as EntityName[]))
