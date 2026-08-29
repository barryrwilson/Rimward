/**
 * Client settings + accessibility (doc §18.4/§20: "important states are
 * legible without relying on color"). settings.js is the ONLY writer of
 * ctx.settings; every other system reads it live (song.js volume/mute/hudAlerts,
 * onboarding.js hints, ship/gate/hud reducedMotion).
 *
 * Persisted under its own localStorage key 'rimward-settings-v1' — client
 * state, NOT world state, so it never rides save.js WORLD_FIELDS. Corrupt or
 * absent storage silently falls back to the ctx.js defaults.
 *
 * Live `settings` bind (default KeyO) toggles the panel (Escape closes).
 * KEYS listen uses keyup/pointerup arming. The panel is plain DOM with inline
 * layout styles in the hail.js self-contained pattern; it is the topmost
 * interactive surface at z-index 80, above the title screen (70), the pause
 * overlay (50) and every 60-level panel, and below only #fatal (99). It is
 * display:none when closed so it never swallows gameplay input. Every control
 * applies + persists immediately. ctx.settingsApi is session-only on ctx.
 *
 * Apply side effects: body classes rw-colorblind / rw-contrast /
 * rw-reduced-motion (CSS in hud.css/screens.css reacts), and --rw-text-scale
 * on #hud (font sizes multiply by it). hudAlerts has no body class; song.js
 * reads the bool live, same as mute.
 */

import { COMMANDS, sanitizeBindings, codeOf, shortLabel, commandLabel, conflictFor } from './bindings.js';
import { rebuildTrackedFromBindings } from './controls.js';

const STORAGE_KEY = 'rimward-settings-v1';
const TEXT_SCALES = [0.85, 1, 1.2, 1.5];
const TEXT_SCALE_LABELS = ['S', 'M', 'L', 'XL'];

// Known keys + validators — anything else in storage is ignored.
const FIELDS = {
  colorblind: (v) => typeof v === 'boolean',
  highContrast: (v) => typeof v === 'boolean',
  reducedMotion: (v) => typeof v === 'boolean',
  muted: (v) => typeof v === 'boolean',
  hudAlerts: (v) => typeof v === 'boolean',
  hints: (v) => typeof v === 'boolean',
  textScale: (v) => TEXT_SCALES.includes(v),
  masterVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  mouseSensitivity: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0.25 && v <= 3,
  invertX: (v) => typeof v === 'boolean',
  invertY: (v) => typeof v === 'boolean',
  musicVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  effectsVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  voiceVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  uiVolume: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  bindings: (v) => !!v && typeof v === 'object' && !Array.isArray(v),
};

const FIELD_DEFAULTS = {
  colorblind: false,
  highContrast: false,
  reducedMotion: false,
  muted: false,
  hudAlerts: false,
  hints: true,
  textScale: 1,
  masterVolume: 1,
  mouseSensitivity: 1,
  invertX: false,
  invertY: false,
  musicVolume: 1,
  effectsVolume: 1,
  voiceVolume: 1,
  uiVolume: 1,
};

const RESET_BTN_CSS =
  'min-height:44px;min-width:44px;margin:8px 0 4px;padding:8px 14px;cursor:pointer;' +
  "font-family:'Consolas','Cascadia Mono','Courier New',monospace;font-size:12px;" +
  'letter-spacing:0.08em;color:#dce8f4;background:#131e2e;border:1px solid #31445c;';

const BIND_BTN_CSS =
  'min-height:44px;min-width:88px;padding:8px 12px;cursor:pointer;flex:0 0 auto;' +
  "font-family:'Consolas','Cascadia Mono','Courier New',monospace;font-size:12px;" +
  'letter-spacing:0.06em;color:#dce8f4;background:#131e2e;border:1px solid #31445c;';

function persistBindingsMap(raw) {
  const src = sanitizeBindings(raw);
  const clean = {};
  for (let i = 0; i < COMMANDS.length; i++) {
    const id = COMMANDS[i].id;
    if (Object.hasOwn(src, id) && typeof src[id] === 'string') clean[id] = src[id];
  }
  return clean;
}

function tellControlsRebuild(ctx) {
  try {
    if (typeof rebuildTrackedFromBindings === 'function') rebuildTrackedFromBindings(ctx);
  } catch {
    /* fail closed: never throw from Settings */
  }
}

const CHECKBOXES = [
  ['colorblind', 'Colorblind-safe palette'],
  ['highContrast', 'High contrast HUD'],
  ['reducedMotion', 'Reduced motion'],
  ['hudAlerts', 'HUD audio alerts'],
  ['muted', 'Mute all audio'],
  ['hints', 'Onboarding hints'],
];

export function initSettings(ctx) {
  const s = ctx.settings; // defaults live in ctx.js; we merge storage into it
  let pendingRepairNote = '';

  // ---------- load (guard parse errors: corrupt/absent = defaults) ----------
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        for (const key of Object.keys(FIELDS)) {
          if (key === 'bindings') continue;
          if (Object.hasOwn(data, key) && FIELDS[key](data[key])) s[key] = data[key];
        }
        if (Object.hasOwn(data, 'bindings')) {
          const rawB = data.bindings;
          const san = sanitizeBindings(rawB);
          let repaired = false;
          try {
            if (rawB && typeof rawB === 'object' && !Array.isArray(rawB)) {
              for (let i = 0; i < COMMANDS.length; i++) {
                const id = COMMANDS[i].id;
                if (!Object.hasOwn(rawB, id)) continue;
                if (rawB[id] !== san[id]) repaired = true;
              }
            }
          } catch {
            /* keep sanitized map */
          }
          s.bindings = san;
          if (repaired) {
            pendingRepairNote =
              'Some keys were reset because the saved map conflicted. Use Reset keys if a bind looks wrong.';
          }
        }
      }
    }
  } catch {
    /* corrupt JSON or storage denied → keep defaults */
  }
  tellControlsRebuild(ctx);

  const hudEl = document.getElementById('hud');

  function apply() {
    document.body.classList.toggle('rw-colorblind', s.colorblind);
    document.body.classList.toggle('rw-contrast', s.highContrast);
    document.body.classList.toggle('rw-reduced-motion', s.reducedMotion);
    if (hudEl) hudEl.style.setProperty('--rw-text-scale', String(s.textScale));
  }

  function persist() {
    try {
      const out = {};
      for (const key of Object.keys(FIELDS)) {
        if (key === 'bindings') {
          const clean = persistBindingsMap(s.bindings);
          s.bindings = clean;
          out.bindings = clean;
          continue;
        }
        if (Object.hasOwn(s, key)) out[key] = s[key];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      /* storage denied → session-only settings */
    }
    tellControlsRebuild(ctx);
  }

  function change() {
    apply();
    persist();
  }

  // ---------- overlay DOM (inline layout styles, hail.js pattern) ----------
  const root = document.createElement('div');
  root.style.cssText =
    'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
    'background:rgba(2,5,11,0.72);z-index:80;pointer-events:none;' +
    "font-family:'Consolas','Cascadia Mono','Courier New',monospace;color:#dce8f4;";
  root.addEventListener('mousedown', (e) => {
    try { e.stopPropagation(); } catch { /* ignore */ }
  });
  root.addEventListener('click', (e) => {
    try { e.stopPropagation(); } catch { /* ignore */ }
  });

  const panel = document.createElement('div');
  panel.style.cssText =
    'pointer-events:auto;min-width:340px;max-width:92vw;max-height:82vh;overflow-y:auto;' +
    'padding:18px 22px 16px;background:linear-gradient(180deg,#101826 0%,#0a101b 100%);' +
    'border:1px solid #2c3d52;border-radius:2px;font-size:13px;line-height:1.5;' +
    'box-shadow:0 0 0 1px rgba(111,210,224,0.06),0 12px 48px rgba(0,0,0,0.65);';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Settings');
  panel.setAttribute('aria-modal', 'false');
  panel.tabIndex = -1;
  // Clicks on the panel must not reach the canvas (fire input).
  panel.addEventListener('mousedown', (e) => e.stopPropagation());
  panel.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(panel);

  const title = document.createElement('div');
  title.textContent = 'SETTINGS';
  title.style.cssText =
    'font-size:15px;letter-spacing:0.3em;color:#6fd2e0;margin-bottom:4px;' +
    'border-bottom:1px solid #22303f;padding-bottom:8px;';
  panel.appendChild(title);

  const hint = document.createElement('div');
  hint.textContent = 'O or ESC to close — changes apply immediately';
  hint.style.cssText = 'color:#5f7185;font-size:11px;letter-spacing:0.1em;margin:6px 0 8px;';
  panel.appendChild(hint);

  const SECTION_HEAD_CSS =
    'font-size:12px;letter-spacing:0.28em;color:#6fd2e0;margin:14px 0 8px;' +
    'border-bottom:1px solid #22303f;padding-bottom:6px;';
  const SLIDER_CAPTION_CSS = 'color:#7d93ab;font-size:11px;letter-spacing:0.2em;margin:8px 0 6px;';

  function addSectionHead(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = SECTION_HEAD_CSS;
    panel.appendChild(el);
  }

  function addResetButton(parent, label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = RESET_BTN_CSS;
    b.setAttribute('aria-label', label);
    b.addEventListener('focus', () => {
      b.style.outline = '2px solid #6fd2e0';
      b.style.outlineOffset = '2px';
    });
    b.addEventListener('blur', () => { b.style.outline = 'none'; });
    b.addEventListener('click', () => {
      try { onClick(); } catch { /* never throw from Settings */ }
    });
    parent.appendChild(b);
    return b;
  }

  const checkboxInputs = {};
  function addCheckbox(key, label, rowExtra) {
    const row = document.createElement('label');
    row.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:5px 2px;cursor:pointer;' +
      'letter-spacing:0.06em;' + (rowExtra || '');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!s[key];
    input.style.cssText = 'accent-color:#6fd2e0;width:15px;height:15px;cursor:pointer;';
    input.setAttribute('aria-label', label);
    input.addEventListener('change', () => {
      s[key] = input.checked;
      change();
    });
    checkboxInputs[key] = input;
    row.appendChild(input);
    row.appendChild(document.createTextNode(label));
    panel.appendChild(row);
  }

  addSectionHead('ACCESSIBILITY');
  const A11Y_KEYS = ['colorblind', 'highContrast', 'reducedMotion', 'hints'];
  for (const [key, label] of CHECKBOXES) {
    if (A11Y_KEYS.includes(key)) addCheckbox(key, label);
  }

  // --- text scale segmented row ---
  const scaleLabel = document.createElement('div');
  scaleLabel.textContent = 'TEXT SIZE';
  scaleLabel.style.cssText = SLIDER_CAPTION_CSS;
  panel.appendChild(scaleLabel);

  const scaleRow = document.createElement('div');
  scaleRow.style.cssText = 'display:flex;gap:6px;';
  panel.appendChild(scaleRow);

  const scaleBtns = [];
  function refreshScaleButtons() {
    for (let i = 0; i < scaleBtns.length; i++) {
      const active = s.textScale === TEXT_SCALES[i];
      const b = scaleBtns[i];
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.style.borderColor = active ? '#6fd2e0' : '#31445c';
      b.style.color = active ? '#6fd2e0' : '#9fb2c6';
      b.style.background = active ? '#162437' : '#131e2e';
    }
  }
  for (let i = 0; i < TEXT_SCALES.length; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'screen-btn'; // shared overlay button treatment (screens.css)
    b.textContent = TEXT_SCALE_LABELS[i];
    b.style.cssText = 'width:auto;flex:1;padding:5px 0;text-align:center;';
    const scale = TEXT_SCALES[i];
    b.addEventListener('click', () => {
      s.textScale = scale;
      refreshScaleButtons();
      change();
    });
    scaleBtns.push(b);
    scaleRow.appendChild(b);
  }
  refreshScaleButtons();

  // --- flight comfort (RW-002 PR1) ---
  addSectionHead('FLIGHT');

  const flightChecks = {};
  const FLIGHT_CHECKS = [
    ['invertX', 'Invert yaw (X)'],
    ['invertY', 'Invert pitch (Y)'],
  ];
  for (const [key, label] of FLIGHT_CHECKS) {
    const row = document.createElement('label');
    row.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:5px 2px;min-height:44px;cursor:pointer;' +
      'letter-spacing:0.06em;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!s[key];
    input.style.cssText = 'accent-color:#6fd2e0;width:15px;height:15px;cursor:pointer;';
    input.setAttribute('aria-label', label);
    input.addEventListener('change', () => {
      s[key] = input.checked;
      change();
    });
    flightChecks[key] = input;
    row.appendChild(input);
    row.appendChild(document.createTextNode(label));
    panel.appendChild(row);
  }

  const sensLabel = document.createElement('div');
  sensLabel.style.cssText = SLIDER_CAPTION_CSS;
  panel.appendChild(sensLabel);

  const sensRow = document.createElement('div');
  sensRow.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:44px;';
  panel.appendChild(sensRow);

  const sens = document.createElement('input');
  sens.type = 'range';
  sens.min = '0.25';
  sens.max = '3';
  sens.step = '0.05';
  sens.style.cssText = 'flex:1;accent-color:#6fd2e0;cursor:pointer;min-height:44px;';
  sens.setAttribute('aria-label', 'Mouse sensitivity');
  const sensValue = document.createElement('span');
  sensValue.style.cssText = 'min-width:38px;text-align:right;color:#dce8f4;';
  function clampSensitivity(v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 1;
    return Math.max(0.25, Math.min(3, v));
  }
  function refreshSensitivity() {
    const g = clampSensitivity(s.mouseSensitivity);
    s.mouseSensitivity = g;
    sens.value = String(g);
    sensLabel.textContent = 'MOUSE SENSITIVITY';
    sensValue.textContent = g.toFixed(2);
  }
  sens.addEventListener('input', () => {
    s.mouseSensitivity = clampSensitivity(Number(sens.value));
    refreshSensitivity();
    change();
  });
  refreshSensitivity();
  sensRow.appendChild(sens);
  sensRow.appendChild(sensValue);

  addResetButton(panel, 'Reset flight', () => {
    s.mouseSensitivity = FIELD_DEFAULTS.mouseSensitivity;
    s.invertX = FIELD_DEFAULTS.invertX;
    s.invertY = FIELD_DEFAULTS.invertY;
    for (const key of Object.keys(flightChecks)) flightChecks[key].checked = !!s[key];
    refreshSensitivity();
    change();
  });

  // --- audio (RW-002 PR2). Mute + master + buses. No preview blips. ---
  const busRefreshers = [];
  let vol = null;
  let refreshVolume = () => {};
  try {
    addSectionHead('AUDIO');
    const audioNote = document.createElement('div');
    audioNote.textContent =
      'Master multiplies every bus; mute silences output and does not change slider values.';
    audioNote.style.cssText = 'color:#5f7185;font-size:11px;letter-spacing:0.04em;margin:0 0 8px;';
    panel.appendChild(audioNote);

    const AUDIO_CHECK_KEYS = ['muted', 'hudAlerts'];
    for (let i = 0; i < AUDIO_CHECK_KEYS.length; i++) {
      const want = AUDIO_CHECK_KEYS[i];
      let pair = null;
      for (let j = 0; j < CHECKBOXES.length; j++) {
        if (CHECKBOXES[j][0] === want) pair = CHECKBOXES[j];
      }
      if (pair) addCheckbox(pair[0], pair[1], 'min-height:44px;');
    }

    const volLabel = document.createElement('div');
    volLabel.style.cssText = SLIDER_CAPTION_CSS;
    panel.appendChild(volLabel);
    const volRow = document.createElement('div');
    volRow.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:44px;';
    panel.appendChild(volRow);
    vol = document.createElement('input');
    vol.type = 'range';
    vol.min = '0';
    vol.max = '100';
    vol.step = '1';
    vol.value = String(Math.round(s.masterVolume * 100));
    vol.style.cssText = 'flex:1;accent-color:#6fd2e0;cursor:pointer;min-height:44px;';
    vol.setAttribute('aria-label', 'Master volume');
    const volValue = document.createElement('span');
    volValue.style.cssText = 'min-width:38px;text-align:right;color:#dce8f4;';
    refreshVolume = () => {
      volLabel.textContent = 'MASTER VOLUME';
      volValue.textContent = vol.value + '%';
    };
    vol.addEventListener('input', () => {
      s.masterVolume = Math.max(0, Math.min(1, Number(vol.value) / 100));
      refreshVolume();
      change();
    });
    refreshVolume();
    volRow.appendChild(vol);
    volRow.appendChild(volValue);

    const BUS_SLIDERS = [
      ['musicVolume', 'MUSIC VOLUME', 'Music volume'],
      ['effectsVolume', 'EFFECTS VOLUME', 'Effects volume'],
      ['voiceVolume', 'VOICE VOLUME', 'Voice volume'],
      ['uiVolume', 'UI VOLUME', 'UI volume'],
    ];
    function clampBusVolume(v) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return 1;
      return Math.max(0, Math.min(1, v));
    }
    for (const [key, heading, aria] of BUS_SLIDERS) {
      const busLabel = document.createElement('div');
      busLabel.style.cssText = SLIDER_CAPTION_CSS;
      panel.appendChild(busLabel);
      const busRow = document.createElement('div');
      busRow.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:44px;';
      panel.appendChild(busRow);
      const busSl = document.createElement('input');
      busSl.type = 'range';
      busSl.min = '0';
      busSl.max = '100';
      busSl.step = '1';
      busSl.style.cssText = 'flex:1;accent-color:#6fd2e0;cursor:pointer;min-height:44px;';
      busSl.setAttribute('aria-label', aria);
      const busVal = document.createElement('span');
      busVal.style.cssText = 'min-width:38px;text-align:right;color:#dce8f4;';
      const refreshBus = () => {
        try {
          const g = clampBusVolume(s[key]);
          s[key] = g;
          busSl.value = String(Math.round(g * 100));
          busLabel.textContent = heading;
          busVal.textContent = busSl.value + '%';
        } catch {
          /* never throw from Settings paint */
        }
      };
      busSl.addEventListener('input', () => {
        try {
          s[key] = clampBusVolume(Number(busSl.value) / 100);
          refreshBus();
          change();
        } catch {
          /* never throw from Settings paint */
        }
      });
      refreshBus();
      busRow.appendChild(busSl);
      busRow.appendChild(busVal);
      busRefreshers.push(refreshBus);
    }

    addResetButton(panel, 'Reset audio', () => {
      s.musicVolume = FIELD_DEFAULTS.musicVolume;
      s.effectsVolume = FIELD_DEFAULTS.effectsVolume;
      s.voiceVolume = FIELD_DEFAULTS.voiceVolume;
      s.uiVolume = FIELD_DEFAULTS.uiVolume;
      for (let i = 0; i < busRefreshers.length; i++) busRefreshers[i]();
      change();
    });
  } catch {
    /* never throw from Settings paint */
  }

  // ---------- KEYS (RW-002 PR4) ----------
  let listeningId = null;
  let pendingArm = null;
  let lastFocus = null;
  let swallowMenu = false;
  const bindBtns = {};

  const statusEl = document.createElement('div');
  statusEl.setAttribute('role', 'status');
  statusEl.setAttribute('aria-live', 'polite');
  statusEl.style.cssText =
    'min-height:20px;color:#e8b4a0;font-size:12px;letter-spacing:0.04em;margin:4px 0 8px;';

  function setStatus(text) {
    try {
      statusEl.textContent = typeof text === 'string' ? text : '';
      statusEl.style.color = statusEl.textContent ? '#e8b4a0' : '#5f7185';
    } catch {
      /* never throw from Settings paint */
    }
  }

  function liveSettingsCode() {
    try {
      const c = codeOf(ctx, 'settings');
      if (typeof c === 'string' && c) return c;
    } catch {
      /* default */
    }
    return 'KeyO';
  }

  function refreshHint() {
    try {
      const lab = shortLabel(liveSettingsCode());
      hint.textContent = lab + ' or ESC to close — changes apply immediately';
    } catch {
      hint.textContent = 'O or ESC to close — changes apply immediately';
    }
  }

  function bindCaption(id) {
    try {
      if (listeningId === id) return 'Press a key…';
      return shortLabel(codeOf(ctx, id));
    } catch {
      return '?';
    }
  }

  function refreshBindButtons() {
    try {
      for (let i = 0; i < COMMANDS.length; i++) {
        const id = COMMANDS[i].id;
        const b = bindBtns[id];
        if (!b) continue;
        b.textContent = bindCaption(id);
        b.setAttribute('aria-pressed', listeningId === id ? 'true' : 'false');
        const lab = COMMANDS[i].label;
        b.setAttribute('aria-label', lab + ' bind ' + bindCaption(id));
      }
    } catch {
      /* never throw from Settings paint */
    }
  }

  function endListen() {
    listeningId = null;
    pendingArm = null;
    refreshBindButtons();
  }

  function startListen(id) {
    try {
      if (typeof id !== 'string' || !id) return;
      listeningId = id;
      pendingArm = null;
      setStatus('');
      refreshBindButtons();
    } catch {
      listeningId = null;
    }
  }

  function statusToken(code) {
    try {
      const lab = shortLabel(code);
      if (lab && lab !== '?') return lab;
    } catch {
      /* use code */
    }
    return typeof code === 'string' && code ? code : '?';
  }

  function applyCandidate(id, code) {
    try {
      const occ = conflictFor(s.bindings, id, code);
      if (occ === 'reserved') {
        setStatus(statusToken(code) + ' is reserved');
        endListen();
        return;
      }
      if (occ) {
        const other = commandLabel(occ) || occ;
        setStatus(statusToken(code) + ' is used by ' + other);
        endListen();
        return;
      }
      const next = persistBindingsMap(s.bindings);
      next[id] = code;
      s.bindings = persistBindingsMap(next);
      persist();
      refreshHint();
      setStatus('');
      endListen();
    } catch {
      endListen();
    }
  }

  function isIgnoredMouseTarget(target) {
    let el = target;
    try {
      if (el && el.nodeType === 3) el = el.parentElement;
      while (el && el !== root) {
        const tag = el.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'LABEL' || tag === 'SELECT' || tag === 'TEXTAREA') {
          return true;
        }
        if (el.getAttribute && el.getAttribute('data-rw-keys-row') === '1') return true;
        el = el.parentElement;
      }
    } catch {
      return true;
    }
    return false;
  }

  function mouseCode(button) {
    if (button === 0) return 'Mouse0';
    if (button === 1) return 'Mouse1';
    if (button === 2) return 'Mouse2';
    return '';
  }

  try {
    addSectionHead('KEYS');
    panel.appendChild(statusEl);

    for (let i = 0; i < COMMANDS.length; i++) {
      const cmd = COMMANDS[i];
      const row = document.createElement('div');
      row.setAttribute('data-rw-keys-row', '1');
      row.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;';
      const name = document.createElement('span');
      name.textContent = cmd.label;
      name.style.cssText = 'letter-spacing:0.04em;flex:1;';
      const b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = BIND_BTN_CSS;
      bindBtns[cmd.id] = b;
      b.addEventListener('keydown', (e) => {
        try {
          if (e.repeat) return;
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            pendingArm = { id: cmd.id, code: e.code };
          }
        } catch {
          /* never throw from capture */
        }
      });
      b.addEventListener('keyup', (e) => {
        try {
          if (!pendingArm || pendingArm.id !== cmd.id) return;
          if (e.code !== pendingArm.code) return;
          e.preventDefault();
          startListen(cmd.id);
        } catch {
          pendingArm = null;
        }
      });
      b.addEventListener('focus', () => {
        b.style.outline = '2px solid #6fd2e0';
        b.style.outlineOffset = '2px';
      });
      b.addEventListener('blur', () => { b.style.outline = 'none'; });
      b.addEventListener('pointerup', () => {
        try { startListen(cmd.id); } catch { /* never throw */ }
      });
      row.appendChild(name);
      row.appendChild(b);
      panel.appendChild(row);
    }
    refreshBindButtons();

    addResetButton(panel, 'Reset keys', () => {
      endListen();
      s.bindings = sanitizeBindings(null);
      persist();
      refreshHint();
      refreshBindButtons();
      setStatus('');
    });
    addResetButton(panel, 'Reset all', () => {
      endListen();
      for (const key of Object.keys(FIELDS)) {
        if (key === 'bindings') {
          s.bindings = sanitizeBindings(null);
          continue;
        }
        if (Object.hasOwn(FIELD_DEFAULTS, key)) s[key] = FIELD_DEFAULTS[key];
      }
      change();
      refreshWidgets();
      refreshHint();
      refreshBindButtons();
      setStatus('');
    });
  } catch {
    /* never throw from Settings paint */
  }

  function refreshWidgets() {
    try {
      for (const key of Object.keys(checkboxInputs)) checkboxInputs[key].checked = !!s[key];
      for (const key of Object.keys(flightChecks)) flightChecks[key].checked = !!s[key];
      refreshScaleButtons();
      if (vol) {
        vol.value = String(Math.round(s.masterVolume * 100));
        refreshVolume();
      }
      refreshSensitivity();
      for (let i = 0; i < busRefreshers.length; i++) busRefreshers[i]();
      refreshBindButtons();
      refreshHint();
    } catch {
      /* never throw from Settings paint */
    }
  }

  function restoreFocus() {
    try {
      const el = lastFocus;
      lastFocus = null;
      if (el && el.isConnected && typeof el.focus === 'function') {
        el.focus();
      }
    } catch {
      /* leave focus on body */
    }
  }

  function syncPauseActionTab() {
    try {
      const nodes = document.querySelectorAll('[data-pause-action]');
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].tabIndex = open ? -1 : 0;
      }
    } catch {
      /* pause cover is best-effort */
    }
  }

  function panelFocusables() {
    const list = [];
    try {
      const nodes = panel.querySelectorAll('button, input, select, textarea');
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.disabled) continue;
        list.push(n);
      }
    } catch {
      /* empty */
    }
    return list;
  }

  panel.addEventListener('keydown', (e) => {
    try {
      if (!open || listeningId) return;
      if (e.key !== 'Tab') return;
      const list = panelFocusables();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    } catch {
      /* never throw */
    }
  });

  document.body.appendChild(root);

  // ---------- open/close ----------
  let open = false;
  function setOpen(next) {
    try {
      const want = next === true;
      if (want === open) {
        if (want) refreshWidgets();
        return;
      }
      if (!want) {
        endListen();
        swallowMenu = false;
        open = false;
        root.style.display = 'none';
        root.style.pointerEvents = 'none';
        panel.setAttribute('aria-modal', 'false');
        syncPauseActionTab();
        restoreFocus();
        return;
      }
      try { lastFocus = document.activeElement; } catch { lastFocus = null; }
      open = true;
      root.style.display = 'flex';
      root.style.pointerEvents = 'auto';
      panel.tabIndex = -1;
      panel.setAttribute('aria-modal', 'true');
      refreshWidgets();
      if (pendingRepairNote) {
        setStatus(pendingRepairNote);
        pendingRepairNote = '';
      }
      try { panel.focus(); } catch { /* ignore */ }
      syncPauseActionTab();
    } catch {
      /* never throw from Settings */
    }
  }

  function onCaptureKeyDown(e) {
    try {
      if (!open || !listeningId) return;
      if (e.repeat) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      const code = e && e.code;
      if (code === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        endListen();
        setStatus('');
        return;
      }
      if (typeof code !== 'string' || !code) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      applyCandidate(listeningId, code);
    } catch {
      /* never throw from capture */
    }
  }

  function onCaptureMouseDown(e) {
    try {
      if (!open || !listeningId) return;
      const mcode = mouseCode(e && e.button);
      if ((e && e.button === 1) || (e && e.button === 2)) {
        try { e.preventDefault(); } catch { /* ignore */ }
        swallowMenu = true;
      }
      if (!mcode) return;
      if (isIgnoredMouseTarget(e && e.target)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      applyCandidate(listeningId, mcode);
    } catch {
      /* never throw from capture */
    }
  }

  function onCaptureContextMenu(e) {
    try {
      if (!open) return;
      if (!listeningId && !swallowMenu) return;
      e.preventDefault();
      swallowMenu = false;
    } catch {
      /* never throw from capture */
    }
  }

  function onCaptureAuxClick(e) {
    try {
      if (!open) return;
      if (!listeningId && !swallowMenu) return;
      if (e && (e.button === 1 || e.button === 2)) e.preventDefault();
    } catch {
      /* never throw from capture */
    }
  }

  window.addEventListener('keydown', onCaptureKeyDown, true);
  window.addEventListener('mousedown', onCaptureMouseDown, true);
  window.addEventListener('contextmenu', onCaptureContextMenu, true);
  window.addEventListener('auxclick', onCaptureAuxClick, true);

  window.addEventListener('keydown', (e) => {
    try {
      if (e.repeat) return;
      if (listeningId) {
        if (e.code === 'Escape') {
          endListen();
          setStatus('');
        }
        return;
      }
      const settingsCode = liveSettingsCode();
      if (e.code === settingsCode) {
        setOpen(!open);
      } else if (e.code === 'Escape' && open) {
        setOpen(false);
      }
    } catch {
      /* never throw from Settings */
    }
  });

  ctx.settingsApi = {
    isOpen() {
      try { return open === true; } catch { return false; }
    },
    setOpen(next) {
      try { setOpen(next === true); } catch { /* never throw */ }
    },
    toggle() {
      try { setOpen(!open); } catch { /* never throw */ }
    },
    isListening() {
      try { return listeningId != null; } catch { return false; }
    },
  };

  refreshHint();
  apply(); // initial classes + text scale from loaded settings

  // Everything is event/DOM driven — nothing to do per frame.
  return { update() {} };
}
