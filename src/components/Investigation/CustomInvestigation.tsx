import React, { useState } from 'react'
import { X, Users, Play } from 'lucide-react'
import { BaseDialog, FormField, Input, TextArea } from '../shared'

interface CustomInvestigationProps {
  agents: any[]
  onStartCustomInvestigation: (config: {
    name: string
    description: string
    agents: string[]
  }) => void
  isOpen: boolean
  onClose: () => void
}

export const CustomInvestigation: React.FC<CustomInvestigationProps> = ({
  agents,
  onStartCustomInvestigation,
  isOpen,
  onClose
}) => {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [investigationName, setInvestigationName] = useState('')
  const [investigationDescription, setInvestigationDescription] = useState('')
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleAgentToggle = (agentName: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentName)
        ? prev.filter(name => name !== agentName)
        : [...prev, agentName]
    )
    
    // Clear errors when user makes changes
    if (errors.agents) {
      setErrors(prev => ({ ...prev, agents: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!investigationName.trim()) {
      newErrors.name = 'Investigation name is required'
    }

    if (!investigationDescription.trim()) {
      newErrors.description = 'Investigation description is required'
    }

    if (selectedAgents.length === 0) {
      newErrors.agents = 'Please select at least one agent'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStart = () => {
    if (!validateForm()) {
      return
    }

    onStartCustomInvestigation({
      name: investigationName.trim(),
      description: investigationDescription.trim(),
      agents: selectedAgents
    })

    handleClose()
  }

  const handleClose = () => {
    setSelectedAgents([])
    setInvestigationName('')
    setInvestigationDescription('')
    setErrors({})
    onClose()
  }

  const availableAgents = agents.filter(agent => agent.ready)

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Custom Investigation"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Investigation Details */}
        <div className="space-y-4">
          <FormField
            label="Investigation Name"
            id="investigation-name"
            required
            error={errors.name}
          >
            <Input
              id="investigation-name"
              value={investigationName}
              onChange={(e) => {
                setInvestigationName(e.target.value)
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: '' }))
                }
              }}
              placeholder="Enter investigation name..."
              error={!!errors.name}
            />
          </FormField>

          <FormField
            label="Description"
            id="investigation-description"
            required
            error={errors.description}
            helpText="Describe what you want to investigate and the goals"
          >
            <TextArea
              id="investigation-description"
              value={investigationDescription}
              onChange={(e) => {
                setInvestigationDescription(e.target.value)
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: '' }))
                }
              }}
              placeholder="Describe the investigation scope, goals, and what you want to analyze..."
              rows={3}
              error={!!errors.description}
            />
          </FormField>
        </div>

        {/* Agent Selection */}
        <div>
          <FormField
            label="Select Agents"
            id="agent-selection"
            required
            error={errors.agents}
            helpText={`Choose from ${availableAgents.length} available agents`}
          >
            <div className="space-y-3">
              {/* Selected Agents Summary */}
              {selectedAgents.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Selected Agents ({selectedAgents.length})
                    </span>
                    <button
                      onClick={() => setSelectedAgents([])}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgents.map((agentName) => (
                      <span
                        key={agentName}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        <span>{agentName}</span>
                        <button
                          onClick={() => handleAgentToggle(agentName)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Agents */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {availableAgents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <Users size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No agents available</p>
                    <p className="text-xs">Check your connection and try again</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {availableAgents.map((agent) => {
                      const isSelected = selectedAgents.includes(agent.name)
                      
                      return (
                        <label
                          key={agent.id}
                          className={`
                            flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors
                            ${isSelected 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAgentToggle(agent.name)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {agent.name}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {agent.namespace}
                                </span>
                                {agent.ready && (
                                  <span className="w-2 h-2 bg-green-500 rounded-full" title="Ready" />
                                )}
                              </div>
                            </div>
                            {agent.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {agent.description}
                              </p>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={selectedAgents.length === 0 || !investigationName.trim() || !investigationDescription.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Play size={16} />
            <span>Start Investigation</span>
          </button>
        </div>
      </div>
    </BaseDialog>
  )
}