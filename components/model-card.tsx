import { FileIcon, ImageIcon } from 'lucide-react'

import type { OrModel } from '@/convex/types'

import { formatIsoDate } from '@/lib/utils'

import { ExternalLink } from './external-link'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

function ModelDescription({ description }: { description: string }) {
  // Regular expression to match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

  const parts: (string | React.ReactElement)[] = []
  let lastIndex = 0
  let match

  while ((match = markdownLinkRegex.exec(description)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(description.slice(lastIndex, match.index))
    }

    const linkText = match[1]
    let linkUrl = match[2].trim()

    // Handle relative URLs by prepending OpenRouter host
    if (linkUrl.startsWith('/')) {
      linkUrl = `https://openrouter.ai${linkUrl}`
    }

    // Add the ExternalLink component
    parts.push(
      <ExternalLink key={match.index} href={linkUrl}>
        {linkText}
      </ExternalLink>,
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after the last link
  if (lastIndex < description.length) {
    parts.push(description.slice(lastIndex))
  }

  return <>{parts}</>
}

export function ModelCard({ model }: { model: OrModel }) {
  return (
    <Card className="bg-background rounded-sm shadow-none">
      <CardHeader>
        <CardTitle>{model.name}</CardTitle>
        <CardDescription>{model.slug}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          {model.input_modalities.includes('image') && (
            <Badge variant="secondary">
              <ImageIcon />
              image
            </Badge>
          )}

          {model.input_modalities.includes('file') && (
            <Badge variant="secondary">
              <FileIcon />
              file
            </Badge>
          )}

          <Pill>
            <div className="bg-secondary text-secondary-foreground">added</div>
            <div>{formatIsoDate(model.or_created_at)}</div>
          </Pill>

          <Pill>
            <div className="bg-secondary text-secondary-foreground">context_length</div>
            <div>{model.context_length.toLocaleString()}</div>
          </Pill>

          <Pill>
            <div className="bg-secondary text-secondary-foreground">tokenizer</div>
            <div>{model.tokenizer}</div>
          </Pill>

          <Pill>
            <div className="bg-secondary text-secondary-foreground">instruct_type</div>
            <div>{model.instruct_type ?? <span className="text-muted-foreground">null</span>}</div>
          </Pill>
        </div>

        <div className="text-sm text-muted-foreground leading-normal">
          <ModelDescription description={model.description} />
        </div>

        <div className="text-sm flex gap-4">
          <ExternalLink href={`https://openrouter.ai/${model.slug}`}>OpenRouter</ExternalLink>
          {model.hugging_face_id && (
            <ExternalLink href={`https://huggingface.co/${model.hugging_face_id}`}>
              HuggingFace
            </ExternalLink>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="border flex *:py-1 font-medium rounded-sm w-fit text-xs *:px-2 font-mono">
      {children}
    </div>
  )
}
