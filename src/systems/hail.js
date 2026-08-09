import * as THREE from 'three';
import { ECON, FACTIONS, cargoValue, ransomFor, CALLOW, HIDDEN_MOUNTS } from '../game/state.js';
import { bumpTrust, addFavor } from '../game/contacts.js';
import { spawnPod } from '../game/pods.js';
import { stampWakeSite } from './npc.js';

/**
 * Combat hail UI (doc §7.6, §12.3): a lower-third card. The world stays live —
 * nothing here touches ctx.flags.paused, and the container is pointer-events:
 * none except the card itself, so the combat HUD is never blocked.
 *
 * Opens on 'hailOpened' { ship, intents[], line?, demand? } (emitted by
 * npc.js when a ship's resolve hits the bargaining band, or when a hunting
 * pirate closes on the player with a tribute demand — wave 30). Intents are
 * verbs with real mechanics only ("no verb without a system" §12.3):
 *   demandCargo   → target jettisons its manifest as pods (fear +2)
 *   demandRansom  → credits += ransomFor(state) (fear +3)
 *   acceptTribute → credits += ECON.tributeRate × cargo value (no fear)
 *   letGo         → target flees, no fear
 *   respect       → a Named Gun (ace) stands down; flee + 60 s calm, no econ
 *   callowVouch   → Old Callow sells a word in the keepers' second ledger column (credits, trust, favors; no econ fear)
 *   keepFiring    → close the card, nothing else changes
 *   payTribute    → demand-hail: credits -= demand (clamped at 0; a short pilot pays what they have); pirate flees + 60 s calm
 *   showTeeth     → hidden-mounts bluff (offered only with concealedMounts): success → pirate flees + 90 s calm, fear +1; failure → pirate resolve +20 and it presses the attack
 *   refuseFight   → wave the demand off; the card closes and the pirate attacks
 * Demand hails carry ev.demand (integer UU rolled once at emit time — the
 * offer is stable). Every resolution emits 'hailClosed'. If the hail ship is
 * destroyed, disabled, or despawned while the card is open, the card closes
 * (bargaining timeout). Buttons carry number-key shortcuts (1..n).
 */

// NOTE: 'callowVouch' must precede 'keepFiring' — card buttons follow this
// order, and the vouch hail offers the purchase as intent [1]. Combat hails
// never include 'callowVouch', so their button order is unchanged.
// Wave 30: the demand-hail intents ('payTribute','showTeeth','refuseFight')
// are appended AFTER every existing entry so combat-hail button numbering is
// unchanged; demand hails offer only these three ([1] pay, [2] teeth,
// [3] refuse).
const INTENT_ORDER = ['demandCargo', 'demandRansom', 'acceptTribute', 'letGo', 'callowVouch', 'keepFiring', 'respect', 'payTribute', 'showTeeth', 'refuseFight'];

const _offset = new THREE.Vector3();

function bumpFear(ctx, delta) {
  ctx.world.fear = Math.max(0, Math.min(100, ctx.world.fear + delta));
  ctx.emit('fearChanged', { fear: ctx.world.fear });
}

export function initHail(ctx) {
  // --- DOM: built once; text/buttons are rewritten per hail ---
  const root = document.createElement('div');
  root.style.cssText =
    'position:fixed;inset:0;display:none;pointer-events:none;z-index:40;' +
    "font-family:'Consolas','Menlo','Courier New',monospace;";
  const card = document.createElement('div');
  card.style.cssText =
    'position:absolute;left:50%;bottom:4%;transform:translateX(-50%);width:560px;max-width:90vw;' +
    'padding:12px 16px;background:rgba(4,18,22,.82);border:1px solid rgba(111,242,224,.35);' +
    'border-radius:2px;pointer-events:auto;text-transform:uppercase;';
  // Clicks on the card must not reach the canvas (fire input).
  card.addEventListener('mousedown', (e) => e.stopPropagation());
  card.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(card);
  document.body.appendChild(root);

  let open = null; // { ship, intents, ransom, tribute, buttons }

  function closeCard() {
    open = null;
    root.style.display = 'none';
  }

  function resolveIntent(ctx2, intent) {
    const h = open;
    if (!h) return;
    const live = h.ship;
    const st = live.state;
    const ai = live.ai;
    switch (intent) {
      case 'demandCargo': {
        const pos = live.object.position;
        for (const entry of st.cargo) {
          _offset.set(pos.x + (Math.random() - 0.5) * 8, pos.y + (Math.random() - 0.5) * 8, pos.z + (Math.random() - 0.5) * 8);
          spawnPod(ctx2, [{ commodity: entry.commodity, units: entry.units }], _offset);
        }
        st.cargo.length = 0;
        st.surrendered = true;
        ai.mode = 'flee';
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        bumpFear(ctx2, ECON.fear.capitulation);
        ctx2.emit('commLine', { text: 'Cargo loose.', from: st.name });
        ctx2.emit('npcSurrendered', { ship: live, outcome: 'jettison' });
        break;
      }
      case 'demandRansom': {
        ctx2.world.credits += h.ransom;
        st.surrendered = true;
        ai.mode = 'flee';
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        bumpFear(ctx2, ECON.fear.ransom);
        ctx2.emit('commLine', { text: 'Paid. Go.', from: st.name });
        ctx2.emit('npcSurrendered', { ship: live, outcome: 'ransom' });
        break;
      }
      case 'acceptTribute': {
        ctx2.world.credits += h.tribute;
        ai.calmUntil = ctx2.world.time + 30; // paid passage: no immediate re-hail
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        ctx2.emit('commLine', { text: 'Tribute paid.', from: st.name });
        break;
      }
      case 'letGo': {
        ai.mode = 'flee';
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        ai.calmUntil = ctx2.world.time + 30;
        stampWakeSite(live); // wave 30: pirate/ace wake-trailing contract
        ctx2.emit('commLine', { text: 'Running.', from: st.name });
        break;
      }
      case 'respect': {
        // Mutual respect: the Named Gun stands down. No fear, no econ — only
        // a long calm so the encounter truly ends.
        ai.mode = 'flee';
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        ai.calmUntil = ctx2.world.time + 60;
        stampWakeSite(live); // wave 30: a standing-down Named Gun leaves a trail
        ctx2.emit('commLine', { text: 'Another time, then.', from: st.name });
        break;
      }
      case 'callowVouch': {
        // Wave 11: Old Callow sells a word in the keepers' two-column ledger.
        // He was never bargaining, so NO fear change, NO surrender flag, NO ai
        // mutation — the encounter is a purchase, not a capitulation. The vouch
        // is witnessed by rec.vouched + keeper trust/favors + the milestone
        // (§8.7: nothing is pushed to world.incidents).
        ctx2.world.credits -= CALLOW.vouchCost;
        live.record.vouched = true;
        for (const c of ctx2.world.contacts) {
          if (c.role === 'dockmaster' && (c.system === 'hush' || c.system === 'verge')) {
            bumpTrust(ctx2, c, CALLOW.vouchTrust);
            addFavor(ctx2, c);
          }
        }
        if (!ctx2.world.milestones.includes('callowVouched')) {
          ctx2.world.milestones.push('callowVouched');
          ctx2.emit('milestone', { id: 'callowVouched', line: CALLOW.vouchMilestoneLine });
        }
        ctx2.emit('commLine', { text: CALLOW.vouchLine, from: st.name });
        break;
      }
      case 'keepFiring':
        break; // close only; the fight continues
      case 'payTribute': {
        // Wave 30 demand-hail: buy the pirate off. Clamped at 0 — a pilot
        // who can't cover the full demand pays what they have; partial
        // payment still counts. The paid-off pirate runs and stays calm a
        // while; npc.js releases the weapons-cold hold on 'hailClosed'.
        ctx2.world.credits = Math.max(0, ctx2.world.credits - (h.demand ?? 0));
        ai.mode = 'flee';
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        ai.calmUntil = ctx2.world.time + 60;
        ai.demandOutcome = 'paid';
        stampWakeSite(live);
        ctx2.emit('commLine', { text: 'Smart. Run along.', from: st.name });
        break;
      }
      case 'showTeeth': {
        // Wave 30 hidden-mounts bluff (§29 Q-ship): success odds scale with
        // fear — the whisper does the work before the guns have to.
        const bluffP = HIDDEN_MOUNTS.bluffBase + ctx2.world.fear * HIDDEN_MOUNTS.bluffPerFear;
        if (Math.random() < bluffP) {
          ai.mode = 'flee';
          ai.phase = null;
          ai.intent = false;
          ai.target = null;
          ai.calmUntil = ctx2.world.time + HIDDEN_MOUNTS.calmSeconds;
          ai.demandOutcome = 'bluffed';
          bumpFear(ctx2, 1); // the Q-ship sighting spreads
          stampWakeSite(live);
          ctx2.emit('commLine', { text: 'Guns where none should be. Breaking off.', from: st.name });
        } else {
          // Called bluff: the pirate steadies (resolve bump) and presses the
          // attack — intent stays true, and the hold releases here rather
          // than waiting on npc.js's hailClosed scan.
          st.resolve = Math.min(95, st.resolve + HIDDEN_MOUNTS.failResolveBump);
          ai.demandOutcome = 'failed';
          ai.demanding = false;
          ctx2.emit('commLine', { text: 'Nice plating. Burn them.', from: st.name });
        }
        break;
      }
      case 'refuseFight': {
        // No parley: the card closes and the pirate attacks.
        ai.demandOutcome = 'refused';
        ai.demanding = false;
        break;
      }
      default:
        break;
    }
    ctx2.emit('hailClosed', {});
    closeCard();
  }

  function intentLabel(h, intent) {
    switch (intent) {
      case 'demandCargo':
        return 'Demand cargo';
      case 'demandRansom':
        return `Demand ransom — ${h.ransom} UU`;
      case 'acceptTribute':
        return `Accept tribute — ${h.tribute} UU`;
      case 'letGo':
        return 'Let them go';
      case 'respect':
        return 'Mutual respect — stand down';
      case 'callowVouch':
        return `Buy his vouch — ${CALLOW.vouchCost} UU`;
      case 'keepFiring':
        return 'Keep firing';
      case 'payTribute':
        return `Pay tribute — ${h.demand} UU`;
      case 'showTeeth':
        return 'Show teeth — reveal the hidden mounts';
      case 'refuseFight':
        return 'Refuse — and fight';
      default:
        return intent;
    }
  }

  function openCard(ev) {
    const live = ev.ship;
    if (!live || !live.state) return;
    const st = live.state;
    const intents = INTENT_ORDER.filter((i) => ev.intents && ev.intents.includes(i));
    if (intents.length === 0) return;
    open = {
      ship: live,
      intents,
      ransom: ransomFor(st), // rolled once so the offer is stable
      tribute: Math.round(ECON.tributeRate * cargoValue(st.cargo, ctx.world.prices)),
      demand: ev.demand ?? null, // wave 30: pirate demand-hail amount, rolled at emit time
      buttons: null,
    };

    // Rebuild card contents (hail-time allocation only).
    card.textContent = '';
    const speaker = live.record?.pilot ?? st.name;
    const factionName = FACTIONS[st.faction]?.name ?? st.faction;
    const header = document.createElement('div');
    header.style.cssText = 'font-size:13px;letter-spacing:.12em;color:#6ff2e0;';
    header.textContent = `HAIL — ${speaker}`;
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:10px;letter-spacing:.1em;color:rgba(111,242,224,.6);margin-top:2px;';
    sub.textContent = `${factionName} · ${st.name}`;
    const line = document.createElement('div');
    line.style.cssText = 'font-size:12px;color:#d7e4ea;margin:8px 0 10px;';
    line.textContent = `“${ev.line ?? 'They are breaking.'}”`;
    card.append(header, sub, line);

    open.buttons = intents.map((intent, idx) => {
      const btn = document.createElement('button');
      btn.style.cssText =
        'display:block;width:100%;text-align:left;margin-top:4px;padding:6px 10px;' +
        'background:rgba(111,242,224,.06);border:1px solid rgba(111,242,224,.3);' +
        'color:#6ff2e0;font:inherit;font-size:11px;letter-spacing:.1em;cursor:pointer;';
      btn.textContent = `[${idx + 1}] ${intentLabel(open, intent)}`;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(111,242,224,.18)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(111,242,224,.06)';
      });
      btn.addEventListener('click', () => resolveIntent(ctx, intent));
      card.appendChild(btn);
      return btn;
    });
    root.style.display = 'block';
  }

  // Number-key shortcuts while the card is open. NOTE: Digit1–3 also switch
  // player weapon groups (controls.js) — known overlap, flagged to orchestrator.
  window.addEventListener('keydown', (e) => {
    if (!open || !open.buttons) return;
    const m = /^Digit([1-9])$/.exec(e.code);
    if (!m) return;
    const idx = Number(m[1]) - 1;
    if (idx < open.intents.length) {
      e.preventDefault();
      resolveIntent(ctx, open.intents[idx]);
    }
  });

  return {
    update() {
      for (const ev of ctx.events) {
        if (ev.type === 'hailOpened') openCard(ev);
        else if (ev.type === 'hailClosed' && open) closeCard();
      }
      // Bargaining timeout: target destroyed, disabled, or despawned mid-hail.
      if (open) {
        const st = open.ship.state;
        if (st.destroyed || st.disabled || !ctx.ships.includes(open.ship)) closeCard();
      }
    },
  };
}
