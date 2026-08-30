[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-fA-F]{40}$')]
  [string]$Sha
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'out/release-candidate'
$distDir = Join-Path $root 'dist'
$packagePath = Join-Path $root 'package.json'
$lockPath = Join-Path $root 'package-lock.json'

Push-Location $root
try {
  $actualSha = (git rev-parse HEAD).Trim().ToLowerInvariant()
  $expectedSha = $Sha.ToLowerInvariant()
  if ($actualSha -ne $expectedSha) {
    throw "HEAD $actualSha does not match requested SHA $expectedSha"
  }

  git diff-index --quiet HEAD --
  if ($LASTEXITCODE -ne 0) {
    throw 'tracked worktree changes are not allowed when packaging a release'
  }

  $package = Get-Content $packagePath -Raw | ConvertFrom-Json
  $lock = Get-Content $lockPath -Raw | ConvertFrom-Json
  $version = [string]$package.version
  if ($version -notmatch '^\d+\.\d+\.\d+$') {
    throw "package version is not semantic: $version"
  }
  if ([string]$lock.version -ne $version -or [string]$lock.packages.''.version -ne $version) {
    throw 'package.json and package-lock.json root versions do not agree'
  }
  if (-not (Test-Path (Join-Path $distDir 'index.html') -PathType Leaf)) {
    throw 'dist/index.html is missing; run npm run build first'
  }

  $tag = "v$version"
  $archiveName = "rimward-$tag-dist.zip"
  $archivePath = Join-Path $outDir $archiveName
  $checksumName = "$archiveName.sha256"
  $checksumPath = Join-Path $outDir $checksumName
  $manifestPath = Join-Path $outDir 'release-manifest.json'

  New-Item -ItemType Directory -Force $outDir | Out-Null
  Remove-Item -Force -ErrorAction SilentlyContinue $archivePath, $checksumPath, $manifestPath
  Compress-Archive -Path $distDir -DestinationPath $archivePath -CompressionLevel Optimal

  $archive = Get-Item $archivePath
  $digest = (Get-FileHash $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  "$digest  $archiveName" | Set-Content -Encoding utf8 $checksumPath

  $manifest = [ordered]@{
    schemaVersion = 1
    version = $version
    tag = $tag
    commitSha = $actualSha
    distribution = 'static-dist'
    entrypoint = 'dist/index.html'
    archive = [ordered]@{
      name = $archiveName
      sha256 = $digest
      bytes = $archive.Length
      checksumFile = $checksumName
    }
  }
  $manifest | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 $manifestPath

  Write-Host "RELEASE PACKAGE PASS $tag $actualSha"
  Write-Host "Archive: $archivePath"
  Write-Host "SHA256: $digest"
} finally {
  Pop-Location
}
