# Claude Code prompt — Pandora-style pseudo-3D world map

Use **Opus**. Replace the flat GB-style tile engine with a **pseudo-3D top-down world map** in the style of the mobile game Pandora (survival RPG). Reference: lush painted-looking environment, tall trees with round canopies and drop shadows, organic grass/dirt textures, depth via Y-sorting — NOT isometric diamond tiles.

**Note (2026-07-02): this supersedes the isometric world-map rewrite (Stages 1-3 already merged to main as commits bcd8e06/e702ce8/d0ad20f, gated behind `window.__kq_isoDebug`). That iso code is being left in place as dead weight unless explicitly asked to be removed — this Pandora-style rewrite does NOT build on it and uses an entirely different (non-isometric) technique.**

Read `src/lib/tileEngine.js`, `src/hooks/useWorldGameLoop.js`, `src/lib/tileMaps.js`, `src/config/worldConfig.js`, `src/components/WorldScreen.jsx`, and `src/lib/drawEnemy.js` carefully before writing any code. All gameplay logic (movement, collision, battle triggers, chests, NPCs, tall grass encounters, maze, boss, fog-of-war) stays exactly the same — only the visual rendering changes.

---

## Visual style target (Pandora-like)

- **Background**: soft painted-looking ground — gradient base (warm green for grass, earthy tan/brown for paths, dark green for forest zones) with subtle noise/variation to avoid flat look. No hard tile grid lines visible.
- **Trees**: tall standing objects — a short dark trunk rectangle + a large round/oval canopy (filled circle, dark green rim, lighter green highlight on upper-left). Drop shadow ellipse on the ground below. Trees feel like they have real height and mass.
- **Rocks/walls**: rounded boulder shapes with light/shadow faces, not flat rectangles.
- **Water**: animated soft blue area with gentle shimmer highlights.
- **Tall grass**: clusters of thin vertical strokes in varying greens, slightly randomized positions within the tile.
- **Path/dirt**: warm beige-tan area, slightly rough texture (scattered dark dots, subtle variation).
- **Depth**: objects sort by their Y position on screen — things lower on screen (larger Y) draw on top of things higher up. This creates the pseudo-3D "things in front cover things behind" feel without any iso math.
- **Shadows**: every standing object (tree, rock, chest, NPC, enemy, player) casts a soft elliptical shadow on the ground directly below it.
- **Lighting**: subtle ambient — canopy highlights on upper-left, shadow on lower-right. No full lighting engine needed, just baked into the draw functions.

Keep TILE = 32px (upgrade from 16px — gives more room for the richer art style). MAP_COLS = 20, MAP_ROWS = 15 as before. Update CANVAS_W/CANVAS_H accordingly (640×480 native).

---

## 1. New tile rendering (`tileEngine.js` — replace drawXxx functions)

Replace each flat-color tile draw function with a richer version:

**drawGrass(ctx, px, py)**:
- Fill the tile rect with a base green (#5a8a3c or similar warm grass green).
- Add 3-5 tiny random dark green dots per tile (seeded by px+py so it's stable, not random each frame).
- Add a slightly lighter highlight stripe on the top edge (1-2px).

**drawPath(ctx, px, py)**:
- Fill with warm tan (#c8a96e).
- Scatter 4-6 tiny dark dots (pebbles).
- Slightly lighter in the center, darker at edges.

**drawTallGrass(ctx, px, py)**:
- Draw grass base underneath.
- Add 6-8 vertical strokes (1-2px wide, 8-12px tall) in varying greens (#4a7a2c to #6ab04c), slightly randomized X positions within the tile. Sway-effect: alternate slight lean left/right.

**drawTree(ctx, px, py)**:
- Ground shadow: semi-transparent dark ellipse (40×12px) centered at bottom of tile.
- Trunk: dark brown rect (8px wide, 14px tall) centered horizontally, at bottom of tile.
- Canopy: large filled circle (radius ~22px) centered ~18px above trunk top. Color: outer rim #2d6a1e, filled #3d8a28. Add a lighter highlight arc on upper-left (#5ab040, radius ~14px, partial arc).
- The canopy extends ABOVE the tile's top boundary — this is intentional, it gives trees real height. The tree object is drawn taller than one tile.

**drawWater(ctx, px, py, frame)**:
- Fill with deep blue (#2a6aaa).
- Add 2-3 horizontal shimmer lines (lighter blue, #4a8acc) that alternate position between frame 0 and frame 1 (the existing 2-frame animation).
- Rounded corners if adjacent tiles are also water (optional).

**drawWall/drawRock(ctx, px, py)**:
- Fill base shape (rounded rect or irregular polygon) in mid-grey (#8a8a8a).
- Left face: slightly darker (#6a6a6a). Right face: slightly lighter (#aaaaaa). Top highlight: white-ish (#cccccc, thin).
- Ground shadow below.

**drawFlower(ctx, px, py)**:
- Grass base.
- 2-3 colored dots (pink #ff88aa, yellow #ffdd44, white) with tiny green stem.

**drawChest(ctx, px, py)**:
- Ground shadow.
- Box body (warm brown #8a5a2a), darker lid on top, metal clasp (yellow dot), slight 3D perspective (top face slightly lighter).

**drawSign(ctx, px, py)**:
- Post (thin brown rect).
- Board (beige rect on top of post).
- Small squiggly lines on board to suggest text.

**drawNPC(ctx, px, py)** — simple friendly character shape (round head, small body, waving arm).

---

## 2. Y-sort depth system (replace painter's algorithm)

Instead of drawing row by row, collect ALL objects (tiles with height + entities) into a draw list, sort by their **bottom Y pixel** (the Y coordinate of their ground contact point), and draw back to front:

```js
const drawList = []

// Add ground tiles (always behind everything)
for each visible tile:
  drawList.push({ y: tileBottomY, type: 'ground', draw: () => drawGroundTile(...) })

// Add standing objects (trees, rocks, chests, signs, NPCs)
for each visible tile with a standing object:
  drawList.push({ y: tileBottomY, type: 'object', draw: () => drawStandingObject(...) })

// Add enemies
for each enemy:
  drawList.push({ y: enemyBottomY, type: 'enemy', draw: () => drawEnemy(...) })

// Add player
drawList.push({ y: playerBottomY, type: 'player', draw: () => drawPlayer(...) })

// Sort and draw
drawList.sort((a, b) => a.y - b.y)
drawList.forEach(item => item.draw())
```

This means a tree canopy covers the player when the player walks "behind" it (player's Y < tree's Y) and the player covers the tree when walking "in front" (player's Y > tree's Y). This is the core of the pseudo-3D feel.

Ground tiles (grass, path, water, tall grass) draw first as a flat layer, then standing objects + entities sort among themselves.

---

## 3. Player rendering

Keep `renderEggSprite()` for the egg. Add:
- A drop shadow ellipse (semi-transparent dark oval, ~20×6px) under the egg's feet, drawn before the egg sprite.
- Scale the egg slightly: the egg sprite that was 32×32 should now be ~40×48px to feel more prominent on the larger tiles.

Player position on screen: `(g.displayX * TILE + TILE/2, g.displayY * TILE + TILE * 0.8)` — place the egg so its "feet" are near the bottom of its tile.

---

## 4. Enemy rendering (`drawEnemy.js` — upgrade each type)

Upgrade each enemy to the same pseudo-3D style:
- Drop shadow ellipse below each enemy.
- Bodies feel rounded/volumetric — use circles/ellipses instead of flat rects where possible.
- Light source from upper-left: brighter on upper-left, darker on lower-right.
- Keep each enemy's distinctive color/shape identity.

Specific upgrades:
- **sleepy_bunny**: white oval body, round head, small pink ears, closed eyes (sleeping), drop shadow.
- **bouncy_slime**: translucent blue-green oval (ctx.globalAlpha ~0.8), darker rim, lighter highlight dot on top-left, wobbly (use frame to alternate between slightly taller and wider shape).
- **fox_kit**: orange oval body, pointy ears, white belly patch, black dot eyes, fluffy tail.
- **ghost_wisp**: semi-transparent white/purple oval (globalAlpha 0.7), wavy bottom edge, glowing inner light.
- **snake**: series of green oval segments in an S-curve, darker scales pattern, triangular head.
- Other types: similar treatment — rounder, more volumetric, with shadow.

---

## 5. Camera

Camera logic stays identical. Update the pixel math to use the new TILE = 32 size:
`camX = playerDisplayX * TILE + TILE/2 - viewW/2`
`camY = playerDisplayY * TILE + TILE/2 - viewH/2`
Clamped to map pixel bounds (MAP_COLS * TILE, MAP_ROWS * TILE).

---

## 6. Collision and gameplay — NO CHANGES

`canMove()`, `tryMove()`, all battle triggers, tall-grass encounters, chest opening, NPC proximity, sign reading, maze portal, boss trigger, fog-of-war, exit tiles — keep exactly as-is. Only the visual rendering changes. The tile type codes in tileMaps.js are unchanged.

---

## 7. Staged approach — STOP and report after each stage

**Stage 1**: Ground tiles only (grass, path, water, tall grass). No trees, no objects, no entities. Just the ground looking good. Commit and report.

**Stage 2**: Add trees, rocks, walls. Y-sort correct (can walk "behind" trees). Commit and report.

**Stage 3**: Player egg with shadow, movement tween working, depth-sorted with trees. Commit and report.

**Stage 4**: All enemies upgraded, depth-sorted with everything. Commit and report.

**Stage 5**: Chests, signs, NPCs, all interactive objects drawn in new style. All gameplay triggers working. Commit and report.

**Stage 6**: Polish — ground texture variation, lighting consistency, any z-sorting artifacts. Final commit and push.

---

## Docs + deploy (after all stages)
- Update `CURRENT_STATE.md`, `TASKS.md`, `CHANGELOG.md`, `CLAUDE.md`: world map now Pandora-style pseudo-3D (painted bg, tall trees, Y-sort depth, shadows, TILE=32); all gameplay preserved.
- `git push origin main`; ntfy if configured.

## Acceptance
- World map looks lush and pseudo-3D: painted ground textures, tall trees with canopies and shadows, rounded enemies with depth.
- Player walks "behind" trees when their Y < tree Y, and "in front" when Y > tree Y (Y-sort working).
- Drop shadows visible under all standing objects including the player egg.
- All gameplay intact: movement, collision, battle, chests, NPCs, tall grass encounters, boss, maze, fog-of-war.
- No regressions to Home, Room, Shop, Battle, Minigames, Friends, coins, progress, `eggAlgorithm.js`, `ENEMY_DATA.subject`.
