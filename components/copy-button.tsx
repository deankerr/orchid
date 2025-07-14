import { useState } from 'react'

import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from './ui/button'

export function CopyButton({
  value,
  ...props
}: { value: string } & React.ComponentProps<typeof Button>) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Button onClick={handleCopy} size="icon" {...props}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}
