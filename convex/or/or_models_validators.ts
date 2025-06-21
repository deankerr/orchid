import z4 from 'zod/v4'

import * as R from 'remeda'

const ReasoningConfig = z4.object({
  start_token: z4.string(),
  end_token: z4.string(),
})

const fields = {
  slug: z4.string(), // primary key
  hf_slug: z4.string().nullable(), // hugging face id
  updated_at: z4.string(), // e.g. "2025-03-28T03:20:30.853469+00:00"
  created_at: z4.string(), // e.g. "2025-03-26T18:42:53.41832+00:00"
  hf_updated_at: z4.null(),
  name: z4.string(),
  short_name: z4.string(), // usually name without author prefix
  author: z4.string(),
  description: z4.string(),
  model_version_group_id: z4.string().nullable(),
  context_length: z4.number(),
  input_modalities: z4.array(z4.string()), // always includes "text", may include "image"/"file"
  output_modalities: z4.array(z4.string()), // always ["text"]
  has_text_output: z4.boolean(), // always true
  group: z4.string(), // architecture family/tokenizer eg., "GPT", "Claude", "Llama2"
  instruct_type: z4.string().nullable(),
  default_system: z4.null(),
  default_stops: z4.array(z4.string()),
  hidden: z4.boolean(), // always false
  router: z4.null(),
  warning_message: z4.string().nullable(),
  permaslug: z4.string(), // unique key, versioned slug
  reasoning_config: ReasoningConfig.nullable(),
  features: z4.object({ reasoning_config: ReasoningConfig.optional() }).nullable(),
  endpoint: z4.object({ variant: z4.string() }).nullable(), // Endpoint
}

export const ModelStrictSchema = z4.strictObject({
  ...fields,
  endpoint: z4.unknown(), // don't validate here
})

export const ModelTransformSchema = z4
  .object(
    R.pick(fields, [
      'slug',
      'hf_slug',
      'updated_at',
      'created_at',
      'name',
      'short_name',
      'author',
      'description',
      'context_length',
      'input_modalities',
      'output_modalities',
      'group',
      'instruct_type',
      'warning_message',
      'permaslug',
      'endpoint',
    ]),
  )
  .transform(R.pickBy(R.isNonNullish))
  .transform((rec) => {
    const { author, hf_slug, created_at, updated_at, group, endpoint, ...rest } = rec

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
