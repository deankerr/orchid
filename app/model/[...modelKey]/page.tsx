import { ModelPage } from '@/components/models/ModelPage'

export default async function Page({ params }: { params: Promise<{ modelKey: string[] }> }) {
  const { modelKey } = await params
  const decodedModelKey = decodeURIComponent(modelKey.join('/'))
  return <ModelPage modelKey={decodedModelKey} />
}
