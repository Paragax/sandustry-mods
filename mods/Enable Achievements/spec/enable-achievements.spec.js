const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function test() {
  const root = path.resolve(__dirname, "..");
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.doesNotMatch(source, /^\s*(?:import|export)\s/m);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "modinfo.json")));
  assert.equal(manifest.gameVersion.minimum, "0.5.5");

  const eventHandlers = {};
  const nextTickCallbacks = [];
  const logs = [];
  const integrity = { cheatsUsed: true, modsUsed: true };
  const sandkit = {
    api: {
      events: {
        on: (id, handler) => {
          eventHandlers[id] = handler;
        },
      },
      schedule: {
        nextTick: (callback) => nextTickCallbacks.push(callback),
      },
    },
    engine: { state: { store: { integrity } } },
  };
  const console = {
    info: (message) => logs.push(message),
  };

  await new Function(
    "sandkit",
    "console",
    `return (async () => { ${source}\n })();`,
  )(sandkit, console);

  assert.equal(integrity.modsUsed, true);
  eventHandlers["mods:initialized"]();
  assert.equal(integrity.modsUsed, false);
  assert.equal(integrity.cheatsUsed, true);
  assert.deepEqual(logs, [
    "[Enable Achievements] active; native achievement checks enabled",
  ]);

  integrity.modsUsed = true;
  nextTickCallbacks[0]();
  assert.equal(integrity.modsUsed, false);
  assert.equal(logs.length, 1);
}

test().then(
  () => console.log("Enable Achievements specs passed"),
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
