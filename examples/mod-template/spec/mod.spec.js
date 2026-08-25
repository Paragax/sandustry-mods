const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function test() {
  const source = fs.readFileSync(path.resolve(__dirname, "../main.js"), "utf8");
  assert.doesNotMatch(source, /^\s*(?:import|export)\s/m);

  const translations = {};
  const eventHandlers = {};
  const toasts = [];
  const sandkit = {
    api: {
      events: {
        on: (id, handler) => {
          eventHandlers[id] = handler;
        },
      },
      i18n: {
        register: (locale, entries) => Object.assign(translations, entries),
      },
      ui: { toast: (message) => toasts.push(message) },
    },
  };

  await new Function("sandkit", `return (async () => { ${source}\n })();`)(
    sandkit,
  );

  assert.equal(translations["mods|paragax.mod-id|name"], "Mod Name");
  assert.equal(
    translations["mods|paragax.mod-id|description"],
    "Replace with a short description of the mod.",
  );
  eventHandlers["game:started"]();
  assert.deepEqual(toasts, ["Mod Name loaded"]);
}

test().then(
  () => console.log("Mod template specs passed"),
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
