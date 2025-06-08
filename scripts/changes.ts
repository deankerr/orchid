import { diff, atomizeChangeset } from 'json-diff-ts'

// Test: Full endpoint with better array handling
const endpoint1Enhanced = {
  name: 'OpenAI GPT-4',
  supportedParameters: ['temperature', 'max_tokens', 'stop', 'frequency_penalty'],
  variablePricings: [
    {
      request: '0.05',
      threshold: 'high',
      type: 'search-threshold',
    },
    {
      request: '0.035',
      threshold: 'medium',
      type: 'search-threshold',
    },
    {
      request: '0.03',
      threshold: 'low',
      type: 'search-threshold',
    },
  ],
  pricing: {
    input: '0.00003',
    output: '0.00006',
  },
}

const endpoint2Enhanced = {
  name: 'OpenAI GPT-4',
  supportedParameters: ['temperature', 'frequency_penalty', 'stop'],
  variablePricings: [
    {
      request: '0.035',
      threshold: 'medium',
      type: 'search-threshold',
    },
    {
      request: '0.05',
      threshold: 'high',
      type: 'search-threshold',
    },
  ],
  pricing: {
    input: '0.00003',
    output: '0.00009',
  },
}

console.log('\n=== Enhanced Endpoint Diff ===')
const enhancedDiff = diff(endpoint1Enhanced, endpoint2Enhanced, {
  embeddedObjKeys: {
    supportedParameters: '$value',
  },
})
console.log(JSON.stringify(enhancedDiff, null, 2))

// Test: Atomic changesets
console.log('\n=== Atomic Changesets ===')
const atomicChanges = atomizeChangeset(enhancedDiff)
console.log(JSON.stringify(atomicChanges, null, 2))
