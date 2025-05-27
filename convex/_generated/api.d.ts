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
import type * as crons from "../crons.js";
import type * as openrouter_api_frontend_allProviders from "../openrouter/api/frontend/allProviders.js";
import type * as openrouter_api_frontend_endpoint from "../openrouter/api/frontend/endpoint.js";
import type * as openrouter_api_frontend_models from "../openrouter/api/frontend/models.js";
import type * as openrouter_api_v1_endpoints from "../openrouter/api/v1/endpoints.js";
import type * as openrouter_api_v1_models from "../openrouter/api/v1/models.js";
import type * as openrouter_client from "../openrouter/client.js";
import type * as projections from "../projections.js";
import type * as snapshots from "../snapshots.js";
import type * as sync from "../sync.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "openrouter/api/frontend/allProviders": typeof openrouter_api_frontend_allProviders;
  "openrouter/api/frontend/endpoint": typeof openrouter_api_frontend_endpoint;
  "openrouter/api/frontend/models": typeof openrouter_api_frontend_models;
  "openrouter/api/v1/endpoints": typeof openrouter_api_v1_endpoints;
  "openrouter/api/v1/models": typeof openrouter_api_v1_models;
  "openrouter/client": typeof openrouter_client;
  projections: typeof projections;
  snapshots: typeof snapshots;
  sync: typeof sync;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
