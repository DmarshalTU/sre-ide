import React, { useState, useEffect } from 'react'
import { KagentAPI, type Memory, type CreateMemoryRequest } from '../lib/kagent'
import { 
  Database, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Key, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Brain,
  FileText
} from 'lucide-react'

interface MemoryManagerProps {
  kagentApi: KagentAPI
}

export default function MemoryManager({ kagentApi }: MemoryManagerProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async () => {
    try {
      setLoading(true)
      setError(null)
      const memoryList = await kagentApi.getMemories()
      setMemories(memoryList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMemory = async (ref: string) => {
    try {
      const [namespace, name] = ref.split('/')
      await kagentApi.deleteMemory(namespace, name)
      await loadMemories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory')
    }
  }

  const getMemoryStatus = (memory: Memory) => {
    // Simple status check - in real implementation, you'd test the connection
    return memory.apiKeySecretRef ? 'configured' : 'not_configured'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
      case 'not_configured':
        return <AlertCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-warning)' }} />
      default:
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'pinecone':
        return <Database style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
      case 'chroma':
        return <Brain style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-info)' }} />
      case 'weaviate':
        return <FileText style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
      default:
        return <Database style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-text-muted)' }} />
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
          Loading memories...
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
              <Database style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 className="card-title">Memory Management</h3>
              <p style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '0.875rem', 
                margin: 0,
                fontFamily: 'var(--font-family-primary)'
              }}>
                Manage knowledge bases and memory providers for persistent context
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={loadMemories}
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
              Add Memory
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

      {/* Memory Providers Grid */}
      {memories.length === 0 ? (
        <div className="card">
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-2xl)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-md)'
          }}>
            <Database style={{ 
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
              No Memory Providers
            </h3>
            <p style={{ 
              color: 'var(--color-text-muted)', 
              margin: 0,
              fontSize: '0.875rem'
            }}>
              Set up memory providers to enable persistent knowledge storage
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
              Add Memory Provider
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 'var(--spacing-md)' 
        }}>
          {memories.map((memory) => {
            const status = getMemoryStatus(memory)
            return (
              <div
                key={memory.ref}
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
                    {getProviderIcon(memory.providerName)}
                    <div>
                      <h3 style={{ 
                        fontWeight: '500', 
                        color: 'var(--color-text-primary)',
                        margin: 0,
                        fontSize: '0.875rem'
                      }}>
                        {memory.ref}
                      </h3>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)',
                        margin: 0
                      }}>
                        {memory.providerName}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    {getStatusIcon(status)}
                    <button
                      onClick={() => handleDeleteMemory(memory.ref)}
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
                    <Key style={{ width: '1rem', height: '1rem' }} />
                    <span style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {memory.apiKeySecretRef}
                    </span>
                  </div>

                  {Object.keys(memory.memoryParams).length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)', 
                        marginBottom: 'var(--spacing-sm)',
                        margin: 0
                      }}>
                        Configuration:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        {Object.entries(memory.memoryParams).slice(0, 3).map(([key, value]) => (
                          <div
                            key={key}
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
                            <span style={{ color: 'var(--color-text-secondary)' }}>{key}</span>
                            <span style={{ 
                              color: 'var(--color-text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginLeft: 'var(--spacing-sm)'
                            }}>
                              {String(value)}
                            </span>
                          </div>
                        ))}
                        {Object.keys(memory.memoryParams).length > 3 && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--color-text-muted)', 
                            textAlign: 'center' 
                          }}>
                            +{Object.keys(memory.memoryParams).length - 3} more settings
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

      {/* Create Memory Dialog */}
      {showCreateDialog && (
        <CreateMemoryDialog
          kagentApi={kagentApi}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false)
            loadMemories()
          }}
        />
      )}
    </div>
  )
}

// Create Memory Dialog Component
interface CreateMemoryDialogProps {
  kagentApi: KagentAPI
  onClose: () => void
  onSuccess: () => void
}

function CreateMemoryDialog({ kagentApi, onClose, onSuccess }: CreateMemoryDialogProps) {
  const [formData, setFormData] = useState({
    ref: '',
    providerType: 'pinecone',
    apiKey: '',
    environment: '',
    indexName: '',
    projectId: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const request: CreateMemoryRequest = {
        ref: formData.ref,
        provider: {
          type: formData.providerType
        },
        apiKey: formData.apiKey,
        pineconeParams: formData.providerType === 'pinecone' ? {
          index: formData.indexName,
          environment: formData.environment
        } : undefined
      }

      await kagentApi.createMemory(request)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memory provider')
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
          Add Memory Provider
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
              Reference Name
            </label>
            <input
              type="text"
              value={formData.ref}
              onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
              className="input"
              placeholder="my-knowledge-base"
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
              Provider Type
            </label>
            <select
              value={formData.providerType}
              onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
              className="input"
            >
              <option value="pinecone">Pinecone</option>
              <option value="chroma">Chroma</option>
              <option value="weaviate">Weaviate</option>
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
              API Key
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="input"
              required
            />
          </div>

          {formData.providerType === 'pinecone' && (
            <>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Environment
                </label>
                <input
                  type="text"
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="input"
                  placeholder="us-west1-gcp"
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
                  Index Name
                </label>
                <input
                  type="text"
                  value={formData.indexName}
                  onChange={(e) => setFormData({ ...formData, indexName: e.target.value })}
                  className="input"
                  placeholder="sre-knowledge"
                />
              </div>
            </>
          )}

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
              {loading ? 'Creating...' : 'Create Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
