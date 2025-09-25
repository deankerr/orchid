import { DataGridFrameToolbar } from '../shared/data-grid-frame'

export function EndpointsDataGridControls() {
  // const {
  //   cellBorder,
  //   setCellBorder,
  //   rowBorder,
  //   setRowBorder,
  //   sorting,
  //   setSorting,
  //   globalFilter,
  //   setGlobalFilter,
  //   table,
  // } = useEndpoints()

  // const hasSorting = sorting.length > 0
  // const clearSorting = () => setSorting?.([])

  return (
    <DataGridFrameToolbar>
      {/* <SearchInput
        placeholder="Search models and providers..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter?.(e.target.value)}
        onClear={() => setGlobalFilter?.('')}
        className="w-64"
      /> */}

      {/* 
      <DataGridColumnVisibility
        table={table}
        trigger={
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4" />
            Columns
          </Button>
        }
      />

      {hasSorting && (
        <Button variant="outline" size="sm" onClick={clearSorting}>
          <XIcon className="h-4 w-4" />
          Clear sorting
        </Button>
      )}

      <FeatureFlag flag="dev">
        <Label className="flex items-center gap-2 text-xs">
          Cell Borders
          <Checkbox
            checked={cellBorder}
            onCheckedChange={(checked) => setCellBorder?.(checked === true)}
            title="Toggle cell borders"
          />
        </Label>
        <Label className="flex items-center gap-2 text-xs">
          Row Borders
          <Checkbox
            checked={rowBorder}
            onCheckedChange={(checked) => setRowBorder?.(checked === true)}
            title="Toggle row borders"
          />
        </Label>
      </FeatureFlag> */}
    </DataGridFrameToolbar>
  )
}
