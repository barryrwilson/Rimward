# Code Review: Org01 origin consequence preview leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live flavor-only rows (`origins.js` **141**) and `applyEffects` after confirm (**52–85**, **127**). Do **not** reopen CONSUME. Contract forbids `state.js` preview tables, Digit remap, kit mutate, Onb01 steal, creditor rewrite, AI-05 retune, `innerHTML`, persist mute, **and overflow-as-only-fit**. No Blocker/Major remain after derive-not-table, one-press confirm, fail-closed skip, compact-first layout (overflow backup), and later write-set limited to `origins.js` paint (+ optional dedicated `.rw-origin-*`, not `.screen-panel`).

### What's done well

- Code-wins inventory with file:line for overlay copy, Digit map, every `effects` key vs `applyEffects`, defaults (350 credits, light hull 100, Mk I), ranks, systems, persist.
- CONSUME path documented and rejected: flavor + permanence footer are not mechanical preview.
- Five inbox kinds inventoried separately (hull, money, standings, danger, experience).
- Deputized literals use live numbers (350, −1150, 600, fear 15/5, bond 0.35) — no invented UU.
- Digit1–5 order frozen to `Object.keys(ORIGINS)` insertion order.
- Partial merge named: shipping money without standings still fails inbox.
- Fail-closed skip vs overlay throw named before impl.
- Neighbours Onb01 / Ctl05 / AI-05 / creditor explicitly unclaimed.
- `state.js` READ-ONLY with derive preferred.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `origins.js` **141** vs inbox five kinds  
**Issue:** Flavor `name — line` and footer permanence exist. That is not the CONSUME test. Hull/money/standings/danger/experience are missing before confirm. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: Preview after pick is not preview — **resolved in freeze**

**Location:** `applyEffects` **52–85** runs inside `choose` **127**  
**Issue:** Consequences are real **after** the permanent write. Frozen: paint derived rows **before** Digit/click. Do not move apply before confirm. Do not add a post-pick recap as the only PR1.

#### 🟠 Major: Competing preview laws (derive vs `state.js` table) — **resolved in freeze**

**Location:** honor; contract §0.20, §2  
**Issue:** A tiny authored `preview:` blob in `state.js` would duplicate `effects` and invite drift (money row 400 while `addCredits` stays −1500). Frozen: **derive**. No `state.js` write. No competing table.

#### 🟠 Major: Digit remap / two-step confirm — **resolved in freeze**

**Location:** `origins.js` **136–157**; boot tests Digit1 greenhand Digit5 drifter  
**Issue:** Reordering origins or adding a confirm Digit would steal wave-6 and WPN-after-pick. Frozen: map unchanged; one-press; optional PR3 only.

#### 🟠 Major: Kit mutate / credit retune as “preview honesty” — **resolved in freeze**

**Location:** `SHIP_CLASSES.light` **38**; `ctx.js` **174**; effects have no hull  
**Issue:** Changing hull per origin or rounding −1150 to a nicer debt would steal SHP and invent UU. Frozen: shared starter hull; exact derived credits.

#### 🟠 Major: Neighbour steal (Onb01 / Ctl05 / creditor / AI-05) — **resolved in freeze**

**Location:** `main.js` **138–139**; `world.js` **1008–1026**; `npc.js` **169–175**  
**Issue:** Easy to dump a flight lesson, pause menu, Dresk lines, or grace seconds onto the card and call it danger. Frozen: unclaimed. Danger derives start/fear/debt/bio/clue only.

#### 🟠 Major: Partial merge (some rows XOR others) — **resolved in freeze**

**Location:** contract §2  
**Issue:** Money without experience still fails inbox. Frozen: all five kinds in the same PR, plus skip/never-throw/`textContent`.

#### 🟠 Major: Listener leak / Digit steal after pick — **resolved in freeze**

**Location:** `origins.js` **126**; `controls.js` **548–562**  
**Issue:** Preview DOM that rebinds keydown without remove steals WPN. Frozen: keep remove-on-pick.

#### 🟠 Major: Overflow-only / `.screen-panel` steal — **resolved in freeze** (Wave 141 re-dispatch)

**Location:** prior contract “taller card may overflow”; live card **114–116**; designer `out/w141/designer/org01-ui-audit.md`  
**Issue:** Overflow on an unfocusable card is mouse-only. Reusing `.screen-panel` steals station/pause. Frozen: compact sublines primary (contract §0.21); overflow backup on dedicated origin list; no station/pause class steal; no new scroll key.

### 🟡 Minor: `Object.keys(ORIGINS)` vs frozen id list — **resolved in freeze**

**Location:** `origins.js` **29**  
**Issue:** Insertion order is the Digit map. A later `ORIGINS` key insert or proto key shifts Digits.  
**Fix (frozen):** PR1 iterates an authored id list in `origins.js` (`greenhand`, `ledgerDebt`, `marked`, `beautiful`, `drifter`). Same order. Not `state.js`. Skip unless `Object.hasOwn(ORIGINS, id)`.

### 🟡 Minor: Shared hull row repeats five times

**Location:** deputize table  
**Issue:** Players may think hull never matters.  
**Justification:** Inbox asked for hull/equipment. Shared starter is the true fact. Keep the row.

### 🟡 Minor: Live `applyEffects` has no try/catch

**Location:** `origins.js` **52–85**  
**Issue:** Paint can be fail-closed while apply still throws on a weird cargo entry.  
**Justification:** PR1 owns `origins.js`. Guard apply for unknown id / missing effects object without changing vocabulary. Do not expand cargo schema.

### 💡 Suggestion: Helper names

Later: short `creditsAfter(fx)`, `standingParts(fx)`, `dangerParts(fx)`, `experienceWords(fx)` in `origins.js`. Do not narrate the wave in comments.

### 💡 Suggestion: Optional PR2 still

One still: fresh boot, overlay, Ledger Debt row shows −1150 UU and Experienced **before** Digit2; after pick Digit2 is WPN.
