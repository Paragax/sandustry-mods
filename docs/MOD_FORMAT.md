# Sandustry Mod Format

```text
mods/
  example-mod/
    modinfo.json
    main.js
    worker.js
    patches.json
    config/
    assets/
    map/
    preview.png
    workshop.json
```


modinfo.json
{
  "manifestVersion": 1,
  "id": "author.example-mod",
  "name": "Example Mod",
  "version": "1.0.0",
  "apiVersion": 1,
  "entry": "main.js",
  "workerEntry": "worker.js",
  "description": "An example Sandustry mod.",
  "author": "Your name",
  "dependencies": [],
  "loadOrder": 0
}

patches.json
[
  {
    "id": "bundle-log-prefix",
    "file": "js/bundle.js",
    "find": "initializing workers",
    "operation": "insertBefore",
    "code": "[patched] ",
    "expectedMatches": 1
  },
  {
    "id": "manager-log",
    "atomicGroup": "worker-logs",
    "file": "js/manager-worker.js",
    "regex": {
      "pattern": "Manager (thread initializing)",
      "flags": "i"
    },
    "operation": "replace",
    "code": "Manager patched $1",
    "expectedMatches": 1
  },
  {
    "id": "simulation-log",
    "atomicGroup": "worker-logs",
    "file": "js/simulation-worker.js",
    "find": "initializing worker",
    "operation": "wrap",
    "before": "[patched] ",
    "after": " [done]",
    "expectedMatches": 1
  }
]

modinfo.json (Custom Maps)
{
  "manifestVersion": 1,
  "id": "author.example-map",
  "name": "Example Map",
  "version": "1.0.0",
  "apiVersion": 1,
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
    "width": 1920,
    "height": 1920,
    "spawn": {
      "x": 243,
      "y": 50
    },
    "unstuck": {
      "x": 243,
      "y": 50
    },
    "deployment": "skip",
    "topBounds": {
      "hard": 100,
      "soft": 275
    },
    "depthLight": {
      "startY": 6500,
      "endY": 10070,
      "maxSize": 700,
      "minSize": 200
    },
    "parallax": {
      "widthScale": 1.5,
      "offsetY": -2600
    },
    "colorMappings": {
      "4, 5, 6": "GoldSoil"
    }
  }
}

modinfo.json(Texture and Config Overrides)
{
  "manifestVersion": 1,
  "id": "author.example-overrides",
  "name": "Example Overrides",
  "version": "1.0.0",
  "apiVersion": 1,
  "dependencies": [],
  "loadOrder": 0,
  "configOverrides": {
    "drill": "config/drill.json"
  },
  "textureOverrides": {
    "conveyor_left": "assets/conveyor_left.png",
    "conveyor_right": "assets/conveyor_right.png",
    "cursor_default": "assets/cursor_default.png",
    "shaker_left": {
      "path": "assets/shaker_left_sheet.png",
      "frameWidth": 18,
      "frames": 6,
      "intervalMs": 166
    }
  },
}


main.js - Runs on main thread.
worker.js - Runs on manager and simulation worker threads.
patches.json - Patches the bundles.
config/ - Overrides native JSON configs.
assets/ - Overrides textures.
map/ - Blueprints and configs for custom maps.
