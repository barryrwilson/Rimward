# Changelog

## Unreleased

Post-v0.1.0 work. These notes are not part of the published v0.1.0 GitHub Release.

### Fixes

- Defer death recovery requested during pause until the simulation resumes,
  preserving cross-system environment rebuilds and exactly-once recovery
  ([#51](https://github.com/barryrwilson/Rimward/issues/51)).
- Ignore gameplay keys entered during pause without blocking pause/settings
  controls or key-release cleanup
  ([#47](https://github.com/barryrwilson/Rimward/issues/47)).
- Dispose Beautiful Ones ships' instance-owned swim materials, including
  lower LODs, while preserving shared resources and other ships
  ([#48](https://github.com/barryrwilson/Rimward/issues/48)).
- Return a complete HTTP 413 response for oversized agent actions, including
  unfinished uploads, before closing the connection
  ([#49](https://github.com/barryrwilson/Rimward/issues/49)).
- Refuse programmatic bridge startup with a missing or empty token. Normal
  CLI-generated and configured nonempty tokens are unchanged
  ([#50](https://github.com/barryrwilson/Rimward/issues/50)).

### Developer and verification tooling

- Production JavaScript is release-gated at 1,800,000 minified bytes and 525
  KiB gzip, with a reproducible module-composition and browser-boundary report.
- Add `test:pause-recovery`, `test:paused-input`, `test:ship-material-release`,
  and `test:agent-bridge` to PR CI and the focused release regressions.
  The release verdict requires all four checks in addition to the existing set.

### Verification and security

The production browser module census independently enforces the runtime `three`
boundary. Build and asset tools and the agent bridge cannot enter the browser
bundle. The local target for cold title readiness is 8,000 ms. Five final-tree
starts in a blank, cache-disabled Chrome profile measured 4,187.0 ms median /
6,601.3 ms slowest with zero console errors.

## v0.1.0 — 2026-08-29

Rimward v0.1.0 is the first versioned, downloadable release of the browser
space sandbox. It is distributed as a static `dist/` archive; no hosted
deployment is part of this release.

### Player-visible highlights

- Fly, fight, trade, mine, explore, complete missions, build faction
  reputation, and own ships in a persistent browser world.
- Browse the 245-entry Models reference by faction and ship class, including
  trader and pirate liveries and clearer loading progress.
- Configure mouse sensitivity, inverted axes, conflict-aware key bindings,
  and separate music, effects, voice, and UI volume.
- Use three manual Berth Records alongside autosave, recover from runtime
  errors, and retain the zero-cost death-recovery path.

### Developer and verification tooling

- The source repository's loopback-only agent bridge can observe and play the
  same game, including a live, ordinary-physics outer-pad approach, dock, and
  undock. The bridge requires a source checkout, Node.js, and a debug-enabled
  Chrome session; it is not bundled in the static `dist/` download.

### Known limitations

- RW-010, the Models summary card, is deferred until after v0.1.0. Enhanced
  Models loading retry and disposal work is also not included.
- Distribution is download-only. There is no hosted service or deployment to
  roll back for v0.1.0.
- The extracted `dist/` directory must be served over HTTP at an origin root.
  Direct `file://` use and subpath-only hosting are not supported because the
  generated build uses root-absolute `/assets/` URLs.
- Berth Records are overwrite-only: slots cannot be renamed, annotated, or
  deleted, and manual berths do not replace autosave or automatic recovery.

### Verification and security

The GitHub Release is published only from a full 40-character commit SHA that
passes the repository's `Release candidate` workflow. That workflow performs a
locked install, production build, full boot harness, seven focused regressions,
the agent bridge smoke, Models and OPT-001 live-browser probes with console
capture, and full plus production dependency audits. The attached
`release-manifest.json`, checksum, and `release-verdict.json` bind the archive
and evidence to the exact released SHA.

Both dependency audit trees must report zero high or critical findings. The
GLTF CLI's declared `sharp~0.34.5` range does not yet include the exact
`sharp@0.35.4` override used here. This deliberate development-tool exception
was compatibility-tested through clean install/build/boot, validation of all
228 ship GLBs, representative ship optimization, and PNG-to-WebP texture
compression. The deployable runtime dependency graph remains `three` only.
