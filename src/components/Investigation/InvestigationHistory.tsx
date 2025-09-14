import React, { useState } from 'react'
import { 
  FileText, Download, Trash2, Clock, Users, 
  ChevronDown, ChevronUp 
} from 'lucide-react'
import { ConfirmDialog } from '../shared/Dialog'

interface Investigation {
  id: string
  name: string
  description: string
  agents: string[]
  startTime: string
  endTime?: string
  status: string
  findings?: any[]
  recommendations?: any[]
}

interface InvestigationHistoryProps {
  history: Investigation[]
  onDeleteInvestigation: (investigationId: string) => void
  onDownloadPDF: (investigation: Investigation) => Promise<void>
  isDownloading: boolean
}

export const InvestigationHistory: React.FC<InvestigationHistoryProps> = ({
  history,
  onDeleteInvestigation,
  onDownloadPDF,
  isDownloading
}) => {
  const [expandedInvestigation, setExpandedInvestigation] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    investigation: Investigation | null
  }>({
    isOpen: false,
    investigation: null
  })

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = end.getTime() - start.getTime()
    
    const minutes = Math.floor(duration / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const handleDeleteClick = (investigation: Investigation) => {
    setDeleteConfirm({
      isOpen: true,
      investigation
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.investigation) {
      onDeleteInvestigation(deleteConfirm.investigation.id)
    }
    setDeleteConfirm({ isOpen: false, investigation: null })
  }

  const toggleExpanded = (investigationId: string) => {
    setExpandedInvestigation(
      expandedInvestigation === investigationId ? null : investigationId
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Investigation History
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Start your first investigation to see the history here.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Investigation History
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {history.length} investigations
          </span>
        </div>

        <div className="space-y-3">
          {history
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .map((investigation) => {
              const isExpanded = expandedInvestigation === investigation.id

              return (
                <div
                  key={investigation.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Investigation Summary */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                            {investigation.name}
                          </h4>
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${getStatusColor(investigation.status)}
                          `}>
                            {investigation.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {investigation.description}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{formatTimestamp(investigation.startTime)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users size={12} />
                            <span>{investigation.agents.length} agents</span>
                          </div>
                          <span>Duration: {getDuration(investigation.startTime, investigation.endTime)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => onDownloadPDF(investigation)}
                          disabled={isDownloading}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(investigation)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Delete investigation"
                        >
                          <Trash2 size={16} />
                        </button>

                        <button
                          onClick={() => toggleExpanded(investigation.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Agents */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Agents Used
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {investigation.agents.map((agent, index) => (
                              <span
                                key={`${agent}-${index}`}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full"
                              >
                                {agent}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Findings */}
                        {investigation.findings && investigation.findings.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Key Findings
                            </h5>
                            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                              {investigation.findings.slice(0, 3).map((finding, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <span className="text-gray-400">•</span>
                                  <span>{finding.toString()}</span>
                                </li>
                              ))}
                              {investigation.findings.length > 3 && (
                                <li className="text-gray-500 dark:text-gray-400">
                                  ... and {investigation.findings.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Recommendations */}
                        {investigation.recommendations && investigation.recommendations.length > 0 && (
                          <div className="md:col-span-2">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Recommendations
                            </h5>
                            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                              {investigation.recommendations.slice(0, 3).map((rec, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <span className="text-green-400">→</span>
                                  <span>{rec.toString()}</span>
                                </li>
                              ))}
                              {investigation.recommendations.length > 3 && (
                                <li className="text-gray-500 dark:text-gray-400">
                                  ... and {investigation.recommendations.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, investigation: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Investigation"
        message={`Are you sure you want to delete "${deleteConfirm.investigation?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}