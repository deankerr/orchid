'use client'

import { Button } from '@/components/ui/button'

import { Spinner } from '../ui/spinner'

type PaginatedStatus = 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted'

export function PaginatedLoadButton({
  status,
  ...props
}: { status: PaginatedStatus } & React.ComponentProps<typeof Button>) {
  const isLoading = status === 'LoadingFirstPage' || status === 'LoadingMore'
  const isDisabled = status !== 'CanLoadMore'

  return (
    <Button disabled={isDisabled} variant="outline" {...props}>
      {isLoading ? (
        <>
          <Spinner /> Loading
        </>
      ) : status === 'Exhausted' ? (
        'No more results'
      ) : (
        'Load More'
      )}
    </Button>
  )
}
