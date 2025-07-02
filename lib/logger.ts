// Enhanced logging service with different log levels and structured logging

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor(minLevel = LogLevel.INFO, isDevelopment = false) {
    this.minLevel = minLevel;
    this.isDevelopment = isDevelopment;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    if (this.isDevelopment) {
      this.logToConsole(entry);
    } else {
      this.logStructured(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] ${LogLevel[entry.level]}:`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context);
        break;
      case LogLevel.INFO:
        console.log(prefix, entry.message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.context, entry.error);
        break;
    }
  }

  private logStructured(entry: LogEntry): void {
    // In production, log as structured JSON for better parsing
    const structuredLog = {
      level: LogLevel[entry.level],
      message: entry.message,
      timestamp: entry.timestamp,
      ...entry.context,
      ...(entry.error && {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        },
      }),
    };

    console.log(JSON.stringify(structuredLog));
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Specific methods for common use cases
  apiRequest(method: string, url: string, duration?: number): void {
    this.info("API Request", { method, url, duration });
  }

  apiError(method: string, url: string, error: Error, statusCode?: number): void {
    this.error("API Error", { method, url, statusCode }, error);
  }

  cacheHit(key: string): void {
    this.debug("Cache Hit", { key });
  }

  cacheMiss(key: string): void {
    this.debug("Cache Miss", { key });
  }

  rateLimitExceeded(service: string, limit: number, current: number): void {
    this.warn("Rate Limit Exceeded", { service, limit, current });
  }
}

// Create singleton instance
export const logger = new Logger(
  process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
  process.env.NODE_ENV === "development"
);

// Error handling utilities
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class RateLimitError extends AppError {
  constructor(service: string, resetTime?: number) {
    super(
      `Rate limit exceeded for ${service}${resetTime ? ` (resets in ${resetTime}ms)` : ''}`,
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }
}

export class APIError extends AppError {
  constructor(service: string, originalError: Error, statusCode = 500) {
    super(
      `${service} API error: ${originalError.message}`,
      'API_ERROR',
      statusCode
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}
