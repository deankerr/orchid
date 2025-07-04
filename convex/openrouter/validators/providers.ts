import * as R from 'remeda'
import z4 from 'zod/v4'

const paidModelFields = {
  training: z4.boolean(),
  retainsPrompts: z4.boolean().optional(),
  retentionDays: z4.number().optional(),
  canPublish: z4.boolean().optional(),
}

const freeModelFields = {
  training: z4.boolean(),
  retainsPrompts: z4.boolean(),
  retentionDays: z4.number().optional(),
  canPublish: z4.boolean().optional(),
}

const dataPolicyFields = {
  termsOfServiceURL: z4.url().optional(),
  privacyPolicyURL: z4.url().optional(),
  dataPolicyUrl: z4.url().optional(),
  requiresUserIDs: z4.boolean().optional(),
}

const iconFields = {
  url: z4.string(),
  invertRequired: z4.boolean().optional(),
}

const fields = {
  name: z4.string(), // internal identifier
  displayName: z4.string(),
  slug: z4.string(), // primary key
  baseUrl: z4.string(), // always "url" (literal)
  headquarters: z4.string().optional(), // two letter country/state code
  datacenters: z4.string().array().optional(),
  hasChatCompletions: z4.boolean(), // chat endpoint
  hasCompletions: z4.boolean(), // completion endpoint
  isAbortable: z4.boolean(),
  moderationRequired: z4.boolean(),
  editors: z4.string().array(), // always ["{}" (literal)]
  owners: z4.string().array(), // always ["{}" (literal)]
  isMultipartSupported: z4.boolean(), // messages with text/image/file parts
  statusPageUrl: z4.url().nullable(),
  byokEnabled: z4.boolean(),
  ignoredProviderModels: z4.string().array(), // model slug?
  adapterName: z4.string(),
}

export const ProviderStrictSchema = z4.strictObject({
  ...fields,
  icon: z4.strictObject(iconFields),
  dataPolicy: z4.strictObject({
    ...dataPolicyFields,
    paidModels: z4.strictObject(paidModelFields),
    freeModels: z4.strictObject(freeModelFields).optional(),
  }),
})

export const ProviderTransformSchema = z4
  .object({
    ...R.omit(fields, ['name', 'baseUrl', 'editors', 'owners', 'ignoredProviderModels']),
    icon: z4.object(iconFields),
    dataPolicy: z4.object({
      ...dataPolicyFields,
      paidModels: z4.object(paidModelFields),
      freeModels: z4.object(freeModelFields).optional(),
    }),
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((record) => {
    const {
      slug,
      displayName,
      headquarters,
      datacenters,
      hasChatCompletions,
      hasCompletions,
      isAbortable,
      moderationRequired,
      isMultipartSupported,
      statusPageUrl,
      byokEnabled,
      icon,
      dataPolicy,
    } = record

    return {
      slug,
      name: displayName,
      headquarters,
      datacenters,
      icon,
      status_page_url: statusPageUrl,
      moderation_required: moderationRequired,

      capabilities: {
        completions: hasCompletions,
        chat_completions: hasChatCompletions,
        multipart_messages: isMultipartSupported,
        stream_cancellation: isAbortable,
        byok: byokEnabled,
      },

      data_policy: {
        terms_of_service_url: dataPolicy.termsOfServiceURL,
        privacy_policy_url: dataPolicy.privacyPolicyURL,
        data_policy_url: dataPolicy.dataPolicyUrl,
        requires_user_ids: dataPolicy.requiresUserIDs,

        paid_models: {
          training: dataPolicy.paidModels.training,
          retains_prompts: dataPolicy.paidModels.retainsPrompts,
          retention_days: dataPolicy.paidModels.retentionDays,
          can_publish: dataPolicy.paidModels.canPublish,
        },

        free_models: dataPolicy.freeModels
          ? {
              training: dataPolicy.freeModels.training,
              retains_prompts: dataPolicy.freeModels.retainsPrompts,
              retention_days: dataPolicy.freeModels.retentionDays,
              can_publish: dataPolicy.freeModels.canPublish,
            }
          : undefined,
      },
    }
  })
