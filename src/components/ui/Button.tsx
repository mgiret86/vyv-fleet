import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'DANGER'
  | 'GHOST'
  | 'OUTLINE'
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'default' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  isLoading?: boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
  asChild?:   boolean
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  PRIMARY:     'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500',
  SECONDARY:   'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
  DANGER:      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  GHOST:       'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
  OUTLINE:     'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
  default:     'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  outline:     'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
  secondary:   'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
  ghost:       'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
  link:        'bg-transparent text-violet-600 underline-offset-4 hover:underline focus:ring-violet-500',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm:      'px-3 py-1.5 text-xs',
  md:      'px-4 py-2 text-sm',
  lg:      'px-5 py-2.5 text-base',
  default: 'px-4 py-2 text-sm',
  icon:    'h-9 w-9 p-0',
}

// ─── buttonVariants (requis par alert-dialog, calendar, pagination) ────────────

export function buttonVariants(options?: {
  variant?: ButtonVariant
  size?:    ButtonSize
}): string {
  const variantClass = VARIANT_CLASSES[options?.variant ?? 'default']
  const sizeClass    = SIZE_CLASSES[options?.size       ?? 'default']
  return [
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    variantClass,
    sizeClass,
  ].join(' ')
}

// ─── Button (forwardRef — requis par carousel) ─────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'PRIMARY',
      size      = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      asChild: _asChild,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
