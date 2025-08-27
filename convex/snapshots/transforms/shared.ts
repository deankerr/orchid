import { z } from 'zod'

export const DataPolicy = z.object({
  termsOfServiceURL: z.url().optional(),
  privacyPolicyURL: z.url().optional(),

  training: z.boolean(),
  retainsPrompts: z.boolean(),
  canPublish: z.boolean(),
  requiresUserIDs: z.boolean().optional(),
  retentionDays: z.number().optional(),
})
