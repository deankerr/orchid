import { useEffect } from 'react'

export function useKeypress(keyMap: Record<string, () => void>) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger if user is typing in an input/textarea/contenteditable
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.contentEditable === 'true')
      ) {
        return
      }

      const handler = keyMap[event.key]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [keyMap])
}
