'use client'

import type { Table } from '@tanstack/react-table'
import { Columns3CogIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Endpoint } from '@/hooks/api'

interface ColumnVisibilityMenuProps {
  table: Table<Endpoint>
}

export function ColumnVisibilityMenu({ table }: ColumnVisibilityMenuProps) {
  const hidableColumns = table.getAllColumns().filter((column) => column.getCanHide())
  const visibleColumns = hidableColumns.filter((column) => column.getIsVisible())
  const allColumnsVisible = visibleColumns.length === hidableColumns.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-none font-mono text-xs">
          <Columns3CogIcon />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem
          className="font-mono text-xs"
          onClick={() => table.toggleAllColumnsVisible(!allColumnsVisible)}
        >
          {allColumnsVisible ? 'Hide All' : 'Show All'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {hidableColumns.map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="font-mono text-xs uppercase"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.id.replace(/_/g, ' ')}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
