import * as v from 'valibot'
import { UUIDSchema, TimestampsSchema } from './common'

// User roles
export const UserRoleSchema = v.picklist(['therapist', 'admin', 'patient'])
export type UserRole = v.InferOutput<typeof UserRoleSchema>

// Locales
export const LocaleSchema = v.picklist(['en', 'ru'])
export type Locale = v.InferOutput<typeof LocaleSchema>

// Register
export const RegisterRequestSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  firstName: v.pipe(v.string(), v.minLength(1)),
  lastName: v.pipe(v.string(), v.minLength(1)),
  role: v.optional(UserRoleSchema, 'therapist'),
  locale: v.optional(LocaleSchema, 'ru'),
})
export type RegisterRequest = v.InferOutput<typeof RegisterRequestSchema>

export const RegisterResponseSchema = v.object({
  user: v.object({
    id: UUIDSchema,
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: UserRoleSchema,
    emailVerified: v.boolean(),
  }),
  message: v.string(),
})
export type RegisterResponse = v.InferOutput<typeof RegisterResponseSchema>

// Login
export const LoginRequestSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.string(),
})
export type LoginRequest = v.InferOutput<typeof LoginRequestSchema>

export const LoginResponseSchema = v.object({
  accessToken: v.string(),
  user: v.object({
    id: UUIDSchema,
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: UserRoleSchema,
  }),
})
export type LoginResponse = v.InferOutput<typeof LoginResponseSchema>

// User entity
export const UserSchema = v.object({
  id: UUIDSchema,
  email: v.pipe(v.string(), v.email()),
  firstName: v.string(),
  lastName: v.string(),
  role: UserRoleSchema,
  locale: LocaleSchema,
  emailVerified: v.boolean(),
  ...TimestampsSchema.entries,
})
export type User = v.InferOutput<typeof UserSchema>

// Verify email
export const VerifyEmailRequestSchema = v.object({
  token: v.string(),
})
export type VerifyEmailRequest = v.InferOutput<typeof VerifyEmailRequestSchema>

// Forgot password - request reset link
export const ForgotPasswordRequestSchema = v.object({
  email: v.pipe(v.string(), v.email()),
})
export type ForgotPasswordRequest = v.InferOutput<typeof ForgotPasswordRequestSchema>

export const ForgotPasswordResponseSchema = v.object({
  message: v.string(),
})
export type ForgotPasswordResponse = v.InferOutput<typeof ForgotPasswordResponseSchema>

// Reset password - set new password with token
export const ResetPasswordRequestSchema = v.object({
  token: v.string(),
  password: v.pipe(v.string(), v.minLength(8)),
})
export type ResetPasswordRequest = v.InferOutput<typeof ResetPasswordRequestSchema>

export const ResetPasswordResponseSchema = v.object({
  message: v.string(),
})
export type ResetPasswordResponse = v.InferOutput<typeof ResetPasswordResponseSchema>

// Logout
export const LogoutResponseSchema = v.object({
  message: v.string(),
})
export type LogoutResponse = v.InferOutput<typeof LogoutResponseSchema>
