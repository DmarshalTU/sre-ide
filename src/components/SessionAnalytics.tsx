import { useState, useEffect } from 'react'
import { KagentAPI, type SessionAnalytics as SessionAnalyticsType, type KagentSession } from '../lib/kagent'
import { 
  MessageSquare, 
  Clock, 
  Zap, 
  Users, 
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'

interface SessionAnalyticsProps {
  kagentApi: KagentAPI
}

export default function SessionAnalytics({ kagentApi }: SessionAnalyticsProps) {
  const [sessions, setSessions] = useState<KagentSession[]>([])
  const [analytics, setAnalytics] = useState<SessionAnalyticsType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    loadAnalytics()
  }, [selectedTimeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📊 Loading analytics...')
      
      // Get all sessions
      const allSessions = await kagentApi.getSessions()
      console.log('📊 Found sessions:', allSessions.length)
      
      // Filter sessions by time range
      const filteredSessions = filterSessionsByTimeRange(allSessions, selectedTimeRange)
      console.log('📊 Filtered sessions:', filteredSessions.length)
      setSessions(filteredSessions)
      
      // Calculate analytics for each session
      const analyticsPromises = filteredSessions.map(async (session) => {
        try {
          console.log('📊 Calculating analytics for session:', session.id)
          const analytics = await kagentApi.getSessionAnalytics(session.id)
          console.log('📊 Analytics result:', analytics)
          return analytics
        } catch (err) {
          console.error(`Failed to get analytics for session ${session.id}:`, err)
          return null
        }
      })
      
      const analyticsResults = await Promise.all(analyticsPromises)
      const validAnalytics = analyticsResults.filter((a): a is SessionAnalyticsType => a !== null)
      console.log('📊 Valid analytics:', validAnalytics.length)
      setAnalytics(validAnalytics)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const filterSessionsByTimeRange = (sessions: KagentSession[], range: string): KagentSession[] => {
    const now = new Date()
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.last_update_time || session.id)
      return sessionDate >= cutoffDate
    })
  }

  const calculateTotals = () => {
    return analytics.reduce((totals, session) => ({
      totalMessages: totals.totalMessages + session.totalMessages,
      totalTokens: totals.totalTokens + session.totalTokens,
      totalDuration: totals.totalDuration + session.duration,
      totalTools: totals.totalTools + session.toolsUsed.length
    }), {
      totalMessages: 0,
      totalTokens: 0,
      totalDuration: 0,
      totalTools: 0
    })
  }

  const getTopTools = () => {
    const toolCounts: Record<string, number> = {}
    analytics.forEach(session => {
      session.toolsUsed.forEach(tool => {
        toolCounts[tool] = (toolCounts[tool] || 0) + 1
      })
    })
    
    return Object.entries(toolCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tool, count]) => ({ tool, count }))
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const totals = calculateTotals()
  const topTools = getTopTools()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '16rem',
        gap: 'var(--spacing-sm)'
      }}>
        <RefreshCw style={{ 
          width: '2rem', 
          height: '2rem', 
          color: 'var(--color-primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ 
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem'
        }}>
          Loading analytics...
        </span>
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
              <Activity style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 className="card-title">Session Analytics</h3>
              <p style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '0.875rem', 
                margin: 0,
                fontFamily: 'var(--font-family-primary)'
              }}>
                Insights into your investigation patterns and tool usage
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="input"
              style={{ fontSize: '0.875rem' }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={loadAnalytics}
              className="btn btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: '0.875rem'
              }}
            >
              <RefreshCw style={{ width: '1rem', height: '1rem' }} />
              Refresh
            </button>
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
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
                Total Sessions
              </p>
              <p style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--color-text-primary)',
                margin: 0
              }}>
                {sessions.length}
              </p>
            </div>
            <Users style={{ width: '2rem', height: '2rem', color: 'var(--color-primary)' }} />
          </div>
          <div style={{ 
            marginTop: 'var(--spacing-sm)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)',
            fontSize: '0.875rem'
          }}>
            <ArrowUpRight style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
            <span style={{ color: 'var(--color-success)' }}>+12%</span>
            <span style={{ color: 'var(--color-text-muted)' }}>vs last period</span>
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
                Total Messages
              </p>
              <p style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--color-text-primary)',
                margin: 0
              }}>
                {formatNumber(totals.totalMessages)}
              </p>
            </div>
            <MessageSquare style={{ width: '2rem', height: '2rem', color: 'var(--color-success)' }} />
          </div>
          <div style={{ 
            marginTop: 'var(--spacing-sm)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)',
            fontSize: '0.875rem'
          }}>
            <ArrowUpRight style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
            <span style={{ color: 'var(--color-success)' }}>+8%</span>
            <span style={{ color: 'var(--color-text-muted)' }}>vs last period</span>
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
                Total Tokens
              </p>
              <p style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--color-text-primary)',
                margin: 0
              }}>
                {formatNumber(totals.totalTokens)}
              </p>
            </div>
            <Zap style={{ width: '2rem', height: '2rem', color: 'var(--color-warning)' }} />
          </div>
          <div style={{ 
            marginTop: 'var(--spacing-sm)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)',
            fontSize: '0.875rem'
          }}>
            <ArrowDownRight style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
            <span style={{ color: 'var(--color-error)' }}>-3%</span>
            <span style={{ color: 'var(--color-text-muted)' }}>vs last period</span>
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
                Avg Duration
              </p>
              <p style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--color-text-primary)',
                margin: 0
              }}>
                {sessions.length > 0 ? formatDuration(totals.totalDuration / sessions.length) : '0m'}
              </p>
            </div>
            <Clock style={{ width: '2rem', height: '2rem', color: 'var(--color-info)' }} />
          </div>
          <div style={{ 
            marginTop: 'var(--spacing-sm)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)',
            fontSize: '0.875rem'
          }}>
            <ArrowUpRight style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
            <span style={{ color: 'var(--color-success)' }}>+5%</span>
            <span style={{ color: 'var(--color-text-muted)' }}>vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts and Insights */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 'var(--spacing-lg)' 
      }}>
        {/* Top Tools */}
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-md)'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '500', 
              color: 'var(--color-text-primary)',
              margin: 0
            }}>
              Most Used Tools
            </h3>
            <Activity style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
          </div>
          {topTools.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {topTools.map(({ tool, count }, index) => (
                <div key={tool} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      background: 'var(--color-primary)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'white'
                    }}>
                      {index + 1}
                    </div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{tool}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div style={{
                      width: '5rem',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      height: '0.5rem',
                      overflow: 'hidden'
                    }}>
                      <div 
                        style={{ 
                          background: 'var(--color-primary)',
                          height: '100%',
                          borderRadius: 'var(--radius-sm)',
                          width: `${(count / topTools[0].count) * 100}%`,
                          transition: 'width var(--transition-normal)'
                        }}
                      />
                    </div>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--color-text-muted)',
                      width: '2rem',
                      textAlign: 'right'
                    }}>
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--spacing-2xl)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-sm)'
            }}>
              <Activity style={{ 
                width: '3rem', 
                height: '3rem', 
                color: 'var(--color-text-muted)' 
              }} />
              <p style={{ 
                color: 'var(--color-text-muted)',
                margin: 0,
                fontSize: '0.875rem'
              }}>
                No tool usage data available
              </p>
            </div>
          )}
        </div>

        {/* Session Timeline */}
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-md)'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '500', 
              color: 'var(--color-text-primary)',
              margin: 0
            }}>
              Recent Sessions
            </h3>
            <Calendar style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
          </div>
          {sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {sessions.slice(0, 5).map((session) => {
                const sessionAnalytics = analytics.find(a => a.sessionId === session.id)
                return (
                  <div key={session.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: 'var(--color-text-primary)',
                        margin: 0,
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        {session.name || `Session ${session.id.slice(0, 8)}`}
                      </p>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)',
                        margin: 0
                      }}>
                        {new Date(session.last_update_time || session.id).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        {sessionAnalytics?.totalMessages || 0} messages
                      </p>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)',
                        margin: 0
                      }}>
                        {sessionAnalytics ? formatDuration(sessionAnalytics.duration) : '0m'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--spacing-2xl)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-sm)'
            }}>
              <Calendar style={{ 
                width: '3rem', 
                height: '3rem', 
                color: 'var(--color-text-muted)' 
              }} />
              <p style={{ 
                color: 'var(--color-text-muted)',
                margin: 0,
                fontSize: '0.875rem'
              }}>
                No sessions found for this period
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Session List */}
      {sessions.length > 0 && (
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '500', 
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-md)',
            margin: 0
          }}>
            All Sessions
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: 'var(--spacing-md)', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-text-muted)'
                  }}>
                    Session
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: 'var(--spacing-md)', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-text-muted)'
                  }}>
                    Messages
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: 'var(--spacing-md)', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-text-muted)'
                  }}>
                    Tokens
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: 'var(--spacing-md)', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-text-muted)'
                  }}>
                    Duration
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: 'var(--spacing-md)', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-text-muted)'
                  }}>
                    Tools Used
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: 'var(--spacing-md)', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-text-muted)'
                  }}>
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const sessionAnalytics = analytics.find(a => a.sessionId === session.id)
                  return (
                    <tr key={session.id} style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <div>
                          <p style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '500', 
                            color: 'var(--color-text-primary)',
                            margin: 0,
                            marginBottom: 'var(--spacing-xs)'
                          }}>
                            {session.name || `Session ${session.id.slice(0, 8)}`}
                          </p>
                          <p style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--color-text-muted)',
                            margin: 0
                          }}>
                            {session.id}
                          </p>
                        </div>
                      </td>
                      <td style={{ 
                        padding: 'var(--spacing-md)', 
                        fontSize: '0.875rem', 
                        color: 'var(--color-text-secondary)'
                      }}>
                        {sessionAnalytics?.totalMessages || 0}
                      </td>
                      <td style={{ 
                        padding: 'var(--spacing-md)', 
                        fontSize: '0.875rem', 
                        color: 'var(--color-text-secondary)'
                      }}>
                        {formatNumber(sessionAnalytics?.totalTokens || 0)}
                      </td>
                      <td style={{ 
                        padding: 'var(--spacing-md)', 
                        fontSize: '0.875rem', 
                        color: 'var(--color-text-secondary)'
                      }}>
                        {sessionAnalytics ? formatDuration(sessionAnalytics.duration) : '0m'}
                      </td>
                      <td style={{ 
                        padding: 'var(--spacing-md)', 
                        fontSize: '0.875rem', 
                        color: 'var(--color-text-secondary)'
                      }}>
                        {sessionAnalytics?.toolsUsed.length || 0}
                      </td>
                      <td style={{ 
                        padding: 'var(--spacing-md)', 
                        fontSize: '0.875rem', 
                        color: 'var(--color-text-secondary)'
                      }}>
                        {new Date(session.last_update_time || session.id).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
