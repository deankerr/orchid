import { DataGridFrameFooter } from '../shared/data-grid-frame'

export function EndpointsDataGridFooter({ children, ...props }: React.ComponentProps<'div'>) {
  const recordCount = '?'
  return (
    <DataGridFrameFooter {...props}>
      <div className="justify-self-start">{children}</div>

      <div className="flex items-center gap-1 text-xs"></div>

      <div className="justify-self-end font-mono text-xs">{recordCount} items loaded</div>
    </DataGridFrameFooter>
  )
}
