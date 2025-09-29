import { Doc } from '@/convex/_generated/dataModel'

import { SpriteIcon } from '../ui/sprite-icon'

export function ModalityBadgeSet({ endpoint }: { endpoint: Doc<'or_views_endpoints'> }) {
  return (
    <div className="flex items-center gap-1">
      {endpoint.model.input_modalities.includes('image') ? (
        <div className="flex size-7 items-center justify-center" title="Image Input">
          <SpriteIcon name="image-up" className="size-5.5 text-neutral-300" />
        </div>
      ) : (
        <div className="size-7" />
      )}

      {endpoint.model.input_modalities.includes('file') ? (
        <div className="flex size-7 items-center justify-center" title="File Input">
          <SpriteIcon name="file-spreadsheet" className="size-5.5 text-neutral-300" />
        </div>
      ) : (
        <div className="size-7" />
      )}

      {endpoint.model.input_modalities.includes('audio') ? (
        <div className="flex size-7 items-center justify-center" title="Audio Input">
          <SpriteIcon name="audio-lines" className="size-5.5 text-neutral-300" />
        </div>
      ) : (
        <div className="size-7" />
      )}

      {endpoint.model.output_modalities.includes('image') ? (
        <div className="flex size-7 items-center justify-center" title="Image Output">
          <SpriteIcon name="image-down" className="size-5.5 text-neutral-300" />
        </div>
      ) : (
        <div className="size-7" />
      )}
    </div>
  )
}
