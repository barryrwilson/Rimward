# Courier shadowing and mission-local suspicion — #236 / #237

## Mission record and gate

- Outcome: identify a named courier, deliberately follow it, withdraw when warned, and bring a basic report back for the accepted payment.
- Stage: design; owner: Sloane. Implementation scope is pending explicit approval.
- Artifact: this document on `codex/spy-shadowing-design-236-237`, based on `83ec515879ed116621ff843ddc382e341047e364`.
- Authority: the owner selected the recommended #236 + #237 batch. Both issues separately require naming schema/event additions and obtaining explicit implementation scope. This document makes that decision concrete.
- Next gate: independent specification review, then owner approval of the contract below. Rex implements the approved contract; Quinn reviews the exact implementation commit; Owen handles any separately authorized merge/deployment and everyday-checkout handoff.
- Dependencies: #235's acquired-intel API behavior must remain present. #238 (optional deep dossier and premium) stays parked.
- Evidence: current-code discovery only. No implementation, build, boot, browser, balance, or deployment success is claimed by this design.

## Current behavior, at the base commit

The introductory espionage offer has `kind: 'espionage'`, `need: 1`, and a destination distinct from its employer (`src/systems/station.js:3538–3562`). Acceptance freezes its terms (`6032–6074`). Destination docking sets progress to one; returning to the employer settles it (`4662–4740`). Keep that entire introductory path unchanged. Its existing expiry/failure path can change destination-faction standing through `applySpyExpose` (`3441–3445`); the new subtype must bypass that path.

The save reader reconstructs allowed job fields, validates `spy-<origin>-<number>`, and enforces the existing espionage destination/need rules (`src/game/save.js:419–630`). Merely adding runtime fields would lose them on reload. API acquired status derives from binary progress (`src/game/agent-observe.js:467–517`; return preview in `src/systems/station.js:7803–7821`). Preserve that representation.

Records already have stable IDs, JSON routes, and route progress (`src/game/world.js:299–324`). Ordinary traders migrate, including from live traffic (`1809–1842`, `889–910`); their route normalization and offline advancement also matter (`815–841`, `1166–1266`). A generic trader cannot simply be relabeled and assumed to stay available. Traffic mesh retirement is distinct from record death (`src/game/traffic.js:78–240`). Restore rebinds live hulls to restored records (`src/game/save.js:1443–1545`); death restores a coherent recovery snapshot (`1730–1768`).

Normal targeting and API nearby ships use a 600-unit range, with no scanner requirement (`src/game/state.js:32`; `src/systems/controls.js:732–774,789–819`; `src/game/agent-observe.js:358–426`). A selected API target can remain present beyond range. Therefore target selection alone is not proof of contact. Reticle picking is not a mission line-of-sight test (`src/systems/reticle-aim.js:107–163`).

## Player contract

Add one additional, clearly titled **Shadow courier** offer at the existing Jobs desk, without replacing either introductory espionage slot. At most one offered or accepted shadow job exists per employer. Offer identity uses the existing unique espionage sequence; reserve slot `2` for this subtype only. The briefing names the employer, courier, destination system and station-lane rendezvous, 150–400-unit observation band, 30 seconds of accumulated observation, acceptance-relative deadline, filing station, and exact basic quote. It explicitly says docking does not gather this report and that crowding within 150 units attracts attention.

Acceptance creates a dedicated, ordinary-looking freighter record in the posted rival destination system, on a local station-lane route outside docking traffic. Its public name includes a short unique job suffix. The briefing gives a fixed, reachable rendezvous relative to the station; the target appears through normal nearby targeting. No remote live coordinates are published. The pilot travels to that system, approaches its station-lane rendezvous, finds the name with existing target selection, selects it, follows at the stated range, and uses ordinary steering/throttle/match-speed. Thirty valid seconds produce: **“Basic report acquired. Return to <employer station> for <accepted quote> UU.”** The report can be filed immediately; there is no deep-pursuit prompt in this slice.

The target is not invulnerable and unrelated ships cannot substitute for it. Use the existing freighter movement/class, with a mission-local cruise cap no faster than the starter light hull's sustainable speed. Its two-way local route remains discoverable until the job ends. Provisional route construction in the destination system: station-to-primary-gate direction, rendezvous 900 units from station, second waypoint 600 units farther along that direction, with the existing collision/clearance geometry used to reject obstructed positions. If a safe route cannot be constructed, omit the offer rather than create an unreachable job. Validate these distances in actual starter flight before shipping. Limit creation to one record per accepted shadow job and to existing job limits; normal live-traffic caps still apply. It carries no added mission cargo or bounty. Existing collision, piracy and legal consequences of attacking an ordinary trader continue; mission failure must not apply a second standing penalty. If the destination bank is not materialized, create the record exactly once when that system loads, using the accepted ID and deterministic route; do not advance observation or manufacture an offscreen hull on acceptance.

## Observation, warning, and withdrawal

All numbers here are initial playtest values, not measured balance conclusions. Keep tuning in `src/game/state.js`.

Valid observation requires all of: accepted job before deadline; player alive, undocked, and outside berth hold; the exact bound courier alive and instantiated in the same system; courier selected; distance 150–400 inclusive; clear geometric line of sight. Accumulate simulation seconds only while all hold. Losing selection, range, or sight pauses accumulated seconds; it never grants progress or resets earned seconds. Pausing the simulation advances nothing. Pane toggles do not reset any timer.

For this first mission, clear sight means the segment between player and courier is not blocked by an active asteroid sphere or the station's solid collision cylinder. Reuse the pure sphere intersection math (`src/game/ap-path.js:76–105`) and station collision shape (`src/systems/collision.js:345–456`) in the new module. Those are the complete obstruction classes for this slice; planet/sun, gate artwork, ships and pods are not tested. The authored route must stay outside planetary/gate geometry, so excluded distant artwork does not create an intended observation-through-body route. Do not invent a full stealth sensor model, lighting test, camera/ship-facing cone, or scanner check. Implement one bounded geometric predicate shared by progress and suspicion; tests pin each supported blocker. Both observers can plausibly see each other over this segment.

Suspicion is mission-local and evaluated independently of selection or an open pane. While the mission is active and the player is undocked, clear sight inside 150 units increases suspicion at 10 points/second. At all other distances/blocked sight it decays at 5 points/second. Clamp to 0–100. No suspicion is generated from docking/berth hold, first acquisition at safe range, ordinary nearby legal traffic, or an unrelated ship. This is a proximity warning, not a claim that the courier can detect a player's target-lock setting.

At 40 points the courier sends one explicit warning and latches `warned`: **“You're too close. Give me room. Open to 150 units or break sight.”** Display the same instruction persistently in mission status. Warning grace is eight cumulative seconds of further dangerous proximity *after* that warning, recorded in `warningSeconds`; safe time does not consume grace. Exposure requires BOTH suspicion 100 AND all eight warned-danger seconds consumed. Split a large tick at threshold crossings so one delayed frame cannot skip delivery of the warning and its full grace. Once warned, the job retains that history; a later close approach still displays the warning and remaining grace. Suspicions at 0–39 are “Clear” before any warning and “Cooling / warned before” afterwards; 40–99 are “Warned”; 100 with unused grace is “Final warning.” Numerical suspicion need not become a new gauge.

Opening range or breaking sight immediately stops suspicion accumulation and shows **“Withdrawing — attention falling.”** Observation resumes if selected contact is again inside the safe band with clear sight. Selection/pane/reload/reacquisition never resets suspicion or replenishes grace. Decay runs only on active, undocked simulation ticks in the courier's system; docking or leaving the system freezes suspicion and grace, a conservative rule that avoids inventing unseen/offline decay. Returning continues from those saved values. All warnings include the courier's public name in the text itself: the existing HUD comm display must not rely solely on an event's sender field.

Exposure before report acquisition terminates the assignment with no payment: **“Courier identified the tail. Assignment lost; withdraw.”** The courier takes its existing flee behavior; no new police spawn, attack order, wanted state, faction standing penalty, or global hostility is added by mission exposure. Ordinary combat and law reactions remain normal if the player attacks. Thus there is a real consequence and a safe retreat, without forcing combat onto a starter hull. If exposure and basic completion would occur in the same simulation interval, evaluate exposure first; observation at safe distance cannot itself trigger exposure.

Acquiring the basic report ends observation and mission suspicion updates. The stored report cannot be revoked by subsequent courier loss or proximity. There is no optional intelligence to forfeit in #237. #238 must explicitly design any later re-entry into risk; no premium or deep fields are introduced now.

## Explicit JSON and interface additions proposed for approval

Retain `kind: 'espionage'`, existing unique `id`, `originSystem`, `title`, `detail`, `reward`, accepted `payQuoted`, deadline, and job `state`. `need` remains exactly 1 and `progress` remains exactly 0 or 1. Retain the existing rival `destSystem` contract. For the new subtype only, slot is 2; do not relax old espionage validation. Quote uses the current introductory base-pay calculation provisionally, displayed/frozen on offer and copied at acceptance; do not assert that it is balanced.

| Field | Type / default | Bounds and meaning |
| --- | --- | --- |
| `mission` | string; absent for all old jobs | Exactly `courier-shadow` for this subtype; unknown values fail validation rather than becoming introductory jobs. |
| `recordId` | string; assigned on offer | Reuse existing field with subtype-specific format `courier-<full job id>`; max 96 characters; must match this job exactly. No broadening of hunt/war record-ID validation. |
| `target` | string; generated on offer | Reuse existing field for public courier name, 1–80 characters, normalized text. |
| `shadow` | plain object; required on subtype | Only the five fields below; no live objects, vectors, references, or arbitrary keys. |
| `shadow.v` | integer, 1 | Exactly 1. |
| `shadow.observedSeconds` | finite number, 0 | 0–30, accumulated valid observation. |
| `shadow.suspicion` | finite number, 0 | 0–100. |
| `shadow.warned` | boolean, false | Irreversible warning history within this assignment/snapshot. |
| `shadow.warningSeconds` | finite number, 0 | 0–8, cumulative dangerous time after warning. |

The existing persisted record bank holds the dedicated courier's normal record fields, route and position/progress. Add no mission flag to unrelated record shapes: derive mission ownership from the job's exact `recordId`. Add a narrow record-ID validation path for this namespace wherever the existing save/restore path requires one. The courier's destination-system faction remains ordinary; special behavior comes only from exact active-job ownership.

Malformed new subtype payloads cannot yield an accepted payable introductory job. Reject invalid enum/types, non-finite values, cross-job IDs, inconsistent progress/seconds, and impossible warning combinations; safe finite overshoot produced by time integration may be clamped before serialization. An old save lacking `mission` loads exactly as before. Do not infer the subtype from display text. No new top-level job state, event name, key, equipment SKU, gauge, or currency is proposed. Use existing notification/comms and job terminal pathways; `src/core/ctx.js`'s frozen event vocabulary stays unchanged.

Add a read-only `shadow` object to the new subtype's existing `observe().jobs` row: `phase` (`seeking`, `observing`, `paused`, `basic-ready`, `ended`), `observedSeconds`, `requiredSeconds`, `risk` (`clear`, `cooling`, `warned`, `final-warning`), `warningGraceRemaining`, `contactReason` (`not-selected`, `out-of-range`, `occluded`, `target-unavailable`, `docked`, `wrong-system`, or `observing`), and `instruction`. These are projections of the same evaluator used for the Jobs card and existing HUD status/notifications, not a second set of rules. A basic-ready row retains #235's filing text and `payAt` behavior. `ended` is only emitted where existing APIs already expose terminal rows. Never publish the hidden record position, occluder identity, offscreen health, or hidden NPC intent. `target-unavailable` means unavailable contact, not an omniscient death diagnosis.

The API uses existing accept/abandon, target-selection, helm, match-speed, navigation, and docking actions. No dedicated follow, scan, teleport, reveal, or completion action is added. Dynamic names/copy use text-safe DOM APIs. The agent bridge remains loopback-only and action validation unchanged.

For offered rows, the new read-only `shadow` projection contains only `targetName`, `targetSystem`, `rendezvous` (public station-relative description), `minRange`, `maxRange`, and `requiredSeconds`. Accepted rows include those same fields plus the active fields above and `currentTargetId`: the exact existing selectable live-target ID when the courier is detectable within normal targeting range, otherwise `null`. The UI uses the same public name; the API can select that exact detected ID without fuzzy-name matching. Internal `recordId` is not a remote navigation handle and is not exposed as live-target knowledge. No offer reports live risk or progress before acceptance.

## Lifecycle and settlement

| Situation | Required result |
| --- | --- |
| Target briefly out of range, hidden, unselected, or mesh retired | Pause collection; preserve seconds and risk. Restore the same record when traffic can show it; do not replace by nearest ship. |
| Courier reaches a local waypoint or docks | Its bounded route continues after normal dwell; no collection while docked/unavailable. Never collect by player docking. |
| Courier destroyed, captured, becomes derelict, actually jumps, or record permanently missing | Before report: fail promptly, no payment or automatic faction spy penalty. After report: preserve acquired report. Communicate generic loss of assignment/contact unless the event was observable; never strand the job. |
| Player changes system | Collection/risk freeze, deadline still uses world time. Courier remains in its own bank; return can reacquire the same record. |
| Ordinary traffic migration/offline advance | Skip migration and offline route movement only for this mission-owned active courier. Do not alter general trader routes or unrelated hostility. Do not refresh its route or identity on reload. |
| Deadline | Acceptance sets `world.time + 900` seconds provisionally. At `time >= deadline`, fail even with acquired report; briefing states filing must precede deadline. Check expiry before settlement. |
| Abandonment | Existing supported Jobs-desk abandonment path and its disclosed employer standing cost; no additional exposure penalty. Release courier ownership once. |
| Death / recovery | Restore mission, record bank, clock and credits together from existing recovery snapshot. No separate cross-save memory. Earned progress after that snapshot may be lost just as other work is. |
| Save/reload | Preserve exact ID, route, seconds, warning history/grace, acquired state, quote and deadline. Rebind once on same-system restore; no duplicate hull or offer reset. |
| Return to employer | Only accepted, acquired, unexpired job at its own `originSystem` employer station pays `payQuoted`. Mark terminal before reward effects; subsequent ticks/reload of the resulting save cannot pay again. Other employers never settle it. |
| Job terminal / paid / expired | Release mission route/migration overrides; retire or release the dedicated courier through normal traffic cleanup, without killing or modifying unrelated records. No new active job reuses its record ID. |

Multiple accepted shadow jobs from different employers remain distinct by full job/record ID and bank; no completion, warning, or reward is shared. Reloading an older coherent save legitimately restores that earlier game history; duplicate-payment tests concern repeated settlement in one restored history, not a new anti-save-scumming subsystem.

## Bounded build and evidence handoff

Sequence implementation because station/save/world ownership overlaps. First add a focused pure evaluator and tuning, then exact courier lifecycle and persistence, then offer/settlement integration and shared UI/API projection. Proposed write set: new `src/game/courier-shadow.js`; `src/game/state.js`, `src/game/world.js`, `src/game/traffic.js`, `src/game/save.js`, `src/systems/npc.js`, `src/systems/station.js`, `src/game/agent-observe.js`, and narrowly `src/systems/hud.js` for existing status text. Use current update ownership/order; no incidental `src/main.js` initialization reorder. Add focused `scripts/issue-236-237-courier-shadow-test.mjs`, register it in the existing boot/test entry as appropriate, and update this document, backlog, and relevant wishlist status only when outcomes actually complete. Broader source changes require a explained scope adjustment before implementation.

Acceptance evidence must include:

1. Focused pins for exact identity, safe observation, inclusive range edges, each LOS blocker, loss/reacquisition, dock-only negative, first-contact negative, warning-before-exposure across large ticks, grace persistence, decay/withdrawal, and unrelated traffic/hostility unchanged.
2. Save round trips including warning mid-grace, basic-ready, malformed subtype fields, old introductory jobs, same-system restore, death snapshot, system transition, record loss/destruction/capture/derelict/jump, traffic retirement and deadline. No duplicate live courier or indefinite accepted orphan.
3. Frozen offer/accepted quote, wrong-employer negative, simultaneous jobs, expiry-before-payment, abandonment, repeated ticks/notifications/restore and exactly-once settlement. Existing introductory espionage and #235 status regressions remain green.
4. `npm run build`, unchanged `npm run test:boot`, and relevant focused tests. Independent security review checks save validation, text-safe copy, and unchanged agent authorization; independent regression review names the exact commit.
5. Natural live-browser starter-hull run: accept → undock → find by name → select → follow using normal controls → acquire → return/file. No state injection in the success run. Check console errors and compare visible status with public API. Also naturally lose/reacquire the courier, withdraw after warning, reload mid-warning, and intentionally persist to exposure, then escape without forced new combat. Record durations, handling difficulty and observed failure reasons; adjust provisional numbers from evidence.
6. Repeat a short career sequence mixing introductory spy jobs, the new assignment, and ordinary traffic/travel before expanding mission families. Docking reliability is an existing separate concern (#234); record a blocked arrival honestly rather than bypass safety or claim a completed natural run.

No merge/deployment is authorized by this design. Before any deployment retain the reviewed exact commit and previous artifact; rollback reverts the feature commit and restores a compatible pre-feature save backup if needed (older readers may discard the new subtype). Follow `docs/LocalCheckoutSync.md` for a later authorized post-merge handoff.

**Approval requested after review:** authorize the `courier-shadow` subtype, rival-destination slot-2 offer, named JSON fields and namespace, mission-owned courier lifecycle guards, read-only API projection, provisional tuning and bounded write set described here for #236/#237. Optional deep intelligence (#238), new events/keys/gauges/SKUs and global stealth/reputation changes remain outside that approval.
