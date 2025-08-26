// KAgent API client for interacting with KAgent instances

// Agent information interface
export interface KagentAgent {
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
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}?user_id=${this.userId}`
    
    console.log(`Making request to: ${url}`)
    console.log('Request options:', { method: options.method, body: options.body })
    
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
        
        const result = await invoke<any>('http_request', {
          url: url,
          method: options.method || 'GET',
          headers: headers,
          body: options.body || null
        })
        
        console.log('Tauri invoke result:', result)
        return result as T
      } else {
        console.log('Running in browser, using fetch')
        
        // Prepare headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-ID': this.userId,
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

  async getAgents(): Promise<KagentAgent[]> {
    try {
      console.log('Fetching agents from:', `${this.baseUrl}/agents`)
      const response = await this.request<any>('/agents')
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
      const response = await this.request<{ data: KagentSession[] }>('/sessions')
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
      
      // Use the correct A2A URL format
      const a2aUrl = `${this.baseUrl.replace('/api', '')}/api/a2a/${namespace}/${agentName}/`
      console.log(`Using A2A URL: ${a2aUrl}`)
      
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
