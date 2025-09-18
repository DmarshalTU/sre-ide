import React from 'react'
import { clsx } from 'clsx'

interface BaseCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outlined'
  onClick?: () => void
  hoverable?: boolean
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
}

const variantClasses = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
  outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700'
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  className,
  padding = 'md',
  variant = 'default',
  onClick,
  hoverable = false
}) => {
  const isClickable = !!onClick
  
  return (
    <div
      className={clsx(
        'rounded-lg transition-all duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        {
          'cursor-pointer': isClickable,
          'hover:shadow-md hover:scale-[1.02]': hoverable || isClickable,
          'hover:border-gray-300 dark:hover:border-gray-600': hoverable || isClickable
        },
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      } : undefined}
    >
      {children}
    </div>
  )
}