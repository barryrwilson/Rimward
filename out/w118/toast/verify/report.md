## Status
CLEAN

## What I tested

Markdown-only recheck of the Wave 118 HUD-04 toast-flood freeze. No Vite. No Chrome. No `src/` edits by this verifier.

Recheck targets:

1. Five-row `{ key, lastShown }` linger independent of chip reuse; suppress if `now < lastShown + 8`; do not clear linger on chip reuse.
2. Expire sets `aria-hidden="true"`; real show sets `aria-hidden="false"` then `textContent`; no assertive; no second live region.
3. Leftover still **REAL** vs live `hud.js` (still no linger ring / no `aria-hidden` on expire).
4. No `src/` writes in this toast re-dispatch (`docs/Hud04*` and `out/w118/toast/**` only for this worker).

## Freeze 1 — linger ring

| Token | `out/w118/toast/shared-contract.md` | `docs/Hud04ToastFloodDesign.md` |
|---|---|---|
| Five-row `{ key, lastShown }` | Yes. §0.7, §0.14, §0.1 table, formulas `linger = [{ key: '', lastShown: -1e9 }, ×5]`, §4 write-set | Policy yes (five-row **key** linger, not chip-tied). Field names live in contract (merge law). Design §3 punch: see contract §0.1. |
| Independent of chip reuse | Yes. §0.7, §0.1, formulas, non-picks, §2 | Yes. Overview L47; pain L84; goals L109; design L149; acceptance L233; alt L258; regression L274; open Q L303. |
| Suppress if `now < lastShown + 8` | Yes. Formulas step 2; fail-closed §2 | Policy yes: 8 s window; suppress after expire / after chip reuse (L47, L148, L233, L303). Inequality token is in contract formulas. |
| Do not clear linger on chip reuse | Yes. §0.7, §0.1, expire comments, non-picks, §2 | Yes. L47, L258, L274, L303. |

Contract is merge law. If the two files ever disagree, the contract wins. Design defers the punch to contract §0.1. No contradiction.

## Freeze 2 — live region

| Token | Contract | Design |
|---|---|---|
| Expire `aria-hidden="true"`; keep `textContent` | Yes. §0.19, formulas `expire`, §2 | Yes. L47, L150, L234. Inventory L66 still cites **live** expire with **no** `aria-hidden` (code wins). |
| Real show `aria-hidden="false"` **then** `textContent` | Yes. §0.19, formulas, §2 | Yes as unhide **then** write (L47, L113, L234). Exact `"false"` string is in contract. |
| No `assertive` | Yes. §0.19, NEVER `aria-live = 'assertive'`, non-picks, §3 | Yes. L113, PR1 does-not-land L186. |
| No second live region | Yes. §0.19, non-picks | Yes. L113. |

Live already has a WAVE2 arrival banner `aria-live=polite` (`hud.js` 825). Freeze is: do **not** add a second **toast** live region. `.rw-toasts` stays one `role=status` `aria-live=polite` (815–816).

## Leftover still REAL vs live hud.js

Live toast channel does **not** implement the freeze. Census (code wins):

```
hud.js:64-65     TOAST_LIFETIME = 4; TOAST_SLOTS = 5
hud.js:568-569   saveBlocked → '▲ SAVE BLOCKED — ' + reason  (no e.source)
hud.js:815-816   .rw-toasts role=status aria-live=polite
hud.js:818-819   five chips { el, until: 0, key: '' } — no linger, no aria-hidden
hud.js:1155-1157 visible same-key refresh only (until > now)
hud.js:1169      textContent (no innerHTML)
hud.js:1197-1201 expire: until=0, key='', remove show — NO aria-hidden
```

No `TOAST_DEDUP_WINDOW` in `src/`. No `lastShown`. No linger ring. No `AUTOSAVE HELD`. No `source: 'autosave'`. No `source: 'berth'`.

`save.js` idle `BLOCK_RETRY = 5` (70, 1598) still re-emits `{ reason }` only (1040, 1422, 1428, 1535, 1540). Hostile reason is still berth wording (1028). Expire clears `key`, so a 5 s retry after 4 s lifetime restacks. Leftover is **REAL**. Not CONSUME. Serial named only: **PR1 toast-flood**.

`hud.js` `aria-hidden` hits are edgeArrow / gateCue / chartmarks / contacts — not toast expire.

## No src/ writes in this toast re-dispatch

Toast worker files = `docs/Hud04ToastFloodDesign.md` + `out/w118/toast/**` (untracked).

This verifier wrote only `out/w118/toast/verify/report.md` and the dump `*.txt` next to it. Did **not** edit `src/`.

Dirty `src/` is sibling / other-wave work. Do not blame the toast worker.

`git diff src/systems/hud.js`: classKey rails + Dock/Jump prompt D→J. Toast `pushToast` / expire hunks unchanged (still no linger, still no expire `aria-hidden`).

`save.js` emit line numbers shifted vs the prior verify dump (1414→1422, 1420→1428, 1527→1535, 1532→1540, idle 1590→1598) because sibling overlay edits grew the file. Payloads are still `{ reason }` only.

## Bugs found

None.

Freeze 1 and freeze 2 are in the contract (normative) and in the design (policy + merge-law pointer). Live code still lacks the linger ring and expire `aria-hidden`, which is the leftover, not a pack defect.

## Environmental issues

None that block this verify.

`graph_resolve` (`codex/agent-codex`) returned `blocked_ambiguous` (`r-mt8qdq3b-0092e3a7`). Candidates were spreadsheet / Word-Docs / Drive / automation / slides production. Triggers match `verify` / `report` / `edit`. This task is a local WebSim leftover census. Treated as a false match. Did not write CRM, Drive, or Open Knowledge. Did not start Vite or Chrome.

## Evidence

### Pack complete

| File | Present |
|---|---|
| `docs/Hud04ToastFloodDesign.md` | yes |
| `out/w118/toast/shared-contract.md` | yes |
| `out/w118/toast/current-toast-inventory.md` | yes |
| `out/w118/toast/notes.md` | yes |
| `out/w118/toast/security-review.md` | yes |
| `out/w118/toast/code-review.md` | yes |
| `out/w118/toast/ui-audit.md` | yes |

Integrator and contract agree leftover is REAL, not CONSUME, serial **not** none, named **PR1 toast-flood**.

### Contract formulas (normative)

```
linger = [{ key: '', lastShown: -1e9 }, ×5]
// visible same key → extend until; bump linger lastShown
// any linger entry with that key and now < lastShown + 8 → suppress
// expire: aria-hidden='true'; do NOT clear textContent; do NOT clear linger
// real show: aria-hidden='false' THEN textContent
// NEVER aria-live = 'assertive'
```

### Live hud.js (code wins)

```
src/systems/hud.js:64: const TOAST_LIFETIME = 4;
src/systems/hud.js:65: const TOAST_SLOTS = 5;
src/systems/hud.js:568-569: case 'saveBlocked': return { text: '▲ SAVE BLOCKED — ' + (e.reason ?? 'hostiles near'), cls: 'warn' };
src/systems/hud.js:815-816: role=status aria-live=polite
src/systems/hud.js:1155-1157: visible same-key refresh only
src/systems/hud.js:1169: slot.el.textContent = text
src/systems/hud.js:1197-1201: expire until=0, key='', remove show  (no aria-hidden)
```

### Live save.js emits (no source tag yet)

```
save.js:70    BLOCK_RETRY = 5
save.js:1028  'Hostiles within the encounter bubble — berth record refused.'
save.js:1040  ctx.emit?.('saveBlocked', { reason });
save.js:1422  ctx.emit('saveBlocked', { reason: 'Mid-jump — berth record refused.' });
save.js:1428  ctx.emit('saveBlocked', { reason });
save.js:1535  ctx.emit('saveBlocked', { reason: 'Mid-jump — berth record refused.' });
save.js:1540  ctx.emit('saveBlocked', { reason });
save.js:1598  nextDue = trySave() ? IDLE_INTERVAL : BLOCK_RETRY
```

`save.js:903` `source: raw.source === 'playerKill'` is a record field, not `saveBlocked.source`.

### Toast worker vs sibling src

```
?? docs/Hud04ToastFloodDesign.md
?? out/w118/toast/
 M src/systems/hud.js          (classKey + KeyJ prompt — sibling)
 M src/game/save.js            (overlay sibling; emit still { reason })
?? src/systems/overlay-policy.js
```

### Graph

Resolution `r-mt8qdq3b-0092e3a7`: `blocked_ambiguous`. False match. Local verify only.
