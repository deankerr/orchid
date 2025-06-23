import { ExternalLink } from './external-link'

export function MarkdownLinks({ children }: { children: string }) {
  // Create a combined regex to match both patterns
  // Pattern 1: [text](url) - full markdown links
  // Pattern 2: (url) - standalone URLs in parentheses
  const linkRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\(([^)]+)\))/g

  const parts: (string | React.ReactElement)[] = []
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(children)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // This is a markdown link [text](url)
      const linkText = match[2]
      let linkUrl = match[3].trim()

      // Handle relative URLs by prepending OpenRouter host
      if (linkUrl.startsWith('/')) {
        linkUrl = `https://openrouter.ai${linkUrl}`
      }

      parts.push(
        <ExternalLink key={match.index} href={linkUrl}>
          {linkText}
        </ExternalLink>,
      )
    } else if (match[4]) {
      // This is a standalone URL (url)
      const linkUrl = match[5].trim()

      // Only convert to link if it looks like a URL
      if (linkUrl.match(/^https?:\/\//)) {
        parts.push(
          <ExternalLink key={match.index} href={linkUrl}>
            {linkUrl}
          </ExternalLink>,
        )
      } else {
        // Not a URL, keep the parentheses
        parts.push(match[4])
      }
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after the last match
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex))
  }

  return <>{parts}</>
}
