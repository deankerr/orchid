import type { IChange } from 'json-diff-ts'

import type { Doc } from './_generated/dataModel'

export type MergeResult = {
  action: 'insert' | 'replace' | 'stable'
  docId: string
  changes: IChange[]
}

export type OrApp = Doc<'or_apps'>
export type OrAppTokenMetric = Doc<'or_app_token_metrics'>
export type OrAuthor = Doc<'or_authors'>
export type OrEndpoint = Doc<'or_endpoints'>
export type OrEndpointMetric = Doc<'or_endpoint_metrics'>
export type OrEndpointUptimeMetric = Doc<'or_endpoint_uptime_metrics'>
export type OrModel = Doc<'or_models'>
export type OrModelTokenMetric = Doc<'or_model_token_metrics'>
export type OrProvider = Doc<'or_providers'>
