import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Client } from '../../clients/entities/client.entity'
import { User } from '../../auth/entities/user.entity'

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'client_id' })
  clientId: string

  @Column({ name: 'therapist_id' })
  therapistId: string

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date

  @Column({ name: 'duration_min', default: 50 })
  durationMin: number

  @Column({ type: 'varchar', default: 'scheduled' })
  status: SessionStatus

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'text', nullable: true })
  summary: string | null

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'therapist_id' })
  therapist: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
