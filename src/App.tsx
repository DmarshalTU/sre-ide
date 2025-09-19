import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { CloudTools } from './components/CloudTools'
import { EnhancedChat } from './components/EnhancedChat'
import { Investigation } from './components/Investigation'
import ToolServerManager from './components/ToolServerManager'
import SessionAnalytics from './components/SessionAnalytics'
import MemoryManager from './components/MemoryManager'
import AlertDashboard from './components/AlertDashboard'
import HookManager from './components/HookManager'
import { getConfig, type KAgentConfig } from './config'
import { KagentAPI } from './lib/kagent'
import type { KagentAgent, KagentSession, ChatMessage } from './lib/kagent'
import './App.css'

// UI Icons
import { 
  CheckCircle,
  MessageSquare, 
  Search,
  Terminal, 
  XCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react'

// Connection status tracking
interface ConnectionStatus {
  connected: boolean
  error?: string
  lastChecked: string
}

// KAgent connector configuration
interface KAgentConnector {
  id: string
  name: string
  config: KAgentConfig
  status: ConnectionStatus
  agents: KagentAgent[]
  isActive: boolean
}

function App() {
  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Multi-connector management
  const [connectors, setConnectors] = useState<KAgentConnector[]>([])
  const [activeConnector, setActiveConnector] = useState<string | null>(null)
  
  // Debug logging
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  
  // Chat state
  const [selectedAgent, setSelectedAgent] = useState<KagentAgent | null>(null)
  const [currentSession, setCurrentSession] = useState<KagentSession | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)
  
  // Chat history management - store chat sessions for each agent
  const [agentChatSessions, setAgentChatSessions] = useState<{
    [agentName: string]: {
      session: any
      messages: ChatMessage[]
      lastActive: string
    }
  }>({})
  
  // Add connector modal state
  const [showAddConnector, setShowAddConnector] = useState(false)
  const [newConnectorName, setNewConnectorName] = useState('')
  const [newConnectorConfig, setNewConnectorConfig] = useState<KAgentConfig>({
    baseUrl: 'localhost',
    port: 8083,
    protocol: 'http',
    timeout: 30000,
    retries: 3,
    environment: 'local'
  })
  
  // Current connector and API instance
  const currentConnector = connectors.find(c => c.id === activeConnector)
  const currentConnectorAPI = currentConnector ? new KagentAPI(currentConnector.config) : null
  
  console.log('App: Connector state', { 
    activeTab,
    activeConnector, 
    connectorsCount: connectors.length, 
    currentConnector: !!currentConnector, 
    currentConnectorAPI: !!currentConnectorAPI,
    connectors: connectors.map(c => ({ id: c.id, name: c.name, connected: c.status.connected }))
  })
  
  // Debug why currentConnectorAPI might be null
  if (!currentConnectorAPI) {
    console.log('App: currentConnectorAPI is null!', {
      activeConnector,
      currentConnector: currentConnector ? {
        id: currentConnector.id,
        name: currentConnector.name,
        config: currentConnector.config
      } : null,
      connectors: connectors.map(c => ({ id: c.id, name: c.name, connected: c.status.connected }))
    })
  }
  
  // Aggregate all agents from all connectors
  const allAgents = connectors.flatMap(c => c.agents)
  
  // Overall connection health
  const overallConnectionStatus: ConnectionStatus = {
    connected: connectors.some(c => c.status.connected),
    lastChecked: new Date().toLocaleTimeString()
  }

  // Initialize default connector on mount
  useEffect(() => {
    console.log('App: Initializing default connector')
    const defaultConnector: KAgentConnector = {
      id: 'default',
      name: 'Default KAgent',
      config: getConfig(),
      status: { connected: false, lastChecked: 'Never' },
      agents: [],
      isActive: true
    }
    console.log('App: Setting connectors and activeConnector', { defaultConnector })
    setConnectors([defaultConnector])
    setActiveConnector('default')
    console.log('App: Calling connectToConnector')
    connectToConnector(defaultConnector)
  }, [])

  // Debug logging utility
  const addDebugInfo = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 199)]) // Increased to 200 messages
  }, [])

  // Memory management - limit chat sessions to prevent memory issues
  const cleanupOldChatSessions = useCallback(() => {
    setAgentChatSessions(prev => {
      const cleaned: typeof prev = {}
      Object.keys(prev).forEach(agentName => {
        const session = prev[agentName]
        if (session && session.messages) {
          // Keep only last 50 messages per agent to prevent memory issues
          cleaned[agentName] = {
            ...session,
            messages: session.messages.slice(-50)
          }
        }
      })
      return cleaned
    })
  }, [])

  // Listen for tab switching events from investigation
  useEffect(() => {
    const handleSwitchToChat = () => {
      setActiveTab('chat')
    }

    window.addEventListener('switchToChat', handleSwitchToChat)
    return () => window.removeEventListener('switchToChat', handleSwitchToChat)
  }, [])

  // Periodic cleanup to prevent memory issues
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupOldChatSessions()
    }, 60000) // Clean up every minute

    return () => clearInterval(cleanupInterval)
  }, [cleanupOldChatSessions])

  // Connect to a KAgent instance
  const connectToConnector = async (connector: KAgentConnector) => {
    try {
      console.log('App: connectToConnector called', { connector })
      addDebugInfo(`🔄 Connecting to ${connector.name}...`)
      const api = new KagentAPI(connector.config)
      console.log('App: Created KagentAPI instance', { api })
      console.log('App: About to call api.getAgents()')
      const agents = await api.getAgents()
      console.log('App: Got agents', { agents })
      
      setConnectors(prev => prev.map(c => 
        c.id === connector.id 
          ? {
              ...c,
              agents,
              status: {
                connected: true,
                lastChecked: new Date().toLocaleTimeString()
              }
            }
          : c
      ))
      
      addDebugInfo(`✅ Connected to ${connector.name}! Found ${agents.length} agents`)
    } catch (error) {
      console.error('App: connectToConnector failed', { connector, error })
      console.error(`Failed to connect to ${connector.name}:`, error)
      
      setConnectors(prev => prev.map(c => 
        c.id === connector.id 
          ? {
              ...c,
              status: {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                lastChecked: new Date().toLocaleTimeString()
              }
            }
          : c
      ))
      
      addDebugInfo(`❌ Connection to ${connector.name} failed: ${error}`)
    }
  }

  // Add a new KAgent connector
  const addConnector = async () => {
    const newConnector: KAgentConnector = {
      id: `connector-${Date.now()}`,
      name: newConnectorName || `KAgent ${connectors.length + 1}`,
      config: newConnectorConfig,
      status: { connected: false, lastChecked: 'Never' },
      agents: [],
      isActive: false
    }
    
    setConnectors(prev => [...prev, newConnector])
    setShowAddConnector(false)
    setNewConnectorName('')
    setNewConnectorConfig({
      baseUrl: 'localhost',
      port: 8083,
      protocol: 'http',
      timeout: 30000,
      retries: 3,
      environment: 'local'
    })
    
    addDebugInfo(`➕ Added new connector: ${newConnector.name}`)
  }

  // Remove a connector
  const removeConnector = (connectorId: string) => {
    setConnectors(prev => prev.filter(c => c.id !== connectorId))
    if (activeConnector === connectorId) {
      const remainingConnectors = connectors.filter(c => c.id !== connectorId)
      setActiveConnector(remainingConnectors.length > 0 ? remainingConnectors[0].id : null)
    }
    addDebugInfo(`🗑️ Removed connector: ${connectors.find(c => c.id === connectorId)?.name}`)
  }

  // Start a chat session with an agent (without switching tabs)
  const startChatWithAgentSilent = async (agent: KagentAgent) => {
    if (!currentConnectorAPI) {
      addDebugInfo('❌ No active connector available')
      return
    }
    
    try {
      addDebugInfo(`Starting chat with agent: ${agent.name}`)
      setSelectedAgent(agent)
      
      // Check if we already have a chat session for this agent
      const existingSession = agentChatSessions[agent.name]
      
      if (existingSession) {
        // Restore existing session
        addDebugInfo(`🔄 Restoring existing chat session for ${agent.name}`)
        setCurrentSession(existingSession.session)
        setChatMessages(existingSession.messages)
        addDebugInfo(`✅ Restored chat session with ${existingSession.messages.length} messages`)
      } else {
        // Create new session
        const sessionName = `Chat with ${agent.name} - ${new Date().toLocaleString()}`
        addDebugInfo(`Creating new session: ${sessionName}`)
        
        const session = await currentConnectorAPI.createSessionWithName(agent.name, sessionName)
        addDebugInfo(`Session created: ${session?.id || 'No ID'}`)
        setCurrentSession(session)
        
        const messages = await currentConnectorAPI.getSessionMessages(session.id)
        addDebugInfo(`Retrieved ${messages.length} messages`)
        setChatMessages(messages)
        
        // Store the new session in our history
        setAgentChatSessions(prev => ({
          ...prev,
          [agent.name]: {
            session,
            messages,
            lastActive: new Date().toISOString()
          }
        }))
        
        addDebugInfo(`✅ New chat session created: ${session.id}`)
      }
      // Don't switch tabs - keep current tab active
    } catch (error) {
      console.error('Failed to start chat:', error)
      addDebugInfo(`❌ Failed to start chat: ${error}`)
      
      // Show error to user
      setChatMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: `Failed to start chat with ${agent.name}. Please check your connection and try again.`,
        timestamp: new Date().toISOString(),
        sessionId: 'error'
      }])
    }
  }

  // Start a chat session with an agent (and switch to chat tab)
  const startChatWithAgent = async (agent: KagentAgent) => {
    await startChatWithAgentSilent(agent)
    setActiveTab('chat')
  }

  // Send a message to the current chat session
  const handleSendMessage = async (message: string) => {
    if (!currentSession || !selectedAgent || !currentConnectorAPI) {
      addDebugInfo(`❌ Cannot send message: missing session, agent, or API`)
      return
    }
    
    setIsSendingMessage(true)
    addDebugInfo(`📤 Sending message to ${selectedAgent.name}: ${message.substring(0, 50)}...`)
    
    // Add user message immediately for better UX
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      sessionId: currentSession.id
    }
    setChatMessages(prev => [...prev, userMessage])
    
    // Update the stored chat history for this agent with user message
    if (selectedAgent) {
      try {
        setAgentChatSessions(prev => ({
          ...prev,
          [selectedAgent.name]: {
            ...prev[selectedAgent.name],
            messages: [...(prev[selectedAgent.name]?.messages || []), userMessage],
            lastActive: new Date().toISOString()
          }
        }))
      } catch (error) {
        console.error('Error updating agent chat sessions:', error)
        addDebugInfo(`❌ Error updating chat history: ${error}`)
      }
    }
    
    try {
      const response = await currentConnectorAPI.sendMessage(currentSession.id, message)
      
      // Convert API response to chat message format
      const chatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || 'No response received',
        timestamp: response.timestamp || new Date().toISOString(),
        sessionId: currentSession.id
      }
      setChatMessages(prev => [...prev, chatMessage])
      
      // Update the stored chat history for this agent
      if (selectedAgent) {
        try {
          setAgentChatSessions(prev => ({
            ...prev,
            [selectedAgent.name]: {
              ...prev[selectedAgent.name],
              messages: [...(prev[selectedAgent.name]?.messages || []), userMessage, chatMessage],
              lastActive: new Date().toISOString()
            }
          }))
        } catch (error) {
          console.error('Error updating agent chat sessions:', error)
          addDebugInfo(`❌ Error updating chat history: ${error}`)
        }
      }
      
      addDebugInfo(`✅ Message sent successfully`)
    } catch (error) {
      console.error('Failed to send message:', error)
      addDebugInfo(`❌ Failed to send message: ${error}`)
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        sessionId: currentSession.id
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Search functionality placeholder
  const handleSearch = (_query: string) => {
    // TODO: Implement search across agents and messages
  }

  // Handle agent selection and start chat
  const handleAgentSelection = async (agent: KagentAgent) => {
    setSelectedAgent(agent)
    await startChatWithAgent(agent)
  }

  // Clear current chat session
  const clearChatSession = () => {
    setCurrentSession(null)
    setSelectedAgent(null)
    setChatMessages([])
    addDebugInfo('Chat session cleared')
  }

  // Start a standalone chat (not part of investigation)
  const startStandaloneChat = async (agent: KagentAgent, initialMessage?: string) => {
    console.log('💬 startStandaloneChat called with:', { agent: agent.name, hasInitialMessage: !!initialMessage })
    if (initialMessage) {
      console.log('📨 Initial message:', initialMessage)
    }
    
    if (!currentConnectorAPI) {
      addDebugInfo('❌ No active connector available')
      return
    }
    
    try {
      addDebugInfo(`Starting standalone chat with agent: ${agent.name}`)
      setSelectedAgent(agent)
      
      // Check if we already have a chat session for this agent
      const existingSession = agentChatSessions[agent.name]
      
      if (existingSession) {
        // Restore existing session
        addDebugInfo(`🔄 Restoring existing chat session for ${agent.name}`)
        setCurrentSession(existingSession.session)
        setChatMessages(existingSession.messages)
        addDebugInfo(`✅ Restored chat session with ${existingSession.messages.length} messages`)
        
        // If we have an initial message, send it immediately
        if (initialMessage) {
          try {
            await currentConnectorAPI.sendMessage(existingSession.session.id, initialMessage)
            // Add the message to the UI immediately without waiting for API refresh
            const userMessage = {
              id: Date.now().toString(),
              role: 'user' as const,
              content: initialMessage,
              timestamp: new Date().toISOString(),
              sessionId: existingSession.session.id
            }
            const updatedMessages = [...existingSession.messages, userMessage]
            setChatMessages(updatedMessages)
            
            // Update the cached session with new messages
            setAgentChatSessions(prev => ({
              ...prev,
              [agent.name]: {
                ...prev[agent.name],
                messages: updatedMessages,
                lastActive: new Date().toISOString()
              }
            }))
            
            addDebugInfo(`📤 Sent initial alert context message to existing session`)
          } catch (error) {
            console.error('Failed to send initial message to existing session:', error)
            addDebugInfo(`❌ Failed to send initial message to existing session: ${error}`)
          }
        }
      } else {
        // Create new session
        const sessionName = `Standalone Chat with ${agent.name} - ${new Date().toLocaleString()}`
        addDebugInfo(`Creating new session: ${sessionName}`)
        
        const session = await currentConnectorAPI.createSessionWithName(agent.name, sessionName)
        setCurrentSession(session)
        
        const messages = await currentConnectorAPI.getSessionMessages(session.id)
        setChatMessages(messages)
        
        // Cache the new session
        setAgentChatSessions(prev => ({
          ...prev,
          [agent.name]: {
            session: session,
            messages: messages,
            lastActive: new Date().toISOString()
          }
        }))
        
        // If we have an initial message, send it immediately
        if (initialMessage) {
          try {
            await currentConnectorAPI.sendMessage(session.id, initialMessage)
            // Refresh messages to show the initial message
            const updatedMessages = await currentConnectorAPI.getSessionMessages(session.id)
            setChatMessages(updatedMessages)
            
            // Update the cached session with new messages
            setAgentChatSessions(prev => ({
              ...prev,
              [agent.name]: {
                ...prev[agent.name],
                messages: updatedMessages,
                lastActive: new Date().toISOString()
              }
            }))
            
            addDebugInfo(`📤 Sent initial alert context message`)
          } catch (error) {
            console.error('Failed to send initial message:', error)
            addDebugInfo(`❌ Failed to send initial message: ${error}`)
          }
        }
        
        addDebugInfo(`✅ Standalone chat session created: ${session.id}`)
      }
      
      setActiveTab('chat')
    } catch (error) {
      console.error('Failed to start standalone chat:', error)
      addDebugInfo(`❌ Failed to start standalone chat: ${error}`)
    }
  }

  // Start chat with agent by ID (for alerts)
  const startChatWithAgentById = async (agentId: string, alertContext?: any) => {
    console.log('🚀 startChatWithAgentById called with:', { agentId, alertContext })
    addDebugInfo(`🚀 Starting chat with agent: ${agentId}`)
    
    if (!currentConnectorAPI) {
      addDebugInfo('❌ No active connector available')
      return
    }

    // Set loading state
    setIsStartingChat(true)

    // Find agent by ID across all connectors
    console.log('🔍 Available agents:', allAgents.map(a => ({ id: a.id, name: a.name })))
    console.log('🎯 Looking for agent with ID:', agentId)
    
    // Convert kagent__NS__k8s_agent to k8s-agent format
    let searchId = agentId
    if (agentId.includes('kagent__NS__')) {
      searchId = agentId.replace('kagent__NS__', '').replace('_agent', '')
      console.log('🔄 Converted agent ID to:', searchId)
    }
    
    // First try to match by exact ID, then by name, then by partial match
    const agent = allAgents.find(a => {
      const idMatch = a.id === agentId || a.id === searchId
      const nameMatch = a.name === agentId || a.name === searchId
      const partialIdMatch = (a.id && a.id.includes(searchId)) || (a.id && a.id.includes(agentId))
      const partialNameMatch = (a.name && a.name.includes(searchId)) || (a.name && a.name.includes(agentId))
      
      const found = idMatch || nameMatch || partialIdMatch || partialNameMatch
      if (found) {
        console.log('🎯 Found match:', { 
          agentId: a.id, 
          agentName: a.name, 
          searchId, 
          originalId: agentId,
          idMatch, nameMatch, partialIdMatch, partialNameMatch
        })
      }
      return found
    })
    
    console.log('✅ Found agent:', agent)
    
    if (!agent) {
      addDebugInfo(`❌ Agent not found: ${agentId}`)
      addDebugInfo(`Available agents: ${allAgents.map(a => `${a.id || 'no-id'}:${a.name || 'no-name'}`).join(', ')}`)
      return
    }

    try {
      addDebugInfo(`Starting chat with agent from alert: ${agent.id || agent.name}`)
      
      // If we have alert context, create a session with context
      if (alertContext) {
        console.log('📋 Alert context received:', alertContext)
        const alertMessage = `🚨 ALERT CONTEXT:
- Event Type: ${alertContext.eventType}
- Resource: ${alertContext.resourceName}
- Namespace: ${alertContext.namespace}
- Severity: ${alertContext.severity}
- Status: ${alertContext.status}
- Message: ${alertContext.message}
- First Seen: ${new Date(alertContext.firstSeen).toLocaleString()}

Please analyze this alert and provide recommendations for resolution. The alert is currently ${alertContext.status} and requires attention.`

        console.log('📝 Alert message created:', alertMessage)
        // Start a session with the alert context
        await startStandaloneChat(agent, alertMessage)
      } else {
        await startStandaloneChat(agent)
      }
    } catch (error) {
      console.error('Failed to start chat with agent from alert:', error)
      addDebugInfo(`❌ Failed to start chat with agent from alert: ${error}`)
    } finally {
      // Clear loading state
      setIsStartingChat(false)
    }
  }


  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          console.log('App: Tab changing from', activeTab, 'to', tab)
          setActiveTab(tab)
        }}
        connectionStatus={overallConnectionStatus}
      />
      
      <div className="main-content">
        <Header 
          title={activeTab} 
          onSearch={handleSearch}
        />
        
        <main className="content-area">
          <div className="fade-in-up">
            {activeTab === 'dashboard' && (
              <div className="slide-in-right">
                <div className="grid grid-cols-1 gap-6">
                  {/* Connector Management Section */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">KAgent Connectors</h2>
                      <button
                        onClick={() => setShowAddConnector(true)}
                        className="btn btn-primary"
                      >
                        <MessageSquare className="icon-sm" />
                        Add Connector
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {connectors.map((connector) => (
                        <div key={connector.id} className="card" style={{ 
                          background: 'var(--color-bg-secondary)',
                          border: connector.id === activeConnector ? '2px solid var(--color-primary)' : '1px solid var(--color-border-primary)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
                                  {connector.name}
                                </h4>
                                <div style={{
                                  width: '0.5rem',
                                  height: '0.5rem',
                                  borderRadius: '50%',
                                  background: connector.status.connected ? 'var(--color-success)' : 'var(--color-error)',
                                  animation: connector.status.connected ? 'status-pulse 2s infinite' : 'none'
                                }} />
                                {connector.id === activeConnector && (
                                  <span style={{
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    background: 'var(--color-primary)20',
                                    color: 'var(--color-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }}>
                                    Active
                                  </span>
                                )}
                              </div>
                              <p style={{ 
                                margin: '0 0 var(--spacing-xs) 0', 
                                fontSize: '0.75rem', 
                                color: 'var(--color-text-secondary)',
                                fontFamily: 'var(--font-family-primary)'
                              }}>
                                {connector.config.protocol}://{connector.config.baseUrl}:{connector.config.port}
                              </p>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '0.75rem', 
                                color: 'var(--color-text-muted)',
                                fontFamily: 'var(--font-family-primary)'
                              }}>
                                {connector.agents.length} agents • {connector.status.connected ? 'Connected' : 'Disconnected'}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                              {connector.id !== activeConnector && (
                                <button
                                  onClick={() => setActiveConnector(connector.id)}
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => connectToConnector(connector)}
                                className="btn btn-ghost"
                                style={{ fontSize: '0.75rem' }}
                              >
                                Reconnect
                              </button>
                              {connectors.length > 1 && (
                                <button
                                  onClick={() => removeConnector(connector.id)}
                                  className="btn btn-error"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions - Prominent Position */}
                  <div className="card" style={{ 
                    background: 'var(--color-primary)05',
                    borderColor: 'var(--color-primary)20',
                    borderWidth: '2px'
                  }}>
                    <div className="card-header">
                      <h2 className="card-title" style={{ color: 'var(--color-primary)' }}>🚀 Quick Actions</h2>
                    </div>
                    <div className="dashboard-grid grid grid-cols-1 md:grid-cols-3 gap-4">
                      <QuickActionButton
                        icon={<MessageSquare />}
                        label="Start Chat"
                        onClick={() => setActiveTab('chat')}
                        color="var(--color-primary)"
                      />
                      <QuickActionButton
                        icon={<Search />}
                        label="Investigate"
                        onClick={() => setActiveTab('investigate')}
                        color="var(--color-warning)"
                      />
                      <QuickActionButton
                        icon={<Terminal />}
                        label="Cloud Tools"
                        onClick={() => setActiveTab('cloud-tools')}
                        color="var(--color-info)"
                      />
                    </div>
                  </div>

                  {/* System Status Overview */}
                  <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Connection Status */}
                    <div className="card">
                      <div className="card-header">
                        <h3 className="card-title">Connection Status</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="metric-card">
                          <div className="metric-icon" style={{ 
                            background: overallConnectionStatus.connected ? 'var(--color-success)20' : 'var(--color-error)20',
                            borderColor: overallConnectionStatus.connected ? 'var(--color-success)40' : 'var(--color-error)40'
                          }}>
                            {overallConnectionStatus.connected ? (
                              <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
                            ) : (
                              <XCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-error)' }} />
                            )}
                          </div>
                          <div className="metric-content">
                            <p className="metric-label">Status</p>
                            <p className="metric-value">{overallConnectionStatus.connected ? 'Connected' : 'Disconnected'}</p>
                          </div>
                        </div>
                        
                        <div className="metric-card">
                          <div className="metric-icon" style={{ 
                            background: 'var(--color-info)20',
                            borderColor: 'var(--color-info)40'
                          }}>
                            <Clock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-info)' }} />
                          </div>
                          <div className="metric-content">
                            <p className="metric-label">Last Check</p>
                            <p className="metric-value">{overallConnectionStatus.lastChecked}</p>
                          </div>
                        </div>
                      </div>
                      {overallConnectionStatus.error && (
                        <div style={{
                          marginTop: 'var(--spacing-md)',
                          padding: 'var(--spacing-sm)',
                          background: 'var(--color-error)10',
                          border: '1px solid var(--color-error)20',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          color: 'var(--color-error)'
                        }}>
                          Error: {overallConnectionStatus.error}
                        </div>
                      )}
                    </div>

                    {/* System Metrics */}
                    <div className="card">
                      <div className="card-header">
                        <h3 className="card-title">System Metrics</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="metric-card">
                          <div className="metric-icon" style={{ 
                            background: 'var(--color-primary)20',
                            borderColor: 'var(--color-primary)40'
                          }}>
                            <MessageSquare style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
                          </div>
                          <div className="metric-content">
                            <p className="metric-label">Agents</p>
                            <p className="metric-value">{allAgents.length}</p>
                          </div>
                        </div>
                        
                        <div className="metric-card">
                          <div className="metric-icon" style={{ 
                            background: 'var(--color-success)20',
                            borderColor: 'var(--color-success)40'
                          }}>
                            <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
                          </div>
                          <div className="metric-content">
                            <p className="metric-label">Sessions</p>
                            <p className="metric-value">{currentSession ? '1' : '0'}</p>
                          </div>
                        </div>
                        
                        <div className="metric-card">
                          <div className="metric-icon" style={{ 
                            background: 'var(--color-warning)20',
                            borderColor: 'var(--color-warning)40'
                          }}>
                            <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-warning)' }} />
                          </div>
                          <div className="metric-content">
                            <p className="metric-label">Debug</p>
                            <p className="metric-value">{debugInfo.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Recent Activity</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {debugInfo.slice(0, 5).map((info, index) => (
                        <div key={index} className="card" style={{ background: 'var(--color-bg-tertiary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-primary)' }}>
                                {info}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {debugInfo.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                          No recent activity
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="slide-in-right">
                {currentSession && selectedAgent ? (
                  <div>
                    <div className="card" style={{
                      marginBottom: 'var(--spacing-lg)',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border-primary)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--spacing-md)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)'
                        }}>
                          <div style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            background: 'var(--color-success)',
                            animation: 'status-pulse 2s infinite'
                          }} />
                          <span style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)',
                            fontWeight: '500'
                          }}>
                            Active Chat: {selectedAgent.name}
                          </span>
                        </div>
                        <button
                          onClick={clearChatSession}
                          className="btn btn-ghost"
                          style={{
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)'
                          }}
                        >
                          <MessageSquare style={{ width: '1rem', height: '1rem' }} />
                          New Chat
                        </button>
                      </div>
                    </div>
                    <EnhancedChat
                      currentSession={currentSession}
                      selectedAgent={selectedAgent}
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      isSending={isSendingMessage}
                      onDebugInfo={addDebugInfo}
                    />
                  </div>
                ) : (
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Start a Chat Session</h2>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        background: allAgents.length > 0 ? 'var(--color-success)10' : 'var(--color-error)10',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${allAgents.length > 0 ? 'var(--color-success)20' : 'var(--color-error)20'}`
                      }}>
                        <div style={{
                          width: '0.5rem',
                          height: '0.5rem',
                          borderRadius: '50%',
                          background: allAgents.length > 0 ? 'var(--color-success)' : 'var(--color-error)',
                          animation: allAgents.length > 0 ? 'status-pulse 2s infinite' : 'none'
                        }} />
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: allAgents.length > 0 ? 'var(--color-success)' : 'var(--color-error)',
                          fontWeight: '500'
                        }}>
                          {allAgents.length > 0 ? `${allAgents.length} agents available` : 'No agents available'}
                        </span>
                      </div>
                    </div>
                    
                    {allAgents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allAgents.map((agent) => (
                          <div 
                            key={agent.name}
                            className="card" 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: 'var(--spacing-md)',
                              background: 'var(--color-bg-secondary)',
                              border: '1px solid var(--color-border-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => startStandaloneChat(agent)}
                          >
                            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                              <div>
                                <h3 style={{ color: 'var(--color-text-primary)', margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                                  {agent.name}
                                </h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0, fontFamily: 'var(--font-family-primary)' }}>
                                  {agent.namespace}
                                </p>
                              </div>
                              <div style={{
                                width: '0.75rem',
                                height: '0.75rem',
                                borderRadius: '50%',
                                background: agent.ready ? 'var(--color-success)' : 'var(--color-error)',
                                border: '2px solid var(--color-bg-secondary)'
                              }} />
                            </div>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                              {agent.description}
                            </p>
                            <button
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                alignSelf: 'flex-start'
                              }}
                            >
                              Start Chat
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-xl)',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{
                          width: '3rem',
                          height: '3rem',
                          background: 'var(--color-bg-tertiary)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto var(--spacing-md)',
                          color: 'var(--color-text-muted)'
                        }}>
                          <MessageSquare style={{ width: '1.5rem', height: '1.5rem' }} />
                        </div>
                        <p style={{ margin: '0 0 var(--spacing-sm) 0', fontWeight: '600' }}>No Agents Available</p>
                        <p style={{ margin: 0, fontSize: '0.75rem' }}>Connect to KAgent to see available agents</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cloud-tools' && (
              <div className="slide-in-right">
                <CloudTools onDebugInfo={addDebugInfo} />
              </div>
            )}

            {activeTab === 'tools' && currentConnectorAPI && (
              <div className="slide-in-right">
                <ToolServerManager kagentApi={currentConnectorAPI} />
              </div>
            )}

            {activeTab === 'analytics' && currentConnectorAPI && (
              <div className="slide-in-right">
                <SessionAnalytics kagentApi={currentConnectorAPI} />
              </div>
            )}

            {activeTab === 'memory' && currentConnectorAPI && (
              <div className="slide-in-right">
                <MemoryManager kagentApi={currentConnectorAPI} />
              </div>
            )}

            {activeTab === 'alerts' && currentConnectorAPI && (() => {
              console.log('App: Rendering AlertDashboard with currentConnectorAPI')
              return (
                <div className="slide-in-right">
                  <AlertDashboard 
                    kagentApi={currentConnectorAPI} 
                    onStartChatWithAgent={startChatWithAgentById}
                    isStartingChat={isStartingChat}
                  />
                </div>
              )
            })()}

            {activeTab === 'hooks' && currentConnectorAPI && (() => {
              console.log('App: Rendering HookManager with currentConnectorAPI')
              return (
                <div className="slide-in-right">
                  <HookManager kagentApi={currentConnectorAPI} />
                </div>
              )
            })()}
            
            {activeTab === 'alerts' && !currentConnectorAPI && (
              <div className="slide-in-right">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Alerts - No Connector</h2>
                  </div>
                  <div className="card-content">
                    <p>No active connector available. Please connect to a KAgent instance first.</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'hooks' && !currentConnectorAPI && (
              <div className="slide-in-right">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Hooks - No Connector</h2>
                  </div>
                  <div className="card-content">
                    <p>No active connector available. Please connect to a KAgent instance first.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'investigate' && (
              <div className="slide-in-right">
                <Investigation 
                  agents={allAgents}
                  onStartChat={startChatWithAgentSilent}
                  onDebugInfo={addDebugInfo}
                  chatMessages={chatMessages}
                  agentChatSessions={agentChatSessions}
                />
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="slide-in-right">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Available Agents</h2>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      background: allAgents.length > 0 ? 'var(--color-success)10' : 'var(--color-error)10',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${allAgents.length > 0 ? 'var(--color-success)20' : 'var(--color-error)20'}`
                    }}>
                      <div style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        borderRadius: '50%',
                        background: allAgents.length > 0 ? 'var(--color-success)' : 'var(--color-error)',
                        animation: allAgents.length > 0 ? 'status-pulse 2s infinite' : 'none'
                      }} />
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: allAgents.length > 0 ? 'var(--color-success)' : 'var(--color-error)',
                        fontWeight: '500'
                      }}>
                        {allAgents.length > 0 ? `${allAgents.length} agents available` : 'No agents available'}
                      </span>
                    </div>
                  </div>
                  <div className="agents-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allAgents.map((agent) => (
                      <AgentCard
                        key={agent.name}
                        agent={agent}
                        onSelect={() => handleAgentSelection(agent)}
                        isSelected={selectedAgent?.name === agent.name}
                      />
                    ))}
                    {allAgents.length === 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: 'var(--spacing-xl)',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{
                          width: '3rem',
                          height: '3rem',
                          background: 'var(--color-bg-tertiary)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto var(--spacing-md)',
                          color: 'var(--color-text-muted)'
                        }}>
                          <MessageSquare style={{ width: '1.5rem', height: '1.5rem' }} />
                        </div>
                        <p style={{ margin: '0 0 var(--spacing-sm) 0', fontWeight: '600' }}>No Agents Available</p>
                        <p style={{ margin: 0, fontSize: '0.75rem' }}>Connect to KAgent to see available agents</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'debug' && (
              <div className="slide-in-right">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Debug Information</h2>
                    <button
                      onClick={() => setDebugInfo([])}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.875rem' }}
                    >
                      Clear
                    </button>
                  </div>
                  <div style={{
                    maxHeight: '400px',
                    overflow: 'auto',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '0.75rem',
                    background: 'var(--color-bg-tertiary)',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-primary)'
                  }}>
                    {debugInfo.map((info, index) => (
                      <div key={index} style={{ marginBottom: 'var(--spacing-xs)' }}>
                        {info}
                      </div>
                    ))}
                    {debugInfo.length === 0 && (
                      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        No debug information available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="slide-in-right">
                <div className="grid grid-cols-1 gap-6">
                  {/* Connection Settings */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Connection Settings</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 'var(--spacing-xs)', 
                          fontSize: '0.875rem', 
                          fontWeight: '500',
                          color: 'var(--color-text-primary)'
                        }}>
                          KAgent Server URL
                        </label>
                        <input
                          type="text"
                          value={currentConnector ? `${currentConnector.config.protocol}://${currentConnector.config.baseUrl}:${currentConnector.config.port}` : 'No active connector'}
                          readOnly
                          className="input"
                          style={{ width: '100%' }}
                          placeholder="Server URL"
                        />
                        <p style={{ 
                          marginTop: 'var(--spacing-xs)', 
                          fontSize: '0.75rem', 
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-family-primary)'
                        }}>
                          Current server configuration
                        </p>
                      </div>
                      
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 'var(--spacing-xs)', 
                          fontSize: '0.875rem', 
                          fontWeight: '500',
                          color: 'var(--color-text-primary)'
                        }}>
                          Connection Status
                        </label>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)',
                          padding: 'var(--spacing-sm)',
                          background: overallConnectionStatus.connected ? 'var(--color-success)10' : 'var(--color-error)10',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${overallConnectionStatus.connected ? 'var(--color-success)20' : 'var(--color-error)20'}`
                        }}>
                          <div style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            background: overallConnectionStatus.connected ? 'var(--color-success)' : 'var(--color-error)',
                            animation: overallConnectionStatus.connected ? 'status-pulse 2s infinite' : 'none'
                          }} />
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: overallConnectionStatus.connected ? 'var(--color-success)' : 'var(--color-error)',
                            fontWeight: '500'
                          }}>
                            {overallConnectionStatus.connected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowAddConnector(true)}
                        className="btn btn-primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)',
                          alignSelf: 'flex-start'
                        }}
                      >
                        <MessageSquare style={{ width: '1rem', height: '1rem' }} />
                        Add Connector
                      </button>
                    </div>
                  </div>

                  {/* Application Settings */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Application Settings</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 'var(--spacing-xs)', 
                          fontSize: '0.875rem', 
                          fontWeight: '500',
                          color: 'var(--color-text-primary)'
                        }}>
                          Debug Mode
                        </label>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)',
                          padding: 'var(--spacing-sm)',
                          background: 'var(--color-bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border-primary)'
                        }}>
                          <div style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            background: 'var(--color-info)',
                            animation: 'status-pulse 2s infinite'
                          }} />
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--color-text-primary)',
                            fontWeight: '500'
                          }}>
                            Debug logging enabled ({debugInfo.length} messages)
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 'var(--spacing-xs)', 
                          fontSize: '0.875rem', 
                          fontWeight: '500',
                          color: 'var(--color-text-primary)'
                        }}>
                          Theme
                        </label>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)',
                          padding: 'var(--spacing-sm)',
                          background: 'var(--color-bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border-primary)'
                        }}>
                          <div style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            background: 'var(--color-primary)'
                          }} />
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--color-text-primary)',
                            fontWeight: '500'
                          }}>
                            Dark Theme (Professional SRE)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">About</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <h3 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '1rem', fontWeight: '600' }}>
                          SRE IDE
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                          Professional Site Reliability Engineering IDE with AI-powered investigation tools
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          background: 'var(--color-primary)20',
                          color: 'var(--color-primary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          Version 1.0.0
                        </span>
                        <span style={{
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          background: 'var(--color-success)20',
                          color: 'var(--color-success)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          Production Ready
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {showAddConnector && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New KAgent Connector</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              addConnector();
            }}>
              <div className="form-group">
                <label>Connector Name:</label>
                <input
                  type="text"
                  value={newConnectorName}
                  onChange={(e) => setNewConnectorName(e.target.value)}
                  className="input"
                  placeholder="e.g., Production KAgent"
                />
              </div>
              <div className="form-group">
                <label>Base URL:</label>
                <input
                  type="text"
                  value={newConnectorConfig.baseUrl}
                  onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="input"
                  placeholder="e.g., kagent.example.com"
                />
              </div>
              <div className="form-group">
                <label>Port:</label>
                <input
                  type="number"
                  value={newConnectorConfig.port}
                  onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, port: parseInt(e.target.value, 10) }))}
                  className="input"
                  placeholder="e.g., 8083"
                />
              </div>
              <div className="form-group">
                <label>Protocol:</label>
                                 <select
                   value={newConnectorConfig.protocol}
                   onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, protocol: e.target.value as 'http' | 'https' }))}
                   className="input"
                 >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Timeout (ms):</label>
                <input
                  type="number"
                  value={newConnectorConfig.timeout}
                  onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, timeout: parseInt(e.target.value, 10) }))}
                  className="input"
                  placeholder="e.g., 30000"
                />
              </div>
              <div className="form-group">
                <label>Retries:</label>
                <input
                  type="number"
                  value={newConnectorConfig.retries}
                  onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, retries: parseInt(e.target.value, 10) }))}
                  className="input"
                  placeholder="e.g., 3"
                />
              </div>
              <div className="form-group">
                <label>Environment:</label>
                                 <select
                   value={newConnectorConfig.environment}
                   onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, environment: e.target.value as 'local' | 'development' | 'staging' | 'production' }))}
                   className="input"
                 >
                  <option value="local">Local</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Add Connector</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddConnector(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components


function QuickActionButton({ label, icon, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        fontSize: '0.875rem',
        fontWeight: '500',
        background: color ? `${color}10` : 'var(--color-bg-secondary)',
        border: color ? `1px solid ${color}20` : '1px solid var(--color-border-primary)',
        color: color ? 'var(--color-primary)' : 'var(--color-text-primary)'
      }}
    >
      {React.cloneElement(icon, { style: { width: '1rem', height: '1rem' } })}
      {label}
    </button>
  )
}

function AgentCard({ agent, onSelect, isSelected }: any) {
  return (
    <div 
      className="card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--spacing-md)',
        background: isSelected ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
        border: isSelected ? '1px solid var(--color-primary)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ color: 'var(--color-text-primary)', margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
            {agent.name}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0, fontFamily: 'var(--font-family-primary)' }}>
            {agent.namespace}
          </p>
        </div>
        <div style={{
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '50%',
          background: agent.ready ? 'var(--color-success)' : 'var(--color-error)',
          border: '2px solid var(--color-bg-secondary)'
        }} />
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
        {agent.description}
      </p>
      <button
        onClick={onSelect}
        className="btn btn-primary"
        style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          alignSelf: 'flex-start'
        }}
      >
        {isSelected ? 'Selected' : 'Select'}
      </button>
    </div>
  )
}

export default App