import type { PaginatedQueryItem } from 'convex/react'
import * as R from 'remeda'

import { formatISO9075 } from 'date-fns'
import type { IChange } from 'json-diff-ts'
import { ChevronRight, MinusIcon, PlusIcon } from 'lucide-react'

import type { api } from '@/convex/_generated/api'

import { NumericValue, RawPricingProperty } from '../shared/numeric-value'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

type ChangeDoc = PaginatedQueryItem<typeof api.views.endpoints.listChanges>

export function EndpointsChangesGrid({ changes }: { changes: ChangeDoc[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Endpoints</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden px-0">
        <div className="grid min-w-0 overflow-x-auto px-3">
          {changes.map((change) => (
            <EndpointChangeRow key={change._id} change={change} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function EndpointChangeRow({ change }: { change: ChangeDoc }) {
  const [provider_name, model_slug] = change.entity_name.split(' | ')

  return (
    <div className="flex gap-2 py-6 text-sm">
      <div className="flex flex-col justify-center gap-1">
        <div className="text-center font-mono text-xs">
          {formatISO9075(Number(change.crawl_id), { representation: 'date' })}
        </div>

        <Badge className="w-full font-mono text-base uppercase" variant="secondary">
          {change.event_type}
        </Badge>
      </div>

      <div className="grid min-h-16 grow border px-2">
        <div className="self-end text-center font-mono text-sm text-muted-foreground">
          {model_slug}
        </div>
        <div className="text-center text-base font-medium">{provider_name}</div>
      </div>

      {change.event_type === 'update' && <ChangeEntry raw={change.change_raw as IChangeS} />}
    </div>
  )
}

type IChangeS = Omit<IChange, 'type' | 'changes'> & {
  type: 'ADD' | 'UPDATE' | 'REMOVE'
  changes: IChangeS[]
}

function ChangeEntry({ raw }: { raw: IChangeS }) {
  const changes = 'changes' in raw ? raw.changes : [raw]
  const isArrayValues = 'embeddedKey' in raw

  function renderValue(key: string, value: any) {
    if (R.isNullish(value)) {
      return <div className="text-muted-foreground">null</div>
    }
    if (raw.key === 'pricing') {
      return <RawPricingProperty rawKey={key} value={value} className="contents" />
    }

    if (key.includes('context')) {
      return <NumericValue value={value} unit="TOK" className="contents" />
    }

    if (typeof value === 'number') {
      return <NumericValue value={value} className="contents" />
    }
    return String(value)
  }

  if (isArrayValues) {
    return (
      <div className="ml-auto flex items-center border font-mono [&>div]:py-3">
        <div className="w-56 border-r px-4 text-right">{raw.key}</div>
        <div className="flex w-56 flex-wrap items-center justify-end gap-2 px-2">
          {changes.map((change, i) => (
            <Badge key={i} variant={change.type === 'REMOVE' ? 'destructive' : 'default'}>
              {change.type === 'ADD' && <PlusIcon />}
              {change.type === 'REMOVE' && <MinusIcon />}
              {change.value}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="ml-auto flex flex-col divide-y border font-mono">
      {changes.map((change, i) => (
        <div key={i} className="flex grow items-center justify-end tabular-nums [&>div]:py-3">
          <div className="w-56 truncate border-r px-4 text-right">{change.key}</div>
          <div className="w-32 text-center">{renderValue(change.key, change.oldValue)}</div>
          <ChevronRight className="w-5 text-muted-foreground" />
          <div className="w-32 truncate text-center">{renderValue(change.key, change.value)}</div>
        </div>
      ))}
    </div>
  )
}
