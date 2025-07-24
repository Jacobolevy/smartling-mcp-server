// 🔄 Advanced Batch Operations Engine
// Intelligent batch processing with dynamic optimization and progress tracking

const { SmartErrorRecovery } = require('./advanced-error-recovery');

class BatchOperationsEngine {
  constructor(client, options = {}) {
    this.client = client;
    this.errorRecovery = new SmartErrorRecovery();
    
    // Configuration
    this.config = {
      defaultBatchSize: options.batchSize || 100,
      maxBatchSize: options.maxBatchSize || 500,
      minBatchSize: options.minBatchSize || 10,
      maxConcurrency: options.maxConcurrency || 5,
      delayBetweenBatches: options.delayBetweenBatches || 200,
      adaptiveSizing: options.adaptiveSizing !== false,
      progressCallback: options.progressCallback,
      retryFailedBatches: options.retryFailedBatches !== false
    };

    // State
    this.activeBatches = new Map();
    this.batchHistory = [];
    this.performanceMetrics = {
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      avgBatchTime: 0,
      adaptations: 0
    };
  }

  // 🚀 Main batch processing method
  async processBatch(operation, items, options = {}) {
    const batchId = this.generateBatchId();
    const config = { ...this.config, ...options };
    
    const batchContext = {
      id: batchId,
      operation: operation.name || 'unknown',
      totalItems: items.length,
      startTime: Date.now(),
      config
    };

    this.activeBatches.set(batchId, batchContext);

    try {
      process.stderr.write(`🔄 Starting batch operation: ${items.length} items (ID: ${batchId})\n`);
      
      const result = await this.executeBatchOperation(operation, items, batchContext);
      
      batchContext.endTime = Date.now();
      batchContext.duration = batchContext.endTime - batchContext.startTime;
      batchContext.success = true;
      
      this.recordBatchHistory(batchContext, result);
      
      process.stderr.write(`✅ Batch completed: ${result.successful}/${items.length} items in ${batchContext.duration}ms\n`);
      
      return result;
    } catch (error) {
      batchContext.endTime = Date.now();
      batchContext.duration = batchContext.endTime - batchContext.startTime;
      batchContext.success = false;
      batchContext.error = error.message;
      
      this.recordBatchHistory(batchContext, null);
      
      throw error;
    } finally {
      this.activeBatches.delete(batchId);
    }
  }

  async executeBatchOperation(operation, items, context) {
    const chunks = this.createOptimalChunks(items, context);
    const results = {
      successful: 0,
      failed: 0,
      results: [],
      errors: [],
      timing: {
        total: 0,
        batches: []
      }
    };

    // Process chunks with controlled concurrency
    let currentBatchSize = context.config.defaultBatchSize;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const batchStartTime = Date.now();
      
      try {
        // Report progress
        this.reportProgress(context, i, chunks.length, results);
        
        // Execute batch with error recovery
        const batchResult = await this.errorRecovery.recoverFromError(
          () => this.executeSingleBatch(operation, chunk, context),
          () => this.executeSingleBatch(operation, chunk, context),
          {
            operationType: 'batch',
            batchSize: chunk.length,
            batchIndex: i,
            totalBatches: chunks.length,
            client: this.client,
            projectId: context.projectId
          }
        );

        const batchDuration = Date.now() - batchStartTime;
        
        // Record successful batch
        results.successful += chunk.length;
        results.results.push(batchResult);
        results.timing.batches.push({
          index: i,
          size: chunk.length,
          duration: batchDuration
        });

        // Adaptive batch sizing
        if (context.config.adaptiveSizing) {
          currentBatchSize = this.adaptBatchSize(currentBatchSize, batchDuration, chunk.length);
          if (currentBatchSize !== context.config.defaultBatchSize) {
            this.performanceMetrics.adaptations++;
            process.stderr.write(`🔧 Adapted batch size: ${context.config.defaultBatchSize} → ${currentBatchSize}\n`);
          }
        }

        // Delay between batches to prevent rate limiting
        if (i < chunks.length - 1 && context.config.delayBetweenBatches > 0) {
          await this.sleep(context.config.delayBetweenBatches);
        }

      } catch (error) {
        const batchDuration = Date.now() - batchStartTime;
        
        results.failed += chunk.length;
        results.errors.push({
          batchIndex: i,
          items: chunk,
          error: error.message,
          duration: batchDuration
        });

        process.stderr.write(`❌ Batch ${i + 1}/${chunks.length} failed: ${error.message}\n`);

        // Decide whether to continue or abort
        if (!context.config.retryFailedBatches || this.shouldAbortBatch(results, chunks.length)) {
          break;
        }
      }
    }

    results.timing.total = Date.now() - context.startTime;
    this.updatePerformanceMetrics(results, context);

    return results;
  }

  createOptimalChunks(items, context) {
    const batchSize = context.config.defaultBatchSize;
    const chunks = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      chunks.push(items.slice(i, i + batchSize));
    }

    // Optimize last chunk if it's too small
    if (chunks.length > 1 && chunks[chunks.length - 1].length < batchSize * 0.3) {
      const lastChunk = chunks.pop();
      chunks[chunks.length - 1].push(...lastChunk);
    }

    return chunks;
  }

  async executeSingleBatch(operation, items, context) {
    const batchContext = {
      items,
      batchSize: items.length,
      projectId: context.projectId,
      operationType: context.operation
    };

    // Execute the actual operation
    if (typeof operation === 'function') {
      return await operation(items, batchContext);
    } else if (operation.execute) {
      return await operation.execute(items, batchContext);
    } else {
      throw new Error('Invalid operation: must be function or object with execute method');
    }
  }

  adaptBatchSize(currentSize, duration, itemCount) {
    const targetDuration = 5000; // 5 seconds target
    const tolerance = 0.2; // 20% tolerance
    
    // If batch was too slow, reduce size
    if (duration > targetDuration * (1 + tolerance)) {
      const reductionFactor = Math.sqrt(targetDuration / duration);
      return Math.max(
        this.config.minBatchSize,
        Math.floor(currentSize * reductionFactor)
      );
    }
    
    // If batch was too fast, increase size
    if (duration < targetDuration * (1 - tolerance)) {
      const increaseFactor = Math.sqrt(targetDuration / duration);
      return Math.min(
        this.config.maxBatchSize,
        Math.floor(currentSize * increaseFactor)
      );
    }

    return currentSize;
  }

  shouldAbortBatch(results, totalBatches) {
    const processedBatches = results.timing.batches.length + results.errors.length;
    const failureRate = results.errors.length / processedBatches;
    
    // Abort if failure rate is too high
    if (failureRate > 0.5 && processedBatches > 3) {
      process.stderr.write(`🛑 Aborting batch: high failure rate (${(failureRate * 100).toFixed(1)}%)\n`);
      return true;
    }
    
    return false;
  }

  reportProgress(context, currentBatch, totalBatches, results) {
    const progress = {
      batchProgress: ((currentBatch + 1) / totalBatches * 100).toFixed(1),
      itemsProcessed: results.successful + results.failed,
      totalItems: context.totalItems,
      successRate: results.successful / (results.successful + results.failed) * 100 || 0,
      elapsedTime: Date.now() - context.startTime
    };

    const progressMessage = `📊 Progress: ${progress.batchProgress}% (${progress.itemsProcessed}/${progress.totalItems} items, ${progress.successRate.toFixed(1)}% success)`;
    process.stderr.write(`${progressMessage}\n`);

    // Call custom progress callback if provided
    if (context.config.progressCallback) {
      try {
        context.config.progressCallback(progress);
      } catch (error) {
        process.stderr.write(`⚠️ Progress callback error: ${error.message}\n`);
      }
    }
  }

  recordBatchHistory(context, result) {
    const historyEntry = {
      id: context.id,
      operation: context.operation,
      totalItems: context.totalItems,
      duration: context.duration,
      success: context.success,
      timestamp: context.startTime,
      result: result ? {
        successful: result.successful,
        failed: result.failed,
        errorCount: result.errors.length
      } : null,
      error: context.error
    };

    this.batchHistory.push(historyEntry);

    // Keep history manageable
    if (this.batchHistory.length > 100) {
      this.batchHistory = this.batchHistory.slice(-100);
    }
  }

  updatePerformanceMetrics(results, context) {
    this.performanceMetrics.totalItems += context.totalItems;
    this.performanceMetrics.processedItems += results.successful;
    this.performanceMetrics.failedItems += results.failed;

    // Update average batch time
    const batchTimes = results.timing.batches.map(b => b.duration);
    if (batchTimes.length > 0) {
      const avgTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
      this.performanceMetrics.avgBatchTime = 
        (this.performanceMetrics.avgBatchTime + avgTime) / 2;
    }
  }

  // 🎯 Specialized batch operations

  async batchTagStrings(projectId, hashcodes, tags, options = {}) {
    const operation = async (items, context) => {
      return await this.client.addTagsToStrings(projectId, items, tags);
    };

    operation.name = 'batchTagStrings';
    return await this.processBatch(operation, hashcodes, { ...options, projectId });
  }

  async batchSearchAndTag(projectId, searchPatterns, tags, options = {}) {
    // First, collect all hashcodes from search patterns
    const allHashcodes = new Set();
    
    for (const pattern of searchPatterns) {
      try {
        const searchResults = await this.client.searchStrings(projectId, pattern, null, options.searchLimit || 100);
        searchResults.items.forEach(item => allHashcodes.add(item.hashcode));
      } catch (error) {
        process.stderr.write(`⚠️ Search failed for pattern "${pattern}": ${error.message}\n`);
      }
    }

    const hashcodes = Array.from(allHashcodes);
    process.stderr.write(`🔍 Found ${hashcodes.length} unique strings to tag\n`);

    return await this.batchTagStrings(projectId, hashcodes, tags, options);
  }

  async batchFileOperations(projectId, fileOperations, options = {}) {
    const operation = async (items, context) => {
      const results = [];
      
      for (const fileOp of items) {
        try {
          let result;
          switch (fileOp.type) {
            case 'upload':
              result = await this.client.uploadFile(projectId, fileOp.fileUri, fileOp.content, fileOp.fileType);
              break;
            case 'download':
              result = await this.client.downloadFile(projectId, fileOp.fileUri, fileOp.localeId);
              break;
            case 'delete':
              result = await this.client.deleteFile(projectId, fileOp.fileUri);
              break;
            default:
              throw new Error(`Unknown file operation: ${fileOp.type}`);
          }
          results.push({ ...fileOp, result, success: true });
        } catch (error) {
          results.push({ ...fileOp, error: error.message, success: false });
        }
      }
      
      return results;
    };

    operation.name = 'batchFileOperations';
    return await this.processBatch(operation, fileOperations, { ...options, projectId });
  }

  // 📊 Analytics and monitoring

  getPerformanceMetrics() {
    const successRate = this.performanceMetrics.totalItems > 0 
      ? ((this.performanceMetrics.processedItems / this.performanceMetrics.totalItems) * 100).toFixed(2)
      : 0;

    return {
      ...this.performanceMetrics,
      successRate: `${successRate}%`,
      activeBatches: this.activeBatches.size,
      historySize: this.batchHistory.length
    };
  }

  getActiveBatches() {
    return Array.from(this.activeBatches.values()).map(batch => ({
      id: batch.id,
      operation: batch.operation,
      totalItems: batch.totalItems,
      elapsedTime: Date.now() - batch.startTime,
      config: batch.config
    }));
  }

  getBatchHistory(limit = 10) {
    return this.batchHistory
      .slice(-limit)
      .reverse()
      .map(entry => ({
        ...entry,
        durationFormatted: this.formatDuration(entry.duration),
        timestampFormatted: new Date(entry.timestamp).toISOString()
      }));
  }

  analyzePerformance() {
    const recentBatches = this.batchHistory.slice(-20);
    
    if (recentBatches.length === 0) {
      return { message: 'No batch history available' };
    }

    const successful = recentBatches.filter(b => b.success);
    const failed = recentBatches.filter(b => !b.success);
    
    const avgDuration = successful.reduce((sum, b) => sum + b.duration, 0) / successful.length || 0;
    const avgItemsPerSecond = successful.reduce((sum, b) => sum + (b.totalItems / (b.duration / 1000)), 0) / successful.length || 0;

    return {
      totalBatches: recentBatches.length,
      successfulBatches: successful.length,
      failedBatches: failed.length,
      successRate: `${(successful.length / recentBatches.length * 100).toFixed(1)}%`,
      averageDuration: this.formatDuration(avgDuration),
      averageItemsPerSecond: Math.round(avgItemsPerSecond),
      adaptations: this.performanceMetrics.adaptations,
      recommendations: this.generatePerformanceRecommendations(recentBatches)
    };
  }

  generatePerformanceRecommendations(batches) {
    const recommendations = [];
    
    const avgDuration = batches.reduce((sum, b) => sum + (b.duration || 0), 0) / batches.length;
    const failureRate = batches.filter(b => !b.success).length / batches.length;

    if (avgDuration > 30000) {
      recommendations.push({
        type: 'performance',
        message: 'Batches are taking too long on average',
        suggestion: 'Consider reducing batch size or optimizing operations'
      });
    }

    if (failureRate > 0.1) {
      recommendations.push({
        type: 'reliability',
        message: `High failure rate detected: ${(failureRate * 100).toFixed(1)}%`,
        suggestion: 'Review error patterns and implement better error handling'
      });
    }

    if (this.performanceMetrics.adaptations > batches.length * 0.5) {
      recommendations.push({
        type: 'stability',
        message: 'Frequent batch size adaptations detected',
        suggestion: 'Consider adjusting default batch size or operation complexity'
      });
    }

    return recommendations;
  }

  // Utility methods
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Configuration management
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    process.stderr.write(`🔧 Batch engine config updated: ${JSON.stringify(newConfig)}\n`);
  }

  getConfig() {
    return { ...this.config };
  }
}

module.exports = { BatchOperationsEngine }; 