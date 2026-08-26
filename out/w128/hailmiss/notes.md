# Wave 128 Hail02 miss-feedback notes

**Verdict:** leftover **REAL**. Name: **player-initiated named miss-feedback** (subject + eligibility + outcome). Named serial: **PR1**. Not CONSUME. Named serial is **not** none.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `execute_workflows` (`r-mt9mdq6d-8a0e1d1e`) selected `codex/workflow-drive-artifact-publishing` (score 35.64, coverage 0.06, terms `doc`/`edit`). That stack is Google Drive publish. This wave is **local repo markdown** under `docs/` and `out/w128/hailmiss/`. Did **not** call Drive. Did **not** `graph_approve` / `graph_propose`. External-share gate unused. Owner write-set is local files.
- Census live `src/systems/hail.js` player KeyH (`hailPressed && !open`), `tryOpenDisabledHail`, `canHailDisabled`, `bumpFear`.
- Census `src/systems/overlay-policy.js` `playSurfaceBlocked`, `canOpenPlayCard`, `hailCalmOk`, `canShowHail`, never `paused`.
- Census `src/systems/hud.js` `toastForEvent` (`hailOpened` demand-only), `commLine` drops `from`, `pushToast` `textContent`, 4 s / 8 s linger, context prompt H/J.
- Census `src/systems/npc.js`: **no** `hailPressed`; fear on capitulate/kill; Hail01 HEAVE-TO suppress live (**1746–1748**).
- Census KeyJ: `controls.js`, `station.js` **6321–6330**, `gate.js` **678–679**, `jump.js` `JUMP_REFUSE_LINE`.
- Census Callow `world.js` **1220–1245**. Agent `agent-api.js` **129–150** / schema `'hail'` not live.
- Cite sibling Hail01 (Wave 127 live) — do not retune. Cite Agent `hail` pulse — do not claim `agent-api.js`. Cite HUD-07 / HUD-06 / NAV-09 — do not claim layout.
- Code wins over playtest “H changed Fear”: KeyH does not write `world.fear`.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`. Did **not** write `src/`. Did **not** edit the wishlist.

## Why REAL (not CONSUME)

Named hole still live:

- KeyH `allow === false` is silent (`hail.js` **652–667**).
- KeyH salvage null is silent (friendly / live / range / kind lock).
- Overlay-blocked and calm KeyH have no named toast.
- HUD `H — Hail` on live bargain does not open a player card.
- KeyJ dock/jump miss is unnamed (except standing `'No passage.'`).

Salvage **success** card **does** exist for disabled hulks in 600 u. That is **not** named miss-feedback. Do **not** CONSUME on salvage success alone.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Channel | HUD-04 toast, `textContent` |
| Key | stable, **no** distance |
| Copy | `{name} — hail out of range ({n} u)` shape |
| Cover | none / range / overlay / calm / no-hail / salvage vs hail / dock / jump |
| Fake card | no |
| Fear | no |
| Pause | no |
| Persist | none |

## Later write-set (do not edit now)

- Prefer `src/systems/hail.js` miss emit.
- If a toast must change: `hud.js` **listeners only** — do **not** claim HUD layout (HUD-06 / HUD-07).
- Do **not** claim `controls.js`.
- Do **not** claim `agent-api.js`.
- Do **not** claim `npc.js` / Hail01.

## Coupling (do not steal)

- Hail01 incoming pirate demand (live).
- Agent API observe/act / cheat hail.
- HUD-06 home marker. HUD-07 deconfliction. NAV-09 chart zoom.
- CTL-02 overlay pause.
- CTL-03 PR2, CTL-04 PR2 `fireHeld`, AI-05 PR2, HUD-04 flood rewrite.

## Graph

`resolution_id` `r-mt9mdq6d-8a0e1d1e`. Decision `execute_workflows`. Primary workflow Drive publish is a **false bind** for this local leftover pack. Local write-set completed as the owner assigned.

## Reviews

Security HIGH (XSS name, Agent hail, persist mute, pause, Fear-as-feedback) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after KeyJ include, linger-key-without-distance, primitive event fields, and no-ship payload. UI Blocker/Major **resolved as later copy** (live KeyH stays silent until PR1).
