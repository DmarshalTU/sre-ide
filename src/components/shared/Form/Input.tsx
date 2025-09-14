import React from 'react'
import { clsx } from 'clsx'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  error?: boolean
  className?: string
}

export const Input: React.FC<InputProps> = ({
  error = false,
  className,
  ...props
}) => {
  return (
    <input
      className={clsx(
        'block w-full rounded-lg border px-3 py-2 text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
        'dark:bg-gray-800 dark:disabled:bg-gray-700',
        {
          'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400': !error,
          'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500 dark:focus:border-red-400 dark:focus:ring-red-400': error
        },
        className
      )}
      {...props}
    />
  )
}