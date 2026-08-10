/**
 * Faction character portraits (wave 41) — the face behind the voice.
 *
 * SOURCE: docs/FactionExamples/NN-<faction>-<male|female>.png (1672x941
 * character studies, generated alongside the station/ship/jump-gate sheets).
 * The shipped assets are square 384x384 WebP crops (quality 0.82, ~15-35 kB
 * each, 485 kB for the set) under public/assets/portraits/. The crops were
 * baked once through a headless-Chrome canvas pass; the per-image crop
 * rectangles are recorded in docs/FactionExamples/README.md so the bake is
 * reproducible without adding an image dependency to the project. The source
 * PNGs are ~2 MB each, reference art only, and are NEVER loaded by the game.
 *
 * NAMING: the two studies per faction ship as variant 'a' (from the
 * *-male.png source) and 'b' (from the *-female.png source). The game side
 * carries NO gender semantics: docs/FactionExamples/README.md records that the
 * labels describe presentation in the reference art, not faction canon, so the
 * variant key stays neutral and the choice is a hash, never a name lookup.
 *
 * COVERAGE: the ten Banners with reference art. 'hollow' (deep-rim unclaimed)
 * and 'independent' (drifters) have no art and resolve to null — callers must
 * render a text-only card, exactly as before this wave. Same discipline as
 * FACTION_STYLE: never invent a look that the reference sheets do not have.
 */

import { FACTIONS } from './state.js';

/** Public path prefix for the shipped crops (vite serves public/ at root). */
export const PORTRAIT_DIR = '/assets/portraits/';

/**
 * faction id -> source basename in docs/FactionExamples/. The shipped crop
 * filenames are derived from these keys, so the game's URLs and the reference
 * art they were cropped from cannot drift apart.
 */
export const PORTRAIT_SOURCES = {
  veridian: '01-veridian-combine',
  ferrous: '02-ferrous-hegemony',
  freehold: '03-freehold-compact',
  redledger: '04-red-ledger',
  gilded: '05-gilded-chain',
  beautiful: '06-beautiful-ones',
  unknowables: '07-unknowables',
  assembly: '08-assembly',
  congregation: '09-congregation-further-shore',
  lamplighter: '10-lamplighter-guild',
};

/** Variant key -> the reference-art file it was cropped from. */
export const PORTRAIT_VARIANTS = { a: 'male', b: 'female' };

/**
 * FNV-1a over the seed string. Deterministic across sessions and platforms:
 * the same contact id or pilot name always shows the same face, and nothing
 * about the choice is persisted (no save field, no migration).
 */
function hashSeed(seed) {
  let h = 0x811c9dc5;
  const s = String(seed ?? '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Portrait record for an explicit variant. Callers that must avoid showing the
 * same face twice on one screen (station.js's people list) reach for this to
 * take the free study; everyone else uses portraitFor.
 *
 * @returns {{ src: string, variant: 'a'|'b', alt: string }|null}
 */
export function portraitVariant(faction, variant) {
  if (!Object.hasOwn(PORTRAIT_SOURCES, faction)) return null;
  if (!Object.hasOwn(PORTRAIT_VARIANTS, variant)) return null;
  return {
    src: `${PORTRAIT_DIR}${faction}-${variant}.webp`,
    variant,
    alt: `${FACTIONS[faction]?.name ?? faction} portrait`,
  };
}

/**
 * Portrait for a faction, chosen deterministically from `seed` (a contact id,
 * a pilot name — any stable string identity for the person).
 *
 * @returns {{ src: string, variant: 'a'|'b', alt: string }|null}
 *   null when the faction has no reference art (hollow, independent, unknown).
 */
export function portraitFor(faction, seed) {
  return portraitVariant(faction, hashSeed(seed) & 1 ? 'b' : 'a');
}
