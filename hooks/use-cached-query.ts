import { useEffect, useRef } from 'react'

import { useQuery } from 'convex-helpers/react/cache/hooks'
import type { OptionalRestArgsOrSkip } from 'convex/react'
import type { FunctionReference, FunctionReturnType } from 'convex/server'

function useQueryTimer<T>(result: T, label?: string): T {
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!label) return

    if (result === undefined && startTimeRef.current === null) {
      startTimeRef.current = performance.now()
    } else if (result !== undefined && startTimeRef.current !== null) {
      const currentTime = new Date().toTimeString().slice(0, 8)
      const timing = `${(performance.now() - startTimeRef.current).toFixed(0)}ms`
      const count = Array.isArray(result) ? `(${result.length})` : typeof result

      console.groupCollapsed(
        `%c${currentTime} %c${label} %c${timing}${count ? ` %c${count}` : ''}`,
        'color: #AAA; font-weight: normal',
        '',
        'color: #0ea5e9; font-weight: bold',
        'color: #10b981; font-weight: bold',
      )
      console.log(result)
      console.groupEnd()
      startTimeRef.current = null
    }
  }, [result, label])

  return result
}

export function useCachedQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: OptionalRestArgsOrSkip<Query>[0],
  label?: string,
): FunctionReturnType<Query> | undefined {
  const result = useQuery(query, args)
  return useQueryTimer(result, label)
}
