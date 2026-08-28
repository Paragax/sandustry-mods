import { hexToLightColor, hueToHex } from "./colors.js";

export function createBeamController(
  api,
  ActionState,
  config,
  excavationPattern,
  itemId,
  damageUpgradeId,
  damagePerLevel,
  thicknessUpgradeId,
  thicknessPerLevelPercent,
  iceMeltUpgradeId,
) {
  const COLOR_CYCLE_MS = 1800;
  // Sandustry 0.5.5 does not expose the held-item origin. These offsets match
  // the native laser's player-relative origin in the installed 0.5.5 build.
  const NATIVE_ORIGIN_OFFSET_CELLS = { x: 1.25, y: 3 };
  const ICE_TERRAIN_TYPE = api.terrains.getTypeById("ice");
  const WATER_ELEMENT_TYPE = api.elements.getTypeById("water");

  let beamGraphics = [];
  let chargeProgress = 0;
  let chargeUpdatedAtMs = null;
  let animationStartMs = null;
  let alternateAnimationStartMs = null;
  let firingMode = null;
  let alternateHeld = false;
  let fullChargeFeedbackPlayed = false;

  function destroyBeams() {
    for (const beam of beamGraphics) {
      beam.destroy();
    }
    beamGraphics = [];
  }

  function resetCharge() {
    firingMode = null;
    chargeProgress = 0;
    chargeUpdatedAtMs = null;
    animationStartMs = null;
    alternateAnimationStartMs = null;
    fullChargeFeedbackPlayed = false;
  }

  function startCharge(now, mode) {
    firingMode = mode;
    chargeUpdatedAtMs = now;
    animationStartMs ??= now;
    api.sound.play("charge_up", {
      offset: 1.5,
      volume: 0.2,
      fadeIn: 1.5,
    });
    api.sound.play("charge_up_2", {
      maxDuration: 0.95,
      volume: 0.1,
    });
    api.sound.play("charge_up_3", {
      maxDuration: 1,
      offset: api.random.float(0.5, 2),
      volume: 0.05,
      fadeIn: 1,
    });
  }

  function getBeamFrame(now, alternate) {
    const player = api.player.getPositionAtWorld();
    const cellSize = api.rendering.getGridMetrics().cellSize;
    const originX = player.x + NATIVE_ORIGIN_OFFSET_CELLS.x * cellSize;
    const originY = player.y + NATIVE_ORIGIN_OFFSET_CELLS.y * cellSize;
    const mouse = api.input.getMousePositionAtWorld();
    const aimAngle = Math.atan2(mouse.y - originY, mouse.x - originX);
    if (!alternate) {
      const elapsedMs = chargeUpdatedAtMs === null
        ? 0
        : Math.max(now - chargeUpdatedAtMs, 0);
      chargeUpdatedAtMs = now;
      chargeProgress = Math.min(1, chargeProgress + elapsedMs / config.chargeMs);
    }

    const progress = alternate ? 0 : chargeProgress;
    const focused = !alternate && progress >= 1;
    const smoothProgress = progress * progress * (3 - 2 * progress);
    const spread = config.maxSpreadRadians * (1 - smoothProgress);
    const animationStart = alternate
      ? alternateAnimationStartMs
      : animationStartMs;
    const spin = ((now - animationStart) / config.chargeMs) * Math.PI * 4;
    const baseWidth = 1 + 2 * progress;
    const thicknessLevel = api.upgrades.getLevelById(
      itemId,
      thicknessUpgradeId,
    );
    const width = baseWidth *
      (1 + (thicknessPerLevelPercent / 100) * thicknessLevel);
    const brightness = alternate
      ? 1
      : progress < 1 ? 0.1 + 0.4 * progress : 1;
    const damageLevel = api.upgrades.getLevelById(itemId, damageUpgradeId);
    const perBeamDamage = config.excavationPower + damagePerLevel * damageLevel;
    const damage = perBeamDamage * (focused ? config.beamCount : 1);
    const meltsIce = api.upgrades.getLevelById(itemId, iceMeltUpgradeId) > 0;

    return {
      now,
      originX,
      originY,
      aimAngle,
      spread,
      spin,
      width,
      brightness,
      cellSize,
      maxRangeWorldPixels: config.maxRangeCells * cellSize,
      damage,
      focused,
      meltsIce,
    };
  }

  function getBeamAngle(index, frame) {
    if (frame.focused) {
      return frame.aimAngle;
    }
    const lane = (index - (config.beamCount - 1) / 2) /
      ((config.beamCount - 1) / 2);
    const wobble =
      Math.sin(frame.spin + (index * Math.PI * 2) / config.beamCount) *
      frame.spread *
      0.25;
    return frame.aimAngle + lane * frame.spread + wobble;
  }

  function meltIceAtImpact(hit, frame) {
    const radius = frame.width / (frame.cellSize * 2);
    api.grid.mutate((writer) => {
      api.grid.forEachCellInCircle(
        hit.cellX,
        hit.cellY,
        radius,
        (cellX, cellY) => {
          if (api.terrains.getTypeAtCell(cellX, cellY) === ICE_TERRAIN_TYPE) {
            writer.elements.replaceAtCell(cellX, cellY, WATER_ELEMENT_TYPE);
          }
        },
      );
    });
  }

  function createImpact(index, hit, endX, endY, angle, color, frame) {
    const outVelocity = {
      x: 300 * Math.cos(angle),
      y: 300 * -Math.sin(angle),
    };
    if (
      frame.meltsIce &&
      api.terrains.getTypeAtCell(hit.cellX, hit.cellY) === ICE_TERRAIN_TYPE
    ) {
      meltIceAtImpact(hit, frame);
    } else {
      api.patterns.excavateAtCell(
        hit.cellX,
        hit.cellY,
        excavationPattern,
        outVelocity,
        frame.damage,
        { fromDrill: true },
      );
    }
    api.lights.temporary.createAtWorld(endX, endY, {
      brightness: frame.brightness,
      durationMs: 300,
      size: 300,
      color: hexToLightColor(color),
      dedupKey: `last-prism:impact:${index}`,
    });
    api.effects.createParticlesAtWorld(endX, endY, {
      count: 8,
      minSpeed: 100,
      maxSpeed: 200,
      color,
      minSize: 1,
      maxSize: 2,
      minLifetime: 0.2,
      maxLifetime: 0.4,
    });
  }

  function createBeam(index, frame) {
    const angle = getBeamAngle(index, frame);
    const hit = api.raycast.castAtWorld(
      frame.originX,
      frame.originY,
      angle,
      frame.maxRangeWorldPixels,
    );
    const endX = hit
      ? frame.originX + Math.cos(angle) * hit.distanceWorldPixels
      : frame.originX + Math.cos(angle) * frame.maxRangeWorldPixels;
    const endY = hit
      ? frame.originY + Math.sin(angle) * hit.distanceWorldPixels
      : frame.originY + Math.sin(angle) * frame.maxRangeWorldPixels;
    const color = hueToHex(
      (frame.now * 360) / COLOR_CYCLE_MS + (index * 360) / config.beamCount,
    );
    const startDraw = api.rendering.getDrawPositionAtWorld(
      frame.originX,
      frame.originY,
    );
    const endDraw = api.rendering.getDrawPositionAtWorld(endX, endY);

    beamGraphics.push(
      api.effects.createLaserAtWorld(
        startDraw.x,
        startDraw.y,
        endDraw.x,
        endDraw.y,
        { width: frame.width, brightness: frame.brightness, color, glow: true },
      ),
    );

    if (!hit) {
      return false;
    }

    createImpact(index, hit, endX, endY, angle, color, frame);
    return true;
  }

  function renderBeams(now, alternate) {
    const frame = getBeamFrame(now, alternate);
    const beamCount = frame.focused ? 1 : config.beamCount;
    let hitAnything = false;
    for (let index = 0; index < beamCount; index += 1) {
      hitAnything = createBeam(index, frame) || hitAnything;
    }

    if (frame.focused && !fullChargeFeedbackPlayed) {
      fullChargeFeedbackPlayed = true;
      api.lights.temporary.createAtWorld(frame.originX, frame.originY, {
        brightness: 2,
        durationMs: 250,
        size: 450,
        color: [1, 1, 1, 1],
        dedupKey: "last-prism:full-charge",
      });
      api.sound.play("charge_up_2", {
        maxDuration: 0.35,
        playbackRate: 1.5,
        volume: 0.25,
        maxInstances: 1,
      });
    }

    api.lights.temporary.createAtWorld(frame.originX, frame.originY, {
      brightness: 0.8 * frame.brightness,
      durationMs: 1,
      size: 300,
      color: [1, 1, 1, 1],
      dedupKey: "last-prism:origin",
    });

    if (hitAnything) {
      api.sound.play("laser_hit", {
        playbackRate: api.random.float(0.1, 1.5),
        volume: 0.02,
        maxInstances: 96,
      });
    }
  }

  function handleAction(state) {
    if (alternateHeld) {
      return;
    }

    destroyBeams();

    // Sandkit documents ActionState, but not the cloned item callback payload.
    // Keep the remaining native callback dependency isolated to this read.
    const actionState = state.session.action.state;
    if (!actionState[ActionState.Active]) {
      resetCharge();
      return;
    }

    const target = api.input.getMousePositionAtCell();
    if (!api.authorization.canUseToolAtCell(target.x, target.y)) {
      if (actionState[ActionState.Start]) {
        api.ui.toast("Last Prism cannot be used here");
      }
      resetCharge();
      return;
    }

    const now = api.time.getElapsedMs();
    if (actionState[ActionState.Start] || firingMode !== "converge") {
      startCharge(now, "converge");
    }

    renderBeams(now, false);
  }

  function handleAlternateAction() {
    const starting = !alternateHeld;
    alternateHeld = true;
    destroyBeams();

    const target = api.input.getMousePositionAtCell();
    if (!api.authorization.canUseToolAtCell(target.x, target.y)) {
      if (starting) {
        api.ui.toast("Last Prism cannot be used here");
      }
      resetCharge();
      return;
    }

    const now = api.time.getElapsedMs();
    if (starting) {
      resetCharge();
      alternateAnimationStartMs = now;
    }

    renderBeams(now, true);
  }

  function stopAlternateAction() {
    if (!alternateHeld) {
      return;
    }
    alternateHeld = false;
    destroyBeams();
    resetCharge();
  }

  function afterRender() {
    const active = api.action.getActive();
    if (!active || active.id !== itemId) {
      stopAlternateAction();
    }
  }

  return {
    handleAction,
    handleAlternateAction,
    stopAlternateAction,
    afterRender,
  };
}
