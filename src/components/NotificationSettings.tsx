import { useState, useEffect } from 'react'
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

interface NotificationSettingsProps {
  onClose: () => void
}

interface NotificationConfig {
  enabled: boolean
  sound: boolean
  critical: boolean
  high: boolean
  medium: boolean
  low: boolean
  browserNotifications: boolean
  desktopNotifications: boolean
  soundVolume: number
  customSound: string
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [config, setConfig] = useState<NotificationConfig>({
    enabled: true,
    sound: true,
    critical: true,
    high: true,
    medium: false,
    low: false,
    browserNotifications: true,
    desktopNotifications: false,
    soundVolume: 0.7,
    customSound: 'default'
  })

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Load saved configuration
    const saved = localStorage.getItem('notification-settings')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load notification settings:', error)
      }
    }

    // Check notification permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  const saveConfig = (newConfig: NotificationConfig) => {
    setConfig(newConfig)
    localStorage.setItem('notification-settings', JSON.stringify(newConfig))
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      return permission
    }
    return 'denied'
  }

  const testNotification = () => {
    if (config.browserNotifications && permissionStatus === 'granted') {
      new Notification('Test Alert', {
        body: 'This is a test notification from SRE-IDE',
        icon: '/vite.svg',
        tag: 'test-notification'
      })
    }
  }

  const testSound = () => {
    if (config.sound) {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(config.soundVolume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
      case 'high':
        return <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--color-warning)' }} />
      case 'medium':
        return <Info style={{ width: '1rem', height: '1rem', color: 'var(--color-info)' }} />
      case 'low':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
      default:
        return <Bell style={{ width: '1rem', height: '1rem', color: 'var(--color-text-muted)' }} />
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
        maxWidth: '40rem',
        maxHeight: '90vh',
        padding: 'var(--spacing-lg)',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '500', 
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-lg)',
          margin: 0
        }}>
          Notification Settings
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Global Settings */}
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '500', 
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)',
              margin: 0
            }}>
              Global Settings
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: 'var(--spacing-md)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  {config.enabled ? <Bell style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} /> : <BellOff style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-text-muted)' }} />}
                  <span style={{ color: 'var(--color-text-primary)' }}>Enable Notifications</span>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => saveConfig({ ...config, enabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: config.enabled ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                    borderRadius: '1.5rem',
                    transition: 'var(--transition-fast)'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '1.25rem',
                      width: '1.25rem',
                      left: config.enabled ? '1.25rem' : '0.125rem',
                      bottom: '0.125rem',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: 'var(--transition-fast)'
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: 'var(--spacing-md)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  {config.sound ? <Volume2 style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} /> : <VolumeX style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-text-muted)' }} />}
                  <span style={{ color: 'var(--color-text-primary)' }}>Sound Alerts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <button
                    onClick={testSound}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                    disabled={!config.sound}
                  >
                    Test
                  </button>
                  <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                    <input
                      type="checkbox"
                      checked={config.sound}
                      onChange={(e) => saveConfig({ ...config, sound: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: config.sound ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                      borderRadius: '1.5rem',
                      transition: 'var(--transition-fast)'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '1.25rem',
                        width: '1.25rem',
                        left: config.sound ? '1.25rem' : '0.125rem',
                        bottom: '0.125rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'var(--transition-fast)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>

              {config.sound && (
                <div style={{ 
                  padding: 'var(--spacing-md)',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Sound Volume
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.soundVolume}
                    onChange={(e) => saveConfig({ ...config, soundVolume: parseFloat(e.target.value) })}
                    style={{
                      width: '100%',
                      height: '0.5rem',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none'
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.75rem', 
                    color: 'var(--color-text-muted)',
                    marginTop: 'var(--spacing-xs)'
                  }}>
                    <span>0%</span>
                    <span>{Math.round(config.soundVolume * 100)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Browser Notifications */}
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '500', 
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)',
              margin: 0
            }}>
              Browser Notifications
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: 'var(--spacing-md)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <Bell style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
                  <span style={{ color: 'var(--color-text-primary)' }}>Browser Notifications</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: permissionStatus === 'granted' ? 'var(--color-success)' : 
                           permissionStatus === 'denied' ? 'var(--color-error)' : 'var(--color-warning)'
                  }}>
                    {permissionStatus === 'granted' ? 'Granted' : 
                     permissionStatus === 'denied' ? 'Denied' : 'Not Requested'}
                  </span>
                  {permissionStatus !== 'granted' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                    >
                      Request
                    </button>
                  )}
                  <button
                    onClick={testNotification}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                    disabled={!config.browserNotifications || permissionStatus !== 'granted'}
                  >
                    Test
                  </button>
                  <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                    <input
                      type="checkbox"
                      checked={config.browserNotifications}
                      onChange={(e) => saveConfig({ ...config, browserNotifications: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                      disabled={permissionStatus !== 'granted'}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: permissionStatus === 'granted' ? 'pointer' : 'not-allowed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: config.browserNotifications ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                      borderRadius: '1.5rem',
                      transition: 'var(--transition-fast)',
                      opacity: permissionStatus === 'granted' ? 1 : 0.5
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '1.25rem',
                        width: '1.25rem',
                        left: config.browserNotifications ? '1.25rem' : '0.125rem',
                        bottom: '0.125rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'var(--transition-fast)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Severity Filters */}
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '500', 
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)',
              margin: 0
            }}>
              Alert Severity Filters
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {[
                { key: 'critical', label: 'Critical Alerts', description: 'System failures, OOM kills' },
                { key: 'high', label: 'High Priority', description: 'Pod restarts, probe failures' },
                { key: 'medium', label: 'Medium Priority', description: 'Resource warnings' },
                { key: 'low', label: 'Low Priority', description: 'Informational alerts' }
              ].map(({ key, label, description }) => (
                <div key={key} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-md)',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    {getSeverityIcon(key)}
                    <div>
                      <div style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>{label}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{description}</div>
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                    <input
                      type="checkbox"
                      checked={config[key as keyof NotificationConfig] as boolean}
                      onChange={(e) => saveConfig({ ...config, [key]: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: config[key as keyof NotificationConfig] ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                      borderRadius: '1.5rem',
                      transition: 'var(--transition-fast)'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '1.25rem',
                        width: '1.25rem',
                        left: config[key as keyof NotificationConfig] ? '1.25rem' : '0.125rem',
                        bottom: '0.125rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'var(--transition-fast)'
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-lg)'
        }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
