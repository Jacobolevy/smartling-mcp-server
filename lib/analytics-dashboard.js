// 📊 Advanced Analytics & Monitoring Dashboard
// Real-time performance tracking with intelligent insights and predictive analytics

class AnalyticsDashboard {
  constructor(options = {}) {
    this.config = {
      metricsRetention: options.metricsRetention || 86400000, // 24 hours
      alertThresholds: options.alertThresholds || {},
      reportingInterval: options.reportingInterval || 60000, // 1 minute
      enablePredictiveAnalytics: options.enablePredictiveAnalytics !== false
    };

    // Data storage
    this.metrics = new Map();
    this.alerts = [];
    this.operationHistory = [];
    this.performanceBaselines = new Map();
    this.predictions = new Map();
    
    // Real-time tracking
    this.currentSessions = new Map();
    this.realtimeMetrics = {
      activeOperations: 0,
      requestsPerMinute: 0,
      errorRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0
    };

    // Initialize default thresholds
    this.initializeDefaultThresholds();
    
    // Start background processes
    this.startMetricsCollection();
    this.startPredictiveAnalysis();
  }

  initializeDefaultThresholds() {
    this.config.alertThresholds = {
      errorRate: 5.0, // 5%
      responseTime: 10000, // 10 seconds
      memoryUsage: 85, // 85%
      queueSize: 100,
      failedBatches: 3,
      ...this.config.alertThresholds
    };
  }

  // 📊 Real-time Metrics Collection
  recordOperation(operationType, duration, success, metadata = {}) {
    const timestamp = Date.now();
    const operation = {
      type: operationType,
      duration,
      success,
      timestamp,
      metadata
    };

    // Add to operation history
    this.operationHistory.push(operation);
    this.cleanupOldData();

    // Update real-time metrics
    this.updateRealtimeMetrics(operation);

    // Check for alerts
    this.checkAlerts(operation);

    // Update performance baselines
    this.updateBaselines(operationType, operation);

    return operation;
  }

  updateRealtimeMetrics(operation) {
    // Update response time
    const recentOps = this.getRecentOperations(60000); // Last minute
    if (recentOps.length > 0) {
      this.realtimeMetrics.avgResponseTime = 
        recentOps.reduce((sum, op) => sum + op.duration, 0) / recentOps.length;
      
      // Calculate error rate
      const errors = recentOps.filter(op => !op.success).length;
      this.realtimeMetrics.errorRate = (errors / recentOps.length) * 100;
      
      // Requests per minute
      this.realtimeMetrics.requestsPerMinute = recentOps.length;
    }

    // Update memory usage
    const memUsage = process.memoryUsage();
    this.realtimeMetrics.memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  }

  recordCacheMetrics(hitRate, size, evictions = 0) {
    this.realtimeMetrics.cacheHitRate = hitRate;
    
    this.recordMetric('cache', {
      hitRate,
      size,
      evictions,
      timestamp: Date.now()
    });
  }

  recordBatchMetrics(batchId, totalItems, processedItems, duration, errors = []) {
    this.recordMetric('batch', {
      batchId,
      totalItems,
      processedItems,
      successRate: ((processedItems - errors.length) / processedItems) * 100,
      duration,
      itemsPerSecond: processedItems / (duration / 1000),
      errors: errors.length,
      timestamp: Date.now()
    });
  }

  recordMetric(category, data) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    
    this.metrics.get(category).push(data);
    
    // Keep metrics size manageable
    const categoryMetrics = this.metrics.get(category);
    if (categoryMetrics.length > 1000) {
      this.metrics.set(category, categoryMetrics.slice(-1000));
    }
  }

  // 🚨 Alert Management
  checkAlerts(operation) {
    const alerts = [];

    // Response time alert
    if (operation.duration > this.config.alertThresholds.responseTime) {
      alerts.push(this.createAlert('SLOW_RESPONSE', 
        `Operation ${operation.type} took ${operation.duration}ms`, 
        'warning', operation));
    }

    // Error rate alert
    if (this.realtimeMetrics.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push(this.createAlert('HIGH_ERROR_RATE', 
        `Error rate is ${this.realtimeMetrics.errorRate.toFixed(2)}%`, 
        'error'));
    }

    // Memory usage alert
    if (this.realtimeMetrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
      alerts.push(this.createAlert('HIGH_MEMORY_USAGE', 
        `Memory usage is ${this.realtimeMetrics.memoryUsage.toFixed(1)}%`, 
        'warning'));
    }

    // Add alerts to queue
    alerts.forEach(alert => this.addAlert(alert));
  }

  createAlert(type, message, severity, data = null) {
    return {
      id: this.generateAlertId(),
      type,
      message,
      severity,
      timestamp: Date.now(),
      data,
      acknowledged: false
    };
  }

  addAlert(alert) {
    // Check if similar alert already exists
    const existing = this.alerts.find(a => 
      a.type === alert.type && 
      !a.acknowledged && 
      Date.now() - a.timestamp < 300000 // 5 minutes
    );

    if (!existing) {
      this.alerts.push(alert);
      this.onAlert(alert);
    }

    // Clean up old alerts
    this.alerts = this.alerts.filter(a => 
      Date.now() - a.timestamp < 3600000 // Keep for 1 hour
    );
  }

  onAlert(alert) {
    // Emit alert (could integrate with external systems)
    process.stderr.write(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}\n`);
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
    }
  }

  // 📈 Performance Analytics
  generatePerformanceReport(timeRange = 3600000) { // Default: 1 hour
    const since = Date.now() - timeRange;
    const operations = this.operationHistory.filter(op => op.timestamp > since);
    
    if (operations.length === 0) {
      return { message: 'No operations found in the specified time range' };
    }

    // Basic statistics
    const successful = operations.filter(op => op.success);
    const failed = operations.filter(op => !op.success);
    const avgDuration = operations.reduce((sum, op) => sum + op.duration, 0) / operations.length;

    // Operation breakdown
    const operationTypes = new Map();
    operations.forEach(op => {
      const current = operationTypes.get(op.type) || { count: 0, totalDuration: 0, errors: 0 };
      current.count++;
      current.totalDuration += op.duration;
      if (!op.success) current.errors++;
      operationTypes.set(op.type, current);
    });

    // Performance trends
    const trends = this.calculateTrends(operations);

    // Resource utilization
    const resourceMetrics = this.getResourceMetrics(timeRange);

    return {
      summary: {
        totalOperations: operations.length,
        successfulOperations: successful.length,
        failedOperations: failed.length,
        successRate: `${(successful.length / operations.length * 100).toFixed(2)}%`,
        averageDuration: `${Math.round(avgDuration)}ms`,
        timeRange: this.formatDuration(timeRange)
      },
      operationBreakdown: Array.from(operationTypes.entries()).map(([type, stats]) => ({
        operation: type,
        count: stats.count,
        averageDuration: `${Math.round(stats.totalDuration / stats.count)}ms`,
        errorRate: `${(stats.errors / stats.count * 100).toFixed(1)}%`,
        totalTime: this.formatDuration(stats.totalDuration)
      })),
      trends,
      resourceMetrics,
      recommendations: this.generateRecommendations(operations, operationTypes)
    };
  }

  calculateTrends(operations) {
    if (operations.length < 10) return { message: 'Insufficient data for trend analysis' };

    // Sort by timestamp
    const sorted = operations.sort((a, b) => a.timestamp - b.timestamp);
    
    // Split into two halves for comparison
    const midPoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midPoint);
    const secondHalf = sorted.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, op) => sum + op.duration, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, op) => sum + op.duration, 0) / secondHalf.length;

    const performanceTrend = secondHalfAvg > firstHalfAvg ? 'deteriorating' : 'improving';
    const changePercent = Math.abs((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100);

    const firstHalfErrors = firstHalf.filter(op => !op.success).length / firstHalf.length;
    const secondHalfErrors = secondHalf.filter(op => !op.success).length / secondHalf.length;
    const errorTrend = secondHalfErrors > firstHalfErrors ? 'increasing' : 'decreasing';

    return {
      performance: {
        trend: performanceTrend,
        change: `${changePercent.toFixed(1)}%`,
        firstPeriodAvg: `${Math.round(firstHalfAvg)}ms`,
        secondPeriodAvg: `${Math.round(secondHalfAvg)}ms`
      },
      errorRate: {
        trend: errorTrend,
        firstPeriod: `${(firstHalfErrors * 100).toFixed(1)}%`,
        secondPeriod: `${(secondHalfErrors * 100).toFixed(1)}%`
      }
    };
  }

  getResourceMetrics(timeRange) {
    const cacheMetrics = this.metrics.get('cache') || [];
    const batchMetrics = this.metrics.get('batch') || [];
    
    const since = Date.now() - timeRange;
    const recentCache = cacheMetrics.filter(m => m.timestamp > since);
    const recentBatches = batchMetrics.filter(m => m.timestamp > since);

    return {
      cache: recentCache.length > 0 ? {
        averageHitRate: `${(recentCache.reduce((sum, m) => sum + m.hitRate, 0) / recentCache.length).toFixed(1)}%`,
        averageSize: Math.round(recentCache.reduce((sum, m) => sum + m.size, 0) / recentCache.length),
        totalEvictions: recentCache.reduce((sum, m) => sum + (m.evictions || 0), 0)
      } : { message: 'No cache metrics available' },
      
      batches: recentBatches.length > 0 ? {
        totalBatches: recentBatches.length,
        averageItemsPerSecond: Math.round(recentBatches.reduce((sum, m) => sum + m.itemsPerSecond, 0) / recentBatches.length),
        averageSuccessRate: `${(recentBatches.reduce((sum, m) => sum + m.successRate, 0) / recentBatches.length).toFixed(1)}%`,
        totalItemsProcessed: recentBatches.reduce((sum, m) => sum + m.processedItems, 0)
      } : { message: 'No batch metrics available' },
      
      memory: {
        current: `${this.realtimeMetrics.memoryUsage.toFixed(1)}%`,
        process: this.formatBytes(process.memoryUsage().heapUsed)
      }
    };
  }

  // 🔮 Predictive Analytics
  startPredictiveAnalysis() {
    if (!this.config.enablePredictiveAnalytics) return;

    setInterval(() => {
      this.updatePredictions();
    }, 300000); // Every 5 minutes
  }

  updatePredictions() {
    // Predict error rate
    this.predictions.set('errorRate', this.predictErrorRate());
    
    // Predict performance degradation
    this.predictions.set('performance', this.predictPerformance());
    
    // Predict resource usage
    this.predictions.set('resources', this.predictResourceUsage());
  }

  predictErrorRate() {
    const recentOps = this.getRecentOperations(3600000); // Last hour
    if (recentOps.length < 20) return { confidence: 'low', message: 'Insufficient data' };

    // Simple trend analysis
    const windows = this.createTimeWindows(recentOps, 6); // 6 windows of 10 minutes each
    const errorRates = windows.map(window => {
      const errors = window.filter(op => !op.success).length;
      return window.length > 0 ? (errors / window.length) * 100 : 0;
    });

    if (errorRates.length < 3) return { confidence: 'low', message: 'Insufficient windows' };

    // Calculate trend
    const trend = this.calculateLinearTrend(errorRates);
    const nextPeriodPrediction = errorRates[errorRates.length - 1] + trend;

    return {
      currentRate: `${errorRates[errorRates.length - 1].toFixed(2)}%`,
      predictedRate: `${Math.max(0, nextPeriodPrediction).toFixed(2)}%`,
      trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
      confidence: errorRates.length >= 5 ? 'high' : 'medium',
      recommendation: nextPeriodPrediction > 3 ? 'Monitor closely, error rate may exceed threshold' : 'Error rate within normal range'
    };
  }

  predictPerformance() {
    const recentOps = this.getRecentOperations(3600000);
    if (recentOps.length < 20) return { confidence: 'low', message: 'Insufficient data' };

    const windows = this.createTimeWindows(recentOps, 6);
    const avgDurations = windows.map(window => {
      return window.length > 0 ? window.reduce((sum, op) => sum + op.duration, 0) / window.length : 0;
    });

    const trend = this.calculateLinearTrend(avgDurations);
    const nextPeriodPrediction = avgDurations[avgDurations.length - 1] + trend;

    return {
      currentAvg: `${Math.round(avgDurations[avgDurations.length - 1])}ms`,
      predictedAvg: `${Math.round(Math.max(0, nextPeriodPrediction))}ms`,
      trend: trend > 50 ? 'deteriorating' : trend < -50 ? 'improving' : 'stable',
      confidence: avgDurations.length >= 5 ? 'high' : 'medium',
      recommendation: nextPeriodPrediction > 8000 ? 'Performance may degrade, consider optimization' : 'Performance within acceptable range'
    };
  }

  predictResourceUsage() {
    const memoryTrend = this.calculateMemoryTrend();
    const cacheMetrics = this.metrics.get('cache') || [];
    const recentCache = cacheMetrics.slice(-10);

    return {
      memory: {
        current: `${this.realtimeMetrics.memoryUsage.toFixed(1)}%`,
        trend: memoryTrend.trend,
        recommendation: memoryTrend.predicted > 90 ? 'Memory usage may become critical' : 'Memory usage stable'
      },
      cache: recentCache.length > 0 ? {
        hitRate: `${(recentCache.reduce((sum, m) => sum + m.hitRate, 0) / recentCache.length).toFixed(1)}%`,
        trend: recentCache.length > 5 ? this.calculateCacheTrend(recentCache) : 'stable',
        recommendation: 'Cache performance within normal range'
      } : { message: 'No cache data available' }
    };
  }

  // 🛠️ Utility Methods
  createTimeWindows(operations, windowCount) {
    const sorted = operations.sort((a, b) => a.timestamp - b.timestamp);
    const windowSize = Math.floor(sorted.length / windowCount);
    const windows = [];

    for (let i = 0; i < windowCount && i * windowSize < sorted.length; i++) {
      const start = i * windowSize;
      const end = Math.min(start + windowSize, sorted.length);
      windows.push(sorted.slice(start, end));
    }

    return windows;
  }

  calculateLinearTrend(values) {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  calculateMemoryTrend() {
    // Simple memory trend based on recent samples
    const samples = 10;
    const currentUsage = this.realtimeMetrics.memoryUsage;
    
    // Mock trend calculation (in real implementation, collect samples over time)
    return {
      trend: 'stable',
      predicted: currentUsage
    };
  }

  calculateCacheTrend(cacheMetrics) {
    const hitRates = cacheMetrics.map(m => m.hitRate);
    const trend = this.calculateLinearTrend(hitRates);
    
    return trend > 1 ? 'improving' : trend < -1 ? 'declining' : 'stable';
  }

  getRecentOperations(timeRange) {
    const since = Date.now() - timeRange;
    return this.operationHistory.filter(op => op.timestamp > since);
  }

  cleanupOldData() {
    const cutoff = Date.now() - this.config.metricsRetention;
    
    // Clean operation history
    this.operationHistory = this.operationHistory.filter(op => op.timestamp > cutoff);
    
    // Clean metrics
    for (const [category, metrics] of this.metrics) {
      this.metrics.set(category, metrics.filter(m => m.timestamp > cutoff));
    }
  }

  generateRecommendations(operations, operationTypes) {
    const recommendations = [];

    // Performance recommendations
    const slowOperations = Array.from(operationTypes.entries())
      .filter(([type, stats]) => stats.totalDuration / stats.count > 5000)
      .map(([type]) => type);

    if (slowOperations.length > 0) {
      recommendations.push({
        type: 'performance',
        severity: 'warning',
        message: `Slow operations detected: ${slowOperations.join(', ')}`,
        suggestion: 'Consider optimizing these operations or reducing batch sizes'
      });
    }

    // Error rate recommendations
    const errorProneOperations = Array.from(operationTypes.entries())
      .filter(([type, stats]) => (stats.errors / stats.count) > 0.05)
      .map(([type]) => type);

    if (errorProneOperations.length > 0) {
      recommendations.push({
        type: 'reliability',
        severity: 'error',
        message: `High error rates in: ${errorProneOperations.join(', ')}`,
        suggestion: 'Review error patterns and implement better error handling'
      });
    }

    // Resource recommendations
    if (this.realtimeMetrics.memoryUsage > 80) {
      recommendations.push({
        type: 'resources',
        severity: 'warning',
        message: 'High memory usage detected',
        suggestion: 'Consider implementing memory optimization or garbage collection tuning'
      });
    }

    return recommendations;
  }

  // 📊 Dashboard Data
  getDashboardData() {
    return {
      realtime: this.realtimeMetrics,
      alerts: this.getActiveAlerts(),
      predictions: Object.fromEntries(this.predictions),
      quickStats: this.getQuickStats(),
      topOperations: this.getTopOperations(),
      recentErrors: this.getRecentErrors()
    };
  }

  getActiveAlerts() {
    return this.alerts
      .filter(alert => !alert.acknowledged)
      .slice(-10)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getQuickStats() {
    const lastHour = this.getRecentOperations(3600000);
    const lastMinute = this.getRecentOperations(60000);

    return {
      operationsLastHour: lastHour.length,
      operationsLastMinute: lastMinute.length,
      currentErrorRate: `${this.realtimeMetrics.errorRate.toFixed(1)}%`,
      averageResponseTime: `${Math.round(this.realtimeMetrics.avgResponseTime)}ms`,
      memoryUsage: `${this.realtimeMetrics.memoryUsage.toFixed(1)}%`,
      cacheHitRate: `${this.realtimeMetrics.cacheHitRate.toFixed(1)}%`
    };
  }

  getTopOperations(limit = 5) {
    const recentOps = this.getRecentOperations(3600000);
    const operationCounts = new Map();

    recentOps.forEach(op => {
      const current = operationCounts.get(op.type) || 0;
      operationCounts.set(op.type, current + 1);
    });

    return Array.from(operationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([operation, count]) => ({ operation, count }));
  }

  getRecentErrors(limit = 5) {
    return this.operationHistory
      .filter(op => !op.success)
      .slice(-limit)
      .reverse()
      .map(op => ({
        operation: op.type,
        timestamp: new Date(op.timestamp).toISOString(),
        duration: `${op.duration}ms`,
        metadata: op.metadata
      }));
  }

  // 📈 Metrics Collection Control
  startMetricsCollection() {
    setInterval(() => {
      this.cleanupOldData();
      this.updateRealtimeMetrics();
    }, this.config.reportingInterval);
  }

  // Utility formatters
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export/Import functionality
  exportMetrics(timeRange = 86400000) {
    const since = Date.now() - timeRange;
    
    return {
      exportTime: new Date().toISOString(),
      timeRange: this.formatDuration(timeRange),
      operations: this.operationHistory.filter(op => op.timestamp > since),
      metrics: Object.fromEntries(
        Array.from(this.metrics.entries()).map(([key, values]) => [
          key, 
          values.filter(v => v.timestamp > since)
        ])
      ),
      alerts: this.alerts.filter(a => a.timestamp > since),
      summary: this.generatePerformanceReport(timeRange)
    };
  }
}

module.exports = { AnalyticsDashboard }; 