# Wave 130 TGT-07 combat cycle notes

**Verdict:** leftover **REAL**. Name: **KeyT hostiles-first then range** while a hostile is in the 600 u envelope. Named serial: **PR1**. Not CONSUME. Named serial is **not** none. One law: **(a)** not **(b)**.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `claude/agent-claude` → `proceed_unmodeled` (`r-mta68f6g-70a87f6f`). No binding workflow. Earlier `codex/agent-codex` calls false-bound `codex/workflow-drive-artifact-publishing` (terms `artifact`/`doc`/`drive`). That stack is Google Drive publish. This wave is **local repo markdown** under `docs/` and `out/w130/tgtcycle/`. Did **not** call Drive. Did **not** `graph_approve` / `graph_propose`. External-share gate unused. Owner write-set is local files.
- Census live `src/systems/controls.js` `cycleTarget` (**114–142**), KeyT pulse (**324–325**, **424**, **457**), help (**406**), KeyV `tryReticleLock` (**258–274**), TRACKED (**46–53**).
- Census `src/core/ctx.js` **88** “cycle nearest hostiles” vs d2-only code.
- Census `src/systems/npc.js` `ai.intent` (**247**, **1696**, **2203**), `flags.combat` (**2680–2684**), `mayHuntPlayer` (**1256–1264**), `lastAttackerOf` (**1220–1228**).
- Census HUD contacts hostile + sort (`hud.js` **1734–1751**), Q-ship cover (`hud.js` **127–129**, **2417**).
- Census TGT-03 Incoming (`npc-fire-toast.js` **8–64**); `playerHit` omits shooter (`combat.js` **1797**).
- Census Agent `agent-api.js` **129–150** / observe lock **306** — no `act target`.
- Census `save.js` **1025–1028** `ai.hostile` — **not** the cycle bit.
- Cite TGT-03 / TGT-05 / TGT-06 CONSUME — do not reopen PPI or Incoming gauge. This inbox item is a **new** hole after TGT-06.
- Code wins over `ctx.js` comment and over TGT-03 “attacker warnings” as selection.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist.

## Why REAL (not CONSUME)

Named hole still live:

- `cycleTarget` sorts `d2` only (`controls.js` **139**).
- No combat / `ai.intent` gate on KeyT.
- No dedicated attacker-lock key (KeyV is reticle; Incoming toast does not select).
- Playtest (hauler → freighter → ace) matches nearest-then-wrap.

HUD contacts **do** rank hostiles. TGT-03 **does** warn. TGT-06 **did** CONSUME remaining instruments. None of those is KeyT selection priority. Do **not** CONSUME on toast + contacts alone.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Law | (a) hostiles-first then range on KeyT |
| Hostile | `ai.intent === true` |
| Gate | ≥1 in-envelope (600 u) hostile cand |
| Else | live d2-only |
| Wrap | live; not skip-to-attacker |
| Rocks | group 3; never hostile |
| Kinds | KeyV / TGT-05 |
| New key | **no** in PR1 |
| Incoming | cite TGT-03; do not steal |
| Persist | none |

## Later write-set (do not edit now)

- Prefer `src/systems/controls.js` `cycleTarget` sort.
- Optional: KeyT help string; `ctx.js` **88** comment.
- Do **not** claim `hud.js` layout / contacts / toast.
- Do **not** claim `npc.js` / `combat.js` / `agent-api.js`.
- Do **not** claim NAV-10 / MSN-04 siblings.

## Coupling (do not steal)

- TGT-03 Incoming fire. / dart. / contacts / edge-arrow.
- TGT-05 KeyV + kinds.
- TGT-06 remaining CONSUME (PPI / gauge omit).
- HUD-02 Q-ship cover class.
- HUD-06 home marker. HUD-07 deconfliction.
- Wave 130 NAV-10 dock approach. Wave 130 MSN-04 job dedup.
- Agent API observe/act / cheat lock.
- AI-05 pirate interest.

## Graph

`resolution_id` `r-mta68f6g-70a87f6f`. Decision `proceed_unmodeled` (claude agent). Codex-agent Drive publish bind is a **false bind** for this local leftover pack. Local write-set completed as the owner assigned.

## Reviews

Security HIGH (Agent cheat lock, persist auto-lock, Q-ship pierce, throw/proto, pause) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after one-law, intent-not-role, envelope-vs-bubble, no toast lock, tight write-set. UI Blocker/Major **resolved as later sort** (live KeyT stays nearest-first until PR1). Open MEDIUM/LOW: wrap-from-friendly-lock (law (b) if snapped), sort-tie stability (live already unstable), optional help override.

## Not started

Vite, Chrome, Playwright, CDP. No ports claimed. No `out/w130/tgtcycle/verify/**`.
