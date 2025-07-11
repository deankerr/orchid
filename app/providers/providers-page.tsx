'use client'

import { BrandIcon } from '@/components/brand-icon'
import { ErrorState } from '@/components/loading'
import { PageContainer, PageHeader, PageLoading, PageTitle } from '@/components/page-container'
import { useProvidersList } from '@/hooks/api'

export function ProvidersPage() {
  const providers = useProvidersList()

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
      <PageHeader>
        <PageTitle>Providers</PageTitle>
      </PageHeader>

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
