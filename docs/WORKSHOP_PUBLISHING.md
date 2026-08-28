# Workshop Publishing for Sandustry 0.5.5

> Official Sandkit source: <https://sandustry.com/sandkit.html>
> Synced: 2026-08-28

## Officially documented files

The Sandustry 0.5.5 Sandkit page documents two root-level Workshop files:

```text
example-mod/
├── preview.png      # 512x512px, required for Workshop upload
└── workshop.json    # generated after the first upload (don't change!)
```

The official page does not document the upload command, publisher UI,
`workshop.json` schema, SteamCMD workflow, or any separate publishing metadata
format. Do not infer those details from older game builds.

## Repository-specific tooling

This repository still contains the pre-0.5.5 SteamCMD publisher and
`<mod>/workshop/metadata.json` convention. Those are repository tooling, not
official Sandkit 0.5.5 APIs or manifest fields.

Repository metadata records the intended Workshop version link using the same
minimum/maximum convention as the 0.5.5 manifest:

```json
{
  "gameVersion": {
    "maximum": "0.5.2"
  }
}
```

The publisher validates and reports this range, but SteamCMD does not apply it.
After publishing an old patch-based release, open its Steam Workshop page and
set `Change Notes -> Link to Game Version -> Maximum` to `0.5.2`. For a release
that uses the 0.5.5 API, set the minimum to `0.5.5` instead.

Assume that workflow is incompatible until it is explicitly revalidated
against Sandustry 0.5.5. Do not publish with it based only on the old local
instructions.
