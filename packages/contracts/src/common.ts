import * as v from 'valibot'

// Common UUID schema
export const UUIDSchema = v.pipe(v.string(), v.uuid())
export type UUID = v.InferOutput<typeof UUIDSchema>

// Pagination
export const PaginationSchema = v.object({
  page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20),
})
export type Pagination = v.InferOutput<typeof PaginationSchema>

export const PaginatedResponseSchema = <T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
  itemSchema: T
) =>
  v.object({
    items: v.array(itemSchema),
    total: v.number(),
    page: v.number(),
    limit: v.number(),
    totalPages: v.number(),
  })

// API Response wrapper
export const ApiResponseSchema = <T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
  dataSchema: T
) =>
  v.object({
    success: v.boolean(),
    data: v.optional(dataSchema),
    error: v.optional(
      v.object({
        code: v.string(),
        message: v.string(),
      })
    ),
  })

// Timestamps
export const TimestampsSchema = v.object({
  createdAt: v.pipe(v.string(), v.isoDateTime()),
  updatedAt: v.pipe(v.string(), v.isoDateTime()),
})
export type Timestamps = v.InferOutput<typeof TimestampsSchema>
