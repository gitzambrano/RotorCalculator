param(
    [string]$B4ABuilder = $env:B4A_BUILDER,
    [string]$Project = (Join-Path $PSScriptRoot "..\RotorCalculator.b4a"),
    [ValidateSet("Build", "BuildBundle")]
    [string]$Task = "Build",
    [string]$AdditionalLibrariesFolder = (Join-Path $PSScriptRoot "..\Libraries"),
    [string]$KeyFile = (Join-Path $PSScriptRoot "..\Key\key_aero_calc.keystore"),
    [string]$KeyPassword = "***REDACTED***",
    [string]$KeyAlias = "b4a"
)

$ErrorActionPreference = "Stop"

if (-not $B4ABuilder) {
    $candidatePaths = @(
        "C:\Program Files\Anywhere Software\B4A\B4ABuilder.exe",
        "C:\Program Files\Anywhere Software\Basic4android\B4ABuilder.exe",
        "C:\Program Files (x86)\Anywhere Software\Basic4android\B4ABuilder.exe"
    )
    foreach ($c in $candidatePaths) {
        if (Test-Path $c) {
            $B4ABuilder = $c
            break
        }
    }
}

if (-not $B4ABuilder -or -not (Test-Path $B4ABuilder)) {
    Write-Warning "B4ABuilder.exe não foi encontrado automaticamente. Defina a variável de ambiente B4A_BUILDER ou passe o parâmetro -B4ABuilder."
    return
}

$B4ABuilder = (Resolve-Path $B4ABuilder).Path
$ProjectPath = (Resolve-Path $Project).Path
$BaseFolder = Split-Path -Parent $ProjectPath

$DefaultIni = Join-Path $env:APPDATA "Anywhere Software\Basic4android\b4xV5.ini"
if (-not (Test-Path $DefaultIni)) {
    throw "B4A INI não foi encontrado em: $DefaultIni"
}

$BuildIni = Join-Path $env:TEMP ("b4a_build_rotor_" + $PID + ".ini")
$iniText = [IO.File]::ReadAllText($DefaultIni)

if ($iniText -match 'AdditionalLibrariesFolder=[^\r\n]*') {
    $iniText = $iniText -replace 'AdditionalLibrariesFolder=[^\r\n]*', ("AdditionalLibrariesFolder=" + $AdditionalLibrariesFolder)
} else {
    $iniText += [Environment]::NewLine + "AdditionalLibrariesFolder=" + $AdditionalLibrariesFolder + [Environment]::NewLine
}

$NoSign = $true
if ($KeyFile -and (Test-Path $KeyFile)) {
    $NoSign = $false
    $resolvedKey = (Resolve-Path $KeyFile).Path
    if ($iniText -match 'SignKeyFile=[^\r\n]*') {
        $iniText = $iniText -replace 'SignKeyFile=[^\r\n]*', ("SignKeyFile=" + $resolvedKey)
    } else {
        $iniText += [Environment]::NewLine + "SignKeyFile=" + $resolvedKey + [Environment]::NewLine
    }
    if ($KeyPassword) {
        if ($iniText -match 'SignKeyPassword=[^\r\n]*') {
            $iniText = $iniText -replace 'SignKeyPassword=[^\r\n]*', ("SignKeyPassword=" + $KeyPassword)
        } else {
            $iniText += "SignKeyPassword=" + $KeyPassword + [Environment]::NewLine
        }
    }
    if ($KeyAlias) {
        if ($iniText -match 'SignKeyAlias=[^\r\n]*') {
            $iniText = $iniText -replace 'SignKeyAlias=[^\r\n]*', ("SignKeyAlias=" + $KeyAlias)
        } else {
            $iniText += "SignKeyAlias=" + $KeyAlias + [Environment]::NewLine
        }
    }
}

[IO.File]::WriteAllText($BuildIni, $iniText, [Text.Encoding]::UTF8)

$ObjectsDir = Join-Path $BaseFolder "Objects"
if (Test-Path $ObjectsDir) {
    attrib -R /S /D (Join-Path $ObjectsDir "*") *> $null
}

try {
    $NoSignArg = if ($NoSign) { "True" } else { "False" }
    Push-Location $BaseFolder
    try {
        Write-Host "Iniciando compilação do RotorCalculator ($Task)..." -ForegroundColor Cyan
        & $B4ABuilder "-Task=$Task" "-NoSign=$NoSignArg" "-ShowWarnings=True" "-INI=$BuildIni"
        if ($LASTEXITCODE -ne 0) {
            throw "B4A build falhou com código de saída $LASTEXITCODE."
        }
        Write-Host "Compilação concluída com sucesso!" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-Item -LiteralPath $BuildIni -ErrorAction SilentlyContinue
}
