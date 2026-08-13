# Game Spaceship Design — Readability, Manufacturer Identity, and Modular Kits

This file surveys spaceship visual design across major 3D space games, focusing on how manufacturers and factions encode distinct visual identities, how class and role remain legible at gameplay distance, and how the best games achieve this through procedural or kitbash part libraries. The primary question for RIMWARD is: what can we steal — as principle, not as shape — from games that already solved the "10 factions × 6 classes" readability problem? Sources were retrieved and searched between 2026-08-12 and 2026-08-13.

Accessed: 2026-08-12

---

## Source catalog

| # | Subject / work | Origin (artist, studio, year) | URL | Why it matters (design lever) |
|---|---|---|---|---|
| 1 | Faulcon DeLacy manufacturer page | Frontier Developments, 2014–present | https://elite-dangerous.fandom.com/wiki/Faulcon_DeLacy | Defines "modular civilian standard" — ship reads as kit of replaceable panels; no single heroic form. Core model for Independent/Freehold analog. |
| 2 | Zorgon Peterson manufacturer page | Frontier Developments, 2014–present | https://elite-dangerous.fandom.com/wiki/Zorgon_Peterson | "Finesse follows function" slogan. Low, swept, curvilinear shells over performance internals — highest contrast with Lakon utilitarian logic in same franchise. |
| 3 | Lakon Spaceways manufacturer page | Frontier Developments, 2014–present | https://elite-dangerous.fandom.com/wiki/Lakon_Spaceways | Cargo-first design: volume defined before aesthetics. Cockpit perched above main body for work-vehicle sightlines. Direct model for freighter design logic. |
| 4 | Core Dynamics manufacturer page | Frontier Developments, 2014–present | https://elite-dangerous.fandom.com/wiki/Core_Dynamics | Federal military contract aesthetic: overlapping armor slabs, weapon housings integrated as system not ornament, cockpit recessed for survivability. |
| 5 | EVE Online — racial ship design discussion | davedamian.wordpress.com, 2011 | https://davedamian.wordpress.com/2011/05/10/eve-online-ship-designs/ | First-person comparison of Amarr ornate-gold, Caldari modular-grey, Gallente glossy-tech, Minmatar kinetic-scrap across all size classes. |
| 6 | EVE Online ship design — forum analysis (ship semiotics, ergonomics, logic) | Player-authored, EVE forums, 2019 | https://forums.eveonline.com/t/ship-design-general-design/270558 | Design doctrine per race: Amarr ships make theological sense structurally; Minmatar show honest improvisation. Critical point: design must survive critique without lore text. |
| 7 | EVE Online — Spaceships of EVE (Codex Gamicus) | Fandom community wiki, ongoing | https://gamicus.fandom.com/wiki/Spaceships_of_EVE_Online | Class catalogue showing how same hull language scales from frigate to titan — key for RIMWARD 6-class coherence within one faction. |
| 8 | Triglavian Technology — Ships & Weapons (official CCP article) | CCP Games, 2018 | https://www.eveonline.com/de/news/view/triglavian-technology-ships-and-weapons | Canon source: Damavik / Vedmak / Leshak trinary composition, singularity-core hull architecture, Entropic Disintegrator integration. Shows non-human faction with internally coherent non-human structure rules. |
| 9 | Homeworld 2 Q&A — Relic designer on Hiigaran vs. Vaygr | GameSpot, 2003 | https://www.gamespot.com/articles/homeworld-2-qanda/1100-2911461/ | Primary source: Vaygr explicitly designed as predominantly vertical vs. Hiigaran flat/horizontal fleet. First-hand faction opposition rule. |
| 10 | "Ships and Trucks" — Homeworld retrospective | Fists of Heaven, 2021 | https://www.fistsofheaven.com/ships-and-trucks-a-retrospective-of-homeworld/ | Tracks how Kushan's industrial chunky modularity shifted to Vaygr in HW2 while Hiigaran became more unified/sleek — shows design drift across sequels. |
| 11 | Homeworld 2 — Vaygr capital ship page | Well of Souls / Homeworld database, 2004 | https://well-of-souls.com/homeworld/hw2/v_cap_b.htm | Vaygr ships documented as more specialized, weapon-forward, vertically stacked. Useful for "predatory assembled-weapon-fleet" reference. |
| 12 | Star Citizen — ship manufacturers wiki | Roberts Space Industries / CIG, ongoing | https://starcitizen.fandom.com/wiki/Ship_manufacturers | Master list of manufacturer identities: Aegis (military angular utilitarian), Anvil (robust straight-edge VTOL), Origin (luxury smooth-refined), Drake (industrial heft). |
| 13 | Star Citizen — manufacturer aesthetic community thread | Reddit r/starcitizen, 2025 | https://www.reddit.com/r/starcitizen/comments/1tpq75k/how_would_you_describe_the_aesthetic_of_each/ | Player consensus on manufacturer reads: Drake = "active construction zone feel," Origin = "hotel lobby in space," MISC = "aerospace-practical." Confirms cross-player readability. |
| 14 | Star Citizen — Drake Interplanetary DefenseCon video | Cloud Imperium Games, 2026 | https://www.youtube.com/watch?v=iKwmsXVkl0I | Drake style guide statement on-record: shape language makes you "feel like you're in a dangerous environment / active construction zone." Direct modeler intent. |
| 15 | Star Citizen — Xi'an and MISC ships in development | CIG ship-pipeline video, 2024 | https://www.youtube.com/watch?v=PKidi-z8_aU | Shows kit-reuse pipeline: Anvil Liberator repurposes Asgard and Paladin kit pieces. Proof that manufacturer kit libraries reduce new-content cost. |
| 16 | No Man's Sky — procedural generation wiki | Hello Games / community, ongoing | https://nomanssky.fandom.com/wiki/Procedural_generation | Explains algorithmic ship generation: seeds select from part pools by archetype (fighter, explorer, hauler, exotic), not free-form. Parts stay archetype-appropriate. |
| 17 | No Man's Sky — Starship types and parts | NMS Miraheze wiki, ongoing | https://nomanssky.miraheze.org/wiki/Starship | Documents ship archetypes and the component slots (engine, wing, cockpit, accessory) that define class read at a glance — direct model for RIMWARD class-part system. |
| 18 | Starfield — ship-building tips & tricks | Bethesda Support, 2023 | https://help.bethesda.net/app/answers/detail/a_id/60959/~/ship-building---tips-%2526-tricks---starfield | Node-based modular snapping: anchor points on each module, parts turn red/green on validity. 13 functional categories; visual freedom within structural constraint. |
| 19 | Starfield — elements of a ship | Bethesda Support, 2023 | https://help.bethesda.net/app/answers/detail/a_id/61674/~/elements-of-a-ship---starfield | Canonical module categories: cockpit, hab, engine, reactor, grav-drive, fuel, cargo, landing bay, docker, shield, weapon, structural/cowling. Maps to RIMWARD functional anatomy. |
| 20 | X4: Foundations — Argon Federation faction page | Egosoft / community wiki, ongoing | https://wiki.egosoft.com/X4%20Foundations%20Wiki/Manual%20and%20Guides/Objects%20in%20the%20Game%20Universe/Factions/Argon%20Federation/ | Argon = balanced human industrial-military. Legible cockpit, clear forward orientation, visible machinery. Baseline "generic credible spaceship" calibration point. |
| 21 | X4: Foundations — Zyarth Patriarchy (Split) faction page | Egosoft / community wiki, ongoing | https://wiki.egosoft.com/X4%20Foundations%20Wiki/Manual%20and%20Guides/Objects%20in%20the%20Game%20Universe/Factions/Zyarth%20Patriarchy/ | Split ships: long noses, swept wings, claw-like projections, aggressively forward-thrusting profiles. Fast combat variants emphasize predator-first identity. |
| 22 | X4: Foundations — Godrealm of the Paranid | Egosoft / community wiki, ongoing | https://wiki.egosoft.com/X4%20Foundations%20Wiki/Manual%20and%20Guides/Objects%20in%20the%20Game%20Universe/Factions/Godrealm%20of%20the%20Paranid/ | Paranid = sacred geometry: broad triangular/pyramidal bodies, strong central axes, monumental engine structures. Religious mathematical identity embedded in ship morphology. |
| 23 | X4: Foundations — Teladi Company faction page | Egosoft / community wiki, ongoing | https://wiki.egosoft.com/X4%20Foundations%20Wiki/Manual%20and%20Guides/Objects%20in%20the%20Game%20Universe/Factions/Teladi%20Company/ | Teladi = commercial maximizers: bulky cores, boxy cargo volumes, radial or irregular layouts, externally attached components. Profit determines shape. |
| 24 | X4: Foundations — Kingdom End / Boron DLC | Egosoft, 2023 | https://wiki.egosoft.com/X4%20Foundations%20Wiki/Downloadable%20Content/04%20-%20Kingdom%20End/ | Boron: smooth curves, fins, shells, animated wave-like hull elements. Aquatic life-form cultural assumptions embedded in aerospace form. Non-mechanical silhouette at same tech level as Argon. |
| 25 | Freelancer — ship and faction design | Digital Anvil / Microsoft, 2003 | https://en.wikipedia.org/wiki/Freelancer_(video_game) | Five human houses each with distinct hull architecture (e.g. Bretonian angular naval, Rheinland industrial wedges, Kusari swept organic). Early example of house-identity modular kit at affordable poly count. |
| 26 | Everspace 2 — playable ship classes | ROCKFISH Games, 2021–2023 | https://everspace.fandom.com/wiki/Ships_(ES2) | Light / medium / heavy class subtypes with randomized wing, body, engine type per ship — procedural kit in genre-appropriate three-class hierarchy. |
| 27 | FTL: Faster Than Light — review (systemic readability) | GameSpot, 2012 | https://www.gamespot.com/reviews/ftl-faster-than-light-review/1900-6396645/ | Blueprint-level ship readability: modular rooms at fixed positions, clear subsystem hierarchy, silhouette communicates crew count and power budget at thumbnail. |
| 28 | Endless Space 2 — Ships: 3D Models wiki page | Amplitude Studios / community, 2017–2021 | https://endless-space-2.fandom.com/wiki/Ships_-_3D_Models | Visual catalogue of faction 3D ships: Sophon (sleek science-first), Vodyani (skeletal energy-frame), United Empire (layered military mass), Riftborn (crystalline geometric). |
| 29 | Endless Space 2 — art dump, Polycount | Amplitude Studios, 2019 | https://polycount.com/discussion/210231/endless-space-2-art-dump | Behind-the-scenes 3D process showing how faction visual language is baked into geo from concept stage — part-level color decisions made pre-UV. |
| 30 | Stellaris artbook — ship set design philosophy | Paradox Interactive, 2016 | https://pdfcoffee.com/stellaris-artbook-3-pdf-free.html | Defines Complexity-to-Roundness matrix for 6 ship sets. Mammalian = blocky-detailed; Avian = smooth-thin; Fungoid = rounded-organic; Molluscoid = smooth-layered; Arthropoid = thick-armored; Reptilian = angular-matte. |
| 31 | Stellaris ship sets — species-culture hull families | Paradox Interactive, 2016– | https://stellaris.paradoxwikis.com/Ships | Ship sets are aesthetic cultures, not engineering rules. Faction identity comes from silhouette assumptions, not detail density. Critical readability principle. |
| 32 | Hardspace: Shipbreaker — Salvage anatomy | Blackbird Interactive, 2022 | https://hardspaceshipbreaker.fandom.com/wiki/Salvage | Enumerates hazard zones: reactor, fuel, electrical, pressurized compartments. Ship anatomy is legible because salvage rules force visible layering: outer shell → skeleton → rooms → machinery. |
| 33 | Hardspace: Shipbreaker — Atlas and Gecko ships | Blackbird Interactive, 2022 | https://hardspaceshipbreaker.fandom.com/wiki/Atlas | Atlas = long-serving industrial workhorse: redundant, rugged, modular. Gecko = large cargo bay dominates external form. Industry-role readable from volume hierarchy. |
| 34 | Halo: Combat Evolved — UNSC vs Covenant design origin | Microsoft / Bungie, 2001 | https://en.wikipedia.org/wiki/Halo%3A_Combat_Evolved | Source confirms intentional opposition: UNSC made blocky/utilitarian, Covenant given smoother exotic silhouettes and energy-based visual cues from day one. |
| 35 | Canon Fodder: Concert of Words — Sangheili ship design patterns | Halo Waypoint / 343 Industries, 2023 | https://www.halowaypoint.com/news/canon-fodder-concert-of-words | Confirms Covenant design-pattern doctrine: ship lineages share configuration template, not free design. Sword of Harmony described as "dart-like resemblance to predator from Sanghelios." |
| 36 | Normandy (Mass Effect) — Wikipedia | Bioware, 2007–2012 | https://en.wikipedia.org/wiki/Normandy_(Mass_Effect) | Normandy blends Turian exoskeletal angularity with human modular hull segments. Shows cross-faction design fusion as character storytelling device. |
| 37 | A Bunker Built for Two — Bungie art direction article | Bungie, 2021 | https://www.bungie.net/7/en/News/article/49021 | Confirms Destiny's visual identity combines graphic-design discipline with concept-art atmosphere: faction identity through geometry + material, not color alone. |
| 38 | Warframe Railjack — Digital Extremes support page | Digital Extremes, 2021 | https://support.warframe.com/hc/en-us/articles/38820115630093-Railjack | Railjack: customizable ship interior, crew stations, modular combat systems. Faction design philosophy applied across weapons, characters, environments, and ships as unified system. |
| 39 | Designing Void Crew — Nordic Game Jam 2024 talk | Hutlihut Games, 2024 | https://voidcrew.wiki.gg/wiki/Designing_of_Void_Crew_-_Talk_at_Nordic_Game_Jam_2024 | Designers cite FTL (manage-a-spaceship) and Sea of Thieves (shared-ship crew). Modular interior with repairable systems makes hull anatomy legible from inside as well as outside. |
| 40 | Rebel Galaxy on PS4 — PlayStation Blog | Double Damage Games, 2014 | https://blog.playstation.com/2014/10/17/rebel-galaxy-on-ps4-a-backwater-universe | Developers describe "scoundrel simulator" fantasy and saturated color environments for awe. Capital ship scale cues from repeated broadside turret clusters. |

---

## Design language analysis

### 2.1 Manufacturer/faction identity systems

Elite Dangerous is the most disciplined example of manufacturer visual identity in games. Frontier encodes each manufacturer in silhouette first, then cockpit position, then panel scale, then wear pattern. A Faulcon DeLacy ship is identifiable without paint because its hull reads as a kit of replaceable wedge panels on a central structural grid. A Lakon ship is identifiable because its cargo volume is visibly the largest element — crew and engines grow from the load, not the other way around. Core Dynamics reads as armored even when unarmed because armor slab proportions exceed any logical protection-to-mass need. Zorgon Peterson reads as fast because its upper silhouette is a single unbroken curve from nose to engine bell.

The rule: each manufacturer makes a **different assumption about what a ship primarily is** — a versatile tool, a volume-mover, a weapon, or a performance machine. That assumption determines every proportion decision.

### 2.2 Class readability at gameplay distance

EVE Online manages 5 races × many hull sizes by locking racial silhouette logic and letting class scale emerge from that logic cleanly. An Amarr frigate and an Amarr carrier share: bilateral symmetry, gold panel alignment, warm amber engine glow, and inlaid religious grooves. What changes is volume and weapon coverage, not construction logic. A Minmatar frigate and carrier both use exposed truss spines, mismatched engine pods, and structural patches. Class is read from mass; faction is read from structure.

The Homeworld approach is more radical: Vaygr are always read as vertical and weapon-concentrated; Hiigarans as horizontal and integrated. At any distance, a ship stack that reads taller than wide is Vaygr and one that reads wider than tall is Hiigaran. That binary works because both factions are consistent across every class.

Key distance-readability rules observed:

- **Silhouette orientation** (horizontal vs. vertical, forward-wedge vs. symmetric) must be legible at 20–30 pixels.
- **One dominant mass** per ship reads at max distance; secondary masses read at medium; greebles only at close range.
- **Engine glow position** communicates direction of travel without any shape detail.
- **Cockpit placement** (forward, dorsal, buried, absent) communicates crew intent and class role.

### 2.3 Procedural and modular kit design

No Man's Sky is the most directly applicable example of a **typed procedural part system**. Ships are generated by selecting from part pools constrained by archetype. A fighter archetype pulls from a pool of swept aggressive wings, narrow cockpits, and forward-heavy engine shapes. A hauler archetype pulls from boxy body sections, large cargo pods, and high-ground cockpits. The key is that **each part in the pool is pre-authored to read as its archetype** — procedural variety happens within a curated set, not from unconstrained randomization.

Star Citizen's manufacturer kits work the same way, but for human production. The Anvil Liberator reuses kit pieces from the Asgard and Paladin, reducing new-content cost while maintaining Anvil's visual identity. Each manufacturer has a part library; ships are assembled from that library plus bespoke centerpiece forms.

Starfield's ship builder generalizes this to player control via node-based modular snapping. Functional categories (cockpit, hab, engine, reactor, fuel, cargo, structural) each have multiple manufacturer variants. Players assemble from those variants; the connection-point system prevents invalid assemblies without a rigid grid. The result is that manufacturers remain visually identifiable even in player-built hybrid ships.

FTL formalizes modularity at the simplest level: every ship is a blueprint with named rooms. Reactor, shields, oxygen, weapons, engines, medbay — each room is visually distinct in icon shape. This schematic clarity means subsystem state is readable at a glance. FTL proves that **the spatial layout of ship systems is itself a design language**.

**For RIMWARD modular kit design**, the following part categories are indicated by the corpus:

| Part category | Drives | Faction variation | Class variation |
|---|---|---|---|
| Bow / prow section | First-read role (boarding spike vs. sensor dome vs. blunt ramming face vs. cargo mouth) | Material finish, aggression angle, aperture type | Scale only |
| Core hull / spine | Faction construction logic (modular grid vs. organic growth vs. truss vs. sealed shell) | Panel language, greeble density, seam type | Length ratio to class scale |
| Cockpit / bridge | Crew access visibility, status (embedded = military, exposed dome = civilian science, absent = unmanned) | Shape family, glazing type | Size kept human-scale regardless of hull |
| Engine cluster | Propulsion culture (vectored nacelles vs. fixed bells vs. field emitters vs. wave locomotion) | Faction glow color, cowling design | Count and size scale with class |
| Cargo / payload volume | Mission role: cargo boxes, ore drums, vault cells, sample pods, tractor reels, sail packs | Faction attachment logic | Volume dominates at freighter scale |
| Dorsal / ventral hardware | Role-specific kit: turrets, sensors, docking collars, crane rails, radiator fins, sail spars | Faction-specific ornament density | Present or absent by class grammar |

Each faction needs its own version of each category. Parts within a faction should share panel scale, seam width, and bevel style. Parts across classes should share human-scale anchors (windows, hatches, docking rings stay constant size).

### 2.4 The Stellaris complexity-to-roundness matrix

Paradox's artbook documents the design matrix explicitly: two axes are **complexity/detail** (high ↔ low) and **shape roundness** (angular ↔ smooth). Each ship set occupies a distinct quadrant. Mammalian = angular + complex. Avian = angular + smooth (thin streamlines). Fungoid = rounded + complex (organic detail). Molluscoid = rounded + smooth (layered shells). This matrix prevents faction ship sets from crowding the same perceptual space.

RIMWARD can apply the same matrix. Ferrous Hegemony sits at angular + complex (armor plate density). Gilded Chain sits at smooth + angular (sealed scale shells). Freehold Compact sits at irregular + complex (patchwork detail). Beautiful Ones sit at smooth + rounded (organic flow). Assembly sits at complex + recursive-irregular. Unknowables sit outside the matrix entirely — no hull surface to rate.

### 2.5 Industrial anatomy and visible maintenance logic

Hardspace: Shipbreaker is the definitive source for **ship as layered object**. Salvage rules force the game to make every layer readable: outer nanocarbon shell → aluminum structural skeleton → pressurized rooms → engineering core → propulsion. Because players must identify cut points and hazard zones, the visual design encodes function at every surface. Weld seams, bolt strips, color-coded cable trays, numbered maintenance plates, and corporate inspection stamps are not decoration — they are UI that makes the ship legible to a worker.

The lesson: a ship that appears maintainable is more believable than one that appears designed. Every faction in RIMWARD should show how its ships are serviced. A Lamplighter Guild ship shows handrails, tool carousels, and clamp-arm attachment points. A Freehold Compact ship shows replaced panels, visible winch anchors, and amateur weld patches. A Ferrous Hegemony ship shows standardized service access plates and formal armor removal rails.

### 2.6 Non-human hull logics

EVE's Triglavian ships demonstrate that a faction with completely different construction assumptions still needs **internally consistent rules**. Their trinary composition (three lobes, three emitter nodes, three-fold symmetry from Clade culture), singularity-centered hull architecture, and faceted adaptive shell are all expressions of a single coherent logic. The ships look alien because their spatial organization doesn't follow human naval logic — but every Triglavian ship follows the same alien logic, so the faction is identifiable.

X4: Foundations' Boron faction shows the same principle through aquatic cultural assumptions. Wave-like animated hull elements, shell-like curves, and fin-based orientation all come from a single biological-environment reference. The ships don't look like a fish — they look like technology designed by beings who live in a three-dimensional fluid.

Halo's Covenant design-pattern doctrine (documented at Halo Waypoint) takes this further: individual ships are variations on ancestral templates, not free designs. A newer ship resembles its lineage ancestors in configuration even when built with better materials. This creates in-universe visual continuity across centuries of Covenant shipbuilding.

### 2.7 Color and material as faction signal

Mass Effect's Normandy shows faction fusion through color: the human Systems Alliance blue-white pairs with the Turian angular plate geometry and Quarian modular utility fittings. Each element is identifiable separately; combined they read as "inter-species collaboration." The ship tells a political story through its visual vocabulary.

Warframe's Grineer/Corpus/Orokin distinction shows how material finish carries faction identity when silhouettes overlap. Grineer ships are corroded military hardware — rough metal, exposed bolts, soot. Corpus ships are clean commercial products — smooth composite panels, modular connections, corporate branding. Orokin ships are ornamental and archaic — gold, white, excessively refined. Three factions can have the same bounding box and still read instantly as different because the surface language is completely different.

Destiny 2 (per Bungie's art direction article) confirms the same principle applied at franchise scale: faction identity comes from geometry and material combined, not from color alone. A Cabal ship reads as Cabal because it is architecturally brutal, not because it is brown.

### 2.8 Silhouette opposition as faction grammar

Star Wars — with Squadrons as the sharpest gameplay example — encodes political opposition in silhouette shape: the TIE fighter uses hexagonal wings and a spherical cockpit pod to signal alien inhuman efficiency; the X-wing uses crossed plus-sign wings and a long fuselage to signal human engineering with natural proportions. Both are simple, but they are opposites in every dimension: enclosed pod vs. exposed cockpit, geometric alien vs. organic proportional, pure symmetry vs. slight asymmetry from engine pods. They read at any distance.

The EVE racial matrix works similarly. Gallente = rounded sleek technology-first. Caldari = boxy restrained utilitarian. These are readable opposites even within the same class tier.

### 2.9 Capital-class freighters and location-scale design

Rebel Galaxy (PlayStation Blog design notes) and Hardspace: Shipbreaker both demonstrate that a very large ship must be designed as a **location** as well as a vehicle. Rebel Galaxy achieves this with repeated broadside turret clusters that create scale reference through rhythm. Hardspace achieves it by making the ship's interior a traversable space with doors, corridors, and rooms at human scale.

For RIMWARD freighters: the freighter is readable as "too large for a station" because it has repeated structure at human scale — cargo bay openings sized for a person, windows that stay the same size across the hull, docking collar geometry that matches a small ship's airlock. If none of these fixed-scale elements are present, the ship has no legible size and could be any scale.

### 2.10 Role-specific anatomy for the six RIMWARD classes

Drawing across the corpus, each class has a distinctive anatomy that survives manufacturer variation:

| Class | Anatomy rule (from game corpus) | Distance read |
|---|---|---|
| Light | Dominant cockpit or sensor element; one propulsion unit; minimal secondary mass | "Head with a tail" — cockpit and engine visible at any angle |
| Ace | Cleaner profile than light; engine-to-hull ratio oversized; one signature feature | "Faster than it looks" — high engine coverage, minimal drag volume |
| Cutter | Boarding/interaction hardware visible at bow or midships; heavier than light but nimbler than heavy | "Working tool" — functional jaw or collar visible at front |
| Heavy | Dense central core; weapon placement deliberate and exposed; no long vulnerable projections | "Compact threat" — center of mass clearly armored |
| Frigate | Bridge/command focus; clear primary spine; secondary bays visible | "Has internal logic" — can see where the crew live and work |
| Freighter | Volume dominates propulsion and crew; multiple independently readable zones | "Too large to enter" — repeated elements at human scale create size |

---

## What reads as X at a glance

This section lists the minimum visual cues that make a viewer instantly assign role or mood without reading any label.

**Combat / weapon platform:** Weapons are visible before any other detail. Forward mass is concentrated. Cockpit is protected (embedded or armored). Color is dark. No civilian equipment visible.

**Scout / courier:** Narrow lateral silhouette. Cockpit is prominent relative to overall volume. Engine appears oversized. No cargo volume visible. Fins or sensor vanes replace weapons.

**Freighter / carrier:** Cargo volume is the largest single element. Multiple identically-sized bay doors or docking points. Propulsion is undersized relative to body. Travel direction is the only clear readable axis.

**Boarding / cutter:** A jaw, collar, clamp, spike, or receiving lock is visible at the bow or midships. Reverse thruster clusters are visible (needed to hold position on a target). Cockpit is set back, protected.

**Patrol / enforcement:** Paired sensor cheeks or arrays flank the bow. Marker light positions are visible. Hull shows both rescue gear and weapons. Ship looks overbuilt for its size.

**Industrial / salvage:** Crane, cable reel, or manipulator arm is the most prominent feature. Hull shows wear from repeated contact with other structures. Cargo and tool access dominate over weapons.

**Organic / living:** No flat panel lines. No engine nozzles. Bilateral symmetry comes from anatomy, not construction. Motion is implied by body pose even when stationary.

**Energy entity (no hull):** Stable field boundary is readable as a silhouette. Physical anchor masses (cells, nodes, weights) give the eye a scale reference. Travel direction is implied by field asymmetry, not a nose.

---

## Transferable rules for RIMWARD

Each bullet maps to a faction key or class key from the Design Bible. Rules are phrased as modeling instructions.

- **All factions, all classes:** Give every ship one dominant readable element at 30 px: a forward mass, a prominent engine, a large cargo body, or a distinctive field boundary. Remove detail until this passes.
- **All factions, all classes:** Keep windows, hatches, docking collars, and access doors at the same human-scale module across every faction. Never scale them up to fill a hull.
- **`freighter` class, all factions:** Design the cargo volume first. Add propulsion and crew as secondary elements. Repeat a human-scale reference (window, bay door, clamp point) at least four times to establish scale. (Lakon logic; Rebel Galaxy rhythm rule.)
- **`light` class, all factions:** Make cockpit or sensor aperture the visually dominant element. The ship should feel like a crewed head with a propulsion tail. (Elite Dangerous scout logic.)
- **`cutter` class, all factions:** Place a boarding collar, tractor aperture, grapple arm, or rescue lock visibly at the bow or amidships. The function must read before weapons do. (Hardspace Shipbreaker anatomy rule.)
- **`veridian` faction:** Hexagonal or chamfered module geometry everywhere. Detachable survey pods read as serialized and replaceable — each looks like it could slide out on a rail. Build the sensor head first; hull grows from it.
- **`ferrous` faction:** Start with the prow and the armor budget. Place weapons as formal paired housings, not scattered mounts. Maintain bilateral symmetry as a doctrine signal. (Core Dynamics + UNSC logic.)
- **`freehold` faction:** Design the sound structural frame first. Then add patchwork: donated sections differ in panel scale by ≤15%; vary color and wear, not silhouette. Warm window light is the primary scale cue on large hulls.
- **`redledger` faction:** Build from captured components: allow one clearly mismatched engine pod or salvaged weapons cluster per ship. The asymmetry is evidence, not decoration. Use tally-band geometry to unify the parts into one clear attack vector. (Minmatar EVE + Hardspace salvage logic.)
- **`gilded` faction:** Sealed outer shell before anything else. Weapons are hairline seams. Use overlapping scale panels with consistent 8–12% overlap ratio. Cold turquoise light exits from deep recesses, not surface emitters. (EVE Amarr ornate-sealed logic adapted to predator role.)
- **`beautiful` faction:** No flat panel lines. No engine nozzles. Bilateral symmetry from anatomy. Each class is a different life stage, not a scaled hull. Use the Stellaris Fungoid quadrant: rounded + organically complex. Propulsion reads as whole-body locomotion.
- **`unknowables` faction:** Stable field envelope reads as silhouette. Physical cells (anchor masses) provide scale reference. Travel direction is asymmetric field lean. Class size comes from cell count and field layer count, not hull volume. (Triglavian trinary logic extended to full non-hull entity.)
- **`assembly` faction:** Self-similarity at two or three scales. A component visible on the frigate also appears at 1/4 scale on the light. Copy drift (same part, slightly mismatched proportions) is allowed and expected. Build one base probe module; copy and vary it to produce the full fleet. (EVE/Triglavian recursive logic; No Man's Sky archetype pooling.)
- **`congregation` faction:** Forward axis is the structural organizing principle. Ribs and sails stack along the rimward-pointing keel. Sacred spaces double as navigation or survival spaces — an observation blister is also a sensor dome.
- **`lamplighter` faction:** Every panel must look reachable in a pressure suit. Add handrails, clamp points, and tool attachment rails as primary features, not afterthoughts. Floodlights and diagnostic panels are the equivalent of other factions' weapon mounts. (Hardspace Shipbreaker maintainability logic + Void Crew modular interior.)
- **Manufacturer kit production:** Author one base part set per faction covering the six categories (prow, spine, cockpit, engine, payload, dorsal hardware). All six classes use the same part language; only dimensions and counts change. Never author a unique piece that only appears on one class — it breaks the "related fleet" read. (Star Citizen manufacturer kit + NMS archetype pool logic.)
- **Color as confirmation, not identity:** Each faction ship must be identifiable in grayscale from silhouette and construction logic alone. Color is applied last and confirms the read; it does not create it. (Paradox Stellaris dev diary rule; Elite Dangerous manufacturer test.)

---

## Traps

The following are confirmed failure modes from the game corpus.

- **One hull scaled six ways.** Uniformly scaling a single mesh produces a light that reads as a tiny frigate, not a nimble scout. Every class must have anatomy appropriate to its job, not just proportional adjustment. (Homeworld 2 faction brief explicitly frames Vaygr as specialized per class, not scaled.)
- **Greeble substituting for silhouette.** Adding surface detail to compensate for a weak primary form. Stellaris artbook rule: design the primary silhouette first; greebles are tertiary — 10% of design effort.
- **Random asymmetry.** Asymmetry that does not tell a story (captured engine, replaced panel, functional equipment on one side) reads as error, not character. Red Ledger ships should be asymmetric from evidence; Ferrous ships should be symmetric from doctrine.
- **Decoration without function.** Fins, spikes, and wings that have no plausible aerodynamic, structural, or functional role undermine believability. Each protrusion should be identifiable as something: sensor vane, radiator, docking spar, thruster pod, sail spar, or creature anatomy.
- **Enlarged windows and doors.** Scaling human-scale elements up with the hull destroys size perception. A frigate with porthole windows larger than a person destroys the sense that it is big. (Design Bible scale rule; Hardspace Shipbreaker anatomy lesson.)
- **Color as primary faction signal.** Ships that read as faction only because of paint color will fail when shown in silhouette or monochrome. Construction logic must carry the identity.
- **Capital-ship anatomy on small classes.** A light ship with a stepped command tower, redundant batteries, and a rescue hangar reads as a frigate at small scale, not as a nimble courier.
- **Identical propulsion across factions.** Using the same engine bell geometry for every faction collapses the "different engineering cultures" read. Each faction's propulsion should be immediately identifiable as belonging to that faction's construction logic.
- **Organic ships that are motionless.** A Beautiful Ones ship frozen in a rest pose without any ambient motion (breathing vents, subtle fin drift, bioluminescent pulse) becomes an organic-shaped statue — it loses the "alive" read at gameplay distance.
- **Random particle noise for energy entities.** The Unknowables must have a **stable readable silhouette** even though they have no hull. Random arcs and sparks produce no silhouette. Nested magnetic loops with consistent anchor masses produce a readable field boundary.
- **Procedural variety without archetype discipline.** No Man's Sky's system works because fighter parts only go into fighters. Unconstrained mixing (fighter wing + hauler cockpit + scout engine) produces ships with no role read. Any RIMWARD modular kit must gate part combinations by class to preserve role readability.
- **Freighters that look like large frigates.** If a freighter has the same silhouette structure as a frigate — just bigger — it reads only as a large warship, not as a vessel that cannot enter a station. Freighters need openly industrial structure (external berth geometry, repeated cargo bays, visible tug docks) that frigates do not carry.
