export function registerLastPrism({
  api,
  sandkit,
  lastPrism,
  beamController,
  itemId,
  damageUpgradeId,
  damagePerLevel,
  thicknessUpgradeId,
  thicknessPerLevelPercent,
  divergenceUpgradeId,
  divergenceBindingId,
  iceMeltUpgradeId,
}) {
  api.i18n.register("en", {
    "items|paragax.lastPrism|name": "Last Prism",
    "items|paragax.lastPrism|description":
      "Channels six converging rainbow lasers through hard materials.",
    "mods|paragax.lastPrism|upgrade|damage|name": "Prismatic Damage",
    "mods|paragax.lastPrism|upgrade|damage|description":
      "Increases terrain damage from each laser (+{amount} per level).",
    "mods|paragax.lastPrism|upgrade|thickness|name": "Beam Thickness",
    "mods|paragax.lastPrism|upgrade|thickness|description":
      "Increases thickness of each beam (+{percent}% per level).",
    "mods|paragax.lastPrism|upgrade|divergence|name":
      "Divergent Refraction",
    "mods|paragax.lastPrism|upgrade|divergence|description":
      "Unlocks six revolving, wide-spread beams on right-click.",
    "mods|paragax.lastPrism|upgrade|iceMelt|name": "Ice Melting",
    "mods|paragax.lastPrism|upgrade|iceMelt|description":
      "Allows each beam to melt ice into water.",
    "mods|paragax.lastPrism|input|diverge|name": "Divergent Fire",
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
  api.upgrades.register({
    itemId,
    upgrade: {
      id: thicknessUpgradeId,
      nameKey: "mods|paragax.lastPrism|upgrade|thickness|name",
      descriptionKey: "mods|paragax.lastPrism|upgrade|thickness|description",
      descriptionParams: { percent: thicknessPerLevelPercent },
      maxLevel: 4,
      // TODO: Replace temporary zero upgrade costs after balance testing.
      costs: [0, 0, 0, 0],
    },
  });
  api.upgrades.register({
    itemId,
    upgrade: {
      id: divergenceUpgradeId,
      nameKey: "mods|paragax.lastPrism|upgrade|divergence|name",
      descriptionKey: "mods|paragax.lastPrism|upgrade|divergence|description",
      maxLevel: 1,
      // TODO: Replace temporary zero upgrade costs after balance testing.
      costs: [0],
      oneOff: true,
    },
  });
  api.upgrades.register({
    itemId,
    upgrade: {
      id: iceMeltUpgradeId,
      nameKey: "mods|paragax.lastPrism|upgrade|iceMelt|name",
      descriptionKey: "mods|paragax.lastPrism|upgrade|iceMelt|description",
      maxLevel: 1,
      // TODO: Replace temporary zero upgrade costs after balance testing.
      costs: [0],
      oneOff: true,
    },
  });

  const fireDiverging = () => {
    const active = api.action.getActive();
    const unlocked = api.upgrades.getLevelById(itemId, divergenceUpgradeId) > 0;
    if (!active || active.id !== itemId || !unlocked) {
      beamController.stopAlternateAction();
      return;
    }

    // Input callbacks do not receive state. Keep this unstable escape hatch
    // isolated until Sandustry exposes current state through the public API.
    const state = sandkit.engine.state;
    if (state) {
      beamController.handleAlternateAction(state);
    }
  };
  api.input.registerBinding(divergenceBindingId, ["MouseRight"], {
    displayNameKey: "mods|paragax.lastPrism|input|diverge|name",
    category: "items|paragax.lastPrism|name",
    handlers: {
      down: fireDiverging,
      pressed: fireDiverging,
      released: beamController.stopAlternateAction,
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
