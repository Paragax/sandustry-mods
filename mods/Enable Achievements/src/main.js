const api = sandkit.api;
let logged = false;

function enableAchievements() {
  const integrity = sandkit.engine.state?.store?.integrity;
  if (!integrity) {
    return;
  }

  integrity.modsUsed = false;
  if (!logged) {
    logged = true;
    console.info(
      "[Enable Achievements] active; native achievement checks enabled",
    );
  }
}

// Undocumented: Sandustry 0.5.2 emits this after loading every external mod
// and immediately before scanning existing achievement progress.
api.events.on("mods:initialized", enableAchievements);

// Fallback for later builds where the internal initialization event changes.
api.schedule.nextTick(enableAchievements);
