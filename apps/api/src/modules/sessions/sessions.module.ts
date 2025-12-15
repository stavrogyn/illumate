import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SessionsController } from './sessions.controller'
import { SessionsService } from './sessions.service'
import { Session } from './entities/session.entity'
import { AuthModule } from '../auth/auth.module'
import { ClientsModule } from '../clients/clients.module'

@Module({
  imports: [TypeOrmModule.forFeature([Session]), AuthModule, ClientsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
