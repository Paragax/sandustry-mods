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
  const BASE_BEAM_DAMAGE = 1;
  const ICE_TERRAIN_TYPE = api.terrains.getTypeFromId("ice");
  const WATER_ELEMENT_TYPE = api.elements.getTypeFromId("water");

  let beamGraphics = [];
  let chargeProgress = 0;
  let chargeUpdatedAtMs = null;
  let animationStartMs = null;
  let alternateAnimationStartMs = null;
  let firingMode = null;
  let alternateHeld = false;

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

  function getBeamFrame(state, now, alternate) {
    const player = state.store.player;
    const originX = player.x + player.width / 2;
    const originY = player.y + player.height / 2 + 2;
    const mouse = state.session.input.mouse.worldPosition;
    const aimAngle = Math.atan2(mouse.y - originY, mouse.x - originX);
    if (!alternate) {
      const centralHit = api.raycast.castFromWorld(
        originX,
        originY,
        aimAngle,
        config.maxRangePx,
      );
      const elapsedMs = chargeUpdatedAtMs === null
        ? 0
        : Math.max(now - chargeUpdatedAtMs, 0);
      chargeUpdatedAtMs = now;
      if (!centralHit && chargeProgress < 1) {
        chargeProgress = 0;
      } else {
        chargeProgress = Math.max(
          0,
          Math.min(1, chargeProgress + elapsedMs / config.windupMs),
        );
      }
    }

    const progress = alternate ? 0 : chargeProgress;
    const visualProgress = alternate ? 1 : progress;
    const focused = !alternate && progress >= 1;
    const smoothProgress = progress * progress * (3 - 2 * progress);
    const spread = config.maxSpreadRadians * (1 - smoothProgress);
    const animationStart = alternate
      ? alternateAnimationStartMs
      : animationStartMs;
    const spin = ((now - animationStart) / config.windupMs) * Math.PI * 4;
    const baseWidth = visualProgress < 1
      ? 1 + 2 * visualProgress
      : 3;
    const thicknessLevel = api.upgrades.getLevelById(
      itemId,
      thicknessUpgradeId,
    );
    const width = baseWidth *
      (1 + (thicknessPerLevelPercent / 100) * thicknessLevel);
    const brightness = alternate
      ? 1
      : progress < 1 ? 0.1 + 0.4 * progress : 1;
    const cellSize = api.rendering.getGridMetrics().cellSize;
    const camera = state.session.camera;
    const damageLevel = api.upgrades.getLevelById(itemId, damageUpgradeId);
    const perBeamDamage = BASE_BEAM_DAMAGE + damagePerLevel * damageLevel;
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
      camera,
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

  function createImpact(index, hit, endX, endY, angle, color, frame) {
    const outVelocity = {
      x: 300 * Math.cos(angle),
      y: 300 * -Math.sin(angle),
    };
    if (
      frame.meltsIce &&
      api.terrains.getTypeAtCell(hit.x, hit.y) === ICE_TERRAIN_TYPE
    ) {
      api.elements.replaceAtCellWhenIdle(
        hit.x,
        hit.y,
        WATER_ELEMENT_TYPE,
      );
    } else {
      api.patterns.excavateAtCell(
        hit.x,
        hit.y,
        excavationPattern,
        outVelocity,
        frame.damage,
        { fromDrill: true },
      );
    }
    api.effects.createLightAtWorld(endX, endY, {
      brightness: frame.brightness,
      duration: 300,
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
    const hit = api.raycast.castFromWorld(
      frame.originX,
      frame.originY,
      angle,
      config.maxRangePx,
    );
    const endX = hit
      ? hit.x * frame.cellSize
      : frame.originX + Math.cos(angle) * config.maxRangePx;
    const endY = hit
      ? hit.y * frame.cellSize
      : frame.originY + Math.sin(angle) * config.maxRangePx;
    const color = hueToHex(
      (frame.now * 360) / COLOR_CYCLE_MS + (index * 360) / config.beamCount,
    );

    // createLaserAtWorld currently forwards screen coordinates to the native
    // renderer, so mirror the native laser's camera offset.
    beamGraphics.push(
      api.effects.createLaserAtWorld(
        frame.originX - frame.camera.x,
        frame.originY - frame.camera.y,
        endX - frame.camera.x,
        endY - frame.camera.y,
        { width: frame.width, brightness: frame.brightness, color, glow: true },
      ),
    );

    if (!hit) {
      return false;
    }

    createImpact(index, hit, endX, endY, angle, color, frame);
    return true;
  }

  function renderBeams(state, now, alternate) {
    const frame = getBeamFrame(state, now, alternate);
    const beamCount = frame.focused ? 1 : config.beamCount;
    let hitAnything = false;
    for (let index = 0; index < beamCount; index += 1) {
      hitAnything = createBeam(index, frame) || hitAnything;
    }

    api.effects.createLightAtWorld(frame.originX, frame.originY, {
      brightness: 0.8 * frame.brightness,
      duration: 1,
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

    const actionState = state.session.action.state;
    if (!actionState[ActionState.Active]) {
      resetCharge();
      return;
    }

    if (!api.authorization.canUseTool(state.store.player)) {
      if (actionState[ActionState.Start]) {
        api.ui.toast("Last Prism cannot be used here");
      }
      resetCharge();
      return;
    }

    const now = api.time.getTimeMs();
    if (actionState[ActionState.Start] || firingMode !== "converge") {
      startCharge(now, "converge");
    }

    renderBeams(state, now, false);
  }

  function handleAlternateAction(state) {
    const starting = !alternateHeld;
    alternateHeld = true;
    destroyBeams();

    if (!api.authorization.canUseTool(state.store.player)) {
      if (starting) {
        api.ui.toast("Last Prism cannot be used here");
      }
      resetCharge();
      return;
    }

    const now = api.time.getTimeMs();
    if (starting) {
      resetCharge();
      alternateAnimationStartMs = now;
    }

    renderBeams(state, now, true);
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
