'use client'

import { useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

import { ChangesDataGrid } from '@/components/changes-data-grid'
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
import { useModelsList, useProvidersList } from '@/hooks/api'

const ITEMS_PER_PAGE = 40

type EntityType = 'all' | 'model' | 'endpoint' | 'provider'

export function ChangesGridPage({
  searchParams: _searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [entityType, setEntityType] = useState<EntityType>('all') // Show all changes to see record changes

  const { results, status, loadMore } = usePaginatedQuery(
    api.views.changes.list,
    {
      entity_type: entityType === 'all' ? undefined : entityType,
      include_hidden: false, // End-users always see only displayable changes
    },
    { initialNumItems: ITEMS_PER_PAGE },
  )

  const models = useModelsList()
  const providers = useProvidersList()
  const isInitialLoad = status === 'LoadingFirstPage' || !models || !providers

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Changes Grid (Experimental)</PageTitle>
        <p className="text-muted-foreground">
          Experimental data grid interface for viewing changes between OpenRouter snapshots
        </p>
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

        <ChangesDataGrid changes={results || []} isLoading={isInitialLoad} />

        {status === 'CanLoadMore' && (
          <Button onClick={() => loadMore(ITEMS_PER_PAGE)} variant="outline" className="w-full">
            Load More
          </Button>
        )}

        {status === 'LoadingMore' && (
          <div className="p-4 text-center text-muted-foreground">Loading more changes...</div>
        )}

        {/* TODO: Add filtering capabilities */}
        {/* TODO: Add sorting by date/type */}
      </div>
    </PageContainer>
  )
}
