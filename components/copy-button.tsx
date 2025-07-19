import { useState } from 'react'

import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from './ui/button'

export function CopyToClipboardButton({
  value,
  children,
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
    <Button onClick={handleCopy} {...props}>
      {children} {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
    </Button>
  )
}
