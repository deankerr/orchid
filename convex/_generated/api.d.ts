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
import type * as db_or_endpoints from "../db/or/endpoints.js";
import type * as db_or_modelAppLeaderboards from "../db/or/modelAppLeaderboards.js";
import type * as db_or_modelTokenStats from "../db/or/modelTokenStats.js";
import type * as db_or_models from "../db/or/models.js";
import type * as db_or_providers from "../db/or/providers.js";
import type * as db_snapshot_crawlArchives from "../db/snapshot/crawlArchives.js";
import type * as db_snapshot_crawlConfig from "../db/snapshot/crawlConfig.js";
import type * as db_snapshot_rawArchives from "../db/snapshot/rawArchives.js";
import type * as dev from "../dev.js";
import type * as shared from "../shared.js";
import type * as snapshots_crawl from "../snapshots/crawl.js";
import type * as snapshots_materialize_apps from "../snapshots/materialize/apps.js";
import type * as snapshots_materialize_materialize from "../snapshots/materialize/materialize.js";
import type * as snapshots_materialize_modelTokenStats from "../snapshots/materialize/modelTokenStats.js";
import type * as snapshots_materialize_utils from "../snapshots/materialize/utils.js";
import type * as snapshots_migrateBundle from "../snapshots/migrateBundle.js";
import type * as snapshots_transforms_apps from "../snapshots/transforms/apps.js";
import type * as snapshots_transforms_endpoints from "../snapshots/transforms/endpoints.js";
import type * as snapshots_transforms_index from "../snapshots/transforms/index.js";
import type * as snapshots_transforms_modelAuthor from "../snapshots/transforms/modelAuthor.js";
import type * as snapshots_transforms_models from "../snapshots/transforms/models.js";
import type * as snapshots_transforms_providers from "../snapshots/transforms/providers.js";
import type * as snapshots_transforms_shared from "../snapshots/transforms/shared.js";
import type * as snapshots_transforms_uptimes from "../snapshots/transforms/uptimes.js";
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
  "db/or/endpoints": typeof db_or_endpoints;
  "db/or/modelAppLeaderboards": typeof db_or_modelAppLeaderboards;
  "db/or/modelTokenStats": typeof db_or_modelTokenStats;
  "db/or/models": typeof db_or_models;
  "db/or/providers": typeof db_or_providers;
  "db/snapshot/crawlArchives": typeof db_snapshot_crawlArchives;
  "db/snapshot/crawlConfig": typeof db_snapshot_crawlConfig;
  "db/snapshot/rawArchives": typeof db_snapshot_rawArchives;
  dev: typeof dev;
  shared: typeof shared;
  "snapshots/crawl": typeof snapshots_crawl;
  "snapshots/materialize/apps": typeof snapshots_materialize_apps;
  "snapshots/materialize/materialize": typeof snapshots_materialize_materialize;
  "snapshots/materialize/modelTokenStats": typeof snapshots_materialize_modelTokenStats;
  "snapshots/materialize/utils": typeof snapshots_materialize_utils;
  "snapshots/migrateBundle": typeof snapshots_migrateBundle;
  "snapshots/transforms/apps": typeof snapshots_transforms_apps;
  "snapshots/transforms/endpoints": typeof snapshots_transforms_endpoints;
  "snapshots/transforms/index": typeof snapshots_transforms_index;
  "snapshots/transforms/modelAuthor": typeof snapshots_transforms_modelAuthor;
  "snapshots/transforms/models": typeof snapshots_transforms_models;
  "snapshots/transforms/providers": typeof snapshots_transforms_providers;
  "snapshots/transforms/shared": typeof snapshots_transforms_shared;
  "snapshots/transforms/uptimes": typeof snapshots_transforms_uptimes;
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
