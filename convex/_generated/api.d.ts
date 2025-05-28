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
import type * as openrouter_client from "../openrouter/client.js";
import type * as openrouter_schemas_api_frontend_allProviders_strict from "../openrouter/schemas/api_frontend_allProviders_strict.js";
import type * as openrouter_schemas_api_frontend_models from "../openrouter/schemas/api_frontend_models.js";
import type * as openrouter_schemas_api_frontend_models_strict from "../openrouter/schemas/api_frontend_models_strict.js";
import type * as openrouter_schemas_api_frontend_stats_endpoint from "../openrouter/schemas/api_frontend_stats_endpoint.js";
import type * as openrouter_schemas_api_frontend_stats_endpoint_strict from "../openrouter/schemas/api_frontend_stats_endpoint_strict.js";
import type * as openrouter_schemas_api_v1_endpoints_strict from "../openrouter/schemas/api_v1_endpoints_strict.js";
import type * as openrouter_schemas_api_v1_models_strict from "../openrouter/schemas/api_v1_models_strict.js";
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
  "openrouter/client": typeof openrouter_client;
  "openrouter/schemas/api_frontend_allProviders_strict": typeof openrouter_schemas_api_frontend_allProviders_strict;
  "openrouter/schemas/api_frontend_models": typeof openrouter_schemas_api_frontend_models;
  "openrouter/schemas/api_frontend_models_strict": typeof openrouter_schemas_api_frontend_models_strict;
  "openrouter/schemas/api_frontend_stats_endpoint": typeof openrouter_schemas_api_frontend_stats_endpoint;
  "openrouter/schemas/api_frontend_stats_endpoint_strict": typeof openrouter_schemas_api_frontend_stats_endpoint_strict;
  "openrouter/schemas/api_v1_endpoints_strict": typeof openrouter_schemas_api_v1_endpoints_strict;
  "openrouter/schemas/api_v1_models_strict": typeof openrouter_schemas_api_v1_models_strict;
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
