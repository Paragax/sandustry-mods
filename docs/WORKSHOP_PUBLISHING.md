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

Do not add `gameVersion` to repository Workshop metadata. SteamCMD cannot apply
the Workshop version link, so such a field has no publishing effect. Keep the
runtime compatibility range in `modinfo.json`, where Sandustry enforces it.

Set Workshop compatibility manually under
`Change Notes -> Link to Game Version`. The SteamCMD workflow was successfully
revalidated with Sandustry 0.5.5 on 2026-08-28.
