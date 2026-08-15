$ErrorActionPreference = "Stop"

$repo = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source

if (-not $npm) {
  throw "npm.cmd no fue encontrado en PATH."
}

Push-Location -LiteralPath $repo.Path
try {
  & $npm run publish:next
} finally {
  Pop-Location
}
