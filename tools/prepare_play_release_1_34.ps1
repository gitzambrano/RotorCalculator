<#
Prepare the signed Android release for Google Play on a Windows B4A workstation.
Do not upload. Output is staged only in git-ignored scratch/release-1.34.
#>
param(
    [string]$B4ABuilder = $env:B4A_BUILDER,
    [string]$KeyFile = $env:B4A_KEY_FILE,
    [string]$KeyPassword = $env:B4A_KEY_PASSWORD,
    [string]$KeyAlias = $env:B4A_KEY_ALIAS,
    [string]$AndroidSdk = $env:ANDROID_HOME,
    [string]$AdbSerial = ""
)

$ErrorActionPreference = "Stop"
if (-not $KeyAlias) { $KeyAlias = "rotorcalculator" }
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $KeyFile) { $KeyFile = Join-Path $Root "Key\rotorcalculator.keystore" }
if (-not $AndroidSdk) { $AndroidSdk = $env:ANDROID_SDK_ROOT }

$Source = Join-Path $Root "RotorCalculator.b4a"
$ProjectText = [IO.File]::ReadAllText($Source)
$Version = [regex]::Match($ProjectText, '(?m)^\s*#VersionName:\s*([^\r\n]+)').Groups[1].Value.Trim()
$VersionCode = [regex]::Match($ProjectText, '(?m)^\s*#VersionCode:\s*(\d+)').Groups[1].Value
if ($Version -ne "1.34" -or $VersionCode -ne "19") {
    throw "Expected Android VersionName=1.34 and VersionCode=19; got '$Version' / '$VersionCode'."
}
if (-not (Test-Path -LiteralPath $KeyFile -PathType Leaf)) {
    throw "Production signing keystore unavailable: $KeyFile"
}
if (-not $KeyPassword) { throw "B4A_KEY_PASSWORD is required for a signed release." }
if (-not $AndroidSdk -or -not (Test-Path -LiteralPath $AndroidSdk -PathType Container)) {
    throw "Android SDK not found. Configure ANDROID_HOME or ANDROID_SDK_ROOT."
}

$Staging = Join-Path $Root ("scratch\release-" + $Version)
$ProjectDir = Join-Path $Staging "source"
$OutputDir = Join-Path $Staging "artifacts"
if (Test-Path -LiteralPath $Staging) { Remove-Item -LiteralPath $Staging -Recurse -Force }
New-Item -Path $ProjectDir, $OutputDir -ItemType Directory -Force | Out-Null
Get-ChildItem -LiteralPath $Root -File | Where-Object {
    $_.Extension -in @(".b4a", ".bas", ".meta")
} | Copy-Item -Destination $ProjectDir
Copy-Item -LiteralPath (Join-Path $Root "Files") -Destination $ProjectDir -Recurse
Copy-Item -LiteralPath (Join-Path $Root "Libraries") -Destination $ProjectDir -Recurse

$BuilderArgs = @{
    Project = (Join-Path $ProjectDir "RotorCalculator.b4a")
    AdditionalLibrariesFolder = (Join-Path $ProjectDir "Libraries")
    KeyFile = (Resolve-Path -LiteralPath $KeyFile).Path
    KeyPassword = $KeyPassword
    KeyAlias = $KeyAlias
}
if ($B4ABuilder) { $BuilderArgs.B4ABuilder = $B4ABuilder }

function Get-BuiltArtifact([string]$Suffix) {
    $objects = Join-Path $ProjectDir "Objects"
    if (-not (Test-Path -LiteralPath $objects)) { throw "B4A did not create an Objects folder." }
    $matches = @(Get-ChildItem -LiteralPath $objects -File -Recurse -Filter ("*." + $Suffix))
    if ($matches.Count -ne 1) {
        throw "Expected exactly one $Suffix artifact in a fresh build; found $($matches.Count)."
    }
    return $matches[0].FullName
}

Write-Host "Building signed Android APK $Version (code $VersionCode) ..."
& (Join-Path $PSScriptRoot "b4a_build.ps1") @BuilderArgs -Task Build
$Apk = Join-Path $OutputDir ("RotorCalculator-" + $Version + "-signed.apk")
Copy-Item -LiteralPath (Get-BuiltArtifact "apk") -Destination $Apk

Write-Host "Building signed Android App Bundle $Version (code $VersionCode) ..."
& (Join-Path $PSScriptRoot "b4a_build.ps1") @BuilderArgs -Task BuildBundle
$Aab = Join-Path $OutputDir ("RotorCalculator-" + $Version + "-signed.aab")
Copy-Item -LiteralPath (Get-BuiltArtifact "aab") -Destination $Aab

$BuildTools = Join-Path $AndroidSdk "build-tools"
$ApkSigner = Get-ChildItem -Path $BuildTools -Recurse -File -Filter "apksigner.bat" |
    Sort-Object FullName -Descending | Select-Object -First 1
$Aapt = Get-ChildItem -Path $BuildTools -Recurse -File -Filter "aapt.exe" |
    Sort-Object FullName -Descending | Select-Object -First 1
if (-not $ApkSigner -or -not $Aapt) {
    throw "Android SDK build-tools must provide apksigner.bat and aapt.exe."
}
& $ApkSigner.FullName verify --verbose --print-certs $Apk
if ($LASTEXITCODE -ne 0) { throw "APK signature verification failed." }
$Badging = (& $Aapt.FullName dump badging $Apk | Select-String "^package:").Line
if ($LASTEXITCODE -ne 0 -or -not $Badging) { throw "Unable to read APK package metadata." }
foreach ($pattern in @("name='flightdyn.rotorcalculator'", "versionCode='19'", "versionName='1.34'")) {
    if (-not $Badging.Contains($pattern)) { throw "APK metadata mismatch: expected $pattern in $Badging" }
}
$JarSigner = Get-Command "jarsigner.exe" -ErrorAction SilentlyContinue
if (-not $JarSigner) { throw "JDK jarsigner.exe is required to sign and verify the AAB." }
& $JarSigner.Source -keystore $KeyFile -storepass $KeyPassword -digestalg SHA-256 -sigalg SHA256withRSA $Aab $KeyAlias | Out-Null
if ($LASTEXITCODE -ne 0) { throw "AAB re-signing with SHA-256 failed." }
$JarOutput = & $JarSigner.Source -verify $Aab 2>&1
if ($LASTEXITCODE -ne 0 -or (-not (($JarOutput | Out-String) -match "jar verified"))) {
    throw "AAB signing verification failed: $($JarOutput | Out-String)"
}

$Manifest = [ordered]@{
    version = $Version
    versionCode = [int]$VersionCode
    package = "flightdyn.rotorcalculator"
    apk = (Split-Path $Apk -Leaf)
    apkSha256 = (Get-FileHash -LiteralPath $Apk -Algorithm SHA256).Hash.ToLowerInvariant()
    aab = (Split-Path $Aab -Leaf)
    aabSha256 = (Get-FileHash -LiteralPath $Aab -Algorithm SHA256).Hash.ToLowerInvariant()
    sourceRevision = ((git -C $Root rev-parse HEAD) | Out-String).Trim()
    verified = "apk-signature,apk-metadata,aab-signature"
    uiEmulatorQa = "pending"
    playUpload = "not-started"
}
$ManifestPath = Join-Path $OutputDir "release-manifest.json"
$Manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $ManifestPath -Encoding UTF8
Write-Host "Signed APK, signed AAB and SHA-256 manifest staged at $OutputDir" -ForegroundColor Green
Write-Host "Run emulator/device UI QA before submitting the app for production review."

if ($AdbSerial) {
    $AdbExe = Join-Path $AndroidSdk "platform-tools\adb.exe"
    if (-not (Test-Path -LiteralPath $AdbExe)) { throw "adb.exe not found in Android SDK." }
    & $AdbExe -s $AdbSerial install -r $Apk
    if ($LASTEXITCODE -ne 0) { throw "APK installation failed on $AdbSerial." }
    Write-Host "Installed to $AdbSerial; human UI verification still required."
}
Write-Host ("Google Play validation: python tools/upload_playstore.py --aab " + $Aab + " --track internal --status draft --validate-only")
