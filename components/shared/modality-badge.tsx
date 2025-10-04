import { Doc } from '@/convex/_generated/dataModel'

import { SpriteIconName } from '@/lib/sprite-icons'

import { SpriteIcon } from '../ui/sprite-icon'

function ModalityBadge({ icon, title }: { icon: SpriteIconName; title: string }) {
  return (
    <div className="flex size-7 items-center justify-center" title={title}>
      <SpriteIcon name={icon} className="size-5 text-neutral-300" />
    </div>
  )
}

export function ModalityBadgeSet({ endpoint }: { endpoint: Doc<'or_views_endpoints'> }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {endpoint.model.input_modalities.includes('image') ? (
        <ModalityBadge icon="image-up" title="Image Input" />
      ) : (
        <div className="size-7 shrink-0" />
      )}

      {endpoint.model.input_modalities.includes('file') ? (
        <ModalityBadge icon="file-spreadsheet" title="File Input" />
      ) : (
        <div className="size-7 shrink-0" />
      )}

      {endpoint.model.input_modalities.includes('audio') ? (
        <ModalityBadge icon="audio-lines" title="Audio Input" />
      ) : (
        <div className="size-7 shrink-0" />
      )}

      {endpoint.model.output_modalities.includes('image') ? (
        <ModalityBadge icon="image-down" title="Image Output" />
      ) : (
        <div className="size-7 shrink-0" />
      )}
    </div>
  )
}
