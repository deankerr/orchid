import { up } from 'up-fetch'

export const orFetch = up(fetch, () => ({
  baseUrl: 'https://openrouter.ai',
  retry: {
    attempts: 2,
    delay: (ctx) => ctx.attempt ** 2 * 1000,
  },
}))

// const ErrorResultSchema = z.object({
//   error: z.object({
//     code: z.number(),
//     message: z.string(),
//   }),
// })
