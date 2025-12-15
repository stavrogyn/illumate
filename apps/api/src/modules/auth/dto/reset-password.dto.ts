import { IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import type { ResetPasswordRequest } from '@psy/contracts'

export class ResetPasswordDto implements ResetPasswordRequest {
  @ApiProperty({ example: 'abc123token' })
  @IsString()
  token: string

  @ApiProperty({ example: 'newSecurePassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string
}

