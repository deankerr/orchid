import type { Doc } from '@/convex/_generated/dataModel'
import { BulkEndpoint } from './BulkEndpoint'
import Link from 'next/link'
import { EpochDisplay } from '../EpochDisplay'

type ModelWithEndpoints = Doc<'models_v1'> & {
  endpoints: Doc<'endpoints_v1'>[]
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
        <h3 className="font-mono text-sm font-semibold">
          <Link href={`/model/${model.slug}`} className="hover:underline">
            {model.slug}
          </Link>
        </h3>
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
              <td className="py-1">{model.short_name}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">author</td>
              <td className="py-1">{model.author_slug}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">contextLength</td>
              <td className="py-1">{model.context_length.toLocaleString()}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">tokenizer</td>
              <td className="py-1">{model.tokenizer}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">inputModalities</td>
              <td className="py-1">{model.input_modalities.join(', ')}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">outputModalities</td>
              <td className="py-1">{model.output_modalities.join(', ')}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">instructType</td>
              <td className="py-1">{renderOptional(model.instruct_type)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">huggingfaceId</td>
              <td className="py-1">{renderOptional(model.hugging_face_id)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">warningMessage</td>
              <td className="py-1">{renderOptional(model.warning_message)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">permaslug</td>
              <td className="py-1">{model.permaslug}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">created</td>
              <td className="py-1">{formatDate(model.origin_created_at)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">updated</td>
              <td className="py-1">{formatDate(model.origin_updated_at)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 pr-4 text-muted-foreground">epoch</td>
              <td className="py-1">
                <EpochDisplay epoch={model.epoch} />
              </td>
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
