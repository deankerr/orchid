import type { ObjectType, PropertyValidators } from 'convex/values'

import type { MutationCtx, QueryCtx } from './_generated/server'

export function fnQueryLite<TArgsValidators extends PropertyValidators, TOutput = any>({
  args,
  handler,
}: {
  args?: TArgsValidators
  handler: (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
}) {
  return {
    // Direct execution function
    run: (ctx: QueryCtx, fnArgs: ObjectType<TArgsValidators>) => {
      return handler(ctx, fnArgs)
    },

    // Returns the definition for convex functions
    define: () => ({
      args,
      handler,
    }),
  }
}

export function fnMutationLite<TArgsValidators extends PropertyValidators, TOutput = any>({
  args,
  handler,
}: {
  args?: TArgsValidators
  handler: (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
}) {
  return {
    // Direct execution function
    run: (ctx: MutationCtx, fnArgs: ObjectType<TArgsValidators>) => {
      return handler(ctx, fnArgs)
    },

    // Returns the definition for convex functions
    define: () => ({
      args,
      handler,
    }),
  }
}
