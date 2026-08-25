const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function test() {
  const source = fs.readFileSync(path.resolve(__dirname, "../main.js"), "utf8");
  assert.doesNotMatch(source, /^\s*(?:import|export)\s/m);

  const registered = [];
  const registeredUpgrades = [];
  const translations = {};
  const eventHandlers = {};
  const inputBindings = {};
  const raycastAngles = [];
  const lasers = [];
  const lights = [];
  const excavations = [];
  const elementReplacements = [];
  const sounds = [];
  const inventory = [];
  const spriteLoads = [];
  let damageUpgradeLevel = 0;
  let thicknessUpgradeLevel = 0;
  let divergenceUpgradeLevel = 0;
  let iceMeltUpgradeLevel = 0;
  let terrainTypeAtHit = 23;
  let raycastHits = true;
  let now = 0;

  const nativeLaser = {
    id: "laser",
    sprite: { id: "laser", ui: { imageName: "laser_icon" } },
    config: { energyCost: 60, normalPatternSize: 7, reducedPatternSize: 0 },
  };
  const noop = () => {};
  const api = {
    action: { getActive: () => ({ id: "paragax.last-prism" }) },
    authorization: { canUseTool: () => true },
    effects: {
      createLaserAtWorld: (...args) => {
        lasers.push(args);
        return { destroy: noop };
      },
      createLightAtWorld: (...args) => lights.push(args),
      createParticlesAtWorld: noop,
    },
    elements: {
      getTypeFromId: (id) => ({ water: 4 })[id],
      replaceAtCellWhenIdle: (...args) => elementReplacements.push(args),
    },
    events: { on: (id, handler) => { eventHandlers[id] = handler; } },
    grid: {
      forEachCellInCircle: (centerX, centerY, radius, callback) => {
        for (let x = Math.ceil(centerX - radius); x <= centerX + radius; x += 1) {
          for (let y = Math.ceil(centerY - radius); y <= centerY + radius; y += 1) {
            if ((x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2) {
              callback(x, y);
            }
          }
        }
      },
    },
    i18n: {
      register: (locale, entries) => Object.assign(translations, entries),
    },
    input: {
      registerBinding: (id, defaultKeys, definition) => {
        inputBindings[id] = { defaultKeys, definition };
        return id;
      },
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
        return raycastHits ? { x: 10, y: 20, distance: 100 } : null;
      },
    },
    rendering: { getGridMetrics: () => ({ cellSize: 4 }) },
    sound: { play: (id) => sounds.push(id) },
    sprites: {
      loadFromMod: async (...args) => spriteLoads.push(args),
    },
    time: { getTimeMs: () => now },
    terrains: {
      getTypeFromId: (id) => ({ ice: 25 })[id],
      getTypeAtCell: () => terrainTypeAtHit,
    },
    ui: { toast: noop },
    upgrades: {
      getLevelById: (itemId, upgradeId) => ({
        damage: damageUpgradeLevel,
        thickness: thicknessUpgradeLevel,
        divergence: divergenceUpgradeLevel,
        iceMelt: iceMeltUpgradeLevel,
      })[upgradeId] || 0,
      register: (definition) => registeredUpgrades.push(definition),
    },
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
  assert.deepEqual(registered[0].sprite.ui.size, { width: 26, height: 30 });
  assert.deepEqual(spriteLoads, [[
    "paragax.last-prism.sprite",
    "assets/last-prism.png",
  ]]);
  assert.equal(nativeLaser.config.energyCost, 60);
  assert.equal(registeredUpgrades.length, 4);
  const damageUpgrade = registeredUpgrades.find(
    (definition) => definition.upgrade.id === "damage",
  );
  assert.equal(damageUpgrade.itemId, "paragax.last-prism");
  assert.equal(damageUpgrade.categoryId, "tools");
  assert.equal(damageUpgrade.upgrade.maxLevel, 3);
  assert.deepEqual(damageUpgrade.upgrade.descriptionParams, { amount: 1 });
  assert.deepEqual(damageUpgrade.upgrade.costs, [0, 0, 0]);
  assert.equal(
    translations["mods|paragax.lastPrism|upgrade|damage|description"],
    "Increases terrain damage from each laser (+{amount} per level).",
  );
  const thicknessUpgrade = registeredUpgrades.find(
    (definition) => definition.upgrade.id === "thickness",
  );
  assert.equal(thicknessUpgrade.itemId, "paragax.last-prism");
  assert.equal(thicknessUpgrade.upgrade.maxLevel, 4);
  assert.deepEqual(
    thicknessUpgrade.upgrade.descriptionParams,
    { percent: 100 },
  );
  assert.deepEqual(thicknessUpgrade.upgrade.costs, [0, 0, 0, 0]);
  assert.equal(
    translations["mods|paragax.lastPrism|upgrade|thickness|description"],
    "Increases thickness of each beam (+{percent}% per level).",
  );
  const divergenceUpgrade = registeredUpgrades.find(
    (definition) => definition.upgrade.id === "divergence",
  );
  assert.equal(divergenceUpgrade.itemId, "paragax.last-prism");
  assert.equal(divergenceUpgrade.upgrade.maxLevel, 1);
  assert.equal(divergenceUpgrade.upgrade.oneOff, true);
  assert.deepEqual(divergenceUpgrade.upgrade.costs, [0]);
  assert.equal(
    translations["mods|paragax.lastPrism|upgrade|divergence|description"],
    "Unlocks six revolving, wide-spread beams on right-click.",
  );
  const divergenceBinding = inputBindings["paragax.last-prism.diverge"];
  assert.deepEqual(divergenceBinding.defaultKeys, ["MouseRight"]);
  const iceMeltUpgrade = registeredUpgrades.find(
    (definition) => definition.upgrade.id === "iceMelt",
  );
  assert.equal(iceMeltUpgrade.itemId, "paragax.last-prism");
  assert.equal(iceMeltUpgrade.upgrade.maxLevel, 1);
  assert.equal(iceMeltUpgrade.upgrade.oneOff, true);
  assert.deepEqual(iceMeltUpgrade.upgrade.costs, [0]);
  assert.equal(
    translations["mods|paragax.lastPrism|upgrade|iceMelt|description"],
    "Allows each beam to melt ice into water.",
  );

  registered[0].handleAction(state);
  assert.equal(lasers.length, 6);
  assert.equal(excavations.length, 6);
  assert.ok(excavations.every((excavation) => excavation[4] === 1));
  assert.ok(new Set(raycastAngles.slice(1)).size > 1);
  const maximumSpreadAngles = raycastAngles.slice(-6);
  assert.equal(new Set(lasers.map((laser) => laser[4].color)).size, 6);

  now = 1000;
  state.session.action.state = { 2: true };
  raycastHits = false;
  const aimAngle = Math.atan2(50 - 12, 100 - 5);
  const fullChargeSoundsBefore = sounds.filter(
    (id) => id === "charge_up_2",
  ).length;
  registered[0].handleAction(state);
  assert.equal(lasers.length, 7);
  assert.equal(excavations.length, 6);
  assert.ok(Math.abs(raycastAngles.at(-1) - aimAngle) < 1e-12);
  assert.equal(lasers.at(-1)[4].width, 3);
  assert.equal(
    lights.filter((light) => light[2].dedupKey === "last-prism:full-charge")
      .length,
    1,
  );
  assert.equal(
    sounds.filter((id) => id === "charge_up_2").length,
    fullChargeSoundsBefore + 1,
  );

  raycastHits = true;
  registered[0].handleAction(state);
  assert.equal(lasers.length, 8);
  assert.equal(excavations.length, 7);
  assert.equal(excavations.at(-1)[4], 6);

  damageUpgradeLevel = 1;
  registered[0].handleAction(state);
  assert.equal(lasers.length, 9);
  assert.equal(excavations.length, 8);
  assert.equal(excavations.at(-1)[4], 12);
  assert.ok(Math.abs(raycastAngles.at(-1) - aimAngle) < 1e-12);
  assert.equal(lasers.at(-1)[4].width, 3);
  assert.equal(
    lights.filter((light) => light[2].dedupKey === "last-prism:full-charge")
      .length,
    1,
  );

  damageUpgradeLevel = 2;
  registered[0].handleAction(state);
  assert.equal(excavations.length, 9);
  assert.equal(excavations.at(-1)[4], 18);

  damageUpgradeLevel = 3;
  registered[0].handleAction(state);
  assert.equal(excavations.length, 10);
  assert.equal(excavations.at(-1)[4], 24);

  for (let level = 1; level <= 4; level += 1) {
    thicknessUpgradeLevel = level;
    registered[0].handleAction(state);
    const expectedWidth = 3 * (1 + level);
    assert.equal(lasers.at(-1)[4].width, expectedWidth);
  }

  terrainTypeAtHit = 25;
  const excavationsBeforeIce = excavations.length;
  registered[0].handleAction(state);
  assert.equal(excavations.length, excavationsBeforeIce + 1);
  assert.equal(elementReplacements.length, 0);

  iceMeltUpgradeLevel = 1;
  registered[0].handleAction(state);
  assert.equal(excavations.length, excavationsBeforeIce + 1);
  assert.equal(elementReplacements.length, 9);
  assert.ok(elementReplacements.every(
    ([x, y, elementType]) =>
      x >= 9 && x <= 11 && y >= 19 && y <= 21 && elementType === 4,
  ));

  terrainTypeAtHit = 23;
  registered[0].handleAction(state);
  assert.equal(excavations.length, excavationsBeforeIce + 2);
  assert.equal(elementReplacements.length, 9);

  const lasersBeforeUnlock = lasers.length;
  divergenceBinding.definition.handlers.down();
  assert.equal(lasers.length, lasersBeforeUnlock);

  divergenceUpgradeLevel = 1;
  const chargeSoundsBeforeAlternate = sounds.filter(
    (id) => id.startsWith("charge_up"),
  ).length;
  divergenceBinding.definition.handlers.down();
  assert.equal(lasers.length, lasersBeforeUnlock + 6);
  const alternateStartAngles = raycastAngles.slice(-6);
  maximumSpreadAngles.forEach((angle, index) => {
    assert.ok(Math.abs(angle - alternateStartAngles[index]) < 1e-12);
  });
  assert.ok(lasers.slice(-6).every(
    (laser) => laser[4].width === 5 && laser[4].brightness === 1,
  ));
  assert.ok(excavations.slice(-6).every((excavation) => excavation[4] === 4));
  assert.equal(
    sounds.filter((id) => id.startsWith("charge_up")).length,
    chargeSoundsBeforeAlternate,
  );

  now += 250;
  divergenceBinding.definition.handlers.pressed();
  const rotatingAlternateAngles = raycastAngles.slice(-6);
  assert.ok(rotatingAlternateAngles.some(
    (angle, index) => Math.abs(angle - alternateStartAngles[index]) > 1e-12,
  ));

  now += 750;
  divergenceBinding.definition.handlers.pressed();
  const fullRevolutionAngles = raycastAngles.slice(-6);
  maximumSpreadAngles.forEach((angle, index) => {
    assert.ok(Math.abs(angle - fullRevolutionAngles[index]) < 1e-12);
  });
  assert.equal(
    sounds.filter((id) => id.startsWith("charge_up")).length,
    chargeSoundsBeforeAlternate,
  );
  divergenceBinding.definition.handlers.released();

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
