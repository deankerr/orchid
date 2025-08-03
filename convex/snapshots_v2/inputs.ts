import z4 from 'zod/v4'

import type { ActionCtx } from '../_generated/server'
import { getArchivedData, storeSnapshotData } from './archive'
import { endpoints } from './sources/endpoints'
import { models } from './sources/models'
import type { RunConfig, TransformTypes } from './types'

// * Generic input specification interface
export interface InputSpec<TOutput> {
  key: string
  schema: z4.ZodType<TOutput>
  remote: (...args: any[]) => Promise<unknown>
  archiveKey: (...args: any[]) => { type: string; params?: string }
}

// * responses are always wrapped in a `data` field, force results to be an array
const UnwrapDataSchema = z4
  .object({ data: z4.unknown() })
  .transform(({ data }) => (Array.isArray(data) ? data : [data]) as unknown[])

// * Generic input builder function
export function makeInput<TOutput>(
  ctx: ActionCtx,
  args: {
    spec: InputSpec<TOutput>
    config: RunConfig
    filter: IssueFilter
  },
): (...args: any[]) => Promise<TOutput[]> {
  const { spec, config, filter } = args
  return async (...args: any[]) => {
    // * Determine data source based on mode
    const raw = config.replay
      ? await getArchivedData(ctx, {
          replay: config.replay,
          ...spec.archiveKey(...args),
        })
      : await spec.remote(...args)

    // * Store snapshot data if in remote mode and storage enabled
    if (!config.replay && config.outputType === 'db') {
      await storeSnapshotData(ctx, {
        ...spec.archiveKey(...args),
        run_id: config.run_id,
        snapshot_at: config.snapshot_at,
        data: raw,
      })
    }

    // * Transform and validate data
    const good: TOutput[] = []
    const items = UnwrapDataSchema.parse(raw, { error: () => `Failed to unwrap data: ${spec.key}` })

    for (const item of items) {
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

export interface InputMap {
  models: ReturnType<typeof makeInput<TransformTypes['models']>>
  endpoints: ReturnType<typeof makeInput<TransformTypes['endpoints']>>
}

// * Main inputs factory - creates InputMap based on config
export function createInputs(ctx: ActionCtx, config: RunConfig) {
  const filter = createIssueFilter()

  const inputs: InputMap = {
    models: makeInput(ctx, { spec: models, config, filter }),
    endpoints: makeInput(ctx, { spec: endpoints, config, filter }),
  }

  return {
    filter,
    inputs,
  }
}
