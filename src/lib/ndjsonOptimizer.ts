interface TokenStats {
  original: number
  optimized: number
  saved: number
  savingsPercent: number
}

export class NDJSONOptimizer {
  // Approximate token counting (1 token ≈ 4 characters for English text)
  static countTokens(text: string): number {
    if (!text || text.length === 0) return 0
    return Math.ceil(text.length / 4)
  }

  // Convert verbose JSON to NDJSON format
  static toNDJSON(data: any[]): string {
    return data.map(item => JSON.stringify(item)).join('\n')
  }

  // Parse NDJSON back to array
  static fromNDJSON(ndjson: string): any[] {
    return ndjson
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
  }

  // Optimize message for token efficiency
  static optimizeMessage(message: string): {
    optimized: string
    stats: TokenStats
    techniques: string[]
  } {
    const techniques: string[] = []
    let optimized = message

    // 0. Skip optimization for very short messages
    if (message.length < 20) {
      return {
        optimized: message,
        stats: {
          original: this.countTokens(message),
          optimized: this.countTokens(message),
          saved: 0,
          savingsPercent: 0
        },
        techniques: ['Message too short to optimize']
      }
    }

    // 1. Remove excessive whitespace
    const whitespaceReduced = optimized.replace(/\s+/g, ' ').trim()
    if (whitespaceReduced.length < optimized.length) {
      optimized = whitespaceReduced
      techniques.push('Removed excessive whitespace')
    }

    // 2. Remove redundant punctuation
    optimized = optimized.replace(/([.!?])\1+/g, '$1')
    if (optimized !== message) {
      techniques.push('Removed redundant punctuation')
    }

    // 3. Compress repeated phrases
    const phrases = this.findRepeatedPhrases(optimized)
    if (phrases.length > 0) {
      for (const phrase of phrases) {
        const shortened = `[${phrase.substring(0, 20)}...]`
        optimized = optimized.replace(new RegExp(phrase, 'g'), shortened)
      }
      techniques.push('Compressed repeated phrases')
    }

    // 4. Remove unnecessary quotes and brackets
    optimized = optimized.replace(/["'`]/g, '')
    if (optimized !== message) {
      techniques.push('Removed unnecessary quotes')
    }

    // 5. Abbreviate common words
    const abbreviations: Record<string, string> = {
      'kubernetes': 'k8s',
      'application': 'app',
      'configuration': 'config',
      'environment': 'env',
      'development': 'dev',
      'production': 'prod',
      'repository': 'repo',
      'database': 'db',
      'administrator': 'admin',
      'authentication': 'auth',
      'authorization': 'authz'
    }

    for (const [full, abbr] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi')
      if (regex.test(optimized)) {
        optimized = optimized.replace(regex, abbr)
        techniques.push(`Abbreviated "${full}" to "${abbr}"`)
      }
    }

    // Calculate token statistics
    const originalTokens = this.countTokens(message)
    const optimizedTokens = this.countTokens(optimized)
    const saved = originalTokens - optimizedTokens
    const savingsPercent = originalTokens > 0 ? Math.round((saved / originalTokens) * 100) : 0

    return {
      optimized,
      stats: {
        original: originalTokens,
        optimized: optimizedTokens,
        saved,
        savingsPercent
      },
      techniques
    }
  }

  // Find repeated phrases in text
  private static findRepeatedPhrases(text: string, minLength: number = 20): string[] {
    const phrases: Map<string, number> = new Map()
    const words = text.split(' ')
    
    for (let i = 0; i < words.length - 3; i++) {
      for (let j = 3; j <= 10 && i + j <= words.length; j++) {
        const phrase = words.slice(i, i + j).join(' ')
        if (phrase.length >= minLength) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1)
        }
      }
    }

    return Array.from(phrases.entries())
      .filter(([_, count]) => count > 1)
      .map(([phrase]) => phrase)
      .sort((a, b) => b.length - a.length)
      .slice(0, 5)
  }

  // Optimize conversation history using NDJSON
  static optimizeConversation(messages: Array<{role: string, content: string}>): {
    optimized: string
    stats: TokenStats
    messageCount: number
  } {
    // Convert to compact NDJSON format
    const ndjson = messages.map(msg => ({
      r: msg.role === 'user' ? 'u' : 'a',
      c: this.optimizeMessage(msg.content).optimized
    }))

    const optimizedNDJSON = this.toNDJSON(ndjson)
    const originalJSON = JSON.stringify(messages, null, 2)

    const originalTokens = this.countTokens(originalJSON)
    const optimizedTokens = this.countTokens(optimizedNDJSON)

    return {
      optimized: optimizedNDJSON,
      stats: {
        original: originalTokens,
        optimized: optimizedTokens,
        saved: originalTokens - optimizedTokens,
        savingsPercent: Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100)
      },
      messageCount: messages.length
    }
  }

  // Create a summary of token usage
  static getTokenSummary(messages: Array<{role: string, content: string}>): {
    totalTokens: number
    userTokens: number
    assistantTokens: number
    averageMessageTokens: number
    longestMessage: number
    estimatedCost: {
      input: number
      output: number
      total: number
    }
  } {
    if (!messages || messages.length === 0) {
      return {
        totalTokens: 0,
        userTokens: 0,
        assistantTokens: 0,
        averageMessageTokens: 0,
        longestMessage: 0,
        estimatedCost: {
          input: 0,
          output: 0,
          total: 0
        }
      }
    }
    let totalTokens = 0
    let userTokens = 0
    let assistantTokens = 0
    let longestMessage = 0

    for (const msg of messages) {
      const tokens = this.countTokens(msg.content)
      totalTokens += tokens
      
      if (msg.role === 'user') {
        userTokens += tokens
      } else {
        assistantTokens += tokens
      }
      
      longestMessage = Math.max(longestMessage, tokens)
    }

    // Estimate costs (based on GPT-4 pricing as example)
    const inputCostPer1k = 0.03
    const outputCostPer1k = 0.06
    
    return {
      totalTokens,
      userTokens,
      assistantTokens,
      averageMessageTokens: messages.length > 0 ? Math.round(totalTokens / messages.length) : 0,
      longestMessage,
      estimatedCost: {
        input: (userTokens / 1000) * inputCostPer1k,
        output: (assistantTokens / 1000) * outputCostPer1k,
        total: ((userTokens / 1000) * inputCostPer1k) + ((assistantTokens / 1000) * outputCostPer1k)
      }
    }
  }
}