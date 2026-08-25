export function registerMod(api, mod) {
  api.i18n.register("en", {
    [`mods|${mod.id}|name`]: mod.name,
    [`mods|${mod.id}|description`]: mod.description,
  });

  api.events.on("game:started", () => {
    api.ui.toast(`${mod.name} loaded`);
  });

  console.info(`[${mod.name}] registered`);
}
