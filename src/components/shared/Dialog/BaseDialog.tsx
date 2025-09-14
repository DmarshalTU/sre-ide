import React from 'react'
import { X } from 'lucide-react'

interface BaseDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
  showCloseButton?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl'
}

export const BaseDialog: React.FC<BaseDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true
}) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleEscapeKey}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${maxWidthClasses[maxWidth]} 
        transform transition-all duration-200 scale-100 opacity-100
        border border-gray-200 dark:border-gray-700
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 
            id="dialog-title"
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}