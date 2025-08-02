import type { ActionCtx } from '../../_generated/server'
import type { RunConfig } from '../types'
import type { Validator } from '../validation/validator'
import { createArchiveSources } from './archive'
import { createRemoteSources } from './remote'

// * Sources interface - consistent API for all source types
export interface Sources {
  models(): Promise<any[]>
  endpoints(q: { permaslug: string; variant: string }): Promise<any[]>
  apps(q: { permaslug: string; variant: string }): Promise<any[]>
  providers(): Promise<any[]>
  uptimes(q: { uuid: string }): Promise<any[]>
  modelAuthor(q: { authorSlug: string }): Promise<any>
}

// * Sources creation context - consistent interface for all source creation functions
export interface SourcesContext {
  ctx: ActionCtx
  config: RunConfig
  validator: Validator
}

// * Main sources factory - chooses appropriate source type based on config
export async function createSources(args: SourcesContext): Promise<Sources> {
  return args.config.replay_from
    ? await createArchiveSources(args)
    : await createRemoteSources(args)
}

// * Archival decorator - wraps source methods to optionally disable archiving (for tests)
export function withArchival<T extends Sources>(sources: T, enabled: boolean = true): T {
  if (!enabled) {
    // TODO: Return wrapped sources that skip archival writes
    // For now, just return the sources as-is
    return sources
  }
  return sources
}
