'use client'

import { useMemo } from 'react'
import { 
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table'

import type { Doc } from '@/convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { renderCompactChangeByShape } from './change-body-renderers'

type ChangeRow = Doc<'or_changes'>

// TODO: Add real avatar component when available
function EntityAvatar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('w-6 h-6 rounded-sm bg-muted/60 flex items-center justify-center text-xs font-mono', className)}>
      {typeof children === 'string' ? children.slice(0, 2).toUpperCase() : children}
    </div>
  )
}

// TODO: Enhance with proper model/provider data lookup
function EntityNameCell({ 
  entityType: _entityType, 
  displayName, 
  id 
}: { 
  entityType: string; 
  displayName: string; 
  id?: string; 
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <EntityAvatar>{displayName}</EntityAvatar>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm truncate">{displayName}</div>
        {id && <div className="text-xs text-muted-foreground font-mono truncate">{id}</div>}
      </div>
    </div>
  )
}

function ChangeTypeBadge({ changeAction }: { changeAction: ChangeRow['change_action'] }) {
  const variants = {
    create: 'outline',
    update: 'secondary', 
    delete: 'destructive'
  } as const

  return (
    <Badge variant={variants[changeAction]} className="font-mono text-xs">
      {changeAction}
    </Badge>
  )
}


export function ChangesDataGrid({ 
  changes,
  isLoading = false 
}: { 
  changes: ChangeRow[];
  isLoading?: boolean;
}) {
  const columns = useMemo<ColumnDef<ChangeRow>[]>(() => [
    {
      id: 'action',
      header: 'ACTION',
      accessorKey: 'change_action',
      cell: ({ getValue }) => <ChangeTypeBadge changeAction={getValue() as ChangeRow['change_action']} />,
      size: 80, // Fixed small width for the badge
      meta: {
        headerClassName: 'w-20',
        skeleton: <Skeleton className="h-5 w-16" />,
      },
    },

    // TODO: For endpoint changes, we need both model and provider columns
    // This will need to be expanded to handle the endpoint case properly
    {
      id: 'model',
      header: 'MODEL',
      cell: ({ row }) => {
        const change = row.original
        if (change.entity_type === 'endpoint' && change.model_variant_slug) {
          return (
            <EntityNameCell 
              entityType="model"
              displayName={change.model_variant_slug}
              id={change.model_variant_slug}
            />
          )
        }
        if (change.entity_type === 'model') {
          return (
            <EntityNameCell 
              entityType="model" 
              displayName={change.entity_display_name}
              id={change.model_variant_slug}
            />
          )
        }
        return <div className="text-muted-foreground">—</div>
      },
      meta: {
        headerClassName: 'min-w-48',
        skeleton: <Skeleton className="h-10 w-full" />,
      },
    },

    {
      id: 'provider', 
      header: 'PROVIDER',
      cell: ({ row }) => {
        const change = row.original
        if ((change.entity_type === 'endpoint' || change.entity_type === 'provider') && change.provider_id) {
          return (
            <EntityNameCell 
              entityType="provider"
              displayName={change.provider_id}
              id={change.provider_id}
            />
          )
        }
        return <div className="text-muted-foreground">—</div>
      },
      meta: {
        headerClassName: 'min-w-48',
        skeleton: <Skeleton className="h-10 w-full" />,
      },
    },

    {
      id: 'details',
      header: 'CHANGE DETAILS',
      cell: ({ row }) => {
        const change = row.original
        
        if (change.change_action === 'create') {
          return (
            <div className="text-xs text-success font-mono">
              Entity created
            </div>
          )
        }
        
        if (change.change_action === 'delete') {
          return (
            <div className="text-xs text-destructive font-mono">
              Entity deleted  
            </div>
          )
        }
        
        if (change.change_action === 'update') {
          const changeContent = renderCompactChangeByShape(change.change_body)
          const isNestedChange = change.change_body && typeof change.change_body === 'object' && 'changes' in change.change_body && !('embeddedKey' in change.change_body)
          
          return (
            <div className="space-y-1">
              {change.change_root_key && isNestedChange && (
                <div className="text-xs font-mono text-muted-foreground">
                  {change.change_root_key}:
                </div>
              )}
              {changeContent}
            </div>
          )
        }
        
        return <div className="text-muted-foreground">—</div>
      },
      size: 99999, // Allow this column to grow
      meta: {
        headerClassName: 'min-w-48',
        skeleton: <Skeleton className="h-5 w-32" />,
      },
    },

    // TODO: Add timestamp/date column
    // TODO: Implement detailed change body rendering with proper handling of varying shapes
    // TODO: Add expand/collapse functionality for detailed change view
    // TODO: Consider adding a summary view that shows key changes at a glance
    
  ], [])

  const table = useReactTable({
    data: changes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataGridContainer className="overflow-auto">
      <DataGrid 
        table={table} 
        recordCount={changes.length}
        isLoading={isLoading}
        loadingMessage="Loading changes..."
        emptyMessage="No changes found"
        tableLayout={{
          headerSticky: true,
          rowBorder: true,
          headerBackground: true,
          headerBorder: true,
          width: 'auto', // Allow table to size columns naturally
        }}
      >
        <DataGridTable />
      </DataGrid>
    </DataGridContainer>
  )
}