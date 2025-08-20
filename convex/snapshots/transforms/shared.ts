import z4 from 'zod/v4'

export const DataPolicy = z4.object({
  termsOfServiceURL: z4.url().optional(),
  privacyPolicyURL: z4.url().optional(),

  training: z4.boolean(),
  retainsPrompts: z4.boolean(),
  canPublish: z4.boolean(),
  requiresUserIDs: z4.boolean().optional(),
  retentionDays: z4.number().optional(),
})
