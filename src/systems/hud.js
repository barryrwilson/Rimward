import * as THREE from 'three';
import '../ui/hud.css';
import { WEAPONS, HEAT, U, FACTIONS, COMMODITIES, SYSTEMS, resolveBand, ORE_TYPES, MINING_LASERS, miningLaserFor } from '../game/state.js';
import { isLauncherId, LAUNCHER_IDS } from '../game/weapon-fit.js';
import { isBeautiful } from './organic.js';

/**
 * RIMWARD HUD (doc §13) — cold frontier instrumentation (§18.4).
 *
 * Combat-critical set (§13.2 / HUD-01): reticle + lead indicator, target
 * bracket with resolve band, mirrored Screen/Shell/hull/speed rails left and
 * right of center, current weapon on the self rail, target distance on the
 * target rail, plus one focused context prompt. Bottom aux (strain/engine/
 * throttle/burner/drift) stays but dims in combat. Non-critical panels
 * (resources, controls, bio, pos) fade while ctx.flags.combat is set.
 * Same overlay in chase, third, and first-person. First-person only
 * recenters the reticle; it does not swap instruments.
 *
 * Performance contract: every DOM node is created once here. update() writes
 * transforms (reticle/bracket/lead/edge-arrow) per frame; ALL text and bar
 * writes are throttled to ~5 Hz and only when the value actually changed.
 * No per-frame object allocations — scratch Vector3s live at init scope.
 *
 * Wave 15: charted landmarks surface as POI markers while flying their
 * system — the keeper's chart mark (wave 14 mystery.charted) becomes a
 * heading. One pooled diamond + label per charted-but-unvisited landmark of
 * the current system, projected and edge-clamped like the target bracket;
 * hidden while docked, dimmed in combat (§13.2). mystery.charted/visited are
 * read fresh each frame (save.js swaps the record on restore). §25: labels
 * name the authored landmark + distance only, never a clue.
 *
 * Color is never the only signal (§18.4/§20): every state pairs palette with
 * text, shape (petals, corners, icons), or glyph prefixes.
 *
 * Wave 51 (ore ladder): the asteroid bracket meta names the ore, its
 * hardness (H1..H4), and the units left — and when the rock is harder than
 * the installed mining head it instead names the cheapest head that CAN cut
 * it ('NEEDS …') and tints the meta amber (.ore-blocked; text still carries
 * the state, color is redundant). Weapon group 3 labels itself with the
 * installed head's name (Mk I..IV), resolved fresh each frame. The
 * combat.js 'mineBlocked' event (throttled 1/s per rock) routes through the
 * existing toast channel as a warn line — no new overlay.
 *
 * Wave F (contacts): a thin bottom bearing arc, gated on ctx.world.scanner.
 * Tier 0 has no arc. Mk I shows ships inside U.ENCOUNTER_BUBBLE. Mk II
 * doubles the bubble and adds a closure glyph on the lock pip. Shape is
 * the friend/foe cue (tick / chevron / hollow diamond). Not a reticle ring.
 */

const TEXT_UPDATE_INTERVAL = 0.2; // s between throttled text refreshes
const TOAST_LIFETIME = 4; // s a toast stays fully visible
const TOAST_SLOTS = 5;
const HULL_PETALS = 10;
const EDGE_MARGIN = 84; // px inset for the off-screen target arrow
const LEAD_MIN_SPEED = 6; // u/s — still used to skip a useless tiny offset draw
const EMPTY_LIST = []; // shared ?? fallback — never mutated, avoids per-frame []
const CONTACT_SLOTS = 24;
const CONTACT_MK1_CAP = 16;
const CONTACT_CANDIDATES = 48;
const CONTACT_PULSE = 0.45;
const CONTACT_CLOSE_FLOOR = 4; // u/s along LOS
const CONTACT_ARC = { cx: 200, cy: -42, r: 102, half: 1.08, elev: 7 };
const _arcPt = { x: 0, y: 0 };

/** @returns {'mech' | 'bio'} */
export function hudFamily(ctx) {
  const debug = sessionHudFamilyOverride();
  if (debug === 'mech' || debug === 'bio') return debug;
  const p = ctx.player;
  if (!p) return 'bio';
  if (p.hullKind === 'built') return 'mech';
  if (p.hullKind === 'living') return 'bio';
  if (isBeautiful(p.faction)) return 'bio';
  return 'bio';
}

function sessionHudFamilyOverride() {
  try {
    const v = sessionStorage.getItem('rw-hud-family');
    if (v === 'mech' || v === 'bio') return v;
  } catch (_) { /* private / blocked storage */ }
  return null;
}

const RAIL_GAP = 78;
const HAIR_INSET = 52;
const HAIR_CAREER = 18;
const HAIR_COMBAT = 10;
const _agezExp = { l: 0, t: 0, r: 0, b: 0 };
const _segT = { t0: 0, t1: 1 };

function bioPeriodSec(mood, reduced) {
  if (reduced) return 0;
  if (mood === 'serene') return 4;
  if (mood === 'pained') return 2.2;
  if (mood === 'keen' || mood === 'anxious' || mood === 'feral') return 1.2;
  return 4;
}

/**
 * Overlay-px hair box for one rail. `out` reuses a caller box (no alloc).
 * Anchors: top 57% vh, left 50% vw, ±78 px gap, 52 px outer inset, 10/18 grow.
 */
export function hairBoxForRail(side, vw, vh, width, height, combat, out) {
  const b = out || { l: 0, t: 0, r: 0, b: 0 };
  const grow = combat ? HAIR_COMBAT : HAIR_CAREER;
  const mid = 0.5 * vw;
  const top = 0.57 * vh;
  b.t = top - grow;
  b.b = top + height + grow;
  if (side === 'self') {
    b.l = mid - RAIL_GAP - width + HAIR_INSET;
    b.r = mid - RAIL_GAP;
  } else {
    b.l = mid + RAIL_GAP;
    b.r = mid + RAIL_GAP + width - HAIR_INSET;
  }
  return b;
}

function distPointBox(x, y, b) {
  const dx = x < b.l ? b.l - x : (x > b.r ? x - b.r : 0);
  const dy = y < b.t ? b.t - y : (y > b.b ? y - b.b : 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function clipSeg(p, q) {
  if (p === 0) return q >= 0;
  const r = q / p;
  if (p < 0) {
    if (r > _segT.t1) return false;
    if (r > _segT.t0) _segT.t0 = r;
  } else {
    if (r < _segT.t0) return false;
    if (r < _segT.t1) _segT.t1 = r;
  }
  return true;
}

function segmentHitsBox(ax, ay, bx, by, b) {
  _segT.t0 = 0;
  _segT.t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  return clipSeg(-dx, ax - b.l) && clipSeg(dx, b.r - ax)
    && clipSeg(-dy, ay - b.t) && clipSeg(dy, b.b - ay);
}

/** True → hide that rail's hair (AGEZ hit, or H missing). */
export function agezHairOff(hx, hy, leadOn, lx, ly, box) {
  if (!Number.isFinite(hx) || !Number.isFinite(hy)) return true;
  if (distPointBox(hx, hy, box) < 56) return true;
  if (leadOn) {
    if (distPointBox(lx, ly, box) < 20) return true;
    _agezExp.l = box.l - 24;
    _agezExp.t = box.t - 24;
    _agezExp.r = box.r + 24;
    _agezExp.b = box.b + 24;
    if (segmentHitsBox(hx, hy, lx, ly, _agezExp)) return true;
  }
  return false;
}

/** Aft-centered yaw → arc u in [-1, 1]. Forward sits at the ends. */
function contactYawToU(yaw) {
  if (yaw >= 0) return 1 - yaw / Math.PI;
  return -1 - yaw / Math.PI;
}

function contactArcPoint(u, elev, out) {
  const th = Math.PI * 0.5 - u * CONTACT_ARC.half;
  const rr = CONTACT_ARC.r + elev * CONTACT_ARC.elev;
  out.x = CONTACT_ARC.cx + rr * Math.cos(th);
  out.y = CONTACT_ARC.cy + rr * Math.sin(th);
}

function contactsArcPath() {
  let d = '';
  for (let i = 0; i <= 20; i++) {
    contactArcPoint((i / 20) * 2 - 1, 0, _arcPt);
    d += (i === 0 ? 'M' : 'L') + _arcPt.x.toFixed(1) + ' ' + _arcPt.y.toFixed(1);
  }
  return d;
}

const WEAPON_KEYS = ['cannon', 'disruptor', 'mining']; // groups 1–3; group 4 is hudWeaponKey

/** Empty group 4 must not fall through to cannon. */
export function hudWeaponKey(ctx) {
  const g = ctx.input.weaponGroup | 0;
  if (g === 4) {
    const id = ctx.world.launcher;
    if (!isLauncherId(id)) return null;
    return LAUNCHER_IDS[id].wkey;
  }
  return WEAPON_KEYS[g - 1] ?? 'cannon';
}

/** WPN rail copy. Names and ammo stay textContent; HUD never writes world keys. */
export function weaponHudLabel(ctx) {
  const g = ctx.input.weaponGroup | 0;
  const wKey = hudWeaponKey(ctx);
  if (g === 4) {
    if (!wKey) return '4 · —';
    const sku = LAUNCHER_IDS[ctx.world.launcher];
    const wName = (sku && sku.name) || WEAPONS[wKey]?.name || '—';
    const ammo = ctx.world.missileAmmo;
    const n = Number.isInteger(ammo) && ammo >= 0 ? ammo : 0;
    return '4 · ' + wName + ' · ' + n;
  }
  const wName = wKey === 'mining'
    ? miningLaserFor(ctx.world.miningLaser).name
    : (WEAPONS[wKey] ? WEAPONS[wKey].name : '—');
  return g + ' · ' + wName;
}

const BAND_LABEL = {
  defiant: 'DEFIANT',
  shaken: 'SHAKEN',
  bargaining: 'BARGAINING',
  capitulate: 'CAPITULATE',
};

function el(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  parent.appendChild(node);
  return node;
}

/** Labeled horizontal bar; returns { row, fill, set(pct) } with change caching. */
function makeBar(parent, labelText, barClass) {
  const row = el('div', 'rw-meter ' + barClass, parent);
  el('div', 'rw-label', row, labelText);
  const track = el('div', 'rw-bar', row);
  const fill = el('div', 'rw-bar-fill', track);
  let lastPct = -1;
  return {
    row,
    set(pct) {
      const p = Math.max(0, Math.min(100, Math.round(pct)));
      if (p !== lastPct) {
        lastPct = p;
        fill.style.width = p + '%';
      }
    },
  };
}

/** Hull petal row + LOW/CRIT flag (color is never the only cue). */
function makeHull(parent) {
  const hullRow = el('div', 'rw-meter rw-hull', parent);
  el('div', 'rw-label', hullRow, 'HULL');
  const petals = el('div', 'rw-petals', hullRow);
  const petalSpans = [];
  for (let i = 0; i < HULL_PETALS; i++) petalSpans.push(el('span', 'rw-petal on', petals));
  const hullFlag = el('div', 'rw-hull-flag', hullRow, '');
  let lastOn = -1;
  let lastBand = '';
  return {
    set(frac) {
      const hullFrac = Math.max(0, Math.min(1, frac));
      const on = Math.round(hullFrac * HULL_PETALS);
      if (on !== lastOn) {
        lastOn = on;
        for (let i = 0; i < HULL_PETALS; i++) petalSpans[i].classList.toggle('on', i < on);
      }
      const hullBand = hullFrac > 0.5 ? 'ok' : hullFrac > 0.25 ? 'warn' : 'crit';
      if (hullBand !== lastBand) {
        lastBand = hullBand;
        petals.className = 'rw-petals h-' + hullBand;
        hullFlag.textContent = hullBand === 'crit' ? 'CRIT' : hullBand === 'warn' ? 'LOW' : '';
        hullFlag.dataset.state = hullBand;
        hullFlag.style.display = hullBand === 'ok' ? 'none' : '';
      }
    },
  };
}

/** SPD readout; write-on-change. Optional MATCH lamp (Wave D). */
function makeSpeed(parent) {
  const row = el('div', 'rw-meter rw-speed', parent);
  el('div', 'rw-label', row, 'SPD');
  const value = el('div', 'rw-value', row);
  const text = document.createTextNode('0');
  value.appendChild(text);
  el('span', 'rw-unit', value, 'u/s');
  const lamp = el('span', 'rw-match-lamp is-hidden', value, 'MATCH');
  let last = -1;
  let lastMatch = null;
  return {
    set(spd, matching) {
      const n = Math.round(spd);
      if (n !== last) {
        last = n;
        text.nodeValue = String(n);
      }
      const on = !!matching;
      if (on !== lastMatch) {
        lastMatch = on;
        lamp.classList.toggle('is-hidden', !on);
      }
    },
  };
}

/** FORE / AFT glance. Words plus fill vs hollow — color is never the only cue. */
function makeFacing(parent) {
  const row = el('div', 'rw-facing', parent);
  const sil = el('div', 'rw-facing-sil', row);
  el('span', 'rw-facing-nose', sil);
  el('span', 'rw-facing-body', sil);
  const ends = el('div', 'rw-facing-ends', row);
  const fore = el('span', 'rw-facing-end rw-facing-fore', ends, 'FORE');
  const aft = el('span', 'rw-facing-end rw-facing-aft', ends, 'AFT');
  let last = '';
  return {
    row,
    set(mode) {
      if (mode === last) return;
      last = mode;
      const flashFore = mode === 'flash-fore';
      const flashAft = mode === 'flash-aft';
      const litFore = mode === 'fore' || flashFore;
      const litAft = mode === 'aft' || flashAft;
      const dim = mode === 'dim';
      fore.classList.toggle('is-lit', litFore && !dim);
      aft.classList.toggle('is-lit', litAft && !dim);
      fore.classList.toggle('is-dim', dim || !litFore);
      aft.classList.toggle('is-dim', dim || !litAft);
      fore.classList.toggle('is-flash', flashFore);
      aft.classList.toggle('is-flash', flashAft);
    },
  };
}

function contactKind(hostile, isLock) {
  if (isLock) return 'lock';
  if (hostile) return 'hostile';
  return 'civ';
}

/** Rock lock: list entry has position and no ship state. */
function isRockTarget(target) {
  return !!(target && target.position && !target.state);
}

/** Rock lock: list entry with a live position, not a ship `{ object, state }`. */
function isRockLock(t) {
  return !!(t && t.position && !t.object && !t.state);
}

/** Distance to nearest work-sector rock, else ore>0, else field.center. */
function beltMineDist(ctx, shipPos) {
  const list = ctx.asteroids && ctx.asteroids.list;
  let best = Infinity;
  if (list && list.length) {
    const def = SYSTEMS[ctx.world.currentSystem];
    const field = def && def.field;
    let workFrac = field && Number.isFinite(field.workFrac) ? field.workFrac : 0.6;
    if (workFrac < 0) workFrac = 0;
    if (workFrac > 1) workFrac = 1;
    const workN = Math.min(list.length, Math.ceil(workFrac * list.length));
    for (let pass = 0; pass < 2; pass++) {
      const n = pass === 0 ? workN : list.length;
      for (let i = 0; i < n; i++) {
        const rock = list[i];
        if (!rock || !(rock.ore > 0)) continue;
        const p = rock.position;
        if (!p) continue;
        const dx = p.x - shipPos.x;
        const dy = p.y - shipPos.y;
        const dz = p.z - shipPos.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < best) best = d2;
      }
      if (best !== Infinity) {
        const d = Math.round(Math.sqrt(best));
        return Number.isFinite(d) ? d : 0;
      }
    }
  }
  const def = SYSTEMS[ctx.world.currentSystem];
  const c = def && def.field && def.field.center;
  if (c) {
    const n = Math.round(Math.hypot(
      c[0] - shipPos.x,
      (c[1] || 0) - shipPos.y,
      c[2] - shipPos.z,
    ));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** Terse pilot-voice toast copy for a ctx event (§13.5). null = not toastable. */
function toastForEvent(e, ctx, mem) {
  switch (e.type) {
    case 'commLine':
      // Dedupe (wave 6): mystery.js emits clueFound/landmarkFound and then a
      // bare Echo 'commLine' with the same line in the SAME frame. The
      // clue/landmark cases below record their lines in mem.frameLines
      // (cleared each frame before the event loop); a commLine whose text
      // matches an already-toasted line this frame is skipped, so each
      // discovery line surfaces exactly once (with its ✧ glyph).
      if (e.text && mem.frameLines.includes(e.text)) return null;
      return { text: e.text ?? e.line ?? '', cls: 'comm' };
    case 'clueFound':
      mem.frameLines.push(e.line ?? '');
      return { text: '✧ ' + (e.line ?? 'An echo answers.'), cls: 'comm' };
    case 'landmarkFound':
      mem.frameLines.push(e.line ?? '');
      return { text: '✧ ' + (e.name ? e.name + ' — ' : '') + (e.line ?? ''), cls: 'comm' };
    case 'epicStage':
      return { text: '◆ ' + (e.line ?? 'Word travels.'), cls: 'sting' };
    case 'originChosen':
      return { text: '✦ ' + (e.line ?? 'This is who you are.'), cls: 'sting' };
    case 'convergence':
      return { text: '◎ ' + (e.line ?? 'The song converges.'), cls: 'sting' };
    case 'deepening':
      return { text: '◎ ' + (e.line ?? 'The song deepens.'), cls: 'sting' };
    case 'lineagePassed':
      return { text: '◆ ' + (e.line ?? 'The name flies again.'), cls: 'sting' };
    case 'gunRisen':
      return { text: '✦ ' + (e.line ?? 'A new name rides the lanes.'), cls: 'sting' };
    case 'creditorCall':
      return { text: '▲ ' + (e.line ?? 'The Ledger calls.'), cls: 'warn' };
    case 'originPayoff':
      return { text: '✦ ' + (e.line ?? 'The situation closes.'), cls: 'sting' };
    case 'originBeat':
      return { text: '✧ ' + (e.line ?? 'She is becoming.'), cls: 'sting' };
    // 'songShift' gets NO toast — it is heard, not read.
    case 'milestone':
      return { text: '★ ' + (e.line ?? e.id ?? 'A first.'), cls: 'sting' };
    case 'saveBlocked':
      return { text: '▲ SAVE BLOCKED — ' + (e.reason ?? 'hostiles near'), cls: 'warn' };
    case 'podCollected':
      return { text: '■ Cargo secured.', cls: 'good' };
    case 'mineBlocked':
      // wave 51: beam hit rock harder than the installed head. combat.js
      // already throttles to one emit per second per asteroid, so no
      // HUD-side dedupe; the ore's refusal line speaks for itself.
      return { text: '▲ ' + (e.line ?? 'The head cannot bite this rock.'), cls: 'warn' };
    case 'fearChanged': {
      const up = mem.lastFear !== null && (e.fear ?? 0) > mem.lastFear;
      mem.lastFear = e.fear ?? mem.lastFear;
      return up
        ? { text: '▲ They learn to fear you.', cls: 'warn' }
        : { text: '› The lanes forget.', cls: 'comm' };
    }
    case 'shieldDown': {
      if (e.ship && e.ship !== ctx.player) return null; // NPC layer loss shows on its bracket
      return e.layer === 'screen'
        ? { text: '✕ Screen down.', cls: 'danger' }
        : { text: '✕ Shell down.', cls: 'danger' };
    }
    case 'engineOut': {
      const isPlayer = !e.ship || e.player === ctx.player || e.ship === ctx.player;
      if (isPlayer) return { text: '✕ Engine out.', cls: 'danger' };
      if (e.ship === ctx.targets.current || e.ship === ctx.targets.current?.state)
        return { text: '▲ Their engine is out.', cls: 'warn' };
      return null;
    }
    case 'npcDisabled':
      return { text: '■ Dead in space. Hail (H) to salvage.', cls: 'good' };
    case 'npcDestroyed':
      return { text: '▲ Target destroyed.', cls: 'warn' };
    case 'npcSurrendered':
      return { text: '■ They yield.', cls: 'good' };
    case 'docked':
      return { text: '› Docked.', cls: 'comm' };
    case 'undocked':
      return { text: '› Undocked.', cls: 'comm' };
    case 'worldEvent': {
      const known = {
        strikeRush: '› Word spreads — a strike rush.',
        pirateBlockade: '▲ Blockade on the lane.',
        laborStrike: '› The docks are striking.',
        commodityGlut: '› Glut on the market.',
      };
      return { text: known[e.kind] ?? '› Word travels — ' + String(e.kind ?? 'something'), cls: 'comm' };
    }
    case 'marketShift':
      return { text: '› Prices are moving.', cls: 'comm' };
    case 'sunHeat':
      return { text: '▲ STAR HEAT — turn away.', cls: 'warn' };
    case 'sunKill':
      return { text: '✕ The star took the ship.', cls: 'danger' };
    case 'bodyHit':
      if (!(e.damage > 0)) return null;
      return { text: '▲ Hull strike.', cls: 'warn' };
    case 'survivorRescued': {
      // Same-frame commLine (station.js) carries the spoken line; record it
      // so the comm case below skips the duplicate toast.
      if (e.line) mem.frameLines.push(e.line);
      const n = e.count ?? 0;
      const text = n === 1 ? '■ A survivor is home.' : `■ ${n} survivors are home.`;
      return { text, cls: 'good' };
    }
    case 'survivorSold': {
      if (e.line) mem.frameLines.push(e.line);
      const n = Number.isFinite(e.count) ? e.count : 0;
      const text = n === 1 ? '■ The Chain took one.' : `■ The Chain took ${n}.`;
      return { text, cls: 'warn' };
    }
    default:
      return null;
  }
}

/**
 * Wave 2 (gate/jump) styles. These few classes are injected once here (a
 * wave-2 concession when hud.css was read-only); they reuse the #hud palette
 * variables and mirror the existing toast/prompt/panel treatments (§13,
 * §18.4). Font sizes scale with var(--rw-text-scale) like the rest of the HUD.
 */
const W2_STYLE_ID = 'rw-hud-w2-styles';
function ensureW2Styles() {
  if (document.getElementById(W2_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = W2_STYLE_ID;
  style.textContent = `
#hud .rw-banner {
  position: absolute;
  top: 96px;
  right: 14px;
  left: auto;
  transform: translateY(-8px);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  padding: 10px 26px;
  background: rgba(2, 6, 13, 0.78);
  border: 1px solid rgba(96, 150, 196, 0.25);
  border-left-width: 3px;
  border-left-color: var(--cyan);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.45s ease, transform 0.45s ease;
  pointer-events: none;
  white-space: nowrap;
}
#hud .rw-banner.show { opacity: 1; transform: translateY(0); }
#hud .rw-banner-name {
  font-size: calc(22px * var(--rw-text-scale, 1));
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--cyan);
  text-shadow: 0 0 12px rgba(111, 242, 224, 0.45);
}
#hud .rw-banner-sub {
  font-size: calc(11px * var(--rw-text-scale, 1));
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--dim);
}
#hud .rw-jump {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  min-width: 240px;
  padding: 10px 16px;
  background: rgba(2, 6, 13, 0.82);
  border: 1px solid rgba(111, 242, 224, 0.4);
  border-radius: 2px;
  pointer-events: none;
}
#hud .rw-jump-label {
  font-size: calc(12px * var(--rw-text-scale, 1));
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--cyan);
  text-align: center;
  white-space: nowrap;
}
#hud .rw-jump .rw-bar { flex: none; height: 3px; }
/* This injected sheet loads after hud.css, so at equal specificity .rw-jump's
   display:flex would beat .is-hidden — pin the hidden state explicitly. */
#hud .rw-jump.is-hidden { display: none; }
#hud .rw-sysname {
  font-size: calc(11px * var(--rw-text-scale, 1));
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 2px;
  white-space: nowrap;
}
`;
  document.head.appendChild(style);
}

export function initHud(ctx) {
  const root = document.getElementById('hud');
  if (!root) {
    console.warn('hud.js: #hud root missing; HUD disabled');
    return { update() {} };
  }
  ensureW2Styles();

  // ---------- center: alien-iris reticle (§14.9) + subtle crosshair ----------
  const reticle = el('div', 'rw-reticle', root);
  el('div', 'rw-reticle-pupil', reticle);
  for (let i = 0; i < 3; i++) el('span', 'rw-reticle-cilia', reticle);
  el('div', 'rw-reticle-range', reticle, 'RANGE');
  const crosshair = el('div', 'rw-crosshair', root);
  el('div', 'rw-crosshair-dot', crosshair);

  // ---------- target bracket + lead pip + off-screen arrow ----------
  const bracket = el('div', 'rw-target is-hidden', root);
  const bracketBox = el('div', 'rw-target-box', bracket);
  el('span', 'rw-corner rw-c-tl', bracketBox);
  el('span', 'rw-corner rw-c-tr', bracketBox);
  el('span', 'rw-corner rw-c-bl', bracketBox);
  el('span', 'rw-corner rw-c-br', bracketBox);
  const bracketInfo = el('div', 'rw-target-info', bracket);
  const tName = el('div', 'rw-target-name', bracketInfo);
  const tMeta = el('div', 'rw-target-meta', bracketInfo);
  const tResolve = el('div', 'rw-target-resolve', bracketInfo);
  const lead = el('div', 'rw-lead is-hidden', root);
  el('div', 'rw-lead-ring', lead);
  el('div', 'rw-lead-label', lead, 'LEAD');
  const edgeArrow = el('div', 'rw-edge-arrow is-hidden', root);

  // ---------- wave 15: charted landmark markers (keeper chart marks) ----------
  // One slot per possible mark: pool sized to the largest authored landmark
  // table in SYSTEMS, every node created ONCE here (performance contract).
  // Decorative — the mark is announced via commLine when charted, so the
  // marker is pointer-inert and aria-hidden.
  let CHARTMARK_SLOTS = 0;
  for (const sysId in SYSTEMS) {
    const n = (SYSTEMS[sysId].landmarks ?? EMPTY_LIST).length;
    if (n > CHARTMARK_SLOTS) CHARTMARK_SLOTS = n;
  }
  const chartSlots = [];
  for (let i = 0; i < CHARTMARK_SLOTS; i++) {
    const box = el('div', 'rw-chartmark is-hidden', root);
    box.setAttribute('aria-hidden', 'true');
    el('span', 'rw-chartmark-glyph', box);
    const label = el('span', 'rw-chartmark-label', box);
    chartSlots.push({ box, label, lmId: '', lmName: '', dist: 0, shown: null, x: -1, y: -1, textId: '', textBucket: -1 });
  }

  // ---------- top-center toasts (comm lines + milestone stings) ----------
  const toasts = el('div', 'rw-toasts', root);
  // screen readers announce toasts/banner as they appear (no focus moves)
  toasts.setAttribute('role', 'status');
  toasts.setAttribute('aria-live', 'polite');
  const toastSlots = [];
  for (let i = 0; i < TOAST_SLOTS; i++) {
    toastSlots.push({ el: el('div', 'rw-toast', toasts), until: 0, key: '' });
  }
  let toastCursor = 0;

  // ---------- wave 2: arrival banner (fires on 'systemLoaded', ~4s) ----------
  const banner = el('div', 'rw-banner', root);
  banner.setAttribute('aria-live', 'polite');
  const bannerName = el('div', 'rw-banner-name', banner);
  const bannerSub = el('div', 'rw-banner-sub', banner);
  let bannerUntil = 0; // ctx.elapsed when the banner fades

  // ---------- wave 2: jump charge indicator (center screen, thin bar) ----------
  const jumpBox = el('div', 'rw-jump is-hidden', root);
  const jumpLabel = el('div', 'rw-jump-label', jumpBox, 'JUMP');
  const jumpTrack = el('div', 'rw-bar', jumpBox);
  const jumpFill = el('div', 'rw-bar-fill', jumpTrack);

  // ---------- context prompt (§13.4, one verb, bottom-center) ----------
  const prompt = el('div', 'rw-prompt is-hidden', root);
  const promptKey = el('span', 'rw-prompt-key', prompt);
  const promptVerb = el('span', 'rw-prompt-verb', prompt);

  // ---------- Wave F: bottom bearing arc (scanner-gated; not a reticle ring) ----------
  const contacts = el('div', 'rw-contacts is-hidden', root);
  contacts.setAttribute('aria-hidden', 'true');
  const contactsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  contactsSvg.setAttribute('class', 'rw-contacts-svg');
  contactsSvg.setAttribute('viewBox', '0 0 400 72');
  contactsSvg.setAttribute('aria-hidden', 'true');
  const contactsStroke = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  contactsStroke.setAttribute('class', 'rw-contacts-stroke');
  contactsStroke.setAttribute('d', contactsArcPath());
  contactsStroke.setAttribute('fill', 'none');
  contactsSvg.appendChild(contactsStroke);
  contacts.appendChild(contactsSvg);
  const contactSlots = [];
  for (let i = 0; i < CONTACT_SLOTS; i++) {
    const pip = el('div', 'rw-contact-pip is-hidden', contacts);
    const mark = el('span', 'rw-contact-mark', pip);
    const close = el('span', 'rw-contact-close is-hidden', pip);
    contactSlots.push({
      pip, mark, close,
      shipId: '',
      shown: false,
      kind: '',
      far: false,
      aft: false,
      closeState: '',
      pulseUntil: 0,
      lastX: 0, lastY: 0, lastZ: 0,
      haveLast: false,
    });
  }
  const contactCand = [];
  for (let i = 0; i < CONTACT_CANDIDATES; i++) {
    contactCand.push({ ship: null, dist: 0, hostile: false, isLock: false });
  }
  const seenHostiles = new Set();
  const stillHostiles = new Set();
  let lastHostileEnterAt = -99;
  let lastHullBandAt = -99;

  // ---------- HUD-01: mirrored combat rails (FreeSpace-style glance) ----------
  // Sit just below midline and off the reticle so the center glass stays open.
  // Target rail starts hidden: no target / destroyed / asteroid.
  const selfRail = el('section', 'rw-combat-rail rw-combat-self rw-hair-off', root);
  const selfFacing = makeFacing(selfRail);
  const selfScreen = makeBar(selfRail, 'SCREEN', 'rw-screen');
  const selfShell = makeBar(selfRail, 'SHELL', 'rw-shell');
  const selfHull = makeHull(selfRail);
  const selfSpeed = makeSpeed(selfRail);
  const selfWpnRow = el('div', 'rw-meter rw-combat-wpn', selfRail);
  el('div', 'rw-label', selfWpnRow, 'WPN');
  const weaponName = el('div', 'rw-value', selfWpnRow, '—');

  const tgtRail = el('section', 'rw-combat-rail rw-combat-target is-hidden rw-hair-off', root);
  const tgtNameEl = el('div', 'rw-combat-name', tgtRail, '—');
  const tgtFacing = makeFacing(tgtRail);
  const tgtScreen = makeBar(tgtRail, 'SCREEN', 'rw-screen');
  const tgtShell = makeBar(tgtRail, 'SHELL', 'rw-shell');
  const tgtHull = makeHull(tgtRail);
  const tgtSpeed = makeSpeed(tgtRail);
  const tgtDistRow = el('div', 'rw-meter', tgtRail);
  el('div', 'rw-label', tgtDistRow, 'DIST');
  const tgtDistVal = el('div', 'rw-value rw-combat-dist', tgtDistRow, '—');

  const selfSize = { width: 168, height: 120 };
  const tgtSize = { width: 168, height: 120 };
  const selfHairBox = { l: 0, t: 0, r: 0, b: 0 };
  const tgtHairBox = { l: 0, t: 0, r: 0, b: 0 };
  function measureRails() {
    const sw = selfRail.offsetWidth | 0;
    const sh = selfRail.offsetHeight | 0;
    const tw = tgtRail.offsetWidth | 0;
    const th = tgtRail.offsetHeight | 0;
    if (sw > 0) selfSize.width = sw;
    if (sh > 0) selfSize.height = sh;
    if (tw > 0) tgtSize.width = tw;
    if (th > 0) tgtSize.height = th;
  }
  measureRails();
  window.addEventListener('resize', measureRails);

  // ---------- bottom strip: aux flight/defense + bio + pos ----------
  // Screen/Shell/hull/speed/weapon moved to the rails; these extras stay
  // readable at the edge and dim in combat so they do not compete.
  const bottom = el('div', 'rw-bottom', root);

  const defense = el('section', 'rw-panel rw-defense rw-aux', bottom);
  el('div', 'rw-panel-title', defense, 'Plant');
  const strainBar = makeBar(defense, 'STRAIN', 'rw-strain');
  const strainFlag = el('div', 'rw-strain-flag', strainBar.row, 'OVERHEAT');
  const engineRow = el('div', 'rw-meter rw-engine', defense);
  el('div', 'rw-label', engineRow, 'ENGINE');
  const engineValue = el('div', 'rw-value', engineRow, 'OK');

  const flight = el('section', 'rw-panel rw-flight rw-aux', bottom);
  el('div', 'rw-panel-title', flight, 'Flight');
  const throttleBar = makeBar(flight, 'THR', 'rw-throttle');
  const burnerRow = el('div', 'rw-meter rw-burner', flight);
  el('div', 'rw-label', burnerRow, 'BURN');
  const burnerState = el('div', 'rw-value', burnerRow, 'READY');
  const burnerBarTrack = el('div', 'rw-bar rw-mini', burnerRow);
  const burnerBarFill = el('div', 'rw-bar-fill', burnerBarTrack);
  const driftRow = el('div', 'rw-meter rw-drift', flight);
  el('div', 'rw-label', driftRow, 'DRIFT');
  const driftState = el('div', 'rw-value', driftRow, 'READY');
  const driftBarTrack = el('div', 'rw-bar rw-mini', driftRow);
  const driftBarFill = el('div', 'rw-bar-fill', driftBarTrack);

  const weapon = el('section', 'rw-panel rw-weapon rw-aux', bottom);
  el('div', 'rw-panel-title', weapon, 'Heat');
  const weaponStrainRow = el('div', 'rw-meter', weapon);
  el('div', 'rw-label', weaponStrainRow, 'STRAIN');
  const weaponStrain = el('div', 'rw-value', weaponStrainRow, '0%');

  const sideCol = el('div', 'rw-side-col', bottom);
  const bio = el('section', 'rw-panel rw-bio rw-fade', sideCol);
  el('div', 'rw-panel-title rw-bio-title', bio, 'Bio');
  const moodRow = el('div', 'rw-meter rw-mood', bio);
  const moodIcon = el('span', 'rw-bio-icon m-serene', moodRow);
  const moodLabel = el('div', 'rw-value', moodRow, 'SERENE');
  const hungerBar = makeBar(bio, 'HUNGER', 'rw-hunger');
  const woundsBar = makeBar(bio, 'WOUNDS', 'rw-wounds');
  const echoesRow = el('div', 'rw-meter rw-echoes', bio);
  el('div', 'rw-label', echoesRow, 'ECHOES');
  const echoesValue = el('div', 'rw-value', echoesRow, '0');

  const posPanel = el('section', 'rw-panel rw-pos rw-fade', sideCol);
  el('div', 'rw-label', posPanel, 'POS');
  const sysValue = el('div', 'rw-sysname', posPanel, '—'); // current system, above coords
  const posValue = el('div', 'rw-coords', posPanel, '—');

  // ---------- top-right resources (fades in combat §13.2) ----------
  const resources = el('section', 'rw-panel rw-resources rw-fade', root);
  el('div', 'rw-panel-title', resources, 'Manifest');
  const credRow = el('div', 'rw-meter', resources);
  el('div', 'rw-label', credRow, 'UU');
  const credValue = el('div', 'rw-value', credRow, '0');
  const fearRow = el('div', 'rw-meter', resources);
  el('div', 'rw-label', fearRow, 'FEAR');
  const fearValue = el('div', 'rw-value', fearRow, '0');
  const cargoRow = el('div', 'rw-meter', resources);
  el('div', 'rw-label', cargoRow, 'CARGO');
  const cargoValueEl = el('div', 'rw-value', cargoRow, '0/0');

  // ---------- top-left controls help (collapsible, fades in combat) ----------
  // The header button is the ONLY HUD element with pointer-events:auto so the
  // panel can actually collapse; everything else stays click-through.
  const controls = el('section', 'rw-panel rw-controls rw-fade', root);
  const controlsToggle = el('button', 'rw-controls-toggle', controls, 'CONTROLS ▾');
  controlsToggle.type = 'button';
  const controlsBody = el('div', 'rw-controls-body', controls);
  const controlsList = el('ul', '', controlsBody);
  const lines = Array.isArray(ctx.config.controls) ? ctx.config.controls : [];
  if (lines.length === 0) {
    el('li', '', controlsList, 'No bindings registered');
  } else {
    for (const line of lines) el('li', '', controlsList, String(line));
  }
  let controlsCollapsed = false;
  controlsToggle.addEventListener('click', () => {
    controlsCollapsed = !controlsCollapsed;
    controls.classList.toggle('collapsed', controlsCollapsed);
    controlsToggle.textContent = controlsCollapsed ? 'CONTROLS ▸' : 'CONTROLS ▾';
  });

  // ---------- scratch (no per-frame allocation) ----------
  const proj = new THREE.Vector3(); // projected target NDC
  const leadProj = new THREE.Vector3(); // projected lead point
  const leadWorld = new THREE.Vector3(); // targetPos + vel*tof
  const velInst = new THREE.Vector3(); // instantaneous velocity sample
  const targetVel = new THREE.Vector3(); // smoothed target velocity
  const lastTargetPos = new THREE.Vector3();
  const relVel = new THREE.Vector3();
  const playerFwd = new THREE.Vector3();
  const lockFwd = new THREE.Vector3();
  const toLock = new THREE.Vector3();
  const contactRel = new THREE.Vector3();
  const contactRight = new THREE.Vector3();
  const contactVel = new THREE.Vector3();
  const chartProj = new THREE.Vector3(); // charted landmark world→NDC (wave 15)
  let lastTargetRef = null;
  let targetDistNow = 0;
  let targetSpeedNow = 0;

  // ---------- change-detection cache ----------
  const last = {
    retX: -1, retY: -1, fp: null,
    bracketShown: null, leadShown: null, arrowShown: null, bx: -1, by: -1,
    band: '', tName: '', tMeta: '', tResolve: '', oreBlocked: null,
    strainFlag: null, engine: '',
    burner: '', drift: '', driftActive: null,
    burnerPct: -1, driftPct: -1,
    weapon: '', weaponStrain: '',
    targetRail: null, railName: '', railDist: -1, inRange: null,
    credits: -1, fear: -1, cargo: '',
    mood: '', echoes: -1, combat: null, contactsShown: null,
    prompt: '',
    promptSalvage: false,
    posX: NaN, posY: NaN, posZ: NaN,
    system: '', jumpShown: null, jumpPct: -1, jumpDest: null,
    family: '', kind: undefined, faction: undefined, hudOverride: undefined,
    leadX: 0, leadY: 0, selfHairOff: true, tgtHairOff: true,
    bioPeriod: 4, textScale: ctx.settings?.textScale ?? 1,
    matchLamp: null, hullBand: '',
  };
  const mem = { lastFear: Math.round(ctx.world.fear ?? 0), frameLines: [] };

  {
    const p0 = ctx.player;
    last.kind = p0 ? p0.hullKind : undefined;
    last.faction = p0 ? p0.faction : undefined;
    last.hudOverride = sessionHudFamilyOverride();
    last.family = hudFamily(ctx);
    root.dataset.family = last.family;
    root.style.setProperty('--rw-bio-period', '4s');
  }

  function emitFamilyTick(family, type, data) {
    if (ctx.settings && ctx.settings.reducedMotion) return;
    if (hudFamily(ctx) !== family) return;
    ctx.emit(type, data);
  }

  let textAccum = TEXT_UPDATE_INTERVAL; // refresh text on first frame
  let selfHitFlashUntil = 0;
  let selfHitFlashAft = false;

  function pushToast(text, cls) {
    if (!text) return;
    const now = ctx.elapsed;
    const key = cls + '|' + text;
    for (const s of toastSlots) {
      if (s.until > now && s.key === key) { s.until = now + TOAST_LIFETIME; return; }
    }
    let slot = null;
    for (let i = 0; i < TOAST_SLOTS; i++) {
      const s = toastSlots[(toastCursor + i) % TOAST_SLOTS];
      if (s.until <= now) { slot = s; toastCursor = (toastCursor + i + 1) % TOAST_SLOTS; break; }
    }
    if (!slot) { // all busy: overwrite the one expiring soonest
      slot = toastSlots[0];
      for (const s of toastSlots) if (s.until < slot.until) slot = s;
    }
    slot.key = key;
    slot.until = now + TOAST_LIFETIME;
    slot.el.textContent = text;
    slot.el.className = 'rw-toast show ' + cls;
  }

  return {
    update(dt) {
      const cam = ctx.camera;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw * 0.5;
      const cy = vh * 0.5;

      // --- consume this frame's events → toasts (hud runs last; queue is
      // cleared by main.js right after us) ---
      mem.frameLines.length = 0; // per-frame clue/landmark dedupe scratch
      const evs = ctx.events;
      for (let i = 0; i < evs.length; i++) {
        const ev = evs[i];
        if (ev.type === 'playerHit') {
          selfHitFlashUntil = ctx.elapsed + 0.4;
          selfHitFlashAft = !!ev.fromAft;
        }
        const t = toastForEvent(ev, ctx, mem);
        if (t) pushToast(t.text, t.cls);
      }
      // expire toasts
      const nowReal = ctx.elapsed;
      for (const s of toastSlots) {
        if (s.until > 0 && nowReal > s.until) {
          s.until = 0;
          s.key = '';
          s.el.classList.remove('show');
        }
      }

      // --- wave 2: arrival banner. Frozen jump flow delivers 'systemLoaded'
      // to consumers via lastEvents (the previous frame's queue) ---
      const prevEvs = ctx.lastEvents;
      for (let i = 0; i < prevEvs.length; i++) {
        const e = prevEvs[i];
        if (e.type !== 'systemLoaded') continue;
        const def = SYSTEMS[e.to];
        const fac = def && FACTIONS[def.faction];
        bannerName.textContent = def ? def.name : String(e.to ?? '—');
        bannerSub.textContent = fac ? fac.name + ' space' : '';
        bannerSub.style.display = fac ? '' : 'none';
        bannerUntil = nowReal + TOAST_LIFETIME;
        banner.classList.add('show');
      }
      if (bannerUntil > 0 && nowReal > bannerUntil) {
        bannerUntil = 0;
        banner.classList.remove('show');
      }

      // --- wave 2: jump charge indicator (bar tracks ctx.gate.progress 0→1) ---
      const jumping = !!ctx.gate.jumping;
      if (jumping !== last.jumpShown) {
        last.jumpShown = jumping;
        jumpBox.classList.toggle('is-hidden', !jumping);
      }
      if (jumping) {
        const destId = ctx.gate.destination;
        if (destId !== last.jumpDest) {
          last.jumpDest = destId;
          const destDef = SYSTEMS[destId];
          jumpLabel.textContent = 'JUMP — ' + (destDef ? destDef.name : String(destId ?? ''));
        }
        const jp = Math.round(Math.max(0, Math.min(1, ctx.gate.progress || 0)) * 100);
        if (jp !== last.jumpPct) {
          last.jumpPct = jp;
          jumpFill.style.width = jp + '%';
        }
      }

      // --- reticle: drifts from center with the mouse (reticleScreen is a
      // pixel offset from screen center); centered in first-person (§5.4) ---
      const fp = !!ctx.flags.firstPerson;
      const rs = ctx.targets.reticleScreen;
      let rx = fp ? 0 : rs.x;
      let ry = fp ? 0 : rs.y;
      const mx = cx - 44, my = cy - 44; // keep the 80 px hub on glass
      if (rx > mx) rx = mx; else if (rx < -mx) rx = -mx;
      if (ry > my) ry = my; else if (ry < -my) ry = -my;
      if (rx !== last.retX || ry !== last.retY) {
        last.retX = rx; last.retY = ry;
        reticle.style.transform = 'translate3d(' + (cx + rx) + 'px,' + (cy + ry) + 'px,0)';
      }
      if (fp !== last.fp) {
        last.fp = fp;
        root.classList.toggle('first-person', fp);
      }

      // --- target bracket / lead / edge arrow (positions every frame) ---
      const target = ctx.targets.current;
      const targetPos = target && (target.object ? target.object.position : target.position);
      const targetDead = target && target.state && target.state.destroyed;
      const shipObj = ctx.ship.object;
      const fromPos = shipObj ? shipObj.position : cam.position;

      // Target combat rail: live ship only. Hide for no target, destroyed,
      // or asteroid (rocks keep the bracket ore readout, never ship vitals).
      const shipTgt = !!(target && target.state && !target.state.destroyed && targetPos);
      if (shipTgt !== last.targetRail) {
        last.targetRail = shipTgt;
        tgtRail.classList.toggle('is-hidden', !shipTgt);
        if (!shipTgt) {
          last.railName = '';
          last.railDist = -1;
        } else {
          textAccum = TEXT_UPDATE_INTERVAL;
        }
      }

      if (!targetPos || targetDead) {
        if (last.bracketShown !== false) { last.bracketShown = false; bracket.classList.add('is-hidden'); }
        if (last.leadShown !== false) { last.leadShown = false; lead.classList.add('is-hidden'); }
        if (last.arrowShown !== false) { last.arrowShown = false; edgeArrow.classList.add('is-hidden'); }
        lastTargetRef = null;
        targetDistNow = 0;
        targetSpeedNow = 0;
      } else {
        // estimate target velocity from position deltas (works for live ships;
        // asteroids sit still so their pip hides itself)
        if (target !== lastTargetRef) {
          lastTargetRef = target;
          lastTargetPos.copy(targetPos);
          targetVel.set(0, 0, 0);
        } else if (dt > 0) {
          // clamp dt so a hiccup frame can't blow up (or zero out) the estimate
          const vdt = Math.min(dt, 0.1);
          velInst.copy(targetPos).sub(lastTargetPos).divideScalar(vdt);
          targetVel.lerp(velInst, Math.min(1, vdt * 8));
          lastTargetPos.copy(targetPos);
        }

        const dist = fromPos.distanceTo(targetPos);
        targetDistNow = dist;
        targetSpeedNow = shipTgt ? targetVel.length() : 0;
        proj.copy(targetPos).project(cam);
        let ndcX = proj.x, ndcY = proj.y;
        const behind = proj.z > 1;
        if (behind) { ndcX = -ndcX; ndcY = -ndcY; }
        const onScreen = !behind && ndcX >= -0.95 && ndcX <= 0.95 && ndcY >= -0.92 && ndcY <= 0.92;

        if (onScreen) {
          if (last.bracketShown !== true) { last.bracketShown = true; bracket.classList.remove('is-hidden'); }
          if (last.arrowShown !== false) { last.arrowShown = false; edgeArrow.classList.add('is-hidden'); }
          const bxs = Math.round((ndcX * 0.5 + 0.5) * vw);
          const bys = Math.round((-ndcY * 0.5 + 0.5) * vh);
          if (bxs !== last.bx || bys !== last.by) {
            last.bx = bxs; last.by = bys;
            bracket.style.transform = 'translate3d(' + bxs + 'px,' + bys + 'px,0)';
          }

          // Lead reticle: selected-weapon TOF. Mining hides. Empty group 4
          // has no speed (no cannon fallback). A seated dart uses missile
          // speed; the pip is advisory because the shot then turns.
          const wKeyLead = hudWeaponKey(ctx);
          const wLead = WEAPONS[wKeyLead];
          const wSpeed = wKeyLead === 'mining' ? 0 : (wLead?.speed ?? 0);
          relVel.copy(targetVel).sub(ctx.ship.velocity);
          const showLead = shipTgt && wSpeed > 0;
          if (showLead) {
            const tof = dist / wSpeed;
            leadWorld.copy(targetPos);
            if (relVel.length() > LEAD_MIN_SPEED) {
              leadWorld.addScaledVector(relVel, tof);
            }
            leadProj.copy(leadWorld).project(cam);
            if (leadProj.z < 1 && Math.abs(leadProj.x) <= 1 && Math.abs(leadProj.y) <= 1) {
              if (last.leadShown !== true) { last.leadShown = true; lead.classList.remove('is-hidden'); }
              last.leadX = (leadProj.x * 0.5 + 0.5) * vw;
              last.leadY = (-leadProj.y * 0.5 + 0.5) * vh;
              lead.style.transform = 'translate3d(' + last.leadX + 'px,' + last.leadY + 'px,0)';
            } else if (last.leadShown !== false) {
              last.leadShown = false; lead.classList.add('is-hidden');
            }
          } else if (last.leadShown !== false) {
            last.leadShown = false; lead.classList.add('is-hidden');
          }
        } else {
          // off-screen: edge arrow pointing toward the target
          if (last.bracketShown !== false) { last.bracketShown = false; bracket.classList.add('is-hidden'); }
          if (last.leadShown !== false) { last.leadShown = false; lead.classList.add('is-hidden'); }
          if (last.arrowShown !== true) { last.arrowShown = true; edgeArrow.classList.remove('is-hidden'); }
          const dirX = ndcX * cx;
          const dirY = -ndcY * cy;
          const ax = Math.abs(dirX), ay = Math.abs(dirY);
          let s = Infinity;
          if (ax > 1e-4) s = (cx - EDGE_MARGIN) / ax;
          if (ay > 1e-4) s = Math.min(s, (cy - EDGE_MARGIN) / ay);
          if (!Number.isFinite(s)) s = 1;
          const px = cx + dirX * s;
          const py = cy + dirY * s;
          const ang = Math.atan2(dirY, dirX) + Math.PI / 2; // glyph points up at 0
          edgeArrow.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0) rotate(' + ang + 'rad)';
        }
      }

      if (last.family === 'bio') {
        const combatHair = root.classList.contains('in-combat');
        const hx = cx + rx;
        const hy = cy + ry;
        const okH = vw > 0 && vh > 0;
        hairBoxForRail('self', vw, vh, selfSize.width, selfSize.height, combatHair, selfHairBox);
        hairBoxForRail('tgt', vw, vh, tgtSize.width, tgtSize.height, combatHair, tgtHairBox);
        const hideSelf = !okH || agezHairOff(hx, hy, last.leadShown === true, last.leadX, last.leadY, selfHairBox);
        const hideTgt = !okH || agezHairOff(hx, hy, last.leadShown === true, last.leadX, last.leadY, tgtHairBox);
        if (hideSelf !== last.selfHairOff) {
          last.selfHairOff = hideSelf;
          selfRail.classList.toggle('rw-hair-off', hideSelf);
        }
        if (hideTgt !== last.tgtHairOff) {
          last.tgtHairOff = hideTgt;
          tgtRail.classList.toggle('rw-hair-off', hideTgt);
        }
      }

      // Range pop (Wave D): selected weapon envelope. Mining uses the head.
      {
        const wKeyR = hudWeaponKey(ctx);
        const range = wKeyR === 'mining'
          ? miningLaserFor(ctx.world.miningLaser).range
          : (WEAPONS[wKeyR]?.range ?? 0);
        const inRange = !!(shipTgt && range > 0 && targetDistNow <= range);
        if (inRange !== last.inRange) {
          last.inRange = inRange;
          reticle.classList.toggle('in-range', inRange);
          if (inRange) emitFamilyTick('mech', 'hudMechRange', {});
        }
      }

      // Facing glance (Wave C). No lock → both self ends dim.
      {
        const flashing = ctx.elapsed < selfHitFlashUntil;
        if (!shipTgt || !shipObj || !targetPos) {
          selfFacing.set(flashing ? (selfHitFlashAft ? 'flash-aft' : 'flash-fore') : 'dim');
          tgtFacing.set('dim');
        } else {
          playerFwd.set(0, 0, -1).applyQuaternion(shipObj.quaternion);
          toLock.copy(targetPos).sub(shipObj.position);
          let selfMode = playerFwd.dot(toLock) >= 0 ? 'fore' : 'aft';
          if (flashing) selfMode = selfHitFlashAft ? 'flash-aft' : 'flash-fore';
          selfFacing.set(selfMode);
          if (target.object?.quaternion) {
            lockFwd.set(0, 0, -1).applyQuaternion(target.object.quaternion);
            toLock.copy(shipObj.position).sub(target.object.position);
            tgtFacing.set(lockFwd.dot(toLock) >= 0 ? 'fore' : 'aft');
          } else {
            tgtFacing.set('dim');
          }
        }
      }

      // Wave F contacts: scanner-gated bottom arc. Core ships keep DIST /
      // edge / lead / MATCH. Hide while docked. No reticle ring.
      {
        const scanner = ctx.world.scanner ?? 0;
        const showArc = scanner >= 1 && !ctx.flags.docked && !!shipObj;
        if (showArc !== last.contactsShown) {
          last.contactsShown = showArc;
          contacts.classList.toggle('is-hidden', !showArc);
        }
        if (!showArc) {
          if (seenHostiles.size) seenHostiles.clear();
          for (let i = 0; i < CONTACT_SLOTS; i++) {
            const s = contactSlots[i];
            if (s.shown) {
              s.shown = false;
              s.pip.classList.add('is-hidden');
            }
            s.shipId = '';
            s.haveLast = false;
          }
        } else {
          const range = scanner >= 2 ? U.ENCOUNTER_BUBBLE * 2 : U.ENCOUNTER_BUBBLE;
          const cap = scanner >= 2 ? CONTACT_SLOTS : CONTACT_MK1_CAP;
          const lockObj = shipTgt && target ? (target.object || null) : null;
          let nCand = 0;
          const list = ctx.ships;
          if (list) {
            for (let i = 0; i < list.length && nCand < CONTACT_CANDIDATES; i++) {
              const live = list[i];
              const obj = live && live.object;
              if (!obj || obj === shipObj) continue;
              if (live.state && live.state.destroyed) continue;
              const dist = shipObj.position.distanceTo(obj.position);
              if (dist > range) continue;
              const row = contactCand[nCand++];
              row.ship = live;
              row.dist = dist;
              row.hostile = !!(live.ai && live.ai.intent);
              row.isLock = !!(lockObj && obj === lockObj);
            }
          }
          for (let a = 1; a < nCand; a++) {
            const row = contactCand[a];
            let b = a;
            while (b > 0) {
              const prev = contactCand[b - 1];
              const worse = row.isLock !== prev.isLock ? !row.isLock
                : row.hostile !== prev.hostile ? !row.hostile
                : row.dist >= prev.dist;
              if (worse) break;
              contactCand[b] = prev;
              b--;
            }
            contactCand[b] = row;
          }
          const take = nCand < cap ? nCand : cap;
          stillHostiles.clear();
          playerFwd.set(0, 0, -1).applyQuaternion(shipObj.quaternion);
          contactRight.set(1, 0, 0).applyQuaternion(shipObj.quaternion);
          const nowT = ctx.elapsed;
          for (let i = 0; i < take; i++) {
            const row = contactCand[i];
            const live = row.ship;
            const obj = live.object;
            const id = live.id || (live.record && live.record.id) || ('i' + i);
            const slot = contactSlots[i];
            const kind = contactKind(row.hostile, row.isLock);
            if (slot.shown !== true) {
              slot.shown = true;
              slot.pip.classList.remove('is-hidden');
            }
            contactRel.copy(obj.position).sub(shipObj.position);
            const side = contactRel.dot(contactRight);
            const fwd = contactRel.dot(playerFwd);
            const yaw = Math.atan2(side, fwd);
            const u = contactYawToU(yaw);
            const elev = Math.max(-1, Math.min(1, contactRel.y / 40));
            contactArcPoint(u, elev, _arcPt);
            slot.pip.style.transform = 'translate3d(' + _arcPt.x + 'px,' + _arcPt.y + 'px,0)';
            const aft = Math.abs(yaw) > Math.PI * 0.5;
            const far = !!(ctx.flags.combat && !row.hostile && !row.isLock && row.dist > range * 0.45);
            if (slot.kind !== kind) {
              slot.kind = kind;
              slot.aft = aft;
              slot.far = far;
              slot.pip.className = 'rw-contact-pip is-' + kind + (aft ? ' is-aft' : '') + (far ? ' is-far' : '');
            } else {
              if (aft !== slot.aft) {
                slot.aft = aft;
                slot.pip.classList.toggle('is-aft', aft);
              }
              if (far !== slot.far) {
                slot.far = far;
                slot.pip.classList.toggle('is-far', far);
              }
            }
            let closeState = '';
            if (row.isLock && scanner >= 2) {
              if (slot.shipId === id && slot.haveLast && dt > 0 && dt < 0.2) {
                contactVel.set(obj.position.x - slot.lastX, obj.position.y - slot.lastY, obj.position.z - slot.lastZ);
                contactVel.divideScalar(dt);
                if (ctx.ship.velocity) contactVel.sub(ctx.ship.velocity);
                const along = contactRel.lengthSq() > 1e-4
                  ? contactVel.dot(contactRel) / Math.sqrt(contactRel.lengthSq())
                  : 0;
                if (along < -CONTACT_CLOSE_FLOOR) closeState = 'in';
                else if (along > CONTACT_CLOSE_FLOOR) closeState = 'out';
              }
            }
            if (closeState !== slot.closeState) {
              slot.closeState = closeState;
              slot.close.classList.toggle('is-hidden', !closeState);
              slot.close.textContent = closeState === 'in' ? '«' : closeState === 'out' ? '»' : '';
            }
            slot.lastX = obj.position.x;
            slot.lastY = obj.position.y;
            slot.lastZ = obj.position.z;
            slot.haveLast = true;
            if (row.hostile) {
              stillHostiles.add(id);
              if (!seenHostiles.has(id)) {
                seenHostiles.add(id);
                slot.pulseUntil = nowT + CONTACT_PULSE;
                if (scanner >= 1 && !(ctx.settings && ctx.settings.reducedMotion)) {
                  const fam = hudFamily(ctx);
                  if (fam === 'mech') ctx.emit('hudMechContact', { id });
                  else if (fam === 'bio' && nowT - lastHostileEnterAt >= 0.5) {
                    lastHostileEnterAt = nowT;
                    ctx.emit('hostileEnter', { id });
                  }
                }
              }
            }
            const pulsing = slot.pulseUntil > nowT;
            slot.pip.classList.toggle('is-enter', pulsing);
            if (!pulsing && slot.pulseUntil) slot.pulseUntil = 0;
            slot.shipId = id;
          }
          for (const id of seenHostiles) {
            if (!stillHostiles.has(id)) seenHostiles.delete(id);
          }
          for (let i = take; i < CONTACT_SLOTS; i++) {
            const s = contactSlots[i];
            if (s.shown) {
              s.shown = false;
              s.pip.classList.add('is-hidden');
            }
            s.shipId = '';
            s.haveLast = false;
            s.pulseUntil = 0;
          }
        }
      }

      // --- wave 15: charted landmark markers (positions every frame) ---
      // mystery is read FRESH each frame — save.js swaps the record on
      // restore (landmarks.js identity-watch discipline); ?? guards cover old
      // saves with no mystery record. A landmark already witnessed
      // (mystery.visited) no longer needs its mark; docking hides them all
      // (station screen is up — these are flight instruments).
      const mystery = ctx.world.mystery;
      const charted = mystery?.charted ?? EMPTY_LIST;
      const unvisited = mystery?.visited ?? EMPTY_LIST;
      const curLandmarks = SYSTEMS[ctx.world.currentSystem]?.landmarks ?? EMPTY_LIST;
      let cmSlot = 0;
      if (!ctx.flags.docked) {
        for (let i = 0; i < curLandmarks.length && cmSlot < CHARTMARK_SLOTS; i++) {
          const lm = curLandmarks[i];
          if (charted.indexOf(lm.id) === -1 || unvisited.indexOf(lm.id) !== -1) continue;
          const s = chartSlots[cmSlot++];
          s.lmId = lm.id;
          s.lmName = lm.name;
          chartProj.set(lm.position[0], lm.position[1], lm.position[2]);
          s.dist = fromPos.distanceTo(chartProj);
          chartProj.project(cam);
          let mdx = chartProj.x, mdy = chartProj.y;
          if (chartProj.z > 1) { mdx = -mdx; mdy = -mdy; } // behind camera: flip
          let mpx = (mdx * 0.5 + 0.5) * vw;
          let mpy = (-mdy * 0.5 + 0.5) * vh;
          // off-screen: edge-clamp like the target arrow's EDGE_MARGIN inset
          if (mpx < EDGE_MARGIN) mpx = EDGE_MARGIN; else if (mpx > vw - EDGE_MARGIN) mpx = vw - EDGE_MARGIN;
          if (mpy < EDGE_MARGIN) mpy = EDGE_MARGIN; else if (mpy > vh - EDGE_MARGIN) mpy = vh - EDGE_MARGIN;
          const mrx = Math.round(mpx), mry = Math.round(mpy);
          if (mrx !== s.x || mry !== s.y) {
            s.x = mrx; s.y = mry;
            s.box.style.transform = 'translate3d(' + mrx + 'px,' + mry + 'px,0)';
          }
          if (s.shown !== true) { s.shown = true; s.box.classList.remove('is-hidden'); }
        }
      }
      for (let i = cmSlot; i < CHARTMARK_SLOTS; i++) {
        const s = chartSlots[i];
        if (s.shown !== false) { s.shown = false; s.box.classList.add('is-hidden'); }
        s.lmId = '';
      }

      // ---------- throttled text / bars (~5 Hz, write-on-change) ----------
      textAccum += dt;
      if (textAccum < TEXT_UPDATE_INTERVAL) return;
      textAccum = 0;

      const pFam = ctx.player;
      const kindNow = pFam ? pFam.hullKind : undefined;
      const facNow = pFam ? pFam.faction : undefined;
      const overNow = sessionHudFamilyOverride();
      if (kindNow !== last.kind || facNow !== last.faction || overNow !== last.hudOverride) {
        last.kind = kindNow;
        last.faction = facNow;
        last.hudOverride = overNow;
        const family = hudFamily(ctx);
        if (family !== last.family) {
          last.family = family;
          root.dataset.family = family;
          if (family === 'bio') {
            last.selfHairOff = true;
            last.tgtHairOff = true;
            selfRail.classList.add('rw-hair-off');
            tgtRail.classList.add('rw-hair-off');
          }
        }
      }

      const tsNow = ctx.settings ? ctx.settings.textScale : 1;
      if (tsNow !== last.textScale) {
        last.textScale = tsNow;
        measureRails();
      }

      const player = ctx.player;
      const now = ctx.world.time;

      // combat fade (§13.2): resources + controls dim, combat set stays lit
      const combat = !!ctx.flags.combat;
      if (combat !== last.combat) {
        last.combat = combat;
        root.classList.toggle('in-combat', combat);
        if (combat) {
          controlsCollapsed = true;
          controls.classList.add('collapsed');
          controlsToggle.textContent = 'CONTROLS ▸';
        }
      }

      // wave 15: charted marker labels — landmark name + distance (bracket's
      // ' · N u' convention, k-abbreviated past 1000); write-on-change per
      // slot, keyed on assigned landmark id + rounded distance bucket
      for (let i = 0; i < CHARTMARK_SLOTS; i++) {
        const s = chartSlots[i];
        if (!s.shown) continue;
        const bucket = s.dist >= 1000 ? Math.round(s.dist / 100) : Math.round(s.dist / 10);
        if (s.lmId !== s.textId || bucket !== s.textBucket) {
          s.textId = s.lmId; s.textBucket = bucket;
          s.label.textContent = s.dist >= 1000
            ? s.lmName + ' · ' + (Math.round(s.dist / 100) / 10) + 'k'
            : s.lmName + ' · ' + Math.round(s.dist) + 'u';
        }
      }

      // player defense (§6.4): screen = thin outer bar, shell = thick inner,
      // hull = scale-petals (§14.9) on the self rail; strain/engine stay aux
      if (player) {
        selfScreen.set((player.screen / player.screenMax) * 100);
        selfShell.set((player.shell / player.shellMax) * 100);
        const hullFrac = player.hullMax > 0 ? player.hull / player.hullMax : 0;
        selfHull.set(hullFrac);
        const hullBandNow = hullFrac > 0.5 ? 'ok' : hullFrac > 0.25 ? 'warn' : 'crit';
        if (hullBandNow !== last.hullBand) {
          last.hullBand = hullBandNow;
          if (hullBandNow !== 'ok' && ctx.elapsed - lastHullBandAt >= 2) {
            lastHullBandAt = ctx.elapsed;
            emitFamilyTick('bio', 'hullBand', { band: hullBandNow });
          }
        }
        strainBar.set((player.heat / HEAT.max) * 100);
        const oh = !!player.overheated;
        if (oh !== last.strainFlag) {
          last.strainFlag = oh;
          strainBar.row.classList.toggle('overheated', oh);
          strainFlag.style.display = oh ? '' : 'none';
        }
        const eng = player.engineOut ? 'OUT' : player.engine < player.engineMax * 0.999 ? 'DAMAGED' : 'OK';
        if (eng !== last.engine) {
          last.engine = eng;
          engineValue.textContent = eng;
          engineRow.dataset.state = eng;
        }
      }

      // flight: speed on the self rail; throttle / afterburner / drift stay aux
      const matchOn = !!(ctx.flags.matchSpeed && (shipTgt || isRockLock(target)));
      selfSpeed.set(ctx.ship.speed, matchOn);
      if (matchOn !== last.matchLamp) {
        last.matchLamp = matchOn;
        if (matchOn) emitFamilyTick('mech', 'hudMechMatch', {});
      }
      throttleBar.set(ctx.input.throttle * 100);

      const burnerCd = ctx.config.ship.afterburner.cooldown || 1;
      let bState, bPct;
      if (ctx.ship.burnerActive) { bState = 'BURNING'; bPct = 100; }
      else if (now < ctx.ship.burnerReadyAt) {
        bState = 'COOLDOWN';
        bPct = (1 - (ctx.ship.burnerReadyAt - now) / burnerCd) * 100;
      } else { bState = 'READY'; bPct = 100; }
      if (bState !== last.burner) {
        last.burner = bState;
        burnerState.textContent = bState;
        burnerRow.dataset.state = bState;
      }
      const bR = Math.round(bPct);
      if (bR !== last.burnerPct) { last.burnerPct = bR; burnerBarFill.style.width = bR + '%'; }

      const driftCd = ctx.config.ship.drift.cooldown || 1;
      let dState, dPct;
      if (ctx.ship.driftActive) { dState = 'HOLD'; dPct = 100; }
      else if (now < ctx.ship.driftReadyAt) {
        dState = 'COOLDOWN';
        dPct = (1 - (ctx.ship.driftReadyAt - now) / driftCd) * 100;
      } else { dState = 'READY'; dPct = 100; }
      if (dState !== last.drift) {
        last.drift = dState;
        driftState.textContent = dState;
        driftRow.dataset.state = dState;
      }
      const dR = Math.round(dPct);
      if (dR !== last.driftPct) { last.driftPct = dR; driftBarFill.style.width = dR + '%'; }
      const dActive = !!ctx.ship.driftActive;
      if (dActive !== last.driftActive) {
        last.driftActive = dActive;
        flight.classList.toggle('drift-active', dActive);
      }

      // weapon group + strain readout (group 3 still names the installed head)
      const wLabel = weaponHudLabel(ctx);
      if (wLabel !== last.weapon) { last.weapon = wLabel; weaponName.textContent = wLabel; }
      const wStrain = player ? Math.round((player.heat / HEAT.max) * 100) + '%' : '—';
      if (wStrain !== last.weaponStrain) { last.weaponStrain = wStrain; weaponStrain.textContent = wStrain; }

      // resources (non-critical, fades in combat)
      const credits = Math.round(ctx.world.credits);
      if (credits !== last.credits) { last.credits = credits; credValue.textContent = String(credits); }
      const fear = Math.round(ctx.world.fear);
      if (fear !== last.fear) { last.fear = fear; fearValue.textContent = String(fear); }
      let used = 0;
      for (const c of ctx.cargo) used += c.units;
      const cargoStr = used + '/' + ctx.cargoCapacity;
      if (cargoStr !== last.cargo) { last.cargo = cargoStr; cargoValueEl.textContent = cargoStr; }

      // bio companion: mood icon+label, hunger and wounds pips (vein green)
      const mood = ctx.bio.mood || 'serene';
      if (mood !== last.mood) {
        last.mood = mood;
        moodLabel.textContent = mood.toUpperCase();
        moodIcon.className = 'rw-bio-icon m-' + mood;
      }
      const reducedMotion = !!(ctx.settings && ctx.settings.reducedMotion);
      const moodPeriod = bioPeriodSec(mood, reducedMotion);
      if (moodPeriod !== last.bioPeriod) {
        last.bioPeriod = moodPeriod;
        root.style.setProperty('--rw-bio-period', moodPeriod ? moodPeriod + 's' : '0s');
      }
      hungerBar.set(ctx.bio.hunger * 100);
      woundsBar.set(ctx.bio.wounds * 100);
      woundsBar.row.classList.toggle('hurt', ctx.bio.wounds > 0.35);
      const echoes = ctx.world.mystery ? ctx.world.mystery.found.length : 0;
      if (echoes !== last.echoes) { last.echoes = echoes; echoesValue.textContent = String(echoes); }

      // position readout (bottom-right): current system name above coordinates
      const sysDef = SYSTEMS[ctx.world.currentSystem];
      const sysLabel = sysDef ? sysDef.name : '—';
      if (sysLabel !== last.system) {
        last.system = sysLabel;
        sysValue.textContent = sysLabel;
      }
      if (shipObj) {
        const p = shipObj.position;
        const x = Math.round(p.x), y = Math.round(p.y), z = Math.round(p.z);
        if (x !== last.posX || y !== last.posY || z !== last.posZ) {
          last.posX = x; last.posY = y; last.posZ = z;
          posValue.textContent = 'X ' + x + '  Y ' + y + '  Z ' + z;
        }
      }

      // target bracket text: name/faction, distance, resolve band (+numeric
      // with a Wolfeye scanner, §7.4); band also changes bracket shape (§7.3)
      if (last.bracketShown && target) {
        const isShip = !!(target.state || target.object);
        let name, meta, resText = '', band = 'neutral', blocked = false;
        const dist = Math.round(fromPos.distanceTo(targetPos));
        if (isShip) {
          const st = target.state;
          // wave 31: a Q-ship's record lies until it reveals; the Mk II
          // Wolfeye reads the hidden gunports through the disguise.
          const rec = target.record;
          const masked = !!(rec && rec.qship) && !rec.revealed;
          const pierced = masked && (ctx.world.scanner ?? 0) >= 2;
          let key = (st && st.faction) || rec?.faction || 'independent';
          name = rec?.name ?? (st && st.name) ?? 'CONTACT';
          if (masked && !pierced) {
            name = rec.coverName ?? name;
            key = rec.coverFaction ?? key;
          }
          meta = (FACTIONS[key]?.name ?? key) + ' · ' + dist + 'u';
          if (pierced) meta += ' · CONCEALED MOUNTS';
          if (st && st.disabled) {
            band = 'capitulate';
            resText = 'DEAD IN SPACE';
          } else if (st && typeof st.resolve === 'number') {
            band = resolveBand(st.resolve);
            resText = BAND_LABEL[band];
            if ((ctx.world.scanner ?? 0) >= 1) resText += ' ' + Math.round(st.resolve);
          }
        } else {
          name = 'ASTEROID';
          // wave 51: ore readout with a hardness gate. target.ore is the
          // remaining UNIT COUNT — the old COMMODITIES[target.ore] lookup
          // keyed a table by a number, always missed, and the bracket read
          // the literal 'Ore' since the day it shipped. Wave-51 entries
          // carry commodity/oreKey/hardness (batch contract).
          const oreName = COMMODITIES[target.commodity]?.name ?? 'Ore';
          const hardness = target.hardness ?? ORE_TYPES[target.oreKey]?.hardness ?? 1;
          const laser = miningLaserFor(ctx.world.miningLaser);
          if (hardness <= laser.tier) {
            meta = oreName + ' · H' + hardness + ' · ' + Math.round(target.ore) + 'u left · ' + dist + 'u';
          } else {
            // too hard: name the cheapest head whose tier clears the rock
            // (MINING_LASERS is tier-ordered, first match wins)
            blocked = true;
            let needs = MINING_LASERS[MINING_LASERS.length - 1];
            for (let li = 0; li < MINING_LASERS.length; li++) {
              if (MINING_LASERS[li].tier >= hardness) { needs = MINING_LASERS[li]; break; }
            }
            meta = oreName + ' · H' + hardness + ' · NEEDS ' + needs.name + ' · ' + dist + 'u';
          }
        }
        if (name !== last.tName) { last.tName = name; tName.textContent = name; }
        if (meta !== last.tMeta) { last.tMeta = meta; tMeta.textContent = meta; }
        if (blocked !== last.oreBlocked) {
          last.oreBlocked = blocked;
          bracket.classList.toggle('ore-blocked', blocked);
        }
        if (resText !== last.tResolve) {
          last.tResolve = resText;
          tResolve.textContent = resText;
          tResolve.style.display = resText ? '' : 'none';
        }
        if (band !== last.band) {
          last.band = band;
          bracket.dataset.band = band;
        }
      }

      // HUD-01 target rail: ship vitals + name + distance (standard, not gated)
      if (last.targetRail && target && target.state) {
        const st = target.state;
        const rec = target.record;
        const masked = !!(rec && rec.qship) && !rec.revealed;
        const pierced = masked && (ctx.world.scanner ?? 0) >= 2;
        let railName = rec?.name ?? st.name ?? 'CONTACT';
        if (masked && !pierced) railName = rec.coverName ?? railName;
        if (railName !== last.railName) {
          last.railName = railName;
          tgtNameEl.textContent = railName;
          measureRails();
        }
        const distU = Math.round(targetDistNow);
        if (distU !== last.railDist) {
          last.railDist = distU;
          tgtDistVal.textContent = distU + ' u';
        }
        tgtScreen.set(st.screenMax > 0 ? (st.screen / st.screenMax) * 100 : 0);
        tgtShell.set(st.shellMax > 0 ? (st.shell / st.shellMax) * 100 : 0);
        tgtHull.set(st.hullMax > 0 ? st.hull / st.hullMax : 0);
        tgtSpeed.set(targetSpeedNow);
      }

      // context prompt (§13.4): one verb, explicit focus, priority order.
      // Gate sits below dock (zones never overlap in practice).
      let pKey = '', pVerb = '';
      if (ctx.station?.inZone && !ctx.flags.docked) {
        pKey = 'D'; pVerb = 'Dock';
      } else if (ctx.gate.inZone && ctx.gate.nearTo && !ctx.flags.docked && !ctx.gate.jumping) {
        const destDef = SYSTEMS[ctx.gate.nearTo];
        const destName = destDef ? destDef.name : String(ctx.gate.nearTo);
        if (ctx.gate.nearHub) {
          // Lamplighter junction: G cycles hub.routes, D jumps the selection.
          pKey = 'G';
          pVerb = 'route ' + (ctx.gate.nearRouteIndex + 1) + '/' + ctx.gate.nearRouteCount + ' · D — Jump to ' + destName;
        } else {
          pKey = 'D'; pVerb = 'Jump to ' + destName;
        }
      } else if (target && target.state && !target.state.destroyed) {
        if (target.state.disabled && targetDistNow <= U.TARGET_RANGE) {
          pKey = 'H';
          pVerb = 'Hail — dead in space';
        } else {
          const band = resolveBand(target.state.resolve ?? 70);
          if (band === 'bargaining' || band === 'capitulate') { pKey = 'H'; pVerb = 'Hail'; }
        }
      }
      if (!pKey && !target && shipObj) {
        const p = shipObj.position;
        const r2 = U.TARGET_RANGE * U.TARGET_RANGE;
        for (const s of ctx.ships) {
          if (s.state?.destroyed || !s.object) continue;
          const d = s.object.position;
          const dx = d.x - p.x, dy = d.y - p.y, dz = d.z - p.z;
          if (dx * dx + dy * dy + dz * dz <= r2) { pKey = 'T'; pVerb = 'Target'; break; }
        }
      }
      // Dock / Jump / Hail / Target win. A rock lock already has a mine target.
      if (!pKey && (ctx.input.weaponGroup | 0) === 3 && shipObj && !isRockTarget(target)) {
        const n = beltMineDist(ctx, shipObj.position);
        if (Number.isFinite(n)) {
          pKey = '3';
          pVerb = 'Mine · belt ' + n + 'u';
        }
      }
      const pStr = pKey + '|' + pVerb;
      const pSalvage = pVerb === 'Hail — dead in space';
      if (pStr !== last.prompt) {
        last.prompt = pStr;
        if (pKey) {
          promptKey.textContent = pKey;
          promptVerb.textContent = pVerb;
          prompt.classList.remove('is-hidden');
        } else {
          prompt.classList.add('is-hidden');
        }
      }
      if (pSalvage !== last.promptSalvage) {
        last.promptSalvage = pSalvage;
        prompt.classList.toggle('is-salvage', pSalvage);
      }
    },
  };
}
