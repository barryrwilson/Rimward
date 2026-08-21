# BIO-03 Wave 76 — motion slice notes

**Status:** inventory preserve + NPC GPU swim Hz from speed.  
**Not this slice:** class-look rebuild, new GLBs, player `makeLivingHull` clone.

## What landed

- Beautiful NPC materials no longer share module-global `uSwimTime` / `uSwimAmp`.
- Each Beautiful instance owns `object.userData.swimUniforms` (`uSwimTime`, `uSwimAmp`, `uSwimHz`).
- LOD clones bind the same uniform objects.
- Hz map: idle 0.5 → cruise 2.3, `clamp(speed / 120, 0, 1)`. 120 is light-class cruise, not a persist field.
- Missing `speed` (Models Browser, plated remount) → idle 0.5 Hz.
- `reducedMotion` still sets amp 0.
- `npc.js` live loop passes `live.ai.velocity.length()` (0 when disabled).
- Player path untouched (`ship.js` not edited).
- `LIVING_STOCK` untouched.

## Probe (GPU Hz)

Chrome console after a Beautiful system has traffic:

```js
const ships = window.__ctx.ships.filter((s) => s.state.faction === 'beautiful');
for (const s of ships) {
  const u = s.object.userData.swimUniforms;
  const spd = s.state.disabled ? 0 : s.ai.velocity.length();
  console.log(s.state.classKey, { speed: spd, hz: u?.uSwimHz.value, amp: u?.uSwimAmp.value });
}
```

A moving hull must show `hz` above a parked hull (~0.5).  
After first draw, a hull mesh also holds `mesh.material.userData.swimUniforms.uSwimHz.value` (same object).

`reducedMotion`: all `uSwimAmp.value === 0`.

Glow remains a Group (`object.userData.glow`) with a mesh child.

## Flows

1. New game, living starter: CPU manta swim/breath unchanged.
2. Beautiful system (`bt_cradle` / Bloom): pause and compare moving vs idle NPC swim Hz.
3. Models Browser `ship:beautiful:*` still loads; omit-speed → idle Hz.
4. Console: no new GLB load errors.

## Cost

- Build/LOD time: clone 6 materials per Beautiful instance per LOD (textures shared).
- Frame: write 3 uniform `.value` fields. No player-sized vertex loop.
- Phase: `Math.random` morph offset still visual-only; not persisted.
