import * as R from 'remeda'

import { calculatePercentageChange } from '@/lib/utils'

import { BasicValueUpdate } from './basic-value-update'
import { BlockValueUpdate } from './block-value-update'
import { AddIndicator, ChangeItemValue, RemoveIndicator } from './change-indicators'
import { ChangeKey } from './change-key'
import { NumericValueUpdate } from './numeric-value-update'

export function ChangeItem({
  keyName,
  parentKeyName,
  fromValue,
  toValue,
}: {
  keyName: string
  parentKeyName?: string
  fromValue: unknown
  toValue: unknown
}) {
  const isCreate = !R.isDefined(fromValue) && R.isDefined(toValue)
  const isDelete = R.isDefined(fromValue) && !R.isDefined(toValue)

  if (isCreate || isDelete) {
    return (
      <div className="grid grid-cols-[144px_1fr] items-center gap-4">
        <div className="flex items-center gap-2">
          {isCreate ? <AddIndicator className="-ml-4" /> : <RemoveIndicator className="-ml-4" />}
          <ChangeKey>{keyName}</ChangeKey>
        </div>

        <div className="flex items-center">
          <ChangeItemValue value={toValue} keyName={keyName} parentKeyName={parentKeyName} />
        </div>
      </div>
    )
  }

  const percentageChange = calculatePercentageChange(fromValue, toValue)
  const isBlockChange = isTextValue(fromValue) || isTextValue(toValue)
  const isNumericChange = !isBlockChange && (isNumericish(fromValue) || isNumericish(toValue))

  if (isBlockChange) {
    return (
      <BlockValueUpdate
        keyName={keyName}
        fromValue={fromValue}
        toValue={toValue}
        parentKeyName={parentKeyName}
      />
    )
  }

  if (isNumericChange) {
    return (
      <NumericValueUpdate
        keyName={keyName}
        fromValue={fromValue}
        toValue={toValue}
        percentageChange={percentageChange}
        parentKeyName={parentKeyName}
      />
    )
  }

  return (
    <BasicValueUpdate
      keyName={keyName}
      fromValue={fromValue}
      toValue={toValue}
      parentKeyName={parentKeyName}
    />
  )
}

function isTextValue(value: unknown) {
  return R.isString(value) && (value.includes(' ') || value.length > 20)
}

function isNumericish(value: unknown) {
  return R.isNumber(value) || (R.isString(value) && !isNaN(Number(value)))
}
