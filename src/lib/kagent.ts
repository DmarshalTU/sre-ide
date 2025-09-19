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
  data: unknown
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

export interface RemoteMCPServer {
  name: string
  endpoint: string
  [key: string]: unknown
}

export interface MCPServer {
  name: string
  command: string[]
  [key: string]: unknown
}

export interface ToolServerCreateRequest {
  type: 'RemoteMCPServer' | 'MCPServer'
  remoteMCPServer?: RemoteMCPServer
  mcpServer?: MCPServer
}

// Memory interfaces
export interface Memory {
  ref: string
  providerName: string
  apiKeySecretRef: string
  apiKeySecretKey: string
  memoryParams: Record<string, unknown>
}

export interface PineconeParams {
  index: string
  environment?: string
  [key: string]: unknown
}

export interface MemoryProvider {
  type: string
}

export interface CreateMemoryRequest {
  ref: string
  provider: MemoryProvider
  apiKey: string
  pineconeParams?: PineconeParams
}

// Task interfaces
export interface TaskMetadata {
  kagent_usage_metadata?: {
    totalTokenCount?: number
  }
  kagent_type?: string
  [key: string]: unknown
}

export interface TaskHistoryPart {
  kind: string
  text?: string
  data?: {
    name?: string
    [key: string]: unknown
  }
  metadata?: TaskMetadata
}

export interface TaskHistoryItem {
  kind: string
  parts?: TaskHistoryPart[]
  [key: string]: unknown
}

export interface Task {
  id: string
  sessionId: string
  status: string
  metadata?: TaskMetadata
  history?: TaskHistoryItem[]
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
  modelParams?: Record<string, unknown>
}

// Hook CRD interfaces (from khook)
export interface EventConfiguration {
  eventType: 'pod-restart' | 'pod-pending' | 'oom-kill' | 'probe-failed'
  agentRef: {
    name: string
  }
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

export interface HookMetadata {
  name: string
  namespace: string
  creationTimestamp?: string
  uid?: string
}

export interface HookSpec {
  eventConfigurations: EventConfiguration[]
}

export interface Hook {
  apiVersion: string
  kind: string
  metadata: HookMetadata
  spec: HookSpec
  status?: HookStatus
}

export interface HookListMetadata {
  resourceVersion: string
}

export interface HookList {
  apiVersion: string
  kind: string
  metadata: HookListMetadata
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

export interface AlertSeverityBreakdown {
  critical: number
  high: number
  medium: number
  low: number
}

export interface AlertEventTypeBreakdown {
  'pod-restart': number
  'pod-pending': number
  'oom-kill': number
  'probe-failed': number
}

export interface AlertSummary {
  total: number
  firing: number
  resolved: number
  acknowledged: number
  bySeverity: AlertSeverityBreakdown
  byEventType: AlertEventTypeBreakdown
}

// Configuration interface
export interface KagentConfig {
  protocol: string
  baseUrl: string
  port: number
  token?: string
}

// API Response interfaces
export interface ApiResponse<T> {
  data: T
}

export interface SessionWithEventsResponse {
  session: KagentSession
  events: KagentEvent[]
}

// A2A Protocol interfaces
export interface A2AMessagePart {
  kind: string
  text: string
}

export interface A2AMessage {
  kind: string
  messageId: string
  role: string
  parts: A2AMessagePart[]
  contextId: string
}

export interface A2AParams {
  message: A2AMessage
}

export interface A2ARequest {
  jsonrpc: string
  method: string
  params: A2AParams
  id: string
}

export interface A2AResponseMessage {
  role: string
  parts?: Array<{ text?: string }>
}

export interface A2AResponseStatus {
  message?: A2AResponseMessage
}

export interface A2AResult {
  status?: A2AResponseStatus
}

export interface A2AResponse {
  result?: A2AResult
}

// Main KAgent API client class
export class KagentAPI {
  private baseUrl: string
  private userId: string
  private config?: KagentConfig

  constructor(config?: KagentConfig, userId: string = 'admin@kagent.dev') {
    this.config = config
    this.userId = userId
    // Build API base URL from config or use default
    this.baseUrl = config ? `${config.protocol}://${config.baseUrl}:${config.port}/api` : 'http://localhost:8083/api'
  }

  // Update configuration and rebuild base URL
  updateConfig(config: KagentConfig): void {
    this.config = config
    this.baseUrl = `${config.protocol}://${config.baseUrl}:${config.port}/api`
  }

  // Health check endpoint
  async ping(): Promise<boolean> {
    try {
      await this.request('/health', { method: 'GET' })
      return true
    } catch (error) {
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
      
      if (isTauri) {
        // In Tauri app, use the full base URL
        baseUrl = this.baseUrl
      } else if (isWebDev) {
        // In web development, use proxy path
        baseUrl = '/api'
      } else {
        // Fallback to base URL
        baseUrl = this.baseUrl
      }
    }
    
    // Only add user_id for KAgent requests, not khook requests
    const url = customBaseUrl 
      ? `${customBaseUrl}${endpoint}`
      : `${baseUrl}${endpoint}?user_id=${this.userId}`
    
    try {
      // Use Tauri invoke for desktop app, fetch for web
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
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
        
        const result = await invoke<T>('http_request', {
          url: url,
          method: options.method || 'GET',
          headers: headers,
          body: options.body ? String(options.body) : null
        })
        
        return result
      } else {
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

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        const data = await response.json()
        return data
      }
    } catch (error) {
      throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // ===== TOOL SERVER MANAGEMENT =====
  
  async getToolServers(): Promise<ToolServer[]> {
    try {
      const response = await this.request<ApiResponse<ToolServer[]>>('/toolservers', { method: 'GET' })
      return response.data || []
    } catch (error) {
      return []
    }
  }

  async createToolServer(toolServerRequest: ToolServerCreateRequest): Promise<ToolServer> {
    try {
      const response = await this.request<ApiResponse<ToolServer>>('/toolservers', {
        method: 'POST',
        body: JSON.stringify(toolServerRequest),
      })
      
      return response.data
    } catch (error) {
      throw error
    }
  }

  async deleteToolServer(namespace: string, name: string): Promise<void> {
    try {
      await this.request(`/toolservers/${namespace}/${name}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw error
    }
  }

  // ===== MEMORY MANAGEMENT =====
  
  async getMemories(): Promise<Memory[]> {
    try {
      const response = await this.request<ApiResponse<Memory[]>>('/memories', { method: 'GET' })
      return response.data || []
    } catch (error) {
      return []
    }
  }

  async createMemory(memoryRequest: CreateMemoryRequest): Promise<Memory> {
    try {
      const response = await this.request<ApiResponse<Memory>>('/memories', {
        method: 'POST',
        body: JSON.stringify(memoryRequest),
      })
      
      return response.data
    } catch (error) {
      throw error
    }
  }

  async deleteMemory(namespace: string, name: string): Promise<void> {
    try {
      await this.request(`/memories/${namespace}/${name}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw error
    }
  }

  // ===== TASK MANAGEMENT =====
  
  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await this.request<ApiResponse<Task>>(`/tasks/${taskId}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async createTask(taskData: Record<string, unknown>): Promise<Task> {
    try {
      const response = await this.request<ApiResponse<Task>>('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      })
      
      return response.data
    } catch (error) {
      throw error
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.request(`/tasks/${taskId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw error
    }
  }

  // ===== FEEDBACK MANAGEMENT =====
  
  async submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<void> {
    try {
      await this.request('/feedback', {
        method: 'POST',
        body: JSON.stringify(feedback),
      })
    } catch (error) {
      throw error
    }
  }

  async getFeedback(): Promise<Feedback[]> {
    try {
      const response = await this.request<ApiResponse<Feedback[]>>('/feedback')
      return response.data || []
    } catch (error) {
      return []
    }
  }

  // ===== SESSION ANALYTICS =====
  
  async getSessionEvents(sessionId: string, limit?: number, after?: string): Promise<KagentEvent[]> {
    try {
      let url = `/sessions/${sessionId}`
      const params = new URLSearchParams()
      
      if (limit) params.append('limit', limit.toString())
      if (after) params.append('after', after)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await this.request<ApiResponse<SessionWithEventsResponse>>(url)
      return response.data?.events || []
    } catch (error) {
      return []
    }
  }

  async getSessionTasks(sessionId: string): Promise<Task[]> {
    try {
      const response = await this.request<ApiResponse<Task[]>>(`/sessions/${sessionId}/tasks`)
      return response.data || []
    } catch (error) {
      return []
    }
  }

  async addEventToSession(sessionId: string, eventData: { id: string, data: string }): Promise<void> {
    try {
      await this.request(`/sessions/${sessionId}/events`, {
        method: 'POST',
        body: JSON.stringify(eventData),
      })
    } catch (error) {
      throw error
    }
  }

  async getSessionsForAgent(namespace: string, agentName: string): Promise<KagentSession[]> {
    try {
      const response = await this.request<ApiResponse<KagentSession[]>>(`/sessions/agent/${namespace}/${agentName}`, { method: 'GET' })
      return response.data || []
    } catch (error) {
      return []
    }
  }

  // ===== MODEL CONFIG MANAGEMENT =====
  
  async getModelConfigs(): Promise<ModelConfig[]> {
    try {
      const response = await this.request<ApiResponse<ModelConfig[]>>('/modelconfigs')
      return response.data || []
    } catch (error) {
      return []
    }
  }

  async getModelConfig(namespace: string, name: string): Promise<ModelConfig> {
    try {
      const response = await this.request<ApiResponse<ModelConfig>>(`/modelconfigs/${namespace}/${name}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async createModelConfig(modelConfig: Record<string, unknown>): Promise<ModelConfig> {
    try {
      const response = await this.request<ApiResponse<ModelConfig>>('/modelconfigs', {
        method: 'POST',
        body: JSON.stringify(modelConfig),
      })
      
      return response.data
    } catch (error) {
      throw error
    }
  }

  async updateModelConfig(namespace: string, name: string, modelConfig: Record<string, unknown>): Promise<ModelConfig> {
    try {
      const response = await this.request<ApiResponse<ModelConfig>>(`/modelconfigs/${namespace}/${name}`, {
        method: 'PUT',
        body: JSON.stringify(modelConfig),
      })
      
      return response.data
    } catch (error) {
      throw error
    }
  }

  async deleteModelConfig(namespace: string, name: string): Promise<void> {
    try {
      await this.request(`/modelconfigs/${namespace}/${name}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw error
    }
  }

  // ===== PROVIDERS AND MODELS =====
  
  async getProviders(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.request<ApiResponse<Record<string, unknown>[]>>('/providers/models')
      return response.data || []
    } catch (error) {
      return []
    }
  }

  async getModels(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.request<ApiResponse<Record<string, unknown>[]>>('/models')
      return response.data || []
    } catch (error) {
      return []
    }
  }

  // ===== NAMESPACES =====
  
  async getNamespaces(): Promise<string[]> {
    try {
      const response = await this.request<ApiResponse<string[]>>('/namespaces')
      return response.data || []
    } catch (error) {
      return []
    }
  }

  // ===== LANGGRAPH CHECKPOINTS =====
  
  async saveCheckpoint(checkpointData: Record<string, unknown>): Promise<void> {
    try {
      await this.request('/langgraph/checkpoints', {
        method: 'POST',
        body: JSON.stringify(checkpointData),
      })
    } catch (error) {
      throw error
    }
  }

  async getCheckpoints(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.request<ApiResponse<Record<string, unknown>[]>>('/langgraph/checkpoints')
      return response.data || []
    } catch (error) {
      return []
    }
  }

  async deleteCheckpoint(threadId: string): Promise<void> {
    try {
      await this.request(`/langgraph/checkpoints/${threadId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw error
    }
  }

  // ===== ANALYTICS AND INSIGHTS =====
  
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
    try {
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
          task.history?.filter((h: TaskHistoryItem) => h.kind === 'message')
            .flatMap((h: TaskHistoryItem) => h.parts?.filter((p: TaskHistoryPart) => p.kind === 'data') || [])
            .map((p: TaskHistoryPart) => p.metadata?.kagent_type === 'function_call' ? p.data?.name : null)
            .filter(Boolean) || []
        )
      )] as string[]
      
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
      throw error
    }
  }

  // ===== EXISTING METHODS =====

  async getAgents(): Promise<KagentAgent[]> {
    try {
      const response = await this.request<unknown>('/agents', { method: 'GET' })
      
      // Handle different response formats
      let agentsArray: unknown[] = []
      if (Array.isArray(response)) {
        agentsArray = response
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        agentsArray = (response as any).data
      } else if (response && typeof response === 'object' && 'items' in response && Array.isArray((response as any).items)) {
        agentsArray = (response as any).items
      } else {
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
      throw error
    }
  }

  async getSessions(): Promise<KagentSession[]> {
    try {
      const response = await this.request<ApiResponse<KagentSession[]>>('/sessions', { method: 'GET' })
      return response.data || []
    } catch (error) {
      // Return empty array instead of throwing to avoid breaking the UI
      return []
    }
  }

  async createSession(agentRef: string, sessionId?: string): Promise<KagentSession> {
    const data: Record<string, unknown> = {
      user_id: this.userId,
      agent_ref: agentRef,
    }
    
    if (sessionId) {
      data.id = sessionId
    }

    const response = await this.request<ApiResponse<KagentSession>>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    return response.data
  }

  async getSession(sessionId: string): Promise<KagentSession | null> {
    try {
      const response = await this.request<ApiResponse<SessionWithEventsResponse | KagentSession>>(`/sessions/${sessionId}`)
      
      if (response.data && 'session' in response.data) {
        return response.data.session
      } else if (response.data && 'id' in response.data) {
        // Direct session object
        return response.data as KagentSession
      } else {
        return null
      }
    } catch (error) {
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
      // First, get the session to find the agent reference
      const session = await this.getSession(sessionId)
      
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
        } else {
          agentName = session.agent_id.replace(/_/g, '-')
        }
      } else {
        agentName = 'k8s-agent'
      }
      
      // Use the correct A2A URL format - ensure we have a proper base URL
      const baseUrl = this.baseUrl.replace('/api', '')
      const a2aUrl = `${baseUrl}/api/a2a/${namespace}/${agentName}/`
      
      // Ensure the URL is absolute
      if (!a2aUrl.startsWith('http')) {
        throw new Error(`Invalid A2A URL: ${a2aUrl} - URL must be absolute`)
      }
      
      // Use the correct JSON-RPC format
      const a2aData: A2ARequest = {
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
                  const eventData = JSON.parse(dataString) as A2AResponse
                  const result = eventData.result || eventData
                  
                  // Look for the final message from the agent
                  if ('status' in result && result.status?.message?.role === 'agent') {
                    lastMessage = result.status.message.parts?.[0]?.text || ''
                  }
                } catch (parseError) {
                  // Failed to parse SSE data, continue
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
      return []
    } catch (error) {
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
      const response = await this.request<ApiResponse<KagentSession>>('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid session response - missing session ID')
      }
      
      // Convert the response to our KagentSession format
      const session: KagentSession = {
        id: response.data.id,
        user_id: response.data.user_id || this.userId,
        agent_ref: response.data.agent_ref || agentRefK8s,
        name: response.data.name,
        last_update_time: response.data.last_update_time || new Date().toISOString()
      }
      
      return session
    } catch (error) {
      // Try to get existing sessions for this agent
      try {
        const sessions = await this.getSessions()
        const existingSession = sessions.find(s => s.agent_ref === agentRef)
        
        if (existingSession) {
          return existingSession
        }
      } catch (sessionError) {
        // Failed to get existing sessions
      }
      
      // Return a mock session as last resort
      const mockSession = {
        id: `mock-session-${Date.now()}`,
        user_id: this.userId,
        agent_ref: agentRef,
        name: sessionName,
        last_update_time: new Date().toISOString()
      }
      
      return mockSession
    }
  }

  // Hook CRD Management Methods
  async getHooks(): Promise<Hook[]> {
    try {
      // Use the new /api/v1/hooks endpoint consistently
      const khookBaseUrl = 'http://localhost:8082'
      
      const response = await this.request<HookList>('/api/v1/hooks', { method: 'GET' }, khookBaseUrl)
      return response.items || []
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  async getHook(name: string, namespace: string = 'default'): Promise<Hook> {
    try {
      const isWebDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      
      const khookBaseUrl = isWebDev
        ? '/khook-api'
        : 'http://localhost:8082'
      
      const response = await this.request<Hook>(`/api/v1/hooks/${namespace}/${name}`, { method: 'GET' }, khookBaseUrl)
      return response
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  async createHook(hook: Hook): Promise<Hook> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      const response = await this.request<Hook>('/api/v1/hooks', {
        method: 'POST',
        body: JSON.stringify(hook)
      }, khookBaseUrl)
      return response
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  async updateHook(name: string, namespace: string, hook: Hook): Promise<Hook> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      const response = await this.request<Hook>(`/api/v1/hooks/${namespace}/${name}`, {
        method: 'PUT',
        body: JSON.stringify(hook)
      }, khookBaseUrl)
      return response
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  async deleteHook(name: string, namespace: string = 'default'): Promise<void> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      await this.request(`/api/v1/hooks/${namespace}/${name}`, { method: 'DELETE' }, khookBaseUrl)
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  // Alert Management Methods
  async getAlerts(): Promise<Alert[]> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      
      const response = await this.request<ApiResponse<Alert[]>>('/api/alerts', { method: 'GET' }, khookBaseUrl)
      return response?.data || []
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  async getAlertSummary(): Promise<AlertSummary> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      
      const response = await this.request<ApiResponse<AlertSummary>>('/api/alerts/summary', { method: 'GET' }, khookBaseUrl)
      return response?.data || { 
        total: 0, 
        firing: 0, 
        acknowledged: 0, 
        resolved: 0, 
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        byEventType: { 'pod-restart': 0, 'pod-pending': 0, 'oom-kill': 0, 'probe-failed': 0 }
      }
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      await this.request(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' }, khookBaseUrl)
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      await this.request(`/api/alerts/${alertId}/resolve`, { method: 'POST' }, khookBaseUrl)
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  // Real-time Alert Streaming
  async subscribeToAlerts(onAlert: (alert: Alert) => void, onError?: (error: Error) => void): Promise<EventSource> {
    try {
      // Simplified approach - always use absolute URL for khook API
      const khookBaseUrl = 'http://localhost:8082'
      
      const streamUrl = `${khookBaseUrl}/api/alerts/stream`
      
      const eventSource = new EventSource(streamUrl)
      
      eventSource.addEventListener('alert', (event) => {
        try {
          const alert: Alert = JSON.parse(event.data)
          onAlert(alert)
        } catch (error) {
          onError?.(error as Error)
        }
      })

      eventSource.addEventListener('heartbeat', () => {
        // Heartbeat, ignore
        return
      })

      eventSource.onerror = (error) => {
        onError?.(error as any)
      }

      return eventSource
    } catch (error) {
      throw new Error(`Network error: ${error}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/sessions')
      return true
    } catch (error) {
      return false
    }
  }
}