import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

// Types
interface Alert {
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

interface AlertSummary {
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

interface AlertState {
  alerts: Alert[]
  summary: AlertSummary | null
  isLoading: boolean
  error: string | null
  isStreaming: boolean
  eventSource: EventSource | null
}

interface AlertContextType {
  state: AlertState
  actions: {
    setAlerts: (alerts: Alert[]) => void
    setSummary: (summary: AlertSummary) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    acknowledgeAlert: (alertId: string) => Promise<void>
    resolveAlert: (alertId: string) => Promise<void>
    startStreaming: (kagentApi: any) => void
    stopStreaming: () => void
    addAlert: (alert: Alert) => void
    updateAlert: (alertId: string, updates: Partial<Alert>) => void
  }
}

// Actions
type AlertAction =
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'SET_SUMMARY'; payload: AlertSummary }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'UPDATE_ALERT'; payload: { id: string; updates: Partial<Alert> } }
  | { type: 'START_STREAMING'; payload: EventSource }
  | { type: 'STOP_STREAMING' }

// Reducer
const alertReducer = (state: AlertState, action: AlertAction): AlertState => {
  switch (action.type) {
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload }
    
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'ADD_ALERT':
      // Avoid duplicates
      if (state.alerts.find(a => a.id === action.payload.id)) {
        return state
      }
      return { 
        ...state, 
        alerts: [action.payload, ...state.alerts] 
      }
    
    case 'UPDATE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload.id
            ? { ...alert, ...action.payload.updates }
            : alert
        )
      }
    
    case 'START_STREAMING':
      return { 
        ...state, 
        isStreaming: true, 
        eventSource: action.payload 
      }
    
    case 'STOP_STREAMING':
      if (state.eventSource) {
        state.eventSource.close()
      }
      return { 
        ...state, 
        isStreaming: false, 
        eventSource: null 
      }
    
    default:
      return state
  }
}

// Initial state
const initialState: AlertState = {
  alerts: [],
  summary: null,
  isLoading: false,
  error: null,
  isStreaming: false,
  eventSource: null
}

// Context
const AlertContext = createContext<AlertContextType | null>(null)

// Provider
interface AlertProviderProps {
  children: React.ReactNode
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(alertReducer, initialState)

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (state.eventSource) {
        state.eventSource.close()
      }
    }
  }, [])

  const actions = {
    setAlerts: useCallback((alerts: Alert[]) => {
      dispatch({ type: 'SET_ALERTS', payload: alerts })
    }, []),

    setSummary: useCallback((summary: AlertSummary) => {
      dispatch({ type: 'SET_SUMMARY', payload: summary })
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    }, []),

    acknowledgeAlert: useCallback(async (alertId: string) => {
      dispatch({
        type: 'UPDATE_ALERT',
        payload: { id: alertId, updates: { status: 'acknowledged' } }
      })
    }, []),

    resolveAlert: useCallback(async (alertId: string) => {
      dispatch({
        type: 'UPDATE_ALERT',
        payload: { id: alertId, updates: { status: 'resolved' } }
      })
    }, []),

    startStreaming: useCallback((kagentApi: any) => {
      if (state.isStreaming || !kagentApi) return

      try {
        const eventSource = kagentApi.subscribeToAlerts(
          (alert: Alert) => {
            dispatch({ type: 'ADD_ALERT', payload: alert })
          },
          (error: Error) => {
            dispatch({ type: 'SET_ERROR', payload: error.message })
          }
        )

        dispatch({ type: 'START_STREAMING', payload: eventSource })
      } catch (error) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to start streaming' 
        })
      }
    }, [state.isStreaming]),

    stopStreaming: useCallback(() => {
      dispatch({ type: 'STOP_STREAMING' })
    }, []),

    addAlert: useCallback((alert: Alert) => {
      dispatch({ type: 'ADD_ALERT', payload: alert })
    }, []),

    updateAlert: useCallback((alertId: string, updates: Partial<Alert>) => {
      dispatch({ type: 'UPDATE_ALERT', payload: { id: alertId, updates } })
    }, [])
  }

  return (
    <AlertContext.Provider value={{ state, actions }}>
      {children}
    </AlertContext.Provider>
  )
}

// Hook
export const useAlerts = (): AlertContextType => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider')
  }
  return context
}