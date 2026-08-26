# Wave 126 HUD-06 home-station marker inventory

**Census date:** 2026-08-25 (Wave 126 leftover integrator).  
**Code wins.** Line numbers from live `src/` this session.  
**Leftover:** **REAL.** Persistent home-station bearing + distance is **absent**.  
**Named later serial:** **PR1**.  
**This file is census only.** It does not implement.

Inbox (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Idea inbox — Playtest capture 2026-08-25 second pass; **cite, do not edit**):

> INBOX (P1, HUD/NAV): Add a persistent home-station marker with distance. Nothing on the HUD points to the station once it leaves the screen; a drift to 8,900 u out left only raw POS coordinates as a navigation aid. Threats get an edge arrow; the station does not. Mark the home station (or a selected point of interest) with bearing and distance.

---

## 1. Verdict vs CONSUME test

CONSUME would require a live persistent station (or selected POI) marker that still shows **bearing + distance** on-screen **and** off-screen.

Live:

| Required | Live? | Cite |
|---|---|---|
| Persistent station marker while flying | **No** | `hud.js` has TGT lock chrome, chartmarks, NAV-02 gate cue — **no** home/station slot |
| Off-screen station bearing | **No** (unless the station is the **current lock**) | TGT `rw-edge-arrow` **1415–1433** is `ctx.targets.current` only |
| Distance to station without a lock | **No** | POS is ship XYZ **1974–1986**; dock prompt only in `U.DOCK_RANGE` **2169–2170** |
| Selected POI picker | **No** generic POI | Chartmarks are mystery landmarks **824–841**, **1648–1688** |

**Freeze leftover REAL. Serial is PR1, not none.**

---

## 2. HUD POS readout (raw coords)

| Surface | Live | Cite |
|---|---|---|
| POS panel | `rw-panel rw-pos rw-fade` in bottom `sideCol` | `hud.js` **1028–1031** |
| Label | `POS` | **1029** |
| System name | `rw-sysname` `textContent` | **1030**, **1974–1979** |
| Coords | `rw-coords` `X n  Y n  Z n` rounded | **1031**, **1981–1986** |
| Station distance on POS | **absent** | grep `HOME` / `home-mark` in `hud.js` + `hud.css` = **0** |
| Combat | POS uses `rw-fade` (dims) | **1028**; combat class **1834–1839** |

Playtest hole matches: at ~8,900 u the player has only XYZ.

---

## 3. Target edge arrow (threats / current lock)

| Surface | Live | Cite |
|---|---|---|
| Node | one `rw-edge-arrow`, `aria-hidden` | **816–817** |
| Inset | `EDGE_MARGIN = 84` px | **70** |
| On-screen | bracket + lead; arrow hidden | **1376–1379** |
| Off-screen | rotate triangle toward lock NDC | **1415–1433** |
| Park | hide if `docked` or `gate.jumping` | **1418–1420** |
| CSS | amber triangle `::before` | `hud.css` **576–594** |
| Owner | `ctx.targets.current` only | **1305–1311** |
| Station as lock | `lockKind === 'station'` gets **bracket name + `dist + 'u'`**, not a persistent home cue | `hud.js` **415–418**, **2073–2075**; `reticle-aim.js` **283–286** |

The inbox contrast is exact: threats (and any **selected** lock, including a station you aimed KeyV at) get the amber arrow. The station **does not** keep a marker after it leaves glass unless it remains the lock.

**Do not steal this node.** Home is not a combat lock.

---

## 4. Scanner bearing arc (ships)

| Surface | Live | Cite |
|---|---|---|
| Wave F contacts | bottom SVG arc, scanner-gated | header **56–60**; create **876–910** |
| Gate | `contactsGate(scanner, docked, jumping)` | **1494–1498** |
| Who | live `ctx.ships` in bubble | **1515–1516** |
| Station pip on arc | **No** | slots are ships **894–905** |
| Pulse | `CONTACT_PULSE` 0.45 s; audio skip on `reducedMotion` | **76**, **1617–1628** |

**Do not put the station on the scanner arc.** HUD-01 bottom occupancy + TGT-03 ship instrument.

---

## 5. Charted landmark markers (not the station)

| Surface | Live | Cite |
|---|---|---|
| Pool | one diamond + label per authored landmark cap | **824–841** |
| Who | `mystery.charted` and **not** `visited` | **1648–1662** |
| Project | `chartProj` + edge-clamp `EDGE_MARGIN` | **1101**, **1666–1675** |
| Hide | docked | **1659** |
| Label | `name · Nu` / `name · N.Nk` | **1847–1858** |
| CSS | cyan diamond; combat opacity 0.14; **no** `@keyframes` | `hud.css` **597–632** |
| Station | **not** a landmark | `SYSTEMS[].landmarks` ≠ `station` |

Closest **pattern** (create-once pip + distance text + edge clamp). **Not** a home-station marker. Glyph is a diamond. Do not overload these slots with the pad.

---

## 6. NAV-02 next-gate cue (do not steal)

| Surface | Live | Cite |
|---|---|---|
| World ring | `nav-guidance.js` consume `world.nav` | `nav-guidance.js` **1–12** |
| HUD cue | `rw-nav-gate-cue` two ticks + notch | `hud.js` **818–822** |
| Off-screen | same NDC math as TGT arrow | **1718–1752** |
| Readout | side `NEXT` / `DEST` / `JUMPS` / **GATE** dist | **1008–1026**, **2033–2034** |
| Dist format | `formatNavDist` (`Nu` or `N.Nk`) | `nav-guidance.js` **50–54** |
| CSS | cyan ticks, not amber triangle | `hud.css` **1014–1050** |

**Do not reuse `gateCue`.** **Do not write `nav.js`.** **Do not claim `galaxychart.js`.** **Do not steal NAV-07 chart labels.**

---

## 7. Station world position + dock prompt

| Surface | Live | Cite |
|---|---|---|
| Ownership | `station.js` owns `flags.docked`, `ctx.station = { position, name, inZone }` | `station.js` **99–109** |
| Stable Vector3 | `stationPos.fromArray(def.station.position)` | **4394–4411** |
| HUD may hold the ref | comment | **4394–4395** |
| Per-frame | copy live `systems[id].station.position`; `inZone = dist <= U.DOCK_RANGE` | **6304–6319** |
| Dock range | `U.DOCK_RANGE = 45` | `state.js` **30** |
| Dock snap | `2 × DOCK_RANGE` | `station.js` **6321–6329** |
| HUD prompt | `J` / `Dock` when `inZone && !docked` | `hud.js` **2166–2170** |
| Prompt at 8,900 u | **hidden** (not in zone) | same |

HUD **reads** `ctx.station`. It does **not** project it unless the station is the lock.

---

## 8. Aim glass / HUD-01

| Surface | Live | Cite |
|---|---|---|
| Hub | 80 px `.rw-reticle`; RANGE child | `hud.css` **184–218**; `hud.js` **1293** `mx = cx - 44` |
| Empty of extra gauges | header HUD-01 set | `hud.js` **22–27** |
| `innerHTML` | **none** in `hud.js` | grep 0 |
| Copy helper | `el()` → `textContent` | **283–288** |
| `stripHudText` | drop C0 | **421–428** |

**Do not put a home gauge in the hub.** RANGE stays.

---

## 9. Overlay hide surfaces (Wave 125 / CTL-02)

| Overlay | Flag | z (live) | HUD today |
|---|---|---|---|
| Hail | `flags.hailOpen` | hail root z **40** (`hail.js` **118**) | HUD still paints; **no** home hide |
| Chart | `flags.chartOpen` | chart z **30** (`hud.css` **1909**) | HUD under chart |
| Berth | `flags.berthOpen` (+ Wave 125 `berthHold`) | berth z 60 | HUD under desk |
| Docked station UI | `flags.docked` | station overlay | chartmarks / nav / lock arrow **park** |
| Jump | `ctx.gate.jumping` | jump bar **866–869** | same park |

`hud.js` does **not** import `overlay-policy.js`. Later hide can read session flags only.

---

## 10. Neighbours this leftover must not steal

| Neighbour | Why |
|---|---|
| TGT-01/02/03 bracket / lead / amber arrow | lock chrome |
| NAV-02 `gateCue` + GATE readout | next-hop |
| NAV-07 Galaxy Chart labels | `galaxychart.js` |
| Agent API watch badge (PR5) | not hub; other Wave 126 pack |
| Hail demand copy | `hail.js` |
| HUD-03 alerts | KeyO `hudAlerts` |
| HUD-04 toast flood | toast slots **63–66**, **843–855** |
| Digit 0/8/9 | station / papers |
| `state.js` / `WORLD_FIELDS` | persist **80–105**; `nav` already NAV-01 |

---

## 11. Performance contract (later PR1 must keep)

`hud.js` **31–34**: create DOM once; transforms every frame; text ~5 Hz; **no** per-frame alloc. Scratch `Vector3`s at init (**1088–1102**).

---

## 12. Grep negatives (this session)

| Pattern | `src/systems/hud.js` | `src/ui/hud.css` |
|---|---|---|
| `rw-home` / `home-mark` / `HOME` | 0 | 0 |
| `innerHTML` | 0 | — |
| persistent station project | 0 (lock path only) | — |

---

## 13. Code-wins summary

The pad is a known world point (`ctx.station.position`). HUD already knows how to project, edge-clamp, and print `u` / `k` (chartmarks + NAV-02 + TGT). **None of those instruments is a persistent home-station marker.** POS is ship XYZ. Dock `J` dies outside 45 u. TGT arrow is the lock. Gate cue is the route. Scanner arc is ships.

Hole is live. Leftover **REAL**.
