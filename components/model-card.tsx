'use client'

import Link from 'next/link'

import { AlertTriangleIcon, FileIcon, ImageIcon } from 'lucide-react'

import type { OrModel } from '@/convex/types'

import { formatIsoDate } from '@/lib/utils'

import { ExternalLink } from './external-link'
import { MarkdownLinks } from './markdown-links'
import { Pill } from './pill'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function ModelCard({ model }: { model: OrModel }) {
  return (
    <Card className="font-mono">
      <CardHeader>
        <CardTitle>
          <Link href={`/?model=${model.slug}`} className="underline-offset-2 hover:underline">
            {model.name}
          </Link>
        </CardTitle>
        <CardDescription className="font-mono">{model.slug}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2 font-mono">
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

          <Pill label="added">{formatIsoDate(model.or_created_at)}</Pill>

          <Pill label="context_length">{model.context_length.toLocaleString()}</Pill>

          <Pill label="tokenizer">{model.tokenizer}</Pill>

          <Pill label="instruct_type">
            {model.instruct_type ?? <span className="text-muted-foreground">null</span>}
          </Pill>
        </div>

        <div className="line-clamp-4 text-sm leading-normal text-muted-foreground">
          <MarkdownLinks>{model.description}</MarkdownLinks>
        </div>

        {model.warning_message && (
          <div className="flex items-center gap-2 rounded border border-warning px-3 py-2.5 text-sm text-warning">
            <AlertTriangleIcon className="size-5" />
            <div>
              <MarkdownLinks>{model.warning_message}</MarkdownLinks>
            </div>
          </div>
        )}

        <div className="flex gap-4 text-sm">
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
