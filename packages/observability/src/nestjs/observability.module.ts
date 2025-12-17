import { Global, Module, DynamicModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { LoggerService, LOGGER_TOKEN } from './logger.service'
import { LoggingInterceptor } from './logging.interceptor'
import { AllExceptionsFilter } from './all-exceptions.filter'
import { MetricsController } from './metrics.controller'
import { initMetrics } from '../metrics'
import { initSentry, SentryConfig } from '../sentry'
import { CreateLoggerOptions } from '../logger'

export interface ObservabilityModuleConfig {
  /** Logger configuration */
  logger?: CreateLoggerOptions
  /** Enable metrics endpoint at /metrics */
  metrics?: boolean
  /** Sentry configuration (if provided, Sentry will be initialized) */
  sentry?: Partial<SentryConfig>
  /** Register global interceptor */
  globalInterceptor?: boolean
  /** Register global exception filter */
  globalExceptionFilter?: boolean
}

@Global()
@Module({})
export class ObservabilityModule {
  /**
   * Register observability module with static configuration
   */
  static forRoot(config: ObservabilityModuleConfig = {}): DynamicModule {
    // Initialize metrics if enabled
    if (config.metrics !== false) {
      initMetrics()
    }

    const providers: DynamicModule['providers'] = [
      {
        provide: LOGGER_TOKEN,
        useFactory: () => new LoggerService(config.logger),
      },
    ]

    // Add global interceptor
    if (config.globalInterceptor !== false) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: LoggingInterceptor,
      })
    }

    // Add global exception filter
    if (config.globalExceptionFilter !== false) {
      providers.push({
        provide: APP_FILTER,
        useClass: AllExceptionsFilter,
      })
    }

    const controllers: DynamicModule['controllers'] = []
    if (config.metrics !== false) {
      controllers.push(MetricsController)
    }

    return {
      module: ObservabilityModule,
      providers,
      controllers,
      exports: [LOGGER_TOKEN],
    }
  }

  /**
   * Register observability module with async configuration from ConfigService
   */
  static forRootAsync(): DynamicModule {
    const providers: DynamicModule['providers'] = [
      {
        provide: LOGGER_TOKEN,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const nodeEnv = configService.get<string>('NODE_ENV', 'development')
          
          // Initialize Sentry if DSN is provided
          const sentryDsn = configService.get<string>('SENTRY_DSN')
          if (sentryDsn) {
            initSentry({
              dsn: sentryDsn,
              environment: nodeEnv,
            })
          }

          // Initialize metrics
          initMetrics({
            collectDefaultMetrics: true,
          })

          return new LoggerService({
            level: nodeEnv === 'production' ? 'info' : 'debug',
            pretty: nodeEnv === 'development',
          })
        },
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: LoggingInterceptor,
      },
      {
        provide: APP_FILTER,
        useClass: AllExceptionsFilter,
      },
    ]

    return {
      module: ObservabilityModule,
      providers,
      controllers: [MetricsController],
      exports: [LOGGER_TOKEN],
    }
  }
}

