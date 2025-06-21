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
import type * as http from "../http.js";
import type * as openrouter_archives from "../openrouter/archives.js";
import type * as openrouter_client from "../openrouter/client.js";
import type * as openrouter_entities_apps from "../openrouter/entities/apps.js";
import type * as openrouter_entities_authors from "../openrouter/entities/authors.js";
import type * as openrouter_entities_endpoints from "../openrouter/entities/endpoints.js";
import type * as openrouter_entities_models from "../openrouter/entities/models.js";
import type * as openrouter_entities_providers from "../openrouter/entities/providers.js";
import type * as openrouter_report from "../openrouter/report.js";
import type * as openrouter_snapshot from "../openrouter/snapshot.js";
import type * as openrouter_types from "../openrouter/types.js";
import type * as openrouter_utils from "../openrouter/utils.js";
import type * as openrouter_validation from "../openrouter/validation.js";
import type * as or_or_app_token_metrics from "../or/or_app_token_metrics.js";
import type * as or_or_apps from "../or/or_apps.js";
import type * as or_or_apps_validators from "../or/or_apps_validators.js";
import type * as or_or_authors from "../or/or_authors.js";
import type * as or_or_authors_validators from "../or/or_authors_validators.js";
import type * as or_or_endpoint_metrics from "../or/or_endpoint_metrics.js";
import type * as or_or_endpoint_uptime_metrics from "../or/or_endpoint_uptime_metrics.js";
import type * as or_or_endpoint_uptime_metrics_validators from "../or/or_endpoint_uptime_metrics_validators.js";
import type * as or_or_endpoints from "../or/or_endpoints.js";
import type * as or_or_endpoints_validators from "../or/or_endpoints_validators.js";
import type * as or_or_model_token_metrics from "../or/or_model_token_metrics.js";
import type * as or_or_model_token_metrics_validators from "../or/or_model_token_metrics_validators.js";
import type * as or_or_models from "../or/or_models.js";
import type * as or_or_models_validators from "../or/or_models_validators.js";
import type * as or_or_providers from "../or/or_providers.js";
import type * as or_or_providers_validators from "../or/or_providers_validators.js";
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
  crons: typeof crons;
  frontend: typeof frontend;
  http: typeof http;
  "openrouter/archives": typeof openrouter_archives;
  "openrouter/client": typeof openrouter_client;
  "openrouter/entities/apps": typeof openrouter_entities_apps;
  "openrouter/entities/authors": typeof openrouter_entities_authors;
  "openrouter/entities/endpoints": typeof openrouter_entities_endpoints;
  "openrouter/entities/models": typeof openrouter_entities_models;
  "openrouter/entities/providers": typeof openrouter_entities_providers;
  "openrouter/report": typeof openrouter_report;
  "openrouter/snapshot": typeof openrouter_snapshot;
  "openrouter/types": typeof openrouter_types;
  "openrouter/utils": typeof openrouter_utils;
  "openrouter/validation": typeof openrouter_validation;
  "or/or_app_token_metrics": typeof or_or_app_token_metrics;
  "or/or_apps": typeof or_or_apps;
  "or/or_apps_validators": typeof or_or_apps_validators;
  "or/or_authors": typeof or_or_authors;
  "or/or_authors_validators": typeof or_or_authors_validators;
  "or/or_endpoint_metrics": typeof or_or_endpoint_metrics;
  "or/or_endpoint_uptime_metrics": typeof or_or_endpoint_uptime_metrics;
  "or/or_endpoint_uptime_metrics_validators": typeof or_or_endpoint_uptime_metrics_validators;
  "or/or_endpoints": typeof or_or_endpoints;
  "or/or_endpoints_validators": typeof or_or_endpoints_validators;
  "or/or_model_token_metrics": typeof or_or_model_token_metrics;
  "or/or_model_token_metrics_validators": typeof or_or_model_token_metrics_validators;
  "or/or_models": typeof or_or_models;
  "or/or_models_validators": typeof or_or_models_validators;
  "or/or_providers": typeof or_or_providers;
  "or/or_providers_validators": typeof or_or_providers_validators;
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
