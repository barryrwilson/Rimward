# Changelog

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
