import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { randomBytes } from 'crypto'
import * as bcrypt from 'bcrypt'
import { User } from './entities/user.entity'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { MailService } from '../mail/mail.service'
import type { RegisterResponse, LoginResponse, ForgotPasswordResponse, ResetPasswordResponse, LogoutResponse } from '@psy/contracts'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex')
  }

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12)

    // Generate verification token
    const verificationToken = this.generateVerificationToken()

    // Create user
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role || 'therapist',
      locale: dto.locale || 'ru',
      emailVerified: false,
      verificationToken,
    })
    await this.userRepository.save(user)

    // Send verification email
    await this.mailService.sendVerificationEmail(user.email, verificationToken)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      message: 'Registration successful. Please verify your email.',
    }
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    })

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token')
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' }
    }

    user.emailVerified = true
    user.verificationToken = null
    await this.userRepository.save(user)

    // Send welcome email
    await this.mailService.sendWelcomeEmail(user.email)

    return { message: 'Email verified successfully' }
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified')
    }

    // Generate new token
    const verificationToken = this.generateVerificationToken()
    user.verificationToken = verificationToken
    await this.userRepository.save(user)

    // Send verification email
    await this.mailService.sendVerificationEmail(user.email, verificationToken)

    return { message: 'Verification email sent' }
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  }

  async logout(): Promise<LogoutResponse> {
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    return { message: 'Logged out successfully' }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      locale: user.locale,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    }
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    })
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const user = await this.userRepository.findOne({
      where: { email },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If this email exists, a password reset link has been sent.' }
    }

    // Generate reset token
    const resetToken = this.generateVerificationToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetExpires
    await this.userRepository.save(user)

    // Send password reset email
    await this.mailService.sendPasswordResetEmail(user.email, resetToken)

    return { message: 'If this email exists, a password reset link has been sent.' }
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    })

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Reset token has expired')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    user.password = hashedPassword
    user.resetPasswordToken = null
    user.resetPasswordExpires = null
    await this.userRepository.save(user)

    return { message: 'Password has been reset successfully' }
  }

  async checkResetPasswordToken(token: string, email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email },
    })

    if (!user) {
      return false
    }

    // Check if token matches and is not expired
    if (user.resetPasswordToken !== token) {
      return false
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return false
    }

    return true
  }
}
