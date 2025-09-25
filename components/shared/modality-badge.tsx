import { Doc } from '@/convex/_generated/dataModel'

import { AttributeBadge } from './attribute-badge'

export function ModalityBadgeSet({ endpoint }: { endpoint: Doc<'or_views_endpoints'> }) {
  return (
    <div className="flex gap-1">
      <AttributeBadge
        icon="image-up"
        name="Input Modality"
        details="Image"
        color="slate"
        variant="soft"
        disabled={!endpoint.model.input_modalities.includes('image')}
      />

      <AttributeBadge
        icon="file-chart-column-increasing"
        name="Input Modality"
        details="File"
        color="slate"
        variant="soft"
        disabled={!endpoint.model.input_modalities.includes('file')}
      />

      <AttributeBadge
        icon="audio-lines"
        name="Input Modality"
        details="Audio"
        color="slate"
        variant="soft"
        disabled={!endpoint.model.input_modalities.includes('audio')}
      />

      <AttributeBadge
        icon="image-down"
        name="Output Modality"
        details="Image"
        color="slate"
        variant="soft"
        disabled={!endpoint.model.output_modalities.includes('image')}
      />
    </div>
  )
}
