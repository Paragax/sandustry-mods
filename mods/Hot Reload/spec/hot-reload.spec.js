const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function test() {
  const root = path.resolve(__dirname, "..");
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.doesNotMatch(source, /^\s*(?:import|export)\s/m);

  const handlers = {};
  const ticks = [];
  const timers = [];
  const toasts = [];
  const loads = [];
  let entrySource = "console.log('target');";
  const state = {
    store: { scene: { active: 4 }, meta: { worldId: "spec-world" } },
    session: { saving: null },
  };
  const sandkit = {
    api: {
      events: { on: (id, handler) => (handlers[id] = handler) },
      schedule: { nextTick: (callback) => ticks.push(callback) },
      ui: { toast: (message) => toasts.push(message) },
    },
    engine: {
      state,
      api: {
        game: {
          save: (_state, _name, id) => {
            state.session.saving = { id };
            return id;
          },
          load: (_state, id) => loads.push(id),
        },
      },
    },
  };

  const fetch = async () => ({ ok: true, text: async () => entrySource });

  const previousTargets = globalThis.__sandustryHotReloadTargets;
  globalThis.__sandustryHotReloadTargets = [
    {
      modId: "paragax.target",
      modName: "Target",
      entryUrl: "file:///target/main.js",
      workerUrl: null,
      entrySource,
      workerSource: null,
    },
  ];
  try {
    await new Function(
      "sandkit",
      "fetch",
      "setTimeout",
      "location",
      `return (async () => { ${source}\n })();`,
    )(
      sandkit,
      fetch,
      (callback) => timers.push(callback),
      { reload: () => assert.fail("unexpected reload") },
    );

    ticks[0]();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(toasts.at(-1), "Hot Reload watching 1 local mod(s)");

    entrySource = "console.log('changed');";
    timers.shift()();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(state.session.saving.id, "spec-world-hot-reload");
    assert.equal(toasts.at(-1), "Hot Reloading Target...");
    state.session.saving.onComplete();
    assert.deepEqual(loads, ["spec-world-hot-reload"]);
  } finally {
    globalThis.__sandustryHotReloadTargets = previousTargets;
  }

  const patches = JSON.parse(fs.readFileSync(path.join(root, "patches.json")));
  assert.equal(patches[0].expectedMatches, 1);
  assert.match(patches[0].code, /rootUrl/);
  assert.match(patches[0].code, /discoveredVia/);
  assert.doesNotThrow(() =>
    new Function(
      `return async () => { var e, t, n; try { const e = { data: { mods: [] } }; ${patches[0].code} const n = []; } catch (e) {} };`,
    ),
  );
}

test().then(
  () => console.log("Hot Reload specs passed"),
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
