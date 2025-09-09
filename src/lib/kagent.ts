// KAgent API client for interacting with KAgent instances

// Agent information interface
export interface KagentAgent {
  id: string
  name: string
  namespace: string
  type: string
  ready: boolean
  accepted: boolean
  description?: string
}

// Chat session interface
export interface KagentSession {
  id: string
  user_id: string
  agent_ref?: string
  agent_id?: string
  last_update_time?: string
  name?: string
}

// Chat message interface
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sessionId: string
}

// API response interface
export interface ChatResponse {
  message: string
  sessionId: string
  timestamp: string
}

// Event interface for real-time updates
export interface KagentEvent {
  id: string
  data: any
  timestamp: string
}

// Tool Server interfaces
export interface DiscoveredTool {
  name: string
  description: string
}

export interface ToolServer {
  ref: string
  groupKind: string
  discoveredTools: DiscoveredTool[]
}

export interface ToolServerCreateRequest {
  type: 'RemoteMCPServer' | 'MCPServer'
  remoteMCPServer?: any
  mcpServer?: any
}

// Memory interfaces
export interface Memory {
  ref: string
  providerName: string
  apiKeySecretRef: string
  apiKeySecretKey: string
  memoryParams: Record<string, any>
}

export interface CreateMemoryRequest {
  ref: string
  provider: {
    type: string
  }
  apiKey: string
  pineconeParams?: any
}

// Task interfaces
export interface Task {
  id: string
  sessionId: string
  status: string
  metadata?: any
  history?: any[]
}

// Feedback interfaces
export interface Feedback {
  id: string
  messageId: number
  feedbackText: string
  isPositive: boolean
  issueType?: string
  userId: string
  createdAt: string
}

// Session Analytics interfaces
export interface SessionAnalytics {
  sessionId: string
  totalMessages: number
  totalTokens: number
  duration: number
  toolsUsed: string[]
  successRate: number
  createdAt: string
  lastActivity: string
}

// Model Config interfaces
export interface ModelConfig {
  ref: string
  providerName: string
  model: string
  apiKeySecretRef: string
  apiKeySecretKey: string
  modelParams?: Record<string, any>
}

// Hook CRD interfaces (from khook)
export interface EventConfiguration {
  eventType: 'pod-restart' | 'pod-pending' | 'oom-kill' | 'probe-failed'
  agentId: string
  prompt: string
}

export interface ActiveEventStatus {
  eventType: string
  resourceName: string
  firstSeen: string
  lastSeen: string
  status: 'firing' | 'resolved'
}

export interface HookStatus {
  activeEvents?: ActiveEventStatus[]
  lastUpdated?: string
}

export interface Hook {
  apiVersion: string
  kind: string
  metadata: {
    name: string
    namespace: string
    creationTimestamp?: string
    uid?: string
  }
  spec: {
    eventConfigurations: EventConfiguration[]
  }
  status?: HookStatus
}

export interface HookList {
  apiVersion: string
  kind: string
  metadata: {
    resourceVersion: string
  }
  items: Hook[]
}

// Alert interfaces
export interface Alert {
  id: string
  hookName: string
  namespace: string
  eventType: string
  resourceName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'firing' | 'resolved' | 'acknowledged'
  firstSeen: string
  lastSeen: string
  message: string
  agentId: string
  sessionId?: string
  taskId?: string
  remediationStatus?: 'pending' | 'in_progress' | 'completed' | 'failed'
}

export interface AlertSummary {
  total: number
  firing: number
  resolved: number
  acknowledged: number
  bySeverity: {
    critical: number
    high: number
    medium: number
    low: number
  }
  byEventType: {
    'pod-restart': number
    'pod-pending': number
    'oom-kill': number
    'probe-failed': number
  }
}

// Main KAgent API client class
export class KagentAPI {
  private baseUrl: string
  private userId: string
  private config: any

  constructor(config?: any, userId: string = 'admin@kagent.dev') {
    this.config = config
    this.userId = userId
    // Build API base URL from config or use default
    this.baseUrl = config ? `${config.protocol}://${config.baseUrl}:${config.port}/api` : 'http://localhost:8083/api'
  }

  // Update configuration and rebuild base URL
  updateConfig(config: any) {
    this.config = config
    this.baseUrl = `${config.protocol}://${config.baseUrl}:${config.port}/api`
  }

  // Health check endpoint
  async ping(): Promise<boolean> {
    try {
      await this.request('/health', { method: 'GET' })
      return true
    } catch (error) {
      console.error('Ping failed:', error)
      return false
    }
  }

  // Generic request method with Tauri support
  private async request<T>(endpoint: string, options: RequestInit = {}, customBaseUrl?: string): Promise<T> {
    // Use custom base URL if provided, otherwise use default logic
    let baseUrl: string
    if (customBaseUrl) {
      baseUrl = customBaseUrl
    } else {
      // Check if we're in Tauri (desktop app) or web development
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__
      const isWebDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      
      console.log('Environment detection:', { isTauri, isWebDev, hostname: window.location?.hostname })
      
      if (isTauri) {
        // In Tauri app, use the full base URL
        baseUrl = this.baseUrl
        console.log('Using Tauri base URL:', baseUrl)
      } else if (isWebDev) {
        // In web development, use proxy path
        baseUrl = '/api'
        console.log('Using web dev proxy URL:', baseUrl)
      } else {
        // Fallback to base URL
        baseUrl = this.baseUrl
        console.log('Using fallback base URL:', baseUrl)
      }
    }
    
    // Only add user_id for KAgent requests, not khook requests
    const url = customBaseUrl 
      ? `${customBaseUrl}${endpoint}`
      : `${baseUrl}${endpoint}?user_id=${this.userId}`
    
    console.log(`Making request to: ${url}`)
    console.log('Request options:', { method: options.method, body: options.body })
    console.log('URL details:', {
      url,
      isAbsolute: url.startsWith('http'),
      hasProtocol: url.includes('://'),
      baseUrl,
      endpoint,
      customBaseUrl
    })
    
    try {
      // Use Tauri invoke for desktop app, fetch for web
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        console.log('Running in Tauri, using invoke command')
        
        const { invoke } = await import('@tauri-apps/api/core')
        
        const headers: Record<string, string> = {
          'X-User-ID': this.userId,
        }
        
        // Add authentication token if available
        if (this.config?.token) {
          headers['Authorization'] = `Bearer ${this.config.token}`
        }
        
        // Add any additional headers
        if (options.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            headers[key] = String(value)
          })
        }
        
        console.log('Request headers:', headers)
        console.log('Tauri invoke - URL being passed to Rust:', url)
        console.log('Tauri invoke - URL type check:', {
          url,
          isAbsolute: url.startsWith('http'),
          hasProtocol: url.includes('://'),
          length: url.length
        })
        
        const result = await invoke<any>('http_request', {
          url: url,
          method: options.method || 'GET',
          headers: headers,
          body: options.body ? String(options.body) : null
        })
        
        console.log('Tauri invoke result:', result)
        return result as T
      } else {
        console.log('Running in browser, using fetch')
        
        // Prepare headers - avoid custom headers that trigger CORS preflight
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        }
        
        // Only add Content-Type for non-GET requests to avoid preflight
        if (options.method && options.method !== 'GET') {
          headers['Content-Type'] = 'application/json'
        }
        
        // Add authentication token if available
        if (this.config?.token) {
          headers['Authorization'] = `Bearer ${this.config.token}`
        }
        
        // Browser fallback
        const response = await fetch(url, {
          ...options,
          method: options.method || 'GET',
          mode: 'cors',
          headers: {
            ...headers,
            ...options.headers,
          },
        })

        console.log(`Response status: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`HTTP error ${response.status}: ${errorText}`)
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        const data = await response.json()
        console.log('Response data:', data)
        return data
      }
    } catch (error) {
      console.error('Request failed:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // ===== TOOL SERVER MANAGEMENT =====
  
  async getToolServers(): Promise<ToolServer[]> {
    try {
      console.log('Fetching tool servers from:', `${this.baseUrl}/toolservers`)
      const response = await this.request<{ data: ToolServer[] }>('/toolservers', { method: 'GET' })
      console.log('Raw tool servers response:', response)
      
      return response.data || []
    } catch (error) {
      console.error('Failed to get tool servers:', error)
      return []
    }
  }

  async createToolServer(toolServerRequest: ToolServerCreateRequest): Promise<ToolServer> {
    try {
      console.log('Creating tool server:', toolServerRequest)
      const response = await this.request<{ data: ToolServer }>('/toolservers', {
        method: 'POST',
        body: JSON.stringify(toolServerRequest),
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to create tool server:', error)
      throw error
    }
  }

  async deleteToolServer(namespace: string, name: string): Promise<void> {
    try {
      console.log(`Deleting tool server: ${namespace}/${name}`)
      await this.request(`/toolservers/${namespace}/${name}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to delete tool server:', error)
      throw error
    }
  }

  // ===== MEMORY MANAGEMENT =====
  
  async getMemories(): Promise<Memory[]> {
    try {
      console.log('Fetching memories from:', `${this.baseUrl}/memories`)
      const response = await this.request<{ data: Memory[] }>('/memories', { method: 'GET' })
      console.log('Raw memories response:', response)
      
      return response.data || []
    } catch (error) {
      console.error('Failed to get memories:', error)
      return []
    }
  }

  async createMemory(memoryRequest: CreateMemoryRequest): Promise<Memory> {
    try {
      console.log('Creating memory:', memoryRequest)
      const response = await this.request<{ data: Memory }>('/memories', {
        method: 'POST',
        body: JSON.stringify(memoryRequest),
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to create memory:', error)
      throw error
    }
  }

  async deleteMemory(namespace: string, name: string): Promise<void> {
    try {
      console.log(`Deleting memory: ${namespace}/${name}`)
      await this.request(`/memories/${namespace}/${name}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to delete memory:', error)
      throw error
    }
  }

  // ===== TASK MANAGEMENT =====
  
  async getTask(taskId: string): Promise<Task> {
    try {
      console.log('Fetching task:', taskId)
      const response = await this.request<{ data: Task }>(`/tasks/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get task:', error)
      throw error
    }
  }

  async createTask(taskData: any): Promise<Task> {
    try {
      console.log('Creating task:', taskData)
      const response = await this.request<{ data: Task }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to create task:', error)
      throw error
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      console.log(`Deleting task: ${taskId}`)
      await this.request(`/tasks/${taskId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw error
    }
  }

  // ===== FEEDBACK MANAGEMENT =====
  
  async submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<void> {
    try {
      console.log('Submitting feedback:', feedback)
      await this.request('/feedback', {
        method: 'POST',
        body: JSON.stringify(feedback),
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      throw error
    }
  }

  async getFeedback(): Promise<Feedback[]> {
    try {
      console.log('Fetching feedback')
      const response = await this.request<{ data: Feedback[] }>('/feedback')
      return response.data || []
    } catch (error) {
      console.error('Failed to get feedback:', error)
      return []
    }
  }

  // ===== SESSION ANALYTICS =====
  
  async getSessionEvents(sessionId: string, limit?: number, after?: string): Promise<KagentEvent[]> {
    try {
      console.log('Fetching session events:', sessionId)
      let url = `/sessions/${sessionId}`
      const params = new URLSearchParams()
      
      if (limit) params.append('limit', limit.toString())
      if (after) params.append('after', after)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await this.request<{ data: { session: KagentSession, events: KagentEvent[] } }>(url)
      return response.data?.events || []
    } catch (error) {
      console.error('Failed to get session events:', error)
      return []
    }
  }

  async getSessionTasks(sessionId: string): Promise<Task[]> {
    try {
      console.log('Fetching session tasks:', sessionId)
      const response = await this.request<{ data: Task[] }>(`/sessions/${sessionId}/tasks`)
      return response.data || []
    } catch (error) {
      console.error('Failed to get session tasks:', error)
      return []
    }
  }

  async addEventToSession(sessionId: string, eventData: { id: string, data: string }): Promise<void> {
    try {
      console.log('Adding event to session:', sessionId, eventData)
      await this.request(`/sessions/${sessionId}/events`, {
        method: 'POST',
        body: JSON.stringify(eventData),
      })
    } catch (error) {
      console.error('Failed to add event to session:', error)
      throw error
    }
  }

  async getSessionsForAgent(namespace: string, agentName: string): Promise<KagentSession[]> {
    try {
      console.log(`Fetching sessions for agent: ${namespace}/${agentName}`)
      const response = await this.request<{ data: KagentSession[] }>(`/sessions/agent/${namespace}/${agentName}`, { method: 'GET' })
      return response.data || []
    } catch (error) {
      console.error('Failed to get sessions for agent:', error)
      return []
    }
  }

  // ===== MODEL CONFIG MANAGEMENT =====
  
  async getModelConfigs(): Promise<ModelConfig[]> {
    try {
      console.log('Fetching model configs')
      const response = await this.request<{ data: ModelConfig[] }>('/modelconfigs')
      return response.data || []
    } catch (error) {
      console.error('Failed to get model configs:', error)
      return []
    }
  }

  async getModelConfig(namespace: string, name: string): Promise<ModelConfig> {
    try {
      console.log(`Fetching model config: ${namespace}/${name}`)
      const response = await this.request<{ data: ModelConfig }>(`/modelconfigs/${namespace}/${name}`)
      return response.data
    } catch (error) {
      console.error('Failed to get model config:', error)
      throw error
    }
  }

  async createModelConfig(modelConfig: any): Promise<ModelConfig> {
    try {
      console.log('Creating model config:', modelConfig)
      const response = await this.request<{ data: ModelConfig }>('/modelconfigs', {
        method: 'POST',
        body: JSON.stringify(modelConfig),
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to create model config:', error)
      throw error
    }
  }

  async updateModelConfig(namespace: string, name: string, modelConfig: any): Promise<ModelConfig> {
    try {
      console.log(`Updating model config: ${namespace}/${name}`)
      const response = await this.request<{ data: ModelConfig }>(`/modelconfigs/${namespace}/${name}`, {
        method: 'PUT',
        body: JSON.stringify(modelConfig),
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to update model config:', error)
      throw error
    }
  }

  async deleteModelConfig(namespace: string, name: string): Promise<void> {
    try {
      console.log(`Deleting model config: ${namespace}/${name}`)
      await this.request(`/modelconfigs/${namespace}/${name}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to delete model config:', error)
      throw error
    }
  }

  // ===== PROVIDERS AND MODELS =====
  
  async getProviders(): Promise<any[]> {
    try {
      console.log('Fetching providers')
      const response = await this.request<{ data: any[] }>('/providers/models')
      return response.data || []
    } catch (error) {
      console.error('Failed to get providers:', error)
      return []
    }
  }

  async getModels(): Promise<any[]> {
    try {
      console.log('Fetching models')
      const response = await this.request<{ data: any[] }>('/models')
      return response.data || []
    } catch (error) {
      console.error('Failed to get models:', error)
      return []
    }
  }

  // ===== NAMESPACES =====
  
  async getNamespaces(): Promise<string[]> {
    try {
      console.log('Fetching namespaces')
      const response = await this.request<{ data: string[] }>('/namespaces')
      return response.data || []
    } catch (error) {
      console.error('Failed to get namespaces:', error)
      return []
    }
  }

  // ===== LANGGRAPH CHECKPOINTS =====
  
  async saveCheckpoint(checkpointData: any): Promise<void> {
    try {
      console.log('Saving checkpoint:', checkpointData)
      await this.request('/langgraph/checkpoints', {
        method: 'POST',
        body: JSON.stringify(checkpointData),
      })
    } catch (error) {
      console.error('Failed to save checkpoint:', error)
      throw error
    }
  }

  async getCheckpoints(): Promise<any[]> {
    try {
      console.log('Fetching checkpoints')
      const response = await this.request<{ data: any[] }>('/langgraph/checkpoints')
      return response.data || []
    } catch (error) {
      console.error('Failed to get checkpoints:', error)
      return []
    }
  }

  async deleteCheckpoint(threadId: string): Promise<void> {
    try {
      console.log(`Deleting checkpoint: ${threadId}`)
      await this.request(`/langgraph/checkpoints/${threadId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to delete checkpoint:', error)
      throw error
    }
  }

  // ===== ANALYTICS AND INSIGHTS =====
  
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
    try {
      console.log('Calculating session analytics:', sessionId)
      
      // Get session events and tasks to calculate analytics
      const [events, tasks] = await Promise.all([
        this.getSessionEvents(sessionId),
        this.getSessionTasks(sessionId)
      ])
      
      const session = await this.getSession(sessionId)
      if (!session) {
        throw new Error('Session not found')
      }
      
      // Calculate analytics
      const totalMessages = events.length
      const totalTokens = tasks.reduce((sum, task) => {
        const usage = task.metadata?.kagent_usage_metadata
        return sum + (usage?.totalTokenCount || 0)
      }, 0)
      
      const toolsUsed = [...new Set(
        tasks.flatMap(task => 
          task.history?.filter((h: any) => h.kind === 'message')
            .flatMap((h: any) => h.parts?.filter((p: any) => p.kind === 'data') || [])
            .map((p: any) => p.metadata?.kagent_type === 'function_call' ? p.data?.name : null)
            .filter(Boolean) || []
        )
      )]
      
      const createdAt = session.last_update_time || new Date().toISOString()
      const lastActivity = events.length > 0 ? events[events.length - 1].timestamp : createdAt
      
      return {
        sessionId,
        totalMessages,
        totalTokens,
        duration: new Date(lastActivity).getTime() - new Date(createdAt).getTime(),
        toolsUsed,
        successRate: 0.85, // Placeholder - would need more sophisticated calculation
        createdAt,
        lastActivity
      }
    } catch (error) {
      console.error('Failed to get session analytics:', error)
      throw error
    }
  }

  // ===== EXISTING METHODS =====

  async getAgents(): Promise<KagentAgent[]> {
    try {
      console.log('Fetching agents from:', `${this.baseUrl}/agents`)
      const response = await this.request<any>('/agents', { method: 'GET' })
      console.log('Raw agents response:', response)
      
      // Handle different response formats
      let agentsArray = []
      if (Array.isArray(response)) {
        agentsArray = response
      } else if (response.data && Array.isArray(response.data)) {
        agentsArray = response.data
      } else if (response.items && Array.isArray(response.items)) {
        agentsArray = response.items
      } else {
        console.warn('Unexpected agents response format:', response)
        return []
      }
      
      // Normalize the agent data
      return agentsArray.map((item: any) => {
        const agent = item.agent || item
        const metadata = agent.metadata || {}
        const spec = agent.spec || {}
        const status = agent.status || {}
        
        return {
          id: agent.id || metadata.name || agent.name || 'unknown',
          name: metadata.name || agent.name || 'Unknown',
          namespace: metadata.namespace || agent.namespace || 'kagent',
          type: spec.type || agent.type || 'Declarative',
          ready: item.deploymentReady === true || 
                 status.conditions?.some((c: any) => c.type === 'Ready' && c.status === 'True') ||
                 false,
          accepted: status.conditions?.some((c: any) => c.type === 'Accepted' && c.status === 'True') || true,
          description: spec.description || agent.description || ''
        }
      })
    } catch (error) {
      console.error('Failed to get agents:', error)
      throw error
    }
  }

  async getSessions(): Promise<KagentSession[]> {
    try {
      const response = await this.request<{ data: KagentSession[] }>('/sessions', { method: 'GET' })
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      // Return empty array instead of throwing to avoid breaking the UI
      return []
    }
  }

  async createSession(agentRef: string, sessionId?: string): Promise<KagentSession> {
    const data: any = {
      user_id: this.userId,
      agent_ref: agentRef,
    }
    
    if (sessionId) {
      data.id = sessionId
    }

    const response = await this.request<{ data: KagentSession }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    return response.data
  }

  async getSession(sessionId: string): Promise<KagentSession | null> {
    try {
      console.log('Getting session:', sessionId)
      
      const response = await this.request<{ data: { session: KagentSession, events: KagentEvent[] } }>(`/sessions/${sessionId}`)
      console.log('Session response:', response)
      
      if (response.data && response.data.session) {
        return response.data.session
      } else if (response.data && (response.data as any).id) {
        // Direct session object
        return response.data as unknown as KagentSession
      } else {
        console.error('Unexpected session response format:', response)
        return null
      }
    } catch (error) {
      console.error('Failed to get session:', error)
      
      // For mock sessions, return a mock session object
      if (sessionId.startsWith('mock-session-')) {
        return {
          id: sessionId,
          user_id: this.userId,
          agent_ref: 'k8s-agent', // Default agent
          name: 'Mock Session',
          last_update_time: new Date().toISOString()
        }
      }
      
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
    try {
      console.log('sendMessage called with:', { sessionId, message })
      
      // First, get the session to find the agent reference
      const session = await this.getSession(sessionId)
      console.log('Retrieved session:', session)
      
      if (!session) {
        throw new Error('Session not found')
      }

      // Extract agent information from session
      let agentName: string
      let namespace: string = 'kagent'
      
      if (session.agent_id) {
        const parts = session.agent_id.split('__NS__')
        if (parts.length === 2) {
          namespace = parts[0]
          agentName = parts[1].replace(/_/g, '-')
          console.log(`Parsed agent_id: namespace=${namespace}, agent=${agentName}`)
        } else {
          agentName = session.agent_id.replace(/_/g, '-')
          console.log(`Fallback parsing agent_id: ${agentName}`)
        }
      } else {
        agentName = 'k8s-agent'
        console.log('Using fallback agent name:', agentName)
      }
      
      // Use the correct A2A URL format - ensure we have a proper base URL
      const baseUrl = this.baseUrl.replace('/api', '')
      const a2aUrl = `${baseUrl}/api/a2a/${namespace}/${agentName}/`
      console.log(`Using A2A URL: ${a2aUrl}`)
      
      // Ensure the URL is absolute
      if (!a2aUrl.startsWith('http')) {
        throw new Error(`Invalid A2A URL: ${a2aUrl} - URL must be absolute`)
      }
      
      // Use the correct JSON-RPC format
      const a2aData = {
        jsonrpc: "2.0",
        method: "message/stream",
        params: {
          message: {
            kind: "message",
            messageId: `msg-${Date.now()}`,
            role: "user",
            parts: [{ kind: "text", text: message }],
            contextId: sessionId
          }
        },
        id: `req-${Date.now()}`
      }
      
      console.log('A2A data being sent:', a2aData)
      
      // Use browser fetch for A2A requests (SSE streams)
      const response = await fetch(a2aUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(a2aData)
      })

      if (!response.ok) {
        throw new Error(`A2A request failed: ${response.status}`)
      }

      // Handle SSE stream response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let lastMessage = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE events
        let eventEndIndex
        while ((eventEndIndex = buffer.indexOf('\n\n')) >= 0) {
          const eventText = buffer.substring(0, eventEndIndex)
          buffer = buffer.substring(eventEndIndex + 2)

          if (eventText.trim()) {
            const lines = eventText.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataString = line.substring(6)
                
                if (dataString === '[DONE]') {
                  break
                }
                
                try {
                  const eventData = JSON.parse(dataString)
                  const result = eventData.result || eventData
                  
                  // Look for the final message from the agent
                  if (result.status?.message?.role === 'agent') {
                    lastMessage = result.status.message.parts?.[0]?.text || ''
                  }
                } catch (error) {
                  console.error("Failed to parse SSE data:", error, dataString)
                }
              }
            }
          }
        }
      }

      reader.releaseLock()

      if (lastMessage) {
        return {
          message: lastMessage,
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }
      } else {
        throw new Error('No agent message found in SSE stream')
      }
    } catch (error) {
      console.error('Failed to send message via A2A:', error)
      
      // Fallback to mock response for now
      return {
        message: `Mock response to: "${message}" (A2A error: ${error})`,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getSessionMessages(_sessionId: string): Promise<ChatMessage[]> {
    try {
      // The kagent API doesn't have a /messages endpoint for sessions
      // Messages are handled through the A2A protocol, not stored in sessions
      console.log('Session messages endpoint not available in kagent API, returning empty array')
      return []
    } catch (error) {
      console.error('Failed to get session messages:', error)
      return []
    }
  }

  async createSessionWithName(agentRef: string, sessionName: string): Promise<KagentSession> {
    // Convert agent name to Kubernetes format (namespace/name)
    const agentRefK8s = `kagent/${agentRef}`
    
    const data = {
      user_id: this.userId,
      agent_ref: agentRefK8s,
      name: sessionName,
    }

    try {
      console.log('Creating session with data:', data)
      
      const response = await this.request<{ data: KagentSession }>('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      
      console.log('Session creation response:', response)
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid session response - missing session ID')
      }
      
      // Convert the response to our KagentSession format
      console.log('Raw response.data:', JSON.stringify(response.data, null, 2))
      
      const session: KagentSession = {
        id: response.data.id,
        user_id: response.data.user_id || this.userId,
        agent_ref: response.data.agent_ref || agentRefK8s,
        name: response.data.name,
        last_update_time: response.data.last_update_time || new Date().toISOString()
      }
      
      console.log('Converted session:', session)
      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      
      // Try to get existing sessions for this agent
      try {
        console.log('Trying to get existing sessions for agent:', agentRef)
        const sessions = await this.getSessions()
        const existingSession = sessions.find(s => s.agent_ref === agentRef)
        
        if (existingSession) {
          console.log('Found existing session:', existingSession)
          return existingSession
        }
      } catch (sessionError) {
        console.error('Failed to get existing sessions:', sessionError)
      }
      
      // Return a mock session as last resort
      const mockSession = {
        id: `mock-session-${Date.now()}`,
        user_id: this.userId,
        agent_ref: agentRef,
        name: sessionName,
        last_update_time: new Date().toISOString()
      }
      
      console.log('Using mock session:', mockSession)
      return mockSession
    }
  }

  // Hook CRD Management Methods
  async getHooks(): Promise<Hook[]> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      
      console.log('Khook API - Using hardcoded URL:', khookBaseUrl)
      console.log('Fetching hooks from khook API:', `${khookBaseUrl}/api/hooks`)
      const response = await this.request<HookList>('/api/hooks', { method: 'GET' }, khookBaseUrl)
      return response.items || []
    } catch (error) {
      console.error('Failed to get hooks:', error)
      throw new Error(`Network error: ${error}`)
    }
  }

  async getHook(name: string, namespace: string = 'default'): Promise<Hook> {
    try {
      const isWebDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      
      console.log('Hook API - Environment detection:', { isWebDev, hostname: window.location?.hostname })
      
      const khookBaseUrl = isWebDev
        ? '/khook-api'
        : 'http://localhost:8082'
      
      console.log('Hook API - Khook base URL:', khookBaseUrl)
      console.log('Hook API - Full URL will be:', `${khookBaseUrl}/api/hooks/${namespace}/${name}`)
      
      const response = await this.request<Hook>(`/api/hooks/${namespace}/${name}`, { method: 'GET' }, khookBaseUrl)
      return response
    } catch (error) {
      console.error(`Failed to get hook ${name}:`, error)
      throw new Error(`Network error: ${error}`)
    }
  }

  async createHook(hook: Hook): Promise<Hook> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      const response = await this.request<Hook>('/api/hooks', {
        method: 'POST',
        body: JSON.stringify(hook)
      }, khookBaseUrl)
      return response
    } catch (error) {
      console.error('Failed to create hook:', error)
      throw new Error(`Network error: ${error}`)
    }
  }

  async updateHook(name: string, namespace: string, hook: Hook): Promise<Hook> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      const response = await this.request<Hook>(`/api/hooks/${namespace}/${name}`, {
        method: 'PUT',
        body: JSON.stringify(hook)
      }, khookBaseUrl)
      return response
    } catch (error) {
      console.error(`Failed to update hook ${name}:`, error)
      throw new Error(`Network error: ${error}`)
    }
  }

  async deleteHook(name: string, namespace: string = 'default'): Promise<void> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      await this.request(`/api/hooks/${namespace}/${name}`, { method: 'DELETE' }, khookBaseUrl)
    } catch (error) {
      console.error(`Failed to delete hook ${name}:`, error)
      throw new Error(`Network error: ${error}`)
    }
  }

  // Alert Management Methods
  async getAlerts(): Promise<Alert[]> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      
      console.log('Alerts API - Using hardcoded URL:', khookBaseUrl)
      
      console.log('Alerts API - Using base URL:', khookBaseUrl)
      console.log('Fetching alerts from khook API:', `${khookBaseUrl}/api/alerts`)
      const response = await this.request<{data: Alert[]}>('/api/alerts', { method: 'GET' }, khookBaseUrl)
      return response?.data || []
    } catch (error) {
      console.error('Failed to get alerts:', error)
      throw new Error(`Network error: ${error}`)
    }
  }

  async getAlertSummary(): Promise<AlertSummary> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      
      console.log('Alert Summary API - Using hardcoded URL:', khookBaseUrl)
      const response = await this.request<{data: AlertSummary}>('/api/alerts/summary', { method: 'GET' }, khookBaseUrl)
      return response?.data || { total: 0, pending: 0, acknowledged: 0, resolved: 0, critical: 0, warning: 0, info: 0 }
    } catch (error) {
      console.error('Failed to get alert summary:', error)
      throw new Error(`Network error: ${error}`)
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      await this.request(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' }, khookBaseUrl)
    } catch (error) {
      console.error(`Failed to acknowledge alert ${alertId}:`, error)
      throw new Error(`Network error: ${error}`)
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      await this.request(`/api/alerts/${alertId}/resolve`, { method: 'POST' }, khookBaseUrl)
    } catch (error) {
      console.error(`Failed to resolve alert ${alertId}:`, error)
      throw new Error(`Network error: ${error}`)
    }
  }

  // Real-time Alert Streaming
  async subscribeToAlerts(onAlert: (alert: Alert) => void, onError?: (error: Error) => void): Promise<EventSource> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      
      console.log('Alert Streaming - Using hardcoded URL:', khookBaseUrl)
      const streamUrl = `${khookBaseUrl}/api/alerts/stream`
      console.log('Alert Streaming - Full URL:', streamUrl)
      
      const eventSource = new EventSource(streamUrl)
      
      eventSource.addEventListener('alert', (event) => {
        try {
          const alert: Alert = JSON.parse(event.data)
          onAlert(alert)
        } catch (error) {
          console.error('Failed to parse alert event:', error)
          onError?.(error as Error)
        }
      })

      eventSource.addEventListener('heartbeat', () => {
        // Heartbeat, ignore
        return
      })

      eventSource.onerror = (error) => {
        console.error('Alert stream error:', error)
        onError?.(error as any)
      }

      return eventSource
    } catch (error) {
      console.error('Failed to subscribe to alerts:', error)
      throw new Error(`Network error: ${error}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to kagent API...')
      await this.request('/sessions')
      console.log('Connection test successful')
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}
