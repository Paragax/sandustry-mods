# Steam Workshop Publishing

Workshop publishing is handled by `scripts/publish-workshop.ps1`. Sandustry's
runtime mod format and this repository's publishing metadata are separate.

## Source Layout

Each published mod can keep its Steam-facing files together:

```text
mods/
  example-mod/
    modinfo.json
    main.js
    assets/
    workshop/
      metadata.json
      description.txt
      preview.png
```

`workshop/metadata.json` supports:

```json
{
  "title": "Example Mod",
  "descriptionFile": "workshop/description.txt",
  "previewFile": "workshop/preview.png"
}
```

Description content is passed to Steam as raw text. Steam BBCode is supported;
Markdown is not converted. The entire `workshop/` directory is publisher-only
and is not copied into the staged runtime mod.

## Release Environments

Prepare and inspect the artifact without uploading:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  .\scripts\publish-workshop.ps1 -Mod "Last Prism" -PrepareOnly
```

Upload privately for subscribed-copy testing:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  .\scripts\publish-workshop.ps1 -Mod "Last Prism"
```

Publish the tested item publicly:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  .\scripts\publish-workshop.ps1 -Mod "Last Prism" -Visibility Public
```

In deployment terms, `-PrepareOnly` builds the artifact, the default private
upload is the test environment, and `-Visibility Public` is production.

The generated `.workshop/<mod-id>.vdf` is local-only. Keep it between uploads:
SteamCMD stores the `publishedfileid` there so later releases update the same
Workshop item.
