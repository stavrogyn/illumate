import { IsUUID, IsDateString, IsOptional, IsInt, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateSessionDto {
  @ApiProperty({ example: 'uuid-of-client' })
  @IsUUID()
  clientId: string

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @IsDateString()
  scheduledAt: string

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number
}
