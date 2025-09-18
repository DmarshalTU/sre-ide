import React from 'react'
import { 
  Clock, CheckCircle, MessageSquare,
  ChevronRight
} from 'lucide-react'

interface Investigation {
  id: string
  name: string
  description: string
  agents: string[]
  startTime: string
  status: string
  currentAgentIndex?: number
  findings?: any[]
  recommendations?: any[]
  currentStep?: number
  agentSessions?: { [agentName: string]: any[] }
  chatMessages?: any[]
}

interface InvestigationProgressProps {
  investigation: Investigation
  currentStep: number
  onClearInvestigation: () => void
  agentChatSessions?: { [agentName: string]: { session: any; messages: any[]; lastActive: string } }
}

export const InvestigationProgress: React.FC<InvestigationProgressProps> = ({
  investigation,
  currentStep,
  onClearInvestigation,
  agentChatSessions = {}
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'active'
    return 'pending'
  }

  const getStepIcon = (_stepIndex: number, status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-500" />
      case 'active':
        return <Clock size={20} className="text-blue-500 animate-pulse" />
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
        )
    }
  }

  const getAgentSessionInfo = (agentName: string) => {
    const session = agentChatSessions[agentName]
    if (!session) return null
    
    return {
      messageCount: session.messages?.length || 0,
      lastActive: session.lastActive,
      hasMessages: (session.messages?.length || 0) > 0
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getElapsedTime = () => {
    const start = new Date(investigation.startTime)
    const now = new Date()
    const elapsed = now.getTime() - start.getTime()
    
    const minutes = Math.floor(elapsed / (1000 * 60))
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Investigation Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {investigation.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {investigation.description}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full">
              Active
            </span>
            <button
              onClick={onClearInvestigation}
              className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Started</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatTimestamp(investigation.startTime)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {getElapsedTime()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Agents</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {investigation.agents.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round((currentStep / Math.max(investigation.agents.length, 1)) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Investigation Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Investigation Steps
        </h4>

        <div className="space-y-4">
          {investigation.agents.map((agentName, index) => {
            const status = getStepStatus(index)
            const sessionInfo = getAgentSessionInfo(agentName)

            return (
              <div
                key={`${agentName}-${index}`}
                className={`
                  flex items-center space-x-4 p-4 rounded-lg transition-all duration-200
                  ${status === 'active' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                    : status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }
                `}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(index, status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Step {index + 1}: {agentName}
                    </p>
                    {sessionInfo && (
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <MessageSquare size={12} />
                        <span>{sessionInfo.messageCount} messages</span>
                      </div>
                    )}
                  </div>
                  
                  {status === 'active' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Currently investigating...
                    </p>
                  )}
                  
                  {status === 'completed' && sessionInfo && sessionInfo.hasMessages && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Investigation completed with {sessionInfo.messageCount} interactions
                    </p>
                  )}

                  {sessionInfo && sessionInfo.lastActive && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last active: {formatTimestamp(sessionInfo.lastActive)}
                    </p>
                  )}
                </div>

                {index < investigation.agents.length - 1 && status === 'completed' && (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Overall Progress
          </h4>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {currentStep} / {investigation.agents.length} steps completed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(currentStep / Math.max(investigation.agents.length, 1)) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}