import React from 'react'
import { BaseCard } from './BaseCard'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface StatusCardProps {
  title: string
  status: 'success' | 'error' | 'warning' | 'pending' | 'info'
  message: string
  timestamp?: string
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }>
  className?: string
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  pending: {
    icon: Clock,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  info: {
    icon: Clock,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700'
  }
}

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  message,
  timestamp,
  actions,
  className
}) => {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <BaseCard 
      className={`${config.bgColor} ${config.borderColor} ${className}`}
      variant="outlined"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon size={20} className={config.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {message}
          </p>
          {timestamp && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {timestamp}
            </p>
          )}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    buttonVariants[action.variant || 'secondary']
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  )
}