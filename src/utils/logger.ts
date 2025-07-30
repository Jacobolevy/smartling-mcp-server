/**
 * Professional logging module with correlation ID support for Smartling MCP Server
 * Based on best practices from @wix/docs-mcp
 */
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

/**
 * Ensure logs directory exists
 */
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Winston logger configuration with structured format
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: { service: 'smartling-mcp-server' },
  transports: [
    // File transports for different log levels
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Console transport only for development (disabled in MCP mode)
    ...(process.env.NODE_ENV === 'development' && process.env.MCP_MODE !== 'true' 
      ? [new winston.transports.Console({
          stderrLevels: ['error', 'warn', 'info', 'debug'],
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })]
      : []
    )
  ]
});

/**
 * Log context with correlation ID and operation details
 */
export interface LogContext {
  correlationId?: string;
  operation?: string;
  toolName?: string;
  projectId?: string;
  fileUri?: string;
  duration?: number;
  requestId?: string;
  userId?: string;
  clientId?: string;
  error?: string;
  stack?: string;
  [key: string]: any;
}

/**
 * Enhanced logger with correlation ID support
 */
export class SmartlingLogger {
  private correlationId: string;
  private additionalContext: LogContext;

  constructor(correlationId?: string, additionalContext?: LogContext) {
    this.correlationId = correlationId || uuidv4();
    this.additionalContext = additionalContext || {};
  }

  private getContext(context?: LogContext): LogContext {
    const base = this.additionalContext || {};
    const provided = context || {};
    return {
      ...base,
      ...provided,
      correlationId: this.correlationId
    };
  }

  info(message: string, context?: LogContext) {
    logger.info(message, this.getContext(context));
  }

  warn(message: string, context?: LogContext) {
    logger.warn(message, this.getContext(context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext: LogContext = {
      ...(context || {}),
      ...(error?.message && { error: error.message }),
      ...(error?.stack && { stack: error.stack })
    };
    logger.error(message, this.getContext(errorContext));
  }

  debug(message: string, context?: LogContext) {
    logger.debug(message, this.getContext(context));
  }

  /**
   * Log API operation start
   */
  apiStart(operation: string, context?: LogContext) {
    this.info(`API operation started: ${operation}`, {
      ...context,
      operation,
      phase: 'start'
    });
  }

  /**
   * Log API operation completion
   */
  apiComplete(operation: string, duration: number, context?: LogContext) {
    this.info(`API operation completed: ${operation}`, {
      ...context,
      operation,
      duration,
      phase: 'complete'
    });
  }

  /**
   * Log API operation error
   */
  apiError(operation: string, error: Error, context?: LogContext) {
    this.error(`API operation failed: ${operation}`, error, {
      ...context,
      operation,
      phase: 'error'
    });
  }

  /**
   * Log tool execution
   */
  toolExecution(toolName: string, args: any, context?: LogContext) {
    this.info(`Tool executed: ${toolName}`, {
      ...context,
      toolName,
      args: JSON.stringify(args),
      operation: 'tool_execution'
    });
  }

  /**
   * Log streaming event
   */
  streamingEvent(event: string, data?: any, context?: LogContext) {
    this.debug(`Streaming event: ${event}`, {
      ...context,
      event,
      data: data ? JSON.stringify(data) : undefined,
      operation: 'streaming'
    });
  }

  /**
   * Log OAuth operation
   */
  oauthOperation(operation: string, context?: LogContext) {
    this.info(`OAuth operation: ${operation}`, {
      ...context,
      operation,
      component: 'oauth'
    });
  }

  getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext?: LogContext): SmartlingLogger {
    return new SmartlingLogger(this.correlationId, {
      ...this.additionalContext,
      ...additionalContext
    });
  }

  /**
   * Create a tool-scoped logger
   */
  forTool(toolName: string): SmartlingLogger {
    return this.child({ toolName, component: 'tool' });
  }

  /**
   * Create a request-scoped logger
   */
  forRequest(requestId: string): SmartlingLogger {
    return this.child({ requestId, component: 'request' });
  }
}

/**
 * Create a new Smartling logger instance
 */
export function createLogger(correlationId?: string, context?: LogContext): SmartlingLogger {
  return new SmartlingLogger(correlationId, context);
}

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Generate a request ID
 */
export function generateRequestId(): string {
  return `req_${uuidv4().substring(0, 8)}`;
}

/**
 * Default logger instance for the server
 */
export const defaultLogger = new SmartlingLogger(undefined, { component: 'server' });

/**
 * Logger for startup/shutdown operations
 */
export const systemLogger = new SmartlingLogger(undefined, { component: 'system' });

/**
 * Performance timing utility
 */
export class PerformanceTimer {
  private startTime: number;
  private logger: SmartlingLogger;
  private operation: string;

  constructor(logger: SmartlingLogger, operation: string) {
    this.logger = logger;
    this.operation = operation;
    this.startTime = Date.now();
    this.logger.apiStart(operation);
  }

  complete(context?: LogContext) {
    const duration = Date.now() - this.startTime;
    this.logger.apiComplete(this.operation, duration, context);
    return duration;
  }

  error(error: Error, context?: LogContext) {
    const duration = Date.now() - this.startTime;
    this.logger.apiError(this.operation, error, { ...context, duration });
    return duration;
  }
}

/**
 * Create a performance timer for an operation
 */
export function createTimer(logger: SmartlingLogger, operation: string): PerformanceTimer {
  return new PerformanceTimer(logger, operation);
}

export default SmartlingLogger; 