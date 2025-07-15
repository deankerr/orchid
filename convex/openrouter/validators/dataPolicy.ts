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

const provider = {
  transform: z4.object({
    ...base,
    paidModels: z4.object(policyFields),
    freeModels: z4.object(policyFields).optional(),
  }),
  strict: z4.strictObject({
    ...base,
    paidModels: z4.strictObject(policyFields),
    freeModels: z4.strictObject(policyFields).optional(),
  }),
}

const endpoint = {
  transform: z4.object({
    ...provider.transform.shape,
    ...policyFields,
    training: z4.boolean().optional(),
  }),
  strict: z4.strictObject({
    ...provider.strict.shape,
    ...policyFields,
    training: z4.boolean().optional(),
  }),
}

export const DataPolicySchemas = { provider, endpoint }
