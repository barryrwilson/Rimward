import * as THREE from 'three';
import '../ui/hud.css';
import { WEAPONS, HEAT, U, FACTIONS, COMMODITIES, SYSTEMS, resolveBand } from '../game/state.js';

/**
 * RIMWARD HUD (doc §13) — cold frontier instrumentation (§18.4).
 *
 * Combat-critical set (§13.2): reticle + lead indicator, target bracket with
 * resolve band, Screen/Shell/hull/strain/engine, speed/throttle/afterburner/
 * drift, weapon group, and one focused context prompt. Non-critical panels
 * (resources, controls) fade while ctx.flags.combat is set.
 *
 * Performance contract: every DOM node is created once here. update() writes
 * transforms (reticle/bracket/lead/edge-arrow) per frame; ALL text and bar
 * writes are throttled to ~5 Hz and only when the value actually changed.
 * No per-frame object allocations — scratch Vector3s live at init scope.
 *
 * Color is never the only signal (§18.4/§20): every state pairs palette with
 * text, shape (petals, corners, icons), or glyph prefixes.
 */

const TEXT_UPDATE_INTERVAL = 0.2; // s between throttled text refreshes
const TOAST_LIFETIME = 4; // s a toast stays fully visible
const TOAST_SLOTS = 5;
const HULL_PETALS = 10;
const EDGE_MARGIN = 84; // px inset for the off-screen target arrow
const LEAD_MIN_SPEED = 6; // u/s — slower targets hide the lead pip

const WEAPON_KEYS = ['cannon', 'disruptor', 'mining']; // input.weaponGroup 1..3
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

/** Terse pilot-voice toast copy for a ctx event (§13.5). null = not toastable. */
function toastForEvent(e, ctx, mem) {
  switch (e.type) {
    case 'commLine':
      return { text: e.text ?? e.line ?? '', cls: 'comm' };
    case 'milestone':
      return { text: '★ ' + (e.line ?? e.id ?? 'A first.'), cls: 'sting' };
    case 'saveBlocked':
      return { text: '▲ SAVE BLOCKED — ' + (e.reason ?? 'hostiles near'), cls: 'warn' };
    case 'podCollected':
      return { text: '■ Cargo secured.', cls: 'good' };
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
      return { text: '■ They are dead in space.', cls: 'good' };
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
    default:
      return null;
  }
}

/**
 * Wave 2 (gate/jump) styles. hud.css is read-only this wave, so the few new
 * classes are injected once here; they reuse the #hud palette variables and
 * mirror the existing toast/prompt/panel treatments (§13, §18.4).
 */
const W2_STYLE_ID = 'rw-hud-w2-styles';
function ensureW2Styles() {
  if (document.getElementById(W2_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = W2_STYLE_ID;
  style.textContent = `
#hud .rw-banner {
  position: absolute;
  top: 13%;
  left: 50%;
  transform: translate(-50%, -8px);
  display: flex;
  flex-direction: column;
  align-items: center;
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
#hud .rw-banner.show { opacity: 1; transform: translate(-50%, 0); }
#hud .rw-banner-name {
  font-size: 22px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--cyan);
  text-shadow: 0 0 12px rgba(111, 242, 224, 0.45);
}
#hud .rw-banner-sub {
  font-size: 11px;
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
  font-size: 12px;
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
  font-size: 11px;
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
  const edgeArrow = el('div', 'rw-edge-arrow is-hidden', root);

  // ---------- top-center toasts (comm lines + milestone stings) ----------
  const toasts = el('div', 'rw-toasts', root);
  const toastSlots = [];
  for (let i = 0; i < TOAST_SLOTS; i++) {
    toastSlots.push({ el: el('div', 'rw-toast', toasts), until: 0, key: '' });
  }
  let toastCursor = 0;

  // ---------- wave 2: arrival banner (fires on 'systemLoaded', ~4s) ----------
  const banner = el('div', 'rw-banner', root);
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

  // ---------- bottom strip: defense / flight / weapon … bio + pos ----------
  const bottom = el('div', 'rw-bottom', root);

  const defense = el('section', 'rw-panel rw-defense', bottom);
  el('div', 'rw-panel-title', defense, 'Defense');
  const screenBar = makeBar(defense, 'SCREEN', 'rw-screen');
  const shellBar = makeBar(defense, 'SHELL', 'rw-shell');
  const hullRow = el('div', 'rw-meter rw-hull', defense);
  el('div', 'rw-label', hullRow, 'HULL');
  const petals = el('div', 'rw-petals', hullRow);
  const petalSpans = [];
  for (let i = 0; i < HULL_PETALS; i++) petalSpans.push(el('span', 'rw-petal on', petals));
  const strainBar = makeBar(defense, 'STRAIN', 'rw-strain');
  const strainFlag = el('div', 'rw-strain-flag', strainBar.row, 'OVERHEAT');
  const engineRow = el('div', 'rw-meter rw-engine', defense);
  el('div', 'rw-label', engineRow, 'ENGINE');
  const engineValue = el('div', 'rw-value', engineRow, 'OK');

  const flight = el('section', 'rw-panel rw-flight', bottom);
  el('div', 'rw-panel-title', flight, 'Flight');
  const speedRow = el('div', 'rw-meter rw-speed', flight);
  el('div', 'rw-label', speedRow, 'SPD');
  const speedValue = el('div', 'rw-value', speedRow);
  const speedText = document.createTextNode('0');
  speedValue.appendChild(speedText);
  el('span', 'rw-unit', speedValue, 'u/s');
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

  const weapon = el('section', 'rw-panel rw-weapon', bottom);
  el('div', 'rw-panel-title', weapon, 'Weapon');
  const weaponRow = el('div', 'rw-meter', weapon);
  el('div', 'rw-label', weaponRow, 'GROUP');
  const weaponName = el('div', 'rw-value', weaponRow, '—');
  const weaponStrainRow = el('div', 'rw-meter', weapon);
  el('div', 'rw-label', weaponStrainRow, 'STRAIN');
  const weaponStrain = el('div', 'rw-value', weaponStrainRow, '0%');

  const sideCol = el('div', 'rw-side-col', bottom);
  const bio = el('section', 'rw-panel rw-bio', sideCol);
  el('div', 'rw-panel-title rw-bio-title', bio, 'Bio');
  const moodRow = el('div', 'rw-meter rw-mood', bio);
  const moodIcon = el('span', 'rw-bio-icon m-serene', moodRow);
  const moodLabel = el('div', 'rw-value', moodRow, 'SERENE');
  const hungerBar = makeBar(bio, 'HUNGER', 'rw-hunger');
  const woundsBar = makeBar(bio, 'WOUNDS', 'rw-wounds');

  const posPanel = el('section', 'rw-panel rw-pos', sideCol);
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
  let lastTargetRef = null;

  // ---------- change-detection cache ----------
  const last = {
    retX: -1, retY: -1, fp: null,
    bracketShown: null, leadShown: null, arrowShown: null, bx: -1, by: -1,
    band: '', tName: '', tMeta: '', tResolve: '',
    petalsOn: -1, hullBand: '',
    strainFlag: null, engine: '',
    speed: -1, burner: '', drift: '', driftActive: null,
    burnerPct: -1, driftPct: -1,
    weapon: '', weaponStrain: '',
    credits: -1, fear: -1, cargo: '',
    mood: '', combat: null,
    prompt: '',
    posX: NaN, posY: NaN, posZ: NaN,
    system: '', jumpShown: null, jumpPct: -1, jumpDest: null,
  };
  const mem = { lastFear: Math.round(ctx.world.fear ?? 0) };

  let textAccum = TEXT_UPDATE_INTERVAL; // refresh text on first frame

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
      const evs = ctx.events;
      for (let i = 0; i < evs.length; i++) {
        const t = toastForEvent(evs[i], ctx, mem);
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
      const mx = cx - 40, my = cy - 40; // keep the iris on glass
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

      if (!targetPos || targetDead) {
        if (last.bracketShown !== false) { last.bracketShown = false; bracket.classList.add('is-hidden'); }
        if (last.leadShown !== false) { last.leadShown = false; lead.classList.add('is-hidden'); }
        if (last.arrowShown !== false) { last.arrowShown = false; edgeArrow.classList.add('is-hidden'); }
        lastTargetRef = null;
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

          // lead indicator: aim where the target will be when the shot arrives
          const speed = targetVel.length();
          const showLead = speed > LEAD_MIN_SPEED;
          if (showLead) {
            const tof = dist / WEAPONS.cannon.speed; // 900 u/s
            leadWorld.copy(targetPos).addScaledVector(targetVel, tof);
            leadProj.copy(leadWorld).project(cam);
            if (leadProj.z < 1 && Math.abs(leadProj.x) <= 1 && Math.abs(leadProj.y) <= 1) {
              if (last.leadShown !== true) { last.leadShown = true; lead.classList.remove('is-hidden'); }
              lead.style.transform =
                'translate3d(' + ((leadProj.x * 0.5 + 0.5) * vw) + 'px,' + ((-leadProj.y * 0.5 + 0.5) * vh) + 'px,0)';
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

      // ---------- throttled text / bars (~5 Hz, write-on-change) ----------
      textAccum += dt;
      if (textAccum < TEXT_UPDATE_INTERVAL) return;
      textAccum = 0;

      const player = ctx.player;
      const now = ctx.world.time;

      // combat fade (§13.2): resources + controls dim, combat set stays lit
      const combat = !!ctx.flags.combat;
      if (combat !== last.combat) {
        last.combat = combat;
        root.classList.toggle('in-combat', combat);
      }

      // player defense (§6.4): screen = thin outer bar, shell = thick inner,
      // hull = scale-petals (§14.9), strain = heat, engine state text
      if (player) {
        screenBar.set((player.screen / player.screenMax) * 100);
        shellBar.set((player.shell / player.shellMax) * 100);
        const hullFrac = player.hullMax > 0 ? player.hull / player.hullMax : 0;
        const on = Math.round(hullFrac * HULL_PETALS);
        if (on !== last.petalsOn) {
          last.petalsOn = on;
          for (let i = 0; i < HULL_PETALS; i++) petalSpans[i].classList.toggle('on', i < on);
        }
        const hullBand = hullFrac > 0.5 ? 'ok' : hullFrac > 0.25 ? 'warn' : 'crit';
        if (hullBand !== last.hullBand) {
          last.hullBand = hullBand;
          petals.className = 'rw-petals h-' + hullBand;
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

      // flight: speed, throttle, afterburner + drift state/cooldown bars
      const spd = Math.round(ctx.ship.speed);
      if (spd !== last.speed) { last.speed = spd; speedText.nodeValue = String(spd); }
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

      // weapon group + strain readout
      const wKey = WEAPON_KEYS[(ctx.input.weaponGroup | 0) - 1] ?? 'cannon';
      const wDef = WEAPONS[wKey];
      const wLabel = (ctx.input.weaponGroup | 0) + ' · ' + (wDef ? wDef.name : '—');
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
      hungerBar.set(ctx.bio.hunger * 100);
      woundsBar.set(ctx.bio.wounds * 100);
      woundsBar.row.classList.toggle('hurt', ctx.bio.wounds > 0.35);

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
        let name, meta, resText = '', band = 'neutral';
        const dist = Math.round(fromPos.distanceTo(targetPos));
        if (isShip) {
          const st = target.state;
          const key = (st && st.faction) || target.record?.faction || 'independent';
          name = target.record?.name ?? (st && st.name) ?? 'CONTACT';
          meta = (FACTIONS[key]?.name ?? key) + ' · ' + dist + 'u';
          if (st && typeof st.resolve === 'number') {
            band = resolveBand(st.resolve);
            resText = BAND_LABEL[band];
            if ((ctx.world.scanner ?? 0) >= 1) resText += ' ' + Math.round(st.resolve);
          }
        } else {
          name = 'ASTEROID';
          meta = (COMMODITIES[target.ore]?.name ?? 'Ore') + ' · ' + dist + 'u';
        }
        if (name !== last.tName) { last.tName = name; tName.textContent = name; }
        if (meta !== last.tMeta) { last.tMeta = meta; tMeta.textContent = meta; }
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

      // context prompt (§13.4): one verb, explicit focus, priority order.
      // Gate sits below dock (zones never overlap in practice).
      let pKey = '', pVerb = '';
      if (ctx.station?.inZone && !ctx.flags.docked) {
        pKey = 'D'; pVerb = 'Dock';
      } else if (ctx.gate.inZone && !ctx.flags.docked && !ctx.gate.jumping) {
        const destId = sysDef && sysDef.gate ? sysDef.gate.to : null;
        const destDef = SYSTEMS[destId];
        pKey = 'D'; pVerb = 'Jump to ' + (destDef ? destDef.name : String(destId ?? '—'));
      } else if (target && target.state && !target.state.destroyed) {
        const band = resolveBand(target.state.resolve ?? 70);
        if (band === 'bargaining' || band === 'capitulate') { pKey = 'H'; pVerb = 'Hail'; }
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
      const pStr = pKey + '|' + pVerb;
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
    },
  };
}
