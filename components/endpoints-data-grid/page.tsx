'use client'

import { useMemo, useState } from 'react'

import { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'
import { attributes } from '@/lib/attributes'

import { DataGrid } from '../data-grid/data-grid'
import { DataGridCard, DataGridCardContent, DataGridCardToolbar } from '../data-grid/data-grid-card'
import { fuzzyFilter } from '../data-grid/data-grid-fuzzy'
import { DataGridTableDndVirtual } from '../data-grid/data-grid-table-dnd'
import { columns } from './columns'
import { Controls } from './controls'
import { useEndpointFilters } from './use-endpoint-filters'

export function EndpointsDataGrid() {
  const endpointsList = useCachedQuery(api.db.or.views.endpoints.all, {}, 'endpoints-all')
  const { globalFilter, sorting, onSortingChange, attributeFilters } = useEndpointFilters()

  const filteredEndpoints = useMemo(() => {
    if (!endpointsList) return []

    return endpointsList.filter((endpoint) => {
      for (const [filterName, mode] of Object.entries(attributeFilters)) {
        let hasAttribute = false

        // Handle modality filters
        if (filterName === 'image_input') {
          hasAttribute = endpoint.model.input_modalities.includes('image')
        } else if (filterName === 'file_input') {
          hasAttribute = endpoint.model.input_modalities.includes('file')
        } else if (filterName === 'audio_input') {
          hasAttribute = endpoint.model.input_modalities.includes('audio')
        } else if (filterName === 'image_output') {
          hasAttribute = endpoint.model.output_modalities.includes('image')
        } else {
          // Handle regular attribute filters
          const attr = attributes[filterName as keyof typeof attributes]
          if (attr) {
            hasAttribute = attr.has(endpoint)
          }
        }

        if (mode === 'include' && !hasAttribute) {
          return false
        }
        if (mode === 'exclude' && hasAttribute) {
          return false
        }
      }

      return true
    })
  }, [endpointsList, attributeFilters])

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string)
        const newIndex = columnOrder.indexOf(over.id as string)
        return arrayMove(columnOrder, oldIndex, newIndex)
      })
    }
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: filteredEndpoints,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    globalFilterFn: 'fuzzy',
    state: {
      globalFilter,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onSortingChange,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row._id,
    manualPagination: true,
  })

  return (
    <DataGrid
      table={table}
      recordCount={table.getFilteredRowModel().rows.length}
      isLoading={!endpointsList}
      loadingMessage="Loading endpoints..."
      emptyMessage="No endpoints found"
      skeletonRows={30}
      tableLayout={{
        headerSticky: true,
        headerBorder: true,
        width: 'fixed',
        cellBorder: true,
        virtualized: true,
        rowHeight: 57,
        overscan: 20,
        columnsDraggable: true,
        columnsResizable: true,
      }}
      tableClassNames={{
        headerRow: 'uppercase font-mono',
        bodyRow:
          'has-aria-[label=disabled]:[&_td_>_*]:opacity-50 has-aria-[label=disabled]:[&_td]:text-foreground/50 has-aria-[label=gone]:[&_td_>_*]:opacity-50 has-aria-[label=gone]:[&_td]:text-foreground/50',
        body: 'font-mono',
      }}
    >
      <DataGridCard>
        <DataGridCardToolbar>
          <Controls />
        </DataGridCardToolbar>

        <DataGridCardContent>
          <DataGridTableDndVirtual handleDragEnd={handleDragEnd} />
        </DataGridCardContent>
      </DataGridCard>
    </DataGrid>
  )
}
