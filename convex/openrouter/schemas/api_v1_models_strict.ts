import { z } from 'zod'

const OpenRouterV1ModelRecordSchemaStrict = z
  .object({
    id: z.string(),
    name: z.string(),
    created: z.number(),
    description: z.string(),
    architecture: z
      .object({
        input_modalities: z.array(z.string()),
        output_modalities: z.array(z.string()),
        tokenizer: z.string(),
        instruct_type: z.string().nullable(),
        modality: z.string().optional(), // likely deprecated
      })
      .strict(),
    top_provider: z
      .object({
        is_moderated: z.boolean(),
        context_length: z.number().nullable(),
        max_completion_tokens: z.number().nullable(),
      })
      .strict(),
    pricing: z
      .object({
        prompt: z.string(),
        completion: z.string(),
        image: z.string().optional(),
        request: z.string().optional(),
        input_cache_read: z.string().optional(),
        input_cache_write: z.string().optional(),
        web_search: z.string().optional(),
        internal_reasoning: z.string().optional(),
      })
      .strict(),
    context_length: z.number().nullable(),
    hugging_face_id: z.string().nullable(),
    supported_parameters: z.array(z.string()),
    per_request_limits: z.null(), // deprecated, always null
  })
  .strict()
