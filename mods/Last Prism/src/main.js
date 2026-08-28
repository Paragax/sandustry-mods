import { createBeamController } from "./beam-controller.js";
import { registerLastPrism } from "./register.js";

const api = sandkit.api;
const { ActionState } = sandkit.enums;

const ITEM_ID = "paragax.last-prism";
const SPRITE_ID = "paragax.last-prism.sprite";
const SPRITE_SIZE = { width: 26, height: 30 };
const BEAM_COUNT = 6;
const MAX_SPREAD_RADIANS = Math.PI / 12;
const DAMAGE_UPGRADE_ID = "damage";
const DAMAGE_PER_LEVEL = 1;
const THICKNESS_UPGRADE_ID = "thickness";
const THICKNESS_PER_LEVEL_PERCENT = 100;
const DIVERGENCE_UPGRADE_ID = "divergence";
const DIVERGENCE_BINDING_ID = "paragax.last-prism.diverge";
const ICE_MELT_UPGRADE_ID = "iceMelt";

const nativeLaser = api.items.getDefinitionById("laser");
if (!nativeLaser) {
  throw new Error("[Last Prism] Native laser definition was not found");
}

await api.sprites.loadFromMod(
  SPRITE_ID,
  "assets/last-prism.png",
);

const config = {
  ...nativeLaser.config,
  // TODO: Add a real energy cost after balance testing.
  energyCost: 0,
  beamCount: BEAM_COUNT,
  maxSpreadRadians: MAX_SPREAD_RADIANS,
};
const excavationPattern = api.patterns.createCircle(
  config.patternSize,
);
const beamController = createBeamController(
  api,
  ActionState,
  config,
  excavationPattern,
  ITEM_ID,
  DAMAGE_UPGRADE_ID,
  DAMAGE_PER_LEVEL,
  THICKNESS_UPGRADE_ID,
  THICKNESS_PER_LEVEL_PERCENT,
  ICE_MELT_UPGRADE_ID,
);

const lastPrism = {
  ...nativeLaser,
  id: ITEM_ID,
  nameKey: "items|paragax.lastPrism|name",
  descriptionKey: "items|paragax.lastPrism|description",
  sprite: {
    ...nativeLaser.sprite,
    id: SPRITE_ID,
    ui: {
      ...nativeLaser.sprite.ui,
      imageName: SPRITE_ID,
      // Hotbar rendering otherwise assumes a 16x16 source rectangle.
      size: SPRITE_SIZE,
    },
  },
  config,
  handleAction: beamController.handleAction,
  afterRender: beamController.afterRender,
};

registerLastPrism({
  api,
  lastPrism,
  beamController,
  itemId: ITEM_ID,
  damageUpgradeId: DAMAGE_UPGRADE_ID,
  damagePerLevel: DAMAGE_PER_LEVEL,
  thicknessUpgradeId: THICKNESS_UPGRADE_ID,
  thicknessPerLevelPercent: THICKNESS_PER_LEVEL_PERCENT,
  divergenceUpgradeId: DIVERGENCE_UPGRADE_ID,
  divergenceBindingId: DIVERGENCE_BINDING_ID,
  iceMeltUpgradeId: ICE_MELT_UPGRADE_ID,
});
