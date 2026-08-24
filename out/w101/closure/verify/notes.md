# Wave 101 TGT-03 closure design-only verify (re-dispatch)

**Domain:** data  
**Wave:** 101. No Vite. No `src/`.

## How to verify (this worker)

1. Brief + inventory cite live `hud.js` DIST.
2. No invented SKU / UU / Digit.
3. `shared-contract.md` forbids hub gauge, persist key, Digit steal, `innerHTML`.
4. Glyph band copies **exclusive** live contacts math (`hud.js` 1490–1491).
5. `ENVELOPE_CLOSE_RATE` cite is `npc.js` 112.
6. CLOS format is XOR: deputize `+N`/`-N`/`0`; never `«-12`.
7. Git diff for this worker has **no** `src/`.

## Inventory vs live code

Checked by reading files (not by starting the game):

| Check | Result |
|---|---|
| DIST create `hud.js` 855–857 label `DIST` | Match |
| DIST write `hud.js` 2018–2035 `distU + ' u'` | Match |
| Comment “standard, not gated” `hud.js` 2018 | Match |
| Core DIST vs scanner-gated arc `hud.js` 1385–1386 | Match |
| Mk II glyph exclusive `along < -4` / `along > 4` `hud.js` 1490–1491 | Match — contract copies exclusive |
| `|along| == 4` no Mk II «/» | Match (exclusive tests) |
| `CONTACT_CLOSE_FLOOR = 4` `hud.js` 75 | Copied, not minted |
| `ENVELOPE_CLOSE_RATE = 40` `npc.js` 112 | Match. Line 111 is `ENVELOPE_CLOSE_DIST` |
| Hub 80 px `hud.css` 184–191 | Match |
| `innerHTML` in `hud.js` | **0 hits** |
| Digit 0 → shipyard `station.js` 5920–5922 | Match |
| Digit 8/9 dock → launch/epics | Match |
| KeyT/KeyV `controls.js` 268–269, 283–284 | Match |
| `LOCK_CONE_PX = 12` `reticle-aim.js` 15 | Match |

## Contract freeze

`out/w101/closure/shared-contract.md`:

- 80 px hub: no CLOS on aim glass / `.rw-reticle`.
- No new `WORLD_FIELDS` / `localStorage` key.
- Digit 0/8/9 untouched; no closure Digit.
- `innerHTML` forbidden.
- No SKU / UU.
- Glyph inequalities: copy `along < -CONTACT_CLOSE_FLOOR` / `along > CONTACT_CLOSE_FLOOR`. Do not invent `<=` / `>=`.
- Format XOR: deputize `+N u/s` / `-N u/s` / `0 u/s`. Forbidden `«-12 u/s`.

## Deputize (playable defaults, not parking)

Core readout; tgt rail `CLOS`; signed `+N`/`-N`/`0`; no rail «/»; exclusive Mk II band on the arc; hide on non-ship; no scanner gate on rail; no pulse.

## Re-dispatch bugs

| Bug | Cause | Fix |
|---|---|---|
| Inclusive glyph band in MERGE LAW | Paraphrase `>= 4` instead of copy `<` / `>` | Contract §1.1 / §1.3 / §9 copy `hud.js` 1490–1491 exclusive |
| Stale AI line | `ENVELOPE_CLOSE_RATE` is `npc.js` **112** (111 is DIST) | All current cites use 112 |
| `«-12 u/s` | Signed number plus « prefix stacked | XOR; deputize signed only |

## Result

Design-only verify **pass** after re-dispatch. Inventory matches live DIST, exclusive contacts glyph, and `npc.js` 112.
