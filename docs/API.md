# Sandkit 0.5.5 Reference

> Source of truth: <https://sandustry.com/sandkit.html>
> Synced: 2026-08-28
> Target game version: Sandustry 0.5.5

This file replaces the previous local API reference. APIs and formats absent
from the official 0.5.5 page must be treated as unsupported, even if an older
repository document or game build exposed them.

## Mod file structure

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

## Mod manifest

## `modinfo.json` minimal

```text
{
  "manifestVersion": 1,
  "id": "author.example-mod",
  "name": "Example Mod",
  "version": "1.0.0",
  "apiVersion": 1,
  "entry": "main.js"
}
```

## `modinfo.json` complete

```text
{
  "manifestVersion": 1,
  "id": "author.example-mod",
  "name": "Example Mod",
  "version": "1.0.0",
  "apiVersion": 1,
  "entry": "main.js",
  "workerEntry": "worker.js",
  "patches": "patches.json",
  "description": "Example description",
  "author": "Example author",
  "gameVersion": {
    "minimum": "0.5.0",
    "maximum": "0.5.9"
  },
  "dependencies": [],
  "loadOrder": 0,
  "configSchema": {
    "speed": {
      "type": "number",
      "default": 1,
      "min": 0.5,
      "max": 2,
      "step": 0.1,
      "label": "Speed",
      "labelKey": "mods|example|speed",
      "description": "Adjusts the speed.",
      "descriptionKey": "mods|example|speedDescription"
    },
    "enabled": {
      "type": "boolean",
      "default": true,
      "label": "Enabled"
    },
    "mode": {
      "type": "choice",
      "default": "balanced",
      "label": "Mode",
      "options": [
        { "value": "balanced", "label": "Balanced" },
        { "value": "fast", "labelKey": "mods|example|modeFast" }
      ]
    }
  },
  "configOverrides": {
    "drill": "config/drill.json"
  },
  "shaderOverrides": {
    "sky": "shaders/sky.glsl"
  },
  "textureOverrides": {
    "farm": {
      "path": "assets/texture.png",
      "frameWidth": 18,
      "frames": 6,
      "intervalMs": 166
    }
  },
  "provides": [
    {
      "kind": "structureTextures",
      "id": "industrial",
      "textureOverrides": {
        "pump": "assets/texture.png"
      }
    }
  ],
  "map": {
    "blueprints": {
      "terrain": "map/terrain.png",
      "lights": "map/lights.png",
      "sensors": "map/sensors.png",
      "authorization": "map/authorization.png",
      "wall": "map/wall.png",
      "lightsMeta": "map/lights_meta.png",
      "decor": "map/decor.png",
      "config": "map/config.json"
    },
    "width": 320,
    "height": 320,
    "spawn": { "x": 160, "y": 140 },
    "unstuck": { "x": 160, "y": 140 },
    "deployment": "skip",
    "topBounds": {
      "hard": 0,
      "soft": 100
    },
    "depthLight": {
      "startY": 640,
      "endY": 1280,
      "maxSize": 400,
      "minSize": 120
    },
    "parallax": {
      "widthScale": 1,
      "offsetY": 0
    },
    "colorMappings": {
      "38, 0, 0": {
        "background": "SandiumSoil",
        "foreground": "Obsidian"
      },
      "4, 5, 6": "GoldSoil"
    }
  }
}
```

## Accessing the API

`sandkit` is injected directly into `entry` and `workerEntry`.

```text
const api = sandkit.api; // Stable API

// Unstable engine escape hatch
const engineApi = sandkit.engine.api;
const engineState = sandkit.engine.state;
```

- `sandkit.apiVersion` - currently `1`.
- `sandkit.enums`
- `sandkit.react` - React 18 module in the main entry only.

## Mutations

**Main** entry grid mutations (elements, terrain etc) are deferred, so reads see the old grid. **Worker** entry grid mutations are immediate. For state-dependent grid writes, use `api.grid.mutate`:

```text
api.grid.mutate((writer) => {
  if (api.terrains.isTypeAtCell(cellX, cellY, "ice")) {
    writer.elements.replaceAtCell(cellX, cellY, "water");
  }
});
```

## Patching compiled JavaScript

## `patches.json` example

```text
[
  {
    "file": "js/bundle.js",
    "find": "const message = 'Hello';",
    "operation": "replace",
    "code": "const message = 'Hello from my mod';",
    "expectedMatches": 1
  },
  {
    "file": "js/simulation-worker.js",
    "regex": {
      "pattern": "const ([a-z]+) = false;"
    },
    "operation": "replace",
    "code": "const $1 = true;",
    "expectedMatches": 1
  },
  {
    "file": "js/bundle.js",
    "find": "doThing();",
    "operation": "wrap",
    "before": "if (enabled) { ",
    "after": " }",
    "expectedMatches": 1
  }
]
```

Available bundles:

- `js/bundle.js` - main renderer
- `js/manager-worker.js` - manager worker
- `js/simulation-worker.js` - simulation workers
- `js/utility-worker.js` - utility worker

Supported operations are `replace`, `remove`, `insertBefore`, `insertAfter`, and `wrap`.

Compiled bundles change between releases, so mods using patches will most likely break when the game is updated.

## Internal IDs and display names

Use internal legacy IDs in API calls:

- Advanced Filter: `filterRightMk2` / `filterLeftMk2` (`filterMk2` localization key)
- Conveyor Portal: `quantumPortal`
- Void Gun: `implosionGun`
- Voltblub: `eyes`
- Kinetic Press: `velocitySoaker`
  - Texture override: `velocity`
- Planter Box: `grower`
  - Texture override: `farm`
- Flux Emanator: `gloomEmitter`
  - Texture override: `gloom_emitter`
- Collector: `collector`
  - Texture override: `sell`
- Foundation: `foundation`
  - Texture override: `block`
- Delete: `demolisher`
  - Texture override: `x`
- Select & Move: `copier`
  - Texture override: `copy`
- Amethelis: `petalium`
- Snow: `freezingIce`
- Redsand: `sandium`
- Voidbloom: `gloom`
- Cinder: `basalt`

**Other quirks:**

- Toolbox: `player.inventory`

## Config overrides

### `config/transport.json` defaults

```text
{
  "conveyors": {
    "structures": {
      "conveyorLeft": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "belts", "run": "left" } },
      "conveyorRight": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "belts", "run": "right" } },
      "conveyorLeftMk2": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "beltsMk2", "run": "left" } },
      "conveyorRightMk2": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "beltsMk2", "run": "right" } },
      "burnerBeltLeft": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "belts", "run": "left" } },
      "burnerBeltRight": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "belts", "run": "right" } },
      "filterLeft": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "belts", "run": "left" } },
      "filterRight": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "belts", "run": "right" } },
      "filterLeftMk2": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "belts", "run": "left" } },
      "filterRightMk2": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "belts", "run": "right" } },
      "shakerLeft": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "shakers", "run": "left" } },
      "shakerRight": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "shakers", "run": "right" } },
      "clearingFrameLeft": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "clearingFrames", "run": "left" } },
      "clearingFrameRight": { "maxDisplacementCellsPerPass": 1, "schedule": { "pass": "clearingFrames", "run": "right" } }
    },
    "passes": {
      "belts": { "cadence": { "unit": "ms", "every": 332 }, "runOrder": ["right", "left"] },
      "beltsMk2": { "cadence": { "unit": "ms", "every": 166 }, "runOrder": ["right", "left"] },
      "shakers": { "cadence": { "unit": "ms", "every": 3333 }, "runOrder": ["right", "left"] },
      "clearingFrames": { "cadence": { "unit": "ms", "every": 1332 }, "runOrder": ["right", "left"] }
    }
  },
  "launchers": {
    "structures": {
      "launcherUp": { "velocityCellsPerSecond": { "x": 0, "y": -44.4 }, "softDropVelocityCellsPerSecond": { "x": 0, "y": -30 }, "schedule": { "pass": "standard" } },
      "launcherLeft": { "velocityCellsPerSecond": { "x": -44.4, "y": -44.4 }, "softDropVelocityCellsPerSecond": { "x": -30, "y": -30 }, "schedule": { "pass": "standard" } },
      "launcherRight": { "velocityCellsPerSecond": { "x": 44.4, "y": -44.4 }, "softDropVelocityCellsPerSecond": { "x": 30, "y": -30 }, "schedule": { "pass": "standard" } },
      "launcherUpMk2": { "velocityCellsPerSecond": { "x": 0, "y": -88.8 }, "softDropVelocityCellsPerSecond": { "x": 0, "y": -45 }, "schedule": { "pass": "mk2" } },
      "launcherLeftMk2": { "velocityCellsPerSecond": { "x": -88.8, "y": -88.8 }, "softDropVelocityCellsPerSecond": { "x": -45, "y": -45 }, "schedule": { "pass": "mk2" } },
      "launcherRightMk2": { "velocityCellsPerSecond": { "x": 88.8, "y": -88.8 }, "softDropVelocityCellsPerSecond": { "x": 45, "y": -45 }, "schedule": { "pass": "mk2" } }
    },
    "passes": {
      "standard": { "cadence": { "unit": "ms", "every": 683 } },
      "mk2": { "cadence": { "unit": "ms", "every": 341 } }
    }
  }
}
```

### `config/sprint.json` defaults

```text
{
  "drainRateMultiplier": 1,
  "drainDurationSeconds": 2.2,
  "regenDurationSeconds": 3.4,
  "horizontalMaxSpeedBonus": 240,
  "verticalMaxSpeedBonus": 180,
  "resumeMeterRatio": 1,
  "durationBonusRatioPerLevel": 0.5,
  "powerSpeedBonusMultiplier": 1.5
}
```

### `config/sky.json` defaults

```text
{
  "solidOverrideEnabled": false,
  "color": 0,
  "layerTint": "override"
}
```

### `config/laser.json` defaults

```text
{
  "energyCost": 60,
  "chargeMs": 1000,
  "maxRangeCells": 250,
  "patternSize": 7,
  "excavationPower": 1,
  "debrisEjectionSpeedPixelsPerSecond": 300,
  "beamColor": 16711680
}
```

### `config/implosionGun.json` defaults

```text
{
  "baseTankCapacity": 4000,
  "tankCapacityPerLevel": 2000,
  "maxShotPower": 200,
  "voidCostPerPower": 2,
  "chargePowerPerSecond": 110,
  "minPatternDiameterCells": 11,
  "maxPatternDiameterCells": 75,
  "minExcavationPower": 1,
  "maxExcavationPower": 80,
  "excavationPowerExponent": 2,
  "drillTierDamage": 1,
  "projectileSpeedPixelsPerSecond": 480,
  "upgrades": {
    "tankCapacity": {
      "costs": [500, 1000, 2000]
    }
  }
}
```

### `config/locator.json` defaults

```text
{
  "tankCapacity": 1000,
  "voidCostPerScan": 100,
  "voidDrainPerSecond": 80,
  "effectDurationMs": 5000,
  "outerTint": [0, 255, 255],
  "innerTint": [128, 0, 255],
  "upgrades": {
    "triangulationLens": {
      "costs": [2000]
    }
  }
}
```

### `config/vacuum.json` defaults

```text
{
  "intake": {
    "patternDiameterCells": 11,
    "nozzleDistanceCells": 8,
    "blowAwaySpeedCellsPerSecond": 120
  },
  "tanks": {
    "capacityByLevel": [500, 1000, 1500, 2000, 2500, 3000],
    "countByLevel": [2, 3, 4, 5, 6]
  },
  "spray": {
    "cooldownMs": 20,
    "maxElementsPerPulse": 11,
    "muzzleDistanceCells": 6,
    "speedCellsPerSecond": 240,
    "speedVariationRatio": {
      "min": 0.8,
      "max": 1.2
    },
    "spreadAngleRadians": 0.6,
    "positionSpreadPixels": 20
  },
  "upgrades": {
    "capacity": {
      "costs": [250, 500, 1000, 3000, 5000]
    },
    "tankCount": {
      "costs": [300, 1000, 3000, 5000]
    }
  }
}
```

## Types

### `sandkit.enums`

```text
sandkit.enums.CellType
sandkit.enums.ElementType
sandkit.enums.MatterType
sandkit.enums.StructureType
sandkit.enums.ItemType
sandkit.enums.ItemId
sandkit.enums.ProjectileType
sandkit.enums.ActionType
sandkit.enums.ActionState
sandkit.enums.AbilityType
sandkit.enums.ReloadType
sandkit.enums.ComponentId
sandkit.enums.KeyBinding
sandkit.enums.KeyState
sandkit.enums.BuildMode
sandkit.enums.BuildingClearance
sandkit.enums.AuthorizationType
sandkit.enums.DroneType
sandkit.enums.PickupType
sandkit.enums.Scene
sandkit.enums.Tech
sandkit.enums.TechStatus
```

- Deprecated alias: `sandkit.enums.WorldItemType`

## Main entry

### `api.constants`

#### `physics`

- `normal`: `0`
- `skip`: `1`
- `aggressiveSkip`: `2`

### `api.gameConfig`

#### `get(key)`

- `key`: `"namespace:path"`

- `getAll()`

#### Deprecated aliases

- `drill:maxRange` > `drill:maxRangeCells`
- `drill:normalExcavationRate` > `drill:normalExcavationChance`
- `drill:reducedExcavationRate` > `drill:reducedExcavationChance`

### `api.settings`

- `get(fieldId)`

- `getAll()`

#### `onChange(callback)`

- `callback(values)`

```text
const unsubscribe = api.settings.onChange((values) => {
  applySettings(values);
});
```

### `api.storage`

- `ensure(modId)`

- `get(modId, key)`

- `set(modId, key, value)`

- `remove(modId, key)`

- `local.get(key)`

- `local.set(key, value)`

- `local.remove(key)`

### `api.mods`

- `getProviders(kind)`

### `api.authorization`

- `canBuildAtCell(cellX, cellY)`

- `canGrabAtCell(cellX, cellY)`

- `canUseTool(player, isFlamethrower?)`

- `canUseToolAtCell(cellX, cellY, isFlamethrower?)`

- `getZoneIdAtCell(cellX, cellY)`

- `getPlayerZoneId()`

### `api.building`

- `getSnappedPositionAtCell(cellX, cellY)`

- `isBlockedAtCell(cellX, cellY)`

- `cancelPlacement()`

- `selectStructure(structureTypeOrId)`

### `api.camera`

- `snapToPlayer()`

- `setFocusAtWorld(worldX, worldY)`

#### `releaseFocus(options?)`

- `options.durationMs` (optional)

```text
const released = api.camera.releaseFocus({ durationMs: 250 });
```

### `api.collector`

- `getValueFromCellId(cellId)`

- `getValueByType(elementType)`

- `isCellIdCollectable(cellId)`

- `isCellIdCollectableForSprite(cellId)`

- `notifyPickupAtCell(cellX, cellY)`

### `api.discoveries`

- `addElementByType(elementType)`

- `addTerrainByType(terrainType)`

### `api.hooks`

#### `intercept(hookId, callback, options?)`

##### `item:use`

- `hookId`: `"item:use"`
- `callback(args, context)`
  - `args.itemId`
  - `args.useId`
  - `args.kind`: `"instant"` | `"sustained"` | `"chargeThenFire"`
  - `args.baseline` (read-only)
  - `args.prepared` (mutable)
  - `context.cancel()`
  - `context.cancelled`
- `options.itemIds`
- `options.priority`

```text
const unsubscribe = api.hooks.intercept(
  "item:use",
  (args, context) => {
    args.prepared.energyCost = Number(args.baseline.energyCost) * 2;

    if (args.prepared.energyCost > 1000) {
      context.cancel();
    }
  },
  { itemIds: ["laser"], priority: 0 },
);
```

##### `teleport:effect:create`

- `hookId`: `"teleport:effect:create"`
- `callback(args, context)`
- `options` (optional)
- Deprecated alias: `"teleport:effect"`

```text
api.hooks.intercept("teleport:effect:create", (args, context) => {
  context.cancel();
});
```

##### `action:start`

- `hookId`: `"action:start"`
- `callback(args, context)`
- `options` (optional)
- Deprecated alias: `"action:intercept"`

```text
api.hooks.intercept("action:start", (args, context) => {
  if (args.action?.id === "example") context.cancel();
});
```

##### `input:keyDown`

- `hookId`: `"input:keyDown"`
- `callback(args, context)`
- `options` (optional)
- Deprecated alias: `"input:keydown"`

```text
api.hooks.intercept("input:keyDown", (args, context) => {
  if (args.code === "KeyK") context.cancel();
});
```

##### `input:keyUp`

- `hookId`: `"input:keyUp"`
- `callback(args, context)`
- `options` (optional)
- Deprecated alias: `"input:keyup"`

```text
api.hooks.intercept("input:keyUp", (args, context) => {
  if (args.code === "KeyK") context.cancel();
});
```

##### `placePoints:suppress`

- `hookId`: `"placePoints:suppress"`
- `callback(args, context)`
- `options` (optional)
- Deprecated alias: `"placePoints:isSuppressed"`

```text
api.hooks.intercept("placePoints:suppress", (args, context) => {
  if (args.type === "exampleStructure") context.cancel();
});
```

##### `placePoints:directionalArrows:suppress`

- `hookId`: `"placePoints:directionalArrows:suppress"`
- `callback(args, context)`
- `options` (optional)
- Deprecated alias: `"placePoints:directionalArrows:isSuppressed"`

```text
api.hooks.intercept(
  "placePoints:directionalArrows:suppress",
  (args, context) => {
    if (args.type === "exampleStructure") context.cancel();
  },
);
```

##### `entity:update`

- `hookId`: `"entity:update"`
- `callback(args, context)`
  - `args.entityTypeId` (read-only)
  - `args.entity` (mutable)
  - `args.deltaTimeSeconds` (read-only)
  - `args.phase` (read-only): `"normal"` | `"capturing"` | `"launching"`
  - `args.isVisible` (read-only)
  - `args.playerWorldX` (read-only)
  - `args.playerWorldY` (read-only)
  - `args.worldMinX` (read-only)
  - `args.worldMinY` (read-only)
  - `args.worldMaxX` (read-only)
  - `args.worldMaxY` (read-only)
  - `args.cellSize` (read-only)
  - `args.timeSeconds` (read-only)
  - `context.cancel()`
  - `context.cancelled`
- `options.entityTypes`
- `options.priority`

```text
const unsubscribe = api.hooks.intercept(
  "entity:update",
  (args) => {
    if (args.phase !== "normal") return;
    args.entity.targetX = args.playerWorldX;
    args.entity.targetY = args.playerWorldY;
  },
  { entityTypes: ["lumling"], priority: 0 },
);
```

##### `building:place`

- `hookId`: `"building:place"`
- `callback(args, context)`
- `args.structureId`
- `args.x`
- `args.y`
- `args.data`
- `options.structureTypes` (optional)
- `options.priority` (optional)

```text
api.hooks.intercept("building:place", (args, context) => {
  if (args.structureId === "exampleStructure") context.cancel();
});
```

##### `building:clearShape`

- `hookId`: `"building:clearShape"`
- `callback(args, context)`
- `args.structure`
- `options` (optional)

```text
api.hooks.intercept("building:clearShape", (args, context) => {
  if (args.structure.data?.protected) context.cancel();
});
```

##### `input:scroll`

- `hookId`: `"input:scroll"`
- `callback(args, context)`
- `args.deltaY`
- `options` (optional)

```text
api.hooks.intercept("input:scroll", (args, context) => {
  if (args.deltaY !== 0) context.cancel();
});
```

##### `input:boostDown`

- `hookId`: `"input:boostDown"`
- `callback(args, context)`
- `options` (optional)
- Deprecated alias: `"input:boost-down"`

```text
api.hooks.intercept("input:boostDown", (args, context) => {
  context.cancel();
});
```

##### `input:descendDown`

- `hookId`: `"input:descendDown"`
- `callback(args, context)`
- `options` (optional)
- Deprecated alias: `"input:descend-down"`

```text
api.hooks.intercept("input:descendDown", (args, context) => {
  context.cancel();
});
```

##### `input:escape`

- `hookId`: `"input:escape"`
- `callback(args, context)`
- `options` (optional)

```text
api.hooks.intercept("input:escape", (args, context) => {
  context.cancel();
});
```

##### `interactable:suppressHover`

- `hookId`: `"interactable:suppressHover"`
- `callback(args, context)`
- `args.type`
- `args.structure`
- `options` (optional)

```text
api.hooks.intercept("interactable:suppressHover", (args, context) => {
  if (args.type === "exampleStructure") context.cancel();
});
```

##### `fire:element:ignite`

- `hookId`: `"fire:element:ignite"`
- `callback(args, context)`
- `args.x`
- `args.y`
- `args.elementType`
- `options` (optional)

```text
api.hooks.intercept("fire:element:ignite", (args, context) => {
  if (args.elementType === exampleElementType) context.cancel();
});
```

##### `projectile:fire:overStructure`

- `hookId`: `"projectile:fire:overStructure"`
- `callback(args, context)`
- `args.projectile`
- `args.x`
- `args.y`
- `options.projectileTypes` (optional)
- `options.priority` (optional)

```text
api.hooks.intercept(
  "projectile:fire:overStructure",
  (args, context) => {
    if (args.projectile.type === "exampleProjectile") context.cancel();
  },
);
```

##### `projectile:hit`

- `hookId`: `"projectile:hit"`
- `callback(args, context)`
- `args.projectile`
- `args.travelResult`
- `options.projectileTypes` (optional)
- `options.priority` (optional)

```text
api.hooks.intercept("projectile:hit", (args, context) => {
  if (args.projectile.type === "exampleProjectile") context.cancel();
});
```

##### `player:position:commit`

- `hookId`: `"player:position:commit"`
- `callback(args, context)`
- `args.previousWorldX`
- `args.previousWorldY`
- `args.proposedWorldX`
- `args.proposedWorldY`
- `args.velocityX`
- `args.velocityY`
- `options` (optional)

```text
api.hooks.intercept("player:position:commit", (args) => {
  args.velocityX *= 0.5;
  args.velocityY *= 0.5;
});
```

##### `progression:purchase`

- `hookId`: `"progression:purchase"`
- `callback(args, context)`
- `args.domain`: `"tech"` | `"upgrade"`
- `args.id`
- `args.itemId` (optional)
- `args.costs`
- `options` (optional)

```text
api.hooks.intercept("progression:purchase", (args, context) => {
  if (args.id === "exampleTech") context.cancel();
});
```

#### `modify(hookId, callback, options?)`

##### `excavation:prepare`

- `hookId`: `"excavation:prepare"`
- `callback(args)`
  - `args.sourceId` (read-only)
  - `args.sourceKind` (read-only): `"tool"` | `"projectile"` | `"structure"` | `"drone"`
  - `args.originCellX` (read-only)
  - `args.originCellY` (read-only)
  - `args.consumedVoid` (read-only)
  - `args.profileId` (mutable)
  - `args.patternDiameterCells` (mutable)
  - `args.drillTierDamage` (mutable)
- `options.priority`

```text
const unsubscribe = api.hooks.modify(
  "excavation:prepare",
  (args) => {
    if (args.sourceId !== "implosionGun") return;

    args.profileId = "example:voidGun";
    args.patternDiameterCells = 21;
    args.drillTierDamage = 8;
  },
  { priority: 0 },
);
```

##### `locator:scan:prepare`

- `hookId`: `"locator:scan:prepare"`
- `callback(args)`
  - `args.originWorldX` (read-only)
  - `args.originWorldY` (read-only)
  - `args.hasTarget` (mutable)
  - `args.targetCellX` (mutable)
  - `args.targetCellY` (mutable)
  - `args.outerTint` (mutable): [R, G, B]
  - `args.innerTint` (mutable): [R, G, B]
  - `args.noTargetToast` (mutable)
  - `args.noTargetToastKey` (mutable)
  - `args.triangulationLensOverride`: `true` | `false` | `null` (null is standard behavior)
- `options.priority`

```text
const unsubscribe = api.hooks.modify(
  "locator:scan:prepare",
  (args) => {
    const target = findNearestTarget(args.originWorldX, args.originWorldY);
    args.hasTarget = target !== null;

    if (!target) {
      args.noTargetToast = "No example target was found.";
      args.noTargetToastKey = "mods|example|noTarget";
      return;
    }

    args.targetCellX = target.cellX;
    args.targetCellY = target.cellY;
    args.outerTint[0] = 103;
    args.outerTint[1] = 232;
    args.outerTint[2] = 249;
    args.triangulationLensOverride = true;
  },
  { priority: 0 },
);
```

##### `vacuum:prepare`

- `hookId`: `"vacuum:prepare"`
- `callback(args)`
  - `args.nozzleCellX` (read-only)
  - `args.nozzleCellY` (read-only)
  - `args.targetCellX` (mutable)
  - `args.targetCellY` (mutable)
  - `args.pattern` (mutable)
- `options.priority`

```text
const vacuumPattern = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
];

const unsubscribe = api.hooks.modify(
  "vacuum:prepare",
  (args) => {
    const target = api.input.getMousePositionAtCell();
    args.targetCellX = target.x;
    args.targetCellY = target.y;
    args.pattern = vacuumPattern;
  },
  { priority: 0 },
);
```

##### `vacuum:element:prepare`

- `hookId`: `"vacuum:element:prepare"`
- `callback(args)`
  - `args.elementType` (read-only)
  - `args.matterType` (read-only)
  - `args.isTransportable` (read-only)
  - `args.collectable` (mutable)
  - `args.visibleInPicker` (mutable)
- `options.priority`

```text
const unsubscribe = api.hooks.modify(
  "vacuum:element:prepare",
  (args) => {
    if (args.matterType !== sandkit.enums.MatterType.Liquid) return;

    args.collectable = true;
    args.visibleInPicker = true;
  },
  { priority: 0 },
);
```

##### `player:movement:prepare`

- `hookId`: `"player:movement:prepare"`
- `callback(args)`
- `options` (optional)
- Deprecated alias: `"player:movement"`

```text
api.hooks.modify("player:movement:prepare", (args) => {
  args.horizontalMaxSpeed *= 1.25;
});
```

##### `building:placementLimit:prepare`

- `hookId`: `"building:placementLimit:prepare"`
- `callback(args)`
- `options` (optional)
- Deprecated alias: `"building:placementLimit"`
- Deprecated alias: `"building:placement-limit"`

```text
api.hooks.modify("building:placementLimit:prepare", (args) => {
  args.maxCount = args.maxCount === null ? 10 : args.maxCount + 10;
});
```

##### `fluxEmanator:processing:prepare`

- `hookId`: `"fluxEmanator:processing:prepare"`
- `callback(args)`
- `options` (optional)
- Deprecated alias: `"fluxEmanator:processing"`
- Deprecated alias: `"flux-emanator:processing"`

```text
api.hooks.modify("fluxEmanator:processing:prepare", (args) => {
  args.speedMultiplier *= 2;
});
```

##### `render:pipes:prepare`

- `hookId`: `"render:pipes:prepare"`
- `callback(args)`
- `options` (optional)
- Deprecated alias: `"render:pipes"`

```text
api.hooks.modify("render:pipes:prepare", (args) => {
  args.layer = "foreground";
});
```

##### `structures:moved:prepare`

- `hookId`: `"structures:moved:prepare"`
- `callback(args)`
- `args.moved`
- `args.failedToPlace`
- `options` (optional)

```text
api.hooks.modify("structures:moved:prepare", (args) => {
  prepareMovedStructures(args.moved, args.failedToPlace);
});
```

##### `structures:removed:prepare`

- `hookId`: `"structures:removed:prepare"`
- `callback(args)`
- `args.removed`
- `args.structures` (optional)
- `args.byMove`
- `options` (optional)

```text
api.hooks.modify("structures:removed:prepare", (args) => {
  prepareRemovedStructures(args.removed, args.byMove);
});
```

##### `weapon:reload:prepare`

- `hookId`: `"weapon:reload:prepare"`
- `callback(args)`
- `args.weaponId`
- `args.reloadMs`
- `args.maxAmmo`
- `options.weaponIds` (optional)
- `options.priority` (optional)

```text
api.hooks.modify("weapon:reload:prepare", (args) => {
  args.reloadMs *= 0.8;
}, { weaponIds: ["exampleWeapon"] });
```

##### `projectile:travel:prepare`

- `hookId`: `"projectile:travel:prepare"`
- `callback(args)`
- `args.projectileType`
- `args.firstCollisionStep`
- `args.maxCollisionSteps`
- `args.collidesWithTerrain`
- `args.collidesWithStructures`
- `options.projectileTypes` (optional)
- `options.priority` (optional)

```text
api.hooks.modify("projectile:travel:prepare", (args) => {
  args.collidesWithStructures = false;
}, { projectileTypes: ["exampleProjectile"] });
```

##### `projectile:impact:prepare`

- `hookId`: `"projectile:impact:prepare"`
- `callback(args)`
- `args.projectileType`
- `args.impactKind`
- `args.profileId`
- `args.power`
- `args.centerPower`
- `args.radiusCells`
- `options.projectileTypes` (optional)
- `options.priority` (optional)
- Deprecated alias: `args.radius`

```text
api.hooks.modify("projectile:impact:prepare", (args) => {
  args.radiusCells = 8;
}, { projectileTypes: ["exampleProjectile"] });
```

##### `player:collision:prepare`

- `hookId`: `"player:collision:prepare"`
- `callback(args)`
- `args.phaseThroughTerrain`
- `args.phaseThroughStructures`
- `args.maxStepCells`
- `options` (optional)

```text
api.hooks.modify("player:collision:prepare", (args) => {
  args.maxStepCells = 4;
});
```

##### `trigger:schedule:prepare`

- `hookId`: `"trigger:schedule:prepare"`
- `callback(args)`
- `args.triggerId`
- `args.intervalMs`
- `args.sequentialRuns`
- `options.triggerIds` (optional)
- `options.priority` (optional)

```text
api.hooks.modify("trigger:schedule:prepare", (args) => {
  args.intervalMs *= 0.5;
}, { triggerIds: ["pump"] });
```

##### `progression:cost:prepare`

- `hookId`: `"progression:cost:prepare"`
- `callback(args)`
- `args.domain`: `"tech"` | `"upgrade"`
- `args.id`
- `args.itemId` (optional)
- `args.currencyId`
- `args.amount`
- `options` (optional)

```text
api.hooks.modify("progression:cost:prepare", (args) => {
  if (args.currencyId === "gold") args.amount *= 0.9;
});
```

##### `resource:collection:prepare`

- `hookId`: `"resource:collection:prepare"`
- `callback(args)`
- `args.resourceId`
- `args.sourceKind`
- `args.cellX`
- `args.cellY`
- `args.amount`
- `args.feedback`: `"default"` | `"silent"`
- `options.resourceIds` (optional)
- `options.priority` (optional)

```text
api.hooks.modify("resource:collection:prepare", (args) => {
  args.amount *= 2;
}, { resourceIds: ["fluxite"] });
```

##### `resource:delivery:prepare`

- `hookId`: `"resource:delivery:prepare"`
- `callback(args)`
- `args.resourceId`
- `args.sourceKind`
- `args.sourceId`
- `args.sourceCellX`
- `args.sourceCellY`
- `args.targetCellX`
- `args.targetCellY`
- `args.mode`: `"world"` | `"collection"`
- `args.amount`
- `args.feedback`: `"default"` | `"silent"`
- `options.resourceIds` (optional)
- `options.priority` (optional)

```text
api.hooks.modify("resource:delivery:prepare", (args) => {
  args.mode = "collection";
}, { resourceIds: ["fluxite"] });
```

##### `resource:balance:prepare`

- `hookId`: `"resource:balance:prepare"`
- `args.resourceId` (read-only)
- `args.balance`

```text
api.hooks.modify("resource:balance:prepare", (args) => {
  args.balance += api.storage.get("example", "gold") ?? 0;
}, { resourceIds: ["gold"] });
```

##### `gold:removal:prepare`

- `hookId`: `"gold:removal:prepare"`
- `args.requestedAmount` (read-only)
- `args.shortfall`

```text
api.hooks.modify("gold:removal:prepare", (args) => {
  const banked = api.storage.get("example", "gold") ?? 0;
  args.shortfall = Math.max(0, args.shortfall - banked);
});
```

##### `gold:removal:settle`

- `hookId`: `"gold:removal:settle"`
- `args.requestedAmount`, `args.physicalRemoved` (read-only)
- `args.shortfall`

```text
api.hooks.modify("gold:removal:settle", (args) => {
  const banked = api.storage.get("example", "gold") ?? 0;
  const covered = Math.min(banked, args.shortfall);
  api.storage.set("example", "gold", banked - covered);
  args.shortfall -= covered;
});
```

### `api.events`

#### `on(eventId, callback)`

##### `item:used`

- `eventId`: `"item:used"`
- `callback(payload)`
  - `payload.itemId`
  - `payload.useId`
  - `payload.kind`
  - `payload.cellX`
  - `payload.cellY`
  - `payload.prepared` (read-only)

```text
const unsubscribe = api.events.on("item:used", (payload) => {
  if (payload.itemId !== "laser") return;

  spawnSparklesAtCell(payload.cellX, payload.cellY);
});
```

##### `frame:render`

- `eventId`: `"frame:render"`
- `callback(payload)`

```text
api.events.on("frame:render", () => {
  drawOverlay();
});
```

##### `scene:game:started`

- `eventId`: `"scene:game:started"`
- `callback(payload)`
- Deprecated alias: `"scene:started:game"`

```text
api.events.on("scene:game:started", () => {
  initializeGameScene();
});
```

##### `earlyAccess:completed`

- `eventId`: `"earlyAccess:completed"`
- `callback(payload)`
- Deprecated alias: `"earlyAccess:complete"`

```text
api.events.on("earlyAccess:completed", (payload) => {
  onEarlyAccessCompleted(payload);
});
```

##### `terrain:destroyed`

- `eventId`: `"terrain:destroyed"`
- `callback(payload)`
- `payload.cellX`
- `payload.cellY`
- `payload.cellType`
- Deprecated alias: `payload.x` and `payload.y`

```text
api.events.on("terrain:destroyed", (payload) => {
  onTerrainDestroyed(payload.cellX, payload.cellY, payload.cellType);
});
```

##### `fog:cellRevealed`

- `eventId`: `"fog:cellRevealed"`
- `callback(payload)`
- `payload.cellX`
- `payload.cellY`
- Deprecated alias: `payload.x` and `payload.y`

```text
api.events.on("fog:cellRevealed", (payload) => {
  onFogCellRevealed(payload.cellX, payload.cellY);
});
```

##### `upgrade:levelSelected`

- `eventId`: `"upgrade:levelSelected"`
- `callback(payload)`
  - `payload.itemId`
  - `payload.upgradeId`
  - `payload.level`

```text
api.events.on("upgrade:levelSelected", (payload) => {
  onLevelSelected(payload.itemId, payload.upgradeId, payload.level);
});
```

##### `building:placed`

- `eventId`: `"building:placed"`
- `callback(payload)`
- `payload.structure`
- `payload.x`
- `payload.y`
- `payload.isBatch`
- `payload.isCopied`

```text
api.events.on("building:placed", (payload) => {
  onBuildingPlaced(payload.structure, payload.x, payload.y);
});
```

##### `building:removed`

- `eventId`: `"building:removed"`
- `callback(payload)`
- `payload.structureId`
- `payload.x`
- `payload.y`
- `payload.isBatch`

```text
api.events.on("building:removed", (payload) => {
  onBuildingRemoved(payload.structureId, payload.x, payload.y);
});
```

##### `structures:placed`

- `eventId`: `"structures:placed"`
- `callback(payload)`
- `payload.structures`

```text
api.events.on("structures:placed", (payload) => {
  onStructuresPlaced(payload.structures);
});
```

##### `structures:removed`

- `eventId`: `"structures:removed"`
- `callback(payload)`
- `payload.removed`
- `payload.structures` (optional)
- `payload.byMove`

```text
api.events.on("structures:removed", (payload) => {
  onStructuresRemoved(payload.removed, payload.byMove);
});
```

##### `structures:moved`

- `eventId`: `"structures:moved"`
- `callback(payload)`
- `payload.moved`
- `payload.failedToPlace`

```text
api.events.on("structures:moved", (payload) => {
  onStructuresMoved(payload.moved, payload.failedToPlace);
});
```

##### `game:ready`

- `eventId`: `"game:ready"`
- `callback(payload)`

```text
api.events.on("game:ready", () => {
  initializeExample();
});
```

##### `game:started`

- `eventId`: `"game:started"`
- `callback(payload)`

```text
api.events.on("game:started", () => {
  startExample();
});
```

##### `tutorial:stepChanged`

- `eventId`: `"tutorial:stepChanged"`
- `callback(payload)`
- `payload.step`

```text
api.events.on("tutorial:stepChanged", (payload) => {
  onTutorialStepChanged(payload.step);
});
```

##### `tutorial:completed`

- `eventId`: `"tutorial:completed"`
- `callback(payload)`
- `payload.skipped`

```text
api.events.on("tutorial:completed", (payload) => {
  onTutorialCompleted(payload.skipped);
});
```

##### `tech:unlocked`

- `eventId`: `"tech:unlocked"`
- `callback(payload)`
- `payload.techId`
- `payload.suppressMusic`

```text
api.events.on("tech:unlocked", (payload) => {
  onTechUnlocked(payload.techId, payload.suppressMusic);
});
```

##### `worldItem:pickedUp`

- `eventId`: `"worldItem:pickedUp"`
- `callback(payload)`
- `payload.worldItemId`
- `payload.type`

```text
api.events.on("worldItem:pickedUp", (payload) => {
  onPickup(payload.worldItemId, payload.type);
});
```

##### `resource:collected`

- `eventId`: `"resource:collected"`
- `callback(payload)`
- `payload.resourceId`
- `payload.amount`
- `payload.sourceKind`
- `payload.cellX`
- `payload.cellY`

```text
api.events.on("resource:collected", (payload) => {
  onResourceCollected(payload.resourceId, payload.amount);
});
```

- `emit(eventId, payload)`

### `api.assets`

- `getUrl(relativePath)`

- `getSelectedProvider(kind)`

#### `setSelectedProvider(kind, providerId)`

- Deprecated alias: `selectProvider(kind, providerId)`

### `api.effects`

#### `createDistortionWaveAtWorld(worldX, worldY, options?)`

```text
api.effects.createDistortionWaveAtWorld(worldX, worldY, {
  style: "implode",
});
```

#### `createAtWorld(effectId, worldX, worldY, options?)`

- Deprecated alias: `createEffectAtWorld(effectId, worldX, worldY, options?)`

- `createLaserAtWorld(startWorldX, startWorldY, endWorldX, endWorldY, options?)`

#### `createParticlesAtWorld(worldX, worldY, options?)`

```text
api.effects.createParticlesAtWorld(worldX, worldY, {
  count: 12,
});
```

### `api.energy`

#### `registerType(structureId, type, options?)`

- `type`: `"conductor"` | `"storage"`

- `addAtCell(cellX, cellY, amount, options?)`

- `consume(amount, options?)`

- `consumeExcludingNetworkAtCell(cellX, cellY, amount)`

#### `getNetworkAtCell(cellX, cellY)`

- `entry.cellX`
- `entry.cellY`
- `entry.type`
- Deprecated alias: `entry.x` and `entry.y`

```text
const network = api.energy.getNetworkAtCell(cellX, cellY);
for (const entry of network) {
  useNetworkCell(entry.cellX, entry.cellY, entry.type);
}
```

- `getNetworkFreeCapacityAtCell(cellX, cellY)`

### `api.input`

#### `registerBinding(bindingId, defaultKeys, definition)`

- `definition.displayName` `definition.displayNameKey` `definition.displayNameParams` `definition.subsection` (optional)

```text
api.input.registerBinding("ExampleToggle", ["KeyO"], {
  displayName: "Toggle example",
  displayNameKey: "mods|example|toggle",
  subsection: {
    title: "Example controls",
    titleKey: "mods|example|controlsTitle",
    description: "Bindings installed by the example mod.",
    descriptionKey: "mods|example|controlsDescription",
  },
  handlers: { down: toggleExample },
});
```

#### `getMousePositionAtCell()`

- Deprecated alias: `getMouseCellPosition()`

- `getMousePositionAtWorld()`

- `getBoundKeys(bindingId)`

- `getDisplayKey(bindingId, defaultLabel?)`

- `triggerBinding(bindingId)`

- `pressBinding(bindingId)`

- `releaseBinding(bindingId)`

- `resetMouseState()`

- `isCtrlHeld()`

- `isAltHeld()`

### `api.items`

#### `createById(itemId)`

- Deprecated alias: `createFromId(itemId)`

- `getRegisteredIds()`

- `spriteMounts`

- `register(definition)`

#### `updateDefinition(itemId, partial)`

```text
api.items.updateDefinition("exampleTool", {
  name: "Updated Example Tool",
});
```

- `getDefinitionById(itemId)`

- `getActive()`

- `isActiveById(itemId, itemType?)`

### `api.patterns`

- `createCircle(diameterCells)`

#### `excavateAtCell(cellX, cellY, pattern, outVelocity, power, options?)`

```text
api.patterns.excavateAtCell(
  cellX,
  cellY,
  api.patterns.createCircle(5),
  { x: 0, y: -120 },
  2,
);
```

### `api.player`

#### `getPositionAtWorld()`

- Deprecated alias: `getWorldPosition()`

#### `setPositionAtWorld(worldX, worldY)`

- Deprecated alias: `setWorldPosition(worldX, worldY)`

- `setVelocity(velocityX, velocityY)`

- `setMovementSpeedMultiplier(multiplier)`

#### `setMovementMode(mode)`

- `mode`: `"normal"` | `"hover"`

- `isOnGround()`

- `teleportToGround()`

- `isCollidingWithCell(cellX, cellY)`

- `isWithinRadiusOfCell(cellX, cellY, radiusCells)`

#### `isPositionClearAtWorld(worldX, worldY)`

- Deprecated alias: `isWorldPositionClear(worldX, worldY)`

#### `inventory.hasById(itemId)`

- `itemId`: `ItemId | string`

#### `inventory.addById(itemId)`

- `itemId`: `ItemId | string`
- Deprecated alias: `inventory.addFromId(itemId)`

### `api.progression`

#### `complete({ domain: "tutorial", grantNormalUnlocks? } | { domain: "objective", id })`

```text
const completed = api.progression.complete({
  domain: "objective",
  id: "all",
});
```

### `api.projectiles`

- `register(definition)`

- `getDefinitionById(projectileId)`

#### `createBlueprintById(projectileId)`

- Deprecated alias: `createBlueprintFromId(projectileId)`

- `getAll()`

- `getById(projectileId)`

- `remove(projectile)`

- `spawnAtWorld(worldX, worldY, angleRadians, blueprint)`

### `api.random`

- `int(min, max)`

- `float(min, max)`

### `api.raycast`

#### `castAtWorld(startWorldX, startWorldY, angleRadians, maxDistanceWorldPixels)`

- `result.cellX`
- `result.cellY`
- `result.distanceWorldPixels`
- Deprecated alias: `castFromWorld(startWorldX, startWorldY, angleRadians, maxDistanceWorldPixels)`
- Deprecated alias: `result.x`, `result.y`, and `result.distance`

### `api.sprites`

- `load(spriteId, path, options?)`

- `loadFromMod(spriteId, relativePath, options?)`

- `getById(spriteId)`

#### `hideAllForPlayer()`

- Deprecated alias: `hideAllPlayerModSprites()`

#### `rotateAllForPlayer(angleRadians)`

- Deprecated alias: `rotatePlayerModSprites(angleRadians)`

### `api.time`

#### `getElapsedMs()`

- Deprecated alias: `getTimeMs()`

- `getTick()`

### `api.ui`

- `update(componentId, options?)`

- `openPauseMenu()`

- `showTooltip(data)`

#### `toast(message, options?)`

```text
api.ui.toast({ key: "mods|example|saved" });
```

#### `alert(message, title?)`

```text
await api.ui.alert(
  { key: "mods|example|details" },
  { key: "mods|example|title" },
);
```

#### `confirm(message, title?)`

```text
const confirmed = await api.ui.confirm(
  { key: "mods|example|confirm" },
);
```

#### `prompt(message, defaultValue?, placeholder?, title?, allowCopy?)`

```text
const value = await api.ui.prompt(
  { key: "mods|example|enterValue" },
  "",
);
```

#### `select(options, opts?)`

- `options[].label`
- `options[].value`
- `opts.message?`
- `opts.title?`
- `opts.defaultValue?`
- `opts.buttonLabel?`

```text
const selected = await api.ui.select(
  [
    { label: "Sand", value: "sand" },
    { label: "Fluxite", value: "fluxite" },
  ],
  { title: "Select element", defaultValue: "sand", buttonLabel: "Choose" },
);
```

- `useRefresh(componentIds)`

- `useScale()`

#### `useGameEvent(eventId, handler)`

- `handler(payload)`

```text
api.ui.useGameEvent("resource:collected", (payload) => {
  console.log(payload.resourceId, payload.amount);
});
```

- `inject(componentId, Component)`

#### `regions`

##### `mount(regionId, mountId, options)`

- `options.placement?`: `"raised"` | `"docked"`
  - Not a fan of this naming but `"docked"` puts it right on top of the hotbar (between it and panels such as Filter Config) while `"raised"` puts it above those panels. Let me know ifyou can think of a better naming scheme.
- `options.order?`
- `options.render()`
- Deprecated alias: `api.ui.overlays.register(slot, overlayId, render)`

```text
const mountHandle = api.ui.regions.mount(
  "hotbar",
  "extra-actions",
  {
    placement: "docked",
    order: 0,
    render: () => sandkit.react.createElement(ExtraActions),
  },
);
```

###### `mountHandle.update(options)`

- `options.placement?`: `"raised"` | `"docked"`
- `options.order?`
- `options.render?`
- Deprecated alias: `api.ui.overlays.update(slot)`

```text
mountHandle.update({
  order: 10,
  render: () => sandkit.react.createElement(UpdatedActions),
});
```

###### `mountHandle.unmount()`

- Deprecated alias: `api.ui.overlays.unregister(slot, overlayId)`

##### `setVisible(regionId, visible)`

- `visibilityHandle.restore()`

#### `overrides`

##### `register(componentId, wrapper)`

- `wrapper(Original, props)`

```text
const overrideHandle = api.ui.overrides.register(
  "resources",
  (Original) => sandkit.react.createElement(
    sandkit.react.Fragment,
    null,
    sandkit.react.createElement(Original),
    sandkit.react.createElement(ResourceAddon),
  ),
);
```

- `overrideHandle.remove()`

#### `hotbar`

##### `createBankSource(options)`

- `options.bankOffset`
- `options.minimumBankCount?`

```text
const source = api.ui.hotbar.createBankSource({
  bankOffset: 1,
  minimumBankCount: 2,
});
```

- `source.isAvailable()`

- `source.getBankIndex()`

- `source.getSlotCount()`

- `source.getAction(slotIndex)`

- `source.activateSlot(slotIndex)`

- `source.clearSlot(slotIndex)`

- `source.dispose()`

- `selectAction(action)`

- `getBankCount()`

- `getActiveBankIndex()`

- `getActiveSlotIndex()`

- `getSlotKeyLabel(bindingId)`

##### `useHotbar()`

```text
const hotbar = api.ui.hotbar.useHotbar();
console.log(
  hotbar.bankCount,
  hotbar.activeBankIndex,
  hotbar.activeSlotIndex,
);
```

#### `components`

##### `ActionSlot(props)`

- `props.source`
- `props.slotIndex`
- `props.action`
- `props.keyLabel?`
- `props.active?`
- `props.onSelect?`
- `props.onClear?`

```text
const slot = sandkit.react.createElement(
  api.ui.components.ActionSlot,
  { source, slotIndex: 0, keyLabel: "1" },
);
```

##### `Panel(props)`

- `props.title?`
- `props.children`
- `props.className?`
- `props.style?`

```text
const panel = sandkit.react.createElement(
  api.ui.components.Panel,
  { title: "Options" },
  "Panel content",
);
```

##### `Button(props)`

- `props.children`
- `props.active?`
- `props.border?`: `true` | `false`
- `props.disabled?`
- `props.small?`
- `props.variant?`: `"primary"` | `"danger"`
- `props.className?`
- `props.style?`
- `props.onClick?`

```text
const button = sandkit.react.createElement(
  api.ui.components.Button,
  { onClick: openPanel },
  "Open",
);
```

#### `navigation`

##### `useFocusable(options)`

```text
const focusable = api.ui.navigation.useFocusable({
  id: "example-button",
  scope: "example-scope",
  onActivate: openExample,
});
```

##### `useFocusScope(options)`

```text
api.ui.navigation.useFocusScope({
  id: "example-scope",
  active: true,
  priority: 10,
});
```

##### `getControllerFocusClass(focused)`

- Deprecated alias: `controllerFocusClass(focused)`

### `api.utils`

- `getDistance(pointA, pointB)`

- `getDirection(pointA, pointB)`

- `getAngle(pointA, pointB)`

#### `getCoordinatesBetweenCells(pointA, pointB)`

- Deprecated alias: `getCoordinatesBetweenPoints(pointA, pointB)`

### `api.action`

- `getActive()`

- `getSelected()`

#### `setCustomData(data)`

```text
api.action.setCustomData({ mode: "example" });
```

### `api.scene`

- `getActive()`

### `api.cooldown`

#### `start(cooldown)`

- Deprecated alias: `check(cooldown, durationOverrideMs?)`

- `isReady(cooldown, durationOverrideMs?)`

### `api.elements`

- `getRegisteredTypes()`

- `register(definition)`

#### `updateDefinition(elementTypeOrId, partial)`

- `elementTypeOrId`: `ElementType | string`

```text
api.elements.updateDefinition("exampleElement", {
  showInFilterPicker: false,
});
```

#### `addInteractionInfo(elementTypeOrId, interaction)`

- `elementTypeOrId`: `ElementType | string`

#### `getTypeById(elementId)`

- Deprecated alias: `getTypeFromId(elementId)`

- `getIdByType(elementType)`

- `getNameByType(elementType)`

- `getDefinitionByType(elementType)`

- `getTypeAtCell(cellX, cellY)`

- `getResolvedTypeAtCell(cellX, cellY)`

- `getResolvedTypeFromCellId(cellId)`

- `getInfoAtCell(cellX, cellY)`

- `getMatterTypeAtCell(cellX, cellY)`

#### `isTypeAtCell(cellX, cellY, elementTypeOrId)`

- `elementTypeOrId`: `ElementType | string`

- `isFreeFallingAtCell(cellX, cellY)`

- `findFreeCellInStructure(structureCellX, structureCellY, structureSizeCells)`

#### `createAtCell(cellX, cellY, elementTypeOrId, options?)`

- `elementTypeOrId`: `ElementType | string`
- Deprecated alias: `createAtCellWhenIdle(cellX, cellY, elementTypeOrId, options?)`

```text
api.elements.createAtCell(cellX, cellY, "water", {
  durationTicks: 60,
});
```

#### `replaceAtCell(cellX, cellY, elementTypeOrId, options?)`

- `elementTypeOrId`: `ElementType | string`
- Deprecated alias: `replaceAtCellWhenIdle(cellX, cellY, elementTypeOrId, options?)`

#### `removeAtCell(cellX, cellY, options?)`

- Deprecated alias: `removeAtCellWhenIdle(cellX, cellY, options?)`

#### `teleportBetweenCells(fromCellX, fromCellY, toCellX, toCellY)`

- Deprecated alias: `teleportBetweenCellsWhenIdle(fromCellX, fromCellY, toCellX, toCellY)`

- `getVelocityAtCell(cellX, cellY)`

#### `setVelocityAtCell(cellX, cellY, velocity)`

- Deprecated alias: `setVelocityAtCellWhenIdle(cellX, cellY, velocity)`

```text
api.elements.setVelocityAtCell(cellX, cellY, { x: 0, y: -120 });
```

#### `addParticleVelocityAtCell(cellX, cellY, velocity, maxSpeedCellsPerSecond?)`

- Deprecated alias: `addParticleVelocityAtCellWhenIdle(cellX, cellY, velocity, maxSpeedCellsPerSecond?)`

```text
api.elements.addParticleVelocityAtCell(
  cellX,
  cellY,
  { x: 4, y: -8 },
  120,
);
```

#### `convertToParticleAtCell(cellX, cellY, velocity)`

- Deprecated alias: `convertToParticleAtCellWhenIdle(cellX, cellY, velocity)`

```text
api.elements.convertToParticleAtCell(
  cellX,
  cellY,
  { x: 0, y: -120 },
);
```

#### `convertFromParticleAtCell(cellX, cellY)`

- Deprecated alias: `convertFromParticleAtCellWhenIdle(cellX, cellY)`

- `getDataFieldAtCell(cellX, cellY, dataFieldNumber)`

#### `setDataFieldAtCell(cellX, cellY, dataFieldNumber, value)`

- Deprecated alias: `setDataFieldAtCellWhenIdle(cellX, cellY, dataFieldNumber, value)`

#### `refreshColorAtCell(cellX, cellY)`

- Deprecated alias: `refreshColorAtCellWhenIdle(cellX, cellY)`

#### `setPhysicsAtCell(cellX, cellY, physicsState)`

- Deprecated alias: `setPhysicsAtCellWhenIdle(cellX, cellY, physicsState)`

#### `setDurationAtCell(cellX, cellY, durationTicks, options?)`

- Deprecated alias: `setDurationAtCellWhenIdle(cellX, cellY, durationTicks, options?)`

```text
api.elements.setDurationAtCell(
  cellX,
  cellY,
  120,
  { updateMax: true },
);
```

#### `options.durationTicks`

- `durationTicks`: `number` (optional)
  - Deprecated alias: `duration`

```text
api.elements.createAtCell(cellX, cellY, "steam", {
  durationTicks: 120,
});
```

### `api.entities`

- `getById(entityId)`

- `getAllByType(entityTypeId)`

- `spawnAtWorld(entityTypeId, worldX, worldY)`

- `remove(entityId)`

- `launch(entityId, angleRadians, speed?)`

- `startCapture(entityId)`

- `collect(entityId)`

### `api.fire`

- `canBurnElementAtCell(cellX, cellY)`

#### `burnElementAtCell(cellX, cellY)`

- Deprecated alias: `burnElementAtCellWhenIdle(cellX, cellY)`

### `api.i18n`

#### `t(key, params?)`

```text
const message = api.i18n.t("mods|example|count", {
  count: 3,
});
```

#### `register(locale, translations)`

```text
api.i18n.register("en", {
  "mods|example|title": "Example",
});
```

- `getLocale()`

- `hasTranslation(key, locale?)`

- `setLocale(locale)`

- `getLanguages()`

- `getAvailableLocales()`

#### `formatNumber(value, options?)`

```text
const formatted = api.i18n.formatNumber(1234.5, {
  maximumFractionDigits: 1,
});
```

#### `getName(definition)` / `getDescription(definition)`

```text
const name = api.i18n.getName({
  name: "Example Machine",
  nameKey: "structures|exampleMachine|name",
});
```

#### `joinKey(...parts)`

- Deprecated alias: `key(...parts)`

#### `createTranslatable(key, fallback)`

- Deprecated alias: `translatable(key, fallback)`

- `setGlobal(key, value)`

- `getGlobal(key)`

#### `removeGlobal(key)`

- Deprecated alias: `clearGlobal(key)`

- `getGlobals()`

- `formatKeyForDisplay(keyCode)`

### `api.resources`

- `collectFluxiteAtCell(cellX, cellY)`

- `refresh(resourceId)`

#### `adjustEnergy(amount, options?)`

- Deprecated alias: `updateEnergy(amount, options?)`

```text
api.resources.adjustEnergy(100, { deferUi: true });
```

### `api.structureBehaviors`

#### `registerConveyorType(structureId, options?)`

- `options.transportOffset` (optional)
- `options.velocity` (optional)
- `options.maxTransportDistance` (optional)
- `options.transportHeight` (optional)
- `options.runWith` (optional): `"left"` | `"right"`
- `options.skipQueued` (optional)

```text
api.structureBehaviors.registerConveyorType(
  "exampleConveyor",
  { runWith: "right" },
);
```

#### `registerLauncherType(definition)`

- `definition.upType`
- `definition.leftType`
- `definition.rightType`
- `definition.velocity`
- `definition.softDropVelocity`
- `definition.runTickSharedBufferKey` (optional)

### `api.signals`

#### `targets.register(structureTypeOrId, apply)`

- `payload.combined`
- `payload.inputCount`
- `payload.onCount`

```text
api.signals.targets.register("exampleMachine", (structure, payload) => {
  api.structures.processing.setEnabledAtCell(structure.x, structure.y, payload.combined);
});
```

#### `interactables.register(structureTypeOrId, handler)`

- `handler(structure)`

```text
api.signals.interactables.register("exampleLever", (structure) => {
  structure.data.on = !structure.data.on;
  api.structures.update(structure);
});
```

#### `registerSenderType(structureId, getOutput?)`

```text
api.signals.registerSenderType("exampleSensor", (structure) => {
  return structure.data.charge >= structure.data.threshold;
});
```

#### `setOutputAtCell(cellX, cellY, on)`

```text
api.structures.forEachOfType("exampleSensor", (structure) => {
  api.signals.setOutputAtCell(structure.x, structure.y, structure.data.active);
});
```

### `api.structures`

#### `recipes.register(id, definition)`

```text
api.structures.recipes.register("kineticPress", {
  input: "sand",
  outputs: [
    { elementType: "compressedSand", chance: 1 },
  ],
  minimumDownwardVelocityCellsPerSecond: 20,
});
```

#### `register(definition, options?)`

- `definition.buildModes[].spanTiles` (optional)

```text
api.structures.register({
  id: "exampleJunction",
  name: "Example Junction",
  nameKey: "structures|exampleJunction|name",
  description: "Links two fixed-span endpoints.",
  descriptionKey: "structures|exampleJunction|description",
  categoryKey: "logistics",
  buildModes: [{
    type: "line",
    directions: ["horizontal", "vertical"],
    spanTiles: 4,
  }],
  linkedClearance: "allOrNothing",
  tooltipHover,
  variants: [{
    id: "exampleJunction",
    angles: [-180, -90, 0, 90, 180],
  }],
  render: {
    imageName: "exampleJunction",
    size: { width: 16, height: 16 },
  },
});
```

##### `tooltipHover`

```text
tooltipHover: {
  type: "custom",
  dataFieldMessage: {
    message: "Mode {mode}; channel {channel}.",
    messageKey: "mods|example|machineTooltip",
    fields: [
      {
        param: "mode",
        field: "mode",
        valueLabels: { input: "Receiving", output: "Sending" },
        valueKeys: {
          input: "mods|example|receiving",
          output: "mods|example|sending",
        },
      },
      { param: "channel", field: "channel", fallback: 1, round: true },
    ],
  },
}
```

#### `updateDefinition(structureTypeOrId, partial, options?)`

```text
api.structures.updateDefinition("exampleJunction", {
  buildModes: [{
    type: "line",
    directions: ["horizontal", "vertical"],
    spanTiles: 6,
  }],
});
```

#### `registerVariant(baseStructureTypeOrId, variant, options?)`

- Deprecated alias: `addVariant(baseStructureTypeOrId, variant, options?)`

```text
api.structures.registerVariant(
  "exampleStructure",
  {
    id: "exampleStructureVertical",
    angles: [-90, 90],
  },
  {
    addBuildMode: {
      type: "line",
      directions: ["vertical"],
      spanTiles: 4,
    },
  },
);
```

#### `forEachOfType(structureTypeOrId, callback)`

```text
api.structures.forEachOfType("exampleStructure", (structure) => {
  api.structures.updateData(structure, { active: true });
});
```

#### `registerPlacementConfig(definition)`

```text
api.structures.registerPlacementConfig({
  structureId: "exampleStructure",
  fields: [
    {
      type: "integer",
      id: "channel",
      label: "Channel",
      default: 1,
      min: 1,
      max: 8,
    },
    {
      type: "choice",
      id: "mode",
      labelKey: "structures|exampleStructure|mode",
      default: "input",
      options: [
        { value: "input", label: "Input" },
        { value: "output", labelKey: "structures|exampleStructure|output" },
      ],
    },
  ],
});
```

- `getAtCell(cellX, cellY)`

- `getDefinitionByType(structureType)`

#### `getAvailableTypes()`

- Deprecated alias: `getUnlockedTypes()`

#### `getTypeById(structureId)`

- Deprecated alias: `getTypeFromId(structureId)`

- `hasBuiltAtCell(cellX, cellY)`

- `isBlockedByPlayerAtCell(cellX, cellY)`

- `isLauncherAtCell(cellX, cellY)`

- `isType(structure, structureId)`

- `isTypeAtCell(cellX, cellY, structureId)`

#### `isLockedByType(structureType)`

- Deprecated alias: `isUnlockedByType(structureType)`

#### `mapValueToSpritesheetIndex(value, thresholds)`

```text
const index = api.structures.mapValueToSpritesheetIndex(
  pressure,
  [0, 25, 50, 75],
);
```

- `setSpritesheetIndex(structure, index)`

- `setSpritesheetIndexAtCell(cellX, cellY, index)`

#### `setSpritesheetIndexByValue(structure, value, thresholds)`

```text
api.structures.setSpritesheetIndexByValue(
  structure,
  pressure,
  [0, 25, 50, 75],
);
```

#### `setSpritesheetIndexByValueAtCell(cellX, cellY, value, thresholds)`

```text
api.structures.setSpritesheetIndexByValueAtCell(
  cellX,
  cellY,
  pressure,
  [0, 25, 50, 75],
);
```

#### `update(structure, options?)`

```text
api.structures.update(structure, {
  propagateToWorkers: true,
});
```

#### `updateData(structure, partial, options?)`

- Deprecated alias: `setData(structure, partial, options?)`

```text
api.structures.updateData(
  structure,
  { mode: "allow" },
  { propagateToWorkers: true },
);
```

#### `buildAtCell(cellX, cellY, structureTypeOrId, options?)`

- Deprecated alias: `buildAtCellWhenIdle(cellX, cellY, structureTypeOrId, options?)`

#### `removeAtCell(cellX, cellY, options?)`

- Deprecated alias: `removeAtCellWhenIdle(cellX, cellY, options?)`

#### `removeBetweenCells(startCellX, startCellY, endCellX, endCellY, options?)`

- Deprecated alias: `removeBetweenCellsWhenIdle(startCellX, startCellY, endCellX, endCellY, options?)`

#### `removeAtCells(positions, options?)`

- Deprecated alias: `removeAtCellsWhenIdle(positions, options?)`

```text
api.structures.removeAtCells([
  { x: firstCellX, y: firstCellY },
  { x: secondCellX, y: secondCellY },
]);
```

#### `processing`

##### `register(id, definition)`

- `definition.structureType`
- `definition.intervalMs`
- `definition.process`
- Deprecated alias: `api.structures.addProcessor(structureId, definition)`

```text
api.structures.processing.register(
  "exampleStructure:process",
  {
    structureType: "exampleStructure",
    intervalMs: 250,
    process: (structure, context) => {
      const empty = context.isCellEmptyAtCell(
        structure.x,
        structure.y,
      );
    },
  },
);
```

###### `context`

###### `getResolvedTypeAtCell(cellX, cellY)`

- Deprecated alias: `getElementTypeAtCell(cellX, cellY)`

###### `isCellEmptyAtCell(cellX, cellY)`

- Deprecated alias: `isCellEmpty(cellX, cellY)`

- `commit(mutations)`

##### `isEnabledAtCell(cellX, cellY)`

- Deprecated alias: `isEnabledAt(cellX, cellY)`

##### `setEnabledAtCell(cellX, cellY, enabled)`

- Deprecated alias: `setEnabledAt(cellX, cellY, enabled)`

### `api.tech`

- `getDefinitionById(techId)`

#### `updateDefinition(techId, partial)`

```text
api.tech.updateDefinition("exampleTech", {
  cost: 200,
});
```

#### `registerDefinition(techId, definition)`

- Deprecated alias: `addDefinition(techId, definition)`

```text
api.tech.registerDefinition("exampleTech", {
  name: "Example research",
  nameKey: "mods|example|techName",
  description: "Unlocks the example machine.",
  descriptionKey: "mods|example|techDescription",
  cost: 100,
});
```

#### `registerNode(techId, definition, options)`

- `options.parentId`
- `options.preferredPosition` (optional)

```text
const position = api.tech.registerNode(
  "exampleTech",
  techDefinition,
  { parentId: parentTechId },
);
```

#### `conservatory.appendUnlock(techId, unlocks)`

- `unlocks.structures` (optional)
- `unlocks.items` (optional)

```text
api.tech.conservatory.appendUnlock(sandkit.enums.Tech.SignalDevices, {
  structures: ["exampleSensor"],
});
```

#### `isResearchedById(techId)`

- `techId`: `Tech | string`

- `isLockedById(techId)`

- `setLockedById(techId, locked)`

### `api.terrains`

- `register(definition)`

- `updateDefinition(terrainTypeOrId, partial)`

#### `getTypeById(terrainId)`

- Deprecated alias: `getTypeFromId(terrainId)`

- `getIdByType(terrainType)`

- `getDefinitionByType(terrainType)`

- `getTypeAtCell(cellX, cellY)`

#### `getDataAtCell(cellX, cellY)`

- `result.hitPoints`
- Deprecated alias: `result.hp`

- `isAtCell(cellX, cellY)`

- `isTypeAtCell(cellX, cellY, terrainId)`

- `isCellIdTerrain(cellId)`

#### `createAtCell(cellX, cellY, terrainTypeOrId, options?)`

- `terrainTypeOrId`: `number | string`
- Deprecated alias: `createAtCellWhenIdle(cellX, cellY, terrainTypeOrId, options?)`

#### `replaceAtCell(cellX, cellY, terrainTypeOrId, options?)`

- `terrainTypeOrId`: `number | string`
- Deprecated alias: `replaceAtCellWhenIdle(cellX, cellY, terrainTypeOrId, options?)`

#### `removeAtCell(cellX, cellY, options?)`

- Deprecated alias: `removeAtCellWhenIdle(cellX, cellY, options?)`

- `damageAtCell(cellX, cellY, damage)`

#### `setHitPointsAtCell(cellX, cellY, hitPoints)`

- Deprecated alias: `setHpAtCell(cellX, cellY, hitPoints)` and `setHpAtCellWhenIdle(cellX, cellY, hitPoints)`

### `api.triggers`

#### `register(triggerId, definition)`

- `definition.intervalMs`
  - Deprecated alias: `definition.interval`
- `definition.sequentialRunCount`
  - Deprecated alias: `definition.sequentialRuns`
- `definition.callback(trigger, deltaTimeMs)`
- `definition.data`
- `trigger.data`
  - Deprecated alias: `definition.extra` and `trigger.extra`

```text
api.triggers.register("example:update", {
  intervalMs: 250,
  callback: (trigger, deltaTimeMs) => {
    updateExample(trigger, deltaTimeMs);
  },
});
```

### `api.lights.temporary`

Deprecated alias: `api.lights.vfx`

#### `createAtWorld(worldX, worldY, options?)`

- `light.lightId`
- Deprecated alias: `light.index`
- Deprecated alias: `api.effects.createLightAtWorld(worldX, worldY, options?)`

```text
const light = api.lights.temporary.createAtWorld(worldX, worldY, {
  brightness: 1,
  durationMs: 250,
  size: 80,
});
const lightId = light.lightId;
```

#### `removeById(lightId)`

- Deprecated alias: `api.effects.removeLightById(lightId)`

```text
if (light.lightId !== null) {
  api.lights.temporary.removeById(light.lightId);
}
```

#### `options.durationTicks`

- `durationTicks`: `number` (optional)
  - Deprecated alias: `duration`

```text
api.lights.temporary.createAtWorld(worldX, worldY, {
  durationTicks: 15,
});
```

#### `options.durationMs`

- `durationMs`: `number` (optional)

```text
api.lights.temporary.createAtWorld(worldX, worldY, {
  durationMs: 250,
});
```

### `api.lights.persistent`

#### `createAtWorld(worldX, worldY, options?)`

```text
const light = api.lights.persistent.createAtWorld(
  worldX,
  worldY,
  { brightness: 1, size: 80 },
);
```

- `removeAtWorld(worldX, worldY)`

- `fadeAtWorld(worldX, worldY, durationMs?)`

- `markDirty()`

### `api.player.buildings`

#### `unlockById(structureId)`

- Deprecated alias: `unlockByType(structureId)`

- `removeById(structureId)`

### `api.tools.grabber`

- `setSize(size)`

- `getSize()`

- `isActive()`

- `isLoaded()`

### `api.shared.buffers`

#### `ensure(key, config)`

- `config.type`
- `config.length`
- Deprecated alias: `create(key, config)`

```text
const counts = api.shared.buffers.ensure("counts", {
  type: "uint32",
  length: 4,
});
```

- `get(key)`

### `api.workers`

- `setPostUpdateEnabled(enabled)`

### `api.schedule`

#### `nextTick(callback)`

- `callback()`

```text
api.schedule.nextTick(() => {
  runDeferredWork();
});
```

### `api.sound`

- `play(soundId, options?)`

- `playActive(soundId, options?)`

- `playLayers(layers, options?)`

- `calculateDistanceOptionsAtWorld(worldX, worldY, baseVolume?)`

#### `stopBySoundId(soundId)`

- Deprecated alias: `stopById(soundId)`

- `stopActive()`

- `stopAll()`

### `api.grid`

- Deprecated alias: `api.world`

#### `getDimensions()`

```text
const { widthCells, heightCells } = api.grid.getDimensions();
```

- `getCellIdAtCell(cellX, cellY)`

- `isCellEmptyAtCell(cellX, cellY)`

- `isTerrainAtCell(cellX, cellY)`

#### `mutate(callback)`

- `callback(writer)`
- Deprecated alias: `api.world.runWhenSimulationIdle(callback)`

```text
const waterType = api.elements.getTypeById("water");

api.events.on("item:used", ({ itemId, cellX, cellY }) => {
  if (itemId !== "laser") return;

  api.grid.mutate((writer) => {
    if (!api.terrains.isTypeAtCell(cellX, cellY, "ice")) return;
    writer.elements.replaceAtCell(cellX, cellY, waterType);
  });
});
```

##### `writer`

###### `elements.createAtCell(cellX, cellY, elementTypeOrId, options?)`

- `elementTypeOrId`: `ElementType | string`

###### `elements.replaceAtCell(cellX, cellY, elementTypeOrId, options?)`

- `elementTypeOrId`: `ElementType | string`

- `elements.removeAtCell(cellX, cellY, options?)`

###### `terrains.createAtCell(cellX, cellY, terrainTypeOrId, options?)`

- `terrainTypeOrId`: `number | string`

###### `terrains.replaceAtCell(cellX, cellY, terrainTypeOrId, options?)`

- `terrainTypeOrId`: `number | string`

- `terrains.removeAtCell(cellX, cellY, options?)`

- `reportActivityAtCell(cellX, cellY)`

#### `excavateAtCell(cellX, cellY, outVelocity, damage, options?)`

```text
api.grid.excavateAtCell(
  cellX,
  cellY,
  { x: 0, y: -120 },
  25,
);
```

- `revealFogAtCell(cellX, cellY)`

#### `redrawAroundCell(cellX, cellY, rangeCells)`

- Deprecated alias: `api.world.redrawAroundCellWhenIdle(cellX, cellY, rangeCells)`

#### `forEachCellInRectangle(cellX, cellY, widthCells, heightCells, callback)`

- Deprecated alias: `forEachCellInRect(cellX, cellY, widthCells, heightCells, callback)`

- `forEachCellInCircle(centerCellX, centerCellY, radiusCells, callback)`

### `api.pickups`

- Deprecated alias: `api.world.pickups`

#### `spawnAtWorld(type, worldX, worldY, data?, light?)`

- `type`: `PickupType`

#### `remove(pickup)`

- Deprecated alias: `destroy(pickup)`

- `pickUp(pickup)`

- `getAll()`

- `getById(pickupId)`

### `api.excavation`

#### `registerProfile(id, definition)`

- `definition.pattern`
- `definition.power`
- `definition.options`
  - `fromGun`
  - `fromRocketExplosion`
  - `fromDrill`
  - `useLiteralOutVelocity`
  - `destroyNonDestructible`
  - `forceRemoveAll`
  - `drillTierDamage`
- `definition.terrainRules[]`
  - `cellType`
  - Deprecated alias: `terrainType`
  - `damage`
  - `outputElementType`

```text
const profileId = "example:voidGun";
const duneType = api.terrains.getTypeById("dune");
const sandType = api.elements.getTypeById("sand");

api.excavation.registerProfile(profileId, {
  power: 8,
  terrainRules: [
    {
      cellType: duneType,
      outputElementType: sandType,
    },
  ],
});

api.hooks.modify("excavation:prepare", (args) => {
  if (
    args.sourceKind !== "projectile"
    || args.sourceId !== "implosionGun"
  ) {
    return;
  }

  args.profileId = profileId;
});
```

### `api.blueprints`

- `serializeStructures(structures)`

- `localizeStructures(structures)`

### `api.factory`

- `getLevel()`

#### `getProcessCount(processId)`

- `processId`: `"shakeWetSand" | "pressBurntResidue" | "growFlowers" | "condenseFlorin"`

#### `getProcessRate(processId)`

- `processId`: `"shakeWetSand" | "pressBurntResidue" | "growFlowers" | "condenseFlorin"`

### `api.game`

#### `start(options?)`

- `options.skipIntro` (optional)

```text
api.game.start({ skipIntro: true });
```

### `api.maps`

#### `getArtifactLocations()`

```text
api.events.on("game:ready", () => {
  api.maps.getArtifactLocations().forEach(({ cellX, cellY, name }) => {
    addMarker(cellX, cellY, name);
  });
});
```

- `getActive()`

- `getAvailable()`

- `start(mapId)`

### `api.pipes`

- `isAtCell(cellX, cellY)`

- `isEnabledAtCell(cellX, cellY)`

- `getConnectedVentsAtCell(cellX, cellY)`

- `setEnabledAtCell(cellX, cellY, enabled)`

### `api.reactions`

#### `registerContact(definition)`

- `definition.inputA`
- `definition.inputB`
- `definition.outputA`
- `definition.outputB`
- `definition.orientation` (optional): `"any"` | `"stacked"`

```text
api.reactions.registerContact({
  inputA: "water",
  inputB: "examplePowder",
  outputA: "steam",
  outputB: null,
  orientation: "any",
});
```

### `api.rendering`

#### `getDrawPositionAtWorld(worldX, worldY)`

```text
api.events.on("frame:render", () => {
  const drawPos = api.rendering.getDrawPositionAtWorld(worldX, worldY);
  drawMarker(drawPos.x, drawPos.y);
});
```

- `getDrawPositionAtCell(cellX, cellY)`

#### `getGridMetrics()`

```text
const { cellSize, snapGridCellSize } = api.rendering.getGridMetrics();
```

- `getOverlayViewportSize()`

#### `withOverlayContext(callback)`

- `callback(context)`

```text
api.rendering.withOverlayContext((context) => {
  context.fillRect(0, 0, 16, 16);
});
```

### `api.upgrades`

- `registerCategory(definition)`

- `register(definition)`

- `updateDefinition(itemId, upgradeId, partial)`

- `getLevelById(itemId, upgradeId)`

- `getAvailableLevelById(itemId, upgradeId)`

- `setLevelById(itemId, upgradeId, level)`

## Worker entry

### `api.constants`

- `physics.normal`

- `physics.skip`

- `physics.aggressiveSkip`

### `api.collector`

- `getValueFromCellId(cellId)`

- `getValueByType(elementType)`

- `isCellIdCollectable(cellId)`

- `isCellIdCollectableForSprite(cellId)`

- `notifyPickupAtCell(cellX, cellY)`

### `api.effects`

#### `createAtWorld(effectId, worldX, worldY, options?)`

- Deprecated alias: `createEffectAtWorld(effectId, worldX, worldY, options?)`

#### `createParticlesAtWorld(worldX, worldY, options?)`

```text
api.effects.createParticlesAtWorld(worldX, worldY, { count: 8 });
```

### `api.elements`

#### `getTypeById(elementId)`

- Deprecated alias: `getTypeFromId(elementId)`

- `getIdByType(elementType)`

#### `swapBetweenCells(firstCellX, firstCellY, secondCellX, secondCellY)`

- Deprecated alias: `swapCells(firstCellX, firstCellY, secondCellX, secondCellY)`

- `addParticleVelocityAtCell(cellX, cellY, velocity, maxSpeedCellsPerSecond?)`

- `getDataFieldAtCell(cellX, cellY, dataFieldNumber)`

- `setDataFieldAtCell(cellX, cellY, dataFieldNumber, value)`

#### `markMovementBlockedByIndex(elementIndex)`

- Deprecated alias: `markMovementBlockedByElementIndex(elementIndex)`

#### `isTypeAtCell(cellX, cellY, elementTypeOrId)`

- `elementTypeOrId`: `ElementType | string`

#### `createAtCell(cellX, cellY, elementTypeOrId, options?)`

- `elementTypeOrId`: `ElementType | string`

```text
api.elements.createAtCell(cellX, cellY, "water", {
  durationTicks: 60,
});
```

#### `replaceAtCell(cellX, cellY, elementTypeOrId, options?)`

- `elementTypeOrId`: `ElementType | string`

#### `setDurationAtCell(cellX, cellY, durationTicks, options?)`

```text
const updated = api.elements.setDurationAtCell(
  cellX,
  cellY,
  120,
  { updateMax: true },
);
```

- `getDefinitionByType(elementType)`

- `getTypeAtCell(cellX, cellY)`

- `getResolvedTypeAtCell(cellX, cellY)`

- `getResolvedTypeFromCellId(cellId)`

- `getInfoAtCell(cellX, cellY)`

- `getMatterTypeAtCell(cellX, cellY)`

- `isFreeFallingAtCell(cellX, cellY)`

- `removeAtCell(cellX, cellY, options?)`

- `moveBetweenCells(fromCellX, fromCellY, toCellX, toCellY)`

- `teleportBetweenCells(fromCellX, fromCellY, toCellX, toCellY)`

- `getVelocityAtCell(cellX, cellY)`

- `setVelocityAtCell(cellX, cellY, velocity)`

- `convertToParticleAtCell(cellX, cellY, velocity)`

- `convertFromParticleAtCell(cellX, cellY)`

- `refreshColorAtCell(cellX, cellY)`

- `setPhysicsAtCell(cellX, cellY, physicsState)`

### `api.events`

#### `on(eventId, callback, options?)`

##### `element:moved`

- `eventId`: `"element:moved"`
- `callback(payload)`
- `options.guard.elementType` (required)

```text
api.events.on(
  "element:moved",
  (payload) => handleElementMoved(payload),
  { guard: { elementType } },
);
```

##### `terrain:updated`

- `eventId`: `"terrain:updated"`
- `callback(payload)`
- `options.guard.terrainType` (required)
- Deprecated alias: `"terrain:update"`

```text
api.events.on(
  "terrain:updated",
  (payload) => {
    handleTerrainUpdate(payload);
  },
  { guard: { terrainType } },
);
```

##### `worker:update:post`

- `eventId`: `"worker:update:post"`
- `callback(payload)`
- Deprecated alias: `"update:post"`

```text
api.events.on("worker:update:post", (payload) => {
  runPostUpdate(payload);
});
```

#### `emit(eventId, payload, options?)`

- `options.guard.elementType` (optional)
- `options.guard.terrainType` (optional)

### `api.hooks`

#### `intercept(hookId, callback, options?)`

##### `cell:process`

- `hookId`: `"cell:process"`
- `callback(args, context)`
- `options.guard.elementType` (required)
- `options.priority` (optional)

```text
api.hooks.intercept("cell:process", handleCell, {
  guard: { elementType },
});
```

##### `element:update`

- `hookId`: `"element:update"`
- `callback(args, context)`
- `options.guard.elementType` (required)
- `options.priority` (optional)

```text
api.hooks.intercept("element:update", handleUpdate, {
  guard: { elementType },
});
```

##### `element:move`

- `hookId`: `"element:move"`
- `callback(args, context)`
- `options` (optional)

```text
api.hooks.intercept("element:move", (args, context) => {
  handleElementMove(args, context);
});
```

##### `element:move:blocked`

- `hookId`: `"element:move:blocked"`
- `callback(args, context)`
- `options.guard.elementType` (required)
- Deprecated alias: `"element:blocked"`

```text
api.hooks.intercept(
  "element:move:blocked",
  (args, context) => {
    handleBlockedMovement(args, context);
  },
  { guard: { elementType } },
);
```

##### `element:duration:expire`

- `hookId`: `"element:duration:expire"`
- `callback(args, context)`
- `options.guard.elementType` (required)
- Deprecated alias: `"element:duration"`

```text
api.hooks.intercept(
  "element:duration:expire",
  (args, context) => {
    handleDurationExpiry(args, context);
  },
  { guard: { elementType } },
);
```

##### `fire:element:burn`

- `hookId`: `"fire:element:burn"`
- `callback(args, context)`
- `options` (optional)

```text
api.hooks.intercept("fire:element:burn", (args, context) => {
  handleElementBurn(args, context);
});
```

##### `shaker:elementOn`

- `hookId`: `"shaker:elementOn"`
- `callback(args, context)`
- `options` (optional)

```text
api.hooks.intercept("shaker:elementOn", (args, context) => {
  handleShakerElement(args, context);
});
```

#### `modify(hookId, callback, options?)`

- `hookId`
- `callback(args)`
- `options.guard` (optional)
- `options.priority` (optional)

```text
api.hooks.modify("example:prepare", (args) => {
  args.value *= 2;
});
```

### `api.fire`

- `canBurnElementAtCell(cellX, cellY)`

- `burnElementAtCell(cellX, cellY)`

### `api.patterns`

- `createCircle(diameterCells)`

#### `excavateAtCell(cellX, cellY, pattern, outVelocity, power, options?)`

```text
api.patterns.excavateAtCell(
  cellX,
  cellY,
  pattern,
  { x: 0, y: -1 },
  10,
);
```

### `api.player`

#### `getPositionAtWorld()`

- Deprecated alias: `getWorldPosition()`

- `isCollidingWithCell(cellX, cellY)`

- `isWithinRadiusOfCell(cellX, cellY, radiusCells)`

### `api.random`

- `int(min, max)`

- `float(min, max)`

### `api.terrains`

#### `getTypeById(terrainId)`

- Deprecated alias: `getTypeFromId(terrainId)`

- `getIdByType(terrainType)`

- `getDefinitionByType(terrainType)`

#### `getDataAtCell(cellX, cellY)`

- `result.hitPoints`
- Deprecated alias: `result.hp`

#### `setHitPointsAtCell(cellX, cellY, hitPoints)`

- Deprecated alias: `setHpAtCell(cellX, cellY, hitPoints)`

- `getTypeAtCell(cellX, cellY)`

- `isAtCell(cellX, cellY)`

- `isTypeAtCell(cellX, cellY, terrainId)`

- `isCellIdTerrain(cellId)`

- `createAtCell(cellX, cellY, terrainTypeOrId, options?)`

- `replaceAtCell(cellX, cellY, terrainTypeOrId, options?)`

- `removeAtCell(cellX, cellY, options?)`

- `damageAtCell(cellX, cellY, damage)`

### `api.ui`

#### `toast(message, options?)`

```text
api.ui.toast({ key: "mods|example|workerToast" });
```

### `api.utils`

- `getDistance(pointA, pointB)`

- `getDirection(pointA, pointB)`

- `getAngle(pointA, pointB)`

#### `getCoordinatesBetweenCells(pointA, pointB)`

- Deprecated alias: `getCoordinatesBetweenPoints(pointA, pointB)`

### `api.lights.temporary`

Deprecated alias: `api.lights.vfx`

#### `createAtWorld(worldX, worldY, options?)`

- `light.lightId`
- Deprecated alias: `light.index`
- Deprecated alias: `api.effects.createLightAtWorld(worldX, worldY, options?)`

```text
const light = api.lights.temporary.createAtWorld(worldX, worldY, {
  durationTicks: 15,
});
const lightId = light.lightId;
```

### `api.main`

- `emitEvent(eventId, payload)`

### `api.maps`

- `getActive()`

### `api.worker`

- `getIndex()`

- `getCount()`

### `api.shared.buffers`

- `get(key)`

#### `require(key, config)`

- `config.type`
- `config.length`

```text
const counts = api.shared.buffers.require("counts", {
  type: "uint32",
  length: 4,
});
```

### `api.structures`

#### `getTypeById(structureId)`

- Deprecated alias: `getTypeFromId(structureId)`

#### `updateData(structure, partial, options?)`

- Deprecated alias: `setData(structure, partial, options?)`

```text
api.structures.updateData(
  structure,
  { mode: "allow" },
  { propagateToWorkers: true },
);
```

- `getAtCell(cellX, cellY)`

- `getDefinitionByType(structureType)`

- `hasBuiltAtCell(cellX, cellY)`

- `isType(structure, structureId)`

- `isTypeAtCell(cellX, cellY, structureId)`

#### `forEachOfType(structureTypeOrId, callback)`

- `callback(structure)`

```text
api.structures.forEachOfType("exampleStructure", (structure) => {
  processStructure(structure);
});
```

#### `update(structure, options?)`

```text
api.structures.update(structure, { propagateToWorkers: true });
```

- `setSpritesheetIndex(structure, index)`

- `setSpritesheetIndexAtCell(cellX, cellY, index)`

- `setSpritesheetIndexByValue(structure, value, thresholds)`

- `setSpritesheetIndexByValueAtCell(cellX, cellY, value, thresholds)`

### `api.structures.processing`

#### `isEnabledAtCell(cellX, cellY)`

- Deprecated alias: `isEnabledAt(cellX, cellY)`

### `api.grid`

- Deprecated alias: `api.world`

#### `getDimensions()`

```text
const { widthCells, heightCells } = api.grid.getDimensions();
```

- `getCellIdAtCell(cellX, cellY)`

- `isCellEmptyAtCell(cellX, cellY)`

- `isTerrainAtCell(cellX, cellY)`

- `reportActivityAtCell(cellX, cellY)`

- `excavateAtCell(cellX, cellY, outVelocity, damage, options?)`
