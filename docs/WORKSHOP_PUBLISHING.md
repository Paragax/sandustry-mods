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
  "publishedFileId": "0",
  "descriptionFile": "description.txt",
  "previewFile": "preview.png",
  "visibility": "Private"
}
```

Description content is passed to Steam as raw text. Steam BBCode is supported;
Markdown is not converted. File paths are relative to `metadata.json` and must
remain inside `workshop/`. Visibility can be `Private`, `FriendsOnly`, `Public`,
or `Unlisted`. Use `"0"` as `publishedFileId` for a new item; after Steam creates
it, the publisher writes the assigned ID back to metadata. Existing mods keep
their current Steam Workshop item ID there. The entire directory is
publisher-only and is not copied into the staged runtime mod.

## Release Environments

Prepare and inspect the artifact without uploading:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  .\scripts\publish-workshop.ps1 `
  ".\mods\Last Prism\workshop\metadata.json" -PrepareOnly
```

Upload using the visibility declared in metadata:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  .\scripts\publish-workshop.ps1 `
  ".\mods\Last Prism\workshop\metadata.json"
```

In deployment terms, `-PrepareOnly` builds the artifact. Set metadata visibility
to `Private` for subscribed-copy testing and `Public` for production.

The generated `.workshop/` staging directory and VDF are local-only and
disposable. Tracked `workshop/metadata.json` is the source of truth for which
Workshop item receives an update.
