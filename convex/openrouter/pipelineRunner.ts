import { isResponseError } from 'up-fetch'

export type PipelineOk<V> = { ok: true; value: V }
export type PipelineErr = { ok: false; error: string }

export type PipelineResult<V> = PipelineOk<V> | PipelineErr

/**
 * Run a map of async pipeline tasks in parallel using Promise.allSettled.
 * Returns a record keyed by task names containing an ok/error result.
 */
export async function runPipelines<T extends Record<string, () => Promise<any>>>(
  tasks: T,
): Promise<{
  [K in keyof T]: PipelineResult<Awaited<ReturnType<T[K]>>>
}> {
  const keys = Object.keys(tasks) as Array<keyof T & string>
  const promises = keys.map((k) => tasks[k]())

  const settled = await Promise.allSettled(promises)

  const results = {} as {
    [K in keyof T]: PipelineResult<Awaited<ReturnType<T[K]>>>
  }

  settled.forEach((s, idx) => {
    const key = keys[idx] as keyof T
    if (s.status === 'fulfilled') {
      results[key] = { ok: true, value: s.value }
    } else {
      results[key] = { ok: false, error: serializeError(s.reason) }
    }
  })

  return results
}

function serializeError(reason: unknown): string {
  if (typeof reason === 'object') {
    if (isResponseError(reason)) {
      return truncate(reason.message || 'HTTP error')
    }

    if (reason instanceof Error) {
      return truncate(reason.message)
    }

    return truncate(JSON.stringify(reason))
  }

  return truncate(String(reason))
}

function truncate(str: string, max = 500): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}
