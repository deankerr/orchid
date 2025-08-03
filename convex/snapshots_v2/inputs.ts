import z4 from 'zod/v4'

import type { ActionCtx } from '../_generated/server'
import { getArchivedData, storeSnapshotData } from './archive'
import { endpoints } from './sources/endpoints'
import { models } from './sources/models'
import type { InputMode, RunConfig, TransformTypes } from './types'

// * Generic input specification interface
export interface InputSpec<TOutput, TParams extends Record<string, any>> {
  key: string
  schema: z4.ZodType<TOutput>
  remote: (params?: TParams) => Promise<TOutput>
  archiveKey: (params?: TParams) => { type: string; params?: string }
}

// * responses are always wrapped in a `data` field, force results to be an array
const UnwrapDataSchema = z4
  .object({ data: z4.unknown() })
  .transform(({ data }) => (Array.isArray(data) ? data : [data]) as unknown[])

// * Generic input builder function
export function makeInput<TOutput, TParams extends Record<string, any>>(
  ctx: ActionCtx,
  args: {
    spec: InputSpec<TOutput, TParams>
    config: RunConfig
    mode: InputMode
    filter: IssueFilter
  },
): (p: TParams) => Promise<TOutput[]> {
  const { spec, config, mode, filter } = args

  return async (params: TParams) => {
    // * Determine data source based on mode
    const raw = mode === 'archive' 
      ? await getArchivedData(ctx, {
          replay_from: config.replay_from!,
          ...spec.archiveKey(params),
        })
      : await spec.remote(params)

    // * Store snapshot data if in remote mode and storage enabled
    if (mode !== 'archive' && config.outputMethod === 'convex-writer') {
      await storeSnapshotData(ctx, {
        ...spec.archiveKey(params),
        run_id: config.run_id,
        snapshot_at: config.snapshot_at,
        data: raw,
      })
    }

    // * Transform and validate data
    const good: TOutput[] = []
    const items = UnwrapDataSchema.parse(raw, { error: () => `Failed to unwrap data: ${spec.key}` })

    for (const item of Array.isArray(items) ? items : [items]) {
      const parsed = spec.schema.safeParse(item)
      if (parsed.success) {
        good.push(parsed.data)
      } else {
        filter.add({
          source: spec.key,
          error: parsed.error,
        })
      }
    }

    return good
  }
}

// * Input interface - consistent API for all input types
export interface InputMap {
  models(): Promise<TransformTypes['models'][]>
  endpoints(q: { permaslug: string; variant: string }): Promise<TransformTypes['endpoints'][]>
}

type IssueFilter = ReturnType<typeof createIssueFilter>

function createIssueFilter() {
  const issues: Array<{ source: string; error: any }> = []

  return {
    add(issue: { source: string; error: any }) {
      issues.push(issue)
    },
    issues() {
      return [...issues]
    },
  }
}

// * Main inputs factory - creates InputMap based on config
export function createInputs(
  ctx: ActionCtx,
  config: RunConfig,
): { inputs: InputMap; filter: IssueFilter } {
  const useArchive = !!config.replay_from
  const storeAllowed = config.outputMethod === 'convex-writer'
  const mode: InputMode = useArchive ? 'archive' : storeAllowed ? 'remote' : 'remote-no-store'

  const filter = createIssueFilter()

  // * Build input functions using the specs
  const specs = [models, endpoints]
  const map: any = {}

  for (const spec of specs) {
    map[spec.key] = makeInput(ctx, { spec: spec as InputSpec<any, any>, config, mode, filter })
  }

  return {
    inputs: map as InputMap,
    filter,
  }
}
