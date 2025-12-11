type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  context?: Record<string, unknown>
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  private formatLog(entry: LogEntry): void {
    const { level, message, timestamp, requestId, context } = entry
    const prefix = `[${timestamp}]${requestId ? ` [${requestId}]` : ''} [${level.toUpperCase()}]`

    const logFn = level === 'error' ? console.error : console[level]

    if (context && Object.keys(context).length > 0) {
      logFn(prefix, message, context)
    } else {
      logFn(prefix, message)
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.isDevelopment && level === 'debug') {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    this.formatLog(entry)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context)
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  logRequest(requestId: string, method: string, url: string): void {
    this.info(`API Request: ${method.toUpperCase()} ${url}`, { requestId })
  }

  logResponse(
    requestId: string,
    method: string,
    url: string,
    status: number,
    duration: number
  ): void {
    this.info(`API Response: ${method.toUpperCase()} ${url} - ${status}`, {
      requestId,
      duration: `${duration}ms`,
    })
  }

  logError(
    requestId: string,
    method: string,
    url: string,
    error: Error | unknown
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    this.error(`API Error: ${method.toUpperCase()} ${url}`, {
      requestId,
      error: errorMessage,
    })
  }
}

export const logger = new Logger()
