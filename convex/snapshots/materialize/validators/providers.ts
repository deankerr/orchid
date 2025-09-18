import * as R from 'remeda'
import { z } from 'zod'

import { getIconUrl } from '../../shared/icons'

export const ProviderTransformSchema = z
  .object({
    slug: z.string(),
    displayName: z.string(),
    icon: z.object({
      url: z.string(),
    }),

    headquarters: z.string().optional(),
    datacenters: z.string().array().optional(),
    statusPageUrl: z.url().nullable(),

    dataPolicy: z.object({
      termsOfServiceURL: z.string().optional(),
      privacyPolicyURL: z.string().optional(),
    }),
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((raw) => ({
    slug: raw.slug,
    name: raw.displayName,
    icon_url: getIconUrl(raw.slug) ?? (raw.icon.url.startsWith('http') ? raw.icon.url : ''),

    headquarters: raw.headquarters,
    datacenters: raw.datacenters,
    status_page_url: raw.statusPageUrl,
    terms_of_service_url: raw.dataPolicy.termsOfServiceURL,
    privacy_policy_url: raw.dataPolicy.privacyPolicyURL,
  }))
