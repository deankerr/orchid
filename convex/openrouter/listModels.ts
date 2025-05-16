import { z } from 'zod'

export const ModelRecordSchema = z
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
    per_request_limits: z.null(), // deprecated
  })
  .strict()

export const ModelsResponseSchema = z.object({
  data: z.array(ModelRecordSchema),
})

export type ModelRecord = z.infer<typeof ModelRecordSchema>
export type ModelsResponse = z.infer<typeof ModelsResponseSchema>

export const listModels = async (): Promise<ModelsResponse> => {
  const response = await fetch('https://openrouter.ai/api/v1/models')
  const data = await response.json()
  return ModelsResponseSchema.parse(data)
}
