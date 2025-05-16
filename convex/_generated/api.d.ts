/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as models from "../models.js";
import type * as openrouter_listEndpoints from "../openrouter/listEndpoints.js";
import type * as openrouter_listModels from "../openrouter/listModels.js";
import type * as openrouter_sync from "../openrouter/sync.js";
import type * as openrouter_transforms from "../openrouter/transforms.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  models: typeof models;
  "openrouter/listEndpoints": typeof openrouter_listEndpoints;
  "openrouter/listModels": typeof openrouter_listModels;
  "openrouter/sync": typeof openrouter_sync;
  "openrouter/transforms": typeof openrouter_transforms;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
