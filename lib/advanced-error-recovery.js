// 🛠️ Advanced Error Recovery System
// Intelligent error handling with pattern recognition and recovery strategies

class SmartErrorRecovery {
  constructor() {
    this.errorPatterns = new Map();
    this.recoveryStrategies = new Map();
    this.errorHistory = [];
    this.maxHistorySize = 1000;
    
    this.initializeStrategies();
  }

  initializeStrategies() {
    // Rate limiting errors
    this.recoveryStrategies.set('RATE_LIMIT', {
      type: 'exponential_backoff',
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      jitter: true
    });

    // Network timeout errors
    this.recoveryStrategies.set('TIMEOUT', {
      type: 'retry_with_reduced_load',
      maxRetries: 3,
      reduceLoad: true,
      baseDelay: 1000
    });

    // Authentication errors
    this.recoveryStrategies.set('AUTH_ERROR', {
      type: 'reauthenticate_and_retry',
      maxRetries: 2,
      requireAuth: true
    });

    // Payload too large errors
    this.recoveryStrategies.set('PAYLOAD_TOO_LARGE', {
      type: 'split_and_retry',
      maxRetries: 3,
      splitRatio: 0.5
    });

    // Server errors (5xx)
    this.recoveryStrategies.set('SERVER_ERROR', {
      type: 'circuit_breaker_retry',
      maxRetries: 4,
      circuitBreaker: true,
      baseDelay: 5000
    });
  }

  async recoverFromError(error, operation, context, attempt = 1) {
    const errorType = this.classifyError(error);
    const strategy = this.getRecoveryStrategy(errorType, context);
    
    // Record error for pattern analysis
    this.recordError(error, errorType, context, attempt);

    if (!strategy || attempt > strategy.maxRetries) {
      throw this.createEnhancedError(error, errorType, context, attempt);
    }

    // Wait before retry (with jitter if configured)
    if (strategy.baseDelay) {
      const delay = this.calculateDelay(strategy, attempt);
      await this.sleep(delay);
    }

    try {
      return await this.executeRecoveryStrategy(strategy, operation, context, attempt);
    } catch (retryError) {
      return await this.recoverFromError(retryError, operation, context, attempt + 1);
    }
  }

  classifyError(error) {
    const message = error.message.toLowerCase();
    const statusCode = error.statusCode || error.status;

    // Rate limiting
    if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return 'RATE_LIMIT';
    }

    // Authentication
    if (statusCode === 401 || statusCode === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'AUTH_ERROR';
    }

    // Timeout
    if (message.includes('timeout') || message.includes('etimedout') || statusCode === 408) {
      return 'TIMEOUT';
    }

    // Payload too large
    if (statusCode === 413 || message.includes('payload too large') || message.includes('entity too large')) {
      return 'PAYLOAD_TOO_LARGE';
    }

    // Server errors
    if (statusCode >= 500 || message.includes('internal server error') || message.includes('bad gateway')) {
      return 'SERVER_ERROR';
    }

    // Network errors
    if (message.includes('econnreset') || message.includes('enotfound') || message.includes('network')) {
      return 'NETWORK_ERROR';
    }

    // Unknown error
    return 'UNKNOWN';
  }

  getRecoveryStrategy(errorType, context) {
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (!strategy) {
      // Default strategy for unknown errors
      return {
        type: 'simple_retry',
        maxRetries: 2,
        baseDelay: 1000
      };
    }

    // Customize strategy based on context
    const customized = { ...strategy };
    
    if (context.operationType === 'batch' && customized.type === 'retry_with_reduced_load') {
      customized.reduceLoad = true;
      customized.splitRatio = 0.3;
    }

    if (context.priority === 'high') {
      customized.maxRetries = Math.min(customized.maxRetries + 2, 7);
    }

    return customized;
  }

  async executeRecoveryStrategy(strategy, operation, context, attempt) {
    switch (strategy.type) {
      case 'exponential_backoff':
        return await operation();

      case 'retry_with_reduced_load':
        return await this.retryWithReducedLoad(operation, context, strategy);

      case 'reauthenticate_and_retry':
        return await this.reauthenticateAndRetry(operation, context);

      case 'split_and_retry':
        return await this.splitAndRetry(operation, context, strategy);

      case 'circuit_breaker_retry':
        return await this.circuitBreakerRetry(operation, context);

      default:
        return await operation();
    }
  }

  async retryWithReducedLoad(operation, context, strategy) {
    if (strategy.reduceLoad && context.batchSize) {
      const newBatchSize = Math.max(1, Math.floor(context.batchSize * (strategy.splitRatio || 0.5)));
      const modifiedContext = { ...context, batchSize: newBatchSize };
      
      process.stderr.write(`🔄 Retrying with reduced batch size: ${context.batchSize} → ${newBatchSize}\n`);
      
      return await operation(modifiedContext);
    }
    
    return await operation();
  }

  async reauthenticateAndRetry(operation, context) {
    if (context.client && typeof context.client.authenticate === 'function') {
      process.stderr.write('🔐 Re-authenticating due to auth error...\n');
      
      try {
        await context.client.authenticate();
        return await operation();
      } catch (authError) {
        throw new Error(`Re-authentication failed: ${authError.message}`);
      }
    }
    
    return await operation();
  }

  async splitAndRetry(operation, context, strategy) {
    if (!context.items || !Array.isArray(context.items)) {
      return await operation();
    }

    const splitRatio = strategy.splitRatio || 0.5;
    const splitSize = Math.max(1, Math.floor(context.items.length * splitRatio));
    
    process.stderr.write(`✂️ Splitting operation: ${context.items.length} → ${splitSize} items\n`);
    
    const chunk1 = context.items.slice(0, splitSize);
    const chunk2 = context.items.slice(splitSize);
    
    const results = [];
    
    // Process first chunk
    if (chunk1.length > 0) {
      const result1 = await operation({ ...context, items: chunk1 });
      results.push(result1);
    }
    
    // Process second chunk
    if (chunk2.length > 0) {
      const result2 = await operation({ ...context, items: chunk2 });
      results.push(result2);
    }
    
    // Merge results
    return this.mergeResults(results);
  }

  async circuitBreakerRetry(operation, context) {
    // This would integrate with the CircuitBreaker class
    if (context.circuitBreaker) {
      return await context.circuitBreaker.execute(operation);
    }
    
    return await operation();
  }

  calculateDelay(strategy, attempt) {
    let delay = strategy.baseDelay * Math.pow(2, attempt - 1);
    
    if (strategy.maxDelay) {
      delay = Math.min(delay, strategy.maxDelay);
    }
    
    if (strategy.jitter) {
      // Add ±25% jitter to prevent thundering herd
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return Math.max(100, Math.floor(delay));
  }

  recordError(error, errorType, context, attempt) {
    const errorRecord = {
      timestamp: Date.now(),
      error: error.message,
      errorType,
      statusCode: error.statusCode || error.status,
      attempt,
      operation: context.operationType,
      context: {
        projectId: context.projectId,
        userId: context.userId,
        batchSize: context.batchSize
      }
    };

    this.errorHistory.push(errorRecord);
    
    // Keep history size manageable
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }

    // Update error patterns
    const patternKey = `${errorType}:${context.operationType || 'unknown'}`;
    const existing = this.errorPatterns.get(patternKey) || { count: 0, lastSeen: 0, attempts: [] };
    
    existing.count++;
    existing.lastSeen = Date.now();
    existing.attempts.push(attempt);
    
    this.errorPatterns.set(patternKey, existing);
  }

  createEnhancedError(originalError, errorType, context, finalAttempt) {
    const enhancedError = new Error(`${originalError.message} (after ${finalAttempt} attempts)`);
    enhancedError.originalError = originalError;
    enhancedError.errorType = errorType;
    enhancedError.context = context;
    enhancedError.attempts = finalAttempt;
    enhancedError.recoveryFailed = true;
    
    return enhancedError;
  }

  mergeResults(results) {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];
    
    // Default merge strategy - extend arrays or merge objects
    const first = results[0];
    
    if (Array.isArray(first)) {
      return results.flat();
    }
    
    if (typeof first === 'object' && first !== null) {
      const merged = { ...first };
      
      for (let i = 1; i < results.length; i++) {
        const result = results[i];
        if (typeof result === 'object' && result !== null) {
          Object.assign(merged, result);
          
          // Special handling for arrays in objects
          for (const key in result) {
            if (Array.isArray(first[key]) && Array.isArray(result[key])) {
              merged[key] = [...(merged[key] || []), ...result[key]];
            }
          }
        }
      }
      
      return merged;
    }
    
    return results[results.length - 1]; // Return last result as fallback
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Analytics and reporting
  analyzeErrorPatterns() {
    const analysis = {
      totalErrors: this.errorHistory.length,
      errorTypes: new Map(),
      operationTypes: new Map(),
      timeRanges: new Map(),
      successfulRecoveries: 0,
      failedRecoveries: 0
    };

    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;

    for (const error of this.errorHistory) {
      // Count by error type
      const typeCount = analysis.errorTypes.get(error.errorType) || 0;
      analysis.errorTypes.set(error.errorType, typeCount + 1);

      // Count by operation type
      const opCount = analysis.operationTypes.get(error.operation) || 0;
      analysis.operationTypes.set(error.operation, opCount + 1);

      // Time range analysis
      if (error.timestamp > hourAgo) {
        const hourCount = analysis.timeRanges.get('last_hour') || 0;
        analysis.timeRanges.set('last_hour', hourCount + 1);
      }
      
      if (error.timestamp > dayAgo) {
        const dayCount = analysis.timeRanges.get('last_day') || 0;
        analysis.timeRanges.set('last_day', dayCount + 1);
      }

      // Recovery success rate
      if (error.attempt === 1) {
        analysis.failedRecoveries++;
      } else {
        analysis.successfulRecoveries++;
      }
    }

    return {
      summary: analysis,
      patterns: Array.from(this.errorPatterns.entries()).map(([key, data]) => ({
        pattern: key,
        occurrences: data.count,
        lastSeen: data.lastSeen,
        avgAttempts: data.attempts.reduce((a, b) => a + b, 0) / data.attempts.length
      })),
      recommendations: this.generateRecommendations(analysis)
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // High error rate recommendations
    const hourlyErrors = analysis.timeRanges.get('last_hour') || 0;
    if (hourlyErrors > 10) {
      recommendations.push({
        type: 'high_error_rate',
        severity: 'warning',
        message: `High error rate detected: ${hourlyErrors} errors in the last hour`,
        suggestion: 'Consider implementing circuit breaker or reducing request rate'
      });
    }

    // Specific error type recommendations
    for (const [errorType, count] of analysis.errorTypes) {
      if (count > 5) {
        switch (errorType) {
          case 'RATE_LIMIT':
            recommendations.push({
              type: 'rate_limiting',
              severity: 'info',
              message: `Frequent rate limiting detected (${count} occurrences)`,
              suggestion: 'Implement better request spacing or reduce batch sizes'
            });
            break;
          case 'TIMEOUT':
            recommendations.push({
              type: 'timeout_issues',
              severity: 'warning',
              message: `Multiple timeout errors (${count} occurrences)`,
              suggestion: 'Increase timeout values or optimize request payloads'
            });
            break;
        }
      }
    }

    return recommendations;
  }

  getStats() {
    return {
      totalErrors: this.errorHistory.length,
      strategies: this.recoveryStrategies.size,
      patterns: this.errorPatterns.size,
      recentErrors: this.errorHistory.filter(e => Date.now() - e.timestamp < 3600000).length
    };
  }
}

module.exports = { SmartErrorRecovery }; 