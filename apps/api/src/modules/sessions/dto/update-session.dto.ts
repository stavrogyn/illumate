import { IsDateString, IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateSessionDto {
  @ApiPropertyOptional({ example: '2024-01-15T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number

  @ApiPropertyOptional({ enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

  @ApiPropertyOptional({ example: 'Session notes...' })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({ example: 'Session summary...' })
  @IsOptional()
  @IsString()
  summary?: string
}
