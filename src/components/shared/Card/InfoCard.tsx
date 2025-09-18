import React from 'react'
import { BaseCard } from './BaseCard'
import type { LucideIcon } from 'lucide-react'

interface InfoCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  onClick?: () => void
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  onClick
}) => {
  return (
    <BaseCard 
      className={className} 
      onClick={onClick}
      hoverable={!!onClick}
      variant="elevated"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {description}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                trend.isPositive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                vs last period
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Icon size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  )
}