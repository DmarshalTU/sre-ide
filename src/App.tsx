import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { CloudTools } from './components/CloudTools'
import { EnhancedChat } from './components/EnhancedChat'
import { Investigation } from './components/Investigation'
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
  
  // Aggregate all agents from all connectors
  const allAgents = connectors.flatMap(c => c.agents)
  
  // Overall connection health
  const overallConnectionStatus: ConnectionStatus = {
    connected: connectors.some(c => c.status.connected),
    lastChecked: new Date().toLocaleTimeString()
  }

  // Initialize default connector on mount
  useEffect(() => {
    const defaultConnector: KAgentConnector = {
      id: 'default',
      name: 'Default KAgent',
      config: getConfig(),
      status: { connected: false, lastChecked: 'Never' },
      agents: [],
      isActive: true
    }
    setConnectors([defaultConnector])
    setActiveConnector('default')
    connectToConnector(defaultConnector)
  }, [])

  // Debug logging utility
  const addDebugInfo = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)])
  }, [])

  // Connect to a KAgent instance
  const connectToConnector = async (connector: KAgentConnector) => {
    try {
      addDebugInfo(`🔄 Connecting to ${connector.name}...`)
      const api = new KagentAPI(connector.config)
      const agents = await api.getAgents()
      
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

  // Start a chat session with an agent
  const startChatWithAgent = async (agent: KagentAgent) => {
    if (!currentConnectorAPI) {
      addDebugInfo('❌ No active connector available')
      return
    }
    
    try {
      addDebugInfo(`Starting chat with agent: ${agent.name}`)
      setSelectedAgent(agent)
      
      const sessionName = `Chat with ${agent.name} - ${new Date().toLocaleString()}`
      addDebugInfo(`Creating session: ${sessionName}`)
      
      const session = await currentConnectorAPI.createSessionWithName(agent.name, sessionName)
      addDebugInfo(`Session created: ${session?.id || 'No ID'}`)
      setCurrentSession(session)
      
      const messages = await currentConnectorAPI.getSessionMessages(session.id)
      addDebugInfo(`Retrieved ${messages.length} messages`)
      setChatMessages(messages)
      
      addDebugInfo(`✅ Chat session created: ${session.id}`)
      setActiveTab('chat')
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

  // Send a message to the current chat session
  const handleSendMessage = async (message: string) => {
    if (!currentSession || !selectedAgent || !currentConnectorAPI) return
    
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
  const startStandaloneChat = async (agent: KagentAgent) => {
    if (!currentConnectorAPI) {
      addDebugInfo('❌ No active connector available')
      return
    }
    
    try {
      addDebugInfo(`Starting standalone chat with agent: ${agent.name}`)
      setSelectedAgent(agent)
      
      const sessionName = `Standalone Chat with ${agent.name} - ${new Date().toLocaleString()}`
      const session = await currentConnectorAPI.createSessionWithName(agent.name, sessionName)
      setCurrentSession(session)
      
      const messages = await currentConnectorAPI.getSessionMessages(session.id)
      setChatMessages(messages)
      
      addDebugInfo(`✅ Standalone chat session created: ${session.id}`)
      setActiveTab('chat')
    } catch (error) {
      console.error('Failed to start standalone chat:', error)
      addDebugInfo(`❌ Failed to start standalone chat: ${error}`)
    }
  }


  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
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

                  {/* Connection Status */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Overall Status</h2>
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
                          <p className="metric-label">Overall Status</p>
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
                      <h2 className="card-title">System Metrics</h2>
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
                          <p className="metric-label">Available Agents</p>
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
                          <p className="metric-label">Active Sessions</p>
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
                          <p className="metric-label">Debug Messages</p>
                          <p className="metric-value">{debugInfo.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
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

            {activeTab === 'investigate' && (
              <div className="slide-in-right">
                <Investigation 
                  agents={allAgents}
                  onStartChat={startChatWithAgent}
                  onDebugInfo={addDebugInfo}
                  chatMessages={chatMessages}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {activeTab === 'alerts' && (
              <div className="slide-in-right">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Alerts</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div style={{
                      padding: 'var(--spacing-md)',
                      background: 'var(--color-warning)10',
                      border: '1px solid var(--color-warning)20',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)'
                    }}>
                      <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--color-warning)' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-warning)' }}>
                        No active alerts
                      </span>
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