import React from 'react'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  error?: boolean
  placeholder?: string
  className?: string
  options: Array<{
    value: string | number
    label: string
    disabled?: boolean
  }>
}

export const Select: React.FC<SelectProps> = ({
  error = false,
  placeholder,
  className,
  options,
  ...props
}) => {
  return (
    <div className="relative">
      <select
        className={clsx(
          'block w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          'dark:bg-gray-800 dark:disabled:bg-gray-700 dark:text-white',
          {
            'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400': !error,
            'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500 dark:focus:border-red-400 dark:focus:ring-red-400': error
          },
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown size={16} className="text-gray-400" />
      </div>
    </div>
  )
}