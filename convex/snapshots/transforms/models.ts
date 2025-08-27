import * as R from 'remeda'
import { z } from 'zod'

export const models = z
  .object({
    slug: z.string(), // primary key
    hf_slug: z.string().nullable(), // hugging face isd
    updated_at: z.string(), // e.g. "2025-03-28T03:20:30.853469+00:00"
    created_at: z.string(), // e.g. "2025-03-26T18:42:53.41832+00:00"
    name: z.string(),
    short_name: z.string(), // usually name without author prefix
    author: z.string(),
    description: z.string(),
    context_length: z.number(),
    input_modalities: z.array(z.string()), // always includes "text", may include "image"/"file"
    output_modalities: z.array(z.string()), // always ["text"]
    group: z.string(), // architecture family/tokenizer eg., "GPT", "Claude", "Llama2"
    instruct_type: z.string().nullable(),
    warning_message: z.string().nullable(),
    permaslug: z.string(), // unique key, versioned slug
    reasoning_config: z
      .object({
        start_token: z.string(),
        end_token: z.string(),
      })
      .nullable(),
    endpoint: z.object({ variant: z.string() }).nullable(),
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
