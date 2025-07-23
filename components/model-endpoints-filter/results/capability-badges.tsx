import {
  BracesIcon,
  BrainIcon,
  DatabaseIcon,
  FileUpIcon,
  HeartIcon,
  ImageUpIcon,
  WrenchIcon,
} from 'lucide-react'

import { Badge } from '../../ui/badge'

export function CapImageBadge() {
  return (
    <Badge variant="secondary">
      <ImageUpIcon /> image
    </Badge>
  )
}

export function CapFileBadge() {
  return (
    <Badge variant="secondary">
      <FileUpIcon /> PDF
    </Badge>
  )
}

export function CapReasoningBadge() {
  return (
    <Badge variant="secondary">
      <BrainIcon /> reasoning
    </Badge>
  )
}

export function CapToolsBadge() {
  return (
    <Badge variant="secondary">
      <WrenchIcon /> tools
    </Badge>
  )
}

export function CapJsonResponseBadge() {
  return (
    <Badge variant="secondary">
      <BracesIcon /> JSON
    </Badge>
  )
}

export function CapFreeVariantBadge() {
  return (
    <Badge variant="secondary">
      <HeartIcon /> free
    </Badge>
  )
}

export function CapPromptCachingBadge() {
  return (
    <Badge variant="secondary">
      <DatabaseIcon /> cache
    </Badge>
  )
}
