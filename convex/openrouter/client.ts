import { isResponseError, isValidationError, up } from 'up-fetch'
import { z } from 'zod'

export type Result<T = unknown> = { success: true; data: T } | { success: false; error: ErrorInfo }

export type ErrorInfo = {
  type: 'response' | 'validation' | 'api' | 'unknown'
  message: string
  status?: number
  code?: number
  details?: unknown
}

const ErrorResultSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
  }),
})

const DataObjectResultSchema = z
  .object({
    data: z.record(z.string(), z.unknown()),
  })
  .or(ErrorResultSchema)

const DataArrayResultSchema = z
  .object({
    data: z.array(z.unknown()),
  })
  .or(ErrorResultSchema)

export const orFetch = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 2,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
}))

async function fetchDataArray(input: string, params: Record<string, unknown>): Promise<Result<unknown[]>> {
  try {
    const result = await orFetch(input, {
      schema: DataArrayResultSchema,
      params,
    })

    if ('error' in result) {
      return {
        success: false,
        error: {
          type: 'api',
          message: result.error.message,
          code: result.error.code,
        },
      }
    }

    return { success: true, data: result.data }
  } catch (err) {
    return handleError(err)
  }
}

async function fetchDataObject(
  input: string,
  params: Record<string, unknown>,
): Promise<Result<Record<string, unknown>>> {
  try {
    const result = await orFetch(input, {
      schema: DataObjectResultSchema,
      params,
    })

    if ('error' in result) {
      return {
        success: false as const,
        error: {
          type: 'api',
          message: result.error.message,
          code: result.error.code,
        },
      }
    }

    return { success: true, data: result.data }
  } catch (err) {
    return handleError(err)
  }
}

function handleError(error: unknown) {
  if (isValidationError(error)) {
    return {
      success: false as const,
      error: {
        type: 'validation' as const,
        message: error.message,
      },
    }
  }

  if (isResponseError(error)) {
    return {
      success: false as const,
      error: {
        type: 'response' as const,
        message: `${error.response.statusText}: ${error.message}`,
        status: error.status,
        details: error.data,
      },
    }
  }

  return {
    success: false as const,
    error: {
      type: 'unknown' as const,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    },
  }
}

export const openrouter = {
  v1: {
    models: () => fetchDataObject('/api/v1/models', {}),
  },

  frontend: {
    models: () => fetchDataArray('/api/frontend/models', {}),

    allProviders: () => fetchDataArray('/api/frontend/all-providers', {}),

    stats: {
      endpoint: (params: { permaslug: string; variant?: string }) =>
        fetchDataArray('/api/frontend/stats/endpoint', params),

      app: ({ permaslug, variant, limit = 20 }: { permaslug: string; variant?: string; limit?: number }) =>
        fetchDataArray('/api/frontend/stats/app', { permaslug, variant, limit }),

      uptimeRecent: (params: { permaslug: string }) =>
        fetchDataObject('/api/frontend/stats/uptime-recent', params),

      uptimeHourly: (params: { id: string }) => fetchDataObject('/api/frontend/stats/uptime-hourly', params),
    },

    modelAuthor: ({
      authorSlug,
      shouldIncludeStats = true,
      shouldIncludeVariants = false,
    }: {
      authorSlug: string
      shouldIncludeStats?: boolean
      shouldIncludeVariants?: boolean
    }) =>
      fetchDataObject('/api/frontend/model-author', {
        authorSlug,
        shouldIncludeStats,
        shouldIncludeVariants,
      }),

    modelVersions: (params: { permaslug: string; variant?: string }) =>
      fetchDataObject('/api/frontend/models/versions', params),
  },
}
