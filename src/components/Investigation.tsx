import { useState, useEffect, memo } from 'react'
import { 
  Search, AlertTriangle, BarChart3, Database, Network, 
  Shield, Cpu, FileText, ChevronRight, Download, Play, 
  Clock, CheckCircle, XCircle, Loader2, MessageSquare, RefreshCw
} from 'lucide-react'

interface InvestigationTemplate {
  id: string
  name: string
  description: string
  agents: string[]
  icon: any
  color: string
  urgency: string
}

interface InvestigationProps {
  agents: any[]
  onStartChat: (agent: any) => void
  onDebugInfo?: (message: string) => void
  chatMessages?: any[] // Add chat messages prop
  agentChatSessions?: { [agentName: string]: { session: any; messages: any[]; lastActive: string } } // Add chat sessions prop
}

export const Investigation = memo(function Investigation({ agents, onStartChat, onDebugInfo, chatMessages = [], agentChatSessions = {} }: InvestigationProps) {
  const [activeInvestigation, setActiveInvestigation] = useState<any>(() => {
    const saved = localStorage.getItem('sre-ide-active-investigation')
    return saved ? JSON.parse(saved) : null
  })
  const [investigationHistory, setInvestigationHistory] = useState<any[]>(() => {
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
  const [showCustomInvestigation, setShowCustomInvestigation] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<string>('')
  const [isStartingInvestigation, setIsStartingInvestigation] = useState(false)
  const [investigationError, setInvestigationError] = useState<string | null>(null)
  const [showDownloadAlert, setShowDownloadAlert] = useState(false)
  const [downloadAlertMessage, setDownloadAlertMessage] = useState('')

  // Combined useEffect to reduce flickering - only run on mount and when agents change
  useEffect(() => {
    console.log('Investigation component mounted/updated:', {
      agentCount: agents.length,
      hasActiveInvestigation: !!activeInvestigation,
      currentStep
    })
  }, [agents.length, !!activeInvestigation, currentStep])

  // Save state to localStorage - debounced to reduce writes
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

  // Save investigation history - debounced
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('sre-ide-investigation-history', JSON.stringify(investigationHistory))
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [investigationHistory])

  // Update investigation with new chat messages when they arrive - optimized
  useEffect(() => {
    if (activeInvestigation && chatMessages && chatMessages.length > 0) {
      const existingMessageIds = new Set(activeInvestigation.chatMessages?.map((msg: any) => msg.id) || [])
      const newMessages = chatMessages.filter((msg: any) => !existingMessageIds.has(msg.id))
      
      if (newMessages.length > 0) {
        setActiveInvestigation((prev: any) => ({
          ...prev,
          chatMessages: [...(prev.chatMessages || []), ...newMessages]
        }))
        onDebugInfo?.(`📝 Updated investigation with ${newMessages.length} new chat messages`)
      }
    }
  }, [chatMessages, activeInvestigation?.id]) // Only depend on investigation ID, not the whole object

  // Integrate chat sessions with investigation
  const integrateChatSessionsWithInvestigation = () => {
    if (!activeInvestigation) return
    
    const investigationAgents = activeInvestigation.agents || []
    const integratedSessions: { [agentName: string]: any[] } = {}
    
    // Collect chat messages for each agent in the investigation
    investigationAgents.forEach((agentName: string) => {
      const agentSession = agentChatSessions[agentName]
      if (agentSession && agentSession.messages) {
        integratedSessions[agentName] = agentSession.messages
        onDebugInfo?.(`📋 Integrated ${agentSession.messages.length} messages for ${agentName}`)
      }
    })
    
    // Update investigation with integrated sessions
    setActiveInvestigation((prev: any) => ({
      ...prev,
      agentSessions: integratedSessions,
      lastUpdated: new Date().toISOString()
    }))
    
    onDebugInfo?.(`🔗 Integrated chat sessions for ${Object.keys(integratedSessions).length} agents`)
  }

  // Auto-integrate chat sessions when they change
  useEffect(() => {
    if (activeInvestigation && Object.keys(agentChatSessions).length > 0) {
      integrateChatSessionsWithInvestigation()
    }
  }, [agentChatSessions, activeInvestigation?.id])

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

  const startInvestigation = async (template: InvestigationTemplate) => {
    setIsStartingInvestigation(true)
    setInvestigationError(null)
    
    try {
      // Validate that we have agents available
      if (agents.length === 0) {
        throw new Error('No agents available. Please check your connection.')
      }
      
      // Check if at least one required agent is available
      const availableAgents = template.agents.filter(agentName => 
        agents.some(agent => agent.name === agentName || agent.name.toLowerCase().includes(agentName.toLowerCase()))
      )
      
      if (availableAgents.length === 0) {
        throw new Error(`No required agents available for ${template.name}. Required: ${template.agents.join(', ')}`)
      }
      
      const investigation = {
        ...template,
        id: `inv-${Date.now()}`,
        startTime: new Date().toISOString(),
        status: 'active',
        currentAgentIndex: 0,
        findings: [],
        recommendations: []
      }
      
      const investigationWithStep = {
        ...investigation,
        currentStep: 0
      }
      
      setActiveInvestigation(investigationWithStep)
      setCurrentStep(0)
      onDebugInfo?.(`✅ Started investigation: ${template.name}`)
      
      // Start chat with first agent if available
      const firstAgentName = template.agents[0]
      onDebugInfo?.(`Looking for agent: ${firstAgentName} from ${agents.length} available agents`)
      
      // Try to find agent by name, with fallback to first available agent
      let firstAgent = agents.find(a => a.name === firstAgentName)
      
      // If not found, try to find any agent that contains the name
      if (!firstAgent) {
        firstAgent = agents.find(a => a.name.toLowerCase().includes(firstAgentName.toLowerCase()))
      }
      
      // If still not found, use the first available agent
      if (!firstAgent && agents.length > 0) {
        firstAgent = agents[0]
        onDebugInfo?.(`⚠️ Agent ${firstAgentName} not found, using first available agent: ${firstAgent.name}`)
      }
      
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
  }

  const startCustomInvestigation = () => {
    if (selectedAgents.length === 0) {
      onDebugInfo?.('Please select at least one agent for investigation')
      return
    }

    const investigation = {
      id: `inv-${Date.now()}`,
      name: `Custom Investigation (${selectedAgents.join(', ')})`,
      description: 'Custom investigation with selected agents',
      agents: selectedAgents,
      startTime: new Date().toISOString(),
      status: 'active',
      currentAgentIndex: 0,
      findings: [],
      recommendations: []
    }
    
    const investigationWithStep = {
      ...investigation,
      currentStep: 0
    }
    setActiveInvestigation(investigationWithStep)
    setCurrentStep(0)
    setShowCustomInvestigation(false)
    onDebugInfo?.(`Started custom investigation with agents: ${selectedAgents.join(', ')}`)
    
    // Start chat with first selected agent
    const firstAgentName = selectedAgents[0]
    const firstAgent = agents.find(a => a.name === firstAgentName)
    
    if (firstAgent) {
      onStartChat(firstAgent)
      onDebugInfo?.(`Starting custom investigation with agent: ${firstAgent.name}`)
    } else {
      onDebugInfo?.(`Selected agent ${firstAgentName} not found`)
    }
  }



  const nextStep = () => {
    if (!activeInvestigation) {
      onDebugInfo?.('No active investigation to advance')
      return
    }
    
    const nextIndex = currentStep + 1
    onDebugInfo?.(`Progress: Step ${currentStep + 1} → ${nextIndex + 1} of ${activeInvestigation.agents.length}`)
    
    if (nextIndex < activeInvestigation.agents.length) {
      const nextAgentName = activeInvestigation.agents[nextIndex]

      onDebugInfo?.(`Advancing to step ${nextIndex + 1}: ${nextAgentName}`)
      
      // Try to find agent by exact name first
      let nextAgent = agents.find(a => a.name === nextAgentName)
      
      // If not found, try to find any agent that contains the name
      if (!nextAgent) {
        nextAgent = agents.find(a => a.name.toLowerCase().includes(nextAgentName.toLowerCase()))
        if (nextAgent) {
          onDebugInfo?.(`Found agent by partial match: ${nextAgent.name}`)
        }
      }
      
      // If still not found, use the first available agent
      if (!nextAgent && agents.length > 0) {
        nextAgent = agents[0]
        onDebugInfo?.(`Agent ${nextAgentName} not found, using first available agent: ${nextAgent.name}`)
      }
      
      if (nextAgent) {
        onStartChat(nextAgent)
        onDebugInfo?.(`✅ Successfully switched to agent: ${nextAgent.name}`)
        
        // Update both the currentStep and the active investigation
        setCurrentStep(nextIndex)
        setActiveInvestigation((prev: any) => ({
          ...prev,
          currentStep: nextIndex,
          lastUpdated: new Date().toISOString()
        }))
      } else {
        onDebugInfo?.(`❌ No agents available for next step`)
      }
    } else {
      onDebugInfo?.(`✅ Investigation complete! All ${activeInvestigation.agents.length} steps finished`)
    }
  }

  const completeInvestigation = () => {
    if (!activeInvestigation) return
    
    onDebugInfo?.('Completing investigation...')
    
    const completed = {
      ...activeInvestigation,
      status: 'completed',
      endTime: new Date().toISOString(),
      duration: Date.now() - new Date(activeInvestigation.startTime).getTime()
    }
    
    onDebugInfo?.('Investigation marked as completed')
    
    setInvestigationHistory(prev => {
      const newHistory = [completed, ...prev]
      onDebugInfo?.(`Added to history: ${newHistory.length} total investigations`)
      return newHistory
    })
    setActiveInvestigation(null)
    setCurrentStep(0)
    onDebugInfo?.(`Completed investigation: ${completed.name}`)
  }

  const getAgentDescription = (agentName: string): string => {
    const agentDescriptions: { [key: string]: string } = {
      'k8s-agent': 'Kubernetes cluster analysis and troubleshooting',
      'observability-agent': 'Metrics, logs, and monitoring analysis',
      'promql-agent': 'Prometheus query language expert',
      'argo-rollouts-agent': 'Argo Rollouts deployment management',
      'helm-agent': 'Helm charts and package management',
      'cilium-debug-agent': 'Cilium networking and security',
      'istio-agent': 'Istio service mesh analysis',
      'kgateway-agent': 'KGateway API and traffic management',
      'security-agent': 'Security incident investigation',
      'performance-agent': 'Performance optimization and analysis'
    }
    return agentDescriptions[agentName] || 'Specialized investigation agent'
  }

  // Extract findings and insights from chat messages
  const extractFindingsFromChat = (): { findings: string[], insights: string[], recommendations: string[] } => {
    const findings: string[] = []
    const insights: string[] = []
    const recommendations: string[] = []

    // Use investigation's stored chat messages if available, otherwise use current chat messages
    const messagesToUse = activeInvestigation?.chatMessages || chatMessages || []

    // Debug: Log what chat messages we have
    console.log('Extracting findings from chat messages:', {
      investigationChatMessagesCount: activeInvestigation?.chatMessages?.length || 0,
      currentChatMessagesCount: chatMessages?.length || 0,
      messagesToUseCount: messagesToUse.length,
      messagesToUse: messagesToUse.slice(0, 3) // First 3 messages for debugging
    })

    if (!messagesToUse || messagesToUse.length === 0) {
      onDebugInfo?.('⚠️ No chat messages available for PDF generation')
      return { findings, insights, recommendations }
    }

    // Analyze assistant messages for findings and insights
    messagesToUse.forEach((message: any) => {
      if (message.role === 'assistant' && message.content) {
        const content = message.content.toLowerCase()
        
        // Look for findings (issues, problems, errors)
        if (content.includes('error') || content.includes('issue') || content.includes('problem') || 
            content.includes('failed') || content.includes('broken') || content.includes('down')) {
          const sentences = message.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10)
          sentences.forEach((sentence: string) => {
            if (sentence.toLowerCase().includes('error') || sentence.toLowerCase().includes('issue') || 
                sentence.toLowerCase().includes('problem') || sentence.toLowerCase().includes('failed')) {
              findings.push(sentence.trim())
            }
          })
        }
        
        // Look for insights (analysis, observations)
        if (content.includes('analysis') || content.includes('observe') || content.includes('found') || 
            content.includes('detected') || content.includes('identified') || content.includes('shows')) {
          const sentences = message.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10)
          sentences.forEach((sentence: string) => {
            if (sentence.toLowerCase().includes('analysis') || sentence.toLowerCase().includes('observe') || 
                sentence.toLowerCase().includes('found') || sentence.toLowerCase().includes('detected')) {
              insights.push(sentence.trim())
            }
          })
        }
        
        // Look for recommendations (suggestions, actions)
        if (content.includes('recommend') || content.includes('suggest') || content.includes('should') || 
            content.includes('action') || content.includes('fix') || content.includes('resolve')) {
          const sentences = message.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10)
          sentences.forEach((sentence: string) => {
            if (sentence.toLowerCase().includes('recommend') || sentence.toLowerCase().includes('suggest') || 
                sentence.toLowerCase().includes('should') || sentence.toLowerCase().includes('action')) {
              recommendations.push(sentence.trim())
            }
          })
        }
      }
    })

    // Remove duplicates and limit to top findings
    return {
      findings: [...new Set(findings)].slice(0, 5),
      insights: [...new Set(insights)].slice(0, 5),
      recommendations: [...new Set(recommendations)].slice(0, 5)
    }
  }

  // Get conversation summary for each agent
  const getAgentConversationSummary = (agentName: string): string => {
    // First check if we have integrated agent sessions
    if (activeInvestigation?.agentSessions && activeInvestigation.agentSessions[agentName]) {
      const agentMessages = activeInvestigation.agentSessions[agentName]
      if (agentMessages && agentMessages.length > 0) {
        const assistantMessages = agentMessages.filter((msg: any) => msg.role === 'assistant')
        if (assistantMessages.length > 0) {
          const lastMessage = assistantMessages[assistantMessages.length - 1]
          if (lastMessage && lastMessage.content) {
            // Extract first few sentences as summary
            const sentences = lastMessage.content.split(/[.!?]+/).slice(0, 2)
            return sentences.join('. ').trim() + '.'
          }
        }
        return `Conversation recorded with ${agentMessages.length} messages`
      }
    }
    
    // Fallback to current chat messages if no integrated sessions
    const messagesToUse = activeInvestigation?.chatMessages || chatMessages || []
    if (!messagesToUse || messagesToUse.length === 0) {
      return 'No conversation data available'
    }

    // If we have any assistant messages, assume the agent was used
    const assistantMessages = messagesToUse.filter((msg: any) => msg.role === 'assistant')
    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[assistantMessages.length - 1]
      if (lastMessage && lastMessage.content) {
        // Extract first few sentences as summary
        const sentences = lastMessage.content.split(/[.!?]+/).slice(0, 2)
        return sentences.join('. ').trim() + '.'
      }
      return 'Conversation recorded with this agent'
    } else {
      return 'Not used in this investigation'
    }
  }

  const exportInvestigationReport = async (investigation: any, format: 'json' | 'pdf' = 'json') => {
    // Prevent duplicate downloads
    if (isDownloading) {
      onDebugInfo?.('⚠️ Download already in progress. Please wait...')
      return
    }
    
    // Reset download state first
    setIsDownloading(false)
    setDownloadProgress('')
    
    // Small delay to ensure state is reset
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setIsDownloading(true)
    setDownloadProgress(`Preparing ${format.toUpperCase()} export...`)
    onDebugInfo?.(`🔄 Starting ${format.toUpperCase()} export for: ${investigation.name}`)
    
    const report = {
      title: `Investigation Report: ${investigation.name}`,
      timestamp: new Date().toLocaleString(),
      investigation: {
        ...investigation,
        duration: Math.round(investigation.duration / 60000) // Convert to minutes
      },
      summary: {
        totalAgents: investigation.agents.length,
        duration: `${Math.round(investigation.duration / 60000)} minutes`,
        status: investigation.status
      }
    }
    
            onDebugInfo?.('✅ Report data generated successfully')
        
        try {
          if (format === 'pdf') {
            setDownloadProgress('Generating beautiful PDF...')
            onDebugInfo?.('📄 Creating PDF with professional design...')
            
            // Calculate which agents were actually used based on integrated sessions
            const agentSessions = activeInvestigation?.agentSessions || {}
            const usedAgents = Object.keys(agentSessions).filter(agentName => {
              const messages = agentSessions[agentName]
              return messages && messages.length > 0
            })
            
            // If no agent sessions found, try to get from current chat sessions
            if (usedAgents.length === 0 && agentChatSessions) {
              const chatSessionAgents = Object.keys(agentChatSessions).filter(agentName => {
                const session = agentChatSessions[agentName]
                return session && session.messages && session.messages.length > 0
              })
              
              if (chatSessionAgents.length > 0) {
                // Use chat sessions as fallback
                chatSessionAgents.forEach(agentName => {
                  agentSessions[agentName] = agentChatSessions[agentName].messages
                })
                usedAgents.push(...chatSessionAgents)
              }
            }
            
            // If no integrated sessions, fallback to current chat messages
            const messagesToUse = usedAgents.length === 0 ? (activeInvestigation?.chatMessages || chatMessages || []) : []
            
            // Debug logging
            console.log('PDF Generation Debug:', {
              totalAgents: investigation.agents.length,
              usedAgentsCount: usedAgents.length,
              messagesCount: messagesToUse.length,
              agentSessions: Object.keys(agentSessions),
              usedAgents: usedAgents,
              allAgents: investigation.agents
            })
            
            // Create beautiful PDF using jsPDF
            const { default: jsPDF } = await import('jspdf')
            const doc = new jsPDF()
        
        // Set up colors and styling
        const primaryColor = [59, 130, 246] // Blue
        const secondaryColor = [16, 185, 129] // Green
        const accentColor = [245, 158, 11] // Orange
        const textColor = [31, 41, 55] // Dark gray
        
        // Page settings
        const pageHeight = doc.internal.pageSize.height
        const pageWidth = doc.internal.pageSize.width
        const margin = 20
        const lineHeight = 6
        let currentY = margin
        
        // Helper function to check if we need a new page
        const checkPageBreak = (requiredSpace: number = 20) => {
          if (currentY + requiredSpace > pageHeight - margin) {
            doc.addPage()
            currentY = margin
            return true
          }
          return false
        }
        
        // Helper function to add colored rectangle
        const addColoredRect = (x: number, y: number, w: number, h: number, color: number[]) => {
          doc.setFillColor(color[0], color[1], color[2])
          doc.rect(x, y, w, h, 'F')
        }
        
        // Helper function to clean and sanitize text for PDF
        const cleanTextForPDF = (text: string): string => {
          return text
            .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '') // Remove non-printable characters
            .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
        }

        // Helper function to add text with styling and page break handling
        const addStyledText = (text: string, x: number, y: number, fontSize: number, color: number[] = textColor, isBold: boolean = false, maxWidth?: number) => {
          // Clean text before adding to PDF
          const cleanText = cleanTextForPDF(text)
          
          doc.setFontSize(fontSize)
          doc.setTextColor(color[0], color[1], color[2])
          if (isBold) doc.setFont('helvetica', 'bold')
          else doc.setFont('helvetica', 'normal')
          
          if (maxWidth) {
            // Split text if it's too long
            const lines = doc.splitTextToSize(cleanText, maxWidth)
            lines.forEach((line: string, index: number) => {
              if (checkPageBreak()) {
                // Recalculate y position after page break
                doc.text(line, x, currentY + (index * lineHeight))
              } else {
                doc.text(line, x, y + (index * lineHeight))
              }
            })
            return lines.length * lineHeight
          } else {
            doc.text(cleanText, x, y)
            return lineHeight
          }
        }
        
        // Header with gradient effect
        addColoredRect(0, 0, pageWidth, 30, primaryColor)
        addStyledText('SRE INVESTIGATION REPORT', margin, 20, 18, [255, 255, 255], true)
        currentY = 40
        
        // Investigation title
        checkPageBreak(20)
        addStyledText(investigation.name, margin, currentY, 16, primaryColor, true, pageWidth - (margin * 2))
        currentY += 15
        
        // Status badge
        checkPageBreak(15)
        const statusColor = investigation.status === 'completed' ? secondaryColor : accentColor
        addColoredRect(margin, currentY, 30, 8, statusColor)
        addStyledText(investigation.status.toUpperCase(), margin + 5, currentY + 6, 8, [255, 255, 255], true)
        currentY += 20
        
        // Executive Summary
        checkPageBreak(30)
        addStyledText('EXECUTIVE SUMMARY', margin, currentY, 14, primaryColor, true)
        currentY += 8
        addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
        currentY += 15
        
        const startTime = new Date(investigation.startTime)
        const endTime = investigation.endTime ? new Date(investigation.endTime) : new Date()
        const duration = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000)) // Ensure minimum 1 minute
        
        // Fix end time if it's in the past (wrong timezone issue)
        const correctedEndTime = endTime < startTime ? new Date() : endTime
        
        checkPageBreak(40)
        addStyledText(`Investigation Duration: ${duration} minute${duration !== 1 ? 's' : ''}`, margin, currentY, 10)
        currentY += lineHeight + 2
        
        // Calculate actual agents used for executive summary
        const execSummaryAgentsUsed = usedAgents.length
        addStyledText(`Total Agents Used: ${execSummaryAgentsUsed}`, margin, currentY, 10)
        currentY += lineHeight + 2
        addStyledText(`Start Time: ${startTime.toLocaleString()}`, margin, currentY, 10)
        currentY += lineHeight + 2
        addStyledText(`End Time: ${correctedEndTime.toLocaleString()}`, margin, currentY, 10)
        currentY += 20
        
        // Investigation Flow
        checkPageBreak(30)
        addStyledText('INVESTIGATION FLOW', margin, currentY, 14, primaryColor, true)
        currentY += 8
        addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
        currentY += 15
        
        investigation.agents.forEach((agent: string, index: number) => {
          checkPageBreak(25)
          
          // Agent step box
          addColoredRect(margin, currentY, pageWidth - (margin * 2), 15, [248, 250, 252])
          addStyledText(`Step ${index + 1}: ${agent}`, margin + 5, currentY + 8, 10, primaryColor, true)
          
          // Time marker
          const stepTime = new Date(startTime.getTime() + (index * duration / investigation.agents.length * 60000))
          addStyledText(`⏰ ${stepTime.toLocaleTimeString()}`, pageWidth - 60, currentY + 8, 8, accentColor)
          
          currentY += 20
        })
        
        // Agent Summary
        currentY += 10
        checkPageBreak(30)
        addStyledText('AGENT SUMMARY', margin, currentY, 14, primaryColor, true)
        currentY += 8
        addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
        currentY += 15
        
        // If no agents have conversation data, show all agents but mark as unused
        const agentsToShow = usedAgents.length > 0 ? usedAgents : investigation.agents
        
        agentsToShow.forEach((agent: string) => {
          checkPageBreak(25)
          addStyledText(`• ${agent}`, margin, currentY, 10)
          currentY += lineHeight
          const descriptionHeight = addStyledText(`  Role: ${getAgentDescription(agent)}`, margin + 5, currentY, 8, [107, 114, 128], false, pageWidth - (margin * 2) - 10)
          currentY += descriptionHeight + 5
          
          // Add conversation summary for this agent
          const conversationSummary = getAgentConversationSummary(agent)
          if (conversationSummary && conversationSummary !== 'No conversation data available' && conversationSummary !== 'No conversation with this agent recorded') {
            checkPageBreak(15)
            const summaryHeight = addStyledText(`  Summary: ${conversationSummary}`, margin + 5, currentY, 8, [59, 130, 246], false, pageWidth - (margin * 2) - 10)
            currentY += summaryHeight + 5
          } else {
            checkPageBreak(10)
            addStyledText(`  Status: Not used in this investigation`, margin + 5, currentY, 8, [239, 68, 68], false, pageWidth - (margin * 2) - 10)
            currentY += lineHeight + 5
          }
        })
        
        // Overall Summary
        currentY += 10
        checkPageBreak(40)
        addStyledText('OVERALL SUMMARY', margin, currentY, 14, primaryColor, true)
        currentY += 8
        addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
        currentY += 15
        
        // Calculate actual usage for summary
        const actualAgentsUsed = usedAgents.length
        const summaryText1 = `This investigation utilized ${actualAgentsUsed} specialized agent${actualAgentsUsed > 1 ? 's' : ''} to systematically analyze the issue.`
        const height1 = addStyledText(summaryText1, margin, currentY, 10, textColor, false, pageWidth - (margin * 2))
        currentY += height1 + 5
        
        checkPageBreak(15)
        const summaryText2 = `The investigation was completed in ${duration} minute${duration !== 1 ? 's' : ''} with detailed analysis and findings.`
        const height2 = addStyledText(summaryText2, margin, currentY, 10, textColor, false, pageWidth - (margin * 2))
        currentY += height2 + 5
        
        checkPageBreak(15)
        // Determine correct status based on progress
        const isCompleted = currentStep >= investigation.agents.length - 1
        const statusText = `Status: ${isCompleted ? 'Successfully completed' : 'In progress'}`
        addStyledText(statusText, margin, currentY, 10, textColor, false, pageWidth - (margin * 2))
        currentY += 20
        
        // Extract findings from actual chat messages
        const { findings, insights, recommendations } = extractFindingsFromChat()
        
        // Debug Information Section
        checkPageBreak(40)
        addStyledText('DEBUG INFORMATION', margin, currentY, 14, primaryColor, true)
        currentY += 8
        addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
        currentY += 15
        
        // Show debug info from the investigation
        const debugMessages = [
          `Investigation ID: ${investigation.id}`,
          `Total Agents in Template: ${investigation.agents.length}`,
          `Agents with Chat Sessions: ${usedAgents.length}`,
          `Agent Sessions: ${Object.keys(agentSessions).join(', ')}`,
          `Investigation Status: ${investigation.status}`,
          `Current Step: ${currentStep + 1}`,
          `Report Generated: ${new Date().toLocaleString()}`
        ]
        
        debugMessages.forEach((debugMsg: string) => {
          checkPageBreak(15)
          const debugHeight = addStyledText(`• ${debugMsg}`, margin, currentY, 8, [107, 114, 128], false, pageWidth - (margin * 2))
          currentY += debugHeight + 5
        })
        
        currentY += 10
        
        // Variables already calculated at the beginning of PDF generation
        
        // Findings Section (from actual chat content)
        if (findings.length > 0) {
          checkPageBreak(40)
          addStyledText('KEY FINDINGS', margin, currentY, 14, primaryColor, true)
          currentY += 8
          addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
          currentY += 15
          
          findings.forEach((finding: string, index: number) => {
            checkPageBreak(20)
            const findingText = `${index + 1}. ${finding}`
            const findingHeight = addStyledText(findingText, margin, currentY, 10, textColor, false, pageWidth - (margin * 2))
            currentY += findingHeight + 8
          })
          currentY += 10
        }
        
        // Insights Section (from actual chat content)
        if (insights.length > 0) {
          checkPageBreak(40)
          addStyledText('ANALYSIS INSIGHTS', margin, currentY, 14, primaryColor, true)
          currentY += 8
          addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
          currentY += 15
          
          insights.forEach((insight: string, index: number) => {
            checkPageBreak(20)
            const insightText = `${index + 1}. ${insight}`
            const insightHeight = addStyledText(insightText, margin, currentY, 10, textColor, false, pageWidth - (margin * 2))
            currentY += insightHeight + 8
          })
          currentY += 10
        }
        
        // Recommendations Section (from actual chat content)
        if (recommendations.length > 0) {
          checkPageBreak(40)
          addStyledText('RECOMMENDATIONS', margin, currentY, 14, primaryColor, true)
          currentY += 8
          addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
          currentY += 15
          
          recommendations.forEach((recommendation: string, index: number) => {
            checkPageBreak(20)
            const recText = `${index + 1}. ${recommendation}`
            const recHeight = addStyledText(recText, margin, currentY, 10, textColor, false, pageWidth - (margin * 2))
            currentY += recHeight + 8
          })
          currentY += 10
        }
        
        // Investigation Progress Section
        checkPageBreak(40)
        addStyledText('INVESTIGATION PROGRESS', margin, currentY, 14, primaryColor, true)
        currentY += 8
        addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
        currentY += 15
        
        // Calculate actual progress based on investigation status
        const actualProgress = investigation.status === 'completed' ? 100 : Math.round((currentStep + 1) / investigation.agents.length * 100)
        const actualStepsCompleted = investigation.status === 'completed' ? investigation.agents.length : currentStep + 1
        
        addStyledText(`Current Progress: ${actualProgress}% (Step ${actualStepsCompleted} of ${investigation.agents.length})`, margin, currentY, 10)
        currentY += lineHeight + 2
        
        const nextAgent = investigation.status === 'completed' 
          ? 'Investigation Complete' 
          : (currentStep + 1 < investigation.agents.length ? investigation.agents[currentStep + 1] : 'Investigation Complete')
        addStyledText(`Next Agent: ${nextAgent}`, margin, currentY, 10)
        currentY += lineHeight + 2
        addStyledText(`Report Generated: ${new Date().toLocaleString()}`, margin, currentY, 10)
        currentY += 20
        
        // Individual Agent Conversations Section
        if (usedAgents.length > 0) {
          checkPageBreak(40)
          addStyledText('AGENT CONVERSATIONS', margin, currentY, 14, primaryColor, true)
          currentY += 8
          addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
          currentY += 15
          
          usedAgents.forEach((agentName: string) => {
            checkPageBreak(30)
            
            // Agent header
            addStyledText(`🤖 ${agentName}`, margin, currentY, 12, primaryColor, true)
            currentY += lineHeight + 5
            
            const agentMessages = agentSessions[agentName] || []
            if (agentMessages.length > 0) {
              // Show last few messages for this agent
              const recentMessages = agentMessages.slice(-4) // Last 4 messages per agent
              recentMessages.forEach((message: any) => {
                checkPageBreak(25)
                
                const isUser = message.role === 'user'
                const roleText = isUser ? '👤 User' : '🤖 Agent'
                const timestamp = new Date(message.timestamp).toLocaleTimeString()
                
                // Message header
                addStyledText(`${roleText} - ${timestamp}`, margin + 5, currentY, 8, isUser ? [59, 130, 246] : [16, 185, 129], true)
                currentY += lineHeight
                
                // Message content (truncated if too long)
                const maxLength = 600
                const content = message.content.length > maxLength 
                  ? message.content.substring(0, maxLength) + '...' 
                  : message.content
                
                const contentHeight = addStyledText(content, margin + 10, currentY, 9, textColor, false, pageWidth - (margin * 2) - 15)
                currentY += contentHeight + 8
              })
              
              if (agentMessages.length > 4) {
                checkPageBreak(10)
                addStyledText(`... and ${agentMessages.length - 4} more messages`, margin + 5, currentY, 8, [107, 114, 128], false, pageWidth - (margin * 2) - 10)
                currentY += lineHeight + 5
              }
            } else {
              addStyledText(`No conversation recorded with ${agentName}`, margin + 5, currentY, 9, [107, 114, 128], false, pageWidth - (margin * 2) - 10)
              currentY += lineHeight + 5
            }
            
            currentY += 10 // Space between agents
          })
        }
        
        // General Conversation History Section (if there are chat messages)
        if (messagesToUse && messagesToUse.length > 0 && usedAgents.length === 0) {
          checkPageBreak(40)
          addStyledText('CONVERSATION HISTORY', margin, currentY, 14, primaryColor, true)
          currentY += 8
          addColoredRect(margin, currentY, pageWidth - (margin * 2), 0.5, primaryColor)
          currentY += 15
          
          // Show last few messages to avoid overwhelming the report
          const recentMessages = messagesToUse.slice(-6) // Last 6 messages
          recentMessages.forEach((message: any) => {
            checkPageBreak(30)
            
            const isUser = message.role === 'user'
            const roleText = isUser ? '👤 User' : '🤖 Agent'
            const timestamp = new Date(message.timestamp).toLocaleTimeString()
            
            // Message header
            addStyledText(`${roleText} - ${timestamp}`, margin, currentY, 8, isUser ? [59, 130, 246] : [16, 185, 129], true)
            currentY += lineHeight
            
            // Message content (truncated if too long)
            const maxLength = 800 // Increased from 500
            const content = message.content.length > maxLength 
              ? message.content.substring(0, maxLength) + '...' 
              : message.content
            
            const contentHeight = addStyledText(content, margin + 5, currentY, 9, textColor, false, pageWidth - (margin * 2) - 10)
            currentY += contentHeight + 10
          })
          
          if (messagesToUse.length > 6) {
            checkPageBreak(15)
            addStyledText(`... and ${messagesToUse.length - 6} more messages`, margin, currentY, 8, [107, 114, 128], false, pageWidth - (margin * 2))
            currentY += lineHeight + 5
          }
        }
        
        // Footer on last page
        const footerY = pageHeight - 20
        addColoredRect(0, footerY - 5, pageWidth, 10, [248, 250, 252])
        addStyledText(`Generated by SRE IDE on ${new Date().toLocaleString()}`, margin, footerY, 8, [107, 114, 128])
        addStyledText(`Page ${doc.getNumberOfPages()}`, pageWidth - 40, footerY, 8, [107, 114, 128])
        
        // Save PDF
        setDownloadProgress('Saving PDF file...')
        try {
          doc.save(`investigation-report-${investigation.id}.pdf`)
          setDownloadProgress('')
          setIsDownloading(false)
          onDebugInfo?.(`✅ Successfully exported beautiful PDF report: ${investigation.name}`)
        } catch (pdfError) {
          console.error('PDF save error:', pdfError)
          setDownloadProgress('')
          setIsDownloading(false)
          onDebugInfo?.(`❌ PDF save failed: ${pdfError}`)
          alert(`❌ PDF Export Failed!\n\nError: ${pdfError}\n\nPlease try again.`)
          return
        }
        
        // Show VISUAL download alert
        setDownloadAlertMessage(`📄 PDF Report Downloaded!\n\nFile: investigation-report-${investigation.id}.pdf\n\nSaved to your Downloads folder.`)
        setShowDownloadAlert(true)
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowDownloadAlert(false)
        }, 5000)
        
      } else {
        // JSON export
        setDownloadProgress('Preparing JSON export...')
        onDebugInfo?.('📋 Creating JSON report...')
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `investigation-report-${investigation.id}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        setDownloadProgress('')
        setIsDownloading(false)
        onDebugInfo?.(`✅ Successfully exported JSON report: ${investigation.name}`)
        onDebugInfo?.('✅ Export completed successfully')
        
        // Show VISUAL download alert
        setDownloadAlertMessage(`📋 JSON Report Downloaded!\n\nFile: investigation-report-${investigation.id}.json\n\nSaved to your Downloads folder.`)
        setShowDownloadAlert(true)
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowDownloadAlert(false)
        }, 5000)
      }
    } catch (error) {
      console.error('Export failed:', error)
      setDownloadProgress('')
      setIsDownloading(false)
      onDebugInfo?.(`❌ Export failed: ${error}`)
         }
   }

  const continueInvestigation = (investigation: any) => {
    // Create a new investigation based on the completed one
    const newInvestigation = {
      ...investigation,
      id: `inv-${Date.now()}`,
      startTime: new Date().toISOString(),
      status: 'active',
      currentAgentIndex: 0,
      findings: [],
      recommendations: []
    }
    
    setActiveInvestigation(newInvestigation)
    setCurrentStep(0)
    onDebugInfo?.(`Continuing investigation: ${investigation.name}`)
    
    // Start chat with first agent
    const firstAgentName = investigation.agents[0]
    const firstAgent = agents.find(a => a.name === firstAgentName)
    
    if (firstAgent) {
      onStartChat(firstAgent)
      onDebugInfo?.(`Continuing investigation with agent: ${firstAgent.name}`)
    } else {
      onDebugInfo?.(`Agent ${firstAgentName} not found for continuation`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* VISUAL DOWNLOAD ALERT - BIG POPUP */}
      {showDownloadAlert && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--color-success)',
          color: 'white',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 9999,
          border: '2px solid var(--color-success)',
          textAlign: 'center',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          minWidth: '400px',
          animation: 'status-pulse 2s infinite'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <CheckCircle style={{ width: '3rem', height: '3rem', color: 'white' }} />
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-sm)' }}>
                🎉 DOWNLOAD COMPLETE! 🎉
              </div>
              <div style={{ fontSize: '1rem', whiteSpace: 'pre-line' }}>
                {downloadAlertMessage}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDownloadAlert(false)}
            className="btn btn-ghost"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              marginTop: 'var(--spacing-md)'
            }}
          >
            ✅ Got it!
          </button>
        </div>
      )}
      
      {/* Error Display */}
      {investigationError && (
        <div className="card fade-in-up" style={{
          background: 'var(--color-error)10',
          borderColor: 'var(--color-error)20',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          <AlertTriangle style={{ width: '1.5rem', height: '1.5rem', color: 'var(--color-error)' }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--color-error)', margin: 0, fontWeight: '600', fontSize: '0.875rem' }}>Investigation Error</p>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.75rem', fontFamily: 'var(--font-family-primary)' }}>{investigationError}</p>
          </div>
          <button
            onClick={() => setInvestigationError(null)}
            className="btn btn-ghost"
            style={{
              color: 'var(--color-error)',
              padding: 'var(--spacing-xs)',
              minWidth: 'auto'
            }}
          >
            <XCircle style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isStartingInvestigation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            background: 'var(--color-bg-secondary)',
            padding: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            maxWidth: '400px',
            animation: 'fadeInUp 0.3s ease-out'
          }}>
            <Loader2 style={{ 
              width: '3rem', 
              height: '3rem', 
              color: 'var(--color-primary)',
              margin: '0 auto var(--spacing-md)',
              animation: 'spin 1s linear infinite'
            }} />
            <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 var(--spacing-sm) 0', fontSize: '1.125rem' }}>
              Starting Investigation
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.875rem' }}>
              Setting up agents and preparing investigation workflow...
            </p>
          </div>
        </div>
      )}

      {/* Active Investigation */}
      {activeInvestigation && (
        <div className="card slide-in-right" style={{
          background: 'var(--color-primary)10',
          borderColor: 'var(--color-primary)20',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div className="card-header">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Search style={{ width: '1.25rem', height: '1.25rem' }} />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0, color: 'var(--color-primary)' }}>
                  Active Investigation: {activeInvestigation.name}
                </h3>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '0.875rem', 
                  margin: 0,
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  Started {new Date(activeInvestigation.startTime).toLocaleString()}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                onClick={() => exportInvestigationReport(activeInvestigation, 'pdf')}
                disabled={isDownloading}
                className="btn btn-error"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.875rem'
                }}
              >
                <Download style={{ width: '1rem', height: '1rem' }} />
                Export PDF
              </button>
              <button
                onClick={() => exportInvestigationReport(activeInvestigation, 'json')}
                disabled={isDownloading}
                className="btn btn-warning"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.875rem'
                }}
              >
                <FileText style={{ width: '1rem', height: '1rem' }} />
                Export JSON
              </button>
              <button
                onClick={completeInvestigation}
                className="btn btn-success"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.875rem'
                }}
              >
                <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                Complete
              </button>
            </div>
          </div>

          {isDownloading && (
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-warning)20',
              borderTop: '1px solid var(--color-warning)30',
              borderRadius: '0 0 var(--radius-md) var(--radius-md)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                color: 'var(--color-warning)'
              }}>
                <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{downloadProgress}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-3">
        <div className="metric-card fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="metric-icon" style={{ 
            background: 'var(--color-info)20',
            borderColor: 'var(--color-info)40'
          }}>
            <Search style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-info)' }} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Active Investigations</p>
            <p className="metric-value">{activeInvestigation ? '1' : '0'}</p>
          </div>
        </div>
        
        <div className="metric-card fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="metric-icon" style={{ 
            background: 'var(--color-success)20',
            borderColor: 'var(--color-success)40'
          }}>
            <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Completed</p>
            <p className="metric-value">{investigationHistory.length}</p>
          </div>
        </div>
        
        <div className="metric-card fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="metric-icon" style={{ 
            background: 'var(--color-warning)20',
            borderColor: 'var(--color-warning)40'
          }}>
            <Clock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-warning)' }} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Avg Duration</p>
            <p className="metric-value">
              {investigationHistory.length > 0 
                ? `${Math.round(investigationHistory.reduce((acc, inv) => acc + inv.duration, 0) / investigationHistory.length / 60000)}m`
                : 'N/A'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Current Agent */}
      {activeInvestigation && (
        <div className="card slide-in-right" style={{
          background: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-primary)30',
          animation: 'slideInRight 0.4s ease-out'
        }}>
          <div className="card-header">
            <h4 style={{ color: 'var(--color-text-primary)', margin: 0, fontWeight: '600' }}>
              Current Agent
            </h4>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--spacing-md)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-primary)'
          }}>
            <div>
              <p style={{ 
                color: 'var(--color-text-primary)', 
                margin: '0 0 var(--spacing-xs) 0', 
                fontSize: '0.875rem', 
                fontWeight: '600' 
              }}>
                {activeInvestigation.agents[currentStep] || 'No agent selected'}
              </p>
              <p style={{ 
                color: 'var(--color-text-secondary)', 
                margin: 0, 
                fontSize: '0.75rem',
                fontFamily: 'var(--font-family-primary)'
              }}>
                Step {currentStep + 1} of {activeInvestigation.agents.length}
              </p>
              {/* Show chat session status */}
              {activeInvestigation.agents.map((agentName: string, index: number) => {
                const hasChatSession = agentChatSessions[agentName] && agentChatSessions[agentName].messages.length > 0
                return (
                  <div key={agentName} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginTop: 'var(--spacing-xs)',
                    fontSize: '0.7rem'
                  }}>
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: hasChatSession ? 'var(--color-success)' : 'var(--color-text-muted)',
                      opacity: index === currentStep ? 1 : 0.5
                    }} />
                    <span style={{
                      color: index === currentStep ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: index === currentStep ? '600' : '400'
                    }}>
                      {agentName} {hasChatSession ? `(${agentChatSessions[agentName].messages.length} msgs)` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(currentStep - 1)
                    setActiveInvestigation((prev: any) => ({
                      ...prev,
                      currentStep: currentStep - 1
                    }))
                    onDebugInfo?.(`⬅️ Moved to previous agent: ${activeInvestigation.agents[currentStep - 1]}`)
                  }
                }}
                disabled={currentStep <= 0}
                className="btn btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.875rem'
                }}
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  // Go to chat with current agent
                  const currentAgentName = activeInvestigation.agents[currentStep]
                  const currentAgent = agents.find(a => 
                    a.name === currentAgentName || 
                    a.name.toLowerCase().includes(currentAgentName.toLowerCase())
                  )
                  if (currentAgent) {
                    onStartChat(currentAgent)
                    // Switch to chat tab
                    window.dispatchEvent(new CustomEvent('switchToChat'))
                  }
                }}
                className="btn btn-success"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.875rem'
                }}
              >
                <MessageSquare style={{ width: '1rem', height: '1rem' }} />
                Go to Chat
              </button>
              <button
                onClick={integrateChatSessionsWithInvestigation}
                className="btn btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.875rem'
                }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Sync Chat
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep >= activeInvestigation.agents.length - 1}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.875rem'
                }}
              >
                <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                Next Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Section */}
      <div className="card fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="card-header">
          <h3 className="card-title">Quick Start Investigations</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            background: agents.length > 0 ? 'var(--color-success)10' : 'var(--color-error)10',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${agents.length > 0 ? 'var(--color-success)20' : 'var(--color-error)20'}`
          }}>
            <div style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              background: agents.length > 0 ? 'var(--color-success)' : 'var(--color-error)',
              animation: agents.length > 0 ? 'status-pulse 2s infinite' : 'none'
            }} />
            <span style={{ 
              fontSize: '0.75rem', 
              color: agents.length > 0 ? 'var(--color-success)' : 'var(--color-error)',
              fontWeight: '500'
            }}>
              {agents.length > 0 ? `${agents.length} agents ready` : 'No agents available'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-lg)' }}>
          {templates.slice(0, 3).map((template, index) => (
            <button
              key={template.id}
              onClick={() => startInvestigation(template)}
              disabled={isStartingInvestigation || agents.length === 0}
              className="btn btn-ghost"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-lg)',
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border-primary)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.2s ease',
                animationDelay: `${0.5 + index * 0.1}s`
              }}
            >
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <template.icon style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ 
                  color: 'var(--color-text-primary)', 
                  margin: '0 0 var(--spacing-xs) 0', 
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {template.name}
                </h4>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  margin: 0, 
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  {template.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Investigation */}
      <div className="card fade-in-up" style={{ animationDelay: '0.6s' }}>
        <div className="card-header">
          <h3 className="card-title">Custom Investigation</h3>
          <button
            onClick={() => setShowCustomInvestigation(!showCustomInvestigation)}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem' }}
          >
            {showCustomInvestigation ? 'Hide' : 'Create Custom'}
          </button>
        </div>
        {showCustomInvestigation && (
          <div style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-primary)'
          }}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h4 style={{ 
                color: 'var(--color-text-primary)', 
                margin: '0 0 var(--spacing-sm) 0', 
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Select Agents
              </h4>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                {agents.map((agent) => (
                  <button
                    key={agent.name}
                    onClick={() => {
                      setSelectedAgents(prev => 
                        prev.includes(agent.name) 
                          ? prev.filter(name => name !== agent.name)
                          : [...prev, agent.name]
                      )
                    }}
                    className="btn"
                    style={{
                      background: selectedAgents.includes(agent.name) ? 'var(--color-success)' : 'var(--color-bg-tertiary)',
                      color: selectedAgents.includes(agent.name) ? 'white' : 'var(--color-text-primary)',
                      border: `1px solid ${selectedAgents.includes(agent.name) ? 'var(--color-success)' : 'var(--color-border-primary)'}`,
                      fontSize: '0.75rem',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {selectedAgents.includes(agent.name) ? '✓' : '○'} {agent.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => startCustomInvestigation()}
              disabled={selectedAgents.length === 0 || isStartingInvestigation}
              className="btn btn-success"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: '0.875rem'
              }}
            >
              <Play style={{ width: '1rem', height: '1rem' }} />
              Start Custom Investigation
            </button>
          </div>
        )}
      </div>

      {/* Investigation Templates */}
      <div className="card fade-in-up" style={{ animationDelay: '0.7s' }}>
        <div className="card-header">
          <h3 className="card-title">Investigation Templates</h3>
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            {templates.length} templates available
          </span>
        </div>
        <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-lg)' }}>
          {templates.map((template, index) => (
            <div
              key={template.id}
              className="card"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-lg)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                animationDelay: `${0.8 + index * 0.1}s`
              }}
              onClick={() => startInvestigation(template)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: template.color.includes('red') ? 'var(--color-error)' :
                             template.color.includes('orange') ? 'var(--color-warning)' :
                             template.color.includes('blue') ? 'var(--color-primary)' :
                             template.color.includes('purple') ? 'var(--color-info)' :
                             template.color.includes('green') ? 'var(--color-success)' : 'var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <template.icon style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    <h4 style={{ color: 'var(--color-text-primary)', margin: 0, fontWeight: '600', fontSize: '0.875rem' }}>
                      {template.name}
                    </h4>
                    <span style={{
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      background: template.urgency === 'P0' ? 'var(--color-error)20' :
                                 template.urgency === 'P1' ? 'var(--color-warning)20' :
                                 template.urgency === 'P2' ? 'var(--color-primary)20' :
                                 'var(--color-success)20',
                      color: template.urgency === 'P0' ? 'var(--color-error)' :
                             template.urgency === 'P1' ? 'var(--color-warning)' :
                             template.urgency === 'P2' ? 'var(--color-primary)' :
                             'var(--color-success)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      fontFamily: 'var(--font-family-primary)'
                    }}>
                      {template.urgency}
                    </span>
                  </div>
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '0.75rem', 
                    margin: '0 0 var(--spacing-sm) 0', 
                    fontFamily: 'var(--font-family-primary)',
                    lineHeight: 1.4
                  }}>
                    {template.description}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                    {template.agents.map((agent) => {
                      const isAvailable = agents.some(a => 
                        a.name === agent || a.name.toLowerCase().includes(agent.toLowerCase())
                      )
                      return (
                        <span
                          key={agent}
                          style={{
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            background: isAvailable ? 'var(--color-success)20' : 'var(--color-error)20',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            color: isAvailable ? 'var(--color-success)' : 'var(--color-error)',
                            border: `1px solid ${isAvailable ? 'var(--color-success)30' : 'var(--color-error)30'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            fontFamily: 'var(--font-family-primary)',
                            fontWeight: '500'
                          }}
                        >
                          {isAvailable ? '✓' : '✗'} {agent}
                        </span>
                      )
                    })}
                  </div>
                  <div style={{
                    marginTop: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    {template.agents.filter(agent => 
                      agents.some(a => a.name === agent || a.name.toLowerCase().includes(agent.toLowerCase()))
                    ).length} of {template.agents.length} agents available
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investigation History */}
      {investigationHistory.length > 0 && (
        <div className="card fade-in-up" style={{ animationDelay: '0.9s' }}>
          <div className="card-header">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 className="card-title">Recent Investigations</h3>
              <button
                onClick={() => {
                  setInvestigationHistory([])
                  localStorage.removeItem('sre-ide-investigation-history')
                  onDebugInfo?.('Cleared investigation history')
                }}
                className="btn btn-error"
                style={{ fontSize: '0.75rem' }}
              >
                Clear History
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {investigationHistory.slice(0, 5).map((inv, index) => (
              <div
                key={inv.id}
                className="card"
                style={{
                  background: 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-md)',
                  border: '1px solid var(--color-border-primary)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.2s ease',
                  animationDelay: `${1.0 + index * 0.1}s`
                }}
              >
                <div>
                  <p style={{ 
                    color: 'var(--color-text-primary)', 
                    margin: '0 0 var(--spacing-xs) 0', 
                    fontSize: '0.875rem', 
                    fontWeight: '600' 
                  }}>
                    {inv.name}
                  </p>
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    margin: 0, 
                    fontSize: '0.75rem', 
                    fontFamily: 'var(--font-family-primary)' 
                  }}>
                    {new Date(inv.endTime).toLocaleString()} • 
                    Duration: {Math.round(inv.duration / 60000)} min
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <button
                    onClick={() => continueInvestigation(inv)}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      fontSize: '0.75rem'
                    }}
                  >
                    <Play style={{ width: '1rem', height: '1rem' }} />
                    Continue
                  </button>
                  <button
                    onClick={() => exportInvestigationReport(inv, 'pdf')}
                    className="btn btn-error"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      fontSize: '0.75rem'
                    }}
                  >
                    <Download style={{ width: '1rem', height: '1rem' }} />
                    PDF
                  </button>
                  <button
                    onClick={() => exportInvestigationReport(inv, 'json')}
                    className="btn btn-warning"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      fontSize: '0.75rem'
                    }}
                  >
                    <FileText style={{ width: '1rem', height: '1rem' }} />
                    JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})