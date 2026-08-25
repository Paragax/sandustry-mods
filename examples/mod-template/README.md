# Bundled Mod Template

Copy this directory to `mods/<Mod Name>/`, then replace every occurrence of:

- `paragax.mod-id` with the stable Sandustry mod ID.
- `paragax-mod-id` with the npm package name.
- `Mod Name` with the player-facing name.
- Placeholder descriptions with real copy.

Add `workshop/preview.png` before preparing or publishing the Workshop item.
Keep `publishedFileId` set to `"0"` until the first successful upload.
Before committing the cloned mod, remove all template comments, placeholder
values, unused example code, and this README.

Install and verify from the copied mod directory:

```powershell
npm install
npm test
```

Edit `src/`; `npm test` rebuilds generated `main.js`. Add feature modules under
`src/` and matching behavior checks to `spec/mod.spec.js` as the mod grows.
