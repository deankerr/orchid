import * as R from 'remeda'
import { z } from 'zod'

import { DataPolicy } from './shared'

export const providers = z
  .object({
    displayName: z.string(),
    slug: z.string(), // primary key
    headquarters: z.string().optional(), // two letter country/state code
    datacenters: z.string().array().optional(),
    hasChatCompletions: z.boolean(), // chat endpoint
    hasCompletions: z.boolean(), // completion endpoint
    isAbortable: z.boolean(),
    moderationRequired: z.boolean(),
    isMultipartSupported: z.boolean(), // messages with text/image/file parts
    statusPageUrl: z.url().nullable(),
    byokEnabled: z.boolean(),
    icon: z.object({
      url: z.string(),
      invertRequired: z.boolean().optional(),
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
