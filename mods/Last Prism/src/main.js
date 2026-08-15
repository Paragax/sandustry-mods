import { createBeamController } from "./beam-controller.js";
import { registerLastPrism } from "./register.js";

const api = sandkit.api;
const { ActionState } = sandkit.enums;

const ITEM_ID = "paragax.last-prism";
const SPRITE_ID = "paragax.last-prism.sprite";
const NATIVE_WINDUP_MS = 1000;
const NATIVE_RANGE_PX = 1000;
const BEAM_COUNT = 6;
const MAX_SPREAD_RADIANS = Math.PI / 12;

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
  windupMs: NATIVE_WINDUP_MS,
  maxRangePx: NATIVE_RANGE_PX,
  beamCount: BEAM_COUNT,
  maxSpreadRadians: MAX_SPREAD_RADIANS,
};
const excavationPattern = api.patterns.createCircle(
  config.normalPatternSize,
);
const beamController = createBeamController(
  api,
  ActionState,
  config,
  excavationPattern,
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
    },
  },
  config,
  handleAction: beamController.handleAction,
  afterRender: () => {},
};

registerLastPrism({
  api,
  sandkit,
  lastPrism,
  itemId: ITEM_ID,
});
