# Snapshot v2 – **Input Layer Refactor**

> Scope = **everything from HTTP / archive read → validated array in Process**
>
> Goal = zero duplication, single-file ownership per entity, and clearer naming than “sources + validator”.

---

## 1. New Naming

| Old term | Problem | New term |
|----------|---------|----------|
| *source* | overlaps with Convex “Source tables”, foggy meaning | **Inlet** – *the thing that lets data in* |
| *validator* | doesn’t validate, only filters & logs | **Filter** |

`InletMap` = DI object injected into the Engine / Process.

```ts
interface InletMap {
  models(p?: void): Promise<Model[]>;
  endpoints(p: { permaslug:string; variant:string }): Promise<Endpoint[]>;
  // …other inlet fns
}
```

---

## 2. Single-File Registry Pattern

Every transform file already exports a Zod schema.  We extend it with a **registry entry** so ownership never splinters.

```ts
// convex/snapshots_v2/transforms/models.ts
export const models = z.object({ /* … */ })

export const MODELS_INLET: InletSpec<Model> = {
  key: 'models',
  schema: models,
  mode: InputMode.remote,          // default – may be overridden by factory

  remote: () => http('/api/frontend/models'),
  archive: () => getArchive('models'),
  toArray: (raw) => raw.data,
}
```

Repeat for endpoints, apps, …

Advantages:
1. **1-stop editing** when an API changes.
2. Registry is tree-shakable & type-safe because it lives next to the schema.

---

## 3. `InputMode` Enum

```ts
export enum InputMode {
  remote          = 'remote',          // fetch + store
  remoteNoStore   = 'remote-no-store', // fetch only (tests / dev)
  archive         = 'archive',         // read from previous snapshot
}
```

Factory decides which mode to pass to the builder.  Inside the inlet adapter:

* `remote`        → call `remote()` + `storeSnapshotData()`
* `remoteNoStore` → call `remote()` only
* `archive`       → call `archive()`

No branching sprinkled across code.

---

## 4. Generic `makeInlet()`

```ts
function makeInlet<O, P extends SrcParams>(
  spec: InletSpec<O,P>,
  ctx: ActionCtx,
  cfg: RunConfig,
  mode: InputMode,
  filter: Filter,
): (p: P) => Promise<O[]> {
  const { run_id, snapshot_at } = cfg

  return async (params: P) => {
    const raw = mode === InputMode.archive ?
      await spec.archive(params) : await spec.remote(params)

    if (mode === InputMode.remote && spec.key && cfg.store) {
      await storeSnapshotData(ctx, {
        run_id, snapshot_at, type: spec.key,
        params: spec.paramKey?.(params),
        data: raw,
      })
    }

    const good: O[] = []
    for (const item of spec.toArray(raw)) {
      const parsed = spec.schema.safeParse(item)
      parsed.success ? good.push(parsed.data)
                     : filter.add({...meta, error: parsed.error})
    }
    return good
  }
}
```

`Filter` interface shrinks to `add()` + `issues()`.
No `process()` method needed – the loop lives here.

---

## 5. Factory

```ts
export function createInlets(ctx:ActionCtx, cfg:RunConfig): InletMap {
  const useArchive   = !!cfg.replay_from
  const storeAllowed = cfg.mode === InputMode.remote
  const mode         = useArchive ? InputMode.archive
                     : storeAllowed ? InputMode.remote : InputMode.remoteNoStore
  const filter       = createFilter()

  const specs = [ MODELS_INLET, ENDPOINTS_INLET, APPS_INLET, … ]
  const map: any = {}
  for (const s of specs) {
    map[s.key] = makeInlet(s as any, ctx, cfg, mode, filter)
  }
  return map as InletMap
}
```

The Engine keeps a handle to the returned **filter** for metrics & logging.

---

## 6. File Layout

```
convex/snapshots_v2/
  transforms/
    models.ts             (schema + MODELS_INLET)
    endpoints.ts          (schema + ENDPOINTS_INLET)
    …
  inlet/
    InputMode.ts          (enum)
    makeInlet.ts          (generic builder)
    index.ts              (createInlets + exports InletMap, Filter)
```

We eliminate `sources/remote.ts`, `sources/archive.ts`, `sources/index.ts`.

---

## 7. API Touch Points

* Engine: `const { inlets, filter } = createInlets(ctx,cfg)`
* Process: `const models = await inlets.models()` – unchanged (just rename variable from `sources` → `inlets`).
* Metrics: `filter.issueCount()` etc.

Rename imports in `engine.ts`, `processes/standard_v2.ts`.

---

## 8. Migration Steps

1. Add `InputMode.ts`, `makeInlet.ts`.
2. Update every transform file with an `*_INLET` export.
3. Create `inlet/index.ts` that assembles everything.
4. Delete old `sources` folder & validator’s `process()` API; rename to `filter.ts` (keep functions minimal).
5. Fix imports in engine / process.
6. Run `bun check`.

---

This plan unifies fetch, storage, transform, and error-filtering in one declarative spec per entity while providing a single DI object (`InletMap`) the rest of the system already expects.
