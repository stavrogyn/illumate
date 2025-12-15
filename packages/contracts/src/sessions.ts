import * as v from 'valibot'
import { UUIDSchema, TimestampsSchema } from './common'

// Session status
export const SessionStatusSchema = v.picklist([
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
])
export type SessionStatus = v.InferOutput<typeof SessionStatusSchema>

// Session entity
export const SessionSchema = v.object({
  id: UUIDSchema,
  clientId: UUIDSchema,
  therapistId: UUIDSchema,
  scheduledAt: v.pipe(v.string(), v.isoDateTime()),
  durationMin: v.pipe(v.number(), v.integer(), v.minValue(1)),
  status: SessionStatusSchema,
  notes: v.optional(v.nullable(v.string())),
  summary: v.optional(v.nullable(v.string())),
  ...TimestampsSchema.entries,
})
export type Session = v.InferOutput<typeof SessionSchema>

// Create session
export const CreateSessionRequestSchema = v.object({
  clientId: UUIDSchema,
  scheduledAt: v.pipe(v.string(), v.isoDateTime()),
  durationMin: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 50),
})
export type CreateSessionRequest = v.InferOutput<typeof CreateSessionRequestSchema>

// Update session
export const UpdateSessionRequestSchema = v.partial(
  v.object({
    scheduledAt: v.pipe(v.string(), v.isoDateTime()),
    durationMin: v.pipe(v.number(), v.integer(), v.minValue(1)),
    status: SessionStatusSchema,
    notes: v.nullable(v.string()),
    summary: v.nullable(v.string()),
  })
)
export type UpdateSessionRequest = v.InferOutput<typeof UpdateSessionRequestSchema>

// Session with client info (for lists)
export const SessionWithClientSchema = v.object({
  ...SessionSchema.entries,
  client: v.object({
    id: UUIDSchema,
    fullName: v.string(),
  }),
})
export type SessionWithClient = v.InferOutput<typeof SessionWithClientSchema>

// AI Analysis
export const SessionAnalysisSchema = v.object({
  sessionId: UUIDSchema,
  emotionalState: v.optional(v.nullable(v.string())),
  riskFactors: v.optional(v.array(v.string()), []),
  recommendations: v.optional(v.array(v.string()), []),
  summary: v.optional(v.nullable(v.string())),
  analyzedAt: v.pipe(v.string(), v.isoDateTime()),
})
export type SessionAnalysis = v.InferOutput<typeof SessionAnalysisSchema>

export const AnalyzeSessionRequestSchema = v.object({
  clientId: UUIDSchema,
  text: v.string(),
  sessionNotes: v.optional(v.nullable(v.string())),
  therapistObservations: v.optional(v.nullable(v.string())),
})
export type AnalyzeSessionRequest = v.InferOutput<typeof AnalyzeSessionRequestSchema>
