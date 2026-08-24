# TGT-03 remaining awareness — Wave 97 verify notes

**Date:** 2026-08-23  
**Domain:** data (static)  
**Verdict:** CLEAN  
**Server:** not started. Classes grepped in `src/ui/hud.css` + `src/systems/hud.js`.

## Files present

| Path | Present |
|---|---|
| `docs/Tgt03AwarenessDesign.md` | yes |
| `out/w97/tgt03/current-tgt03-inventory.md` | yes |
| `out/w97/tgt03/shared-contract.md` | yes (merge law) |
| `out/w97/tgt03/security-review.md` | yes |
| `out/w97/tgt03/code-review.md` | yes |
| `out/w97/tgt03/ui-audit.md` | yes |

Extra (not in worker touch list): `out/w97/tgt03/designer-audit.md` (08:55, after the 08:43–08:48 write-set). Freeze agrees with ui-audit. Not a bug.

Brief header merge law points at `out/w97/tgt03/shared-contract.md` and says the contract wins.

## src / sibling edits

- TGT-03 write-set mtimes 08:43–08:48. Live `hud.js` / `combat.js` / `npc.js` / `hud.css` last writes were 2026-08-22 23:19 through 2026-08-23 01:57. This worker did not edit `src/**`.
- Repo `src/**` is already dirty from earlier waves. Not charged here.
- `Incoming fire.` is **not** in `src/**`. `npcFireToast` is **not** in `src/**`.
- `docs/Bio05AbominationsDesign.md` / `docs/OwnerDecisionsWave97.md`: no TGT-03 freeze strings.
- `docs/NpcTurretsDesign.md` exists (sibling). Mentions TGT-03 only as a do-not-edit fence. This worker did not write that file.
- Dirty `docs/Nav02GuidanceDesign.md` is a Wave 85 status line. Not awareness copy. Dirty wishlist / `PROGRESS.md` diffs do not contain `Incoming fire.` / `Tgt03Awareness`.

## Inventory live cites (spot check)

Line drift of a few lines is allowed. Symbols must exist.

| Claim | Live | Result |
|---|---|---|
| `.rw-edge-arrow` node | `hud.js:732` `el('div', 'rw-edge-arrow is-hidden', root)` | OK |
| CSS triangle | `hud.css:576–594` `var(--amber)` | OK (inventory 575–594 includes comment) |
| Behind-camera flip | `hud.js:1249–1250` `proj.z > 1` | OK |
| Off-glass + `EDGE_MARGIN` | `hud.js:64`, `1290–1305` | OK |
| `lockOk` / kinds | `hud.js:363–367`, `1197–1203`; wrappers `reticle-aim.js:279–310` | OK |
| `.rw-nav-gate-cue` | `hud.js:733–737`; `hud.css:1003–1037` | OK (inventory 1001 includes comment) |
| NAV park dock/jump | `hud.js:1563` | OK |
| Dart toast | `hud.js:61–62, 567–571` `Incoming dart.` + `DART_TOAST_GAP` 2.5 | OK |
| Cannon toast absent | `hud.js:567–568` returns unless missile+player | OK |
| FORE/AFT on `playerHit` | `hud.js:1122–1124`, `1343–1362`; no `'playerHit'` toast case | OK |
| Empty 80 px hub | `hud.js:1184–1186` `cx - 44` comment “80 px hub” | OK |
| Contacts `.rw-contacts` | node `hud.js:787–788`; scanner gate `1365–1372` | OK |
| Ace cannon omit target | `npc.js:1923` `{ weapon: 'cannon' }` | OK |
| Hunt cannon `ai.target` | `npc.js:1547` | OK |
| Combat vsPlayer omit | `combat.js:1788` `tgt === 'player' \|\| tgt == null` | OK |
| Missile missing target drop | `combat.js:1779–1781` | OK |
| `spawnNpcShot` unknown → cannon | `combat.js:1300` | OK |
| Refuse psionic | `combat.js:1302`; `npc.js` grep `psionic` = 0 | OK |
| NPC missile pool 4 | `combat.js:173` | OK |
| Telegraph 3 s | `npc.js:88`, `1526–1537` | OK |
| ~0.33 s cadence | `npc.js:89`; `state.js:118` `rof: 6` | OK |
| `LOCK_CONE_PX` 12 | `reticle-aim.js:15` | OK |
| KeyT / KeyV | `controls.js:265–266`, `280–281`; cycle `393` | OK |
| Digit 0 shipyard | `station.js:186` last `DOCK_KEY_SERVICES`; `5920–5922` | OK |
| Digit 8/9 papers | comments `1622–1623`; `armOutfitPapers` `1699–1702` | OK |
| `WORLD_FIELDS` no awareness key | `save.js:76–101` (has `scanner`, `nav`) | OK |
| `innerHTML` in `hud.js` | 0 hits | OK |
| `npcFire` vocab | `ctx.js:244` | OK |
| Song bark | `song.js:68–69`, consume `423` | OK |
| Toasts 5 slots `textContent` | `TOAST_SLOTS` `hud.js:60`; slots `758–765`; write `1103` | OK |
| `rimward-settings-v1` | `settings.js:23` | OK |

## Freeze

| Rule | Freeze location | Result |
|---|---|---|
| Distinct from `.rw-nav-gate-cue` | contract §1.1; brief goals 2 | pass |
| Both cues may show | contract §1.4 | pass |
| No aim-glass gauge / empty hub | contract §6; brief non-goals | pass |
| Digit 0/8/9 untouched | contract §0.5 / §6 | pass |
| No new persist / SKU / `state.js` | contract §0.2–0.3 | pass |
| Keep `Incoming dart.` | contract §2 | pass |
| Propose `Incoming fire.` for cannon vs player | contract §3.3 | pass |
| Ace omit toasts fire | contract §3.2 | pass |
| NPC-vs-NPC no toast | contract §3.2 | pass |
| Unknown `npcFire.weapon` must **not** toast as cannon | contract §3.2 / §5; HUD `=== 'cannon'\|'missile'` only | pass |
| FORE/AFT hit-only | contract §3.6 | pass |
| Wave 97 no `src/` | contract §0.1 | pass |

## Nits (not bugs)

1. `out/w97/tgt03/code-review.md` live-cite table says “Empty hub 44 px”. Live comment is the **80 px** hub with clamp `cx - 44`. Inventory and brief state 80 px. Symbol and line are correct; the review row label is sloppy.
2. Inventory “contacts hostile chevron” cites `hud.js:1483`. That line is `if (row.hostile)` tracking. Intent flag is `1402`. Chevron shape is CSS. Related, not a missing symbol.
3. Contract §3.2 later-psionic “reuse Incoming fire.” vs HUD allowlist cannon/missile only. This serial does not emit psionic. Unknown still must not toast as cannon. Residual later-impl tension only.

## Graph note

`graph_resolve` first hit office-document workflows (`blocked_ambiguous`). A narrower call bound spreadsheet production (false match on “sheet”). Assigned work is markdown cite check, not a workbook. Static verify ran as assigned.
