import { formatISO9075 } from 'date-fns'
import { ChevronRight, DotIcon, MinusIcon, PlusIcon } from 'lucide-react'

import type { Doc } from '@/convex/_generated/dataModel'
import type { ChangeBody } from '@/convex/db/or/changes'

import { RawPricingProperty } from '@/components/shared/numeric-value'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function ChangeCard({ change }: { change: Doc<'or_changes'> }) {
  const { crawl_id, change_action, change_body, entity_type, model_variant_slug, provider_id } =
    change

  return (
    <div className="relative min-w-0 space-y-3 bg-card/50 px-4 py-5 text-card-foreground">
      <div className="flex flex-col-reverse justify-between gap-x-2 gap-y-1.5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-sm">
          {entity_type === 'model' && (
            <EntityChangePill
              entityName="model"
              className="text-sm"
              plus={change_action === 'create'}
              minus={change_action === 'delete'}
            >
              {model_variant_slug}
            </EntityChangePill>
          )}

          {entity_type === 'provider' && (
            <EntityChangePill
              entityName="provider"
              className="text-sm"
              plus={change_action === 'create'}
              minus={change_action === 'delete'}
            >
              {provider_id}
            </EntityChangePill>
          )}

          {entity_type === 'endpoint' && (
            <>
              <EntityChangePill entityName="model" className="text-sm">
                {model_variant_slug}
              </EntityChangePill>

              <EntityChangePill
                entityName="provider"
                className="text-sm"
                plus={change_action === 'create'}
                minus={change_action === 'delete'}
              >
                {provider_id}
              </EntityChangePill>
            </>
          )}
        </div>

        <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
          {formatISO9075(Number(crawl_id), { representation: 'date' })}
        </div>
      </div>

      {change_action === 'update' && (
        <div className="font-mono text-sm">
          <ChangeBody change_body={change_body as ChangeBody} />
        </div>
      )}
    </div>
  )
}

function ChangeBody({
  change_body,
  parentKey = '',
}: {
  change_body: ChangeBody
  parentKey?: string
}) {
  const { changes, embeddedKey, key, type, oldValue, value } = change_body
  const currentPath = parentKey ? `${parentKey}.${key}` : key

  if (changes === undefined) {
    return (
      <ValueChangeItem
        changeKey={key}
        changeType={type}
        oldValue={oldValue}
        value={value}
        parentKey={parentKey}
      />
    )
  }

  if (embeddedKey) {
    const values = changes.map((c) => ({
      type: c.type as 'ADD' | 'REMOVE',
      value: String(c.value),
    }))
    return <ArrayChangeItem changeKey={key} values={values} />
  }

  return (
    <div className="space-y-2">
      {changes.map((c) => (
        <div key={c.key} className="">
          <ChangeBody change_body={c} parentKey={currentPath} />
        </div>
      ))}
    </div>
  )
}

function ArrayChangeItem({
  changeKey,
  values,
}: {
  changeKey: string
  values: Array<{ type: 'ADD' | 'REMOVE'; value: string }>
}) {
  return (
    <div className="grid gap-2 sm:flex">
      <ChangeKey>{changeKey}</ChangeKey>
      <div className="flex flex-wrap gap-2 py-1">
        {values.map((item, i) => (
          <ChangeBadge key={i} plus={item.type === 'ADD'} minus={item.type === 'REMOVE'}>
            {item.value}
          </ChangeBadge>
        ))}
      </div>
    </div>
  )
}

function ValueChangeItem({
  changeKey,
  changeType,
  oldValue,
  value,
  parentKey,
}: {
  changeKey: string
  changeType: 'ADD' | 'UPDATE' | 'REMOVE'
  oldValue: any
  value: any
  parentKey: string
}) {
  const [fromValue, toValue] = changeType === 'REMOVE' ? [value, oldValue] : [oldValue, value]
  const isPricing = parentKey === 'pricing'

  const renderChangeValue = (val: any) => {
    if (isPricing && val) {
      return <RawPricingProperty rawKey={changeKey} value={val} className="text-center" />
    }
    if (val === null) {
      return <span className="text-muted-foreground">null</span>
    }

    if (val === undefined) {
      return <span className="text-muted-foreground/80">undefined</span>
    }

    if (val === '') {
      return <span className="text-muted-foreground/80">empty</span>
    }

    if (typeof val === 'object') {
      return (
        <div className="text-xs leading-relaxed break-words">{JSON.stringify(val, null, 2)}</div>
      )
    }

    if (typeof val === 'number') {
      return <span className="">{val.toLocaleString()}</span>
    }

    // Handle long strings with better wrapping
    const stringValue = String(val)
    if (stringValue.length > 50) {
      return (
        <div className="text-left leading-relaxed break-words whitespace-pre-wrap">
          {stringValue}
        </div>
      )
    }

    return stringValue
  }

  // Determine if content is large enough to warrant stacking
  const isLargeContent = (val: any) => {
    if (typeof val === 'string' && val.length > 16) return true
    if (typeof val === 'object' && val !== null) return true
    return false
  }

  const shouldStack = isLargeContent(fromValue) || isLargeContent(toValue)

  return (
    <div
      className={cn(
        'flex gap-2',
        shouldStack ? 'flex-col sm:flex-row sm:items-center' : 'items-center',
      )}
    >
      <ChangeKey>{changeKey}</ChangeKey>
      <div
        className={cn(
          'flex min-w-0 flex-1 gap-2',
          shouldStack ? 'flex-col sm:flex-row sm:items-center' : 'items-center',
        )}
      >
        <ChangeValue>{renderChangeValue(fromValue)}</ChangeValue>
        <ChevronRight
          className={cn(
            'w-5 flex-shrink-0 text-muted-foreground',
            shouldStack && 'rotate-90 self-center sm:rotate-0',
          )}
        />
        <ChangeValue>{renderChangeValue(toValue)}</ChangeValue>
      </div>
    </div>
  )
}

function ChangeKey({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'min-w-32 rounded-sm border border-transparent bg-secondary/80 px-2 py-1.5 text-right font-medium break-words text-secondary-foreground sm:w-56',
        className,
      )}
      {...props}
    />
  )
}

function ChangeValue({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'min-w-0 flex-1 self-stretch overflow-hidden rounded-sm border px-2.5 py-1.5 text-center',
        className,
      )}
      {...props}
    />
  )
}

function ChangeBadge({
  variant = 'outline',
  plus,
  minus,
  children,
  ...props
}: { plus?: boolean; minus?: boolean } & React.ComponentProps<typeof Badge>) {
  return (
    <Badge variant={variant} {...props}>
      {plus ? (
        <PlusIcon className="text-success" />
      ) : minus ? (
        <MinusIcon className="text-destructive" />
      ) : (
        <DotIcon className="text-muted-foreground" />
      )}
      {children}
    </Badge>
  )
}

function EntityChangePill({
  entityName,
  children,
  className,
  ...props
}: { entityName: string } & React.ComponentProps<typeof ChangeBadge>) {
  return (
    <ChangeBadge className={cn('rounded-none', className)} {...props}>
      <span className="text-muted-foreground uppercase">{entityName}</span>
      <div className="mx-1 -my-1 h-6">
        <Separator orientation="vertical" />
      </div>
      {children}
    </ChangeBadge>
  )
}
