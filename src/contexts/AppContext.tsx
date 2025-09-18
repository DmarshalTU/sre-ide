import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { KagentAPI } from '../lib/kagent'

// Types
interface AppState {
  agents: Agent[]
  isLoading: boolean
  error: string | null
  connectors: Connector[]
  activeConnector: Connector | null
}

interface Agent {
  id: string
  name: string
  namespace: string
  type: string
  ready: boolean
  accepted: boolean
  description?: string
}

interface Connector {
  id: string
  name: string
  baseUrl: string
  port: number
  protocol: 'http' | 'https'
  environment: string
  isConnected: boolean
  kagentApi: KagentAPI
}

interface AppContextType {
  state: AppState
  actions: {
    setAgents: (agents: Agent[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    addConnector: (connector: Omit<Connector, 'id' | 'isConnected' | 'kagentApi'>) => void
    removeConnector: (connectorId: string) => void
    setActiveConnector: (connectorId: string | null) => void
    updateConnectorStatus: (connectorId: string, isConnected: boolean) => void
  }
}

// Actions
type AppAction =
  | { type: 'SET_AGENTS'; payload: Agent[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_CONNECTOR'; payload: Connector }
  | { type: 'REMOVE_CONNECTOR'; payload: string }
  | { type: 'SET_ACTIVE_CONNECTOR'; payload: string | null }
  | { type: 'UPDATE_CONNECTOR_STATUS'; payload: { id: string; isConnected: boolean } }

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_AGENTS':
      return { ...state, agents: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'ADD_CONNECTOR':
      return { 
        ...state, 
        connectors: [...state.connectors, action.payload],
        activeConnector: state.activeConnector || action.payload
      }
    
    case 'REMOVE_CONNECTOR':
      const filteredConnectors = state.connectors.filter(c => c.id !== action.payload)
      return {
        ...state,
        connectors: filteredConnectors,
        activeConnector: state.activeConnector?.id === action.payload
          ? filteredConnectors[0] || null
          : state.activeConnector
      }
    
    case 'SET_ACTIVE_CONNECTOR':
      const connector = action.payload 
        ? state.connectors.find(c => c.id === action.payload) || null
        : null
      return { ...state, activeConnector: connector }
    
    case 'UPDATE_CONNECTOR_STATUS':
      return {
        ...state,
        connectors: state.connectors.map(c =>
          c.id === action.payload.id
            ? { ...c, isConnected: action.payload.isConnected }
            : c
        ),
        activeConnector: state.activeConnector?.id === action.payload.id
          ? { ...state.activeConnector, isConnected: action.payload.isConnected }
          : state.activeConnector
      }
    
    default:
      return state
  }
}

// Initial state
const initialState: AppState = {
  agents: [],
  isLoading: false,
  error: null,
  connectors: [],
  activeConnector: null
}

// Context
const AppContext = createContext<AppContextType | null>(null)

// Provider
interface AppProviderProps {
  children: React.ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load connectors from localStorage on mount
  useEffect(() => {
    const savedConnectors = localStorage.getItem('sre-ide-connectors')
    if (savedConnectors) {
      try {
        const connectors: Array<Omit<Connector, 'kagentApi'>> = JSON.parse(savedConnectors)
        connectors.forEach(connector => {
          const kagentApi = new KagentAPI(connector)
          dispatch({
            type: 'ADD_CONNECTOR',
            payload: { ...connector, kagentApi }
          })
        })
      } catch (error) {
        console.error('Failed to load connectors from localStorage:', error)
      }
    }
  }, [])

  // Save connectors to localStorage whenever they change
  useEffect(() => {
    const connectorsToSave = state.connectors.map(({ kagentApi, ...connector }) => connector)
    localStorage.setItem('sre-ide-connectors', JSON.stringify(connectorsToSave))
  }, [state.connectors])

  // Actions
  const actions = {
    setAgents: useCallback((agents: Agent[]) => {
      dispatch({ type: 'SET_AGENTS', payload: agents })
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    }, []),

    addConnector: useCallback((connectorData: Omit<Connector, 'id' | 'isConnected' | 'kagentApi'>) => {
      const id = `connector-${Date.now()}`
      const kagentApi = new KagentAPI(connectorData)
      const connector: Connector = {
        ...connectorData,
        id,
        isConnected: false,
        kagentApi
      }
      dispatch({ type: 'ADD_CONNECTOR', payload: connector })

      // Test connection
      kagentApi.testConnection().then(connected => {
        dispatch({ 
          type: 'UPDATE_CONNECTOR_STATUS', 
          payload: { id, isConnected: connected } 
        })
      })
    }, []),

    removeConnector: useCallback((connectorId: string) => {
      dispatch({ type: 'REMOVE_CONNECTOR', payload: connectorId })
    }, []),

    setActiveConnector: useCallback((connectorId: string | null) => {
      dispatch({ type: 'SET_ACTIVE_CONNECTOR', payload: connectorId })
    }, []),

    updateConnectorStatus: useCallback((connectorId: string, isConnected: boolean) => {
      dispatch({ 
        type: 'UPDATE_CONNECTOR_STATUS', 
        payload: { id: connectorId, isConnected } 
      })
    }, [])
  }

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export const useApp = (): AppContextType => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}