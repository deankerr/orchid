import { ExternalLinkIcon } from 'lucide-react'

export function ExternalLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-primary hover:underline"
    >
      <ExternalLinkIcon className="size-3" />
      {children}
    </a>
  )
}
