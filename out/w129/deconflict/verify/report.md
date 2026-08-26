## Status CLEAN

## What I tested
Live Playwright MCP on Vite `http://127.0.0.1:5175/` (`npx vite --port 5175 --strictPort --host 127.0.0.1`). Did not bind or steal Vite **5173** / **5174**. Did not start Chrome CDP **9412** (Playwright MCP drove the page). New Game confirm → origin Freehold Greenhand. Inspected `window.__ctx`. Contract: `docs/Hud07DeconflictionDesign.md` + `out/w128/deconflict/shared-contract.md` (contract wins). Did not edit `src/`.

Player flows:
1. Cruise, not combat. RANGE word computed opacity **0.14**; LEAD word `.rw-yield` + opacity **0.14**. POS HOME, HOME chevron readable. Screenshot `01-cruise.png`.
2. KeyT lock Red Marlow. `.rw-target-name` has `.rw-yield` (`display:none`); `.rw-combat-name` shows `Red Marlow` once. Rail DIST visible; RANGE word yielded. TGT edge arrow at **y=84**. Screenshots `02-lock.png`, `03-lock-on-glass.png`.
3. Combat lock Carver Illyx (`#hud.in-combat`). Four bracket corners on glass. Lead **ring** shown. RANGE word still yielded; `.rw-reticle.in-range` ring stays. Existing `.rw-fade` **0.14** on POS; HOME chevron opacity **0.14** (existing `#hud.in-combat .rw-home-mark`), not a second hide / not `.rw-yield`. Screenshot `05-combat.png`.
4. 80 px hub: children pupil + 3 cilia + RANGE word only. No `rw-deconflict` / compass / PPI child. Computed reticle 80×80.
5. HOME chevron center **y=108** (inset 108). NAV-02 gate cue center **y=84**. TGT edge **y=84**. GATE row + POS HOME stay. Screenshot `09-gate-nav.png`.
6. Hail02: KeyH with no lock → toast `No lock — hail` class `rw-toast show warn`. Screenshot `07-hail-nolock.png`.
7. NAV-09: KeyM chart. Zoom in / Zoom out / Reset view present (`#rw-galaxy-zoom-in|out|reset`, height 24, min 24px). Galaxy CSS live (68 `.rw-galaxy` rules). Screenshot `08-chart-zoom.png`.
8. `reducedMotion`: yield CSS is `display:none` / cruise opacity 0.14. RANGE/LEAD `animation-name: none`. No HUD-07 `@keyframes`.
9. Console: 0 error, 0 warning. No HUD throw.

Static: `hud.js` `innerHTML` 0, `aria-live` 4, `HOME_EDGE_INSET = 108`, `EDGE_MARGIN = 84`, `hailMissToast` kept, `stripHudText` on rail name. `hud.css` still has `.rw-galaxy-*`. Dock **J** read on glass in `10-dock-j.png` (prompt not `.rw-yield`).

## Bugs found
None that fail HUD-07 PR1 (duplicate name yield, RANGE/LEAD word quiet + hide-not-delete, rings stay, cruise quieter, HOME/GATE/J/POS not stolen, 80 px hub empty of extras, insets 108/84, Hail02 toast, NAV-09 zoom, galaxy CSS, no new pulse, no HUD throw).

Coverage notes (not failures): `04-lock-bracket.png` is discarded (lock dropped after a harness move). On-glass corners were taken in combat (`05-combat.png`) instead. Dock J later drifted off as the ship moved; the still still shows `J Dock`.

## Environmental issues
- Graph resolve `r-mt9oywbu-c6bfbab3` returned `execute_workflows` for `codex/workflow-activar-case-study-builder` (score 23.89, coverage 0.11). That workflow is an Activar case-study builder and does not match HUD verify. No graph write. Live drive followed the owner verify brief.
- CDP **9412** was reserved and unused. Playwright MCP used its own browser. Port 9412 was not LISTENING before or after.
- Vite PID 44128 on **5175** was stopped after the pass.

## Evidence
Stills under `out/w129/deconflict/verify/`:

| File | State |
|---|---|
| `01-cruise.png` | Cruise; RANGE/LEAD words quiet; POS HOME + HOME chevron |
| `02-lock.png` | One name `Red Marlow`; DIST on rail; RANGE word off; TGT edge |
| `03-lock-on-glass.png` | Same lock; one name; HOME/POS stay |
| `04-lock-bracket.png` | Discarded (lock dropped) |
| `05-combat.png` | Combat; 4 corners; one name; lead ring; RANGE word off; POS faded 0.14 |
| `06-hail-nolock.png` | Toast already faded; text still `No lock — hail` in DOM |
| `07-hail-nolock.png` | Toast `No lock — hail` live |
| `08-chart-zoom.png` | Zoom in / out / Reset view |
| `09-gate-nav.png` | GATE row + gate cue; POS HOME |
| `10-dock-j.png` | `J Dock` prompt |

Also: `probes.json`, `console.txt`.

Live insets:

- HOME chevron center y = **108**
- NAV-02 gate cue center y = **84**
- TGT `.rw-edge-arrow` y = **84**

Cruise CSS:

```694:697:src/ui/hud.css
#hud:not(.in-combat) .rw-reticle-range,
#hud:not(.in-combat) .rw-lead-label {
  opacity: 0.14;
}
```

Yield hide-not-delete:

```690:691:src/ui/hud.css
/* HUD-07: hide yielded words/labels. Nodes stay in the tree. */
#hud .rw-yield { display: none; }
```
