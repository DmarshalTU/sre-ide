import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

// Types
interface Investigation {
  id: string
  name: string
  description: string
  agents: string[]
  startTime: string
  endTime?: string
  status: 'active' | 'completed' | 'cancelled' | 'failed'
  currentAgentIndex?: number
  currentStep: number
  findings?: string[]
  recommendations?: string[]
  agentSessions?: { [agentName: string]: any[] }
  chatMessages?: any[]
}

interface InvestigationState {
  activeInvestigation: Investigation | null
  history: Investigation[]
  isStarting: boolean
  error: string | null
  isDownloading: boolean
}

interface InvestigationContextType {
  state: InvestigationState
  actions: {
    startInvestigation: (investigation: Omit<Investigation, 'id' | 'startTime' | 'status' | 'currentStep'>) => void
    completeInvestigation: (findings?: string[], recommendations?: string[]) => void
    cancelInvestigation: () => void
    clearActiveInvestigation: () => void
    updateInvestigationProgress: (step: number) => void
    addChatMessages: (messages: any[]) => void
    integrateChatSessions: (sessions: { [agentName: string]: any[] }) => void
    deleteFromHistory: (investigationId: string) => void
    setError: (error: string | null) => void
    setStarting: (isStarting: boolean) => void
    setDownloading: (isDownloading: boolean) => void
  }
}

// Actions
type InvestigationAction =
  | { type: 'START_INVESTIGATION'; payload: Investigation }
  | { type: 'COMPLETE_INVESTIGATION'; payload: { findings?: string[]; recommendations?: string[] } }
  | { type: 'CANCEL_INVESTIGATION' }
  | { type: 'CLEAR_ACTIVE_INVESTIGATION' }
  | { type: 'UPDATE_PROGRESS'; payload: number }
  | { type: 'ADD_CHAT_MESSAGES'; payload: any[] }
  | { type: 'INTEGRATE_SESSIONS'; payload: { [agentName: string]: any[] } }
  | { type: 'DELETE_FROM_HISTORY'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STARTING'; payload: boolean }
  | { type: 'SET_DOWNLOADING'; payload: boolean }

// Reducer
const investigationReducer = (state: InvestigationState, action: InvestigationAction): InvestigationState => {
  switch (action.type) {
    case 'START_INVESTIGATION':
      return {
        ...state,
        activeInvestigation: action.payload,
        isStarting: false,
        error: null
      }
    
    case 'COMPLETE_INVESTIGATION':
      if (!state.activeInvestigation) return state
      
      const completedInvestigation = {
        ...state.activeInvestigation,
        status: 'completed' as const,
        endTime: new Date().toISOString(),
        findings: action.payload.findings,
        recommendations: action.payload.recommendations
      }
      
      return {
        ...state,
        activeInvestigation: null,
        history: [completedInvestigation, ...state.history]
      }
    
    case 'CANCEL_INVESTIGATION':
      if (!state.activeInvestigation) return state
      
      const cancelledInvestigation = {
        ...state.activeInvestigation,
        status: 'cancelled' as const,
        endTime: new Date().toISOString()
      }
      
      return {
        ...state,
        activeInvestigation: null,
        history: [cancelledInvestigation, ...state.history]
      }
    
    case 'CLEAR_ACTIVE_INVESTIGATION':
      return {
        ...state,
        activeInvestigation: null
      }
    
    case 'UPDATE_PROGRESS':
      if (!state.activeInvestigation) return state
      
      return {
        ...state,
        activeInvestigation: {
          ...state.activeInvestigation,
          currentStep: action.payload
        }
      }
    
    case 'ADD_CHAT_MESSAGES':
      if (!state.activeInvestigation) return state
      
      const existingMessageIds = new Set(
        state.activeInvestigation.chatMessages?.map((msg: any) => msg.id) || []
      )
      const newMessages = action.payload.filter((msg: any) => !existingMessageIds.has(msg.id))
      
      if (newMessages.length === 0) return state
      
      return {
        ...state,
        activeInvestigation: {
          ...state.activeInvestigation,
          chatMessages: [
            ...(state.activeInvestigation.chatMessages || []),
            ...newMessages
          ]
        }
      }
    
    case 'INTEGRATE_SESSIONS':
      if (!state.activeInvestigation) return state
      
      return {
        ...state,
        activeInvestigation: {
          ...state.activeInvestigation,
          agentSessions: action.payload
        }
      }
    
    case 'DELETE_FROM_HISTORY':
      return {
        ...state,
        history: state.history.filter(inv => inv.id !== action.payload)
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      }
    
    case 'SET_STARTING':
      return {
        ...state,
        isStarting: action.payload
      }
    
    case 'SET_DOWNLOADING':
      return {
        ...state,
        isDownloading: action.payload
      }
    
    default:
      return state
  }
}

// Initial state
const getInitialState = (): InvestigationState => {
  const savedActive = localStorage.getItem('sre-ide-active-investigation')
  const savedHistory = localStorage.getItem('sre-ide-investigation-history')
  
  return {
    activeInvestigation: savedActive ? JSON.parse(savedActive) : null,
    history: savedHistory ? JSON.parse(savedHistory) : [],
    isStarting: false,
    error: null,
    isDownloading: false
  }
}

// Context
const InvestigationContext = createContext<InvestigationContextType | null>(null)

// Provider
interface InvestigationProviderProps {
  children: React.ReactNode
}

export const InvestigationProvider: React.FC<InvestigationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(investigationReducer, undefined, getInitialState)

  // Persist state to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.activeInvestigation) {
        localStorage.setItem('sre-ide-active-investigation', JSON.stringify(state.activeInvestigation))
      } else {
        localStorage.removeItem('sre-ide-active-investigation')
      }
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [state.activeInvestigation])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('sre-ide-investigation-history', JSON.stringify(state.history))
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [state.history])

  const actions = {
    startInvestigation: useCallback((investigationData: Omit<Investigation, 'id' | 'startTime' | 'status' | 'currentStep'>) => {
      const investigation: Investigation = {
        ...investigationData,
        id: `inv-${Date.now()}`,
        startTime: new Date().toISOString(),
        status: 'active',
        currentStep: 0
      }
      dispatch({ type: 'START_INVESTIGATION', payload: investigation })
    }, []),

    completeInvestigation: useCallback((findings?: string[], recommendations?: string[]) => {
      dispatch({ type: 'COMPLETE_INVESTIGATION', payload: { findings, recommendations } })
    }, []),

    cancelInvestigation: useCallback(() => {
      dispatch({ type: 'CANCEL_INVESTIGATION' })
    }, []),

    clearActiveInvestigation: useCallback(() => {
      dispatch({ type: 'CLEAR_ACTIVE_INVESTIGATION' })
    }, []),

    updateInvestigationProgress: useCallback((step: number) => {
      dispatch({ type: 'UPDATE_PROGRESS', payload: step })
    }, []),

    addChatMessages: useCallback((messages: any[]) => {
      dispatch({ type: 'ADD_CHAT_MESSAGES', payload: messages })
    }, []),

    integrateChatSessions: useCallback((sessions: { [agentName: string]: any[] }) => {
      dispatch({ type: 'INTEGRATE_SESSIONS', payload: sessions })
    }, []),

    deleteFromHistory: useCallback((investigationId: string) => {
      dispatch({ type: 'DELETE_FROM_HISTORY', payload: investigationId })
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    }, []),

    setStarting: useCallback((isStarting: boolean) => {
      dispatch({ type: 'SET_STARTING', payload: isStarting })
    }, []),

    setDownloading: useCallback((isDownloading: boolean) => {
      dispatch({ type: 'SET_DOWNLOADING', payload: isDownloading })
    }, [])
  }

  return (
    <InvestigationContext.Provider value={{ state, actions }}>
      {children}
    </InvestigationContext.Provider>
  )
}

// Hook
export const useInvestigation = (): InvestigationContextType => {
  const context = useContext(InvestigationContext)
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider')
  }
  return context
}