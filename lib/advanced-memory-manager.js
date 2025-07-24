// 🧠 ADVANCED MEMORY MANAGER
// Prevents memory leaks, optimizes garbage collection, manages memory pools
// Performance Impact: Prevents memory bloat, improved stability

class AdvancedMemoryManager {
  constructor(options = {}) {
    this.options = {
      memoryLimit: this.parseMemoryLimit(options.memoryLimit || process.env.NODE_MAX_MEMORY || '1024mb'),
      gcInterval: options.gcInterval || 30000, // 30 seconds
      warningThreshold: options.warningThreshold || 0.8, // 80%
      emergencyThreshold: options.emergencyThreshold || 0.95, // 95%
      enableMetrics: options.enableMetrics !== false,
      enableAggressive: options.enableAggressive || false,
      ...options
    };
    
    this.pools = new Map(); // Memory pools for different object types
    this.memoryStats = {
      peak: 0,
      average: 0,
      gcCount: 0,
      leakWarnings: 0,
      emergencyCleanups: 0
    };
    
    this.samples = []; // Memory usage samples for analysis
    this.maxSamples = 100;
    
    // Start monitoring
    this.startMonitoring();
    
    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  parseMemoryLimit(limit) {
    if (typeof limit === 'number') return limit;
    
    const units = {
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };
    
    const match = limit.toString().toLowerCase().match(/^(\d+)([kmg]b?)$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      return value * (units[unit] || 1);
    }
    
    return 1024 * 1024 * 1024; // Default 1GB
  }

  startMonitoring() {
    // Regular memory monitoring
    this.gcInterval = setInterval(() => {
      this.performSmartGC();
    }, this.options.gcInterval);
    
    // More frequent sampling for analysis
    this.sampleInterval = setInterval(() => {
      this.collectMemorySample();
    }, 5000); // Every 5 seconds
    
    if (this.options.enableMetrics) {
      console.log(`🧠 Memory Manager started - Limit: ${this.formatBytes(this.options.memoryLimit)}`);
    }
  }

  collectMemorySample() {
    const usage = process.memoryUsage();
    const timestamp = Date.now();
    
    // Add sample
    this.samples.push({
      timestamp,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    });
    
    // Maintain sample window
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    // Update stats
    this.memoryStats.peak = Math.max(this.memoryStats.peak, usage.heapUsed);
    this.updateAverage(usage.heapUsed);
  }

  updateAverage(currentUsage) {
    if (this.memoryStats.average === 0) {
      this.memoryStats.average = currentUsage;
    } else {
      // Exponential moving average
      this.memoryStats.average = (this.memoryStats.average * 0.9) + (currentUsage * 0.1);
    }
  }

  performSmartGC() {
    const usage = process.memoryUsage();
    const currentRatio = usage.heapUsed / this.options.memoryLimit;
    
    // Check thresholds
    if (currentRatio > this.options.emergencyThreshold) {
      this.performEmergencyCleanup();
    } else if (currentRatio > this.options.warningThreshold) {
      this.performPreventativeGC();
    }
    
    // Analyze memory trends
    this.analyzeMemoryTrends();
  }

  performEmergencyCleanup() {
    if (this.options.enableMetrics) {
      console.log('🚨 Emergency memory cleanup triggered!');
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Clear all memory pools
    this.clearAllPools();
    
    // Clear internal caches
    this.clearInternalCaches();
    
    // Force process to yield
    setImmediate(() => {
      if (global.gc) global.gc();
    });
    
    this.memoryStats.emergencyCleanups++;
    
    // Check if we're still in danger
    setTimeout(() => {
      const newUsage = process.memoryUsage();
      const newRatio = newUsage.heapUsed / this.options.memoryLimit;
      
      if (newRatio > this.options.emergencyThreshold) {
        console.error('⚠️ Memory usage still critical after emergency cleanup!');
        this.memoryStats.leakWarnings++;
      }
    }, 1000);
  }

  performPreventativeGC() {
    if (this.options.enableMetrics) {
      console.log('🧹 Preventative GC triggered');
    }
    
    // Gentle cleanup
    this.cleanupExpiredPools();
    
    // Suggest GC
    if (global.gc) {
      global.gc();
    }
    
    this.memoryStats.gcCount++;
  }

  analyzeMemoryTrends() {
    if (this.samples.length < 10) return;
    
    // Get recent samples (last 10)
    const recent = this.samples.slice(-10);
    const trend = this.calculateTrend(recent.map(s => s.heapUsed));
    
    // Detect memory leaks (consistently increasing memory)
    if (trend > 0.1 && recent[recent.length - 1].heapUsed > this.memoryStats.average * 1.5) {
      this.handlePotentialLeak();
    }
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope / 1024 / 1024; // Convert to MB/sample
  }

  handlePotentialLeak() {
    this.memoryStats.leakWarnings++;
    
    if (this.options.enableMetrics) {
      console.warn('⚠️ Potential memory leak detected - increasing trend');
    }
    
    // More aggressive cleanup
    if (this.options.enableAggressive) {
      this.performEmergencyCleanup();
    }
  }

  // Memory Pool Management
  createPool(name, factory, options = {}) {
    const pool = {
      name,
      factory,
      items: [],
      maxSize: options.maxSize || 100,
      currentSize: 0,
      allocated: 0,
      deallocated: 0,
      created: Date.now()
    };
    
    this.pools.set(name, pool);
    return pool;
  }

  getFromPool(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) return null;
    
    if (pool.items.length > 0) {
      pool.allocated++;
      return pool.items.pop();
    }
    
    // Create new if under limit
    if (pool.currentSize < pool.maxSize) {
      pool.currentSize++;
      pool.allocated++;
      return pool.factory();
    }
    
    return null; // Pool exhausted
  }

  returnToPool(poolName, item) {
    const pool = this.pools.get(poolName);
    if (!pool) return;
    
    // Reset/clean the item if reset function provided
    if (pool.reset && typeof pool.reset === 'function') {
      pool.reset(item);
    }
    
    pool.items.push(item);
    pool.deallocated++;
  }

  clearAllPools() {
    for (const [name, pool] of this.pools) {
      pool.items = [];
      pool.currentSize = 0;
    }
    
    if (this.options.enableMetrics) {
      console.log('🧹 Cleared all memory pools');
    }
  }

  cleanupExpiredPools() {
    const now = Date.now();
    const expireTime = 5 * 60 * 1000; // 5 minutes
    
    for (const [name, pool] of this.pools) {
      // Clean pools that haven't been used recently
      if (now - pool.created > expireTime && pool.items.length > 0) {
        const halfSize = Math.floor(pool.items.length / 2);
        pool.items = pool.items.slice(0, halfSize);
        pool.currentSize = pool.items.length;
      }
    }
  }

  clearInternalCaches() {
    // Clear require cache for non-core modules (be careful!)
    const moduleKeys = Object.keys(require.cache);
    const coreModules = ['fs', 'path', 'crypto', 'events', 'stream'];
    
    for (const key of moduleKeys) {
      const isCore = coreModules.some(core => key.includes(core));
      const isNodeModules = key.includes('node_modules');
      
      // Only clear non-core, non-node_modules caches
      if (!isCore && !isNodeModules && key.includes('cache')) {
        delete require.cache[key];
      }
    }
  }

  // Metrics and reporting
  getMemoryReport() {
    const usage = process.memoryUsage();
    const ratio = usage.heapUsed / this.options.memoryLimit;
    
    return {
      current: {
        heapUsed: this.formatBytes(usage.heapUsed),
        heapTotal: this.formatBytes(usage.heapTotal),
        external: this.formatBytes(usage.external),
        rss: this.formatBytes(usage.rss)
      },
      limits: {
        memoryLimit: this.formatBytes(this.options.memoryLimit),
        currentRatio: (ratio * 100).toFixed(2) + '%',
        warningThreshold: (this.options.warningThreshold * 100) + '%',
        emergencyThreshold: (this.options.emergencyThreshold * 100) + '%'
      },
      stats: {
        ...this.memoryStats,
        peak: this.formatBytes(this.memoryStats.peak),
        average: this.formatBytes(this.memoryStats.average)
      },
      pools: this.getPoolStats(),
      status: this.getMemoryStatus(ratio)
    };
  }

  getPoolStats() {
    const stats = {};
    for (const [name, pool] of this.pools) {
      stats[name] = {
        currentSize: pool.currentSize,
        maxSize: pool.maxSize,
        available: pool.items.length,
        allocated: pool.allocated,
        deallocated: pool.deallocated,
        utilization: pool.maxSize > 0 ? (pool.currentSize / pool.maxSize * 100).toFixed(1) + '%' : '0%'
      };
    }
    return stats;
  }

  getMemoryStatus(ratio) {
    if (ratio > this.options.emergencyThreshold) return 'CRITICAL';
    if (ratio > this.options.warningThreshold) return 'WARNING';
    return 'HEALTHY';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  shutdown() {
    if (this.gcInterval) clearInterval(this.gcInterval);
    if (this.sampleInterval) clearInterval(this.sampleInterval);
    
    this.clearAllPools();
    
    if (this.options.enableMetrics) {
      console.log('🧠 Memory Manager shutdown completed');
    }
  }
}

module.exports = { AdvancedMemoryManager }; 