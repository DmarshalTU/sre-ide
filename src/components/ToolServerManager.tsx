import React, { useState, useEffect } from 'react'
import { KagentAPI, type ToolServer, type ToolServerCreateRequest } from '../lib/kagent'
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Server, 
  Wrench, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'

interface ToolServerManagerProps {
  kagentApi: KagentAPI
}

export default function ToolServerManager({ kagentApi }: ToolServerManagerProps) {
  const [toolServers, setToolServers] = useState<ToolServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadToolServers()
  }, [])

  const loadToolServers = async () => {
    try {
      setLoading(true)
      setError(null)
      const servers = await kagentApi.getToolServers()
      setToolServers(servers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tool servers')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteServer = async (ref: string) => {
    try {
      const [namespace, name] = ref.split('/')
      await kagentApi.deleteToolServer(namespace, name)
      await loadToolServers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tool server')
    }
  }

  const getServerStatus = (server: ToolServer) => {
    // Simple status check - in real implementation, you'd ping the server
    return server.discoveredTools.length > 0 ? 'healthy' : 'warning'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
      case 'warning':
        return <AlertCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-warning)' }} />
      default:
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
    }
  }

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
          Loading tool servers...
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
              <Server style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 className="card-title">Tool Servers</h3>
              <p style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '0.875rem', 
                margin: 0,
                fontFamily: 'var(--font-family-primary)'
              }}>
                Manage MCP tool servers and their capabilities
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={loadToolServers}
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
            <button
              onClick={() => setShowCreateDialog(true)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: '0.875rem'
              }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Add Server
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <XCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-error)' }} />
            <span style={{ color: 'var(--color-error)' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Tool Servers Grid */}
      {toolServers.length === 0 ? (
        <div className="card">
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-2xl)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-md)'
          }}>
            <Server style={{ 
              width: '3rem', 
              height: '3rem', 
              color: 'var(--color-text-muted)' 
            }} />
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              margin: 0
            }}>
              No Tool Servers
            </h3>
            <p style={{ 
              color: 'var(--color-text-muted)', 
              margin: 0,
              fontSize: '0.875rem'
            }}>
              Get started by adding your first MCP tool server
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: '0.875rem'
              }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Add Tool Server
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 'var(--spacing-md)' 
        }}>
          {toolServers.map((server) => {
            const status = getServerStatus(server)
            return (
              <div
                key={server.ref}
                className="card"
                style={{
                  padding: 'var(--spacing-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-focus)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-primary)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Server style={{ 
                      width: '1.25rem', 
                      height: '1.25rem', 
                      color: 'var(--color-primary)' 
                    }} />
                    <div>
                      <h3 style={{ 
                        fontWeight: '500', 
                        color: 'var(--color-text-primary)',
                        margin: 0,
                        fontSize: '0.875rem'
                      }}>
                        {server.ref}
                      </h3>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)',
                        margin: 0
                      }}>
                        {server.groupKind}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    {getStatusIcon(status)}
                    <button
                      onClick={() => handleDeleteServer(server.ref)}
                      style={{
                        color: 'var(--color-text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 'var(--spacing-xs)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-error)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-muted)'
                      }}
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)'
                  }}>
                    <Wrench style={{ width: '1rem', height: '1rem' }} />
                    <span>{server.discoveredTools.length} tools available</span>
                  </div>

                  {server.discoveredTools.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)', 
                        marginBottom: 'var(--spacing-sm)',
                        margin: 0
                      }}>
                        Available Tools:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        {server.discoveredTools.slice(0, 3).map((tool) => (
                          <div
                            key={tool.name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              background: 'var(--color-bg-tertiary)',
                              borderRadius: 'var(--radius-sm)',
                              padding: 'var(--spacing-xs) var(--spacing-sm)'
                            }}
                          >
                            <span style={{ 
                              color: 'var(--color-text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {tool.name}
                            </span>
                            <ExternalLink style={{ 
                              width: '0.75rem', 
                              height: '0.75rem', 
                              color: 'var(--color-text-muted)' 
                            }} />
                          </div>
                        ))}
                        {server.discoveredTools.length > 3 && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--color-text-muted)', 
                            textAlign: 'center' 
                          }}>
                            +{server.discoveredTools.length - 3} more tools
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Server Dialog */}
      {showCreateDialog && (
        <CreateToolServerDialog
          kagentApi={kagentApi}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false)
            loadToolServers()
          }}
        />
      )}
    </div>
  )
}

// Create Tool Server Dialog Component
interface CreateToolServerDialogProps {
  kagentApi: KagentAPI
  onClose: () => void
  onSuccess: () => void
}

function CreateToolServerDialog({ kagentApi, onClose, onSuccess }: CreateToolServerDialogProps) {
  const [serverType, setServerType] = useState<'RemoteMCPServer' | 'MCPServer'>('RemoteMCPServer')
  const [formData, setFormData] = useState({
    name: '',
    namespace: 'kagent',
    description: '',
    url: '',
    protocol: 'SSE' as 'SSE' | 'STREAMABLE_HTTP'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const request: ToolServerCreateRequest = {
        type: serverType,
        remoteMCPServer: {
          name: formData.name,
          endpoint: formData.url
        }
      }

      await kagentApi.createToolServer(request)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tool server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '28rem',
        padding: 'var(--spacing-lg)'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '500', 
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-lg)',
          margin: 0
        }}>
          Add Tool Server
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Server Type
            </label>
            <select
              value={serverType}
              onChange={(e) => setServerType(e.target.value as 'RemoteMCPServer' | 'MCPServer')}
              className="input"
            >
              <option value="RemoteMCPServer">Remote MCP Server</option>
              <option value="MCPServer">MCP Server</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Namespace
            </label>
            <input
              type="text"
              value={formData.namespace}
              onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Protocol
            </label>
            <select
              value={formData.protocol}
              onChange={(e) => setFormData({ ...formData, protocol: e.target.value as 'SSE' | 'STREAMABLE_HTTP' })}
              className="input"
            >
              <option value="SSE">Server-Sent Events</option>
              <option value="STREAMABLE_HTTP">Streamable HTTP</option>
            </select>
          </div>

          {error && (
            <div className="alert alert-error">
              <span style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</span>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-md)'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
