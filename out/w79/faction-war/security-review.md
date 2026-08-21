# Security Review: MSN-02 renewable faction-against-faction operations (Wave 79)

### Risk Level: Medium

### Summary

Wave 79 is markdown only. The threat model is a local browser save (`rimward-save-v1`) plus dock UI strings. First-pass HIGH holes (kind/cap collision, stuffed `target`/`destSystem`/`recordId`/`job.faction`, incident-ring AND origin-dock, stuffed progress-as-claim, proto ids, target-rep write, Named Gun renewable, XSS) are closed in merge law. Residual risk is single-player save tamper and pre-existing Digit-index race — not MSN-02-war-critical if the impl obeys the contract.

Persona: security-auditor + orchestrator `security-review.md` (deep audit on persist/pay/standing). No `src/` in this worker. Nested subagents are forbidden. Graph `execute_workflows` matched a false-positive home-network baseline; this review applies the local checklist only.

---

## Security Audit: MSN-02 war brief / contract

### Summary

Overall risk: moderate until PR1 sanitize lands; **low** if the later serial obeys `out/w79/faction-war/shared-contract.md`. No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

### Findings

#### 🔴 CRITICAL: (none)

No RCE, no secrets, no new `localStorage` key, no `innerHTML` plan.

#### 🟠 HIGH (resolved in contract): Cap 1020 evicts live families when war fills

**Location:** live `JOBS_SANITIZE_MAX` `save.js` 123–129 = `4+10*N+16` (1020 at 100)  
**Issue:** Two war slots per system add 200 honest rows. If PR1 kept 1020, drop order would violate “never drop honest offered mining/trade/hunt/passenger/explore” or refuse war slots. Baking espionage into the same formula would fight a sibling worker.  
**Impact:** Restore deletes careers or cannot heal.  
**Fix applied:** `JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + WAR_ROOM`. Inventory-time 1020+200=1220. **No** espionage term. Never drop unique four, accepted, honest mining/trade/hunt/passenger/explore, or honest war.

#### 🟠 HIGH (resolved in contract): Kind `'hunt'` / `'bounty'` / `'patrol'` reuse / Named Gun renewable

**Location:** unique ace + overlay share `kind: 'bounty'`; hunt is local pirate; unique patrol is pirate sweep (`station.js` 1732–1765, 2268, 1745); `JOB_KINDS` `save.js` 138  
**Issue:** Slotting war as `'hunt'` or `'bounty'` hits Named Guns and pirate career. Slotting as `'patrol'` hits unique `patrol-lane` and `freehold += 5`.  
**Impact:** Named Gun card overwritten; career exhaust; wrong standing key.  
**Fix applied:** `kind: 'war'` (unused). Ids `war-<sys>-<n>`. Eligibility forbids ace / ACES / NAMED_GUNS names / `role === 'pirate'`. Unique four stay. Overlay cap 2 stays.

#### 🟠 HIGH (resolved in contract): Stuffed `job.target` / `destSystem` / `job.faction` retargets purse or standing

**Location:** incidents match `i.name === …` with **no** record id (`world.js` 1332–1346); `JOB_FIELD_ALLOW` has no `faction` (`save.js` 146–151)  
**Issue:** A war row with `target: 'Carver Illyx'` or stuffed dest / `job.faction = '__proto__'` would pay the wrong kill or pollute `reputation`.  
**Impact:** Named Gun payout; prototype pollution; wrong banner standing.  
**Fix applied:** Pay rebinds `recordId` → origin/dest bank → `rec.name`. Dest rebinds `warDestId(origin)` from live `SYSTEMS.gates`. Employer = `SYSTEMS[origin].faction`. Target standing key = `SYSTEMS[dest].faction` and **is not written** this serial. No `faction` field. Never `reputation[userString]`. Never copy patrol `freehold +=`.

#### 🟠 HIGH (resolved in contract): Origin-dock AND witness vs incident ring

**Location:** `MAX_INCIDENTS = 40` (`world.js` 813); explore dock claim uses durable `mystery.visited`  
**Issue:** Requiring origin redock **and** a still-present incident would fail closed after dest combat fills the ring. Stuffed `job.progress = 1` would skip the fight if progress were the claim flag.  
**Impact:** Honest players unpaid; tampered saves skip the quarry.  
**Fix applied:** Space-side hunt cadence. Recompute witness every tick. Keep `progress` 0. Do not invent a visited key. Expire has no pay branch.

#### 🟠 HIGH (resolved in contract): Ghost `recordId` occupies slots / `ensureBank` spawn

**Location:** cap never-drop honest offered war; unvisited dest banks  
**Issue:** A stuffed save can plant two offered `war-<sys>-n` rows with `recordId: rec-999` while dest bank is missing. Sanitize would keep them. `syncWarJobs` would see count=2 and never post a real quarry. Calling `ensureBank` from Jobs would fabricate dest traffic.  
**Impact:** Career board empty after tamper; or Jobs spawns world records (Witness Rule break).  
**Fix applied:** When origin **or** dest bank exists, drop war rows whose record is missing/ineligible. `syncWarJobs` **pulls** ineligible **offered** ghosts. Do **not** `ensureBank` from Jobs. Accept refuses if the record is ineligible. Extra war beyond two slots still drops.

#### 🟠 HIGH (resolved in contract): Proto / hyphen job ids

**Location:** `SAFE_ID` `save.js` 101 rejects hyphens; live ids `bounty-ace`, `war-freehold-0`  
**Issue:** Whole-string `SAFE_ID.test(job.id)` would wipe unique four and families on restore. `war-__proto__-0` could pollute if used as object keys.  
**Impact:** Board wipe; prototype pollution if any impl does `jobs[id] =`.  
**Fix applied:** Hyphen-token grammar. `war-<SYSTEMS key>-<n>`. `recordId` `/^rec-(0|[1-9][0-9]*)$/`. `RESERVED_IDS` on full id and every token. Never map-assign by id. Bank walks use `Object.keys` + `Object.hasOwn` + reserved skip. Fresh `{}` only.

#### 🟠 HIGH (resolved in contract): Stuffed `payQuoted` / expire-as-complete / new UU table

**Location:** overlay trusts `job.reward` unclamped at claim (`station.js` 3087); mining clamps (`PAY_QUOTED_MAX` 204 / `save.js` 130)  
**Issue:** `payQuoted: 1e15` plus a past `deadline` read as complete would mint credits. Inventing a war bounty table would reopen UU.  
**Impact:** Economy break.  
**Fix applied:** Expire has **no** pay/rep branch. Clamp `0…20000` on sanitize and at pay. Stamp only origin `jobPayFor(PATROL_REWARD)` (live 300). Missing quote at pay → 0 credits + replace. No new UU table. No kill UU.

#### 🟠 HIGH (resolved in contract): Target-rep write / kill attribution / crime score

**Location:** `docs/RepStandingDesign.md` §7; patrol `station.js` 2777; `sanitizeReputation` `save.js` 672–691  
**Issue:** Shipping a guessed target delta or a `npcDestroyed` victim write invents REP-04 kill UU and a crime score. Copying `freehold +=` mis-attributes.  
**Impact:** Standing bag pollution; hostile-floor -10 (`npc.js` 87) moves without owner.  
**Fix applied:** Employer +2 only (`MINING_REP`). Target write **fail closed**. Candidate magnitude 2 is not shippable. No kill-attribution path. Complete uses existing incidents + record state. `HOSTILE_STANDING` untouched.

#### 🟡 MEDIUM: Digit 1–9 accept race vs splice

**Location:** `station.js` 4428–4431 index into `boardJobs`  
**Issue:** Pre-existing: Digit accept is by index. Replacement must not reuse spliced objects. Home board can exceed 9 cards.  
**Impact:** Wrong card accepted; existing UX (mouse Accept still works).  
**Fix:** Contract §3.7 / §12.2: mutate by identity; do not cut slots. Not war-unique.

#### 🟡 MEDIUM: Incident name collision across systems

**Location:** incidents have `name` not `recordId` (`world.js` 1332–1346)  
**Issue:** Two patrols could share a pool name.  
**Impact:** Wrong card could pay if bind used name only.  
**Fix applied:** Pay requires `recordId` + `rec.name` + rec `dead`/`captured` + `role === 'patrol'` + `rec.faction === SYSTEMS[dest].faction`. Duplicate war `recordId` extra-drops.

#### 🟢 LOW: XSS via restored titles

**Location:** `h()` `textContent` `station.js` 3208–3213; grep 0 `innerHTML`  
**Issue:** Save titles could carry control chars.  
**Fix applied:** `stripControlChars`; regen from templates; no `innerHTML`; no clue text.

### Passed Checks

- [x] No secrets in code (markdown only)
- [x] No new `localStorage` key
- [x] No `innerHTML` plan
- [x] No `state.js` write
- [x] No new frozen event
- [x] Prototype keys fail closed
- [x] Employer standing allowlisted
- [x] Target standing fail-closed
- [x] Unique ace / Named Guns not renewable
- [x] Espionage room not baked into cap
- [x] No asteroid UUID / data cargo / clue text

### Recommendations

1. Impl PR1 must add `'war'` and `WAR_ROOM` without resetting live 1020.
2. Impl PR3 must not write `reputation[target]` until the owner authors a finite delta.
3. Do not call `ensureBank` from Jobs.

---

## Resolved vs open

- **Resolved HIGH/CRITICAL this pass:** 8 HIGH, 0 CRITICAL (closed in contract/brief after first draft: origin-dock AND).
- **Open:** 0 HIGH/CRITICAL. MEDIUM Digit index is pre-existing. MEDIUM name collision mitigated by record bind.
