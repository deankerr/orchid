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
import type * as db_snapshot_crawlArchives from "../db/snapshot/crawlArchives.js";
import type * as db_snapshot_crawlConfig from "../db/snapshot/crawlConfig.js";
import type * as db_snapshot_rawArchives from "../db/snapshot/rawArchives.js";
import type * as db_snapshot_runs from "../db/snapshot/runs.js";
import type * as db_snapshot_schedule from "../db/snapshot/schedule.js";
import type * as dev from "../dev.js";
import type * as fnHelperLite from "../fnHelperLite.js";
import type * as http from "../http.js";
import type * as public_endpointUptimes from "../public/endpointUptimes.js";
import type * as public_endpoints from "../public/endpoints.js";
import type * as public_modelAppLeaderboards from "../public/modelAppLeaderboards.js";
import type * as public_modelTokenStats from "../public/modelTokenStats.js";
import type * as public_models from "../public/models.js";
import type * as public_providers from "../public/providers.js";
import type * as public_snapshots from "../public/snapshots.js";
import type * as shared from "../shared.js";
import type * as snapshots_crawl from "../snapshots/crawl.js";
import type * as snapshots_crawlB from "../snapshots/crawlB.js";
import type * as snapshots_materialize_apps from "../snapshots/materialize/apps.js";
import type * as snapshots_materialize_materialize from "../snapshots/materialize/materialize.js";
import type * as snapshots_materialize_modelTokenStats from "../snapshots/materialize/modelTokenStats.js";
import type * as snapshots_materialize_uptimes from "../snapshots/materialize/uptimes.js";
import type * as snapshots_materialize_utils from "../snapshots/materialize/utils.js";
import type * as snapshots_materializeb_apps from "../snapshots/materializeb/apps.js";
import type * as snapshots_materializeb_materialize from "../snapshots/materializeb/materialize.js";
import type * as snapshots_materializeb_modelTokenStats from "../snapshots/materializeb/modelTokenStats.js";
import type * as snapshots_materializeb_uptimes from "../snapshots/materializeb/uptimes.js";
import type * as snapshots_materializeb_utils from "../snapshots/materializeb/utils.js";
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
  "db/or/authors": typeof db_or_authors;
  "db/or/endpointStats": typeof db_or_endpointStats;
  "db/or/endpointUptimes": typeof db_or_endpointUptimes;
  "db/or/endpoints": typeof db_or_endpoints;
  "db/or/modelAppLeaderboards": typeof db_or_modelAppLeaderboards;
  "db/or/modelTokenStats": typeof db_or_modelTokenStats;
  "db/or/models": typeof db_or_models;
  "db/or/providers": typeof db_or_providers;
  "db/snapshot/archives": typeof db_snapshot_archives;
  "db/snapshot/crawlArchives": typeof db_snapshot_crawlArchives;
  "db/snapshot/crawlConfig": typeof db_snapshot_crawlConfig;
  "db/snapshot/rawArchives": typeof db_snapshot_rawArchives;
  "db/snapshot/runs": typeof db_snapshot_runs;
  "db/snapshot/schedule": typeof db_snapshot_schedule;
  dev: typeof dev;
  fnHelperLite: typeof fnHelperLite;
  http: typeof http;
  "public/endpointUptimes": typeof public_endpointUptimes;
  "public/endpoints": typeof public_endpoints;
  "public/modelAppLeaderboards": typeof public_modelAppLeaderboards;
  "public/modelTokenStats": typeof public_modelTokenStats;
  "public/models": typeof public_models;
  "public/providers": typeof public_providers;
  "public/snapshots": typeof public_snapshots;
  shared: typeof shared;
  "snapshots/crawl": typeof snapshots_crawl;
  "snapshots/crawlB": typeof snapshots_crawlB;
  "snapshots/materialize/apps": typeof snapshots_materialize_apps;
  "snapshots/materialize/materialize": typeof snapshots_materialize_materialize;
  "snapshots/materialize/modelTokenStats": typeof snapshots_materialize_modelTokenStats;
  "snapshots/materialize/uptimes": typeof snapshots_materialize_uptimes;
  "snapshots/materialize/utils": typeof snapshots_materialize_utils;
  "snapshots/materializeb/apps": typeof snapshots_materializeb_apps;
  "snapshots/materializeb/materialize": typeof snapshots_materializeb_materialize;
  "snapshots/materializeb/modelTokenStats": typeof snapshots_materializeb_modelTokenStats;
  "snapshots/materializeb/uptimes": typeof snapshots_materializeb_uptimes;
  "snapshots/materializeb/utils": typeof snapshots_materializeb_utils;
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
