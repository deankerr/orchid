import { ExternalLinkIcon } from 'lucide-react'

export function ExternalLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-baseline gap-1.5 text-primary hover:underline underline-offset-2"
    >
      <ExternalLinkIcon className="size-3.5 translate-y-0.5" />
      {children}
    </a>
  )
}
