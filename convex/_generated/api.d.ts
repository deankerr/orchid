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
import type * as dev from "../dev.js";
import type * as frontend from "../frontend.js";
import type * as http from "../http.js";
import type * as openrouter_archive from "../openrouter/archive.js";
import type * as openrouter_entities_apps from "../openrouter/entities/apps.js";
import type * as openrouter_entities_authors from "../openrouter/entities/authors.js";
import type * as openrouter_entities_endpointStats from "../openrouter/entities/endpointStats.js";
import type * as openrouter_entities_endpointUptimes from "../openrouter/entities/endpointUptimes.js";
import type * as openrouter_entities_endpoints from "../openrouter/entities/endpoints.js";
import type * as openrouter_entities_modelAppLeaderboards from "../openrouter/entities/modelAppLeaderboards.js";
import type * as openrouter_entities_modelTokenStats from "../openrouter/entities/modelTokenStats.js";
import type * as openrouter_entities_models from "../openrouter/entities/models.js";
import type * as openrouter_entities_providers from "../openrouter/entities/providers.js";
import type * as openrouter_orchestrator from "../openrouter/orchestrator.js";
import type * as openrouter_output from "../openrouter/output.js";
import type * as openrouter_pipelineRunner from "../openrouter/pipelineRunner.js";
import type * as openrouter_pipelines_apps from "../openrouter/pipelines/apps.js";
import type * as openrouter_pipelines_endpoints from "../openrouter/pipelines/endpoints.js";
import type * as openrouter_pipelines_modelTokenStats from "../openrouter/pipelines/modelTokenStats.js";
import type * as openrouter_pipelines_models from "../openrouter/pipelines/models.js";
import type * as openrouter_pipelines_providers from "../openrouter/pipelines/providers.js";
import type * as openrouter_schedule from "../openrouter/schedule.js";
import type * as openrouter_snapshot from "../openrouter/snapshot.js";
import type * as openrouter_sources from "../openrouter/sources.js";
import type * as openrouter_validation from "../openrouter/validation.js";
import type * as openrouter_validators_apps from "../openrouter/validators/apps.js";
import type * as openrouter_validators_authors from "../openrouter/validators/authors.js";
import type * as openrouter_validators_dataPolicy from "../openrouter/validators/dataPolicy.js";
import type * as openrouter_validators_endpointUptimesMetrics from "../openrouter/validators/endpointUptimesMetrics.js";
import type * as openrouter_validators_endpoints from "../openrouter/validators/endpoints.js";
import type * as openrouter_validators_modelTokenStats from "../openrouter/validators/modelTokenStats.js";
import type * as openrouter_validators_models from "../openrouter/validators/models.js";
import type * as openrouter_validators_providers from "../openrouter/validators/providers.js";
import type * as shared from "../shared.js";
import type * as table2 from "../table2.js";
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
  dev: typeof dev;
  frontend: typeof frontend;
  http: typeof http;
  "openrouter/archive": typeof openrouter_archive;
  "openrouter/entities/apps": typeof openrouter_entities_apps;
  "openrouter/entities/authors": typeof openrouter_entities_authors;
  "openrouter/entities/endpointStats": typeof openrouter_entities_endpointStats;
  "openrouter/entities/endpointUptimes": typeof openrouter_entities_endpointUptimes;
  "openrouter/entities/endpoints": typeof openrouter_entities_endpoints;
  "openrouter/entities/modelAppLeaderboards": typeof openrouter_entities_modelAppLeaderboards;
  "openrouter/entities/modelTokenStats": typeof openrouter_entities_modelTokenStats;
  "openrouter/entities/models": typeof openrouter_entities_models;
  "openrouter/entities/providers": typeof openrouter_entities_providers;
  "openrouter/orchestrator": typeof openrouter_orchestrator;
  "openrouter/output": typeof openrouter_output;
  "openrouter/pipelineRunner": typeof openrouter_pipelineRunner;
  "openrouter/pipelines/apps": typeof openrouter_pipelines_apps;
  "openrouter/pipelines/endpoints": typeof openrouter_pipelines_endpoints;
  "openrouter/pipelines/modelTokenStats": typeof openrouter_pipelines_modelTokenStats;
  "openrouter/pipelines/models": typeof openrouter_pipelines_models;
  "openrouter/pipelines/providers": typeof openrouter_pipelines_providers;
  "openrouter/schedule": typeof openrouter_schedule;
  "openrouter/snapshot": typeof openrouter_snapshot;
  "openrouter/sources": typeof openrouter_sources;
  "openrouter/validation": typeof openrouter_validation;
  "openrouter/validators/apps": typeof openrouter_validators_apps;
  "openrouter/validators/authors": typeof openrouter_validators_authors;
  "openrouter/validators/dataPolicy": typeof openrouter_validators_dataPolicy;
  "openrouter/validators/endpointUptimesMetrics": typeof openrouter_validators_endpointUptimesMetrics;
  "openrouter/validators/endpoints": typeof openrouter_validators_endpoints;
  "openrouter/validators/modelTokenStats": typeof openrouter_validators_modelTokenStats;
  "openrouter/validators/models": typeof openrouter_validators_models;
  "openrouter/validators/providers": typeof openrouter_validators_providers;
  shared: typeof shared;
  table2: typeof table2;
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
