'use client'

import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'

interface FilterCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function FilterCheckbox({ label, checked, onChange }: FilterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={label}
        checked={checked}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <Label htmlFor={label} className="cursor-pointer text-sm font-normal">
        {label}
      </Label>
    </div>
  )
}
