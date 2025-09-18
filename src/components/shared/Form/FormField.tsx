import React from 'react'
import { clsx } from 'clsx'

interface FormFieldProps {
  label: string
  id: string
  error?: string
  required?: boolean
  helpText?: string
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  required = false,
  helpText,
  children,
  className
}) => {
  return (
    <div className={clsx('space-y-1', className)}>
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      {children}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  )
}