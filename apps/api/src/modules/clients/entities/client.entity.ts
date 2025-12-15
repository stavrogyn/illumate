import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from '../../auth/entities/user.entity'

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'therapist_id' })
  therapistId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'therapist_id' })
  therapist: User

  @Column({ name: 'full_name' })
  fullName: string

  @Column({ type: 'timestamp', nullable: true })
  birthday: Date | null

  @Column({ type: 'simple-array', default: '' })
  tags: string[]

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
