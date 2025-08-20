import type { Options } from 'json-diff-ts'

import type { CrawlArchiveBundle } from '../crawl'

export type EntityConfig = {
  extractId: (entity: any) => string
  extractName: (entity: any) => string
  diffOptions: Options
  buildMapFromBundle: (bundle: CrawlArchiveBundle) => Map<string, any>
}

export const entityConfigs: Record<'models' | 'endpoints' | 'providers', EntityConfig> = {
  models: {
    extractId: (entity: any) => entity.slug,
    extractName: (entity: any) => entity.name ?? entity.slug,
    diffOptions: {
      keysToSkip: ['endpoint'],
      embeddedObjKeys: { input_modalities: '$value', output_modalities: '$value' },
      treatTypeChangeAsReplace: false,
    },
    buildMapFromBundle: (bundle: CrawlArchiveBundle) => {
      const map = new Map<string, any>()
      for (const modelEntry of bundle.data.models) {
        const slug: string = modelEntry.model.slug
        const variant: string | null = modelEntry.model.endpoint?.variant ?? null
        const key = variant ? `${slug}:${variant}` : slug
        map.set(key, modelEntry.model)
      }
      return map
    },
  },
  endpoints: {
    extractId: (entity: any) => entity.id,
    extractName: (entity: any) => entity.name ?? entity.id,
    diffOptions: {
      keysToSkip: ['stats', 'provider_info', 'model'],
      embeddedObjKeys: { supported_parameters: '$value' },
      treatTypeChangeAsReplace: false,
    },
    buildMapFromBundle: (bundle: CrawlArchiveBundle) => {
      const map = new Map<string, any>()
      for (const modelEntry of bundle.data.models) {
        const endpoints = modelEntry.endpoints || []
        for (const endpoint of endpoints) {
          map.set(endpoint.id, endpoint)
        }
      }
      return map
    },
  },
  providers: {
    extractId: (entity: any) => entity.slug,
    extractName: (entity: any) => entity.name ?? entity.slug,
    diffOptions: {
      keysToSkip: ['ignoredProviderModels'],
      treatTypeChangeAsReplace: false,
    },

    buildMapFromBundle: (bundle: CrawlArchiveBundle) => {
      const map = new Map<string, any>()
      for (const provider of bundle.data.providers) {
        const slug = (provider as any).slug as string
        map.set(slug, provider)
      }
      return map
    },
  },
}
