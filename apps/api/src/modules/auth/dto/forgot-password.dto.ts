import { IsEmail } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import type { ForgotPasswordRequest } from '@psy/contracts'

export class ForgotPasswordDto implements ForgotPasswordRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string
}

