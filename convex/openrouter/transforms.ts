import { VModel, type VModelEndpoint } from '../schema'
import { ModelEndpoint, ModelEndpointResponse } from './listEndpoints'

/**
 * Transforms OpenRouter API model data to our database model format
 */
export function transformOrModel(response: ModelEndpointResponse): VModel {
  const modelData = response.data

  return {
    modelKey: modelData.id,
    displayName: modelData.name,
    modelCreated: modelData.created,
    description: modelData.description,
    architecture: {
      inputModalities: modelData.architecture.input_modalities,
      outputModalities: modelData.architecture.output_modalities,
      tokenizer: modelData.architecture.tokenizer,
      instructType: modelData.architecture.instruct_type,
    },
    contextLength: modelData.architecture.modality ? undefined : modelData.created,
    supportedParameters: modelData.endpoints.reduce((params, endpoint) => {
      // Combine all parameters from all endpoints
      endpoint.supported_parameters.forEach((param) => {
        if (!params.includes(param)) {
          params.push(param)
        }
      })
      return params
    }, [] as string[]),
  }
}

/**
 * Transforms OpenRouter API endpoint data to our database endpoint format
 */
export function transformOrEndpoint(endpoint: ModelEndpoint, modelKey: string): VModelEndpoint {
  return {
    modelKey,
    providerName: endpoint.provider_name,
    contextLength: endpoint.context_length,
    maxCompletionTokens: endpoint.max_completion_tokens ?? undefined,
    maxPromptTokens: endpoint.max_prompt_tokens ?? undefined,
    quantization: endpoint.quantization ?? undefined,
    status: endpoint.status,
    pricing: {
      prompt: parseFloat(endpoint.pricing.prompt),
      completion: parseFloat(endpoint.pricing.completion),
      image: endpoint.pricing.image ? parseFloat(endpoint.pricing.image) : undefined,
      request: endpoint.pricing.request ? parseFloat(endpoint.pricing.request) : undefined,
      webSearch: endpoint.pricing.web_search ? parseFloat(endpoint.pricing.web_search) : undefined,
      internalReasoning: endpoint.pricing.internal_reasoning
        ? parseFloat(endpoint.pricing.internal_reasoning)
        : undefined,
      inputCacheRead: endpoint.pricing.input_cache_read
        ? parseFloat(endpoint.pricing.input_cache_read)
        : undefined,
      inputCacheWrite: endpoint.pricing.input_cache_write
        ? parseFloat(endpoint.pricing.input_cache_write)
        : undefined,
      discount: endpoint.pricing.discount,
    },
    supportedParameters: endpoint.supported_parameters,
  }
}
