import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Send, AlertTriangle, Shield, Info, 
  Zap, DollarSign, Lock, Loader2,
  MessageSquare, Clock, Hash
} from 'lucide-react'
import { SecurityScanner } from '../lib/securityScanner'
import { NDJSONOptimizer } from '../lib/ndjsonOptimizer'
import type { ChatMessage } from '../lib/kagent'

interface EnhancedChatProps {
  currentSession: any
  selectedAgent: any
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  isSending: boolean
  onDebugInfo?: (message: string) => void
}

export function EnhancedChat({ 
  currentSession, 
  selectedAgent, 
  messages, 
  onSendMessage, 
  isSending,
  onDebugInfo 
}: EnhancedChatProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [showSensitiveWarning, setShowSensitiveWarning] = useState(false)
  const [sensitiveFindings, setSensitiveFindings] = useState<any>(null)
  const [maskSensitiveData, setMaskSensitiveData] = useState(true)
  const [showTokenStats, setShowTokenStats] = useState(true)
  const [tokenStats, setTokenStats] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debug logging
  console.log('EnhancedChat props:', {
    currentSession,
    selectedAgent,
    messagesCount: messages.length,
    isSending
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Update token stats when messages change or when switching agents
    if (messages.length > 0) {
      try {
        const stats = NDJSONOptimizer.getTokenSummary(messages)
        const conversationOptimization = NDJSONOptimizer.optimizeConversation(messages)
        setTokenStats({
          ...stats,
          optimization: conversationOptimization.stats
        })
        
        // Log conversation optimization stats
        if (conversationOptimization.stats.savingsPercent > 0) {
          onDebugInfo?.(`Conversation optimization: ${conversationOptimization.stats.savingsPercent}% savings available`)
        }
      } catch (error) {
        console.error('Error updating token stats:', error)
        // Don't crash the app, just skip token stats
        setTokenStats(null)
      }
    } else {
      // Clear token stats when no messages
      setTokenStats(null)
    }
  }, [messages, selectedAgent?.name]) // Also recalculate when agent changes

  const handleInputChange = (value: string) => {
    setInputMessage(value)
    
    // Scan for sensitive data with error handling
    try {
      const scanResult = SecurityScanner.scan(value)
      if (scanResult.hasSensitiveData) {
        setSensitiveFindings(scanResult)
        setShowSensitiveWarning(true)
      } else {
        setSensitiveFindings(null)
        setShowSensitiveWarning(false)
      }
    } catch (error) {
      console.error('Error scanning for sensitive data:', error)
      // Don't crash the app, just skip sensitive data scanning
      setSensitiveFindings(null)
      setShowSensitiveWarning(false)
    }
  }

  const handleSend = async () => {
    if (!inputMessage.trim() || isSending) return

    console.log('handleSend called with:', inputMessage)
    console.log('Current session:', currentSession)
    console.log('Selected agent:', selectedAgent)

    let messageToSend = inputMessage

    // Apply masking if enabled and sensitive data detected
    try {
      if (maskSensitiveData && sensitiveFindings?.hasSensitiveData) {
        const masked = SecurityScanner.mask(inputMessage)
        messageToSend = masked.maskedText
        onDebugInfo?.(`Security: ${SecurityScanner.getMaskingSummary(inputMessage, masked.maskedText)}`)
      }
    } catch (error) {
      console.error('Error masking sensitive data:', error)
      // Continue with original message if masking fails
    }

    // Optimize message with error handling
    try {
      const optimized = NDJSONOptimizer.optimizeMessage(messageToSend)
      if (optimized.stats.savingsPercent > 0) {
        onDebugInfo?.(`Message optimization: Saved ${optimized.stats.saved} tokens (${optimized.stats.savingsPercent}%)`)
      } else {
        onDebugInfo?.(`Message optimization: No optimization needed for short message`)
      }
      messageToSend = optimized.optimized
    } catch (error) {
      console.error('Error optimizing message:', error)
      // Continue with original message if optimization fails
      onDebugInfo?.(`Message optimization: Skipped due to error`)
    }
    
    try {
      // Send the optimized and masked message
      await onSendMessage(messageToSend)
      console.log('Message sent successfully')
      setInputMessage('')
      setShowSensitiveWarning(false)
      setSensitiveFindings(null)
    } catch (error) {
      console.error('Failed to send message:', error)
      onDebugInfo?.(`Failed to send message: ${error}`)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      background: 'var(--color-bg-primary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border-primary)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="card" style={{
        margin: 0,
        borderRadius: 0,
        borderBottom: '1px solid var(--color-border-primary)',
        background: 'var(--color-bg-secondary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
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
              <MessageSquare style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 style={{ 
                color: 'var(--color-text-primary)', 
                margin: 0, 
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                {selectedAgent?.name || 'Agent'}
              </h3>
              <p style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '0.75rem', 
                margin: 0,
                fontFamily: 'var(--font-family-primary)'
              }}>
                Session: {currentSession?.id?.slice(0, 8) || 'No session'}
              </p>
            </div>
          </div>
          
          {/* Token Stats Toggle */}
          <button
            onClick={() => setShowTokenStats(!showTokenStats)}
            className="btn btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              color: showTokenStats ? 'var(--color-primary)' : 'var(--color-text-secondary)'
            }}
          >
            <Zap style={{ width: '1rem', height: '1rem' }} />
            Analytics
          </button>
        </div>
      </div>

      {/* Token Statistics Panel */}
      {showTokenStats && tokenStats && (
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--color-bg-tertiary)',
          borderBottom: '1px solid var(--color-border-primary)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-md)'
        }}>
          <StatCard
            icon={<Hash />}
            label="Total Tokens"
            value={tokenStats.totalTokens.toLocaleString()}
            color="var(--color-info)"
          />
          <StatCard
            icon={<DollarSign />}
            label="Est. Cost"
            value={`$${tokenStats.estimatedCost.total.toFixed(4)}`}
            color="var(--color-success)"
          />
          <StatCard
            icon={<Info />}
            label="Avg/Message"
            value={tokenStats.averageMessageTokens.toLocaleString()}
            color="var(--color-primary)"
          />
          {tokenStats.optimization && (
            <StatCard
              icon={<Shield />}
              label="Tokens Saved"
              value={`${tokenStats.optimization.savingsPercent}%`}
              color="var(--color-warning)"
            />
          )}
        </div>
      )}

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 'var(--spacing-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        background: 'var(--color-bg-primary)',
        minHeight: 0
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            padding: 'var(--spacing-xl)'
          }}>
            <MessageSquare style={{ 
              width: '3rem', 
              height: '3rem', 
              marginBottom: 'var(--spacing-md)',
              opacity: 0.5
            }} />
            <h3 style={{ 
              margin: '0 0 var(--spacing-sm) 0', 
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--color-text-primary)'
            }}>
              Start a conversation
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '0.875rem',
              maxWidth: '400px',
              lineHeight: 1.5
            }}>
              Ask questions, get insights, or explore your infrastructure with AI assistance.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isSending && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            color: 'var(--color-text-muted)',
            padding: 'var(--spacing-lg)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-primary)',
            alignSelf: 'flex-start',
            maxWidth: '300px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Loader2 style={{ 
              width: '1rem', 
              height: '1rem', 
              animation: 'spin 1s linear infinite',
              color: 'var(--color-primary)'
            }} />
            <span style={{ 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>Agent is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Security Warning */}
      {showSensitiveWarning && sensitiveFindings && (
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--color-error)10',
          borderTop: '1px solid var(--color-error)20',
          borderBottom: '1px solid var(--color-error)20'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'start',
            gap: 'var(--spacing-md)'
          }}>
            <AlertTriangle style={{ 
              width: '1.25rem', 
              height: '1.25rem', 
              color: 'var(--color-error)',
              flexShrink: 0,
              marginTop: '0.125rem'
            }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ 
                color: 'var(--color-error)', 
                margin: '0 0 var(--spacing-sm) 0', 
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Sensitive Data Detected
              </h4>
              <div style={{ 
                display: 'flex', 
                gap: 'var(--spacing-md)', 
                marginBottom: 'var(--spacing-sm)',
                flexWrap: 'wrap'
              }}>
                {sensitiveFindings.summary.high > 0 && (
                  <span style={{ 
                    color: 'var(--color-error)', 
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {sensitiveFindings.summary.high} High Risk
                  </span>
                )}
                {sensitiveFindings.summary.medium > 0 && (
                  <span style={{ 
                    color: 'var(--color-warning)', 
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {sensitiveFindings.summary.medium} Medium Risk
                  </span>
                )}
                {sensitiveFindings.summary.low > 0 && (
                  <span style={{ 
                    color: 'var(--color-status-degraded)', 
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {sensitiveFindings.summary.low} Low Risk
                  </span>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap',
                marginBottom: 'var(--spacing-sm)'
              }}>
                {sensitiveFindings.findings.slice(0, 3).map((finding: any, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      background: 'var(--color-error)20',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--color-error)',
                      fontWeight: '500'
                    }}
                  >
                    {finding.type}
                  </span>
                ))}
                {sensitiveFindings.findings.length > 3 && (
                  <span style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    background: 'var(--color-error)20',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--color-error)',
                    fontWeight: '500'
                  }}>
                    +{sensitiveFindings.findings.length - 3} more
                  </span>
                )}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                <input
                  type="checkbox"
                  id="mask-data"
                  checked={maskSensitiveData}
                  onChange={(e) => setMaskSensitiveData(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label 
                  htmlFor="mask-data" 
                  style={{ 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)'
                  }}
                >
                  <Lock style={{ width: '0.875rem', height: '0.875rem' }} />
                  Automatically mask sensitive data before sending
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: 'var(--spacing-xl)',
        background: 'var(--color-bg-secondary)',
        borderTop: '1px solid var(--color-border-primary)',
        display: 'flex',
        gap: 'var(--spacing-md)',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            value={inputMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isSending}
            className="input"
            style={{
              resize: 'none',
              minHeight: '60px',
              maxHeight: '120px',
              fontFamily: 'var(--font-family-ui)',
              lineHeight: 1.5,
              padding: 'var(--spacing-md)',
              fontSize: '0.875rem',
              border: '1px solid var(--color-border-primary)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-bg-primary)',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
            }}
          />
          {inputMessage && (
            <div style={{
              position: 'absolute',
              bottom: 'var(--spacing-sm)',
              right: 'var(--spacing-sm)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-family-primary)',
              background: 'var(--color-bg-tertiary)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-primary)',
              backdropFilter: 'blur(8px)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              ~{NDJSONOptimizer.countTokens(inputMessage)} tokens
            </div>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={isSending || !inputMessage.trim()}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            minWidth: '120px',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '500',
            borderRadius: 'var(--radius-lg)',
            transition: 'all 0.2s ease'
          }}
        >
          {isSending ? (
            <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send style={{ width: '1rem', height: '1rem' }} />
          )}
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-sm)',
      padding: 'var(--spacing-sm)',
      background: 'var(--color-bg-secondary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border-primary)'
    }}>
      <div style={{ 
        color, 
        opacity: 0.8,
        width: '1.5rem',
        height: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: '0.75rem', 
          margin: 0,
          fontWeight: '500'
        }}>
          {label}
        </p>
        <p style={{ 
          color: 'var(--color-text-primary)', 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          margin: 0,
          fontFamily: 'var(--font-family-primary)'
        }}>
          {value}
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const tokens = NDJSONOptimizer.countTokens(message.content)
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      width: '100%',
      marginBottom: 'var(--spacing-md)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isUser ? '85%' : '90%',
        minWidth: '300px',
        padding: 'var(--spacing-lg)',
        background: isUser
          ? 'var(--color-primary)'
          : 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-text-primary)',
        border: isUser ? 'none' : '1px solid var(--color-border-primary)',
        boxShadow: isUser ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        position: 'relative'
      }}>
        <div className="markdown-content" style={{ 
          marginBottom: 'var(--spacing-md)',
          lineHeight: 1.6
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 'var(--spacing-sm)',
          borderTop: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.2)' : 'var(--color-border-primary)'}`,
          fontSize: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
            <span>
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            <Hash style={{ width: '0.75rem', height: '0.75rem' }} />
            <span>
              ~{tokens} tokens
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}