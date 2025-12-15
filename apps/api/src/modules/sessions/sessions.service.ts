import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Session } from './entities/session.entity'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdateSessionDto } from './dto/update-session.dto'
import { ClientsService } from '../clients/clients.service'

interface FindAllOptions {
  clientId?: string
  page?: number
  limit?: number
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly clientsService: ClientsService,
  ) {}

  async create(dto: CreateSessionDto, therapistId: string): Promise<Session> {
    // Verify client belongs to therapist
    await this.clientsService.findOne(dto.clientId, therapistId)

    const session = this.sessionRepository.create({
      ...dto,
      therapistId,
      status: 'scheduled',
    })

    return this.sessionRepository.save(session)
  }

  async findAll(therapistId: string, options: FindAllOptions = {}) {
    const { clientId, page = 1, limit = 20 } = options

    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.client', 'client')
      .where('session.therapistId = :therapistId', { therapistId })
      .orderBy('session.scheduledAt', 'DESC')

    if (clientId) {
      queryBuilder.andWhere('session.clientId = :clientId', { clientId })
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string, therapistId: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id, therapistId },
      relations: ['client'],
    })

    if (!session) {
      throw new NotFoundException('Session not found')
    }

    return session
  }

  async update(id: string, dto: UpdateSessionDto, therapistId: string): Promise<Session> {
    const session = await this.findOne(id, therapistId)
    Object.assign(session, dto)
    return this.sessionRepository.save(session)
  }

  async remove(id: string, therapistId: string): Promise<void> {
    const session = await this.findOne(id, therapistId)
    await this.sessionRepository.remove(session)
  }
}
