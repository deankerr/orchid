'use client'

import { BrandIcon } from '@/components/brand-icon'
import { ErrorState } from '@/components/loading'
import { PageContainer, PageLoading, PageTitle } from '@/components/page-container'
import { useOrProviders } from '@/hooks/api'

export function ProvidersPage() {
  const providers = useOrProviders()

  if (!providers) {
    if (providers === null) {
      return (
        <PageContainer>
          <ErrorState message="Failed to load providers" />
        </PageContainer>
      )
    }
    return <PageLoading />
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <PageTitle>Providers</PageTitle>
      </div>

      <p className="text-sm text-muted-foreground">{providers.length} providers</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.slug} className="flex items-center gap-3 rounded-lg border p-4">
            <BrandIcon slug={provider.slug} size={32} fallbackSrc={provider.icon.url} />
            <div>
              <h3 className="font-mono font-medium">{provider.slug}</h3>
              <p className="text-sm text-muted-foreground">{provider.name}</p>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
