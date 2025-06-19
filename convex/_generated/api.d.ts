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
import type * as app_views_table from "../app_views/table.js";
import type * as author_views_schemas from "../author_views/schemas.js";
import type * as author_views_table from "../author_views/table.js";
import type * as crons from "../crons.js";
import type * as endpoint_stats_table from "../endpoint_stats/table.js";
import type * as endpoint_uptime_stats_schemas from "../endpoint_uptime_stats/schemas.js";
import type * as endpoint_uptime_stats_table from "../endpoint_uptime_stats/table.js";
import type * as endpoint_views_schemas from "../endpoint_views/schemas.js";
import type * as endpoint_views_table from "../endpoint_views/table.js";
import type * as files from "../files.js";
import type * as frontend from "../frontend.js";
import type * as http from "../http.js";
import type * as model_token_stats_schemas from "../model_token_stats/schemas.js";
import type * as model_token_stats_table from "../model_token_stats/table.js";
import type * as model_views_schemas from "../model_views/schemas.js";
import type * as model_views_table from "../model_views/table.js";
import type * as openrouter_client from "../openrouter/client.js";
import type * as openrouter_entities_apps from "../openrouter/entities/apps.js";
import type * as openrouter_entities_authors from "../openrouter/entities/authors.js";
import type * as openrouter_entities_endpoints from "../openrouter/entities/endpoints.js";
import type * as openrouter_entities_models from "../openrouter/entities/models.js";
import type * as openrouter_entities_providers from "../openrouter/entities/providers.js";
import type * as openrouter_report from "../openrouter/report.js";
import type * as openrouter_snapshot from "../openrouter/snapshot.js";
import type * as openrouter_types from "../openrouter/types.js";
import type * as openrouter_validation from "../openrouter/validation.js";
import type * as provider_views_schemas from "../provider_views/schemas.js";
import type * as provider_views_table from "../provider_views/table.js";
import type * as shared from "../shared.js";
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
  "app_views/table": typeof app_views_table;
  "author_views/schemas": typeof author_views_schemas;
  "author_views/table": typeof author_views_table;
  crons: typeof crons;
  "endpoint_stats/table": typeof endpoint_stats_table;
  "endpoint_uptime_stats/schemas": typeof endpoint_uptime_stats_schemas;
  "endpoint_uptime_stats/table": typeof endpoint_uptime_stats_table;
  "endpoint_views/schemas": typeof endpoint_views_schemas;
  "endpoint_views/table": typeof endpoint_views_table;
  files: typeof files;
  frontend: typeof frontend;
  http: typeof http;
  "model_token_stats/schemas": typeof model_token_stats_schemas;
  "model_token_stats/table": typeof model_token_stats_table;
  "model_views/schemas": typeof model_views_schemas;
  "model_views/table": typeof model_views_table;
  "openrouter/client": typeof openrouter_client;
  "openrouter/entities/apps": typeof openrouter_entities_apps;
  "openrouter/entities/authors": typeof openrouter_entities_authors;
  "openrouter/entities/endpoints": typeof openrouter_entities_endpoints;
  "openrouter/entities/models": typeof openrouter_entities_models;
  "openrouter/entities/providers": typeof openrouter_entities_providers;
  "openrouter/report": typeof openrouter_report;
  "openrouter/snapshot": typeof openrouter_snapshot;
  "openrouter/types": typeof openrouter_types;
  "openrouter/validation": typeof openrouter_validation;
  "provider_views/schemas": typeof provider_views_schemas;
  "provider_views/table": typeof provider_views_table;
  shared: typeof shared;
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
