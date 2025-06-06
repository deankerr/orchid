import { BulkModelList } from '@/components/bulk/BulkModelList'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="relative py-6">
        <header className="container mx-auto mb-4">
          <h1 className="text-4xl font-bold">ORCHID</h1>
          <p className="text-muted-foreground">OpenRouter Capability & Health Intelligence Dashboard</p>
        </header>

        <div className="container mx-auto">
          <BulkModelList />
        </div>
      </div>
    </main>
  )
}
