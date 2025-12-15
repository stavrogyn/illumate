import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { ClientsModule } from './modules/clients/clients.module'
import { SessionsModule } from './modules/sessions/sessions.module'
import { MailModule } from './modules/mail/mail.module'
import { LoggerModule, AllExceptionsFilter, LoggingInterceptor } from './common'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Logging (auto-selects adapter based on environment)
    LoggerModule.forRootAsync(),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Use migrations instead of synchronize in all environments
        synchronize: false,
        migrationsRun: true,
        migrationsTableName: 'migrations',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // Infrastructure modules
    MailModule,

    // Feature modules
    AuthModule,
    ClientsModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global exception filter - logs all unhandled exceptions
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global logging interceptor - logs all requests
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
