import z4 from 'zod/v4'

const policyFields = {
  training: z4.boolean(),
  retainsPrompts: z4.boolean().optional(),
  retentionDays: z4.number().optional(),
  canPublish: z4.boolean().optional(),
}

const base = {
  termsOfServiceURL: z4.url().optional(),
  privacyPolicyURL: z4.url().optional(),
  dataPolicyUrl: z4.url().optional(),
  requiresUserIDs: z4.boolean().optional(),
}

export const DataPolicySchemas = {
  provider: {
    transform: z4.object({
      ...base,
      paidModels: z4.object(policyFields),
      freeModels: z4.object(policyFields).optional(),
    }),
  },
  endpoint: {
    transform: z4.object({
      ...base,
      ...policyFields,
      training: z4.boolean(),
    }),
  },
}