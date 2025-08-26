'use client'

import { useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

import { PageContainer, PageHeader, PageTitle } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ChangeCard } from './change-card'

const ITEMS_PER_PAGE = 50

type EntityType = 'all' | 'model' | 'endpoint' | 'provider'

export function ChangesListPage() {
  const [entityType, setEntityType] = useState<EntityType>('all')

  const { results, status, loadMore } = usePaginatedQuery(
    api.views.changes.list,
    {
      entity_type: entityType === 'all' ? undefined : entityType,
      include_hidden: false, // End-users always see only displayable changes
    },
    { initialNumItems: ITEMS_PER_PAGE },
  )

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Changes</PageTitle>
        <p className="text-muted-foreground">View changes detected between OpenRouter snapshots</p>
      </PageHeader>

      <div className="space-y-4">
        <div className="flex items-end gap-4">
          <div>
            <Label htmlFor="entity-type" className="text-sm font-medium">
              Filter by Type
            </Label>
            <Select
              value={entityType}
              onValueChange={(value) => setEntityType(value as EntityType)}
            >
              <SelectTrigger id="entity-type" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="model">Models</SelectItem>
                <SelectItem value="endpoint">Endpoints</SelectItem>
                <SelectItem value="provider">Providers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {status === 'LoadingFirstPage' ? (
          <div className="p-4">Loading changes...</div>
        ) : !results || results.length === 0 ? (
          <div className="p-4 text-muted-foreground">
            No changes found for {entityType === 'all' ? 'any type' : entityType}
          </div>
        ) : (
          <>
            <div className="grid divide-y divide-border/20 border">
              {results.map((change) => (
                <ChangeCard key={`${change._id}`} change={change} />
              ))}
            </div>

            {status === 'CanLoadMore' && (
              <Button onClick={() => loadMore(ITEMS_PER_PAGE)} variant="outline" className="w-full">
                Load More
              </Button>
            )}

            {status === 'LoadingMore' && (
              <div className="p-4 text-center text-muted-foreground">Loading more changes...</div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  )
}
