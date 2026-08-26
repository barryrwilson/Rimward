# Security Review: HUD-06 home-station marker (Wave 126 markdown)

### Risk Level: Low (design); no live `src/` change this wave

### Summary

Markdown-only leftover pack. Census proves the pad has no persistent HUD cue. The dangerous later mistakes are `innerHTML` of station names, a persist key a hostile save could spoof, and projecting hidden NPC/AI positions. Contract forbids those. No secrets. Live `hud.js` already has **zero** `innerHTML`.

Review mode: **Deep Audit** on HUD string sinks + session flags + world pose (trust boundary = authored `SYSTEMS[].station` names/positions + `ctx.station` session object). Applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` and persona `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.

---

## Security Audit: home marker / POS HOME / project pose

### Summary

Overall risk if PR1 follows the contract: **low**. Overall risk if PR1 uses `innerHTML`, persists a POI, or projects ship banks: **high**. Those paths are **forbidden** in merge law (fixed before DONE).

### Finding 1: XSS via station name / distance HTML

- **Severity**: high (later impl; **resolved** in contract)
- **Category**: Injection (DOM XSS)
- **Location**: `hud.js:283-288` `el()` `textContent`; `421-428` `stripHudText`; `2074` live station lock name; later POS HOME / pip label
- **Description**: `ctx.station.name` is authored (`SYSTEMS[].station.name`) but the HUD already strips C0 for lock chrome. A later `innerHTML` / `insertAdjacentHTML` of name + dist would be XSS if a blob or debug overlay ever stuffed HTML into `name`. Live `hud.js` grep `innerHTML` = **0**.
- **Impact**: Script in `#hud` (pointer-events mostly none, still a page XSS).
- **Reproduction**: Only if PR1 sets `innerHTML` from `ctx.station.name`.
- **Remediation**: `textContent` / `el()` only. Always `stripHudText` on name. Contract §0.3.
- **Status**: **resolved** (lock).

### Finding 2: Persist spoof of a “home POI”

- **Severity**: high (design; **resolved** in contract)
- **Location**: `save.js:80-105` `WORLD_FIELDS`; `station.js:4394-4411` session `ctx.station`
- **Description**: Overlay/HUD flags are session. A new WORLD_FIELDS key for selected POI / home id would let a crafted `rimward-save-v1` point the marker at an arbitrary vector (or keep a stale system pad after jump). Inbox does not need persist: the live pad already rebuilds on `systemLoaded`.
- **Impact**: Marker points at attacker-chosen coords; player navigates into hazards thinking it is the pad.
- **Reproduction**: Hand-edit save if a key existed.
- **Remediation**: No new persist key. Session/UI only. Follow `ctx.station.position`. Contract §0.5.
- **Status**: **resolved**.

### Finding 3: Leaking hidden AI / unspawned positions

- **Severity**: high (design; **resolved** in contract)
- **Location**: `hud.js:1494-1516` contacts use **live** `ctx.ships`; `npc.js` banks stay off HUD; later home project
- **Description**: Inbox “selected POI” might tempt a generic projector over records/banks. Unspawned or cover identities must not become a world pip. Home PR1 projects **only** `ctx.station.position` (public pad furniture, same as dock math **6304-6319**).
- **Impact**: Player (or Agent API observe of HUD DOM) learns hidden spawn coords.
- **Reproduction**: Hypothetical POI loop over `recordBanks` / unspawned `ctx.ships`.
- **Remediation**: Station pose only. Selected POI omit. Contract §0.12, §0.1 kind.
- **Status**: **resolved**.

### Finding 4: Prototype pollution into HUD nodes / flags

- **Severity**: low
- **Location**: later class names; `ctx.flags.*Open` reads
- **Description**: `for-in` merge from a save blob into HUD state could set `__proto__`. Live restore copies WORLD_FIELDS by allowlist (`save.js:983`).
- **Impact**: Shared-object pollution.
- **Remediation**: Authored class `rw-home-mark`. Boolean flag reads only. Contract §0.12.
- **Status**: **resolved** (lock).

### Finding 5: Overlay hide must not read hail card DOM

- **Severity**: low
- **Location**: `hail.js:118` overlay; `ctx.flags.hailOpen` (`ctx.js:209`)
- **Description**: Querying hail innerHTML/demand text to decide hide could couple HUD to hail copy (sibling pack) and scrape demand strings into HUD.
- **Impact**: Wrong ownership; demand text in HUD.
- **Remediation**: Read `flags.hailOpen === true` only. Do not import `hail.js`. Contract §0.6, §0.10.
- **Status**: **resolved** (lock).

### Passed Checks

- [x] No secrets / API keys in this pack or live `hud.js` marker path
- [x] No new localStorage key
- [x] No `innerHTML` in live `hud.js`
- [x] Station pose is origin-public furniture (dock already uses it)
- [x] Agent API observe not claimed; no dump of hidden rolls
- [x] Fail-closed hide, never throw
- [x] No graph / CRM mutate

### Recommendations

1. PR1 must land `textContent` + POS HOME distance **with** the pip (partial merge forbidden).
2. Do not add a POI persist “just in case.”
3. Do not project anything but the pad.

---

## Re-review (after freeze)

HIGH findings 1–3 remain **resolved** in `shared-contract.md` §0.3, §0.5, §0.12. No open HIGH/CRITICAL. No `src/` in this pack.
