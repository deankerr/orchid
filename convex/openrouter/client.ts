import { up, isResponseError, isValidationError } from 'up-fetch'
import { z } from 'zod'

export type Result = { success: true; data: unknown } | { success: false; error: ErrorInfo }

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

const DataResultSchema = z.object({
  data: z.unknown(),
})

const safeRequest = async (
  input: string,
  options?: { params?: Record<string, unknown> },
): Promise<Result> => {
  try {
    const client = up(fetch, () => ({
      ...options,
      baseUrl: 'https://openrouter.ai',
      retry: {
        attempts: 3,
        delay: (ctx) => ctx.attempt ** 2 * 1000,
      },
    }))

    const result = await client(input, { schema: DataResultSchema.or(ErrorResultSchema) })
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
  } catch (error) {
    if (isValidationError(error)) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: 'Received invalid response format (likely HTML error page)',
        },
      }
    }

    if (isResponseError(error)) {
      return {
        success: false,
        error: {
          type: 'response',
          message: `${error.response.statusText}: ${error.message}`,
          status: error.status,
          details: error.data,
        },
      }
    }

    return {
      success: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error,
      },
    }
  }
}

export const openrouter = {
  v1: {
    models: () => safeRequest('/api/v1/models'),
  },

  frontend: {
    models: () => safeRequest('/api/frontend/models'),

    allProviders: () => safeRequest('/api/frontend/all-providers'),

    stats: {
      endpoint: (params: { permaslug: string; variant?: string }) =>
        safeRequest('/api/frontend/stats/endpoint', { params }),

      app: (params: { permaslug: string; variant: string; limit?: number }) =>
        safeRequest('/api/frontend/stats/app', { params }),

      uptimeRecent: (params: { permaslug: string }) =>
        safeRequest('/api/frontend/stats/uptime-recent', { params }),

      uptimeHourly: (params: { id: string }) => safeRequest('/api/frontend/stats/uptime-hourly', { params }),
    },

    modelAuthor: (params: {
      authorSlug: string
      shouldIncludeStats?: boolean
      shouldIncludeVariants?: boolean
    }) => safeRequest('/api/frontend/model-author', { params }),

    modelVersions: (params: { permaslug: string; variant?: string }) =>
      safeRequest('/api/frontend/models/versions', { params }),
  },

  custom: (path: string, options?: { params?: Record<string, unknown> }) => safeRequest(path, options),
}
