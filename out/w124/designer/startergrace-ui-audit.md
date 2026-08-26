## UI Audit: AI-05 starter grace / hostility pacing (Wave 124)

**Auditor:** `[designer]` (parent pass). Worker `out/w124/startergrace/ui-audit.md` is a self-audit only; this file is the review of record.  
**Scope:** `docs/Ai05StarterGraceDesign.md`, `out/w124/startergrace/shared-contract.md`, `out/w124/startergrace/ui-audit.md`. Markdown only. No `src/` this wave. Product source not edited.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Merge law:** If the design doc and the contract disagree, the contract wins (`shared-contract.md` L3–L4).

### Summary

The freeze is rail-legal. PR1 adds **no HUD pip** and that is **correct**: grace is the **absence** of unsolicited acquire / demand / duel, not a status widget. This pass does **not** demand hub chrome, a countdown, or a SAFE lamp (that would steal HUD-01). Named later toast copy, if any, stays `textContent` and must not tell the player they are invincible. The sibling hail-demand hole (toast without card) is **called out, not solved**. No 🔴 Blocker or 🟠 Major.

### Focus check

| Focus | Freeze | This audit |
|---|---|---|
| PR1 no HUD pip | Contract L19, L100; design L86, L132, L207–L209; worker L5, L11 | **Pass.** Absence of attack is the cue. Do not add a pip to “explain” quiet Illyx. |
| Toast copy accessible, not `innerHTML` | Contract L5, L15; design L120, L247, L265 | **Pass.** PR1 ships no new toast. Later optional collector line must **name** the collector; color is not the only cue. `textContent` only. |
| Do not steal HUD-01 hub | Contract L2, L19; design L12, L45, L119, L132 | **Pass.** Empty 80 px hub stays empty. No grace gauge on the aim glass. No new Digit. This audit does not ask for chrome. |
| Greenhand vs Marked / Dresk — not invincible | Contract L20, L54–L61, L105–L108; design L41, L213–L221 | **Pass.** Extra 180 s is Greenhand/Beautiful only, AI-side, no player copy. Marked / ledgerDebt / drifter extra **0**. Dresk **bypasses** extra starter. Scratch still breaks grace per hull. |
| Sibling hail-demand hole | Contract L10, L28, L178; design L87, L159, L225, L310; worker L33–L41 | **Pass.** Called out. PR1 gates acquire/demand/duel **before** telegraph. Remaining toast-without-card after grace is P1. No hail cards here. |

### What's done well

- **No-pip is the product.** Contract L19: empty 80 px hub, no grace pip on the aim glass, Digit 0/8/9 stay, no new Digit, no new key. Design L86 names a hub “SAFE” pip as HUD-01 theft and rejects it. Worker L11, L29–L31 accept quiet rim as the cue. That matches this leftover: grace is pacing, not a widget.
- **Player is not told they are invincible.** Design L41: not a god-mode shield. Player outcome L213–L221 is origin-split: Greenhand delay in Freehold only; fire-first still hunts that hull; Marked / Ledger Debt keep hop 60 s and origin danger; Dresk still comes. Contract L20: `alwaysHuntsPlayer` skips the extra window (hop + death calm still delay). No origin overlay line, no hub SAFE, no remaining-seconds toast.
- **Copy path is safe if a later pack adds a line.** Contract L5 forbids `innerHTML` / `insertAdjacentHTML` / `document.write`; toasts stay `textContent`. Contract L15: PR1 adds **no** chrome; a later optional collector toast must **name** the collector. Design L66 keeps live telegraph `Heave to. Cargo or hull.` Worker L13: that string already goes through `commLine` + `textContent`.
- **Hail hole is named, not redesigned.** Contract L10, L178; design L310. Gate telegraph by gating acquire. Do not design hail cards. Do not steal P1.
- **Reduced motion and input stay untouched.** Contract L14: leftover adds no animation and no settings checkbox. Contract L13: title / models / typing get no new input; grace is AI-side. Keyboard reach and focus rings are n/a (no new control).
- **Fail-closed timers protect the feel of the rim.** Contract L13 clamps corrupted `jumpGraceUntil` / death-until so a bad timer cannot grant a forever-safe board. That is a UX fail-closed, not a HUD.

### Findings

No 🔴 Blocker or 🟠 Major in this freeze.

#### 🟡 Minor: Do not “fix” quiet Greenhand with a grace cue

**Location:** `docs/Ai05StarterGraceDesign.md:86`, `:132`, `:207`–`:209`; `out/w124/startergrace/shared-contract.md:19`, `:100`; worker `out/w124/startergrace/ui-audit.md:23`–`:31`

**Issue:** A Greenhand may not know why Illyx is quiet for 180 s. A later serial could add a hub SAFE pip, a countdown ring, or a “you are under protection” toast. That would steal HUD-01, compete with P2 encyclopedia, and **tell** the player they are safe. Marked / Ledger Debt players must not see that copy either: extra is **0**, and Dresk bypasses extra.

**Fix:** Do not invent leftover chrome. Quiet rim (no telegraph flash, no heave-to toast, no hail card) is the cue. It is perceptible without color. Owner may add a one-line comm in **another** pack; that line must not say SAFE / grace / invincible / remaining seconds, and must not land in `.rw-reticle`.

**Status:** accepted — no-pip is the freeze, not a missing HUD-01 hole. This designer pass does **not** demand chrome.

#### 🟡 Minor: Sibling hail toast-without-card stays after grace

**Location:** `out/w124/startergrace/shared-contract.md:10`, `:28`, `:178`; `docs/Ai05StarterGraceDesign.md:87`, `:159`, `:225`, `:310`; worker `out/w124/startergrace/ui-audit.md:33`–`:41`

**Issue:** Live telegraph `Heave to. Cargo or hull.` can fire without a hail card (P1). If a later impl delays acquire but still `say()`s that line during extra/death windows, the playtest toast returns during grace.

**Fix:** PR1 gates hunt acquire, demand, and duel **before** telegraph. Do not design hail cards, hail.js DOM, or a demand lifecycle here. Remaining toast-without-card **after** grace is the P1 sibling — call out, do not solve.

**Status:** accepted — sibling; acquire gate is the AI-05 fix.

#### 💡 Suggestion: Later Dresk / collector line must name the hull, never a shield

**Location:** `out/w124/startergrace/shared-contract.md:15`, `:20`; `docs/Ai05StarterGraceDesign.md:219`; worker `out/w124/startergrace/ui-audit.md:43`–`:51`

**Issue:** Ledger Debt players may want a line that the collector is inbound. A color-only lamp or a “you are safe from Dresk” line would lie: extra starter does not block him.

**Fix:** If another pack adds it: one `commLine`, `textContent`, name “Collector Dresk”, no hub pip, no Digit, no remaining-time. Not this pack.

**Status:** accepted — out of PR1.

#### 💡 Suggestion: Optional PR2 home-berth bubble must stay AI-side

**Location:** `out/w124/startergrace/shared-contract.md:90`–`:92`; `docs/Ai05StarterGraceDesign.md:200`–`:201`

**Issue:** A “patrolled safe bubble” in the wishlist can be misread as a painted radius or SAFE disc on the aim glass.

**Fix:** If PR2 ships, it is acquire keep-out near the dock envelope only. Do not draw a law-zone / SAFE disc in the hub or on the glass. Scratch still works. Not a god-mode shield.

**Status:** optional later; not PR1.

### Specified later UI (PR1)

**Later UI = none.** PR1 must:

- Keep the empty 80 px hub, existing `originChosen` / `commLine` toasts, `textContent`, Digit 0/8/9
- Must not steal Digit 0/8/9
- Must not `innerHTML` names
- Must not add hub chrome, a grace gauge, a SAFE pip, or a countdown
- Must not add hail cards or encyclopedia slides
- Must not toast “grace”, “SAFE”, “invincible”, or remaining seconds (that would teach Greenhand a shield and lie to Marked / Dresk)

Accessibility of “no pip”: the player’s cue is **combat not starting**. That is not color-only. Keyboard reach unchanged. Focus rings n/a. `reducedMotion` n/a (no new motion).

**Re-audit after markdown lock:** still no Blocker/Major. No-pip freeze stands. Worker self-audit agrees; this file is the review of record.

### Verdict

**CLEAN** — no 🔴 Blocker, no 🟠 Major.
