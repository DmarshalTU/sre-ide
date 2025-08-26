import { useState, useEffect, useRef } from 'react'
import { Cloud, Terminal, Search, Loader2, CheckCircle, XCircle, Code, Zap, Settings, ExternalLink, RefreshCw } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

interface CommandOutput {
  stdout: string
  stderr: string
  success: boolean
}

interface ToolInfo {
  name: string
  available: boolean
  path?: string
  error?: string
}

interface CloudToolsProps {
  onDebugInfo?: (message: string) => void
}

// Store function definitions and variables in memory for REPL context
class RuchyContext {
  private context: Map<string, string> = new Map()
  private functionNames: Set<string> = new Set()
  
  addToContext(command: string, _output: string) {
    // Parse function definitions
    const fnMatch = command.match(/fn\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\}/)
    if (fnMatch) {
      const fnName = fnMatch[1]
      this.context.set(fnName, command)
      this.functionNames.add(fnName)
      return
    }
    
    // Parse variable assignments
    const letMatch = command.match(/(?:let|const)\s+(\w+)\s*=\s*(.+)/)
    if (letMatch) {
      const varName = letMatch[1]
      this.context.set(varName, command)
    }
  }
  
  getFullCommand(command: string): string {
    // Check if user is trying to call a function with invalid syntax
    if (command.startsWith('fn ') && command.includes('(') && !command.includes('{')) {
      // This looks like they're trying to call a function but used 'fn' prefix
      const match = command.match(/fn\s+(\w+)\s*\(([^)]*)\)/)
      if (match) {
        const fnName = match[1]
        const args = match[2]
        // Check if function exists
        if (this.functionNames.has(fnName)) {
          // They probably meant to call it without 'fn'
          throw new Error(`Did you mean to call '${fnName}(${args})'? Remove 'fn' to call the function.`)
        } else {
          throw new Error(`Function '${fnName}' is not defined. To define it: fn ${fnName}(params) { ... }\nTo call it (after defining): ${fnName}(${args})`)
        }
      }
    }
    
    // Check if this is a function call to an undefined function
    const callMatch = command.match(/^(\w+)\s*\(/)
    if (callMatch) {
      const fnName = callMatch[1]
      // If it starts with 'fn', it's a definition attempt, not a call
      if (command.startsWith('fn ')) {
        return command
      }
      // If the function doesn't exist in context, return error
      if (!this.functionNames.has(fnName) && !['print', 'println', 'typeof', 'len'].includes(fnName)) {
        throw new Error(`Function '${fnName}' is not defined. Define it first with: fn ${fnName}(...) { ... }`)
      }
    }
    
    // Prepend context for commands that might use defined functions/variables
    if (this.context.size > 0 && !command.includes('fn ') && !command.includes('let ')) {
      return Array.from(this.context.values()).join('\n') + '\n' + command
    }
    return command
  }
  
  clear() {
    this.context.clear()
    this.functionNames.clear()
  }
  
  getDefinedFunctions(): string[] {
    return Array.from(this.functionNames)
  }
}

export function CloudTools({ onDebugInfo }: CloudToolsProps) {
  const [selectedProvider, setSelectedProvider] = useState<'azure' | 'aws' | 'gcp'>('azure')
  const [azureToolInfo, setAzureToolInfo] = useState<ToolInfo | null>(null)
  const [ruchyToolInfo, setRuchyToolInfo] = useState<ToolInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string>('')
  const [ruchyCommand, setRuchyCommand] = useState('')
  const [ruchyOutput, setRuchyOutput] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'search' | 'repl'>('search')
  const [azureAuthStatus, setAzureAuthStatus] = useState<any>(null)
  const [showToolConfig, setShowToolConfig] = useState(false)
  const [azureTestResult, setAzureTestResult] = useState<any>(null)
  const ruchyContextRef = useRef(new RuchyContext())
  const outputEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkToolAvailability()
  }, [])

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ruchyOutput])

  const checkToolAvailability = async () => {
    try {
      const azureInfo = await invoke<ToolInfo>('check_tool_availability', { tool: 'azure-resource-finder' })
      const ruchyInfo = await invoke<ToolInfo>('check_tool_availability', { tool: 'ruchy' })
      
      setAzureToolInfo(azureInfo)
      setRuchyToolInfo(ruchyInfo)
      
      // Check Azure authentication status
      try {
        const authStatus = await invoke<any>('check_azure_auth_status')
        setAzureAuthStatus(authStatus)
        onDebugInfo?.(`Azure auth status: CLI available: ${authStatus.azure_cli_available}, Logged in: ${authStatus.is_logged_in}`)
      } catch (authError) {
        console.error('Failed to check Azure auth status:', authError)
        onDebugInfo?.(`Failed to check Azure auth: ${authError}`)
      }
      
      onDebugInfo?.(`Tools availability - Azure: ${azureInfo.available}, Ruchy: ${ruchyInfo.available}`)
    } catch (error) {
      console.error('Failed to check tool availability:', error)
      onDebugInfo?.(`Failed to check tools: ${error}`)
    }
  }

  const searchAzureResources = async () => {
    if (!searchQuery.trim()) return
    
    // Check if user is logged in to Azure
    if (azureAuthStatus && !azureAuthStatus.is_logged_in) {
      setSearchResults(`Error: Azure authentication required. Please run 'az login' in your terminal to authenticate with Azure.`)
      onDebugInfo?.('Azure search failed: User not authenticated')
      return
    }
    
    setIsLoading(true)
    onDebugInfo?.(`Searching Azure resources: ${searchQuery}`)
    
    try {
      const args = searchQuery.trim().split(/\s+/).filter(arg => arg)
      const result = await invoke<CommandOutput>('run_azure_resource_finder', { args })
      
      if (result.success && result.stdout) {
        setSearchResults(result.stdout)
        onDebugInfo?.('Azure search completed successfully')
      } else if (result.stderr) {
        setSearchResults(`Error: ${result.stderr}`)
        onDebugInfo?.(`Azure search error: ${result.stderr}`)
      } else {
        setSearchResults('No results found')
        onDebugInfo?.('Azure search returned no results')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      setSearchResults(`Failed to search: ${errorMsg}`)
      onDebugInfo?.(`Azure search failed: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const executeRuchyCommand = async () => {
    if (!ruchyCommand.trim()) return
    
    setIsLoading(true)
    const command = ruchyCommand
    setRuchyCommand('')
    
    // Add command to output
    setRuchyOutput(prev => prev + (prev ? '\n' : '') + '> ' + command)
    onDebugInfo?.(`Executing Ruchy command: ${command}`)
    
    try {
      // Get the full command with context
      let fullCommand: string
      try {
        fullCommand = ruchyContextRef.current.getFullCommand(command)
      } catch (contextError: any) {
        // If it's an undefined function error, show helpful message
        setRuchyOutput(prev => prev + '\nError: ' + contextError.message)
        onDebugInfo?.(`Context error: ${contextError.message}`)
        return
      }
      
      const result = await invoke<CommandOutput>('run_ruchy_repl', { 
        command: fullCommand
      })
      
      if (result.success && result.stdout) {
        // Clean up the output - remove empty lines and prompts
        const cleanOutput = result.stdout
          .split('\n')
          .filter(line => {
            const trimmed = line.trim()
            return trimmed && !trimmed.startsWith('>') && !trimmed.startsWith('ruchy>')
          })
          .join('\n')
        
        if (cleanOutput) {
          setRuchyOutput(prev => prev + '\n' + cleanOutput)
          // Store context if it's a definition
          ruchyContextRef.current.addToContext(command, cleanOutput)
          
          // Show success message for function definitions
          if (command.trim().startsWith('fn ') && command.includes('{')) {
            const fnName = command.match(/fn\s+(\w+)/)?.[1]
            if (fnName) {
              setRuchyOutput(prev => prev + `\n✓ Function '${fnName}' defined successfully`)
            }
          }
        } else if (command.trim().startsWith('fn ') && command.includes('{')) {
          // Function definition with no output
          const fnName = command.match(/fn\s+(\w+)/)?.[1]
          if (fnName) {
            ruchyContextRef.current.addToContext(command, '')
            setRuchyOutput(prev => prev + `\n✓ Function '${fnName}' defined successfully`)
          }
        }
        
        onDebugInfo?.('Ruchy command executed successfully')
      } else if (result.stderr) {
        setRuchyOutput(prev => prev + '\nError: ' + result.stderr)
        onDebugInfo?.(`Ruchy error: ${result.stderr}`)
      }
    } catch (error) {
      setRuchyOutput(prev => prev + `\nError: ${error}`)
      onDebugInfo?.(`Ruchy execution failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearReplSession = () => {
    setRuchyOutput('')
    ruchyContextRef.current.clear()
    onDebugInfo?.('REPL session cleared')
  }

  const testAzureCLI = async () => {
    try {
      const result = await invoke<any>('test_azure_cli')
      setAzureTestResult(result)
      onDebugInfo?.(`Azure CLI test completed: Version available: ${result.version_available}, Account available: ${result.account_available}`)
    } catch (error) {
      console.error('Failed to test Azure CLI:', error)
      onDebugInfo?.(`Azure CLI test failed: ${error}`)
    }
  }

  const getInstallInstructions = (toolName: string) => {
    switch (toolName) {
      case 'azure-resource-finder':
        return {
          title: 'Install Azure Resource Finder',
          instructions: [
            '1. Install Azure CLI first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli',
            '2. Install Azure Resource Finder:',
            '   - macOS: `brew install azure-resource-finder`',
            '   - Windows: Download from GitHub releases',
            '   - Linux: `cargo install azure-resource-finder`'
          ],
          links: [
            { name: 'Azure CLI', url: 'https://docs.microsoft.com/en-us/cli/azure/install-azure-cli' },
            { name: 'Azure Resource Finder', url: 'https://github.com/azure-resource-finder' }
          ]
        }
      case 'ruchy':
        return {
          title: 'Install Ruchy',
          instructions: [
            '1. Install Rust (if not already installed): https://rustup.rs/',
            '2. Install Ruchy:',
            '   `cargo install ruchy`'
          ],
          links: [
            { name: 'Rust', url: 'https://rustup.rs/' },
            { name: 'Ruchy', url: 'https://github.com/ruchy-lang/ruchy' }
          ]
        }
      default:
        return {
          title: 'Install Tool',
          instructions: ['Please check the tool documentation for installation instructions.'],
          links: []
        }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Cloud style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 className="card-title">Cloud Tools & REPL</h3>
              <p style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '0.875rem', 
                margin: 0,
                fontFamily: 'var(--font-family-primary)'
              }}>
                Infrastructure management and scripting
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowToolConfig(!showToolConfig)}
            className="btn btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem'
            }}
          >
            <Settings style={{ width: '1rem', height: '1rem' }} />
            Configure Tools
          </button>
        </div>
      </div>

      {/* Tool Configuration Panel */}
      {showToolConfig && (
        <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="card-header">
            <h4 style={{ color: 'var(--color-text-primary)', margin: 0, fontWeight: '600' }}>Tool Configuration</h4>
            <button
              onClick={checkToolAvailability}
              className="btn btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              <RefreshCw style={{ width: '1rem', height: '1rem' }} />
              Refresh
            </button>
          </div>
          
          <div className="cloud-tools-container grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--spacing-lg)' }}>
            {/* Azure Resource Finder */}
            <div className="card" style={{ background: 'var(--color-bg-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                {azureToolInfo?.available ? (
                  <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
                ) : (
                  <XCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-error)' }} />
                )}
                <h5 style={{ color: 'var(--color-text-primary)', margin: 0, fontWeight: '600' }}>Azure Resource Finder</h5>
              </div>
              
              {azureToolInfo?.available ? (
                <div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0 0 var(--spacing-sm) 0', fontFamily: 'var(--font-family-primary)' }}>
                    Path: <code style={{ background: 'var(--color-bg-primary)', padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }}>
                      {azureToolInfo.path}
                    </code>
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: '500' }}>Available</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0 0 var(--spacing-md) 0', fontFamily: 'var(--font-family-primary)' }}>
                    {azureToolInfo?.error || 'Tool not found'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {getInstallInstructions('azure-resource-finder').instructions.map((instruction, idx) => (
                      <p key={idx} style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', margin: 0, fontFamily: 'var(--font-family-primary)' }}>
                        {instruction}
                      </p>
                    ))}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      {getInstallInstructions('azure-resource-finder').links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                        >
                          <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
                          {link.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ruchy */}
            <div className="card" style={{ background: 'var(--color-bg-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                {ruchyToolInfo?.available ? (
                  <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
                ) : (
                  <XCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-error)' }} />
                )}
                <h5 style={{ color: 'var(--color-text-primary)', margin: 0, fontWeight: '600' }}>Ruchy REPL</h5>
              </div>
              
              {ruchyToolInfo?.available ? (
                <div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0 0 var(--spacing-sm) 0', fontFamily: 'var(--font-family-primary)' }}>
                    Path: <code style={{ background: 'var(--color-bg-primary)', padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }}>
                      {ruchyToolInfo.path}
                    </code>
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: '500' }}>Available</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0 0 var(--spacing-md) 0', fontFamily: 'var(--font-family-primary)' }}>
                    {ruchyToolInfo?.error || 'Tool not found'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {getInstallInstructions('ruchy').instructions.map((instruction, idx) => (
                      <p key={idx} style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', margin: 0, fontFamily: 'var(--font-family-primary)' }}>
                        {instruction}
                      </p>
                    ))}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      {getInstallInstructions('ruchy').links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                        >
                          <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
                          {link.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tool Status */}
              <div className="cloud-tools-container grid grid-cols-1 md:grid-cols-2">
        <div className="metric-card">
          <div className="metric-icon" style={{ 
            background: azureToolInfo?.available ? 'var(--color-success)20' : 'var(--color-error)20',
            borderColor: azureToolInfo?.available ? 'var(--color-success)40' : 'var(--color-error)40'
          }}>
            {azureToolInfo?.available ? (
              <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
            ) : (
              <XCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-error)' }} />
            )}
          </div>
          <div className="metric-content">
            <p className="metric-label">Azure Resource Finder</p>
            <p className="metric-value">{azureToolInfo?.available ? 'Available' : 'Not Found'}</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon" style={{ 
            background: ruchyToolInfo?.available ? 'var(--color-success)20' : 'var(--color-error)20',
            borderColor: ruchyToolInfo?.available ? 'var(--color-success)40' : 'var(--color-error)40'
          }}>
            {ruchyToolInfo?.available ? (
              <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
            ) : (
              <XCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-error)' }} />
            )}
          </div>
          <div className="metric-content">
            <p className="metric-label">Ruchy REPL</p>
            <p className="metric-value">{ruchyToolInfo?.available ? 'Available' : 'Not Found'}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <button
            onClick={() => setActiveTab('search')}
            className={`btn ${activeTab === 'search' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-sm)'
            }}
          >
            <Search style={{ width: '1rem', height: '1rem' }} />
            Cloud Search
          </button>
          
          <button
            onClick={() => setActiveTab('repl')}
            className={`btn ${activeTab === 'repl' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-sm)'
            }}
          >
            <Code style={{ width: '1rem', height: '1rem' }} />
            Ruchy REPL
          </button>
        </div>

        {/* Cloud Search Tab */}
        {activeTab === 'search' && (
          <div>
            {/* Provider Selection */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              {(['azure', 'aws', 'gcp'] as const).map(provider => (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  disabled={provider !== 'azure' || !azureToolInfo?.available}
                  className={`btn ${selectedProvider === provider ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    flex: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: provider !== 'azure' ? 0.5 : 1
                  }}
                >
                  {provider}
                  {provider !== 'azure' && ' (Coming Soon)'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <input
                type="text"
                placeholder={
                  selectedProvider === 'azure' 
                    ? "Search Azure resources (e.g., 'vm list', 'storage account show')"
                    : "Select Azure to search resources"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchAzureResources()}
                disabled={!azureToolInfo?.available || selectedProvider !== 'azure'}
                className="input"
              />
              <button
                onClick={searchAzureResources}
                disabled={!azureToolInfo?.available || selectedProvider !== 'azure' || isLoading}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}
              >
                {isLoading ? (
                  <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Search style={{ width: '1rem', height: '1rem' }} />
                )}
                Search
              </button>
            </div>

            {/* Azure Authentication Status */}
            {azureAuthStatus && azureAuthStatus.is_logged_in && (
              <div style={{
                background: 'var(--color-success)10',
                border: '1px solid var(--color-success)20',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                  }}>
                    <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-success)' }} />
                    <span style={{ 
                      color: 'var(--color-success)', 
                      fontSize: '0.875rem', 
                      fontWeight: '600' 
                    }}>
                      Azure Authenticated
                    </span>
                  </div>
                  <button
                    onClick={checkToolAvailability}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                  >
                    Refresh
                  </button>
                </div>
                {azureAuthStatus.account_info && azureAuthStatus.account_info.name && (
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '0.75rem', 
                    margin: 'var(--spacing-sm) 0 0 0',
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    Logged in as: {azureAuthStatus.account_info.user?.name || 'Unknown'} 
                    ({azureAuthStatus.account_info.name})
                  </p>
                )}
              </div>
            )}
            
            {azureAuthStatus && !azureAuthStatus.is_logged_in && (
              <div style={{
                background: 'var(--color-error)10',
                border: '1px solid var(--color-error)20',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                  }}>
                    <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
                    <span style={{ 
                      color: 'var(--color-error)', 
                      fontSize: '0.875rem', 
                      fontWeight: '600' 
                    }}>
                      Azure Authentication Required
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                      onClick={testAzureCLI}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                    >
                      Test Azure CLI
                    </button>
                    <button
                      onClick={checkToolAvailability}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '0.75rem', 
                  margin: '0 0 var(--spacing-sm) 0',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  {azureAuthStatus.error || 'You need to log in to Azure CLI to use Azure Resource Finder.'}
                </p>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '0.75rem', 
                  margin: 0,
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  Run{' '}
                  <code style={{ 
                    background: 'var(--color-bg-tertiary)', 
                    padding: 'var(--spacing-xs) var(--spacing-sm)', 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-primary)'
                  }}>
                    az login
                  </code>{' '}
                  in your terminal.
                </p>
                
                {/* Debug Information */}
                {azureAuthStatus.debug_info && (
                  <details style={{ marginTop: 'var(--spacing-sm)' }}>
                    <summary style={{ 
                      color: 'var(--color-text-muted)', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer',
                      fontFamily: 'var(--font-family-primary)'
                    }}>
                      Debug Information
                    </summary>
                    <div style={{ 
                      marginTop: 'var(--spacing-sm)',
                      padding: 'var(--spacing-sm)',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family-primary)'
                    }}>
                      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-xs) 0' }}>
                        <strong>Platform:</strong> {azureAuthStatus.debug_info.platform}
                      </p>
                      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-xs) 0' }}>
                        <strong>Home:</strong> {azureAuthStatus.debug_info.home || 'Not found'}
                      </p>
                      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-xs) 0' }}>
                        <strong>Azure Config Dir:</strong> {azureAuthStatus.debug_info.azure_config_dir || 'Not set'}
                      </p>
                      <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        <strong>PATH:</strong> {azureAuthStatus.debug_info.path ? 'Set' : 'Not found'}
                      </p>
                    </div>
                  </details>
                )}
                
                {/* Azure CLI Test Results */}
                {azureTestResult && (
                  <details style={{ marginTop: 'var(--spacing-sm)' }}>
                    <summary style={{ 
                      color: 'var(--color-text-muted)', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer',
                      fontFamily: 'var(--font-family-primary)'
                    }}>
                      Azure CLI Test Results
                    </summary>
                    <div style={{ 
                      marginTop: 'var(--spacing-sm)',
                      padding: 'var(--spacing-sm)',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family-primary)'
                    }}>
                      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-xs) 0' }}>
                        <strong>Azure CLI Version:</strong> {azureTestResult.version_available ? 'Available' : 'Not found'}
                        {azureTestResult.version_available && (
                          <span style={{ color: 'var(--color-text-muted)' }}> - {azureTestResult.version_info}</span>
                        )}
                      </p>
                      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-xs) 0' }}>
                        <strong>Account Status:</strong> {azureTestResult.account_available ? 'Authenticated' : 'Not authenticated'}
                      </p>
                      {azureTestResult.account_available && azureTestResult.account_info && azureTestResult.account_info.user && (
                        <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-xs) 0' }}>
                          <strong>User:</strong> {azureTestResult.account_info.user.name || 'Unknown'}
                        </p>
                      )}
                      {azureTestResult.error && (
                        <p style={{ color: 'var(--color-error)', margin: 0 }}>
                          <strong>Error:</strong> {azureTestResult.error}
                        </p>
                      )}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Search Results */}
            {searchResults && (
              <div style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border-primary)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <pre style={{
                  color: searchResults.includes('Error:') ? 'var(--color-error)' : 'var(--color-success)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-family-primary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.5
                }}>
                  {searchResults}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Ruchy REPL Tab */}
        {activeTab === 'repl' && (
          <div>
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-primary)10',
              border: '1px solid var(--color-primary)20',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: 'var(--spacing-sm)'
              }}>
                <Zap style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  color: 'var(--color-primary)',
                  marginTop: '0.125rem',
                  flexShrink: 0
                }} />
                <div>
                  <p style={{
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    margin: '0 0 var(--spacing-xs) 0',
                    fontWeight: '500'
                  }}>
                    💡 Tip: Define functions first before calling them
                  </p>
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    margin: 0,
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    Example: <code>fn square(x) {'{ return x * x }'}</code>
                    {ruchyContextRef.current.getDefinedFunctions().length > 0 && (
                      <span style={{ display: 'block', marginTop: 'var(--spacing-xs)' }}>
                        Defined functions: {ruchyContextRef.current.getDefinedFunctions().join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* REPL Output */}
            <div style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              height: '300px',
              overflow: 'auto',
              marginBottom: 'var(--spacing-lg)',
              fontFamily: 'var(--font-family-primary)'
            }}>
              <pre style={{
                color: 'var(--color-text-code)',
                fontSize: '0.875rem',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                lineHeight: 1.5
              }}>
                {ruchyOutput || `Ruchy REPL - Type your commands below\n\nExamples:\n> fn square(x) { return x * x }  // Define a function\n> square(5)                       // Call the function\n> let x = 10                      // Define a variable\n> x * 2                           // Use the variable\n\nCommon mistake: Don't use 'fn' when calling a function!\n❌ fn square(4)  // Wrong - this tries to define a function\n✅ square(4)     // Correct - this calls the function`}
              </pre>
              <div ref={outputEndRef} />
            </div>

            {/* REPL Input */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <input
                type="text"
                placeholder={ruchyToolInfo?.available ? "Enter Ruchy command..." : "Ruchy not available"}
                value={ruchyCommand}
                onChange={(e) => setRuchyCommand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && executeRuchyCommand()}
                disabled={!ruchyToolInfo?.available || isLoading}
                className="input"
                style={{
                  fontFamily: 'var(--font-family-primary)'
                }}
              />
              <button
                onClick={executeRuchyCommand}
                disabled={!ruchyToolInfo?.available || isLoading || !ruchyCommand.trim()}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}
              >
                {isLoading ? (
                  <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Terminal style={{ width: '1rem', height: '1rem' }} />
                )}
                Execute
              </button>
            </div>

            {/* Clear Button */}
            <button
              onClick={clearReplSession}
              className="btn btn-error"
              style={{ fontSize: '0.875rem' }}
            >
              Clear Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}