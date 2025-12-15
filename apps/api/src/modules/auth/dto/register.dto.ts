import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { RegisterRequest, UserRole, Locale } from '@psy/contracts'

export class RegisterDto implements RegisterRequest {
  @ApiProperty({ example: 'therapist@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'securePassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  firstName: string

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName: string

  @ApiPropertyOptional({ enum: ['therapist', 'admin', 'patient'], default: 'therapist' })
  @IsOptional()
  @IsIn(['therapist', 'admin', 'patient'])
  role: UserRole

  @ApiPropertyOptional({ enum: ['en', 'ru'], default: 'ru' })
  @IsOptional()
  @IsIn(['en', 'ru'])
  locale: Locale
}
