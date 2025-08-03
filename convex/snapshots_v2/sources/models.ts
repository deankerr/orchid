import * as R from 'remeda'
import z4 from 'zod/v4'

import { orFetch } from '../../openrouter/sources'

export const transformSchema = z4
  .object({
    slug: z4.string(), // primary key
    hf_slug: z4.string().nullable(), // hugging face isd
    updated_at: z4.string(), // e.g. "2025-03-28T03:20:30.853469+00:00"
    created_at: z4.string(), // e.g. "2025-03-26T18:42:53.41832+00:00"
    name: z4.string(),
    short_name: z4.string(), // usually name without author prefix
    author: z4.string(),
    description: z4.string(),
    context_length: z4.number(),
    input_modalities: z4.array(z4.string()), // always includes "text", may include "image"/"file"
    output_modalities: z4.array(z4.string()), // always ["text"]
    group: z4.string(), // architecture family/tokenizer eg., "GPT", "Claude", "Llama2"
    instruct_type: z4.string().nullable(),
    warning_message: z4.string().nullable(),
    permaslug: z4.string(), // unique key, versioned slug
    reasoning_config: z4
      .object({
        start_token: z4.string(),
        end_token: z4.string(),
      })
      .nullable(),
    endpoint: z4.object({ variant: z4.string() }).nullable(),
  })
  .transform(R.pickBy(R.isNonNullish))
  .transform((data) => {
    const { author, hf_slug, created_at, updated_at, group, endpoint, ...rest } = data

    return {
      ...rest,
      author_slug: author,
      hugging_face_id: hf_slug,
      or_created_at: new Date(created_at).getTime(),
      or_updated_at: new Date(updated_at).getTime(),
      tokenizer: group,
      variant: endpoint?.variant,
    }
  })

export const models = {
  key: 'models',
  schema: transformSchema,
  remote: async () => {
    return await orFetch('/api/frontend/models')
  },
  archiveKey: () => {
    return { type: 'models' }
  },
}
