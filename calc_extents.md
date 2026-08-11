# Current Freightor Z-Extents

## Hull Parts (manually walking every b.push):

1. **hexSpine**: from -35.0 to 38.0 (span = 73.0)

2. **Forward control block**:
   - surveyAperture at z=-37.0, depth 2.8 → spans -39.8 to -34.2
   - hexModule at z=-33.0, len 4.5 → spans -35.25 to -30.75
   - bridge box: 2.4×1.2×5.2 at z=-33.0 → spans -35.75 to -30.25

3. **Ore silos** (6 positions × 2 sides):
   - Positions: [-22.0, -14.5, -7.0, 0.5, 8.0, 15.5]
   - Each silo: r=3.8, len=7.0 → spans ±3.5 from center
   - Silo at -22.0: spans -25.5 to -18.5
   - Silo at -14.5: spans -18.0 to -11.0
   - Silo at -7.0: spans -10.5 to -3.5
   - Silo at 0.5: spans -3.0 to 4.0
   - Silo at 8.0: spans 4.5 to 11.5
   - Silo at 15.5: spans 12.0 to 19.0

4. **Refinery drums** (3 positions × 2 sides):
   - Positions: [-28.5, 18.5, 26.0]
   - Each drum: r=4.8, len=5.0 → spans ±2.5 from center
   - Refinery at -28.5: spans -31.0 to -26.0
   - Refinery at 18.5: spans 16.0 to 21.0
   - Refinery at 26.0: spans 23.5 to 28.5

5. **Tug docks** (4 positions × 2 sides):
   - Positions: [-32.0, -5.0, 12.0, 28.0]
   - Each dock: w=5.0, d=4.5 → spans ±2.25 from center
   - Tug at -32.0: spans -34.25 to -29.75
   - Tug at -5.0: spans -7.25 to -2.75
   - Tug at 12.0: spans 9.75 to 14.25
   - Tug at 28.0: spans 25.75 to 30.25

## Overall Z-Span
- Most negative: surveyAperture at -39.8
- Most positive: hexSpine end at 38.0
- Current spanZ = 77.8

## X-Span
- Silos at x=±8.5, r=3.8 → spanX = 24.6
- Refineries at x=±9.5, r=4.8 → spanX = 28.6
- Tug docks at x=±5.5 → not the limiting factor

## Why size = 112.0?
- spanZ = 77.8, spanX ≈ 28.6, spanY ≈ ?
- This suggests there's additional geometry extending further

## SingleMass Issue
- Forward islands at z[-60.8, -54.4] - this is BEYOND the current geometry!
- This suggests the hexModule at -33.0 doesn't overlap the hexSpine at -35.0
- hexModule spans -35.25 to -30.25, hexSpine starts at -35.0
- The hexModule extends 0.25 units beyond the hexSpine front
- This creates a floating island

## Target Fix
- Target size: 78.0 (current is 112.0)
- Aim for z-span of about 78: from -39 to 39
- Need to compress the spine while keeping all content
- Fix singleMass by ensuring hexModule is INSIDE hexSpine
