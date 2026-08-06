# Project Brief — Untitled 3D Space Sim (working name: "3dSpaceSim")

> **Status:** Pre-production. Decisions below were made 2026-07-13 during initial stack/vision discussion.
> **Purpose:** Input document for the BMAD game-dev workflow (feeds the Game Design Document and Architecture phases). This is the source of truth for vision and locked technical decisions.

## 1. Vision

A single-player 3D space sim in the spirit of **Freelancer** and **Elite Dangerous**: the player is dropped into a rich, active, simulated galaxy and chooses their own role in it. The world does not wait for the player — factions war, traders haul goods, pirates raid shipping lanes, and prices move whether the player is watching or not.

**Elevator pitch:** *Freelancer's fun-first flight and open-role gameplay, meeting a living simulated world — including one faction whose ships are grown, not built.*

## 2. Design Pillars

These are the tests every feature must pass, in priority order:

1. **Fun over realism.** Arcade flight, readable combat, snappy game feel. No Newtonian flight model, no simulation for simulation's sake in the player-facing layer.
2. **Graphics are critical to success.** Visual quality is a top-priority differentiator, not a polish phase. Every scene should look striking: bloom-heavy emissives, volumetric nebulae, beautiful ships.
3. **A living world.** NPCs pursue their own goals; the economy and faction conflicts run as a real simulation. The player joins a world already in motion.
4. **Play your own role.** No forced main path. Viable, mechanically distinct careers: Trader, Pirate, Miner, Bounty Hunter, or direct Faction Service.

## 3. Core Gameplay

### Player roles (all must be viable playstyles)
| Role | Core loop | Key systems needed |
|---|---|---|
| Trader | Buy low, haul, sell high, dodge pirates | Dynamic commodity market, cargo, trade routes |
| Pirate | Interdict traffic, loot, evade bounty hunters | NPC traffic sim, cargo scanning/dropping, reputation/heat |
| Miner | Prospect, extract, refine, sell | Asteroid fields, mining mechanics, commodity market |
| Bounty Hunter | Take contracts, track targets, fight | Mission generation, bounty board, combat AI |
| Faction Service | Run missions for a faction, rise in rank | Faction reputation/ranks, mission generation, faction war state |

### Flight model — DECIDED
**Arcade, Freelancer-style.** Mouse-aimed flight, artificial drag (cut throttle → ship slows and stops), speed cap, strafe thrusters, possible drift/slide mechanic for dogfighting flair. Tuned by feel, not physics accuracy.

### Factions
Multiple factions with territory, ideology, economies, and shifting relationships (war/peace/trade). Player reputation is tracked per faction and gates access, prices, missions, and hostility.

**Signature faction — the bio-ship faction (DECIDED):** One faction's ships are **biological — grown, not built.**
- *Visual identity:* hulls that breathe/pulse (vertex-displacement shaders), translucent flesh/chitin materials with light glow-through, bioluminescent veins instead of running lights, damage that looks like wounds and visibly heals, organic engine effects (spore trails, undulating fins).
- *Mechanical identity:* ships regenerate hull instead of buying repairs; are **fed**, not refueled; upgrades are **grown or grafted** (organs harvested from creatures/salvage) rather than purchased; ships may mature over play time. Joining this faction should feel like playing a different game.
- *Production note:* organic models are hard to buy off the shelf — expect custom modeling and/or procedural generation plus heavy shader work for this faction. Human factions can kitbash from asset packs.

## 4. Technical Stack — DECIDED

| Decision | Choice | Rationale |
|---|---|---|
| Engine | **Unity 6 (LTS)** | C# throughout; text-based (YAML) scenes are AI-tooling-friendly; best asset-store ecosystem for a small team where graphics are critical |
| Render pipeline | **HDRP** | Volumetric fog for nebulae, physically-based lighting, strong post-processing (bloom, lens flares, reflections) — the space-scene look |
| Language | **C#** | Engine scripting *and* the engine-independent simulation core |
| Art sourcing | Unity Asset Store for human factions (ships, VFX, space environment kits, e.g. Space Graphics Toolkit); procedural/custom + shaders for bio-faction | Asset store is the "art team" for a small studio |
| Multiplayer | **None — single-player first** | Multiplayer roughly triples complexity; architecture keeps the door open later |

### Rejected alternatives (and why — do not relitigate without new information)
- **Godot 4 + C#:** Original recommendation; rejected when graphics became a top success criterion — lower visual ceiling and near-empty asset ecosystem.
- **Unreal Engine:** Highest graphics ceiling but poorest AI-collaboration fit (C++ compile times, Blueprints, binary assets); its key advantages (Nanite, terrain, MetaHumans) are largely irrelevant in space.
- **Bevy (Rust):** Great ECS fit for simulation, but the developer is not a Rust developer and the 3D/UI ecosystem is immature.

## 5. Architecture — DECIDED

Two-layer split; this is the load-bearing architectural decision:

```
┌───────────────────────────────────────┐
│  Unity presentation layer (thin)      │  rendering, input, audio, UI, VFX
├───────────────────────────────────────┤
│  Simulation core (pure C# library)    │  factions, economy, markets,
│  — no Unity dependencies —            │  NPC agents, reputation,
│                                       │  mission generation, war state
└───────────────────────────────────────┘
```

- The living world runs as an **abstract simulation**: off-screen NPCs are lightweight records ("trader departs A with 40t ore, arrives B in 6h"), instantiated as real 3D ships only near the player (Elite/X4 pattern).
- The simulation core has **zero Unity dependencies** so it can be developed and unit-tested headlessly — economy and faction logic never require play-testing to verify.
- **Floating origin from day one.** Space games break 32-bit float precision quickly; periodically recenter the world on the player. Easy to build early, painful to retrofit. (This is a precision requirement, independent of the arcade flight decision.)

## 6. Scope & Milestones

**Milestone 1 — Vertical slice:** one star system; flyable ship with the arcade flight model; a couple of stations with docking; minimal working commodity market. Everything else grows from this.

Deliberately deferred: multiplayer, additional star systems, full faction war sim, bio-ship faction content (design it early, build it after core loop proves out).

## 7. Open Questions (for the BMAD design phase)

- Game title, tone, and narrative framing (silent sandbox vs. Freelancer-style story campaign?)
- Number and identity of factions (how many human factions alongside the bio faction?)
- Combat feel specifics: weapon types, shields/hull model, damage systems
- Progression economics: ship purchase tiers vs. upgrade trees; how bio-ship progression (growth/feeding/grafting) maps against credit-based progression for parity
- Galaxy structure: hand-authored systems (Freelancer) vs. procedural (Elite) vs. hybrid
- Target platform(s) and minimum spec (HDRP implies reasonably modern PC hardware)
