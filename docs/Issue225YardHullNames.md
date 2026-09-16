# Issue #225 — yard hull names

## Mission and acceptance

- Outcome: a newly purchased Yard hull has its own ship name; Hangar shows name and class separately.
- Specification: GitHub #225, based on `5abc9a68`; branch `codex/issue-225-yard-hull-names`.
- Builder: Codex, Rex implementation lane. Stage: implemented, ready for independent QA.
- Scope: `src/game/shipyard.js`, approved expansion `src/game/state.js`, issue-specific tests and this evidence record.
- Non-goals: rename UI, retroactive renaming of existing saves, changes to purchase economics, kit, starter identity, persistence schema, or Hangar layout.
- Next owner: orchestrator / independent Quinn review; exact submitted artifact is the commit containing this record.
- Required integration gates: independent review, build, complete boot suite and backlog status update. No deployment or merge authorized in this worker handoff.

## Diagnosis and implementation

`buildStockRow` previously assigned `classKey` to both the new state and stored hull name. Hangar already had separate `.shipyard-hull-name` and `.shipyard-hull-meta` elements, so no UI source edit was needed. Mounting already copies the row name into `player.name` and `world.shipName`, which the station header uses.

The existing NPC name pools in `world.js` are private and keyed by system, with no reusable all-faction generator. Small frozen Yard pools now live with game data in `state.js`. Freehold, Veridian and Ledger names reuse established NPC vocabulary; other banners receive names in their faction idiom. Purchase draws once after eligibility checks and stores the result in the existing `name` field. A numeric suffix avoids duplicating an owned hull's name on a repeated roll. No reroll occurs on mount or load; existing names remain untouched.

## Verification evidence — 2026-09-16

Focused command:

```powershell
node --import ./scripts/with-css-stub.mjs scripts/issue-225-yard-hull-names-test.mjs
```

PASS: all 60 faction/class purchases; generated names, separate name/class Hangar output, world/player mount mirrors, starter preservation, JSON round trip, repeated-roll uniqueness, and refusal no-op. `git diff --check` passed. Dependencies installed with `npm ci --ignore-scripts` (0 vulnerabilities reported).

Live browser command (requires Vite listening on loopback):

```powershell
npm run dev -- --host 127.0.0.1 --port 5225
node scripts/issue-225-live-probe.mjs
```

For an existing integration server, set `ISSUE225_URL` to its loopback URL. Optional `CHROME_PATH` overrides the Chrome executable. The script uses native CDP and isolated headless Chrome; it funds and positions the pilot through the existing debug context, then uses rendered Yard papers and Hangar Mount controls. This is not a flight/navigation test.

PASS: purchased Freehold freighter **Kestrel Mercy** for 24,000 UU; mounted header read **“Kestrel Mercy” made fast**; Hangar name read **Kestrel Mercy** with separate **freighter · Freehold Compact · mounted** metadata. Real snapshot/restore retained the name; switching back to the starter restored **she**. No browser console errors or uncaught exceptions. Captured desktop screenshot was visually inspected: name/class and header were legible with no overlap. Temporary screenshot: `C:/Users/barry/AppData/Local/Temp/rimward-225-TViJ9s/mounted.png` (not committed).

The probe's first draft waited for nonexistent `flags.started`; that runner-only wait was corrected to existing pause/title state and rerun successfully. No product workaround was introduced.

## Builder reviews and limitations

Security checklist self-applied: low-risk local content change; only authored strings, unchanged text-safe DOM rendering and sanitizer, no secrets/network/bridge changes, JSON-safe existing persistence field. No findings.

Code checklist self-applied and final diff rechecked: naming occurs after catalog/reputation/credit/capacity checks; all catalog factions have pools; suffix loop is bounded by current hangar occupancy; starter and old save names are preserved. No findings. Full build and boot suite deliberately deferred to integration coordinator.

Designer-agent audit skipped; desktop screenshot inspected by builder. No new UI structure or controls. Separate mobile/tablet review not performed. Independent QA remains required; self-review is not approval.

Rollback: revert this issue commit; existing persisted hull names remain valid because the save schema is unchanged. Nothing deployed or pushed by this worker.
