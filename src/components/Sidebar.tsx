import type { ReactNode } from 'react'
import { 
  Monitor, 
  Search, 
  Bot, 
  MessageSquare, 
  Bell, 
  Terminal, 
  Settings,
  Cloud,
  ChevronRight,
  Zap,
  Server,
  BarChart3,
  Database
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  connectionStatus: {
    connected: boolean
    error?: string
    lastChecked: string
  }
}

interface NavItem {
  id: string
  name: string
  icon: ReactNode
  badge?: number | string
  description?: string
}

export function Sidebar({ activeTab, onTabChange, connectionStatus }: SidebarProps) {
  // Navigation items configuration
  const navItems: NavItem[] = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: <Monitor />,
      description: 'System overview and metrics'
    },
    { 
      id: 'investigate', 
      name: 'Investigate', 
      icon: <Search />,
      description: 'Incident investigation tools'
    },
    { 
      id: 'agents', 
      name: 'Agents', 
      icon: <Bot />,
      description: 'AI agent management'
    },
    { 
      id: 'chat', 
      name: 'Chat', 
      icon: <MessageSquare />,
      description: 'Agent communication'
    },
    { 
      id: 'cloud-tools', 
      name: 'Cloud Tools', 
      icon: <Cloud />,
      description: 'Cloud infrastructure tools',
      badge: 'NEW'
    },
    { 
      id: 'tools', 
      name: 'Tool Servers', 
      icon: <Server />,
      description: 'MCP tool server management',
      badge: 'NEW'
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: <BarChart3 />,
      description: 'Session analytics and insights',
      badge: 'NEW'
    },
    { 
      id: 'memory', 
      name: 'Memory', 
      icon: <Database />,
      description: 'Knowledge base management',
      badge: 'NEW'
    },
    { 
      id: 'alerts', 
      name: 'Alerts', 
      icon: <Bell />,
      description: 'System alerts and notifications'
    },
    { 
      id: 'hooks', 
      name: 'Hooks', 
      icon: <Zap />,
      description: 'Kubernetes event monitoring hooks',
      badge: 'NEW'
    },
    { 
      id: 'debug', 
      name: 'Debug', 
      icon: <Terminal />,
      description: 'Debug console and logs'
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: <Settings />,
      description: 'Application configuration'
    }
  ]

  return (
    <div className="sidebar">
      {/* Header with connection status */}
      <div className="sidebar-header">
        <div className="logo">
          <Zap className="logo-icon" />
          <span className="logo-text">SRE IDE</span>
        </div>
        
        {/* Connection status indicator */}
        <div className="connection-status">
          <div 
            className={`status-indicator ${connectionStatus.connected ? 'connected' : 'disconnected'}`}
            title={connectionStatus.connected ? 'Connected' : 'Disconnected'}
          />
          <span className="status-text">
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            title={item.description}
          >
            <div className="nav-icon">
              {item.icon}
            </div>
            <span className="nav-text">{item.name}</span>
            {item.badge && (
              <span className="nav-badge">{item.badge}</span>
            )}
            <ChevronRight className="nav-arrow" />
          </button>
        ))}
      </nav>

      {/* Footer with additional info */}
      <div className="sidebar-footer">
        <div className="connection-info">
          <span className="info-label">Last checked:</span>
          <span className="info-value">{connectionStatus.lastChecked}</span>
        </div>
        {connectionStatus.error && (
          <div className="connection-error">
            <span className="error-text">{connectionStatus.error}</span>
          </div>
        )}
      </div>
    </div>
  )
}