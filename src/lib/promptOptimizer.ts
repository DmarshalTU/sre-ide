// Prompt optimization utilities for SRE IDE
// Handles NDJSON formatting and sensitive data masking

export interface OptimizedPrompt {
  original: string
  optimized: string
  masked: boolean
  warnings: string[]
  tokenEstimate: number
}

// Common sensitive data patterns
const SENSITIVE_PATTERNS = [
  // API Keys and Tokens
  /(api[_-]?key|token|secret|password|pwd|passwd)\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,
  // AWS Keys
  /AKIA[0-9A-Z]{16}/g,
  /[0-9a-zA-Z/+]{40}/g,
  // Private Keys
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
  // Database URLs
  /(mongodb|postgresql|mysql|redis):\/\/[^:]+:[^@]+@[^\/]+/gi,
  // Kubernetes Secrets
  /kubectl\s+create\s+secret[^`]*`[^`]*`/gi,
  // Docker Registry Credentials
  /docker\s+login[^`]*`[^`]*`/gi,
  // SSH Keys
  /ssh-rsa\s+[A-Za-z0-9+/]+[=]{0,3}\s+[^@]+@[^@]+/g,
  // IP Addresses (internal)
  /(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d+\.\d+/g,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
]

// NDJSON structure for SRE prompts
interface SREPromptStructure {
  context: string
  action: string
  resources: string[]
  constraints: string[]
  expected_output: string
}

export class PromptOptimizer {
  private static maskSensitiveData(text: string): { masked: string; warnings: string[] } {
    let masked = text
    const warnings: string[] = []
    
    SENSITIVE_PATTERNS.forEach((pattern, index) => {
      const matches = text.match(pattern)
      if (matches) {
        const patternNames = [
          'API Key/Token',
          'AWS Access Key',
          'AWS Secret Key', 
          'Private Key',
          'Database URL',
          'Kubernetes Secret',
          'Docker Credentials',
          'SSH Key',
          'Internal IP',
          'Email Address'
        ]
        
        warnings.push(`⚠️ Detected ${patternNames[index] || 'sensitive data'}: ${matches.length} occurrence(s)`)
        masked = masked.replace(pattern, '[SENSITIVE_DATA_MASKED]')
      }
    })
    
    return { masked, warnings }
  }

  private static optimizeForTokens(text: string): string {
    // Remove unnecessary whitespace and comments
    let optimized = text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\/\/.*$/gm, '') // Remove single line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .trim()
    
    // Shorten common SRE phrases
    const shortcuts: Record<string, string> = {
      'please': 'pls',
      'investigate': 'invest',
      'investigation': 'invest',
      'troubleshoot': 'debug',
      'troubleshooting': 'debug',
      'configuration': 'config',
      'deployment': 'deploy',
      'monitoring': 'monitor',
      'observability': 'obs',
      'infrastructure': 'infra',
      'kubernetes': 'k8s',
      'container': 'cont',
      'application': 'app',
      'service': 'svc',
      'namespace': 'ns',
      'pod': 'pod',
      'node': 'node',
      'cluster': 'cluster',
      'network': 'net',
      'database': 'db',
      'server': 'srv',
      'endpoint': 'ep',
      'authentication': 'auth',
      'authorization': 'authz',
      'certificate': 'cert',
      'load balancer': 'lb',
      'virtual machine': 'vm',
      'cloud provider': 'cloud',
      'microservice': 'microsvc',
      'application programming interface': 'api',
    }
    
    Object.entries(shortcuts).forEach(([long, short]) => {
      const regex = new RegExp(`\\b${long}\\b`, 'gi')
      optimized = optimized.replace(regex, short)
    })
    
    return optimized
  }

  private static structureAsNDJSON(prompt: string): string {
    // Try to structure the prompt as NDJSON for better agent understanding
    const lines = prompt.split('\n').filter(line => line.trim())
    
    if (lines.length <= 1) {
      return prompt // Keep simple prompts as-is
    }
    
    const structure: SREPromptStructure = {
      context: '',
      action: '',
      resources: [],
      constraints: [],
      expected_output: ''
    }
    
    let currentSection = 'context'
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return
      
      // Detect sections based on keywords
      if (trimmed.toLowerCase().includes('check') || trimmed.toLowerCase().includes('investigate') || trimmed.toLowerCase().includes('debug')) {
        currentSection = 'action'
      } else if (trimmed.toLowerCase().includes('pod') || trimmed.toLowerCase().includes('service') || trimmed.toLowerCase().includes('namespace')) {
        currentSection = 'resources'
      } else if (trimmed.toLowerCase().includes('output') || trimmed.toLowerCase().includes('result') || trimmed.toLowerCase().includes('format')) {
        currentSection = 'expected_output'
      }
      
      // Add to appropriate section
      switch (currentSection) {
        case 'context':
          structure.context += (structure.context ? ' ' : '') + trimmed
          break
        case 'action':
          structure.action += (structure.action ? ' ' : '') + trimmed
          break
        case 'resources':
          structure.resources.push(trimmed)
          break
        case 'expected_output':
          structure.expected_output += (structure.expected_output ? ' ' : '') + trimmed
          break
      }
    })
    
    // Convert to NDJSON format
    const ndjsonLines = []
    if (structure.context) ndjsonLines.push(`{"context": "${structure.context}"}`)
    if (structure.action) ndjsonLines.push(`{"action": "${structure.action}"}`)
    if (structure.resources.length > 0) {
      structure.resources.forEach(resource => {
        ndjsonLines.push(`{"resource": "${resource}"}`)
      })
    }
    if (structure.expected_output) ndjsonLines.push(`{"expected_output": "${structure.expected_output}"}`)
    
    return ndjsonLines.length > 0 ? ndjsonLines.join('\n') : prompt
  }

  private static estimateTokens(text: string): number {
    // Rough token estimation (1 token ≈ 4 characters for English)
    return Math.ceil(text.length / 4)
  }

  static optimize(prompt: string): OptimizedPrompt {
    const original = prompt
    
    // Step 1: Check for sensitive data
    const { masked, warnings } = this.maskSensitiveData(prompt)
    
    // Step 2: Optimize for token efficiency
    const optimized = this.optimizeForTokens(masked)
    
    // Step 3: Structure as NDJSON if beneficial
    const structured = this.structureAsNDJSON(optimized)
    
    // Step 4: Estimate tokens
    const tokenEstimate = this.estimateTokens(structured)
    
    // Step 5: Add warnings for long prompts
    if (tokenEstimate > 1000) {
      warnings.push(`⚠️ Large prompt detected: ~${tokenEstimate} tokens (consider breaking into smaller requests)`)
    }
    
    return {
      original,
      optimized: structured,
      masked: warnings.some(w => w.includes('SENSITIVE_DATA_MASKED')),
      warnings,
      tokenEstimate
    }
  }

  static validatePrompt(prompt: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!prompt.trim()) {
      errors.push('Prompt cannot be empty')
    }
    
    if (prompt.length < 10) {
      errors.push('Prompt is too short for meaningful SRE tasks')
    }
    
    if (prompt.length > 5000) {
      errors.push('Prompt is too long (max 5000 characters)')
    }
    
    // Check for common SRE keywords
    const sreKeywords = ['check', 'investigate', 'debug', 'monitor', 'deploy', 'scale', 'restart', 'logs', 'metrics']
    const hasSREKeywords = sreKeywords.some(keyword => prompt.toLowerCase().includes(keyword))
    
    if (!hasSREKeywords) {
      errors.push('Prompt should include SRE-related keywords (check, investigate, debug, etc.)')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}
