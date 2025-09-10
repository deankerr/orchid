'use client'

import { parseAsString, useQueryState } from 'nuqs'

import { PageContainer, PageHeader, PageTitle } from '@/components/app-layout/pages'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { BadgeComponents } from './sets/badges'
import { EndpointIdentitySet } from './sets/endpoint-identity'
import { EntityCardSet } from './sets/entity-card'
import { OREntityComboboxSet } from './sets/or-entity-combobox'

type ComponentSet = {
  name: string
  component: React.ComponentType
}

export function ComponentLibrary() {
  const [selectedSet, setSelectedSet] = useQueryState('set', parseAsString.withDefault(''))

  const componentSets: ComponentSet[] = [
    {
      name: 'entity cards',
      component: EntityCardSet,
    },
    {
      name: 'endpoint identity',
      component: EndpointIdentitySet,
    },
    {
      name: 'badges',
      component: BadgeComponents,
    },
    {
      name: 'OREntityCombobox',
      component: OREntityComboboxSet,
    },
  ]

  const currentSet = componentSets.find((set) => set.name === selectedSet) || componentSets[0]
  const CurrentComponent = currentSet.component

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Component Library</PageTitle>
            <p className="text-muted-foreground">
              Build and display custom components for testing and development
            </p>
          </div>

          <Select value={selectedSet} onValueChange={setSelectedSet}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select component set" />
            </SelectTrigger>
            <SelectContent>
              {componentSets.map((set) => (
                <SelectItem key={set.name} value={set.name}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="grid divide-y">
        <CurrentComponent />
      </div>
    </PageContainer>
  )
}
