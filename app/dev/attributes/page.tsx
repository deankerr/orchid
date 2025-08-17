import { AttributeBadge, attributes, type AttributeKey } from '@/components/attributes'
import { PageContainer, PageHeader, PageTitle } from '@/components/shared/page-container'

export default function AttributesPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Attributes</PageTitle>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(attributes).map((key) => {
          const attributeKey = key as AttributeKey
          return (
            <div key={key} className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">{key}</p>
              <AttributeBadge attribute={attributeKey} />
            </div>
          )
        })}
      </div>
    </PageContainer>
  )
}
