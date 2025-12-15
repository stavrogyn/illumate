import { IsString, MinLength, IsOptional, IsArray, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateClientDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  fullName: string

  @ApiPropertyOptional({ example: '1990-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  birthday?: string

  @ApiPropertyOptional({ example: ['anxiety', 'depression'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({ example: 'Initial consultation notes' })
  @IsOptional()
  @IsString()
  notes?: string
}
