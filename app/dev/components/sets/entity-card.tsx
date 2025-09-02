import {
  EntityCard,
  EntityCardSkeleton,
  ModelCard,
  ProviderCard,
} from '@/components/shared/entity-card'
import { useModelsList, useProvidersList } from '@/hooks/api'

import { ComponentSection } from '../component-section'

export function EntityCardSet() {
  const models = useModelsList()
  const providers = useProvidersList()

  return (
    <>
      <ComponentSection title="EntityCard">
        <EntityCard displayName="With Icon" slug="openai/gpt-4" iconUrl="/icons/openai.png" />
        <EntityCard displayName="No Icon" slug="anthropic/claude-3" />
        <EntityCard displayName="No ID" slug="" />
        <EntityCard
          displayName="Long Name"
          slug="very-long-provider-slug/model-name-that-might-overflow"
        />
        <EntityCard displayName="Single Letter" slug="x/y" />
        <EntityCard displayName="" slug="" />

        <EntityCard
          displayName="Card With Border"
          slug="anthropic/claude-3.5-sonnet"
          iconUrl="/icons/anthropic.png"
          className="rounded-md border p-2"
        />

        <EntityCardSkeleton className="**:animate-none" />
      </ComponentSection>

      <ComponentSection title="Provider Entity Cards">
        {providers?.slice(0, 36).map((provider) => (
          <EntityCard
            key={provider.slug}
            displayName={provider.name}
            slug={provider.slug}
            iconUrl={provider.icon_url}
          />
        ))}
      </ComponentSection>

      <ComponentSection title="Model Entity Cards">
        {models?.slice(0, 36).map((model) => (
          <EntityCard
            key={model.slug}
            displayName={model.short_name}
            slug={model.slug}
            iconUrl={model.icon_url}
          />
        ))}
      </ComponentSection>
    </>
  )
}

// Export the reusable components
export { ModelCard, ProviderCard }
