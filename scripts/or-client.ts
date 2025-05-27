import { z } from 'zod'
import { openrouter } from '../convex/openrouter/client'

const DataResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .unknown()
    .array()
    .transform((v) => {
      return v.slice(0, 2)
    }),
})

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.string(),
    message: z.string(),
    status: z.number().optional(),
    code: z.number().optional(),
    details: z
      .unknown()
      .transform((v) => {
        if (typeof v === 'string' && v.length > 100) {
          return v.slice(0, 100) + '...'
        }
        return v
      })
      .optional(),
  }),
})

// Test data based on openrouter.md documentation
const testEndpoints = [
  { permaslug: 'meta-llama/llama-3.1-8b-instruct', variant: 'free' },
  { permaslug: 'openai/gpt-4', variant: 'standard' },
  { permaslug: 'anthropic/claude-3-sonnet', variant: 'beta' },
]

// Helper function to validate and log results
function validateAndLog(testName: string, result: any, shouldSucceed: boolean) {
  console.log(`\n🧪 ${testName}`)

  if (shouldSucceed) {
    const successParse = DataResponseSchema.safeParse(result)
    if (successParse.success) {
      console.log('✅ Expected success - validation passed:')
      console.log(successParse.data)
    } else {
      console.log('❌ Failed to parse as success - parsing as error:')
      const errorParse = ErrorResponseSchema.safeParse(result)
      // BOTH options are wrong
      if (errorParse.success) {
        console.log('This is a success object')
        console.log(errorParse.data)
      } else {
        console.log('This is an invalid result')
        console.log(successParse.error.issues)
        console.log('result:', result)
      }

      throw new Error('Expected valid success object')
    }
  } else {
    const errorParse = ErrorResponseSchema.safeParse(result)
    if (errorParse.success) {
      console.log('✅ Expected error - validation passed:')
      console.log(errorParse.data)
    } else {
      console.log('❌ Failed to parse as error - parsing as success:')
      const successParse = DataResponseSchema.safeParse(result)
      // BOTH options are wrong
      if (successParse.success) {
        console.log('This is a success object')
        console.log(successParse.data)
      } else {
        console.log('This is an invalid result')
        console.log(errorParse.error.issues)
        console.log('result:', result)
      }

      throw new Error('Expected valid error object')
    }
  }
}

async function runDemo() {
  console.log('🚀 OpenRouter Client Demonstration')
  console.log('==================================')

  // Test 1: Query /v1/models endpoint (should succeed)
  const modelsResult = await openrouter.v1.models()
  validateAndLog('Test 1: Fetching models from /v1/models', modelsResult, true)

  // Test 2: Query endpoint stats for various models (should succeed)
  console.log('\n🧪 Test 2: Fetching endpoint stats for various models')
  for (const endpoint of testEndpoints) {
    const result = await openrouter.frontend.stats.endpoint(endpoint)
    validateAndLog(`${endpoint.permaslug} (${endpoint.variant})`, result, true)

    // Add a small delay between requests to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // Test 3: Invalid permaslug (should fail)
  const invalidPermaslusgResult = await openrouter.frontend.stats.endpoint({
    permaslug: 'invalid/nonexistent-model',
    variant: 'standard',
  })
  validateAndLog('Test 3: Invalid permaslug', invalidPermaslusgResult, false)

  // Test 4: Invalid URL path (should fail)
  // const invalidUrlResult = await openrouter.custom('/api/nonexistent/endpoint')
  // validateAndLog('Test 4: Invalid URL path', invalidUrlResult, false)

  // Test 5: Completely malformed URL (should fail)
  // const malformedUrlResult = await openrouter.custom('/this/is/definitely/not/a/valid/endpoint')
  // validateAndLog('Test 5: Completely malformed path', malformedUrlResult, false)

  // Test 6: Invalid variant parameter (should fail)
  const missingVariantResult = await openrouter.frontend.stats.endpoint({
    permaslug: 'openai/gpt-4',
    variant: 'reasoner',
  })
  validateAndLog('Test 6: Invalid variant parameter', missingVariantResult, false)

  // Test 7: Frontend models endpoint (should succeed)
  const frontendModelsResult = await openrouter.frontend.models()
  validateAndLog('Test 7: Frontend models endpoint', frontendModelsResult, true)

  console.log('\n📊 Demo completed - all results validated above')
}

// Run the demo
// runDemo().catch((error) => {
//   console.error('💥 Demo failed with unhandled error:', error)
//   process.exit(1)
// })
