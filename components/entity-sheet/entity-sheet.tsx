'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'

import { ModelSheet } from './model-sheet'
import { ProviderSheet } from './provider-sheet'
import { useEntitySheet } from './use-entity-sheet'

export function EntitySheet() {
  const { entity, close } = useEntitySheet()

  return (
    <Sheet open={entity !== null} onOpenChange={(open) => !open && close()}>
      <SheetContent className="overflow-y-auto">
        {entity?.type === 'model' && <ModelSheet slug={entity.slug} />}
        {entity?.type === 'provider' && <ProviderSheet slug={entity.slug} />}
      </SheetContent>
    </Sheet>
  )
}
