import * as v from 'valibot'
import { UUIDSchema, TimestampsSchema } from './common'

// Client entity
export const ClientSchema = v.object({
  id: UUIDSchema,
  therapistId: UUIDSchema,
  fullName: v.pipe(v.string(), v.minLength(1)),
  birthday: v.optional(v.nullable(v.pipe(v.string(), v.isoDateTime()))),
  tags: v.optional(v.array(v.string()), []),
  notes: v.optional(v.nullable(v.string())),
  ...TimestampsSchema.entries,
})
export type Client = v.InferOutput<typeof ClientSchema>

// Create client
export const CreateClientRequestSchema = v.object({
  fullName: v.pipe(v.string(), v.minLength(1)),
  birthday: v.optional(v.nullable(v.pipe(v.string(), v.isoDateTime()))),
  tags: v.optional(v.array(v.string()), []),
  notes: v.optional(v.nullable(v.string())),
})
export type CreateClientRequest = v.InferOutput<typeof CreateClientRequestSchema>

// Update client
export const UpdateClientRequestSchema = v.partial(CreateClientRequestSchema)
export type UpdateClientRequest = v.InferOutput<typeof UpdateClientRequestSchema>

// Client list item (lighter version for lists)
export const ClientListItemSchema = v.object({
  id: UUIDSchema,
  fullName: v.string(),
  tags: v.array(v.string()),
  lastSessionAt: v.optional(v.nullable(v.pipe(v.string(), v.isoDateTime()))),
  sessionsCount: v.optional(v.number(), 0),
})
export type ClientListItem = v.InferOutput<typeof ClientListItemSchema>
