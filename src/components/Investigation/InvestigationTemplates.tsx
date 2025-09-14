import React from 'react'
import { 
  AlertTriangle, BarChart3, Database, Network, 
  Shield, Cpu, Play, Loader2
} from 'lucide-react'

export interface InvestigationTemplate {
  id: string
  name: string
  description: string
  agents: string[]
  icon: any
  color: string
  urgency: string
}

interface InvestigationTemplatesProps {
  agents: any[]
  onStartInvestigation: (template: InvestigationTemplate) => Promise<void>
  isStarting: boolean
  error: string | null
}

const templates: InvestigationTemplate[] = [
  {
    id: 'prod-incident',
    name: 'Production Incident',
    description: 'Immediate response for critical production issues',
    agents: ['k8s-agent', 'observability-agent', 'promql-agent'],
    icon: AlertTriangle,
    color: 'from-red-500 to-red-600',
    urgency: 'P0'
  },
  {
    id: 'perf-degradation',
    name: 'Performance Degradation',
    description: 'Analyze slow response times and resource usage',
    agents: ['promql-agent', 'observability-agent', 'k8s-agent'],
    icon: BarChart3,
    color: 'from-orange-500 to-orange-600',
    urgency: 'P1'
  },
  {
    id: 'deployment-rollback',
    name: 'Deployment Rollback',
    description: 'Investigate failed deployments and rollback',
    agents: ['k8s-agent', 'argo-rollouts-agent', 'helm-agent'],
    icon: Database,
    color: 'from-blue-500 to-blue-600',
    urgency: 'P2'
  },
  {
    id: 'network-connectivity',
    name: 'Network Connectivity',
    description: 'Diagnose service mesh and network issues',
    agents: ['cilium-debug-agent', 'istio-agent', 'kgateway-agent'],
    icon: Network,
    color: 'from-purple-500 to-purple-600',
    urgency: 'P1'
  },
  {
    id: 'security-alert',
    name: 'Security Alert',
    description: 'Investigate security incidents and vulnerabilities',
    agents: ['k8s-agent', 'cilium-debug-agent', 'observability-agent'],
    icon: Shield,
    color: 'from-red-600 to-red-700',
    urgency: 'P0'
  },
  {
    id: 'capacity-planning',
    name: 'Capacity Planning',
    description: 'Resource utilization analysis and scaling',
    agents: ['promql-agent', 'observability-agent', 'k8s-agent'],
    icon: Cpu,
    color: 'from-green-500 to-green-600',
    urgency: 'P3'
  }
]

const urgencyColors = {
  P0: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  P1: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  P2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  P3: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
}

export const InvestigationTemplates: React.FC<InvestigationTemplatesProps> = ({
  agents,
  onStartInvestigation,
  isStarting,
  error
}) => {
  const getAvailableAgentsForTemplate = (template: InvestigationTemplate) => {
    return template.agents.filter(agentName => 
      agents.some(agent => 
        agent.name === agentName || 
        agent.name.toLowerCase().includes(agentName.toLowerCase())
      )
    )
  }

  const isTemplateAvailable = (template: InvestigationTemplate) => {
    return getAvailableAgentsForTemplate(template).length > 0
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Investigation Templates
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {agents.length} agents available
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = template.icon
          const availableAgents = getAvailableAgentsForTemplate(template)
          const isAvailable = isTemplateAvailable(template)

          return (
            <div
              key={template.id}
              className={`
                relative p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all duration-200
                ${isAvailable 
                  ? 'border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600' 
                  : 'border-gray-100 dark:border-gray-800 opacity-50'
                }
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`
                  p-3 rounded-lg bg-gradient-to-r ${template.color} text-white
                `}>
                  <Icon size={24} />
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${urgencyColors[template.urgency as keyof typeof urgencyColors]}
                  `}>
                    {template.urgency}
                  </span>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h4>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {template.description}
              </p>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Required Agents ({availableAgents.length}/{template.agents.length} available):
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.agents.map((agentName) => {
                    const isAgentAvailable = agents.some(agent => 
                      agent.name === agentName || 
                      agent.name.toLowerCase().includes(agentName.toLowerCase())
                    )
                    return (
                      <span
                        key={agentName}
                        className={`
                          px-2 py-1 text-xs rounded-full font-medium
                          ${isAgentAvailable
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }
                        `}
                      >
                        {agentName}
                      </span>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={() => onStartInvestigation(template)}
                disabled={!isAvailable || isStarting}
                className={`
                  w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isAvailable
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  }
                  ${isStarting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isStarting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Start Investigation</span>
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}