/**
 * RIMWARD web — bio companion inner life (doc §14).
 * Writes ONLY ctx.bio. Sustain §14.5, moods §14.6, wounds §14.7.
 * Station feeding mutates ctx.bio directly (station.js owns purchases);
 * this system owns hunger drift, wound accrual/regen, mood, and bond growth.
 */

// --- Sustain (§14.5) ---
const HUNGER_SECONDS = 90 * 60; // +1.0 hunger per ~90 min active (unpaused, undocked) play
const WOUND_PER_DAMAGE = 1 / 300; // hull-reaching hit → wounds
const WOUND_REGEN_DELAY = 15; // s clean out-of-combat interval (shell-like, §6.4)
const WOUND_REGEN_RATE = 0.015; // ~66 s full heal — visibly slow §14.5
const WOUND_REGEN_DOCKED_MULT = 4; // station tend accelerates healing (§12)

// --- Mood timing (§14.6) ---
const SERENE_CALM_SECONDS = 30; // no combat this long → serene eligible
const COMBAT_RECENT_SECONDS = 10; // combat this recent → keen eligible
const BURNER_RECENT_SECONDS = 6; // afterburner use also keys keen
const FERAL_SECONDS = 60; // atrocity rage duration, then subsides to anxious
const FERAL_SUBSIDE_SECONDS = 20; // shaken-anxious hold after the rage

// --- "Prolonged shaking": many hits / shields down → anxious ---
const TRAUMA_ANXIOUS_AT = 0.5;
const TRAUMA_DECAY = 0.05; // per second

// --- Bond growth (§14.4 care; no cap mechanics in v1, tracked 0..1) ---
const BOND_SERENE_RATE = 0.002; // peaceful flight
const BOND_HEAL_RATE = 0.003; // healing together
const BOND_FED_BONUS = 0.1; // a real feeding (hunger drop ≥ threshold)
const FED_DROP_THRESHOLD = 0.2;

// Modest gameplay effects (§14.6): [speedFactor, turnFactor]
const MOOD_FACTORS = {
  serene: [1.0, 1.0],
  keen: [1.0, 1.05],
  anxious: [0.97, 0.97],
  pained: [0.9, 1.0],
  feral: [1.08, 0.95],
};

export function initBio(ctx) {
  const bio = ctx.bio;
  let lastHitAt = -1e9;
  let lastCombatAt = -1e9;
  let lastBurnerAt = -1e9;
  let feralUntil = -1e9;
  let subsideUntil = -1e9;
  let trauma = 0;
  let prevHunger = bio.hunger;

  return {
    update(dt) {
      const now = ctx.world.time;
      bio.songEvent = null; // cleared each frame; re-set below on mood change

      // --- consume last frame's events (indexed loop: no per-frame allocs) ---
      const evs = ctx.lastEvents;
      for (let i = 0; i < evs.length; i++) {
        const e = evs[i];
        switch (e.type) {
          case 'playerHit':
            // Approximation per spec: any playerHit wounds the companion.
            bio.wounds = Math.min(1, bio.wounds + e.damage * WOUND_PER_DAMAGE);
            lastHitAt = now;
            lastCombatAt = now;
            trauma = Math.min(1, trauma + e.damage / 50 + 0.08);
            break;
          case 'npcHit':
          case 'npcFire':
            lastCombatAt = now;
            break;
          case 'shieldDown':
            if (e.layer === 'shell') trauma = Math.min(1, trauma + 0.35);
            break;
          case 'npcDestroyed': {
            // §7.7: destroying a surrendered/disabled ship is an atrocity —
            // plain, not celebrated (§7.9); world/hud react to 'atrocity'.
            const st = e.ship && e.ship.state;
            if (st && (st.surrendered || st.disabled)) {
              feralUntil = now + FERAL_SECONDS;
              ctx.emit('atrocity');
            }
            break;
          }
          case 'playerDestroyed':
            // §14.7: grievous wound, never permadeath.
            bio.wounds = 1;
            trauma = 1;
            lastHitAt = now;
            break;
        }
      }

      // --- hunger drift (station.js sets hunger down on feeding) ---
      if (!ctx.flags.docked) {
        bio.hunger = Math.min(1, bio.hunger + dt / HUNGER_SECONDS);
      }
      if (prevHunger - bio.hunger >= FED_DROP_THRESHOLD) {
        bio.bond = Math.min(1, bio.bond + BOND_FED_BONUS);
      }
      prevHunger = bio.hunger;

      // --- wound regeneration: out of combat, slow; faster docked (§14.5) ---
      if (bio.wounds > 0 && now - lastHitAt >= WOUND_REGEN_DELAY) {
        const rate = ctx.flags.docked ? WOUND_REGEN_RATE * WOUND_REGEN_DOCKED_MULT : WOUND_REGEN_RATE;
        bio.wounds = Math.max(0, bio.wounds - rate * dt);
        bio.bond = Math.min(1, bio.bond + BOND_HEAL_RATE * dt);
      }

      // --- keen trigger: afterburner use ---
      if (ctx.ship.burnerActive) lastBurnerAt = now;

      trauma = Math.max(0, trauma - TRAUMA_DECAY * dt);

      // --- mood state machine (§14.6); hold previous between bands ---
      const healthy = bio.wounds < 0.3 && bio.hunger < 0.7;
      let mood = bio.mood;
      if (now < feralUntil) {
        mood = 'feral';
      } else if (bio.wounds >= 0.6) {
        mood = 'pained';
      } else if (bio.hunger >= 0.7 || trauma >= TRAUMA_ANXIOUS_AT || now < subsideUntil) {
        mood = 'anxious';
      } else if (bio.mood === 'feral') {
        mood = 'anxious'; // feral subsides to anxious, not straight to calm (§14.6)
        subsideUntil = now + FERAL_SUBSIDE_SECONDS;
      } else if (healthy && (now - lastCombatAt < COMBAT_RECENT_SECONDS || now - lastBurnerAt < BURNER_RECENT_SECONDS)) {
        mood = 'keen';
      } else if (now - lastCombatAt >= SERENE_CALM_SECONDS && bio.hunger < 0.5 && bio.wounds < 0.3) {
        mood = 'serene';
      }
      // else: hysteresis — no band fully matched, keep current mood.

      if (mood !== bio.mood) {
        bio.mood = mood;
        bio.songEvent = mood; // consumed by song.js/hud.js later this frame
        ctx.emit('moodChanged', { mood });
      }

      const f = MOOD_FACTORS[mood];
      bio.speedFactor = f[0];
      bio.turnFactor = f[1];

      if (mood === 'serene') bio.bond = Math.min(1, bio.bond + BOND_SERENE_RATE * dt);
    },
  };
}
