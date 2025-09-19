import { useState, useEffect } from 'react'
import { KagentAPI, type Alert, type AlertSummary } from '../lib/kagent'
import NotificationSettings from './NotificationSettings'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff,
  Zap,
  Activity,
  Minus,
  Settings,
  MessageSquare
} from 'lucide-react'

interface AlertDashboardProps {
  kagentApi: KagentAPI
  onStartChatWithAgent?: (agentId: string, alert?: Alert) => void
  isStartingChat?: boolean
}

export default function AlertDashboard({ kagentApi, onStartChatWithAgent, isStartingChat = false }: AlertDashboardProps) {
  
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'firing' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)

  useEffect(() => {
    loadData()
    // Start streaming automatically
    startStreaming()
    
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true)
      }
      setError(null)
      
      // Load alerts and summary in parallel with better error handling
      const [alertsData, summaryData] = await Promise.all([
        kagentApi.getAlerts().catch((err) => {
          console.error('AlertDashboard: Failed to load alerts:', err)
          return []
        }),
        kagentApi.getAlertSummary().catch((err) => {
          console.error('AlertDashboard: Failed to load alert summary:', err)
          return null
        })
      ])
      
      
      setAlerts(alertsData)
      setSummary(summaryData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alert data'
      setError(errorMessage)
      console.error('Failed to load alert data:', err)
    } finally {
      setLoading(false)
    }
  }

  const startStreaming = async () => {
    try {
      if (eventSource) {
        eventSource.close()
      }

      const stream = await kagentApi.subscribeToAlerts(
        (alert) => {
          setAlerts(prev => {
            // Update existing alert or add new one
            const existingIndex = prev.findIndex(a => a.id === alert.id)
            if (existingIndex >= 0) {
              const updated = [...prev]
              updated[existingIndex] = alert
              return updated
            } else {
              return [alert, ...prev]
            }
          })
          
          // Show browser notification for critical alerts
          if (alert.severity === 'critical' && alert.status === 'firing') {
            if (Notification.permission === 'granted') {
              new Notification(`Critical Alert: ${alert.eventType}`, {
                body: `${alert.resourceName} in ${alert.namespace}`,
                icon: '/vite.svg'
              })
            }
          }
        },
        (error) => {
          console.error('Alert stream error:', error)
          setIsStreaming(false)
        }
      )

      setEventSource(stream)
      setIsStreaming(true)
    } catch (err) {
      console.error('Failed to start alert streaming:', err)
      setIsStreaming(false)
    }
  }

  // const stopStreaming = () => {
  //   if (eventSource) {
  //     eventSource.close()
  //     setEventSource(null)
  //     setIsStreaming(false)
  //   }
  // }

  const handleStartChatWithAgent = (agentId: string, alert?: Alert) => {
    if (onStartChatWithAgent) {
      onStartChatWithAgent(agentId, alert)
    } else {
      console.warn('❌ onStartChatWithAgent callback not provided')
    }
  }

  const formatAgentId = (agentId: string) => {
    // Convert kagent__NS__k8s_agent to "K8s Agent"
    if (agentId.includes('kagent__NS__')) {
      const agentName = agentId.replace('kagent__NS__', '').replace('_agent', '')
      return agentName.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') + ' Agent'
    }
    return agentId
  }

  const handleResolve = async (alertId: string) => {
    try {
      setActionLoading(alertId)
      await kagentApi.resolveAlert(alertId)
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const }
          : alert
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve alert'
      setError(errorMessage)
      console.error('Failed to resolve alert:', err)
    } finally {
      setActionLoading(null)
    }
  }


  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
      case 'high':
        return <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--color-warning)' }} />
      case 'medium':
        return <Minus style={{ width: '1rem', height: '1rem', color: 'var(--color-info)' }} />
      case 'low':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
      default:
        return <Bell style={{ width: '1rem', height: '1rem', color: 'var(--color-text-muted)' }} />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'firing':
        return <Zap style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
      case 'resolved':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
      default:
        return <Clock style={{ width: '1rem', height: '1rem', color: 'var(--color-text-muted)' }} />
    }
  }

  const getRemediationIcon = (status?: string) => {
    switch (status) {
      case 'in_progress':
        return <Activity style={{ width: '1rem', height: '1rem', color: 'var(--color-warning)' }} />
      case 'completed':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
      case 'failed':
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
      default:
        return <Clock style={{ width: '1rem', height: '1rem', color: 'var(--color-text-muted)' }} />
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.status === filter
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesSearch = searchTerm === '' || 
      alert.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.eventType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesResolved = showResolved || alert.status !== 'resolved'
    
    return matchesFilter && matchesSeverity && matchesSearch && matchesResolved
  })

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-lg)' }}>
        {/* Summary Cards Skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              <div style={{
                height: '1.5rem',
                background: 'var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--spacing-sm)'
              }} />
              <div style={{
                height: '2rem',
                background: 'var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                width: '60%'
              }} />
            </div>
          ))}
        </div>

        {/* Alert List Skeleton */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)'
        }}>
          <div style={{
            height: '2rem',
            background: 'var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-md)',
            width: '40%'
          }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              <div style={{
                width: '1rem',
                height: '1rem',
                background: 'var(--color-border)',
                borderRadius: '50%'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  height: '1rem',
                  background: 'var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--spacing-xs)',
                  width: '70%'
                }} />
                <div style={{
                  height: '0.75rem',
                  background: 'var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  width: '50%'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <div className="card">
        <div className="card-header">
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
              <Bell style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 className="card-title">Alert Dashboard</h3>
              <p style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '0.875rem', 
                margin: 0,
                fontFamily: 'var(--font-family-primary)'
              }}>
                Real-time cluster event monitoring and alerting
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={() => setShowNotificationSettings(true)}
              className="btn btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: '0.875rem'
              }}
            >
              <Settings style={{ width: '1rem', height: '1rem' }} />
              Notifications
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              padding: 'var(--spacing-sm)',
              background: isStreaming ? 'var(--color-success)' : 'var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: isStreaming ? 'white' : 'var(--color-text-muted)'
            }}>
              <div style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: isStreaming ? 'white' : 'var(--color-text-muted)',
                animation: isStreaming ? 'pulse 2s infinite' : 'none'
              }} />
              {isStreaming ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <span style={{ color: 'var(--color-error)' }}>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--spacing-md)' 
        }}>
          <div className="card" style={{ padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--color-text-muted)',
                  margin: 0,
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Total Alerts
                </p>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: 'var(--color-text-primary)',
                  margin: 0
                }}>
                  {summary.total}
                </p>
              </div>
              <Bell style={{ width: '2rem', height: '2rem', color: 'var(--color-primary)' }} />
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--color-text-muted)',
                  margin: 0,
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Firing
                </p>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: 'var(--color-error)',
                  margin: 0
                }}>
                  {summary.firing}
                </p>
              </div>
              <Zap style={{ width: '2rem', height: '2rem', color: 'var(--color-error)' }} />
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--color-text-muted)',
                  margin: 0,
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Critical
                </p>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: 'var(--color-error)',
                  margin: 0
                }}>
                  {summary.bySeverity.critical}
                </p>
              </div>
              <XCircle style={{ width: '2rem', height: '2rem', color: 'var(--color-error)' }} />
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--color-text-muted)',
                  margin: 0,
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Resolved
                </p>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: 'var(--color-success)',
                  margin: 0
                }}>
                  {summary.resolved}
                </p>
              </div>
              <CheckCircle style={{ width: '2rem', height: '2rem', color: 'var(--color-success)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Filter style={{ width: '1rem', height: '1rem', color: 'var(--color-text-muted)' }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'firing' | 'resolved')}
              className="input"
              style={{ fontSize: '0.875rem' }}
            >
              <option value="all">All Status</option>
              <option value="firing">Firing</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'all' | 'critical' | 'high' | 'medium' | 'low')}
            className="input"
            style={{ fontSize: '0.875rem' }}
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Search style={{ width: '1rem', height: '1rem', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ fontSize: '0.875rem', minWidth: '200px' }}
            />
          </div>

          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`btn ${showResolved ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem'
            }}
          >
            {showResolved ? <Eye style={{ width: '1rem', height: '1rem' }} /> : <EyeOff style={{ width: '1rem', height: '1rem' }} />}
            {showResolved ? 'Hide Resolved' : 'Show Resolved'}
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '500', 
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-md)',
          margin: 0
        }}>
          Alerts ({filteredAlerts.length})
        </h3>

        {filteredAlerts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-2xl)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            <Bell style={{ 
              width: '3rem', 
              height: '3rem', 
              color: 'var(--color-text-muted)' 
            }} />
            <p style={{ 
              color: 'var(--color-text-muted)',
              margin: 0,
              fontSize: '0.875rem'
            }}>
              No alerts found matching your filters
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="card"
                style={{
                  padding: 'var(--spacing-md)',
                  borderLeft: `4px solid ${
                    alert.severity === 'critical' ? 'var(--color-error)' :
                    alert.severity === 'high' ? 'var(--color-warning)' :
                    alert.severity === 'medium' ? 'var(--color-info)' :
                    'var(--color-success)'
                  }`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    {getSeverityIcon(alert.severity)}
                    {getStatusIcon(alert.status)}
                    <div>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: 'var(--color-text-primary)',
                        margin: 0,
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        {alert.eventType} - {alert.resourceName}
                      </h4>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)',
                        margin: 0
                      }}>
                        {alert.namespace} • {new Date(alert.firstSeen).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    {alert.remediationStatus && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        {getRemediationIcon(alert.remediationStatus)}
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--color-text-muted)',
                          textTransform: 'capitalize'
                        }}>
                          {alert.remediationStatus}
                        </span>
                      </div>
                    )}
                    
                    {alert.status === 'firing' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={actionLoading === alert.id}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                      >
                        {actionLoading === alert.id ? (
                          <>
                            <RefreshCw style={{ 
                              width: '0.75rem', 
                              height: '0.75rem',
                              animation: 'spin 1s linear infinite',
                              marginRight: 'var(--spacing-xs)'
                            }} />
                            Resolving...
                          </>
                        ) : (
                          'Resolve'
                        )}
                      </button>
                    )}
                    
                    
                    {/* Chat with Agent button - always visible */}
                    {alert.agentId && (
                      <button
                        onClick={() => handleStartChatWithAgent(alert.agentId, alert)}
                        disabled={isStartingChat}
                        className="btn btn-ghost"
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                          opacity: isStartingChat ? 0.6 : 1,
                          cursor: isStartingChat ? 'not-allowed' : 'pointer'
                        }}
                        title={isStartingChat ? 'Starting chat...' : `Start chat with ${formatAgentId(alert.agentId)}`}
                      >
                        {isStartingChat ? (
                          <RefreshCw style={{ 
                            width: '0.75rem', 
                            height: '0.75rem',
                            animation: 'spin 1s linear infinite'
                          }} />
                        ) : (
                          <MessageSquare style={{ width: '0.75rem', height: '0.75rem' }} />
                        )}
                        {isStartingChat ? 'Starting...' : 'Chat'}
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  {alert.message}
                </p>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-md)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)'
                }}>
                  <span>
                    Agent: 
                    <button
                      onClick={() => handleStartChatWithAgent(alert.agentId, alert)}
                      disabled={isStartingChat}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isStartingChat ? 'var(--color-text-muted)' : 'var(--color-primary)',
                        textDecoration: isStartingChat ? 'none' : 'underline',
                        cursor: isStartingChat ? 'not-allowed' : 'pointer',
                        marginLeft: 'var(--spacing-xs)',
                        fontSize: '0.75rem',
                        fontFamily: 'inherit',
                        opacity: isStartingChat ? 0.6 : 1
                      }}
                      title={isStartingChat ? 'Starting chat...' : `Click to chat with ${formatAgentId(alert.agentId)}`}
                    >
                      {isStartingChat ? 'Starting...' : formatAgentId(alert.agentId)}
                    </button>
                  </span>
                  {alert.sessionId && <span>Session: {alert.sessionId.slice(0, 8)}...</span>}
                  {alert.taskId && <span>Task: {alert.taskId.slice(0, 8)}...</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Settings Dialog */}
      {showNotificationSettings && (
        <NotificationSettings
          onClose={() => setShowNotificationSettings(false)}
        />
      )}
    </div>
  )
}
