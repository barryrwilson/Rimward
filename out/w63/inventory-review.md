## Code Review: out/w63/current-shp-inventory.md

### Summary
The inventory matches the tree. `createShipState` field list is complete. `DOCK_KEY_SERVICES` matches `station.js` 116. Ships-today is separate from wishlist SHP. No persist schema is proposed.

### What's done well

- Player mesh path is stated as living-only, with an explicit “no `buildShipMesh` in `ship.js`” cite.
- Player flight speed vs `SHIP_CLASSES` cruise is split (config.ship vs `hoverTurnRateFor(classKey)`).
- `ctx.cargo` vs `ctx.player.cargo` is named so a later hull swap does not move the hold onto the record by accident.
- Bio companion is listed as `ctx.bio` fields that outlive `Object.assign(ctx.player, …)`.
- Save-tamper surfaces are named without designing a hangar blob.

### Findings

No blocker or major factual errors after the combat-head cite pin (`combat.js` 1031).

#### 🟡 Minor: `createShipState` throws on a bad `classKey`

**Location:** inventory §2; `state.js` 119–120  
**Issue:** The brief says a bad key throws. That is true (`cls.shield` on `undefined`). Restore / repair callers already guard with `SHIP_CLASSES[p.classKey] ? … : 'light'`.  
**Fix:** already stated in §2 and §5.3. No change required.

#### 💡 Suggestion: later SHP must not assume `classKey` retunes cruise

**Location:** inventory §1, §3  
**Issue:** A designer who only reads `SHIP_CLASSES` may think buying a freighter slows the player. Today only turn (and integrity, if rebuilt) follow `classKey`.  
**Fix:** already called out. Keep that split in the SHP design wave.

### Checklist

- [x] Every required topic has a file+line cite
- [x] `DOCK_KEY_SERVICES` list matches source
- [x] `createShipState` fields complete; no `hullKind`
- [x] Wishlist isolated in §12
- [x] No `src/`, `PROGRESS.md`, or wishlist edits
