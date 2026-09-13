# Changelog

## Unreleased

Post-v0.1.0 work. These notes are not part of the published v0.1.0 GitHub Release.
Issue numbers link the GitHub issue; PR-only entries link the pull request.
`docs/REMAINING-WORK.md` carries the per-issue evidence.

### Piracy, prizes, and derelicts

- A trader that yields its cargo runs for a refuge instead of parking
  dead-stick ([#146](https://github.com/barryrwilson/Rimward/issues/146)).
- An NPC pirate may claim the crew and the hull of a yielded trader and fence
  the prize; a crewless hull is claimable by the player with H on a locked
  derelict ([#147](https://github.com/barryrwilson/Rimward/issues/147)).
- An unclaimed yielded hull becomes a derelict that anyone can claim and that
  folds away after 30 minutes
  ([#148](https://github.com/barryrwilson/Rimward/issues/148)).
- An NPC pirate scoops the pods it took and sells the haul at the local
  station fence ([#151](https://github.com/barryrwilson/Rimward/issues/151)).
- At most two NPC pirates work traders at once; a prize the player engages is
  yielded ([#123](https://github.com/barryrwilson/Rimward/issues/123)).
- The fence's marker banks on any paying pirate outcome, not only a bounty
  claim ([#124](https://github.com/barryrwilson/Rimward/issues/124)).
- Surrender is attributed to the last effective damage; a world-caused break
  pays nothing ([#99](https://github.com/barryrwilson/Rimward/issues/99)).
- A surrendered hull can hand over its holds through `demandCargo`
  ([#98](https://github.com/barryrwilson/Rimward/issues/98)).
- A deliberate hail demands terms from a willing hull
  ([#122](https://github.com/barryrwilson/Rimward/issues/122)).
- Capitulation status and hail feedback agree
  ([#67](https://github.com/barryrwilson/Rimward/issues/67)); hails identify
  the speaker and reject stale responses
  ([#66](https://github.com/barryrwilson/Rimward/issues/66)).
- Fleeing NPCs run to a real gate or station refuge and the escape persists
  ([#68](https://github.com/barryrwilson/Rimward/issues/68)).
- First Scare is awarded only for player-earned intimidation
  ([#63](https://github.com/barryrwilson/Rimward/issues/63)).

### Ships, shipyard, and stations

- A claimed derelict is kept as an owned hull, sold, or returned at the
  shipyard desk by the player's choice
  ([#159](https://github.com/barryrwilson/Rimward/issues/159)).
- The shipyard buys an unmounted hull back from the hangar
  ([#158](https://github.com/barryrwilson/Rimward/issues/158)).
- Station launches are outward-facing and collision-clear; a blocked launch
  holds the berth and names the blocking hull
  ([#65](https://github.com/barryrwilson/Rimward/issues/65),
  [#105](https://github.com/barryrwilson/Rimward/issues/105)).
- Station loiterers keep clear of the docking lane
  ([#139](https://github.com/barryrwilson/Rimward/issues/139)).
- Completed station encounters no longer starve traffic
  ([#101](https://github.com/barryrwilson/Rimward/issues/101)).
- Hail cards stay off docked station menus
  ([#100](https://github.com/barryrwilson/Rimward/issues/100)).
- Completed dock transactions persist
  ([#71](https://github.com/barryrwilson/Rimward/issues/71)); successful
  station notices are separated from errors
  ([#64](https://github.com/barryrwilson/Rimward/issues/64)).
- The real player hull is restored after a cold asset load
  ([#54](https://github.com/barryrwilson/Rimward/issues/54)).
- Death inside an encounter returns to the last berth with a rewind and hold
  receipt; patrol standing law is local
  ([#125](https://github.com/barryrwilson/Rimward/issues/125)).

### Mining, economy, and missions

- A mined-out asteroid breaks up and a rock of another ore reseeds its slot
  after a few minutes ([#149](https://github.com/barryrwilson/Rimward/issues/149)).
- Station stock is finite and replenishes on saved time
  ([#55](https://github.com/barryrwilson/Rimward/issues/55)); same-station
  profitable buy/sell loops are gone
  ([#53](https://github.com/barryrwilson/Rimward/issues/53)).
- Freighter-scale bulk trading: quantity, Buy Max, and Sell All through
  ordinary bounded orders
  ([#56](https://github.com/barryrwilson/Rimward/issues/56)).
- Duplicate trade and survey offers are removed while distinct contracts and
  passenger parties remain
  ([#12](https://github.com/barryrwilson/Rimward/issues/12)).
- Passenger commitments, locked fares, and independent parties are explained
  ([#73](https://github.com/barryrwilson/Rimward/issues/73)); duplicate ferry
  acceptance is refused
  ([#70](https://github.com/barryrwilson/Rimward/issues/70)).
- New salvagers get a discoverable first recovery path
  ([#74](https://github.com/barryrwilson/Rimward/issues/74)).
- Starter pacing was reassessed and the existing protection retained
  ([#10](https://github.com/barryrwilson/Rimward/issues/10)); a fresh start
  no longer drifts into the sun
  ([#95](https://github.com/barryrwilson/Rimward/pull/95)).

### Agent API

- Sustained dogfighting between agent decisions
  ([#61](https://github.com/barryrwilson/Rimward/issues/61)) and reactive
  defense inside the bounded combat lease
  ([#62](https://github.com/barryrwilson/Rimward/issues/62)).
- A combat intent clears the full-stop latch and names it when it holds
  ([#114](https://github.com/barryrwilson/Rimward/issues/114)); a retreat or
  break-off intent may hold the afterburner
  ([#120](https://github.com/barryrwilson/Rimward/issues/120)).
- Target refusals split into `no-sample`, `stale-lock`, and `lock-kind` with
  receipt detail ([#118](https://github.com/barryrwilson/Rimward/issues/118)).
- `playerHit` and `playerDestroyed` name the attacker
  ([#117](https://github.com/barryrwilson/Rimward/issues/117)); nearby rows
  carry prize-ranking fields and station and gate bearings
  ([#116](https://github.com/barryrwilson/Rimward/issues/116)).
- Scoop receipts are keep-class and refused pods report `podBlocked`
  ([#115](https://github.com/barryrwilson/Rimward/issues/115)); NPC miner
  receipts stay off the agent ring
  ([#119](https://github.com/barryrwilson/Rimward/issues/119)).
- `frameAgeMs` and `flags.suspended` are published; a wall expiry during a
  stall reads `suspended`
  ([#121](https://github.com/barryrwilson/Rimward/issues/121)).
- Solar hazards and damage are visible to agents
  ([#102](https://github.com/barryrwilson/Rimward/issues/102)); the raw-control
  throttle and the verified stop sequence are documented and observable
  ([#103](https://github.com/barryrwilson/Rimward/issues/103)).
- Accepted survey objectives are navigable through a visible marker and the
  public API ([#69](https://github.com/barryrwilson/Rimward/issues/69)).
- Fresh save and dock events survive event-ring saturation
  ([#72](https://github.com/barryrwilson/Rimward/issues/72)).
- Agent Play v2 parity and integration repairs
  ([#57](https://github.com/barryrwilson/Rimward/pull/57)).

### Presentation

- Built hulls now trail a velocity-driven drive plume behind their engine
  flare: hidden at rest, growing toward class cruise speed, hotter under an
  afterburner or a burn, in the faction's glow colour. Beautiful Ones (organic)
  hulls and the player's living hull keep their bioluminescent surge, and the
  hull-less Unknowables fields gain no nozzle either.
  `src/systems/thruster-fx.js`; pinned in `test:boot`
  ([#145](https://github.com/barryrwilson/Rimward/pull/145)).
- The Assembly fleet is redesigned with a survey head, can spine, and report
  dish ([#144](https://github.com/barryrwilson/Rimward/pull/144)).
- The reviewed Beautiful Ones production fleet is published
  ([#58](https://github.com/barryrwilson/Rimward/pull/58)).
- The Models browser gains a role, scale, and lore summary card
  ([#28](https://github.com/barryrwilson/Rimward/issues/28)).

### Fixes

- Held fire clears when UI or pause owns input
  ([#11](https://github.com/barryrwilson/Rimward/issues/11)).

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

- Production JavaScript is release-gated at 3,671,906 minified bytes and
  1,098,526 gzip bytes, twice the #100 measured size by owner request
  ([#107](https://github.com/barryrwilson/Rimward/pull/107)); the earlier
  1,800,000 / 525 KiB gate is superseded. The module-composition and
  browser-boundary report is unchanged.
- The wave-142 war boot scenario is deterministic
  ([#153](https://github.com/barryrwilson/Rimward/issues/153)); the refusal
  tokens suite pins the #120 burner contract and runs in the release runner
  ([#138](https://github.com/barryrwilson/Rimward/issues/138)).
- Focused suites added since v0.1.0: `test:derelict`, `test:pirate-haul`,
  `test:prize`, `test:hull-sale`, `test:dock-corridor`, `test:death-recovery`,
  `test:fence-marker`, `test:shared-lane`, `test:player-terms`,
  `test:suspended-clock`, `test:retreat-burner`, `test:combat-full-stop`,
  `test:refusal-tokens`, `test:attacker-identity`, `test:nearby-rows`,
  `test:pod-receipts`, `test:miner-receipts`, `test:market-liquidity`,
  `test:bulk-trade`, `test:combat-intent`, `test:reactive-defense`.
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
