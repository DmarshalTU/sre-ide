// KAgent configuration interface
export interface KAgentConfig {
  // Connection settings
  baseUrl: string
  port: number
  protocol: 'http' | 'https'
  
  // Authentication (optional)
  token?: string
  username?: string
  password?: string
  
  // Connection options
  timeout: number
  retries: number
  
  // Environment-specific settings
  environment: 'local' | 'development' | 'staging' | 'production'
  
  // Ingress settings for production deployments
  ingressUrl?: string
  ingressPath?: string
}

// Default configuration for local development
export const defaultConfig: KAgentConfig = {
  baseUrl: 'localhost',
  port: 8083,
  protocol: 'http',
  timeout: 30000,
  retries: 3,
  environment: 'local'
}

// Environment-specific configurations
export const configs: Record<string, KAgentConfig> = {
  // Local development (port-forward)
  local: {
    ...defaultConfig,
    baseUrl: 'localhost',
    port: 8083,
    protocol: 'http',
    environment: 'local'
  },
  
  // Development environment
  development: {
    ...defaultConfig,
    baseUrl: 'kagent-dev.example.com',
    port: 443,
    protocol: 'https',
    environment: 'development',
    ingressUrl: 'https://kagent-dev.example.com',
    timeout: 45000
  },
  
  // Staging environment
  staging: {
    ...defaultConfig,
    baseUrl: 'kagent-staging.example.com',
    port: 443,
    protocol: 'https',
    environment: 'staging',
    ingressUrl: 'https://kagent-staging.example.com',
    timeout: 60000
  },
  
  // Production environment
  production: {
    ...defaultConfig,
    baseUrl: 'kagent.example.com',
    port: 443,
    protocol: 'https',
    environment: 'production',
    ingressUrl: 'https://kagent.example.com',
    timeout: 60000,
    retries: 5
  }
}

// Get current configuration based on environment and saved settings
export function getConfig(): KAgentConfig {
  // Check for saved settings in localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sre-ide-settings')
    if (saved) {
      try {
        const userSettings = JSON.parse(saved)
        // Merge with default config to ensure all required fields are present
        return { ...defaultConfig, ...userSettings }
      } catch (error) {
        console.warn('Failed to parse saved settings, using default config')
      }
    }
  }
  
  // Use 'local' as default for browser environment
  return { ...configs.local }
}

// Build the full URL for API calls
export function buildApiUrl(config: KAgentConfig): string {
  const protocol = config.protocol || 'http'
  const baseUrl = config.baseUrl || 'localhost'
  const port = config.port || (protocol === 'https' ? 443 : 8083)
  
  // Don't include port for standard ports
  if ((protocol === 'https' && port === 443) || (protocol === 'http' && port === 80)) {
    return `${protocol}://${baseUrl}`
  }
  
  return `${protocol}://${baseUrl}:${port}`
}

// Validate configuration
export function validateConfig(config: KAgentConfig): string[] {
  const errors: string[] = []
  
  if (!config.baseUrl) {
    errors.push('baseUrl is required')
  }
  
  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('port must be between 1 and 65535')
  }
  
  if (!['http', 'https'].includes(config.protocol)) {
    errors.push('protocol must be either http or https')
  }
  
  return errors
}
