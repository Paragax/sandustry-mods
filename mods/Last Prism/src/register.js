export function registerLastPrism({
  api,
  sandkit,
  lastPrism,
  itemId,
  damageUpgradeId,
  damagePerLevel,
}) {
  api.i18n.register("en", {
    "items|paragax.lastPrism|name": "Last Prism",
    "items|paragax.lastPrism|description":
      "Channels six converging rainbow lasers through hard materials.",
    "mods|paragax.lastPrism|upgrade|damage|name": "Prismatic Damage",
    "mods|paragax.lastPrism|upgrade|damage|description":
      "Increases terrain damage from each laser (+{amount} per level).",
  });

  api.items.register(lastPrism);
  api.upgrades.register({
    itemId,
    itemNameKey: "items|paragax.lastPrism|name",
    categoryId: "tools",
    upgrade: {
      id: damageUpgradeId,
      nameKey: "mods|paragax.lastPrism|upgrade|damage|name",
      descriptionKey: "mods|paragax.lastPrism|upgrade|damage|description",
      descriptionParams: { amount: damagePerLevel },
      maxLevel: 3,
      // TODO: Replace temporary zero upgrade costs after balance testing.
      costs: [0, 0, 0],
    },
  });
  api.events.on("game:started", () => {
    const inventory = sandkit.engine.state?.store?.player?.inventory;
    if (!inventory?.some((item) => item.id === itemId)) {
      api.player.inventory.addFromId(itemId);
      api.ui.toast("Last Prism added to inventory");
    }
  });

  console.info("[Last Prism] registered");
}
