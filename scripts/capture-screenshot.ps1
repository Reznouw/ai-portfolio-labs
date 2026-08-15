param(
  [Parameter(Mandatory = $true)]
  [string]$Url,

  [Parameter(Mandatory = $true)]
  [string]$Output,

  [int]$Width = 1440,
  [int]$Height = 1000
)

$ErrorActionPreference = "Stop"

$chromePaths = @(
  "$Env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$Env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
  "$Env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$Env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe"
)

$browser = $chromePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $browser) {
  throw "No se encontro Chrome o Edge para captura headless."
}

$outputPath = [System.IO.Path]::GetFullPath($Output)
$outputDir = Split-Path -Parent $outputPath

if (-not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

& $browser `
  --headless=new `
  --disable-gpu `
  --hide-scrollbars `
  --window-size="$Width,$Height" `
  --screenshot="$outputPath" `
  $Url | Out-Null

if (-not (Test-Path -LiteralPath $outputPath)) {
  throw "No se genero la captura: $outputPath"
}

"Screenshot saved: $outputPath"
