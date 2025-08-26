interface SensitiveDataPattern {
  name: string
  pattern: RegExp
  replacement: string
  severity: 'high' | 'medium' | 'low'
}

export class SecurityScanner {
  private static patterns: SensitiveDataPattern[] = [
    // API Keys and Tokens
    {
      name: 'API Key',
      pattern: /\b(api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
      replacement: 'API_KEY=[REDACTED]',
      severity: 'high'
    },
    {
      name: 'Bearer Token',
      pattern: /\b(bearer|token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-\.]{20,})['"]?/gi,
      replacement: 'TOKEN=[REDACTED]',
      severity: 'high'
    },
    {
      name: 'AWS Access Key',
      pattern: /\b(AKIA[0-9A-Z]{16})\b/g,
      replacement: 'AWS_KEY=[REDACTED]',
      severity: 'high'
    },
    {
      name: 'AWS Secret Key',
      pattern: /\b([a-zA-Z0-9/+=]{40})\b/g,
      replacement: 'AWS_SECRET=[REDACTED]',
      severity: 'high'
    },
    // Passwords - multiple patterns for better detection
    {
      name: 'Password',
      pattern: /\b(password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]{8,})['"]?/gi,
      replacement: 'PASSWORD=[REDACTED]',
      severity: 'high'
    },
    {
      name: 'Password',
      pattern: /\b(?:my |the )?password\s+(?:is|are|:|=)\s*['"]?([^\s'"]{4,})['"]?/gi,
      replacement: 'password is [REDACTED]',
      severity: 'high'
    },
    {
      name: 'Password',
      pattern: /\b(?:pass|pwd)\s*[:=]\s*['"]?([^\s'"]{4,})['"]?/gi,
      replacement: 'pass=[REDACTED]',
      severity: 'high'
    },
    // Private Keys
    {
      name: 'Private Key',
      pattern: /-----BEGIN\s+(RSA|DSA|EC|OPENSSH)?\s*PRIVATE KEY-----[\s\S]*?-----END\s+(RSA|DSA|EC|OPENSSH)?\s*PRIVATE KEY-----/gi,
      replacement: '-----BEGIN PRIVATE KEY-----[REDACTED]-----END PRIVATE KEY-----',
      severity: 'high'
    },
    // Connection Strings
    {
      name: 'Database Connection String',
      pattern: /\b(mongodb|postgres|postgresql|mysql|redis|amqp):\/\/[^\s]+/gi,
      replacement: 'CONNECTION_STRING=[REDACTED]',
      severity: 'high'
    },
    // JWT Tokens
    {
      name: 'JWT Token',
      pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      replacement: 'JWT=[REDACTED]',
      severity: 'high'
    },
    // Credit Cards
    {
      name: 'Credit Card',
      pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      replacement: 'CREDIT_CARD=[REDACTED]',
      severity: 'high'
    },
    // SSH Keys
    {
      name: 'SSH Key',
      pattern: /ssh-rsa\s+[A-Za-z0-9+/]+[=]{0,2}/g,
      replacement: 'SSH_KEY=[REDACTED]',
      severity: 'high'
    },
    // Email Addresses (medium severity)
    {
      name: 'Email',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: 'EMAIL=[REDACTED]',
      severity: 'medium'
    },
    // IP Addresses (low severity)
    {
      name: 'IP Address',
      pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      replacement: 'IP=[REDACTED]',
      severity: 'low'
    },
    // Phone Numbers
    {
      name: 'Phone Number',
      pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      replacement: 'PHONE=[REDACTED]',
      severity: 'medium'
    },
    // Social Security Numbers
    {
      name: 'SSN',
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: 'SSN=[REDACTED]',
      severity: 'high'
    },
    // GitHub Tokens
    {
      name: 'GitHub Token',
      pattern: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/g,
      replacement: 'GITHUB_TOKEN=[REDACTED]',
      severity: 'high'
    },
    // Slack Tokens
    {
      name: 'Slack Token',
      pattern: /xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[a-zA-Z0-9]{24,32}/g,
      replacement: 'SLACK_TOKEN=[REDACTED]',
      severity: 'high'
    }
  ]

  static scan(text: string): {
    hasSensitiveData: boolean
    findings: Array<{
      type: string
      severity: 'high' | 'medium' | 'low'
      match: string
      position: number
    }>
    summary: {
      high: number
      medium: number
      low: number
    }
  } {
    if (!text || text.length === 0) {
      return {
        hasSensitiveData: false,
        findings: [],
        summary: { high: 0, medium: 0, low: 0 }
      }
    }

    const findings: Array<{
      type: string
      severity: 'high' | 'medium' | 'low'
      match: string
      position: number
    }> = []

    for (const pattern of this.patterns) {
      const regex = new RegExp(pattern.pattern)
      let match
      
      while ((match = regex.exec(text)) !== null) {
        findings.push({
          type: pattern.name,
          severity: pattern.severity,
          match: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
          position: match.index
        })
      }
    }

    const summary = {
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length
    }

    return {
      hasSensitiveData: findings.length > 0,
      findings,
      summary
    }
  }

  static mask(text: string): {
    maskedText: string
    maskCount: number
  } {
    if (!text || text.length === 0) {
      return {
        maskedText: text || '',
        maskCount: 0
      }
    }

    let maskedText = text
    let maskCount = 0

    for (const pattern of this.patterns) {
      const regex = new RegExp(pattern.pattern)
      const matches = maskedText.match(regex)
      if (matches) {
        maskCount += matches.length
        maskedText = maskedText.replace(regex, pattern.replacement)
      }
    }

    return {
      maskedText,
      maskCount
    }
  }

  static getMaskingSummary(original: string, _masked: string): string {
    const scanResult = this.scan(original)
    if (!scanResult.hasSensitiveData) {
      return 'No sensitive data detected'
    }

    const parts = []
    if (scanResult.summary.high > 0) {
      parts.push(`${scanResult.summary.high} high-risk`)
    }
    if (scanResult.summary.medium > 0) {
      parts.push(`${scanResult.summary.medium} medium-risk`)
    }
    if (scanResult.summary.low > 0) {
      parts.push(`${scanResult.summary.low} low-risk`)
    }

    return `Masked ${parts.join(', ')} sensitive data items`
  }
}