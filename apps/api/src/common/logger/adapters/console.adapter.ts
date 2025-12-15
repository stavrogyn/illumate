import { Injectable } from '@nestjs/common'
import { LoggerAdapter, LogContext } from './logger-adapter.interface'

@Injectable()
export class ConsoleLoggerAdapter implements LoggerAdapter {
  private readonly colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
    cyan: '\x1b[36m',
  }

  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return ''
    }

    const parts: string[] = []

    if (context.requestId) {
      parts.push(`[${context.requestId}]`)
    }

    if (context.method && context.path) {
      parts.push(`${context.method} ${context.path}`)
    }

    if (context.statusCode) {
      parts.push(`→ ${context.statusCode}`)
    }

    if (context.duration !== undefined) {
      parts.push(`(${context.duration}ms)`)
    }

    if (context.userId) {
      parts.push(`user:${context.userId}`)
    }

    // Add any additional context
    const additionalKeys = Object.keys(context).filter(
      (key) =>
        !['requestId', 'method', 'path', 'statusCode', 'duration', 'userId', 'userAgent', 'ip'].includes(key),
    )

    if (additionalKeys.length > 0) {
      const additional = additionalKeys.reduce(
        (acc, key) => {
          acc[key] = context[key]
          return acc
        },
        {} as Record<string, unknown>,
      )
      parts.push(JSON.stringify(additional))
    }

    return parts.length > 0 ? ` ${parts.join(' ')}` : ''
  }

  private getTimestamp(): string {
    return new Date().toISOString()
  }

  info(message: string, context?: LogContext): void {
    const { blue, reset, gray } = this.colors
    console.log(
      `${gray}${this.getTimestamp()}${reset} ${blue}[INFO]${reset} ${message}${this.formatContext(context)}`,
    )
  }

  warn(message: string, context?: LogContext): void {
    const { yellow, reset, gray } = this.colors
    console.warn(
      `${gray}${this.getTimestamp()}${reset} ${yellow}[WARN]${reset} ${message}${this.formatContext(context)}`,
    )
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const { red, reset, gray } = this.colors
    console.error(
      `${gray}${this.getTimestamp()}${reset} ${red}[ERROR]${reset} ${message}${this.formatContext(context)}`,
    )

    if (error) {
      console.error(`${red}Stack:${reset}`, error.stack || error.message)
    }
  }

  debug(message: string, context?: LogContext): void {
    const { cyan, reset, gray } = this.colors
    console.debug(
      `${gray}${this.getTimestamp()}${reset} ${cyan}[DEBUG]${reset} ${message}${this.formatContext(context)}`,
    )
  }
}

