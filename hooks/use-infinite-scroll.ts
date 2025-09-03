import { useCallback, useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number
  hasMore?: boolean
  isLoading?: boolean
}

export function useInfiniteScroll(onLoadMore: () => void, options: UseInfiniteScrollOptions = {}) {
  const { threshold = 400, hasMore = true, isLoading = false } = options
  const scrollElementRef = useRef<HTMLDivElement | null>(null)

  const handleScroll = useCallback(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement || isLoading || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = scrollElement
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    if (distanceFromBottom <= threshold) {
      onLoadMore()
    }
  }, [onLoadMore, threshold, isLoading, hasMore])

  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return scrollElementRef
}
