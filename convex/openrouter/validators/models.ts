import * as R from 'remeda'
import z4 from 'zod/v4'

const ReasoningConfig = z4.object({
  start_token: z4.string(),
  end_token: z4.string(),
})

const fields = {
  slug: z4.string(), // primary key
  hf_slug: z4.string().nullable(), // hugging face id
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
  reasoning_config: ReasoningConfig.nullable(),
  endpoint: z4.object({ variant: z4.string() }).nullable(),
}

export const ModelStrictSchema = z4.strictObject({
  ...fields,
  endpoint: z4.unknown(), // endpoint entity, don't strictly validate here

  // unused fields
  hf_updated_at: z4.null(),
  model_version_group_id: z4.string().nullable(),
  has_text_output: z4.boolean(), // always true
  hidden: z4.boolean(), // always false
  default_system: z4.null(),
  default_stops: z4.array(z4.string()),
  router: z4.null(),
  features: z4.object({ reasoning_config: ReasoningConfig.optional() }).nullable(),
})

export const ModelTransformSchema = z4
  .object({ ...fields })
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
