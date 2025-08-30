'use client'

import { useState } from 'react'

import { usePaginatedQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

import { ChangesDataGrid } from '@/components/changes-data-grid/changes-data-grid'
import { PageContainer, PageHeader, PageTitle } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useModelsList, useProvidersList } from '@/hooks/api'

import { FeatureFlag } from '../dev-utils/feature-flag'

const ITEMS_PER_PAGE = 40
const INITIAL_NUM_ITEMS = 20

type EntityType = 'all' | 'model' | 'endpoint' | 'provider'
type ChangeAction = 'all' | 'create' | 'update' | 'delete'

export function ChangesDataGridPage() {
  const [entityType, setEntityType] = useState<EntityType>('all') // Show all changes to see record changes
  const [changeAction, setChangeAction] = useState<ChangeAction>('all')
  const [forceLoading, setForceLoading] = useState(false)

  const { results, status, loadMore } = usePaginatedQuery(
    api.views.changes.list,
    {
      entity_type: entityType === 'all' ? undefined : entityType,
      change_action: changeAction === 'all' ? undefined : changeAction,
      include_hidden: false, // End-users always see only displayable changes
    },
    { initialNumItems: INITIAL_NUM_ITEMS },
  )

  const models = useModelsList()
  const providers = useProvidersList()
  const isInitialLoad = status === 'LoadingFirstPage' || !models || !providers || forceLoading

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
          <div>
            <Label htmlFor="change-action" className="text-sm font-medium">
              Filter by Action
            </Label>
            <Select
              value={changeAction}
              onValueChange={(value) => setChangeAction(value as ChangeAction)}
            >
              <SelectTrigger id="change-action" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FeatureFlag flag="dev">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="force-loading"
                checked={forceLoading}
                onCheckedChange={(value) => setForceLoading(value === true)}
              />
              <Label htmlFor="force-loading" className="text-sm font-medium">
                Force Loading
              </Label>
            </div>
          </FeatureFlag>
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
