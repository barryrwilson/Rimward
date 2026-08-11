# Freightor Fix Plan

## Current Measurements (from audit)
- hull: 113,724 vertices (target: 60,000-85,000)
- lights: 93,816 vertices (target: 8,000-20,000)  
- size: 112.0 (target: 66.0-92.4, aim 78.0)
- sternZ: 53.5
- glowZ: 36.0 (valid against current stern)
- singleMass: 91.7% (target: ≥97%)

## Issue 1: size 112.0 → target 78.0
Current z-span: from -39.8 (surveyAperture) to 38.0 (hexSpine end) = 77.8 span

The size measurement is max(spanX, spanY, spanZ). If size=112, then something extends further than 77.8 in at least one dimension.

Most likely issue: the silo/refinery positions extend the overall envelope.

Target: compress to ~39 each side (total ~78 span)

Proposed new positions:
- hexSpine: from -35.0 to 38.0 → from -30.0 to 33.0 (span 63)
- Forward control: from -37.0 → to -28.0 (move forward 9 units)
- Silo positions: [-22.0, -14.5, -7.0, 0.5, 8.0, 15.5] → [-14.0, -9.0, -4.0, 1.0, 6.0, 11.0]
- Refinery positions: [-28.5, 18.5, 26.0] → [-19.0, 12.0, 19.0]
- Tug positions: [-32.0, -5.0, 12.0, 28.0] → [-24.0, -3.0, 8.0, 20.0]

## Issue 2: lights 93,816 → target 8,000-20,000
Likely cause: nested loop creating excessive windowRow/lampString calls

Current lighting calls:
- windowRow in silo loop: 6 silos × 2 sides × 6 windows = 72 windows
- windowRow in refinery loop: 3 refineries × 2 sides × 4 windows = 24 windows
- lampString walkway loop: 6 positions × ~18 lamps = 108 lamps
- lampString ventral loop: 4 positions × ~16 lamps = 64 lamps
- lampString long spine: 2 calls × ~36 lamps = 72 lamps

Fix: reduce counts while keeping HUMAN-scale dimensions
- Reduce silo windowRow from 6 to 4 windows
- Reduce refinery windowRow from 4 to 3 windows  
- Reduce walkway lampString positions from 6 to 4
- Reduce ventral lampString positions from 4 to 3
- Keep long spine lampString (needed for scale cue)

## Issue 3: hull 113,724 → target 60,000-85,000
Current hull vertex drivers:
- 6 silos × 2 sides: each is cyl(8 segments) + ribBands(5 rings) + end caps
- 3 refineries × 2 sides: each is cyl(10 segments) + ribBands(8 rings) + pipe runs
- hexSpine: main box with ribBands
- hexModule: detailed module with windows
- Tug docks: detailed dock structures

Fix: reduce segment counts on large drums
- Reduce silo cyl from 8 to 6 radial segments (maintains cylinder appearance)
- Reduce refinery cyl from 10 to 8 radial segments  
- Reduce silo ribBands from 5 to 4 rings
- Reduce refinery ribBands from 8 to 6 rings
- Keep small detailed parts unchanged

## Issue 4: singleMass 91.7% → target ≥97%
Current issue: floating islands at:
- Forward outboard pair: z[-60.8, -54.4] - beyond current geometry!
- Aft outboard starboard: z[48.0, 54.4] - unmirrored, missing port side

These z-coordinates don't match the current code, which suggests the file may have been modified. But the fix is the same:

Fix: ensure all connecting members penetrate INSIDE both bodies
- Push truss endpoints at least 30% into the smaller body
- Ensure all side members are inside `for (const sx of [1, -1])` loops
- For the aft section, ensure both port and starboard have identical connections

Current truss connections:
- Silo truss: from spine(sx*3.0) to silo(sx*7.2) - need to verify silo center is at sx*8.5
- Refinery truss: from spine(sx*3.2) to refinery(sx*8.0) - need to verify refinery center is at sx*9.5

The truss should go FROM the spine TO the silo/refinery, penetrating both:
- Silo: truss from spine(3.0) to silo(7.2) where silo center is 8.5, radius 3.8 → penetration ~1.3 into silo (~34% of radius) ✓
- Refinery: truss from spine(3.2) to refinery(8.0) where refinery center is 9.5, radius 4.8 → penetration ~1.5 into refinery (~31% of radius) ✓

The forward island issue suggests the hexModule at -33.0 extends beyond the hexSpine at -35.0, creating a floating mass. Need to move hexModule inside the spine.

## Issue 5: glowZ validation
After changing length, need to verify: 0.55 * sternZ <= glowZ <= sternZ + 1.2

If new stern is 33.0: glowZ must be 18.15 to 34.2
Current glowZ is 36.0, which would be invalid if stern moves to 33.0

New glowZ should be approximately 0.55 * 33.0 = 18.15 to 34.2 range
Aiming for glowZ ≈ 26.0 (roughly 0.8 * sternZ for good placement)

## Implementation Order
1. Fix singleMass first (ensure hexModule is inside hexSpine, verify all truss penetrations)
2. Compress z-positions to fix size
3. Update glowZ for new stern position
4. Reduce lighting calls
5. Reduce hull segments
