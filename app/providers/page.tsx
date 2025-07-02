'use client'

import ProviderIcon from '@/components/provider-icon'
import { ThemeButton } from '@/components/ui/theme-button'
import { useOrProviders } from '@/hooks/api'

export default function ProvidersPage() {
  const providers = useOrProviders()

  if (!providers) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <ThemeButton />
        <p>Loading providers...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl">Providers</h1>
        <ThemeButton />
      </div>

      <p className="text-sm text-muted-foreground">
        All providers with their consolidated icons (LobeHub preferred, API fallback)
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.slug} className="flex items-center gap-3 rounded-lg border p-4">
            <ProviderIcon provider={provider.slug} size={32} />
            <div>
              <h3 className="font-mono font-medium">{provider.slug}</h3>
              <p className="text-sm text-muted-foreground">{provider.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
