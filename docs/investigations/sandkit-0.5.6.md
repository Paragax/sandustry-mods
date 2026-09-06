# Sandkit 0.5.6 API additions

## Context

Sandustry Update #3 moved the experimental `mods` Steam branch to 0.5.6 and
announced new APIs for mods.

## Evidence

The official [Sandkit reference](https://sandustry.com/sandkit.html), checked
2026-09-06, documents:

- Main-entry event `building:removing`, with `structureId`, `x`, `y`, and
  `byMove` payload fields.
- Worker-entry hook `fire:terrain:burn`, guarded by `terrainType`.
- `api.terrains.meltAtCell(cellX, cellY)` in both main and worker APIs.

## Conclusion

Treat these as supported from 0.5.6 onward. Prefer `meltAtCell` over manually
replacing ice with water when native melting behavior is intended.

## Remaining uncertainty

The reference lists `meltAtCell` without a return value or behavioral detail
beyond its name. Test its exact terrain and output behavior before relying on
it for custom mechanics.
