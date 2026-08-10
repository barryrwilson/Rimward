/**
 * FACTION_STYLE (wave 37) — the single source of truth for every faction's
 * visual identity, derived from the reference concept art in
 * Docs/FactionExamples/ (palette samples + PROMPTS.md intent). Ships
 * (npc.js), stations (station.js), gates (gate.js), and planet grading
 * (solarsystem.js) all read this table; FACTIONS.color (state.js) stays the
 * HUD/chart identity color and mirrors `accent` here.
 *
 * Color roles (all hex, sRGB):
 *   hull     — primary structure
 *   hullDark — secondary structure / recessed plating
 *   trim     — mechanical trim (cabs, wings, rings)
 *   accent   — faction identity color (markings, chevrons, chart node)
 *   glow     — emitted light (engine glow, running lights, gate aperture)
 *   beacon   — hot beacon center
 *   patch[]  — multi-color part palette, cycled per part for patchwork
 *              factions (freehold donated panels, lamplighter yellow/cobalt…)
 *   metalness / roughness — shared PBR response for the faction's materials
 *   planetMood 'warm'|'cold' + planetTint — solarsystem.js band grading
 *     (base slot palette chosen by mood, then multiplied by the tint;
 *     null tint reproduces the pre-wave-37 warm/cold look exactly)
 *
 * Vertex-color ruling (user, wave 37): built (non-organic) ships bake these
 * colors into geometry vertex colors and share ONE MeshStandardMaterial
 * across every faction — color lives in the mesh, not the material. See
 * npc.js vcGeoFor().
 */

export const FACTION_STYLE = {
  // 03 — homesteader patchwork: barn red, weathered cream, faded blue,
  // warm amber windows (03-freehold-compact-*.png).
  freehold: {
    hull: 0x6b4f36, hullDark: 0x3a2c1e, trim: 0xd8c9a8, accent: 0x9a4436,
    glow: 0xffb454, beacon: 0xffdca0,
    patch: [0x9a4436, 0xd8c9a8, 0x5b7a94],
    metalness: 0.5, roughness: 0.6,
    planetMood: 'warm', planetTint: null,
  },
  // 01 — graphite/pale alloy corporate extraction, muted emerald light
  // (01-veridian-combine-*.png). D1 (approved): replaces the §18.2
  // white/cyan scheme; the emerald accent is the new identity color.
  veridian: {
    hull: 0x3a4442, hullDark: 0x232d2d, trim: 0x8a948c, accent: 0x58c49a,
    glow: 0x58c49a, beacon: 0xd8fff0,
    patch: [0x3a5a4b, 0x8a948c],
    metalness: 0.6, roughness: 0.4,
    planetMood: 'cold', planetTint: null,
  },
  // 04 — organized piracy: dark iron, dried-blood red, tarnished copper,
  // amber utility light (04-red-ledger-*.png).
  redledger: {
    hull: 0x2c2118, hullDark: 0x181210, trim: 0x946445, accent: 0x7e2a20,
    glow: 0xd88a3a, beacon: 0xffc06a,
    patch: [0x7e2a20, 0x946445, 0x3a3a3c],
    metalness: 0.55, roughness: 0.55,
    planetMood: 'warm', planetTint: 0xb08878,
  },
  // Deep-rim unclaimed — no reference art; keeps its established dusk-mauve.
  hollow: {
    hull: 0x4a4054, hullDark: 0x2c2634, trim: 0x8a7c96, accent: 0x7a6a8a,
    glow: 0xb09ac0, beacon: 0xe0d0ea,
    patch: [0x7a6a8a, 0x8a7c96],
    metalness: 0.45, roughness: 0.6,
    planetMood: 'cold', planetTint: 0xb0a0c0,
  },
  // Drifters — neutral gray, warm amber engines (pre-wave-37 fallback look).
  independent: {
    hull: 0x6a7076, hullDark: 0x3a3f45, trim: 0xd7e4ea, accent: 0x9aa7b8,
    glow: 0xffa54a, beacon: 0xffe0b0,
    patch: [0x9aa7b8, 0xd7e4ea],
    metalness: 0.45, roughness: 0.55,
    planetMood: 'warm', planetTint: null,
  },
  // 02 — militarist monumental iron, restrained crimson, brass recognition
  // (02-ferrous-hegemony-*.png).
  ferrous: {
    hull: 0x42454b, hullDark: 0x252d35, trim: 0x6b7c8c, accent: 0x8a3a34,
    glow: 0xd86a4a, beacon: 0xffe0b0,
    patch: [0x8a3a34, 0xb08a4a],
    metalness: 0.7, roughness: 0.45,
    planetMood: 'cold', planetTint: 0x98a4b0,
  },
  // 05 — black ceramic and ivory with old gold, cold turquoise light
  // (05-gilded-chain-*.png).
  gilded: {
    hull: 0x14161a, hullDark: 0x0b0d0e, trim: 0xa09b8a, accent: 0xc9a86a,
    glow: 0x4fc4c4, beacon: 0xa8f0f0,
    patch: [0xc9a86a, 0xa09b8a],
    metalness: 0.65, roughness: 0.35,
    planetMood: 'cold', planetTint: 0xa8b8a8,
  },
  // 06 — D2 (approved): grown pearl/nacre stays MINT in-game (established
  // lore, organic.js); the reference art's indigo/violet reads through the
  // planet grading and gate overgrowth only. Ships/stations are sculpted by
  // organic.js and never read hull/trim/patch.
  beautiful: {
    hull: 0x283a5e, hullDark: 0x1a2338, trim: 0xd8c8f0, accent: 0x7fe0a8,
    glow: 0x7fe0a8, beacon: 0xfdf6ec,
    patch: [0x788dd4, 0xd8c8f0],
    metalness: 0.2, roughness: 0.5,
    planetMood: 'cold', planetTint: 0x8898d0,
  },
  // 09 — pilgrim faith: midnight blue, weathered silver, candle amber,
  // violet Wakeglass (09-congregation-further-shore-*.png).
  congregation: {
    hull: 0x232a44, hullDark: 0x161b2e, trim: 0xa8b0b8, accent: 0xd8a25a,
    glow: 0xd8a25a, beacon: 0xffe0a8,
    patch: [0x8a7bd8, 0xa8b0b8],
    metalness: 0.5, roughness: 0.5,
    planetMood: 'cold', planetTint: 0x8880b8,
  },
  // 08 — ancient probe descendants: weathered off-white, charcoal, faded
  // orange, teal optics (08-assembly-*.png).
  assembly: {
    hull: 0xb8b4a8, hullDark: 0x3a3c3e, trim: 0x6b6e70, accent: 0xb8763c,
    glow: 0x4faeae, beacon: 0xa8f0f0,
    patch: [0xb8763c, 0x6b6e70],
    metalness: 0.55, roughness: 0.5,
    planetMood: 'cold', planetTint: 0xb0b8b0,
  },
  // 10 — infrastructure guild: soot black, utility yellow, warm lamps,
  // cobalt diagnostics (10-lamplighter-guild-*.png).
  lamplighter: {
    hull: 0x24211c, hullDark: 0x171410, trim: 0xd8a83a, accent: 0xffc06a,
    glow: 0xffc06a, beacon: 0xffe8c0,
    patch: [0xd8a83a, 0x5a8ae0],
    metalness: 0.6, roughness: 0.55,
    planetMood: 'warm', planetTint: 0xc0b090,
  },
  // 07 — D3 (approved): deferred — no generated system flies unknowables.
  // Colors recorded from 07-unknowables-*.png for the future no-hull pass.
  unknowables: {
    hull: 0x1e2024, hullDark: 0x141414, trim: 0x404c77, accent: 0x6fd8e8,
    glow: 0x8aa0ff, beacon: 0xe8e8ff,
    patch: [0x665fac, 0x6fd8e8],
    metalness: 0.3, roughness: 0.4,
    planetMood: 'cold', planetTint: 0x8898e0,
  },
};

/** Style record for `faction`, falling back to independent gray. */
export function styleFor(faction) {
  return FACTION_STYLE[faction] ?? FACTION_STYLE.independent;
}
