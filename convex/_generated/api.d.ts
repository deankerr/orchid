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
import type * as app_token_stats_table from "../app_token_stats/table.js";
import type * as app_views_schemas from "../app_views/schemas.js";
import type * as app_views_snapshot from "../app_views/snapshot.js";
import type * as app_views_table from "../app_views/table.js";
import type * as author_views_schemas from "../author_views/schemas.js";
import type * as author_views_snapshot from "../author_views/snapshot.js";
import type * as author_views_table from "../author_views/table.js";
import type * as crons from "../crons.js";
import type * as endpoint_stats_table from "../endpoint_stats/table.js";
import type * as endpoint_uptime_stats_schemas from "../endpoint_uptime_stats/schemas.js";
import type * as endpoint_uptime_stats_snapshot from "../endpoint_uptime_stats/snapshot.js";
import type * as endpoint_uptime_stats_table from "../endpoint_uptime_stats/table.js";
import type * as endpoint_views_schemas from "../endpoint_views/schemas.js";
import type * as endpoint_views_snapshot from "../endpoint_views/snapshot.js";
import type * as endpoint_views_table from "../endpoint_views/table.js";
import type * as files from "../files.js";
import type * as frontend from "../frontend.js";
import type * as model_token_stats_schemas from "../model_token_stats/schemas.js";
import type * as model_token_stats_snapshot from "../model_token_stats/snapshot.js";
import type * as model_token_stats_table from "../model_token_stats/table.js";
import type * as model_views_schemas from "../model_views/schemas.js";
import type * as model_views_snapshot from "../model_views/snapshot.js";
import type * as model_views_table from "../model_views/table.js";
import type * as openrouter_client from "../openrouter/client.js";
import type * as openrouter_schemas_api_frontend_allProviders_strict from "../openrouter/schemas/api_frontend_allProviders_strict.js";
import type * as openrouter_schemas_api_frontend_models from "../openrouter/schemas/api_frontend_models.js";
import type * as openrouter_schemas_api_frontend_models_strict from "../openrouter/schemas/api_frontend_models_strict.js";
import type * as openrouter_schemas_api_frontend_stats_endpoint from "../openrouter/schemas/api_frontend_stats_endpoint.js";
import type * as openrouter_schemas_api_frontend_stats_endpoint_strict from "../openrouter/schemas/api_frontend_stats_endpoint_strict.js";
import type * as openrouter_schemas_api_v1_endpoints_strict from "../openrouter/schemas/api_v1_endpoints_strict.js";
import type * as openrouter_schemas_api_v1_models_strict from "../openrouter/schemas/api_v1_models_strict.js";
import type * as openrouter_sync from "../openrouter/sync.js";
import type * as openrouter_validation from "../openrouter/validation.js";
import type * as provider_views_schemas from "../provider_views/schemas.js";
import type * as provider_views_table from "../provider_views/table.js";
import type * as shared from "../shared.js";
import type * as sync_v1_apps_v1 from "../sync_v1/apps_v1.js";
import type * as sync_v1_authors_v1 from "../sync_v1/authors_v1.js";
import type * as sync_v1_endpoint_stats_v1 from "../sync_v1/endpoint_stats_v1.js";
import type * as sync_v1_endpoint_uptime_v1 from "../sync_v1/endpoint_uptime_v1.js";
import type * as sync_v1_endpoints_v1 from "../sync_v1/endpoints_v1.js";
import type * as sync_v1_model_tokens_v1 from "../sync_v1/model_tokens_v1.js";
import type * as sync_v1_models_v1 from "../sync_v1/models_v1.js";
import type * as sync_v1_run from "../sync_v1/run.js";
import type * as types from "../types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "app_token_stats/table": typeof app_token_stats_table;
  "app_views/schemas": typeof app_views_schemas;
  "app_views/snapshot": typeof app_views_snapshot;
  "app_views/table": typeof app_views_table;
  "author_views/schemas": typeof author_views_schemas;
  "author_views/snapshot": typeof author_views_snapshot;
  "author_views/table": typeof author_views_table;
  crons: typeof crons;
  "endpoint_stats/table": typeof endpoint_stats_table;
  "endpoint_uptime_stats/schemas": typeof endpoint_uptime_stats_schemas;
  "endpoint_uptime_stats/snapshot": typeof endpoint_uptime_stats_snapshot;
  "endpoint_uptime_stats/table": typeof endpoint_uptime_stats_table;
  "endpoint_views/schemas": typeof endpoint_views_schemas;
  "endpoint_views/snapshot": typeof endpoint_views_snapshot;
  "endpoint_views/table": typeof endpoint_views_table;
  files: typeof files;
  frontend: typeof frontend;
  "model_token_stats/schemas": typeof model_token_stats_schemas;
  "model_token_stats/snapshot": typeof model_token_stats_snapshot;
  "model_token_stats/table": typeof model_token_stats_table;
  "model_views/schemas": typeof model_views_schemas;
  "model_views/snapshot": typeof model_views_snapshot;
  "model_views/table": typeof model_views_table;
  "openrouter/client": typeof openrouter_client;
  "openrouter/schemas/api_frontend_allProviders_strict": typeof openrouter_schemas_api_frontend_allProviders_strict;
  "openrouter/schemas/api_frontend_models": typeof openrouter_schemas_api_frontend_models;
  "openrouter/schemas/api_frontend_models_strict": typeof openrouter_schemas_api_frontend_models_strict;
  "openrouter/schemas/api_frontend_stats_endpoint": typeof openrouter_schemas_api_frontend_stats_endpoint;
  "openrouter/schemas/api_frontend_stats_endpoint_strict": typeof openrouter_schemas_api_frontend_stats_endpoint_strict;
  "openrouter/schemas/api_v1_endpoints_strict": typeof openrouter_schemas_api_v1_endpoints_strict;
  "openrouter/schemas/api_v1_models_strict": typeof openrouter_schemas_api_v1_models_strict;
  "openrouter/sync": typeof openrouter_sync;
  "openrouter/validation": typeof openrouter_validation;
  "provider_views/schemas": typeof provider_views_schemas;
  "provider_views/table": typeof provider_views_table;
  shared: typeof shared;
  "sync_v1/apps_v1": typeof sync_v1_apps_v1;
  "sync_v1/authors_v1": typeof sync_v1_authors_v1;
  "sync_v1/endpoint_stats_v1": typeof sync_v1_endpoint_stats_v1;
  "sync_v1/endpoint_uptime_v1": typeof sync_v1_endpoint_uptime_v1;
  "sync_v1/endpoints_v1": typeof sync_v1_endpoints_v1;
  "sync_v1/model_tokens_v1": typeof sync_v1_model_tokens_v1;
  "sync_v1/models_v1": typeof sync_v1_models_v1;
  "sync_v1/run": typeof sync_v1_run;
  types: typeof types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
