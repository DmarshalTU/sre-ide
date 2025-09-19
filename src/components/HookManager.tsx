import React, { useState, useEffect } from 'react'
import { KagentAPI, type Hook, type EventConfiguration } from '../lib/kagent'
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Edit, 
  Eye, 
  Copy,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Activity,
  FileText
} from 'lucide-react'

interface HookManagerProps {
  kagentApi: KagentAPI
}

export default function HookManager({ kagentApi }: HookManagerProps) {
  console.log('HookManager: Component rendering', { kagentApi })
  
  const [hooks, setHooks] = useState<Hook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingHook, setEditingHook] = useState<Hook | null>(null)
  const [viewingHook, setViewingHook] = useState<Hook | null>(null)

  useEffect(() => {
    console.log('HookManager: useEffect triggered, calling loadHooks()')
    loadHooks()
  }, [])

  const loadHooks = async () => {
    try {
      console.log('HookManager: loadHooks called')
      setLoading(true)
      setError(null)
      console.log('HookManager: About to call kagentApi.getHooks()')
      const hooksList = await kagentApi.getHooks()
      console.log('HookManager: Got hooks data', { hooksList })
      setHooks(hooksList)
    } catch (err) {
      console.error('HookManager: Failed to load hooks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load hooks')
    } finally {
      setLoading(false)
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

  const handleDeleteHook = async (name: string, namespace: string) => {
    if (!confirm(`Are you sure you want to delete hook "${name}"?`)) {
      return
    }

    try {
      await kagentApi.deleteHook(name, namespace)
      await loadHooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete hook')
    }
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'pod-restart':
        return <RefreshCw style={{ width: '1rem', height: '1rem', color: 'var(--color-warning)' }} />
      case 'pod-pending':
        return <Clock style={{ width: '1rem', height: '1rem', color: 'var(--color-info)' }} />
      case 'oom-kill':
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
      case 'probe-failed':
        return <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--color-warning)' }} />
      default:
        return <Activity style={{ width: '1rem', height: '1rem', color: 'var(--color-text-muted)' }} />
    }
  }

  const getActiveEventsCount = (hook: Hook) => {
    return hook.status?.activeEvents?.length || 0
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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
          Loading hooks...
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
              <Zap style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 className="card-title">Hook Manager</h3>
              <p style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '0.875rem', 
                margin: 0,
                fontFamily: 'var(--font-family-primary)'
              }}>
                Manage Kubernetes event monitoring hooks
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={loadHooks}
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
              Create Hook
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

      {/* Hooks List */}
      {hooks.length === 0 ? (
        <div className="card">
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-2xl)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-md)'
          }}>
            <Zap style={{ 
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
              No Hooks Found
            </h3>
            <p style={{ 
              color: 'var(--color-text-muted)', 
              margin: 0,
              fontSize: '0.875rem'
            }}>
              Create your first hook to start monitoring Kubernetes events
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
              Create Hook
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
          gap: 'var(--spacing-md)' 
        }}>
          {hooks.map((hook) => (
            <div
              key={`${hook.metadata.namespace}/${hook.metadata.name}`}
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
                  <Zap style={{ 
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
                      {hook.metadata.name}
                    </h3>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-text-muted)',
                      margin: 0
                    }}>
                      {hook.metadata.namespace}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-bg-tertiary)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {getActiveEventsCount(hook)} active
                  </span>
                  <button
                    onClick={() => handleDeleteHook(hook.metadata.name, hook.metadata.namespace)}
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
                  <FileText style={{ width: '1rem', height: '1rem' }} />
                  <span>{hook.spec.eventConfigurations.length} event types</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  {hook.spec.eventConfigurations.slice(0, 3).map((config, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        fontSize: '0.75rem',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--spacing-xs) var(--spacing-sm)'
                      }}
                    >
                      {getEventTypeIcon(config.eventType)}
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {config.eventType}
                      </span>
                      <span style={{ 
                        color: 'var(--color-text-muted)',
                        marginLeft: 'auto'
                      }}>
                        {formatAgentId(config.agentRef.name)}
                      </span>
                    </div>
                  ))}
                  {hook.spec.eventConfigurations.length > 3 && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-text-muted)', 
                      textAlign: 'center' 
                    }}>
                      +{hook.spec.eventConfigurations.length - 3} more event types
                    </div>
                  )}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-md)'
              }}>
                <button
                  onClick={() => setViewingHook(hook)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                >
                  <Eye style={{ width: '0.75rem', height: '0.75rem' }} />
                  View
                </button>
                <button
                  onClick={() => setEditingHook(hook)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                >
                  <Edit style={{ width: '0.75rem', height: '0.75rem' }} />
                  Edit
                </button>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(hook, null, 2))}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                >
                  <Copy style={{ width: '0.75rem', height: '0.75rem' }} />
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Hook Dialog */}
      {(showCreateDialog || editingHook) && (
        <CreateEditHookDialog
          hook={editingHook}
          kagentApi={kagentApi}
          onClose={() => {
            setShowCreateDialog(false)
            setEditingHook(null)
          }}
          onSuccess={() => {
            setShowCreateDialog(false)
            setEditingHook(null)
            loadHooks()
          }}
        />
      )}

      {/* View Hook Dialog */}
      {viewingHook && (
        <ViewHookDialog
          hook={viewingHook}
          onClose={() => setViewingHook(null)}
        />
      )}
    </div>
  )
}

// Create/Edit Hook Dialog Component
interface CreateEditHookDialogProps {
  hook?: Hook | null
  kagentApi: KagentAPI
  onClose: () => void
  onSuccess: () => void
}

function CreateEditHookDialog({ hook, kagentApi, onClose, onSuccess }: CreateEditHookDialogProps) {
  const [formData, setFormData] = useState({
    name: hook?.metadata.name || '',
    namespace: hook?.metadata.namespace || 'default',
    eventConfigurations: hook?.spec.eventConfigurations || [
      {
        eventType: 'pod-restart' as const,
        agentRef: { name: '' },
        prompt: ''
      }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addEventConfiguration = () => {
    setFormData(prev => ({
      ...prev,
      eventConfigurations: [
        ...prev.eventConfigurations,
        {
          eventType: 'pod-restart' as const,
          agentRef: { name: '' },
          prompt: ''
        }
      ]
    }))
  }

  const removeEventConfiguration = (index: number) => {
    setFormData(prev => ({
      ...prev,
      eventConfigurations: prev.eventConfigurations.filter((_, i) => i !== index)
    }))
  }

  const updateEventConfiguration = (index: number, field: keyof EventConfiguration, value: any) => {
    setFormData(prev => ({
      ...prev,
      eventConfigurations: prev.eventConfigurations.map((config, i) => 
        i === index ? { ...config, [field]: value } : config
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const hookData: Hook = {
        apiVersion: 'kagent.dev/v1alpha2',
        kind: 'Hook',
        metadata: {
          name: formData.name,
          namespace: formData.namespace
        },
        spec: {
          eventConfigurations: formData.eventConfigurations
        }
      }

      if (hook) {
        await kagentApi.updateHook(hook.metadata.name, hook.metadata.namespace, hookData)
      } else {
        await kagentApi.createHook(hookData)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save hook')
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
        maxWidth: '50rem',
        maxHeight: '90vh',
        padding: 'var(--spacing-lg)',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '500', 
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-lg)',
          margin: 0
        }}>
          {hook ? 'Edit Hook' : 'Create Hook'}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Hook Name
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
          </div>

          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)'
            }}>
              <label style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: 'var(--color-text-secondary)'
              }}>
                Event Configurations
              </label>
              <button
                type="button"
                onClick={addEventConfiguration}
                className="btn btn-ghost"
                style={{ fontSize: '0.875rem' }}
              >
                <Plus style={{ width: '1rem', height: '1rem' }} />
                Add Event
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {formData.eventConfigurations.map((config, index) => (
                <div key={index} className="card" style={{ padding: 'var(--spacing-md)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    <h4 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: 'var(--color-text-primary)',
                      margin: 0
                    }}>
                      Event Configuration {index + 1}
                    </h4>
                    {formData.eventConfigurations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEventConfiguration(index)}
                        style={{
                          color: 'var(--color-error)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 'var(--spacing-xs)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--spacing-sm)'
                      }}>
                        Event Type
                      </label>
                      <select
                        value={config.eventType}
                        onChange={(e) => updateEventConfiguration(index, 'eventType', e.target.value)}
                        className="input"
                        required
                      >
                        <option value="pod-restart">Pod Restart</option>
                        <option value="pod-pending">Pod Pending</option>
                        <option value="oom-kill">OOM Kill</option>
                        <option value="probe-failed">Probe Failed</option>
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
                        Agent ID
                      </label>
                      <input
                        type="text"
                        value={config.agentRef.name}
                        onChange={(e) => updateEventConfiguration(index, 'agentRef', { name: e.target.value })}
                        className="input"
                        placeholder="incident-responder"
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
                        Prompt Template
                      </label>
                      <textarea
                        value={config.prompt}
                        onChange={(e) => updateEventConfiguration(index, 'prompt', e.target.value)}
                        className="input"
                        rows={4}
                        placeholder="A pod named {{.ResourceName}} has restarted at {{.EventTime}}. Please analyze the restart reason and remediate in a fully autonomous matter..."
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              {loading ? 'Saving...' : (hook ? 'Update Hook' : 'Create Hook')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// View Hook Dialog Component
interface ViewHookDialogProps {
  hook: Hook
  onClose: () => void
}

function ViewHookDialog({ hook, onClose }: ViewHookDialogProps) {
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
        maxWidth: '50rem',
        maxHeight: '90vh',
        padding: 'var(--spacing-lg)',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '500', 
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-lg)',
          margin: 0
        }}>
          Hook: {hook.metadata.name}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Metadata
            </h4>
            <div style={{ 
              background: 'var(--color-bg-tertiary)', 
              padding: 'var(--spacing-md)', 
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '0.875rem'
            }}>
              <pre style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                {JSON.stringify(hook.metadata, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Event Configurations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {hook.spec.eventConfigurations.map((config, index) => (
                <div key={index} className="card" style={{ padding: 'var(--spacing-md)' }}>
                  <h5 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-sm)',
                    margin: 0
                  }}>
                    Configuration {index + 1}
                  </h5>
                  <div style={{ 
                    background: 'var(--color-bg-tertiary)', 
                    padding: 'var(--spacing-md)', 
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '0.875rem'
                  }}>
                    <pre style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hook.status && (
            <div>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Status
              </h4>
              <div style={{ 
                background: 'var(--color-bg-tertiary)', 
                padding: 'var(--spacing-md)', 
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '0.875rem'
              }}>
                <pre style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                  {JSON.stringify(hook.status, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-lg)'
        }}>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(hook, null, 2))}
            className="btn btn-ghost"
          >
            <Copy style={{ width: '1rem', height: '1rem' }} />
            Copy YAML
          </button>
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
