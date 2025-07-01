'use client'

import ProviderIcon from '@/components/provider-icon'
import { useOrProviders } from '@/hooks/api'

export default function ProvidersPage() {
  const providers = useOrProviders()

  return (
    <div className="flex flex-col gap-4 p-6">
      {providers?.map((provider) => (
        <div key={provider.slug} className="flex items-center gap-4 rounded border p-6">
          <ProviderIcon provider={provider.slug} width={48} />
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold">{provider.name}</span>
            <span className="font-mono text-sm text-muted-foreground">{provider.slug}</span>
            <span className="font-mono text-sm text-muted-foreground">{provider.icon.url}</span>
            <span className="font-mono text-sm text-muted-foreground">
              {provider.icon.invertRequired ? 'true' : 'false'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
