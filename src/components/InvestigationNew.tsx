import React, { useState, useEffect, useCallback } from 'react'
import { Search, Plus } from 'lucide-react'
import {
  InvestigationTemplates,
  InvestigationProgress,
  InvestigationHistory,
  CustomInvestigation,
  type InvestigationTemplate
} from './Investigation/'

interface Investigation {
  id: string
  name: string
  description: string
  agents: string[]
  startTime: string
  endTime?: string
  status: string
  currentAgentIndex?: number
  findings?: any[]
  recommendations?: any[]
  currentStep?: number
  agentSessions?: { [agentName: string]: any[] }
  chatMessages?: any[]
}

interface InvestigationProps {
  agents: any[]
  onStartChat: (agent: any) => void
  onDebugInfo?: (message: string) => void
  chatMessages?: any[]
  agentChatSessions?: { [agentName: string]: { session: any; messages: any[]; lastActive: string } }
}

export const InvestigationNew: React.FC<InvestigationProps> = ({
  agents,
  onStartChat,
  onDebugInfo,
  chatMessages = [],
  agentChatSessions = {}
}) => {
  // State management
  const [activeInvestigation, setActiveInvestigation] = useState<Investigation | null>(() => {
    const saved = localStorage.getItem('sre-ide-active-investigation')
    return saved ? JSON.parse(saved) : null
  })

  const [investigationHistory, setInvestigationHistory] = useState<Investigation[]>(() => {
    const saved = localStorage.getItem('sre-ide-investigation-history')
    return saved ? JSON.parse(saved) : []
  })

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('sre-ide-active-investigation')
    if (saved) {
      const investigation = JSON.parse(saved)
      return investigation.currentStep || 0
    }
    return 0
  })

  const [isStartingInvestigation, setIsStartingInvestigation] = useState(false)
  const [investigationError, setInvestigationError] = useState<string | null>(null)
  const [showCustomInvestigation, setShowCustomInvestigation] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Persistence effects
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeInvestigation) {
        localStorage.setItem('sre-ide-active-investigation', JSON.stringify(activeInvestigation))
      } else {
        localStorage.removeItem('sre-ide-active-investigation')
      }
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [activeInvestigation])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('sre-ide-investigation-history', JSON.stringify(investigationHistory))
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [investigationHistory])

  // Chat integration effect
  useEffect(() => {
    if (activeInvestigation && chatMessages && chatMessages.length > 0) {
      const existingMessageIds = new Set(activeInvestigation.chatMessages?.map((msg: any) => msg.id) || [])
      const newMessages = chatMessages.filter((msg: any) => !existingMessageIds.has(msg.id))
      
      if (newMessages.length > 0) {
        setActiveInvestigation((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            chatMessages: [...(prev.chatMessages || []), ...newMessages]
          }
        })
        onDebugInfo?.(`📝 Updated investigation with ${newMessages.length} new chat messages`)
      }
    }
  }, [chatMessages, activeInvestigation?.id, onDebugInfo])

  // Chat sessions integration effect
  useEffect(() => {
    if (activeInvestigation && Object.keys(agentChatSessions).length > 0) {
      const investigationAgents = activeInvestigation.agents || []
      const integratedSessions: { [agentName: string]: any[] } = {}
      
      investigationAgents.forEach((agentName: string) => {
        const agentSession = agentChatSessions[agentName]
        if (agentSession && agentSession.messages) {
          integratedSessions[agentName] = agentSession.messages
        }
      })
      
      if (Object.keys(integratedSessions).length > 0) {
        setActiveInvestigation((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            agentSessions: integratedSessions,
            lastUpdated: new Date().toISOString()
          }
        })
        onDebugInfo?.(`🔗 Integrated chat sessions for ${Object.keys(integratedSessions).length} agents`)
      }
    }
  }, [agentChatSessions, activeInvestigation?.id, onDebugInfo])

  // Investigation management functions
  const clearInvestigation = useCallback(() => {
    setActiveInvestigation(null)
    setCurrentStep(0)
    localStorage.removeItem('sre-ide-active-investigation')
    onDebugInfo?.('🧹 Cleared previous investigation data')
  }, [onDebugInfo])

  const startInvestigation = useCallback(async (template: InvestigationTemplate) => {
    setIsStartingInvestigation(true)
    setInvestigationError(null)
    
    clearInvestigation()
    
    try {
      if (agents.length === 0) {
        throw new Error('No agents available. Please check your connection.')
      }
      
      const availableAgents = template.agents.filter((agentName: string) => 
        agents.some(agent => agent.name === agentName || agent.name.toLowerCase().includes(agentName.toLowerCase()))
      )
      
      if (availableAgents.length === 0) {
        throw new Error(`No required agents available for ${template.name}. Required: ${template.agents.join(', ')}`)
      }
      
      const investigation: Investigation = {
        ...template,
        id: `inv-${Date.now()}`,
        startTime: new Date().toISOString(),
        status: 'active',
        currentAgentIndex: 0,
        findings: [],
        recommendations: [],
        currentStep: 0
      }
      
      setActiveInvestigation(investigation)
      setCurrentStep(0)
      onDebugInfo?.(`✅ Started investigation: ${template.name}`)
      
      // Start chat with first agent
      const firstAgentName = template.agents[0]
      let firstAgent = agents.find(a => a.name === firstAgentName) ||
                       agents.find(a => a.name.toLowerCase().includes(firstAgentName.toLowerCase())) ||
                       agents[0]
      
      if (firstAgent) {
        onStartChat(firstAgent)
        onDebugInfo?.(`🚀 Starting investigation with agent: ${firstAgent.name}`)
      } else {
        throw new Error('No agents available for investigation')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start investigation'
      setInvestigationError(errorMessage)
      onDebugInfo?.(`❌ Investigation error: ${errorMessage}`)
    } finally {
      setIsStartingInvestigation(false)
    }
  }, [agents, clearInvestigation, onDebugInfo, onStartChat])

  const startCustomInvestigation = useCallback((config: {
    name: string
    description: string
    agents: string[]
  }) => {
    clearInvestigation()

    const investigation: Investigation = {
      id: `inv-${Date.now()}`,
      name: config.name,
      description: config.description,
      agents: config.agents,
      startTime: new Date().toISOString(),
      status: 'active',
      currentAgentIndex: 0,
      findings: [],
      recommendations: [],
      currentStep: 0
    }
    
    setActiveInvestigation(investigation)
    setCurrentStep(0)
    onDebugInfo?.(`Started custom investigation: ${config.name}`)

    // Start with first agent if available
    const firstAgent = agents.find(a => config.agents.includes(a.name))
    if (firstAgent) {
      onStartChat(firstAgent)
    }
  }, [agents, clearInvestigation, onDebugInfo, onStartChat])

  const deleteInvestigation = useCallback((investigationId: string) => {
    setInvestigationHistory(prev => prev.filter(inv => inv.id !== investigationId))
    onDebugInfo?.(`🗑️ Deleted investigation: ${investigationId}`)
  }, [onDebugInfo])

  const downloadPDF = useCallback(async (investigation: Investigation) => {
    setIsDownloading(true)
    try {
      // TODO: Implement PDF download functionality
      // This would be extracted to a separate PDFExport service
      await new Promise(resolve => setTimeout(resolve, 1000)) // Placeholder
      onDebugInfo?.(`📄 Downloaded PDF for investigation: ${investigation.name}`)
    } catch (error) {
      onDebugInfo?.(`❌ Failed to download PDF: ${error}`)
    } finally {
      setIsDownloading(false)
    }
  }, [onDebugInfo])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Search size={24} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Investigation Center
          </h2>
        </div>
        <button
          onClick={() => setShowCustomInvestigation(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Custom Investigation</span>
        </button>
      </div>

      {/* Active Investigation */}
      {activeInvestigation && (
        <InvestigationProgress
          investigation={activeInvestigation}
          currentStep={currentStep}
          onClearInvestigation={clearInvestigation}
          agentChatSessions={agentChatSessions}
        />
      )}

      {/* Investigation Templates */}
      {!activeInvestigation && (
        <InvestigationTemplates
          agents={agents}
          onStartInvestigation={startInvestigation}
          isStarting={isStartingInvestigation}
          error={investigationError}
        />
      )}

      {/* Investigation History */}
      <InvestigationHistory
        history={investigationHistory}
        onDeleteInvestigation={deleteInvestigation}
        onDownloadPDF={downloadPDF}
        isDownloading={isDownloading}
      />

      {/* Custom Investigation Modal */}
      <CustomInvestigation
        agents={agents}
        onStartCustomInvestigation={startCustomInvestigation}
        isOpen={showCustomInvestigation}
        onClose={() => setShowCustomInvestigation(false)}
      />
    </div>
  )
}