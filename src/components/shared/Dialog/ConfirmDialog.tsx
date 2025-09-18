import React from 'react'
import { BaseDialog } from './BaseDialog'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: 'text-red-500',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
  },
  info: {
    icon: AlertTriangle,
    iconColor: 'text-blue-500',
    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  }
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      showCloseButton={false}
    >
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${config.iconColor}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {message}
          </p>
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmButtonClass}`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}