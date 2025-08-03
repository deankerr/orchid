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
import type * as db_index from "../db/index.js";
import type * as db_or_apps from "../db/or/apps.js";
import type * as db_or_authors from "../db/or/authors.js";
import type * as db_or_endpointStats from "../db/or/endpointStats.js";
import type * as db_or_endpointUptimes from "../db/or/endpointUptimes.js";
import type * as db_or_endpoints from "../db/or/endpoints.js";
import type * as db_or_modelAppLeaderboards from "../db/or/modelAppLeaderboards.js";
import type * as db_or_modelTokenStats from "../db/or/modelTokenStats.js";
import type * as db_or_models from "../db/or/models.js";
import type * as db_or_providers from "../db/or/providers.js";
import type * as db_snapshot_archives from "../db/snapshot/archives.js";
import type * as db_snapshot_runs from "../db/snapshot/runs.js";
import type * as db_snapshot_schedule from "../db/snapshot/schedule.js";
import type * as dev from "../dev.js";
import type * as fnHelperLite from "../fnHelperLite.js";
import type * as http from "../http.js";
import type * as openrouter_archive from "../openrouter/archive.js";
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
import type * as openrouter_utils from "../openrouter/utils.js";
import type * as openrouter_validation from "../openrouter/validation.js";
import type * as openrouter_validators_apps from "../openrouter/validators/apps.js";
import type * as openrouter_validators_authors from "../openrouter/validators/authors.js";
import type * as openrouter_validators_dataPolicy from "../openrouter/validators/dataPolicy.js";
import type * as openrouter_validators_endpointUptimesMetrics from "../openrouter/validators/endpointUptimesMetrics.js";
import type * as openrouter_validators_endpoints from "../openrouter/validators/endpoints.js";
import type * as openrouter_validators_modelTokenStats from "../openrouter/validators/modelTokenStats.js";
import type * as openrouter_validators_models from "../openrouter/validators/models.js";
import type * as openrouter_validators_providers from "../openrouter/validators/providers.js";
import type * as public_endpointUptimes from "../public/endpointUptimes.js";
import type * as public_endpoints from "../public/endpoints.js";
import type * as public_modelAppLeaderboards from "../public/modelAppLeaderboards.js";
import type * as public_modelTokenStats from "../public/modelTokenStats.js";
import type * as public_models from "../public/models.js";
import type * as public_providers from "../public/providers.js";
import type * as public_snapshots from "../public/snapshots.js";
import type * as shared from "../shared.js";
import type * as snapshots_v2_archive from "../snapshots_v2/archive.js";
import type * as snapshots_v2_comparison_decision from "../snapshots_v2/comparison/decision.js";
import type * as snapshots_v2_engine from "../snapshots_v2/engine.js";
import type * as snapshots_v2_inputs from "../snapshots_v2/inputs.js";
import type * as snapshots_v2_mutations from "../snapshots_v2/mutations.js";
import type * as snapshots_v2_outputs_convexWriter from "../snapshots_v2/outputs/convexWriter.js";
import type * as snapshots_v2_outputs_index from "../snapshots_v2/outputs/index.js";
import type * as snapshots_v2_outputs_logWriter from "../snapshots_v2/outputs/logWriter.js";
import type * as snapshots_v2_processes_standard_v2 from "../snapshots_v2/processes/standard_v2.js";
import type * as snapshots_v2_sources_apps from "../snapshots_v2/sources/apps.js";
import type * as snapshots_v2_sources_dataPolicy from "../snapshots_v2/sources/dataPolicy.js";
import type * as snapshots_v2_sources_endpoints from "../snapshots_v2/sources/endpoints.js";
import type * as snapshots_v2_sources_index from "../snapshots_v2/sources/index.js";
import type * as snapshots_v2_sources_modelAuthor from "../snapshots_v2/sources/modelAuthor.js";
import type * as snapshots_v2_sources_models from "../snapshots_v2/sources/models.js";
import type * as snapshots_v2_sources_providers from "../snapshots_v2/sources/providers.js";
import type * as snapshots_v2_sources_uptimes from "../snapshots_v2/sources/uptimes.js";
import type * as snapshots_v2_types from "../snapshots_v2/types.js";
import type * as table3 from "../table3.js";

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
  "db/index": typeof db_index;
  "db/or/apps": typeof db_or_apps;
  "db/or/authors": typeof db_or_authors;
  "db/or/endpointStats": typeof db_or_endpointStats;
  "db/or/endpointUptimes": typeof db_or_endpointUptimes;
  "db/or/endpoints": typeof db_or_endpoints;
  "db/or/modelAppLeaderboards": typeof db_or_modelAppLeaderboards;
  "db/or/modelTokenStats": typeof db_or_modelTokenStats;
  "db/or/models": typeof db_or_models;
  "db/or/providers": typeof db_or_providers;
  "db/snapshot/archives": typeof db_snapshot_archives;
  "db/snapshot/runs": typeof db_snapshot_runs;
  "db/snapshot/schedule": typeof db_snapshot_schedule;
  dev: typeof dev;
  fnHelperLite: typeof fnHelperLite;
  http: typeof http;
  "openrouter/archive": typeof openrouter_archive;
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
  "openrouter/utils": typeof openrouter_utils;
  "openrouter/validation": typeof openrouter_validation;
  "openrouter/validators/apps": typeof openrouter_validators_apps;
  "openrouter/validators/authors": typeof openrouter_validators_authors;
  "openrouter/validators/dataPolicy": typeof openrouter_validators_dataPolicy;
  "openrouter/validators/endpointUptimesMetrics": typeof openrouter_validators_endpointUptimesMetrics;
  "openrouter/validators/endpoints": typeof openrouter_validators_endpoints;
  "openrouter/validators/modelTokenStats": typeof openrouter_validators_modelTokenStats;
  "openrouter/validators/models": typeof openrouter_validators_models;
  "openrouter/validators/providers": typeof openrouter_validators_providers;
  "public/endpointUptimes": typeof public_endpointUptimes;
  "public/endpoints": typeof public_endpoints;
  "public/modelAppLeaderboards": typeof public_modelAppLeaderboards;
  "public/modelTokenStats": typeof public_modelTokenStats;
  "public/models": typeof public_models;
  "public/providers": typeof public_providers;
  "public/snapshots": typeof public_snapshots;
  shared: typeof shared;
  "snapshots_v2/archive": typeof snapshots_v2_archive;
  "snapshots_v2/comparison/decision": typeof snapshots_v2_comparison_decision;
  "snapshots_v2/engine": typeof snapshots_v2_engine;
  "snapshots_v2/inputs": typeof snapshots_v2_inputs;
  "snapshots_v2/mutations": typeof snapshots_v2_mutations;
  "snapshots_v2/outputs/convexWriter": typeof snapshots_v2_outputs_convexWriter;
  "snapshots_v2/outputs/index": typeof snapshots_v2_outputs_index;
  "snapshots_v2/outputs/logWriter": typeof snapshots_v2_outputs_logWriter;
  "snapshots_v2/processes/standard_v2": typeof snapshots_v2_processes_standard_v2;
  "snapshots_v2/sources/apps": typeof snapshots_v2_sources_apps;
  "snapshots_v2/sources/dataPolicy": typeof snapshots_v2_sources_dataPolicy;
  "snapshots_v2/sources/endpoints": typeof snapshots_v2_sources_endpoints;
  "snapshots_v2/sources/index": typeof snapshots_v2_sources_index;
  "snapshots_v2/sources/modelAuthor": typeof snapshots_v2_sources_modelAuthor;
  "snapshots_v2/sources/models": typeof snapshots_v2_sources_models;
  "snapshots_v2/sources/providers": typeof snapshots_v2_sources_providers;
  "snapshots_v2/sources/uptimes": typeof snapshots_v2_sources_uptimes;
  "snapshots_v2/types": typeof snapshots_v2_types;
  table3: typeof table3;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
