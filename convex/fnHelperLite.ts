import type { ObjectType, PropertyValidators } from 'convex/values'

import type { MutationCtx, QueryCtx } from './_generated/server'

// Type for empty args object
type EmptyArgs = Record<string, never>

// The shape of what fnQueryLite returns
export interface FnQueryLiteResult<TArgsValidators extends PropertyValidators, TOutput> {
  // Direct function call (for internal use)
  run: (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
  // Returns the definition object for convex query/internalQuery
  define: () => {
    args: TArgsValidators
    handler: (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
  }
}

// The shape of what fnMutationLite returns
export interface FnMutationLiteResult<TArgsValidators extends PropertyValidators, TOutput> {
  // Direct function call (for internal use)
  run: (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
  // Returns the definition object for convex mutation/internalMutation
  define: () => {
    args: TArgsValidators
    handler: (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
  }
}

// fnQueryLite implementation
export function fnQueryLite<
  TArgsValidators extends PropertyValidators = EmptyArgs,
  TOutput = any,
>(definition: {
  args?: TArgsValidators
  handler: TArgsValidators extends EmptyArgs
    ? (ctx: QueryCtx) => Promise<TOutput>
    : (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
}): FnQueryLiteResult<TArgsValidators, TOutput> {
  const { args = {} as TArgsValidators, handler } = definition

  return {
    // Direct execution function
    run: (ctx: QueryCtx, fnArgs: ObjectType<TArgsValidators>): Promise<TOutput> => {
      // Handle both cases: with args and without args
      if (Object.keys(args).length > 0) {
        return (handler as (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>)(
          ctx,
          fnArgs,
        )
      } else {
        // When there are no args, call handler without the args parameter
        return (handler as (ctx: QueryCtx) => Promise<TOutput>)(ctx)
      }
    },

    // Returns the definition for convex functions
    define: () => ({
      args,
      handler: handler as (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>,
    }),
  }
}

// fnMutationLite implementation
export function fnMutationLite<
  TArgsValidators extends PropertyValidators = EmptyArgs,
  TOutput = any,
>(definition: {
  args?: TArgsValidators
  handler: TArgsValidators extends EmptyArgs
    ? (ctx: MutationCtx) => Promise<TOutput>
    : (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
}): FnMutationLiteResult<TArgsValidators, TOutput> {
  const { args = {} as TArgsValidators, handler } = definition

  return {
    // Direct execution function
    run: (ctx: MutationCtx, fnArgs: ObjectType<TArgsValidators>): Promise<TOutput> => {
      // Handle both cases: with args and without args
      if (Object.keys(args).length > 0) {
        return (
          handler as (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
        )(ctx, fnArgs)
      } else {
        // When there are no args, call handler without the args parameter
        return (handler as (ctx: MutationCtx) => Promise<TOutput>)(ctx)
      }
    },

    // Returns the definition for convex functions
    define: () => ({
      args,
      handler: handler as (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>,
    }),
  }
}
