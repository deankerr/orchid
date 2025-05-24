import { z } from 'zod'

// NOTE: May be the same as EndpointDataPolicySchema
const ProviderDataPolicySchema = z
  .object({
    privacyPolicyURL: z.string().url().optional(),
    termsOfServiceURL: z.string().url().optional(),
    dataPolicyUrl: z.string().url().optional(),
    paidModels: z
      .object({
        training: z.boolean(),
        retainsPrompts: z.boolean().optional(),
        retentionDays: z.number().optional(),
      })
      .strict(),
    freeModels: z
      .object({
        training: z.boolean(),
        retainsPrompts: z.boolean(),
        retentionDays: z.number().optional(),
      })
      .strict()
      .optional(),
    requiresUserIDs: z.boolean().optional(),
  })
  .strict()

export const ProviderSchema = z
  .object({
    name: z.string(),
    displayName: z.string(),
    slug: z.string(),
    baseUrl: z.string(),
    dataPolicy: ProviderDataPolicySchema,
    headquarters: z.string().optional(),
    hasChatCompletions: z.boolean(),
    hasCompletions: z.boolean(),
    isAbortable: z.boolean(),
    moderationRequired: z.boolean(),
    editors: z.array(z.unknown()),
    owners: z.array(z.unknown()),
    isMultipartSupported: z.boolean(),
    statusPageUrl: z.string().url().nullable(),
    byokEnabled: z.boolean(),
    icon: z
      .object({
        url: z.string(),
        invertRequired: z.boolean().optional(),
      })
      .strict(),
  })
  .strict()
