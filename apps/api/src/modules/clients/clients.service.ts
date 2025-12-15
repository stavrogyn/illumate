import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Client } from './entities/client.entity'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'

interface FindAllOptions {
  page?: number
  limit?: number
  search?: string
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(dto: CreateClientDto, therapistId: string): Promise<Client> {
    const client = this.clientRepository.create({
      ...dto,
      therapistId,
    })
    return this.clientRepository.save(client)
  }

  async findAll(therapistId: string, options: FindAllOptions = {}) {
    const { page = 1, limit = 20, search } = options

    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .where('client.therapistId = :therapistId', { therapistId })
      .orderBy('client.createdAt', 'DESC')

    if (search) {
      queryBuilder.andWhere('client.fullName ILIKE :search', {
        search: `%${search}%`,
      })
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

  async findOne(id: string, therapistId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, therapistId },
    })

    if (!client) {
      throw new NotFoundException('Client not found')
    }

    return client
  }

  async update(id: string, dto: UpdateClientDto, therapistId: string): Promise<Client> {
    const client = await this.findOne(id, therapistId)
    Object.assign(client, dto)
    return this.clientRepository.save(client)
  }

  async remove(id: string, therapistId: string): Promise<void> {
    const client = await this.findOne(id, therapistId)
    await this.clientRepository.remove(client)
  }
}
