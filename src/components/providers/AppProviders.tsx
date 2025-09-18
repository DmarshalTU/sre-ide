import React from 'react'
import { AppProvider, AlertProvider, InvestigationProvider } from '../../contexts'

interface AppProvidersProps {
  children: React.ReactNode
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AppProvider>
      <AlertProvider>
        <InvestigationProvider>
          {children}
        </InvestigationProvider>
      </AlertProvider>
    </AppProvider>
  )
}