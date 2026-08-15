export function registerLastPrism({
  api,
  sandkit,
  lastPrism,
  itemId,
}) {
  api.i18n.register("en", {
    "items|paragax.lastPrism|name": "Last Prism",
    "items|paragax.lastPrism|description":
      "Channels six converging rainbow lasers through hard materials.",
  });

  api.items.register(lastPrism);
  api.events.on("game:started", () => {
    const inventory = sandkit.engine.state?.store?.player?.inventory;
    if (!inventory?.some((item) => item.id === itemId)) {
      api.player.inventory.addFromId(itemId);
      api.ui.toast("Last Prism added to inventory");
    }
  });

  console.info("[Last Prism] registered");
}
