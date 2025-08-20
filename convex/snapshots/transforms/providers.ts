import * as R from 'remeda'
import z4 from 'zod/v4'

import { DataPolicy } from './shared'

export const providers = z4
  .object({
    displayName: z4.string(),
    slug: z4.string(), // primary key
    headquarters: z4.string().optional(), // two letter country/state code
    datacenters: z4.string().array().optional(),
    hasChatCompletions: z4.boolean(), // chat endpoint
    hasCompletions: z4.boolean(), // completion endpoint
    isAbortable: z4.boolean(),
    moderationRequired: z4.boolean(),
    isMultipartSupported: z4.boolean(), // messages with text/image/file parts
    statusPageUrl: z4.url().nullable(),
    byokEnabled: z4.boolean(),
    icon: z4.object({
      url: z4.string(),
      invertRequired: z4.boolean().optional(),
    }),
    dataPolicy: DataPolicy,
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((data) => {
    return {
      slug: data.slug,
      name: data.displayName,
      headquarters: data.headquarters,
      datacenters: data.datacenters,
      icon: data.icon,
      status_page_url: data.statusPageUrl,
      moderation_required: data.moderationRequired,

      capabilities: {
        completions: data.hasCompletions,
        chat_completions: data.hasChatCompletions,
        multipart_messages: data.isMultipartSupported,
        stream_cancellation: data.isAbortable,
        byok: data.byokEnabled,
      },

      data_policy: {
        terms_of_service_url: data.dataPolicy.termsOfServiceURL,
        privacy_policy_url: data.dataPolicy.privacyPolicyURL,

        training: data.dataPolicy.training,
        retains_prompts: data.dataPolicy.retainsPrompts,
        can_publish: data.dataPolicy.canPublish,
        requires_user_ids: data.dataPolicy.requiresUserIDs,
        retention_days: data.dataPolicy.retentionDays,
      },
    }
  })
