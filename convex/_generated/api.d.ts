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
import type * as analysis_endpoints from "../analysis/endpoints.js";
import type * as analysis_stats from "../analysis/stats.js";
import type * as crons from "../crons.js";
import type * as db_index from "../db/index.js";
import type * as db_or_changes from "../db/or/changes.js";
import type * as db_or_views_endpoints from "../db/or/views/endpoints.js";
import type * as db_or_views_models from "../db/or/views/models.js";
import type * as db_or_views_providers from "../db/or/views/providers.js";
import type * as db_snapshot_crawl_archives from "../db/snapshot/crawl/archives.js";
import type * as db_snapshot_crawl_config from "../db/snapshot/crawl/config.js";
import type * as http from "../http.js";
import type * as lib_vTable from "../lib/vTable.js";
import type * as lib_validator from "../lib/validator.js";
import type * as shared from "../shared.js";
import type * as snapshots_changes_display from "../snapshots/changes/display.js";
import type * as snapshots_changes_main from "../snapshots/changes/main.js";
import type * as snapshots_changes_process from "../snapshots/changes/process.js";
import type * as snapshots_changes_reprocessDisplay from "../snapshots/changes/reprocessDisplay.js";
import type * as snapshots_crawl_main from "../snapshots/crawl/main.js";
import type * as snapshots_materialize_main from "../snapshots/materialize/main.js";
import type * as snapshots_materialize_output from "../snapshots/materialize/output.js";
import type * as snapshots_materialize_validators_endpoints from "../snapshots/materialize/validators/endpoints.js";
import type * as snapshots_materialize_validators_models from "../snapshots/materialize/validators/models.js";
import type * as snapshots_materialize_validators_providers from "../snapshots/materialize/validators/providers.js";
import type * as snapshots_shared_bundle from "../snapshots/shared/bundle.js";
import type * as snapshots_shared_icons from "../snapshots/shared/icons.js";
import type * as storage from "../storage.js";
import type * as views_changes from "../views/changes.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "analysis/endpoints": typeof analysis_endpoints;
  "analysis/stats": typeof analysis_stats;
  crons: typeof crons;
  "db/index": typeof db_index;
  "db/or/changes": typeof db_or_changes;
  "db/or/views/endpoints": typeof db_or_views_endpoints;
  "db/or/views/models": typeof db_or_views_models;
  "db/or/views/providers": typeof db_or_views_providers;
  "db/snapshot/crawl/archives": typeof db_snapshot_crawl_archives;
  "db/snapshot/crawl/config": typeof db_snapshot_crawl_config;
  http: typeof http;
  "lib/vTable": typeof lib_vTable;
  "lib/validator": typeof lib_validator;
  shared: typeof shared;
  "snapshots/changes/display": typeof snapshots_changes_display;
  "snapshots/changes/main": typeof snapshots_changes_main;
  "snapshots/changes/process": typeof snapshots_changes_process;
  "snapshots/changes/reprocessDisplay": typeof snapshots_changes_reprocessDisplay;
  "snapshots/crawl/main": typeof snapshots_crawl_main;
  "snapshots/materialize/main": typeof snapshots_materialize_main;
  "snapshots/materialize/output": typeof snapshots_materialize_output;
  "snapshots/materialize/validators/endpoints": typeof snapshots_materialize_validators_endpoints;
  "snapshots/materialize/validators/models": typeof snapshots_materialize_validators_models;
  "snapshots/materialize/validators/providers": typeof snapshots_materialize_validators_providers;
  "snapshots/shared/bundle": typeof snapshots_shared_bundle;
  "snapshots/shared/icons": typeof snapshots_shared_icons;
  storage: typeof storage;
  "views/changes": typeof views_changes;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
