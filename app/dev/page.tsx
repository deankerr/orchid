import { ModelListItem } from '@/app/dev/model-list-item'
import { RoutingAnalysis } from '@/app/dev/routing-analysis'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import Data from './endpoints-data.json'

export default function EpDataPage() {
  // Select some interesting models for examples
  const exampleModels = [
    // High-endpoint complex model
    'meta-llama/llama-3.3-70b-instruct',
    // Performance leader
    'deepseek/deepseek-r1',
    // High variation model
    'anthropic/claude-3.5-sonnet',
    // Simple model for comparison
    'openai/gpt-4o-mini',
    // Ultra-fast model
    'cerebras/llama3.1-70b',
  ].filter((slug) => (Data.models as any)[slug]) // Only include models that exist in data

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="mb-2 font-mono text-2xl font-bold">OpenRouter Data Analysis</h1>
        <p className="text-muted-foreground">
          Analysis of routing patterns, pricing variations, and performance metrics across{' '}
          {Object.keys(Data.models).length} models
        </p>
      </div>

      <Tabs defaultValue="examples" className="w-full">
        <TabsList>
          <TabsTrigger value="examples">Model List Examples</TabsTrigger>
          <TabsTrigger value="analysis">Routing Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="examples" className="space-y-4">
          <div>
            <h2 className="mb-4 font-mono text-lg font-semibold">Dense Model List Items</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              These examples showcase routing insights, pricing patterns, and performance metrics
              that are typically hidden from users. Notice how &ldquo;Popular Choice&rdquo; pricing
              often differs from the advertised cheapest price.
            </p>

            <div className="space-y-4">
              {exampleModels.map((slug) => (
                <ModelListItem key={slug} slug={slug} model={(Data.models as any)[slug]} />
              ))}
            </div>

            <div className="mt-8 rounded-lg bg-muted/50 p-4">
              <h3 className="mb-2 font-mono font-semibold">Key Insights</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  • <strong>Popular Choice</strong> pricing shows what users actually pay
                  (traffic-weighted average)
                </li>
                <li>
                  • <strong>Traffic Concentration</strong> reveals OpenRouter&apos;s routing
                  preferences
                </li>
                <li>
                  • <strong>Ultra-fast</strong> badges indicate endpoints with {'>'}1000
                  tokens/second
                </li>
                <li>
                  • <strong>Deranked</strong> endpoints are deprioritized due to reliability issues
                </li>
                <li>
                  • <strong>Best Value</strong> calculates performance per dollar spent
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <RoutingAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  )
}
