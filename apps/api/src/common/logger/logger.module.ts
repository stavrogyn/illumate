import { Global, Module, DynamicModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerService } from './logger.service'
import { LOGGER_ADAPTER } from './adapters/logger-adapter.interface'
import { ConsoleLoggerAdapter } from './adapters/console.adapter'
import { SentryLoggerAdapter } from './adapters/sentry.adapter'

export type LoggerAdapterType = 'console' | 'sentry'

export interface LoggerModuleOptions {
  adapter?: LoggerAdapterType
}

@Global()
@Module({})
export class LoggerModule {
  /**
   * Register the logger module with a specific adapter
   */
  static forRoot(options?: LoggerModuleOptions): DynamicModule {
    const adapterType = options?.adapter || 'console'

    return {
      module: LoggerModule,
      providers: [
        {
          provide: LOGGER_ADAPTER,
          useClass: adapterType === 'sentry' ? SentryLoggerAdapter : ConsoleLoggerAdapter,
        },
        LoggerService,
      ],
      exports: [LoggerService],
    }
  }

  /**
   * Register the logger module with environment-based adapter selection
   * Uses Sentry in production, Console in development
   */
  static forRootAsync(): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: LOGGER_ADAPTER,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const nodeEnv = configService.get<string>('NODE_ENV', 'development')
            const useSentry = configService.get<boolean>('USE_SENTRY', false)

            // Use Sentry only in production when explicitly enabled
            if (nodeEnv === 'production' && useSentry) {
              return new SentryLoggerAdapter()
            }

            return new ConsoleLoggerAdapter()
          },
        },
        LoggerService,
      ],
      exports: [LoggerService],
    }
  }
}

