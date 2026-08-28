# Sandustry 0.5.5 Mod Format

> Source of truth: <https://sandustry.com/sandkit.html>
> Synced: 2026-08-28
> Target game version: Sandustry 0.5.5

Older local format notes are obsolete. If this document conflicts with the
official Sandkit page, use the official page.

## File structure

```text
example-mod/
├── modinfo.json         # required
├── main.js              # manifest.entry
├── worker.js            # manifest.workerEntry
├── patches.json         # manifest.patches (auto-loaded if present)
├── preview.png          # 512x512px, required for Workshop upload
├── workshop.json        # generated after the first upload (don't change!)
├── config/
│   └── drill.json       # manifest.configOverrides
├── shaders/
│   └── sky.glsl         # manifest.shaderOverrides
├── assets/
│   └── texture.png      # manifest.textureOverrides / provides
└── map/                 # manifest.map.blueprints
    ├── terrain.png      # required for maps
    ├── lights.png
    ├── sensors.png
    ├── authorization.png
    ├── wall.png
    ├── lights_meta.png
    ├── decor.png
    └── config.json
```

Repository-only source files such as `src/`, `spec/`, `package.json`, and the
publisher configuration under `workshop/` are not part of Sandustry's runtime
format.

## Minimal manifest

```json
{
  "manifestVersion": 1,
  "id": "author.example-mod",
  "name": "Example Mod",
  "version": "1.0.0",
  "apiVersion": 1,
  "entry": "main.js"
}
```

The complete official manifest additionally documents:

- `workerEntry`
- `patches`
- `description`
- `author`
- `gameVersion.minimum` and `gameVersion.maximum`
- `dependencies`
- `loadOrder`
- `configSchema` fields of type `number`, `boolean`, or `choice`
- `configOverrides`
- `shaderOverrides`
- `textureOverrides`
- `provides`
- `map`

See [API.md](API.md#mod-manifest) for the complete official example.

## Version compatibility

Sandustry 0.5.5 and newer can enforce compatibility at runtime with the
optional manifest `gameVersion` range:

```json
{
  "gameVersion": {
    "minimum": "0.5.5",
    "maximum": "0.5.9"
  }
}
```

Either bound may be omitted. Set `maximum` to `0.5.2` for an old release that
uses 0.5.2 bundle patches. Set `minimum` to `0.5.5` when a release depends on
the updated API. This runtime restriction is separate from the Steam Workshop
version link.

## Entrypoints

Sandustry injects `sandkit` directly into both manifest entrypoints:

```js
const api = sandkit.api; // Stable API

// Unstable engine escape hatch
const engineApi = sandkit.engine.api;
const engineState = sandkit.engine.state;
```

- `entry` runs on the main thread.
- `workerEntry` runs on manager and simulation worker threads.
- `sandkit.apiVersion` is currently `1`.
- `sandkit.enums` is available.
- `sandkit.react` exposes React 18 in the main entry only.

## Grid mutations

Main-entry grid mutations are deferred, so immediate reads still see the old
grid. Worker-entry mutations are immediate. Use `api.grid.mutate` when a main
entry needs state-dependent grid writes:

```js
api.grid.mutate((writer) => {
  if (api.terrains.isTypeAtCell(cellX, cellY, "ice")) {
    writer.elements.replaceAtCell(cellX, cellY, "water");
  }
});
```

## Compiled bundle patches

Supported patch targets are:

- `js/bundle.js`
- `js/manager-worker.js`
- `js/simulation-worker.js`
- `js/utility-worker.js`

Supported operations are `replace`, `remove`, `insertBefore`, `insertAfter`,
and `wrap`.

Compiled bundles change between releases. The official documentation warns
that patch-based mods will most likely break whenever Sandustry updates.

## Workshop files

For Sandustry 0.5.5, the official mod layout requires a root `preview.png` at
512x512 pixels for Workshop upload. Sandustry generates root `workshop.json`
after the first upload; do not edit that file.

The repository's `workshop/metadata.json`, `description.txt`, and preview
workflow is separate tooling, not part of the official Sandkit format. See
[WORKSHOP_PUBLISHING.md](WORKSHOP_PUBLISHING.md).
