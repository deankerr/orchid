import { z } from 'zod'

const ReasoningConfigSchema = z
  .object({
    start_token: z.string(),
    end_token: z.string(),
  })
  .strict()

export const ModelSchema = z
  .object({
    slug: z.string(),
    hf_slug: z.string().nullable(),
    updated_at: z.string(), // ex. "2025-03-28T03:20:30.853469+00:00"
    created_at: z.string(), // ex. "2025-03-26T18:42:53.41832+00:00"
    hf_updated_at: z.null(),
    name: z.string(),
    short_name: z.string(),
    author: z.string(),
    description: z.string(),
    model_version_group_id: z.string().nullable(),
    context_length: z.number(),
    input_modalities: z.array(z.string()),
    output_modalities: z.array(z.string()),
    has_text_output: z.boolean(),
    group: z.string(),
    instruct_type: z.string().nullable(),
    default_system: z.null(),
    default_stops: z.array(z.string()),
    hidden: z.boolean(),
    router: z.null(),
    warning_message: z.string().nullable(),
    permaslug: z.string(),
    reasoning_config: ReasoningConfigSchema.nullable(),
    features: z.object({ reasoning_config: ReasoningConfigSchema.optional() }).strict().nullable(),
    endpoint: z.unknown().nullable(), // NOTE: EndpointSchemaInternal object
  })
  .strict()
