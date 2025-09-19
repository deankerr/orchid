'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { DataGrid, DataGridContainer } from '../ui/data-grid'
import { DataGridTable } from '../ui/data-grid-table'
import { useEndpointsColumns, type EndpointRow } from './columns'

interface EndpointsProviderProps {
  data: EndpointRow[] | undefined
  children: ReactNode
}

interface EndpointsContextValue {
  recordCount: number
  isLoading: boolean
  cellBorder: boolean
  setCellBorder?: (value: boolean) => void
}

const EndpointsContext = createContext<EndpointsContextValue | null>(null)

export function useEndpoints() {
  const context = useContext(EndpointsContext)
  if (!context) {
    throw new Error('useEndpoints must be used within EndpointsProvider')
  }
  return context
}

export function EndpointsProvider({ data, children }: EndpointsProviderProps) {
  const [cellBorder, setCellBorder] = useState(false)

  const isLoading = data === undefined
  const safeData = data || []

  const columns = useEndpointsColumns()
  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      cellBorder,
    },
  })

  return (
    <EndpointsContext.Provider
      value={{
        recordCount: safeData.length,
        isLoading,
        cellBorder,
        setCellBorder,
      }}
    >
      <DataGrid
        table={table}
        recordCount={safeData.length}
        isLoading={isLoading}
        loadingMessage="Loading endpoints..."
        emptyMessage="No endpoints found"
        skeletonRows={20}
        tableLayout={{
          headerSticky: true,
          width: 'fixed',
          cellBorder,
        }}
        tableClassNames={{
          headerRow: 'font-mono uppercase text-[85%]',
        }}
      >
        {children}
      </DataGrid>
    </EndpointsContext.Provider>
  )
}

export function EndpointsTable() {
  return (
    <DataGridContainer className="flex-1 items-start overflow-x-auto overscroll-none rounded-none border-x-0">
      <DataGridTable />
    </DataGridContainer>
  )
}
