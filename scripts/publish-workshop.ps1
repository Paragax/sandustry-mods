[CmdletBinding()]
param(
  [Parameter(Mandatory, Position = 0)]
  [string]$MetadataPath,

  [string]$SteamCmdPath = (Join-Path $env:LOCALAPPDATA "SteamCMD\steamcmd.exe"),
  [string]$SteamUser,
  [string]$ChangeNote,

  [switch]$PrepareOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$modsRoot = [IO.Path]::GetFullPath((Join-Path $repoRoot "mods"))
$resolvedMetadataPath = if ([IO.Path]::IsPathRooted($MetadataPath)) {
  [IO.Path]::GetFullPath($MetadataPath)
} else {
  [IO.Path]::GetFullPath((Join-Path $repoRoot $MetadataPath))
}
if (-not (Test-Path -LiteralPath $resolvedMetadataPath -PathType Leaf)) {
  throw "Missing Workshop metadata: $resolvedMetadataPath"
}

$metadataDirectory = Split-Path -Parent $resolvedMetadataPath
if ((Split-Path -Leaf $metadataDirectory) -ne "workshop") {
  throw "Workshop metadata must live under <mod-folder>\workshop"
}
$modRoot = [IO.Path]::GetFullPath((Split-Path -Parent $metadataDirectory))
$modsPrefix = $modsRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar

if (-not $modRoot.StartsWith($modsPrefix, [StringComparison]::OrdinalIgnoreCase) -or
    -not (Test-Path -LiteralPath $modRoot -PathType Container)) {
  throw "Workshop metadata must belong to a mod under $modsRoot"
}

$manifestPath = Join-Path $modRoot "modinfo.json"
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
  throw "Missing modinfo.json: $manifestPath"
}

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$safeId = [string]$manifest.id
if ($safeId -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') {
  throw "modinfo.json has an invalid id: $safeId"
}
$workerEntryProperty = $manifest.PSObject.Properties["workerEntry"]
$workerEntry = if ($workerEntryProperty) { [string]$workerEntryProperty.Value } else { "" }

$metadata = Get-Content -Raw -LiteralPath $resolvedMetadataPath | ConvertFrom-Json
$workshopTitle = [string]$metadata.title
if ([string]::IsNullOrWhiteSpace($workshopTitle)) {
  throw "Workshop metadata requires title"
}

function Resolve-WorkshopFile([string]$RelativePath, [string]$Label) {
  if ([string]::IsNullOrWhiteSpace($RelativePath) -or [IO.Path]::IsPathRooted($RelativePath)) {
    throw "Workshop metadata requires a relative $Label"
  }
  $resolvedPath = [IO.Path]::GetFullPath((Join-Path $metadataDirectory $RelativePath))
  $metadataPrefix = $metadataDirectory.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
  if (-not $resolvedPath.StartsWith($metadataPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Workshop $Label must stay inside $metadataDirectory"
  }
  if (-not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
    throw "Missing Workshop $Label`: $resolvedPath"
  }
  return $resolvedPath
}

$descriptionPath = Resolve-WorkshopFile ([string]$metadata.descriptionFile) "description file"
$previewPath = Resolve-WorkshopFile ([string]$metadata.previewFile) "preview file"
$workshopDescription = (Get-Content -Raw -LiteralPath $descriptionPath).Trim()

$visibilityValues = @{ Public = 0; FriendsOnly = 1; Private = 2; Unlisted = 3 }
$visibility = [string]$metadata.visibility
if (-not $visibilityValues.ContainsKey($visibility)) {
  throw "Workshop metadata visibility must be Private, FriendsOnly, Public, or Unlisted"
}
$visibilityValue = $visibilityValues[$visibility]

$publishedFileId = [string]$metadata.publishedFileId
if ($publishedFileId -notmatch '^(0|[1-9][0-9]*)$') {
  throw 'Workshop metadata publishedFileId must be "0" or a Steam Workshop item ID'
}

$packagePath = Join-Path $modRoot "package.json"
if (Test-Path -LiteralPath $packagePath -PathType Leaf) {
  Push-Location $modRoot
  try {
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw "Mod tests failed with exit code $LASTEXITCODE" }
  } finally {
    Pop-Location
  }
}

$workshopRoot = Join-Path $repoRoot ".workshop"
$stageRoot = Join-Path (Join-Path $workshopRoot "staging") $safeId
$stagePrefix = (Join-Path $workshopRoot "staging").TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if (-not $stageRoot.StartsWith($stagePrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Staging path escaped .workshop: $stageRoot"
}

if (Test-Path -LiteralPath $stageRoot) {
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

$runtimeFiles = @(
  "modinfo.json",
  [string]$manifest.entry,
  $workerEntry,
  "patches.json",
  "workshop.json",
  "preview.png"
) | Where-Object { $_ } | Select-Object -Unique

foreach ($relativePath in $runtimeFiles) {
  if ([IO.Path]::IsPathRooted($relativePath) -or $relativePath -match '(^|[\\/])\.\.([\\/]|$)') {
    throw "Runtime file path must stay inside the mod: $relativePath"
  }
  $source = Join-Path $modRoot $relativePath
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { continue }
  $destination = Join-Path $stageRoot $relativePath
  New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

foreach ($directory in @("assets", "config", "map")) {
  $source = Join-Path $modRoot $directory
  if (Test-Path -LiteralPath $source -PathType Container) {
    Copy-Item -LiteralPath $source -Destination $stageRoot -Recurse -Force
  }
}

$workshopIgnorePath = Join-Path $modRoot ".workshopignore"
if (Test-Path -LiteralPath $workshopIgnorePath -PathType Leaf) {
  foreach ($relativePath in Get-Content -LiteralPath $workshopIgnorePath) {
    $relativePath = $relativePath.Trim()
    if (-not $relativePath -or $relativePath.StartsWith("#")) { continue }
    if ([IO.Path]::IsPathRooted($relativePath) -or $relativePath -match '(^|[\\/])\.\.([\\/]|$)') {
      throw ".workshopignore path must stay inside the staged mod: $relativePath"
    }
    $ignoredPath = [IO.Path]::GetFullPath((Join-Path $stageRoot $relativePath))
    if (Test-Path -LiteralPath $ignoredPath) {
      Remove-Item -LiteralPath $ignoredPath -Recurse -Force
    }
  }
}

$entryPath = Join-Path $stageRoot ([string]$manifest.entry)
if (-not (Test-Path -LiteralPath $entryPath -PathType Leaf)) {
  throw "Built entry file is missing: $entryPath"
}

$vdfPath = Join-Path $workshopRoot "$safeId.vdf"

function ConvertTo-VdfValue([object]$Value) {
  return ([string]$Value).Replace("\", "\\").Replace('"', '\"')
}

if (-not $ChangeNote) { $ChangeNote = "Version $($manifest.version)" }

$vdf = @"
"workshopitem"
{
  "appid"             "2764460"
  "publishedfileid"   "$publishedFileId"
  "contentfolder"     "$(ConvertTo-VdfValue $stageRoot)"
  "previewfile"       "$(ConvertTo-VdfValue $previewPath)"
  "visibility"        "$visibilityValue"
  "title"             "$(ConvertTo-VdfValue $workshopTitle)"
  "description"       "$(ConvertTo-VdfValue $workshopDescription)"
  "changenote"        "$(ConvertTo-VdfValue $ChangeNote)"
}
"@

New-Item -ItemType Directory -Path $workshopRoot -Force | Out-Null
[IO.File]::WriteAllText($vdfPath, $vdf, [Text.UTF8Encoding]::new($false))

Write-Host "Staged: $stageRoot"
Write-Host "VDF:    $vdfPath"
if ($PrepareOnly) { return }

$steamCmd = Get-Command $SteamCmdPath -ErrorAction SilentlyContinue
if (-not $steamCmd) {
  throw "SteamCMD was not found. Pass -SteamCmdPath with the full path to steamcmd.exe."
}

while ([string]::IsNullOrWhiteSpace($SteamUser)) {
  $SteamUser = Read-Host "Steam account login name"
}
Write-Host "SteamCMD will securely prompt for your password and Steam Guard code."
& $steamCmd.Source "+login" $SteamUser "+workshop_build_item" $vdfPath "+quit"
if ($LASTEXITCODE -ne 0) { throw "SteamCMD failed with exit code $LASTEXITCODE" }

$uploadedVdf = Get-Content -Raw -LiteralPath $vdfPath
if ($uploadedVdf -notmatch '"publishedfileid"\s+"([1-9][0-9]*)"') {
  throw "SteamCMD did not write a Workshop item ID to $vdfPath"
}
$uploadedPublishedFileId = $Matches[1]

if ($publishedFileId -eq "0") {
  $metadata.publishedFileId = $uploadedPublishedFileId
  $updatedMetadata = ($metadata | ConvertTo-Json -Depth 10) + "`n"
  [IO.File]::WriteAllText(
    $resolvedMetadataPath,
    $updatedMetadata,
    [Text.UTF8Encoding]::new($false)
  )
  Write-Host "Saved Workshop item ID to: $resolvedMetadataPath"
} elseif ($uploadedPublishedFileId -ne $publishedFileId) {
  throw "SteamCMD returned Workshop item $uploadedPublishedFileId instead of $publishedFileId"
}

Write-Host "Workshop item: https://steamcommunity.com/sharedfiles/filedetails/?id=$uploadedPublishedFileId"
