import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { ClientsModule } from './modules/clients/clients.module'
import { SessionsModule } from './modules/sessions/sessions.module'
import { MailModule } from './modules/mail/mail.module'
import { ObservabilityModule } from '@psy/observability/nestjs'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Observability (logging, metrics, tracing)
    ObservabilityModule.forRootAsync(),

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
  providers: [AppService],
})
export class AppModule {}
