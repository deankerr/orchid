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
import type * as db_snapshot_crawlArchives from "../db/snapshot/crawlArchives.js";
import type * as db_snapshot_crawlConfig from "../db/snapshot/crawlConfig.js";
import type * as http from "../http.js";
import type * as lib_validator from "../lib/validator.js";
import type * as shared from "../shared.js";
import type * as snapshots_bundle from "../snapshots/bundle.js";
import type * as snapshots_changes2_backfill from "../snapshots/changes2/backfill.js";
import type * as snapshots_changes2_display from "../snapshots/changes2/display.js";
import type * as snapshots_changes2_postCrawl from "../snapshots/changes2/postCrawl.js";
import type * as snapshots_changes2_process from "../snapshots/changes2/process.js";
import type * as snapshots_changes2_reprocessDisplay from "../snapshots/changes2/reprocessDisplay.js";
import type * as snapshots_crawl from "../snapshots/crawl.js";
import type * as snapshots_icons from "../snapshots/icons.js";
import type * as snapshots_materialize_v2_endpoints from "../snapshots/materialize_v2/endpoints.js";
import type * as snapshots_materialize_v2_main from "../snapshots/materialize_v2/main.js";
import type * as snapshots_materialize_v2_models from "../snapshots/materialize_v2/models.js";
import type * as snapshots_materialize_v2_providers from "../snapshots/materialize_v2/providers.js";
import type * as storage from "../storage.js";
import type * as table3 from "../table3.js";
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
  "db/snapshot/crawlArchives": typeof db_snapshot_crawlArchives;
  "db/snapshot/crawlConfig": typeof db_snapshot_crawlConfig;
  http: typeof http;
  "lib/validator": typeof lib_validator;
  shared: typeof shared;
  "snapshots/bundle": typeof snapshots_bundle;
  "snapshots/changes2/backfill": typeof snapshots_changes2_backfill;
  "snapshots/changes2/display": typeof snapshots_changes2_display;
  "snapshots/changes2/postCrawl": typeof snapshots_changes2_postCrawl;
  "snapshots/changes2/process": typeof snapshots_changes2_process;
  "snapshots/changes2/reprocessDisplay": typeof snapshots_changes2_reprocessDisplay;
  "snapshots/crawl": typeof snapshots_crawl;
  "snapshots/icons": typeof snapshots_icons;
  "snapshots/materialize_v2/endpoints": typeof snapshots_materialize_v2_endpoints;
  "snapshots/materialize_v2/main": typeof snapshots_materialize_v2_main;
  "snapshots/materialize_v2/models": typeof snapshots_materialize_v2_models;
  "snapshots/materialize_v2/providers": typeof snapshots_materialize_v2_providers;
  storage: typeof storage;
  table3: typeof table3;
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
