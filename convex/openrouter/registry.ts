import { literals } from 'convex-helpers/validators'

import { OrApps, OrAppsFn } from './entities/apps'
import { OrAuthors, OrAuthorsFn } from './entities/authors'
import { OrEndpointMetrics, OrEndpointMetricsFn } from './entities/endpointMetrics'
import { OrEndpoints, OrEndpointsFn } from './entities/endpoints'
import {
  OrEndpointUptimeMetrics,
  OrEndpointUptimeMetricsFn,
} from './entities/endpointUptimeMetrics'
import { OrModels, OrModelsFn } from './entities/models'
import { OrModelTokenMetrics, OrModelTokenMetricsFn } from './entities/modelTokenMetrics'
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

  endpointMetrics: {
    table: OrEndpointMetrics,
    fn: OrEndpointMetricsFn,
  },

  endpoints: {
    table: OrEndpoints,
    fn: OrEndpointsFn,
  },

  endpointUptimeMetrics: {
    table: OrEndpointUptimeMetrics,
    fn: OrEndpointUptimeMetricsFn,
  },

  models: {
    table: OrModels,
    fn: OrModelsFn,
  },

  modelTokenMetrics: {
    table: OrModelTokenMetrics,
    fn: OrModelTokenMetricsFn,
  },

  providers: {
    table: OrProviders,
    fn: OrProvidersFn,
  },
}

export const vEntityName = literals(...(Object.keys(Entities) as EntityName[]))
