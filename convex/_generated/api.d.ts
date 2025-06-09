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
import type * as frontend from "../frontend.js";
import type * as openrouter_client from "../openrouter/client.js";
import type * as openrouter_schemas_api_frontend_allProviders_strict from "../openrouter/schemas/api_frontend_allProviders_strict.js";
import type * as openrouter_schemas_api_frontend_models from "../openrouter/schemas/api_frontend_models.js";
import type * as openrouter_schemas_api_frontend_models_strict from "../openrouter/schemas/api_frontend_models_strict.js";
import type * as openrouter_schemas_api_frontend_stats_endpoint from "../openrouter/schemas/api_frontend_stats_endpoint.js";
import type * as openrouter_schemas_api_frontend_stats_endpoint_strict from "../openrouter/schemas/api_frontend_stats_endpoint_strict.js";
import type * as openrouter_schemas_api_v1_endpoints_strict from "../openrouter/schemas/api_v1_endpoints_strict.js";
import type * as openrouter_schemas_api_v1_models_strict from "../openrouter/schemas/api_v1_models_strict.js";
import type * as projections_endpoints from "../projections/endpoints.js";
import type * as projections_models from "../projections/models.js";
import type * as projections_process from "../projections/process.js";
import type * as shared from "../shared.js";
import type * as snapshots from "../snapshots.js";
import type * as sync_apps from "../sync/apps.js";
import type * as sync_endpoints from "../sync/endpoints.js";
import type * as sync_hourlyUptimes from "../sync/hourlyUptimes.js";
import type * as sync_modelAuthors from "../sync/modelAuthors.js";
import type * as sync_models from "../sync/models.js";
import type * as sync_process from "../sync/process.js";
import type * as sync_providers from "../sync/providers.js";
import type * as sync_recentUptimes from "../sync/recentUptimes.js";
import type * as sync_state from "../sync/state.js";
import type * as sync_v1_apps_v1 from "../sync_v1/apps_v1.js";
import type * as sync_v1_authors_v1 from "../sync_v1/authors_v1.js";
import type * as sync_v1_endpoint_stats_v1 from "../sync_v1/endpoint_stats_v1.js";
import type * as sync_v1_endpoint_uptime_v1 from "../sync_v1/endpoint_uptime_v1.js";
import type * as sync_v1_endpoints_v1 from "../sync_v1/endpoints_v1.js";
import type * as sync_v1_model_tokens_v1 from "../sync_v1/model_tokens_v1.js";
import type * as sync_v1_models_v1 from "../sync_v1/models_v1.js";
import type * as sync_v1_run from "../sync_v1/run.js";

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
  frontend: typeof frontend;
  "openrouter/client": typeof openrouter_client;
  "openrouter/schemas/api_frontend_allProviders_strict": typeof openrouter_schemas_api_frontend_allProviders_strict;
  "openrouter/schemas/api_frontend_models": typeof openrouter_schemas_api_frontend_models;
  "openrouter/schemas/api_frontend_models_strict": typeof openrouter_schemas_api_frontend_models_strict;
  "openrouter/schemas/api_frontend_stats_endpoint": typeof openrouter_schemas_api_frontend_stats_endpoint;
  "openrouter/schemas/api_frontend_stats_endpoint_strict": typeof openrouter_schemas_api_frontend_stats_endpoint_strict;
  "openrouter/schemas/api_v1_endpoints_strict": typeof openrouter_schemas_api_v1_endpoints_strict;
  "openrouter/schemas/api_v1_models_strict": typeof openrouter_schemas_api_v1_models_strict;
  "projections/endpoints": typeof projections_endpoints;
  "projections/models": typeof projections_models;
  "projections/process": typeof projections_process;
  shared: typeof shared;
  snapshots: typeof snapshots;
  "sync/apps": typeof sync_apps;
  "sync/endpoints": typeof sync_endpoints;
  "sync/hourlyUptimes": typeof sync_hourlyUptimes;
  "sync/modelAuthors": typeof sync_modelAuthors;
  "sync/models": typeof sync_models;
  "sync/process": typeof sync_process;
  "sync/providers": typeof sync_providers;
  "sync/recentUptimes": typeof sync_recentUptimes;
  "sync/state": typeof sync_state;
  "sync_v1/apps_v1": typeof sync_v1_apps_v1;
  "sync_v1/authors_v1": typeof sync_v1_authors_v1;
  "sync_v1/endpoint_stats_v1": typeof sync_v1_endpoint_stats_v1;
  "sync_v1/endpoint_uptime_v1": typeof sync_v1_endpoint_uptime_v1;
  "sync_v1/endpoints_v1": typeof sync_v1_endpoints_v1;
  "sync_v1/model_tokens_v1": typeof sync_v1_model_tokens_v1;
  "sync_v1/models_v1": typeof sync_v1_models_v1;
  "sync_v1/run": typeof sync_v1_run;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
