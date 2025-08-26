import { User, Bell, Search, HelpCircle, LogOut, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

interface HeaderProps {
  title: string
  onSearch?: (query: string) => void
}

export function Header({ title, onSearch }: HeaderProps) {
  // Live clock display
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }))

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="header">
      {/* Page title and timestamp */}
      <div className="header-left">
        <h1 className="page-title">
          {title.replace('-', ' ')}
        </h1>
        <div className="timestamp">
          <Clock className="icon-sm" />
          {currentTime}
        </div>
      </div>

      {/* Search functionality */}
      {onSearch && (
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearch(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      {/* Header actions */}
      <div className="header-actions">
        {/* Notifications */}
        <button className="btn btn-ghost notification-btn">
          <Bell className="icon-md" />
          <span className="notification-dot" />
        </button>

        {/* Help button */}
        <button className="btn btn-ghost">
          <HelpCircle className="icon-md" />
        </button>

        {/* User profile */}
        <div className="user-profile">
          <div className="user-avatar">
            <User className="icon-sm" />
          </div>
          <div className="user-info">
            <p className="user-name">Admin User</p>
            <p className="user-email">admin@sre-ide.dev</p>
          </div>
          <button className="btn btn-ghost logout-btn">
            <LogOut className="icon-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}