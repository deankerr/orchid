'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  Table,
} from '@tanstack/react-table'

import { useReactTable } from '@/hooks/use-react-table'

import { DataGrid, DataGridContainer } from '../data-grid/data-grid'
import { DataGridTable, DataGridTableV } from '../data-grid/data-grid-table'
import { useEndpointsColumns, type EndpointRow } from './columns'

interface EndpointsContextValue {
  recordCount: number
  isLoading: boolean
  cellBorder: boolean
  setCellBorder?: (value: boolean) => void
  rowBorder: boolean
  setRowBorder?: (value: boolean) => void
  sorting: SortingState
  setSorting?: (value: SortingState | ((prev: SortingState) => SortingState)) => void
  globalFilter: string
  setGlobalFilter?: (value: string) => void
  table: Table<EndpointRow>
}

const EndpointsContext = createContext<EndpointsContextValue | null>(null)

export function useEndpoints() {
  const context = useContext(EndpointsContext)
  if (!context) {
    throw new Error('useEndpoints must be used within EndpointsProvider')
  }
  return context
}

export function EndpointsDataGridLite({
  data,
  children,
}: {
  data: EndpointRow[] | undefined
  children: ReactNode
}) {
  'use no memo'

  const isLoading = data === undefined

  const columns = useEndpointsColumns()
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true, // prevents error from state update during initial render
  })

  return (
    <DataGrid
      table={table}
      recordCount={data?.length ?? 0}
      isLoading={isLoading}
      loadingMessage="Loading endpoints..."
      emptyMessage="No endpoints found"
      skeletonRows={20}
      tableLayout={{
        headerSticky: true,
        width: 'fixed',
        virtualRowHeight: 60,
        virtualOverscan: 10,
      }}
      tableClassNames={{
        headerRow: 'uppercase font-mono text-[12px]',
      }}
    >
      {children}
    </DataGrid>
  )
}

// export function EndpointsDataGrid({
//   data,
//   children,
// }: {
//   data: EndpointRow[] | undefined
//   children: ReactNode
// }) {
//   const [cellBorder, setCellBorder] = useState(false)
//   const [rowBorder, setRowBorder] = useState(true)
//   const [sorting, setSorting] = useState<SortingState>([])
//   const [globalFilter, setGlobalFilter] = useState('')

//   const isLoading = data === undefined

//   const columns = useEndpointsColumns()
//   const table = useReactTable({
//     data: data ?? [],
//     columns,
//     state: {
//       sorting,
//       globalFilter,
//     },
//     onSortingChange: setSorting,
//     onGlobalFilterChange: setGlobalFilter,
//     globalFilterFn: (row, _columnId, filterValue: string) => {
//       const searchValue = filterValue.toLowerCase()
//       const modelName = row.original.model.name.toLowerCase()
//       const providerName = row.original.provider.name.toLowerCase()

//       return modelName.includes(searchValue) || providerName.includes(searchValue)
//     },
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     manualPagination: true, // prevents error from state update during initial render
//   })

//   return (
//     <EndpointsContext.Provider
//       value={{
//         recordCount: table.getFilteredRowModel().rows.length,
//         isLoading,
//         cellBorder,
//         setCellBorder,
//         rowBorder,
//         setRowBorder,
//         sorting,
//         setSorting,
//         globalFilter,
//         setGlobalFilter,
//         table,
//       }}
//     >
//       <DataGrid
//         table={table}
//         recordCount={table.getFilteredRowModel().rows.length}
//         isLoading={isLoading}
//         loadingMessage="Loading endpoints..."
//         emptyMessage="No endpoints found"
//         skeletonRows={20}
//         tableLayout={{
//           headerSticky: true,
//           width: 'fixed',
//           cellBorder,
//           rowBorder,
//           virtualRowHeight: 60,
//           virtualOverscan: 10,
//         }}
//         tableClassNames={{
//           headerRow: 'uppercase font-mono text-[12px]',
//         }}
//       >
//         {children}
//       </DataGrid>
//     </EndpointsContext.Provider>
//   )
// }

export function EndpointsDataGridTable() {
  return (
    <DataGridContainer className="flex-1 overflow-hidden border-x-0">
      <DataGridTable />
    </DataGridContainer>
  )
}
