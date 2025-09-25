import { useReactTable as useReactTableOriginal, type TableOptions } from '@tanstack/react-table'

// disable react compiler
export function useReactTable<TData extends Record<string, unknown>>(options: TableOptions<TData>) {
  'use no memo'
  return useReactTableOriginal(options)
}
