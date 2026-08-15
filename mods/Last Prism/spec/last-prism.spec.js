const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function test() {
  const source = fs.readFileSync(path.resolve(__dirname, "../main.js"), "utf8");
  assert.doesNotMatch(source, /^\s*(?:import|export)\s/m);

  const registered = [];
  const translations = {};
  const eventHandlers = {};
  const raycastAngles = [];
  const lasers = [];
  const excavations = [];
  const inventory = [];
  let now = 0;

  const nativeLaser = {
    id: "laser",
    sprite: { id: "laser", ui: { imageName: "laser_icon" } },
    config: { energyCost: 60, normalPatternSize: 7, reducedPatternSize: 0 },
  };
  const noop = () => {};
  const api = {
    authorization: { canUseTool: () => true },
    effects: {
      createLaserAtWorld: (...args) => {
        lasers.push(args);
        return { destroy: noop };
      },
      createLightAtWorld: noop,
      createParticlesAtWorld: noop,
    },
    events: { on: (id, handler) => { eventHandlers[id] = handler; } },
    i18n: {
      register: (locale, entries) => Object.assign(translations, entries),
    },
    items: {
      getDefinitionById: () => nativeLaser,
      register: (definition) => registered.push(definition),
    },
    patterns: {
      createCircle: (size) => ({ size }),
      excavateAtCell: (...args) => excavations.push(args),
    },
    player: { inventory: { addFromId: (id) => inventory.push({ id }) } },
    random: { float: (min, max) => (min + max) / 2 },
    raycast: {
      castFromWorld: (x, y, angle) => {
        raycastAngles.push(angle);
        return { x: 10, y: 20, distance: 100 };
      },
    },
    rendering: { getGridMetrics: () => ({ cellSize: 4 }) },
    sound: { play: noop },
    sprites: { loadFromMod: async () => {} },
    time: { getTimeMs: () => now },
    ui: { toast: noop },
  };
  const state = {
    session: {
      action: { state: { 1: true, 2: true } },
      camera: { x: 0, y: 0 },
      input: { mouse: { worldPosition: { x: 100, y: 50 } } },
    },
    store: {
      player: { x: 0, y: 0, width: 10, height: 20, inventory },
    },
  };
  const sandkit = {
    api,
    engine: { state },
    enums: { ActionState: { Start: 1, Active: 2, End: 3 } },
  };

  await new Function(
    "sandkit",
    `return (async () => { ${source}\n })();`,
  )(sandkit);

  assert.equal(registered.length, 1);
  assert.equal(registered[0].config.energyCost, 0);
  assert.equal(registered[0].sprite.ui.imageName, "paragax.last-prism.sprite");
  assert.equal(nativeLaser.config.energyCost, 60);

  registered[0].handleAction(state);
  assert.equal(lasers.length, 6);
  assert.equal(excavations.length, 6);
  assert.ok(excavations.every((excavation) => excavation[4] === 1));
  assert.ok(new Set(raycastAngles.slice(1)).size > 1);
  assert.equal(new Set(lasers.map((laser) => laser[4].color)).size, 6);

  now = 1000;
  state.session.action.state = { 2: true };
  registered[0].handleAction(state);
  assert.equal(new Set(raycastAngles.slice(-6)).size, 1);

  eventHandlers["game:started"]();
  eventHandlers["game:started"]();
  assert.deepEqual(inventory, [{ id: "paragax.last-prism" }]);
}

test().then(
  () => console.log("Last Prism specs passed"),
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
