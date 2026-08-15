$ErrorActionPreference = "Stop"

$repo = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$taskName = "AI Portfolio Daily Publish"
$time = "12:00"
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source

if (-not $npm) {
  throw "npm.cmd no fue encontrado en PATH. Instala Node.js o abre una terminal con Node configurado."
}

$action = New-ScheduledTaskAction -Execute $npm -Argument "run publish:next" -WorkingDirectory $repo.Path
$trigger = New-ScheduledTaskTrigger -Daily -At $time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Publica el siguiente mini-proyecto de IA cada dia al mediodia." -Force | Out-Null

"Tarea instalada: $taskName"
"Horario: todos los dias a las $time"
"Repo: $($repo.Path)"
