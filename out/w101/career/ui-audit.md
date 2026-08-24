## UI Audit: BIO-02 remaining career branches (Wave 101)

### Summary
Wave 101 restates live Beautiful Hangar train papers and **omits** a new career desk Digit and Hangar kit mutate. Optional later labels ride existing Offers. Digit 0 stays Shipyard. No Blocker or Major remaining.

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Proposed desk/HUD copy is UI. Markdown only. Do not edit product UI. Nested subagents forbidden. Do not spawn `[designer]`. Desk Digit theft is a Blocker if proposed.

### What's done well

- Live train already uses yard two-step: Offer → Confirm / Esc (`shipyard-desk.js` 376–435). Same Hangar pane as hull mounts.
- Offers are click `Offer {dest}`, **not** Digit 3+ (`shipyard-desk.js` 426–434). Hull digits stay 3+ / Hangar 0 = row 8 (`143–151`).
- Dock Digit 0 stays Shipyard (`station.js` 186, 5802–5804, 5920–5922). Digit 1 Hangar / 2 Yard stay panes.
- Hostile Bloom already paints `No sale.` without graft-style hide (`trainPaint` 221–222).
- Short credits keep Offers; Confirm refuses (`Not enough credits.`).
- Cargo-keep note sits under Confirm (`TRAIN_CARGO_NOTE`).
- Reduced-motion: no new pulse proposed. Copy only.
- HUD never writes `hullKind`. Living stays bio. `HAIR_CAREER` is a hairline inset, not chrome.
- Career kit mutate **omit** — Digit 6 Outfitting already sells scanner / mining / concealed / racks.
- `h()` `textContent` only (`station.js` 4302–4306). Color is not the only hostile cue (`No sale.` text).

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### U1: Career Digit stealing dock 0–9 or Hangar 3+

**Location:** `station.js` 186, 5920–5922; `shipyard-desk.js` 18–20, 143–151, 469–496  
**Issue:** A “Digit 3 Career” tab would steal hull 3+. Digit 0 Career would steal Shipyard. Digit 5 Career would fight Repair (dock) and psionic (undocked). Digit 6 Career would steal Outfitting.  
**Fix applied:** No new Digit. Career chrome, if any, is Hangar click Offer like train. Kit mutate omit.

##### U2: Six named career hulls as new class chrome

**Location:** wishlist forms; live Hangar dest list  
**Issue:** Six extra class names on Yard + Hangar would imply new SKUs.  
**Fix applied:** Careers are words on **existing** dest keys. Confirm hop stays `{from} → {dest}`.

##### U3: Hangar kit papers crowding hull list + train dests

**Location:** `renderHangarPane` already lists hulls + up to five train Offers  
**Issue:** A second Offer column of six career kits would bury Mount.  
**Fix applied:** Kit mutate **omit**. Outfitter stays Digit 6. PR1 may add a **word** to existing dest rows, not a second list.

##### U4: HUD career family / `hullKind` write

**Location:** `hud.js` 80–88, 101  
**Issue:** A career HUD skin that writes `hullKind` or binds `HAIR_CAREER` would lie.  
**Fix applied:** HUD never writes `hullKind`. `HAIR_CAREER` not bound.

#### 🟡 Minor

##### U5: Five dest Offers already fill Hangar

**Location:** `livingTrainDests` + `trainPaint` 223–231  
**Issue:** Static career words lengthen `Offer {dest}` labels.  
**Fix (accepted):** Keep words short (`combat`, `hunter`, `trade`, `explore`, `capital`). Do not print fake keys. Later serial; not this wave.

##### U6: Dead `TRAIN_HEAVY_NOTE`

**Location:** `shipyard-desk.js` 94  
**Issue:** If a later PR shows it on `frigate`/`ace`, the desk lies.  
**Fix (accepted):** Contract forbids revival as dest-stop law.

#### 💡 Suggestion

PR1 legend can keep live `Train on Hangar · Esc cancels papers` (`shipyard-desk.js` 457–459). Do not add a Career legend line unless labels ship.

### Recheck

No Digit theft in the brief. No new overlay. No Blocker / Major remaining.
