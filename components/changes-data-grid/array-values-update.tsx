import { Badge } from '../ui/badge'
import { AddIndicator, RemoveIndicator } from './change-indicators'
import { ChangeKey } from './change-key'

export function ArrayValuesUpdate({
  keyName,
  changes,
}: {
  keyName: string
  changes: { type: 'ADD' | 'REMOVE'; value: string }[]
}) {
  return (
    <div className="grid grid-cols-[144px_1fr] items-center gap-3">
      <ChangeKey>{keyName}</ChangeKey>
      <div className="flex flex-wrap gap-2">
        {changes.map((change, idx) => (
          <Badge key={idx} variant="outline">
            {change.type === 'ADD' ? <AddIndicator /> : <RemoveIndicator />}
            {typeof change.value === 'string' ? change.value : JSON.stringify(change.value)}
          </Badge>
        ))}
      </div>
    </div>
  )
}
