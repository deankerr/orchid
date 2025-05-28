import { z } from 'zod'

const ReasoningConfigSchema = z.object({
  start_token: z.string(),
  end_token: z.string(),
})

export const OpenRouterFrontendModelRecordSchema = z.object({
  slug: z.string(),
  hf_slug: z.string().nullable(),
  updated_at: z.string(),
  created_at: z.string(),
  name: z.string(),
  short_name: z.string(),
  author: z.string(),
  description: z.string(),
  model_version_group_id: z.string().nullable(),
  context_length: z.number(),
  input_modalities: z.array(z.string()),
  output_modalities: z.array(z.string()),
  group: z.string(),
  instruct_type: z.string().nullable(),
  warning_message: z.string().nullable(),
  permaslug: z.string(),
  reasoning_config: ReasoningConfigSchema.nullable(),
})
