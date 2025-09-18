import React from 'react'
import { clsx } from 'clsx'

interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  error?: boolean
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  className?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  error = false,
  resize = 'vertical',
  className,
  ...props
}) => {
  return (
    <textarea
      className={clsx(
        'block w-full rounded-lg border px-3 py-2 text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
        'dark:bg-gray-800 dark:disabled:bg-gray-700 dark:text-white',
        {
          'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400': !error,
          'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500 dark:focus:border-red-400 dark:focus:ring-red-400': error,
          'resize-none': resize === 'none',
          'resize': resize === 'both',
          'resize-x': resize === 'horizontal',
          'resize-y': resize === 'vertical'
        },
        className
      )}
      {...props}
    />
  )
}