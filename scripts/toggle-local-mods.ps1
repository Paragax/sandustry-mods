[CmdletBinding()]
param(
  [ValidateSet("Enable", "Disable", "Status")]
  [string]$Mode = "Status"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$repoRootItem = Get-Item -Force -LiteralPath $repoRoot
$canonicalRepoRoot = if ($repoRootItem.LinkType -eq "Junction") {
  [string]$repoRootItem.Target[0]
} else {
  $repoRoot
}
$repoMods = [IO.Path]::GetFullPath((Join-Path $canonicalRepoRoot "mods"))
$localMods = Join-Path $env:APPDATA "Sandustry\mods"
$markerName = ".local-mods-disabled-by-sandustry-mods"
$markerPath = Join-Path $localMods $markerName

function Test-SamePath([string]$Left, [string]$Right) {
  return [IO.Path]::GetFullPath($Left).TrimEnd("\") -eq
    [IO.Path]::GetFullPath($Right).TrimEnd("\")
}

function Get-LocalModsItem {
  if (Test-Path -LiteralPath $localMods) {
    return Get-Item -Force -LiteralPath $localMods
  }
  return $null
}

function Write-Status {
  $item = Get-LocalModsItem
  if (-not $item) {
    Write-Host "Local mods: missing"
  } elseif ($item.LinkType -eq "Junction" -and
      (Test-SamePath ([string]$item.Target[0]) $repoMods)) {
    Write-Host "Local mods: enabled -> $repoMods"
  } elseif (-not $item.LinkType -and (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
    Write-Host "Local mods: disabled (empty directory)"
  } else {
    Write-Host "Local mods: unmanaged path at $localMods"
  }
}

if ($Mode -eq "Status") {
  Write-Status
  return
}

if (Get-Process -Name "Sandustry" -ErrorAction SilentlyContinue) {
  throw "Close Sandustry before changing the local mods path."
}

$item = Get-LocalModsItem
if ($Mode -eq "Disable") {
  if ($item -and $item.LinkType -eq "Junction") {
    if (-not (Test-SamePath ([string]$item.Target[0]) $repoMods)) {
      throw "Refusing to remove an unmanaged junction: $localMods -> $($item.Target[0])"
    }
    [IO.Directory]::Delete($localMods, $false)
    $item = $null
  } elseif ($item -and -not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
    throw "Refusing to replace an unmanaged directory: $localMods"
  }

  if (-not $item) {
    New-Item -ItemType Directory -Path $localMods -Force | Out-Null
    [IO.File]::WriteAllText($markerPath, "Local repository mods are disabled.`r`n")
  }
  Write-Status
  return
}

if ($item -and $item.LinkType -eq "Junction") {
  if (-not (Test-SamePath ([string]$item.Target[0]) $repoMods)) {
    throw "Refusing to replace an unmanaged junction: $localMods -> $($item.Target[0])"
  }
  Write-Status
  return
}

if ($item) {
  if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
    throw "Refusing to replace an unmanaged directory: $localMods"
  }
  $unexpected = Get-ChildItem -Force -LiteralPath $localMods |
    Where-Object Name -ne $markerName
  if ($unexpected) {
    throw "Local mods directory contains files; move them before enabling the junction."
  }
  Remove-Item -LiteralPath $markerPath -Force
  [IO.Directory]::Delete($localMods, $false)
}

New-Item -ItemType Junction -Path $localMods -Target $repoMods | Out-Null
Write-Status
