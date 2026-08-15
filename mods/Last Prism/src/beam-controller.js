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
) {
  const COLOR_CYCLE_MS = 1800;
  const BASE_BEAM_DAMAGE = 1;

  let beamGraphics = [];
  let chargeStartMs = 0;
  let charged = false;
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
    charged = false;
    chargeStartMs = 0;
  }

  function startCharge(now, mode) {
    firingMode = mode;
    charged = false;
    chargeStartMs = now;
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

  function getBeamFrame(state, now, diverging) {
    const player = state.store.player;
    const originX = player.x + player.width / 2;
    const originY = player.y + player.height / 2 + 2;
    const mouse = state.session.input.mouse.worldPosition;
    const aimAngle = Math.atan2(mouse.y - originY, mouse.x - originX);
    const centralHit = api.raycast.castFromWorld(
      originX,
      originY,
      aimAngle,
      config.maxRangePx,
    );

    if (!centralHit && !charged) {
      chargeStartMs = now;
    }

    const progress = Math.min((now - chargeStartMs) / config.windupMs, 1);
    charged ||= progress >= 1;

    const smoothProgress = progress * progress * (3 - 2 * progress);
    const spreadProgress = diverging ? 1 - smoothProgress : smoothProgress;
    const spread = config.maxSpreadRadians * (1 - spreadProgress);
    const spin = progress * Math.PI * 4;
    const baseWidth = progress < 1 ? 1 + 2 * progress : 3;
    const thicknessLevel = api.upgrades.getLevelById(
      itemId,
      thicknessUpgradeId,
    );
    const width = baseWidth *
      (1 + (thicknessPerLevelPercent / 100) * thicknessLevel);
    const brightness = progress < 1 ? 0.1 + 0.4 * progress : 1;
    const cellSize = api.rendering.getGridMetrics().cellSize;
    const camera = state.session.camera;
    const damageLevel = api.upgrades.getLevelById(itemId, damageUpgradeId);
    const damage = BASE_BEAM_DAMAGE + damagePerLevel * damageLevel;

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
    };
  }

  function getBeamAngle(index, frame) {
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
    api.patterns.excavateAtCell(
      hit.x,
      hit.y,
      excavationPattern,
      outVelocity,
      frame.damage,
      { fromDrill: true },
    );
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

  function renderBeams(state, now, diverging) {
    const frame = getBeamFrame(state, now, diverging);
    let hitAnything = false;
    for (let index = 0; index < config.beamCount; index += 1) {
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
    if (starting || firingMode !== "diverge") {
      startCharge(now, "diverge");
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
