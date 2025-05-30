import type { Doc } from '@/convex/_generated/dataModel'
import { BulkEndpoint } from './BulkEndpoint'

type ModelWithEndpoints = Doc<'models'> & {
  endpoints: Doc<'endpoints'>[]
}

export function BulkModel({ model }: { model: ModelWithEndpoints }) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toISOString().split('T')[0]
  }

  const renderOptional = (value: string | undefined | null) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground/60 italic">null</span>
    }
    return value
  }

  return (
    <div className="border overflow-hidden">
      {/* Model header */}
      <div className="p-3 border-b">
        <h3 className="font-mono text-sm font-semibold">{model.slug}</h3>
      </div>

      {/* Model details */}
      <div className="p-3 space-y-3">
        <table className="w-full text-xs font-mono">
          <tbody>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground w-40">name</td>
              <td className="py-1">{model.name}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">shortName</td>
              <td className="py-1">{model.shortName}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">author</td>
              <td className="py-1">{model.authorId}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">contextLength</td>
              <td className="py-1">{model.contextLength.toLocaleString()}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">tokenizer</td>
              <td className="py-1">{model.tokenizer}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">inputModalities</td>
              <td className="py-1">{model.inputModalities.join(', ')}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">outputModalities</td>
              <td className="py-1">{model.outputModalities.join(', ')}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">instructType</td>
              <td className="py-1">{renderOptional(model.instructType)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">huggingfaceId</td>
              <td className="py-1">{renderOptional(model.huggingfaceId)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">warningMessage</td>
              <td className="py-1">{renderOptional(model.warningMessage)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">permaslug</td>
              <td className="py-1">{model.permaslug}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">created</td>
              <td className="py-1">{formatDate(model.orCreatedAt)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">updated</td>
              <td className="py-1">{formatDate(model.orUpdatedAt)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">epoch</td>
              <td className="py-1">{model.epoch}</td>
            </tr>
          </tbody>
        </table>

        {/* Description if present */}
        {model.description && (
          <div className="text-xs font-mono space-y-1">
            <div className="text-muted-foreground">description:</div>
            <div className="pl-4 text-muted-foreground/80">{model.description}</div>
          </div>
        )}

        {/* Endpoints */}
        {model.endpoints.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-mono text-xs font-semibold text-muted-foreground">
              Endpoints ({model.endpoints.length})
            </h4>
            <div className="space-y-2">
              {model.endpoints.map((endpoint) => (
                <BulkEndpoint key={endpoint._id} endpoint={endpoint} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
