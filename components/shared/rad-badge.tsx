import * as React from 'react'

import { cva, type VariantProps } from 'class-variance-authority'
import { Slot as SlotPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

const radBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm aria-disabled:opacity-20 aria-disabled:saturate-[20%] shrink-0 [&>svg]:pointer-events-none overflow-hidden',
  {
    variants: {
      variant: {
        solid: '',
        soft: '',
        surface: 'border',
        outline: 'border',
      },
      color: {
        red: '',
        orange: '',
        amber: '',
        yellow: '',
        lime: '',
        green: '',
        emerald: '',
        teal: '',
        cyan: '',
        sky: '',
        blue: '',
        indigo: '',
        violet: '',
        purple: '',
        fuchsia: '',
        pink: '',
        rose: '',
        gray: '',
        slate: '',
        zinc: '',
        neutral: '',
        stone: '',
      },
    },
    compoundVariants: [
      // Red variants
      {
        variant: 'solid',
        color: 'red',
        className: 'bg-red-600 text-white',
      },
      {
        variant: 'soft',
        color: 'red',
        className: 'bg-red-950 text-red-400',
      },
      {
        variant: 'surface',
        color: 'red',
        className: 'bg-red-950/30 text-red-400 border-red-400/30',
      },
      {
        variant: 'outline',
        color: 'red',
        className: 'text-red-400 border-red-400',
      },
      // Orange variants
      {
        variant: 'solid',
        color: 'orange',
        className: 'bg-orange-600 text-white',
      },
      {
        variant: 'soft',
        color: 'orange',
        className: 'bg-orange-950 text-orange-400',
      },
      {
        variant: 'surface',
        color: 'orange',
        className: 'bg-orange-950/30 text-orange-400 border-orange-400/30',
      },
      {
        variant: 'outline',
        color: 'orange',
        className: 'text-orange-400 border-orange-400',
      },
      // Amber variants
      {
        variant: 'solid',
        color: 'amber',
        className: 'bg-amber-600 text-white',
      },
      {
        variant: 'soft',
        color: 'amber',
        className: 'bg-amber-950 text-amber-400',
      },
      {
        variant: 'surface',
        color: 'amber',
        className: 'bg-amber-950/30 text-amber-400 border-amber-400/30',
      },
      {
        variant: 'outline',
        color: 'amber',
        className: 'text-amber-400 border-amber-400',
      },
      // Yellow variants
      {
        variant: 'solid',
        color: 'yellow',
        className: 'bg-yellow-600 text-white',
      },
      {
        variant: 'soft',
        color: 'yellow',
        className: 'bg-yellow-950 text-yellow-400',
      },
      {
        variant: 'surface',
        color: 'yellow',
        className: 'bg-yellow-950/30 text-yellow-400 border-yellow-400/30',
      },
      {
        variant: 'outline',
        color: 'yellow',
        className: 'text-yellow-400 border-yellow-400',
      },
      // Lime variants
      {
        variant: 'solid',
        color: 'lime',
        className: 'bg-lime-600 text-white',
      },
      {
        variant: 'soft',
        color: 'lime',
        className: 'bg-lime-950 text-lime-400',
      },
      {
        variant: 'surface',
        color: 'lime',
        className: 'bg-lime-950/30 text-lime-400 border-lime-400/30',
      },
      {
        variant: 'outline',
        color: 'lime',
        className: 'text-lime-400 border-lime-400',
      },
      // Green variants
      {
        variant: 'solid',
        color: 'green',
        className: 'bg-green-600 text-white',
      },
      {
        variant: 'soft',
        color: 'green',
        className: 'bg-green-950 text-green-400',
      },
      {
        variant: 'surface',
        color: 'green',
        className: 'bg-green-950/30 text-green-400 border-green-400/30',
      },
      {
        variant: 'outline',
        color: 'green',
        className: 'text-green-400 border-green-400',
      },
      // Emerald variants
      {
        variant: 'solid',
        color: 'emerald',
        className: 'bg-emerald-600 text-white',
      },
      {
        variant: 'soft',
        color: 'emerald',
        className: 'bg-emerald-950 text-emerald-400',
      },
      {
        variant: 'surface',
        color: 'emerald',
        className: 'bg-emerald-950/30 text-emerald-400 border-emerald-400/30',
      },
      {
        variant: 'outline',
        color: 'emerald',
        className: 'text-emerald-400 border-emerald-400',
      },
      // Teal variants
      {
        variant: 'solid',
        color: 'teal',
        className: 'bg-teal-600 text-white',
      },
      {
        variant: 'soft',
        color: 'teal',
        className: 'bg-teal-950 text-teal-400',
      },
      {
        variant: 'surface',
        color: 'teal',
        className: 'bg-teal-950/30 text-teal-400 border-teal-400/30',
      },
      {
        variant: 'outline',
        color: 'teal',
        className: 'text-teal-400 border-teal-400',
      },
      // Cyan variants
      {
        variant: 'solid',
        color: 'cyan',
        className: 'bg-cyan-600 text-white',
      },
      {
        variant: 'soft',
        color: 'cyan',
        className: 'bg-cyan-950 text-cyan-400',
      },
      {
        variant: 'surface',
        color: 'cyan',
        className: 'bg-cyan-950/30 text-cyan-400 border-cyan-400/30',
      },
      {
        variant: 'outline',
        color: 'cyan',
        className: 'text-cyan-400 border-cyan-400',
      },
      // Sky variants
      {
        variant: 'solid',
        color: 'sky',
        className: 'bg-sky-600 text-white',
      },
      {
        variant: 'soft',
        color: 'sky',
        className: 'bg-sky-950 text-sky-400',
      },
      {
        variant: 'surface',
        color: 'sky',
        className: 'bg-sky-950/30 text-sky-400 border-sky-400/30',
      },
      {
        variant: 'outline',
        color: 'sky',
        className: 'text-sky-400 border-sky-400',
      },
      // Blue variants
      {
        variant: 'solid',
        color: 'blue',
        className: 'bg-blue-600 text-white',
      },
      {
        variant: 'soft',
        color: 'blue',
        className: 'bg-blue-950 text-blue-400',
      },
      {
        variant: 'surface',
        color: 'blue',
        className: 'bg-blue-950/30 text-blue-400 border-blue-400/30',
      },
      {
        variant: 'outline',
        color: 'blue',
        className: 'text-blue-400 border-blue-400',
      },
      // Indigo variants
      {
        variant: 'solid',
        color: 'indigo',
        className: 'bg-indigo-600 text-white',
      },
      {
        variant: 'soft',
        color: 'indigo',
        className: 'bg-indigo-950 text-indigo-400',
      },
      {
        variant: 'surface',
        color: 'indigo',
        className: 'bg-indigo-950/30 text-indigo-400 border-indigo-400/30',
      },
      {
        variant: 'outline',
        color: 'indigo',
        className: 'text-indigo-400 border-indigo-400',
      },
      // Violet variants
      {
        variant: 'solid',
        color: 'violet',
        className: 'bg-violet-600 text-white',
      },
      {
        variant: 'soft',
        color: 'violet',
        className: 'bg-violet-950 text-violet-400',
      },
      {
        variant: 'surface',
        color: 'violet',
        className: 'bg-violet-950/30 text-violet-400 border-violet-400/30',
      },
      {
        variant: 'outline',
        color: 'violet',
        className: 'text-violet-400 border-violet-400',
      },
      // Purple variants
      {
        variant: 'solid',
        color: 'purple',
        className: 'bg-purple-600 text-white',
      },
      {
        variant: 'soft',
        color: 'purple',
        className: 'bg-purple-950 text-purple-400',
      },
      {
        variant: 'surface',
        color: 'purple',
        className: 'bg-purple-950/30 text-purple-400 border-purple-400/30',
      },
      {
        variant: 'outline',
        color: 'purple',
        className: 'text-purple-400 border-purple-400',
      },
      // Fuchsia variants
      {
        variant: 'solid',
        color: 'fuchsia',
        className: 'bg-fuchsia-600 text-white',
      },
      {
        variant: 'soft',
        color: 'fuchsia',
        className: 'bg-fuchsia-950 text-fuchsia-400',
      },
      {
        variant: 'surface',
        color: 'fuchsia',
        className: 'bg-fuchsia-950/30 text-fuchsia-400 border-fuchsia-400/30',
      },
      {
        variant: 'outline',
        color: 'fuchsia',
        className: 'text-fuchsia-400 border-fuchsia-400',
      },
      // Pink variants
      {
        variant: 'solid',
        color: 'pink',
        className: 'bg-pink-600 text-white',
      },
      {
        variant: 'soft',
        color: 'pink',
        className: 'bg-pink-950 text-pink-400',
      },
      {
        variant: 'surface',
        color: 'pink',
        className: 'bg-pink-950/30 text-pink-400 border-pink-400/30',
      },
      {
        variant: 'outline',
        color: 'pink',
        className: 'text-pink-400 border-pink-400',
      },
      // Rose variants
      {
        variant: 'solid',
        color: 'rose',
        className: 'bg-rose-600 text-white',
      },
      {
        variant: 'soft',
        color: 'rose',
        className: 'bg-rose-950 text-rose-400',
      },
      {
        variant: 'surface',
        color: 'rose',
        className: 'bg-rose-950/30 text-rose-400 border-rose-400/30',
      },
      {
        variant: 'outline',
        color: 'rose',
        className: 'text-rose-400 border-rose-400',
      },
      // Gray variants (mono)
      {
        variant: 'solid',
        color: 'gray',
        className: 'bg-gray-600 text-white',
      },
      {
        variant: 'soft',
        color: 'gray',
        className: 'bg-gray-800 text-gray-300',
      },
      {
        variant: 'surface',
        color: 'gray',
        className: 'bg-gray-900/50 text-gray-400 border-gray-700',
      },
      {
        variant: 'outline',
        color: 'gray',
        className: 'text-gray-400 border-gray-600',
      },
      // Slate variants (mono)
      {
        variant: 'solid',
        color: 'slate',
        className: 'bg-slate-600 text-white',
      },
      {
        variant: 'soft',
        color: 'slate',
        className: 'bg-slate-800 text-slate-300',
      },
      {
        variant: 'surface',
        color: 'slate',
        className: 'bg-slate-900/50 text-slate-400 border-slate-700',
      },
      {
        variant: 'outline',
        color: 'slate',
        className: 'text-slate-400 border-slate-600',
      },
      // Zinc variants (mono)
      {
        variant: 'solid',
        color: 'zinc',
        className: 'bg-zinc-600 text-white',
      },
      {
        variant: 'soft',
        color: 'zinc',
        className: 'bg-zinc-800 text-zinc-300',
      },
      {
        variant: 'surface',
        color: 'zinc',
        className: 'bg-zinc-900/50 text-zinc-400 border-zinc-700',
      },
      {
        variant: 'outline',
        color: 'zinc',
        className: 'text-zinc-400 border-zinc-600',
      },
      // Neutral variants (mono)
      {
        variant: 'solid',
        color: 'neutral',
        className: 'bg-neutral-600 text-white',
      },
      {
        variant: 'soft',
        color: 'neutral',
        className: 'bg-neutral-800 text-neutral-300',
      },
      {
        variant: 'surface',
        color: 'neutral',
        className: 'bg-neutral-900/50 text-neutral-400 border-neutral-700',
      },
      {
        variant: 'outline',
        color: 'neutral',
        className: 'text-neutral-400 border-neutral-600',
      },
      // Stone variants (mono)
      {
        variant: 'solid',
        color: 'stone',
        className: 'bg-stone-600 text-white',
      },
      {
        variant: 'soft',
        color: 'stone',
        className: 'bg-stone-800 text-stone-300',
      },
      {
        variant: 'surface',
        color: 'stone',
        className: 'bg-stone-900/50 text-stone-400 border-stone-700',
      },
      {
        variant: 'outline',
        color: 'stone',
        className: 'text-stone-400 border-stone-600',
      },
    ],
    defaultVariants: {
      variant: 'soft',
      color: 'neutral',
    },
  },
)

export function RadIconBadge({
  variant,
  color,
  ...props
}: Omit<React.ComponentProps<'div'>, 'color' | 'className'> &
  Omit<VariantProps<typeof radBadgeVariants>, 'size'>) {
  return <div className={cn('size-7 px-1 py-1', radBadgeVariants({ variant, color }))} {...props} />
}

function RadBadge({
  className,
  variant,
  color,
  asChild = false,
  ...props
}: Omit<React.ComponentProps<'span'>, 'color'> &
  VariantProps<typeof radBadgeVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'span'

  return (
    <Comp
      data-slot="rad-badge"
      className={cn(radBadgeVariants({ variant, color }), className)}
      {...props}
    />
  )
}

export { RadBadge, radBadgeVariants }
