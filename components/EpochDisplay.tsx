import { getEpoch } from '@/convex/shared'

interface EpochDisplayProps {
  epoch: number
  className?: string
}

export function EpochDisplay({ epoch, className = '' }: EpochDisplayProps) {
  const currentEpoch = getEpoch()
  const previousEpoch = currentEpoch - 60 * 60 * 1000 // One hour earlier

  // Consider current and previous epochs as "normal", fade anything older
  const isOld = epoch < previousEpoch

  const formatEpoch = (timestamp: number) => {
    const date = new Date(timestamp)
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')

    return `${year}.${month}.${day}_${hour}`
  }

  return (
    <span
      className={`font-mono text-xs ${isOld ? 'text-foreground/70' : 'text-foreground'} ${className}`}
      title={new Date(epoch).toISOString()}
    >
      {formatEpoch(epoch)}
    </span>
  )
}

// Hook for getting current epoch
export function useCurrentEpoch() {
  return getEpoch()
}
