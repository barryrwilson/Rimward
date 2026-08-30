# Rimward release procedure

This procedure publishes the download-only static release selected for
v0.1.0. It does not deploy or change a hosted environment.

## Prerequisites

- Node.js 22 and PowerShell 7.
- Git and GitHub CLI authenticated for `barryrwilson/Rimward`.
- A clean `master` worktree with `origin/master` fetched.
- No existing tag or GitHub Release for the version being published.
- Repository immutable releases enabled and verified through the GitHub API.

The release owner is `@barryrwilson`. A second person may execute these steps
if they have permission to dispatch Actions, push the tag, and create the
release.

An administrator enables immutability once. It applies to future releases:

```powershell
$apiVersion = "2026-03-10"
gh api --method PUT -H "X-GitHub-Api-Version: $apiVersion" `
  repos/barryrwilson/Rimward/immutable-releases
$immutable = gh api -H "X-GitHub-Api-Version: $apiVersion" `
  repos/barryrwilson/Rimward/immutable-releases | ConvertFrom-Json
if ($immutable.enabled -ne $true) { throw "repository immutable releases are not enabled" }
```

## Build and validate one SHA

From the repository root:

```powershell
git fetch origin --tags
git switch master
git pull --ff-only origin master
$releaseSha = (git rev-parse HEAD).Trim().ToLowerInvariant()
git status --short
gh workflow run "Release candidate" --ref master -f sha=$releaseSha
Start-Sleep -Seconds 5
$runId = gh run list --workflow "Release candidate" --commit $releaseSha --limit 1 `
  --json databaseId --jq '.[0].databaseId'
gh run watch $runId --exit-status
```

The status output must be empty. Open the dispatched workflow and require the
single `Final-SHA release verdict` job to pass. The workflow runs, on the same
checked-out SHA:

```text
npm ci
npm run build
npm run release:package -- -Sha <full-sha>
npm run test:boot
npm run test:release-focused
npm run agent:bridge:smoke
npm run test:rw008-live
npm run test:opt001-live
npm audit --audit-level=high --json
npm audit --omit=dev --audit-level=high --json
```

Download the artifact named `release-candidate-<full-sha>`:

```powershell
$downloadRoot = "out/release-download-$releaseSha"
if (Test-Path $downloadRoot) { throw "choose a fresh release download directory" }
gh run download $runId --name "release-candidate-$releaseSha" --dir $downloadRoot
$candidate = Resolve-Path "$downloadRoot/release-candidate"
```

Confirm
`release-candidate/release-verdict.json` says `PASS`, its requested and checked
out SHAs both equal `$releaseSha`, and every gate and evidence assertion passes.

The same artifact contains:

- `rimward-v0.1.0-dist.zip`
- `rimward-v0.1.0-dist.zip.sha256`
- `release-manifest.json`
- `release-verdict.json` and the bounded validation evidence

The ZIP contains one top-level `dist/` directory. It is a web-root artifact,
not a desktop executable: extract it and serve `dist/` over HTTP at the origin
root. For example, with Python available:

```powershell
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000/`. Do not open `index.html` through `file://`
or mount this build only below a URL subpath; its assets use root-absolute URLs.

Verify the archive before publication:

```powershell
$manifest = Get-Content "$candidate/release-manifest.json" -Raw | ConvertFrom-Json
$actual = (Get-FileHash "$candidate/$($manifest.archive.name)" -Algorithm SHA256).Hash.ToLowerInvariant()
$checksum = (Get-Content "$candidate/$($manifest.archive.checksumFile)" -Raw).Trim()
if ($manifest.commitSha -ne $releaseSha) { throw "manifest SHA mismatch" }
if ($manifest.tag -ne "v0.1.0") { throw "manifest tag mismatch" }
if ($manifest.archive.sha256 -ne $actual) { throw "archive checksum mismatch" }
if ($checksum -ne "$actual  $($manifest.archive.name)") { throw "checksum file mismatch" }
```

## Publish the immutable release

Only after the exact-SHA workflow and downloaded checks pass:

```powershell
$immutable = gh api -H "X-GitHub-Api-Version: $apiVersion" `
  repos/barryrwilson/Rimward/immutable-releases | ConvertFrom-Json
if ($immutable.enabled -ne $true) { throw "repository immutable releases are not enabled" }
git tag -a v0.1.0 $releaseSha -m "Rimward v0.1.0"
git push origin v0.1.0
$remoteTagSha = ((git ls-remote origin "refs/tags/v0.1.0^{}") -split "`t")[0]
if ($remoteTagSha -ne $releaseSha) { throw "remote tag SHA mismatch" }
gh release create v0.1.0 --draft --verify-tag --title "Rimward v0.1.0" `
  --notes-file CHANGELOG.md `
  "$candidate/rimward-v0.1.0-dist.zip" `
  "$candidate/rimward-v0.1.0-dist.zip.sha256" `
  "$candidate/release-manifest.json" `
  "$candidate/release-verdict.json"
$draftView = gh release view v0.1.0 --json databaseId,isDraft | ConvertFrom-Json
if ($draftView.isDraft -ne $true) { throw "release must remain a draft during asset verification" }
$draft = gh api -H "X-GitHub-Api-Version: $apiVersion" `
  "repos/barryrwilson/Rimward/releases/$($draftView.databaseId)" | ConvertFrom-Json
$assetPaths = @(
  "$candidate/rimward-v0.1.0-dist.zip",
  "$candidate/rimward-v0.1.0-dist.zip.sha256",
  "$candidate/release-manifest.json",
  "$candidate/release-verdict.json"
)
$expectedDigests = @{}
foreach ($assetPath in $assetPaths) {
  $name = Split-Path $assetPath -Leaf
  $hash = (Get-FileHash $assetPath -Algorithm SHA256).Hash.ToLowerInvariant()
  $expectedDigests[$name] = "sha256:$hash"
}
if ($draft.assets.Count -ne $expectedDigests.Count) { throw "draft asset count mismatch" }
foreach ($asset in $draft.assets) {
  if ($expectedDigests[$asset.name] -ne $asset.digest) { throw "draft asset digest mismatch: $($asset.name)" }
}
gh release edit v0.1.0 --draft=false
$release = gh api repos/barryrwilson/Rimward/releases/tags/v0.1.0 | ConvertFrom-Json
if ($release.immutable -ne $true) { throw "published release is not immutable" }
gh release view v0.1.0 --json tagName,targetCommitish,url,assets
```

Confirm the tag resolves to `$releaseSha`, the Release targets the same commit,
and all four assets are present. Record the workflow and Release links on the
REL-005 issue.

## Rollback and replacement

Before publication, do not push a tag for a failed candidate. Fix the defect in
a pull request, merge it, and restart validation with the new full SHA.

After publication, the tag and attached assets are immutable release records:
do not move the tag, replace an asset in place, or delete evidence to reuse the
version. If v0.1.0 is unsuitable, mark it clearly in the Release notes, fix the
problem, increment the package and lockfile version, validate the new SHA, and
publish v0.1.1. Because v0.1.0 has no hosted deployment, there is no server-side
runtime rollback; users can retain or re-download a previously approved
archive.
