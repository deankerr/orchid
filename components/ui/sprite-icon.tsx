import { forwardRef } from 'react'

import { cn } from '@/lib/utils'
import { getSpriteUrl, type SpriteIconName } from '@/lib/sprite-icons'

export interface SpriteIconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * The name of the icon from the sprite
   */
  name: SpriteIconName
  /**
   * Size of the icon (sets both width and height)
   */
  size?: number
}

/**
 * SpriteIcon component that renders icons from the Lucide sprite sheet.
 * 
 * This component provides better performance than individual Lucide React components
 * by using a single SVG sprite file with symbol references.
 * 
 * @example
 * ```tsx
 * <SpriteIcon name="brain-cog" size={24} className="text-blue-500" />
 * ```
 */
export const SpriteIcon = forwardRef<SVGSVGElement, SpriteIconProps>(
  ({ name, size = 24, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('lucide-icon', className)}
        {...props}
      >
        <use href={getSpriteUrl(name)} />
      </svg>
    )
  }
)

SpriteIcon.displayName = 'SpriteIcon'