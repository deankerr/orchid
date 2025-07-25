import type { RegisteredMutation, RegisteredQuery } from 'convex/server'
import { ObjectType, PropertyValidators } from 'convex/values'

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server'

/**
 * Helper for creating functions that can be used both internally and as Convex endpoints.
 * This eliminates duplication between handler functions and query/mutation definitions.
 *
 * @example
 * ```ts
 * // Define once with fnQuery
 * export const getModel = fnQuery({
 *   args: { slug: v.string() },
 *   handler: async (ctx, args) => {
 *     return await ctx.db
 *       .query('or_models')
 *       .withIndex('by_slug', (q) => q.eq('slug', args.slug))
 *       .first()
 *   },
 * })
 *
 * // Use directly in other handlers
 * const model = await getModel(ctx, { slug: 'some-model' })
 *
 * // Export as Convex endpoint
 * export const get = getModel.query
 * ```
 */

// Type for empty args object
type EmptyArgs = Record<string, never>

// Define the shape of what fnQuery returns
export interface FnQueryResult<TArgsValidators extends PropertyValidators, TOutput> {
  // Direct function call (for internal use)
  (ctx: QueryCtx, args: ObjectType<TArgsValidators>): Promise<TOutput>
  // Convex query function (for export as endpoint)
  query: RegisteredQuery<'public', ObjectType<TArgsValidators>, Promise<TOutput>>
}

// Define the shape of what fnMutation returns
export interface FnMutationResult<TArgsValidators extends PropertyValidators, TOutput> {
  // Direct function call (for internal use)
  (ctx: MutationCtx, args: ObjectType<TArgsValidators>): Promise<TOutput>
  // Convex mutation function (for export as endpoint)
  mutation: RegisteredMutation<'public', ObjectType<TArgsValidators>, Promise<TOutput>>
}

// Define the shape of what fnInternalQuery returns
export interface FnInternalQueryResult<TArgsValidators extends PropertyValidators, TOutput> {
  // Direct function call (for internal use)
  (ctx: QueryCtx, args: ObjectType<TArgsValidators>): Promise<TOutput>
  // Convex internal query function (for export as endpoint)
  internalQuery: RegisteredQuery<'internal', ObjectType<TArgsValidators>, Promise<TOutput>>
}

// Define the shape of what fnInternalMutation returns
export interface FnInternalMutationResult<TArgsValidators extends PropertyValidators, TOutput> {
  // Direct function call (for internal use)
  (ctx: MutationCtx, args: ObjectType<TArgsValidators>): Promise<TOutput>
  // Convex internal mutation function (for export as endpoint)
  internalMutation: RegisteredMutation<'internal', ObjectType<TArgsValidators>, Promise<TOutput>>
}

// fnQuery implementation
export function fnQuery<
  TArgsValidators extends PropertyValidators = EmptyArgs,
  TOutput = any,
>(definition: {
  args?: TArgsValidators
  handler: TArgsValidators extends EmptyArgs
    ? (ctx: QueryCtx) => Promise<TOutput>
    : (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
}): FnQueryResult<TArgsValidators, TOutput> {
  const { args = {} as TArgsValidators, handler } = definition

  // Create the direct function with proper typing
  const directFn = (ctx: QueryCtx, fnArgs: ObjectType<TArgsValidators>): Promise<TOutput> => {
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
  }

  // Create the Convex query with proper typing
  const convexQuery = query({
    args,
    handler: handler as (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>,
  }) as RegisteredQuery<'public', ObjectType<TArgsValidators>, Promise<TOutput>>

  // Attach the query to the function
  ;(directFn as any).query = convexQuery

  return directFn as FnQueryResult<TArgsValidators, TOutput>
}

// fnMutation implementation
export function fnMutation<
  TArgsValidators extends PropertyValidators = EmptyArgs,
  TOutput = any,
>(definition: {
  args?: TArgsValidators
  handler: TArgsValidators extends EmptyArgs
    ? (ctx: MutationCtx) => Promise<TOutput>
    : (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
}): FnMutationResult<TArgsValidators, TOutput> {
  const { args = {} as TArgsValidators, handler } = definition

  // Create the direct function with proper typing
  const directFn = (ctx: MutationCtx, fnArgs: ObjectType<TArgsValidators>): Promise<TOutput> => {
    // Handle both cases: with args and without args
    if (Object.keys(args).length > 0) {
      return (handler as (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>)(
        ctx,
        fnArgs,
      )
    } else {
      // When there are no args, call handler without the args parameter
      return (handler as (ctx: MutationCtx) => Promise<TOutput>)(ctx)
    }
  }

  // Create the Convex mutation with proper typing
  const convexMutation = mutation({
    args,
    handler: handler as (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>,
  }) as RegisteredMutation<'public', ObjectType<TArgsValidators>, Promise<TOutput>>

  // Attach the mutation to the function
  ;(directFn as any).mutation = convexMutation

  return directFn as FnMutationResult<TArgsValidators, TOutput>
}

// fnInternalQuery implementation
export function fnInternalQuery<
  TArgsValidators extends PropertyValidators = EmptyArgs,
  TOutput = any,
>(definition: {
  args?: TArgsValidators
  handler: TArgsValidators extends EmptyArgs
    ? (ctx: QueryCtx) => Promise<TOutput>
    : (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
}): FnInternalQueryResult<TArgsValidators, TOutput> {
  const { args = {} as TArgsValidators, handler } = definition

  // Create the direct function with proper typing
  const directFn = (ctx: QueryCtx, fnArgs: ObjectType<TArgsValidators>): Promise<TOutput> => {
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
  }

  // Create the Convex internal query with proper typing
  const convexInternalQuery = internalQuery({
    args,
    handler: handler as (ctx: QueryCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>,
  }) as RegisteredQuery<'internal', ObjectType<TArgsValidators>, Promise<TOutput>>

  // Attach the internal query to the function
  ;(directFn as any).internalQuery = convexInternalQuery

  return directFn as FnInternalQueryResult<TArgsValidators, TOutput>
}

// fnInternalMutation implementation
export function fnInternalMutation<
  TArgsValidators extends PropertyValidators = EmptyArgs,
  TOutput = any,
>(definition: {
  args?: TArgsValidators
  handler: TArgsValidators extends EmptyArgs
    ? (ctx: MutationCtx) => Promise<TOutput>
    : (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>
}): FnInternalMutationResult<TArgsValidators, TOutput> {
  const { args = {} as TArgsValidators, handler } = definition

  // Create the direct function with proper typing
  const directFn = (ctx: MutationCtx, fnArgs: ObjectType<TArgsValidators>): Promise<TOutput> => {
    // Handle both cases: with args and without args
    if (Object.keys(args).length > 0) {
      return (handler as (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>)(
        ctx,
        fnArgs,
      )
    } else {
      // When there are no args, call handler without the args parameter
      return (handler as (ctx: MutationCtx) => Promise<TOutput>)(ctx)
    }
  }

  // Create the Convex internal mutation with proper typing
  const convexInternalMutation = internalMutation({
    args,
    handler: handler as (ctx: MutationCtx, args: ObjectType<TArgsValidators>) => Promise<TOutput>,
  }) as RegisteredMutation<'internal', ObjectType<TArgsValidators>, Promise<TOutput>>

  // Attach the internal mutation to the function
  ;(directFn as any).internalMutation = convexInternalMutation

  return directFn as FnInternalMutationResult<TArgsValidators, TOutput>
}
