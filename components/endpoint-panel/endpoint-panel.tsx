import type { Endpoint } from '@/hooks/api'

import { ModelVariantBadge } from '../shared/model-variant-badge'
import { ProviderLogoTitle } from './provider-logo-title'
import { CapabilitiesSection } from './sections/capabilities-section'
import { DataPolicySection } from './sections/data-policy-section'
import { LimitsSection } from './sections/limits-section'
import { MetricsSection } from './sections/metrics-section'
import { ParametersSection } from './sections/parameters-section'
import { PricingSection } from './sections/pricing-section'

export function EndpointPanel({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="space-y-6 font-mono">
      <div className="flex items-center gap-2 border-b pb-1.5 font-sans">
        <ProviderLogoTitle slug={endpoint.provider_slug} name={endpoint.provider_name} />
        <ModelVariantBadge modelVariant={endpoint.model_variant} />
      </div>

      <div className="-mt-3 space-y-3">
        <MetricsSection endpoint={endpoint} />
        <PricingSection pricing={endpoint.pricing} />
        <CapabilitiesSection endpoint={endpoint} />
        <LimitsSection limits={endpoint.limits} />
        <DataPolicySection dataPolicy={endpoint.data_policy} />
      </div>

      <ParametersSection parameters={endpoint.supported_parameters} />
    </div>
  )
}
