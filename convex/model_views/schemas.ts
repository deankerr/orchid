import z4 from 'zod/v4'
import * as R from 'remeda'

const ReasoningConfig = z4.object({
  start_token: z4.string(),
  end_token: z4.string(),
})

const fields = {
  slug: z4.string(),
  hf_slug: z4.string().nullable(),
  updated_at: z4.string(), // ex. "2025-03-28T03:20:30.853469+00:00"
  created_at: z4.string(), // ex. "2025-03-26T18:42:53.41832+00:00"
  hf_updated_at: z4.null(),
  name: z4.string(),
  short_name: z4.string(),
  author: z4.string(),
  description: z4.string(),
  model_version_group_id: z4.string().nullable(),
  context_length: z4.number(),
  input_modalities: z4.array(z4.string()),
  output_modalities: z4.array(z4.string()),
  has_text_output: z4.boolean(),
  group: z4.string(),
  instruct_type: z4.string().nullable(),
  default_system: z4.null(),
  default_stops: z4.array(z4.string()),
  hidden: z4.boolean(),
  router: z4.null(),
  warning_message: z4.string().nullable(),
  permaslug: z4.string(),
  reasoning_config: ReasoningConfig.nullable(),
  features: z4.object({ reasoning_config: ReasoningConfig.optional() }).nullable(),
  endpoint: z4.object({ variant: z4.string() }).nullable(), // NOTE: OpenRouterFrontendEndpointRecordSchema object
}

export const ModelStrictSchema = z4.strictObject(fields)
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
      origin_created_at: new Date(created_at).getTime(),
      origin_updated_at: new Date(updated_at).getTime(),
      tokenizer: group,
      variant: endpoint?.variant,
    }
  })
