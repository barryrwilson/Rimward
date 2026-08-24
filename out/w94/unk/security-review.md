## Security Review: Wave 94 Unknowables origin dock

### Risk Level: Low

### Summary
Deep audit of Archive desk generalization, authored `veil` ids, contacts, and the dedicated station mesh. No CRITICAL or HIGH findings. Assembly Archive prices stay on `archiveFilePrice`. Origin UU uses Wave 82 constants. Copy goes through `h()` / `textContent`.

### Findings

None.

#### XSS via Archive / People copy
**Result:** not present.

- `src/systems/station.js` `h()` sets `textContent` only.
- Confirm papers, illegal-origin lines, and `ui.notice` are authored strings plus numeric UU.
- No `innerHTML`, `insertAdjacentHTML`, or `eval` in the write-set.
- People already uses `portraitFor` + `img.alt` from contact name/role.

#### Persist / prototype ids
**Result:** not present.

- System id `veil`, landmark id `th_veil`, contact id `contact-veil-dockmaster` are authored literals.
- `archiveDeskAllowed` matches `'assembly'` / `'unknowables'` only. `'__proto__'` is false.
- Hostile gate uses `standingRead` (reserved ids → 0).
- `dataPendingKey` still requires allowlisted verb / commodity / source / originFaction.
- No new `WORLD_FIELDS` key. No new `localStorage` key.

#### Economy integrity
**Result:** not present.

- Assembly path still calls `archiveFilePrice` (cube 400 own, crystal 900 rival).
- Unknowables path prices own legal crystal 400 and rival assembly cubes 900.
- Captured own crystal at origin is refused and does not debit/credit.
- Hostile `standingRead(unknowables) < 0` writes `No sale.` with no cargo or credit change.
- Buy still fail-closes on non-finite credits, hold cap, and `addDataCargoRow`.

#### Mesh teardown
**Result:** not present.

- Unknowables kit uses per-build materials. No `userData.shared`.
- `stationRecord` adds beacon/halo; `teardownMesh` disposes maps and materials.

### Passed Checks
- [x] No secrets, API keys, or credentials in scoped files
- [x] No network, auth, or server trust boundary
- [x] Archive allow is own-key / exact faction strings
- [x] `textContent` labels and notices
- [x] Wave 82 UU constants, no third SKU
- [x] Digit 0 still shipyard (`DOCK_KEY_SERVICES` unchanged)
- [x] Seed chrome in `station.js` left intact

### Recommendations
1. Keep Unknowables out of `DETAIL_STATIONS` (already true).
2. Orchestrator must retune `scripts/boot-test.mjs` pins that still expect no Unknowables desk (this worker must not edit that file).
