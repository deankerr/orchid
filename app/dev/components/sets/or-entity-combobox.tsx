'use client'

import { useState } from 'react'

import { OREntityCombobox } from '@/components/endpoints-data-grid/or-entity-combobox'

import { ComponentSection } from '../component-section'

export function OREntityComboboxSet() {
  const [selected, setSelected] = useState('')
  return (
    <>
      <ComponentSection
        title="OREntityCombobox"
        className="flex-col items-center justify-center gap-4 md:flex"
      >
        <OREntityCombobox value={selected} onValueChange={setSelected} />

        <div className="font-mono text-sm">Selected: {selected}</div>
      </ComponentSection>
    </>
  )
}
