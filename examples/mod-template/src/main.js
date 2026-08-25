import { registerMod } from "./register.js";

const MOD_ID = "paragax.mod-id";
const MOD_NAME = "Mod Name";
const MOD_DESCRIPTION = "Replace with a short description of the mod.";

registerMod(sandkit.api, {
  id: MOD_ID,
  name: MOD_NAME,
  description: MOD_DESCRIPTION,
});
