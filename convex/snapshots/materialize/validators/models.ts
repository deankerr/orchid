import { z } from 'zod'

import { getIconUrl } from '../../shared/icons'

export const ModelTransformSchema = z
  .object({
    slug: z.string(),
    hf_slug: z.string().nullable(),
    created_at: z
      .string()
      .transform((val) => Date.parse(val))
      .pipe(z.number()),
    name: z.string(),
    short_name: z.string(),
    author: z.string(),
    description: z.string(),
    context_length: z.number(),
    input_modalities: z.array(z.string()),
    output_modalities: z.array(z.string()),
    group: z.string(),
    instruct_type: z.string().nullable(),
    warning_message: z.string().nullable(),
    permaslug: z.string(),
    reasoning_config: z
      .object({
        start_token: z.string(),
        end_token: z.string(),
      })
      .nullable(),
  })
  .transform((raw) => {
    // Extract author name from model name if it contains a colon, otherwise use author slug
    const author_name = raw.name.includes(':') ? raw.name.split(':')[0].trim() : raw.author

    return {
      slug: raw.slug,
      base_slug: raw.slug,
      version_slug: raw.permaslug,
      variant: 'standard',

      name: raw.short_name,
      icon_url: getIconUrl(raw.slug) ?? '',

      author_slug: raw.author,
      author_name,

      or_added_at: raw.created_at,

      input_modalities: raw.input_modalities,
      output_modalities: raw.output_modalities,

      reasoning: raw.reasoning_config !== null,
      mandatory_reasoning: false, // Can only be determined from endpoint data

      // details
      description: raw.description,
      tokenizer: raw.group,
      hugging_face_id: raw.hf_slug || undefined,
      instruct_type: raw.instruct_type || undefined,
      warning_message: raw.warning_message || undefined,
    }
  })
