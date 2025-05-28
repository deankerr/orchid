import { z } from 'zod'

const OpenRouterV1EndpointRecordSchemaStrict = z
  .object({
    name: z.string(),
    context_length: z.number(),
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
        discount: z.number().optional(),
      })
      .strict(),
    provider_name: z.string(),
    supported_parameters: z.array(z.string()),
    quantization: z.string().nullable(),
    max_completion_tokens: z.number().nullable(),
    max_prompt_tokens: z.number().nullable(),
    status: z.number().optional(),
  })
  .strict()

const OpenRouterV1EndpointsSchemaStrict = z
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
        modality: z.string(),
      })
      .strict(),
    endpoints: z.array(OpenRouterV1EndpointRecordSchemaStrict),
  })
  .strict()
