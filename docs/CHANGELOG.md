# Changelog — KidQuest

## 2026-07-07 — Room expansion UX: ghost iso room previews

Replaced the mini-map's small "+" buy-cell as the primary room-purchase entry point with full-size ghost room previews rendered directly in the iso scene.

### src/lib/roomScene.js
- `computeMultiRoomGeometry(W, H)` — sizes TH so a 3×3 room grid (current room center, 4 cardinal neighbors, diagonals blank) fits the canvas; exposes `isoRoomWidth`/`isoRoomHeight` (the floor diamond's own screen-space bounding box).
- `shiftGeometry(g, offsetX, offsetY)` — returns a geometry whose `project()` is `g`'s translated by a fixed screen offset, so neighbor previews reuse the same TH/TW without recomputing it.
- `drawGhostRoom(ctx, g, price, boost)` — dashed gold floor+wall outlines, faint fill, continuous pulsing glow (`Date.now()`-seeded sine, ~2s period), "＋ price🪙" label; `boost` (0-1) briefly brightens it for the swipe-toward-empty-direction feedback. Returns the floor-quad polygon for hit-testing.
- `drawMiniRoomBox(ctx, g, theme, opacity)` — solid floor+walls in the room's own theme colors at 0.7 opacity + theme icon + name label, for already-purchased adjacent rooms. Also returns its floor-quad polygon.
- `drawRoomScene()` gained optional `geometry`/`paintBg` params so Room.jsx's multi-room composite can draw the center room at the SAME TH/TW scale as its neighbor previews, and skip repainting the full-canvas backdrop per room.
- `floorQuad`/`leftWallQuad`/`rightWallQuad`/`pointInQuad` are now exported (previously module-private) for reuse by the new geometry helpers and Room.jsx's neighbor hit-testing.

### src/components/Room.jsx
- `drawFrame` rewritten: paints the shared backdrop once, then for each of the 4 cardinal directions draws either a real neighbor room (`drawMiniRoomBox`) or a ghost (`drawGhostRoom`), then the fully-editable center room on top (via `drawRoomScene({ geometry, paintBg:false })`) — all sharing one scale. Neighbor screen positions are recomputed every frame into `neighborZonesRef` for hit-testing.
- `handleCanvasClick` checks `neighborZonesRef` before the existing `hitTestZone` — tapping a real neighbor's floor navigates there (`SET_ACTIVE_ROOM`); tapping a ghost opens the existing purchase bottom sheet (theme picker → confirm), now with a direction-aware title ("เพิ่มห้อง{ด้านขวา/ซ้าย/บน/ล่าง} 🪙1000") and an explicit "เหรียญไม่พอ 😢 ต้องการอีก N🪙" message when short.
- `navigateGrid` (swipe navigation) now pulses the matching ghost for 500ms + shows a "กดเพื่อซื้อ!" toast when a swipe finds no real room in that direction, instead of silently doing nothing.
- The rAF loop keeps running continuously whenever any ghost is on screen (needed for the perpetual pulse), not just during the hint-fade/bounce/sparkle window it previously settled to.
- `RoomMiniMap`'s dashed adjacent-empty cells are now purely decorative (no `onClick`) — purchasing is driven entirely by the in-scene ghost rooms now, so the old separate "+" buy button is gone.
- Confetti (`mkSparks`/`tickEffects`, same system as furniture-placement sparkle) fires on a successful room purchase.
- `BUY_ROOM_BLOCK`'s reducer already made the new room active on purchase (pre-existing behavior) — satisfies "auto-navigate to new room" with no new code.

### Verification
- `npm run build` clean.
- Live end-to-end with the test account: all 4 ghost rooms render with dashed outlines + pulsing "+1000🪙" labels; tapped the right ghost → direction-aware sheet → picked a theme → confirmed (coins 9675→8675, exact) → confetti fired → auto-navigated into the new pool room, with the old default room now shown as a solid, tappable preview to its left; tapped that preview → navigated back correctly. Zero console errors. (Purchased room could not be reverted afterward — the app has no room-deletion mechanic yet, same as any other real purchase verified live on this account in past sessions.)

## 2026-07-07 — Crafting system (materials + workbench) + enemy art polish pass

Built 2026-07-05, left uncommitted; this session verified (build + live end-to-end test), documented, and committed. Two independent pieces in the same diff: a new furniture-crafting loop, and a detail pass on 9 of 10 world-map enemy sprites.

### src/lib/roomItems.js
- New `MATERIALS`/`MATERIAL_ICON`/`RECIPES`/`RECIPE_LIST` exports and a `craftGlint()` helper (small pulsing sparkle drawn on every crafted item so it reads as handmade).
- `crafting_table` (🪙200, normal coin-buyable floor item) + 15 new `craftedOnly: true` furniture draw functions (9 floor, 6 wall) — hidden from the coin buy-picker until unlocked via crafting.

### src/lib/state.js
- `defaultState()`: `materials` (6 keys, default 0), `craftedItems: []`, `dailyCollectCount: 0`, `lastCollectDate: ''`.
- `migrateStateShape()`: `materials` added to the nested-object backfill list.

### src/context/StateContext.jsx
- `COLLECT_MATERIAL { material, amount }` — awards a material (cap 99), advances/resets the 20/day collect counter (`todayStr()` convention, same as minigame lives), enforced server-side (reducer) even though the caller already checks the remaining budget.
- `CRAFT_ITEM { itemId }` — validates the recipe, deducts materials, adds to `ownedRoomItems` + `craftedItems`. No-op on unknown/unaffordable/already-owned.

### src/components/WorldScreen.jsx
- New 🧺 collect button (bottom-left) + material HUD strip + toast feedback. Checks the player's tile + 4 orthogonal neighbors for a collectible: `T.TREE`/`T.TALL`→wood, `T.PATH`→stone, `T.FLOWER`→a theme-dependent material — chosen over the original spec's WALL/WATER-keyed table because `tileMaps.js` never generates those tile types in any world, which would have made those materials permanently uncollectible.

### src/components/Room.jsx
- Tapping a placed `crafting_table` opens a dedicated recipe sheet (2-column grid, live afford/unafford coloring, confirm sub-view, craft-success sparkle burst on a dedicated overlay canvas) instead of the generic occupied-item sheet.
- New collapsible 🎒 material-inventory panel with a shortcut into the world map.
- `Room` now accepts a `navigate` prop (threaded from `App.jsx`) for that shortcut.

### src/lib/drawEnemy.js
- Detail pass on 9/10 Pandora world-map enemy sprites (sleepy_bunny, bouncy_slime, fox_kit, egg_pawn, leaf_sprite, mushroom_imp, baby_zombie, snake, ghost_wisp) — see `CURRENT_STATE.md` for the full per-type list. Pure art detail, zero behavior/gameplay change; the separate flat sprite set used by the battle screen is untouched.

### Verification
- `npm run build` clean.
- Live end-to-end with the test account: bought crafting table (exact coin deduction), collected materials on the world map (daily counter decremented correctly, correct tile→material mapping), crafted `stone_table` (unaffordable→affordable color transition confirmed at the exact threshold, materials deducted, "✓ มีแล้ว" badge, placeable via the normal picker) — then removed both test items to leave the account as found.
- Enemy art verified via `public/enemy_harness.html` (all 10 types, zero console errors).

## 2026-07-05 — Minigame lives/coin rebalance + visual/UX redesign

Part 1 (mechanical): reduced daily lives per game and lowered coin-reward tiers across all 5 minigames. Part 2 (visual): themed backgrounds, animated hearts/coin-preview HUD, redesigned result screens, Home shortcut polish, and a launch splash.

### src/lib/minigameLives.js
- `MINIGAMES[...].max`: memory/catch/tower 5→3, eggrun/fishing 3→2.

### src/context/StateContext.jsx / src/lib/state.js
- Found a real bug while doing the Part 1 edit: each `*_DEDUCT_LIFE` reducer case hardcoded its own daily-reset value (5/5/5/3/3), and `defaultState()` also hardcoded its own copy — both independent of `minigameLives.js`'s `MINIGAMES[...].max`. All three now read 3/3/3/2/2 consistently; otherwise the ready-screen hearts display would show the new lower cap while the reducer silently kept resetting to the old higher one.

### src/games/minigames/EggMemory.jsx, EggCatch.jsx, EggTower.jsx, EggRun.jsx, EggFishing.jsx
- Coin-formula constants lowered (exact new tiers in `CURRENT_STATE.md`) — the underlying score inputs (moves/rings/dist/rarity/etc.) are unchanged.
- All 5 now render `MinigameBg` (themed backdrop) + `InGameHUD` (live hearts + coin-tier preview) during play, and `MinigameResult` on game-over, replacing each game's previous plain inline result markup.
- Extracted each game's coin formula into a small named function (`memoryCoins`, `catchCoinsFor`, `towerCoinsFor`, `runCoinsFor`, `fishCoins`) so the in-play HUD preview and the result screen share one source of truth instead of duplicating the ternary.
- Fixed a genuine pre-existing gap surfaced while redesigning the result screen: all 5 games always showed an active "เล่นอีกครั้ง" retry button regardless of remaining daily lives — now disabled (swapped for "😴 พรุ่งนี้นะ!") once lives hit 0.

### src/games/minigames/minigameUI.jsx (new)
- `THEMES` — per-game palette + ambient-shape kind (memory deep-blue/stars, catch sky-blue/clouds, tower dark-purple/stone, eggrun forest-green/speed-lines, fishing ocean-teal/bubbles).
- `MinigameBg` — paints the themed gradient + ambient shapes once to an offscreen-sized canvas (same static-paint technique as `BattleBackground.jsx`/`Collection.jsx`'s `DressingRoomBackground`), not redrawn per frame.
- `InGameHUD` — themed top strip: live `🪙+N` coin-tier preview, center score/label, hearts row that pulses (`mg-heart-loss`) on loss.
- `MinigameResult` — shared game-over screen: bounce-in emoji, Press-Start-2P gold title/stats, a coin chip that spins in (`mg-coin-spin`) and counts up as 3–5 flying `🪙` sprites land (`mg-coin-fly`, pure CSS, no extra SFX — reuses the single `coin_earn` play `dispatchAddCoins` already fires), hearts-remaining row, and 🔄/🏠 buttons.

### src/components/Home.jsx
- Minigame shortcut kept its existing 54px floating circular form factor (a 2026-07-03 redesign deliberately replaced a card/row layout with this shape — not reverting that) — added a rotating conic-gradient glow ring + pulsing outline + 3 orbiting sparkle dots, a lives-badge that recolors orange and pulses at ≤2 lives, and a dimmed 😴-emoji swap (+ updated `aria-label`) when all daily plays are used up.
- New `miniSplash` state + `MINI_SPLASH` map: tapping the shortcut now shows an ~850ms full-screen splash (picked game's emoji bounces in, Thai name, "GO!" flash) before `SET_CURRENT_WORLD` + `navigate('game')` fire, via a hard-capped `setTimeout`.

### src/styles.css
- New keyframes: `mg-ring-spin`/`mg-ring-pulse`/`mg-spark-blink`/`mg-badge-lowpulse` (Home shortcut), `mg-splash-fade`/`mg-splash-emoji`/`mg-splash-go` (launch splash), `mg-pop`/`mg-coin-spin`/`mg-coin-fly` (result screen), `mg-heart-loss`/`mg-redflash`/`mg-shake` (in-play hearts/damage feedback) + `.mg-redflash` helper class.

### Verification
`npm run build` clean throughout. Live-verified in Chrome (test account): Home shortcut visual + splash for all 5 games; Egg Memory full round-trip (ready → play → result, confirmed coin-fly/spin landing on the correct new tier, hearts depleting, retry button); Egg Catch and Egg Run ready screens + in-play themed background/HUD; Egg Tower ready + in-play + 14 real block placements (confirmed the live `🪙+N` preview updates through score tier boundaries); Egg Fishing's full round-trip via its real 60-second timer (result screen, 0-coin/0-catch state, hearts row). Two environment issues were hit and worked around rather than silently skipped: a concurrent agent's own live-testing session shared the same browser tab group and dev server this session, requiring a fresh tab plus a surgical patch-based `git apply --cached` to stage only this task's hunks out of `StateContext.jsx`/`state.js` (both files also had unrelated in-flight multi-room-expansion edits); and Chrome's background-tab `requestAnimationFrame` suspension froze the physics-based minigames mid-test (worked around with a `setTimeout`-based rAF polyfill, and by preferring click-/timer-driven end-conditions for verification where rAF couldn't be forced to run).

## 2026-07-05 — Multi-room Den expansion

Room/Den decoration grows from a single room to a purchasable grid of themed rooms, per a full spec supplied directly by the user (schema, 6 themes, mini-map/swipe/purchase UI, pricing). `CURRENT_STATE.md` had previously flagged this as a deliberate deferred scope call awaiting design review — treated as approved now that the user gave the spec themselves.

### src/lib/state.js
- `defaultState()`: added `rooms: [{ id:'main', theme:'default', gridX:0, gridY:0, layout:{} }]`, `activeRoomId:'main'`, `homeRoomId:'main'`. The pre-existing `roomLayout` stays for backward compatibility but is now a strictly-derived MIRROR of the active room's layout, never independently mutated.
- `migrateStateShape()`: builds `rooms` from the post-reset `roomLayout` for any save that predates the field; leaves an existing `rooms` array completely untouched.

### src/context/StateContext.jsx
- New shared helper `applyRoomLayoutChange(state, roomId, newLayout)` — every room-content reducer routes through this so `rooms` and the `roomLayout` mirror can never drift apart.
- New reducers: `BUY_ROOM_BLOCK` (1000 coins; guards insufficient funds / occupied cell / not-orthogonally-adjacent), `SET_ACTIVE_ROOM`, `SET_HOME_ROOM` (independent of `activeRoomId`), `PLACE_ROOM_ITEM_IN_ROOM`, `REMOVE_ROOM_ITEM_FROM_ROOM`.
- `PLACE_ROOM_ITEM`/`REMOVE_ROOM_ITEM` (no `_IN_ROOM` suffix) kept working unchanged — now delegate to the room-aware versions against `state.activeRoomId`. `ownedRoomItems` stays a global, non-consumable unlock (unchanged) — an owned item can be placed across multiple rooms at once.

### src/lib/roomScene.js
- New `ROOM_THEMES` (icon/nameTh/price metadata) + `THEME_PALETTES` (default/pool/garden/veggie/forest/space) + `ROOM_BLOCK_PRICE`. `drawFloor`/`drawLeftWall`/`drawRightWall` now read the resolved palette; `default`'s values are byte-identical to the prior hardcoded hex codes (existing rooms are pixel-unchanged). Added a cheap seeded ambient decor layer per theme (pool ripples, garden flowers, veggie furrows, forest leaves, space glints + twinkling wall stars) — self-contained, independent of `tileEngine.js`'s theme system. `drawRoomScene()` now takes a `theme` param.

### src/components/Room.jsx
- New `RoomMiniMap` component (top-right overlay): shows owned rooms as themed icon squares (active = gold border, home = 🏠 badge), dashed "+" only on orthogonally-adjacent empty cells (tap → theme-purchase bottom sheet, reusing the existing sheet convention).
- Swipe-to-navigate on the room canvas (distance + time + axis-dominance gated so it doesn't fight tap-to-place); a floating room-label pill (theme icon + Thai name); a 🏠 "ตั้งเป็นห้องหลัก" button shown only when the active room isn't already home.

### src/components/DecoratedRoom.jsx
- Home's background now reads `rooms.find(r => r.id === state.homeRoomId)` directly (bypassing the `roomLayout` mirror) so browsing/editing other rooms in the Room editor never changes what Home shows.

### src/components/RoomVisit.jsx / FriendsScreen.jsx / RoomScene.jsx
- `RoomScene` takes a `theme` prop. `RoomVisit` gains a read-only room switcher shown when a visited adventurer has multiple rooms (`a.rooms`), falling back to the old flat `a.room_layout` when absent. `FriendsScreen`'s card thumbnail previews the first room in `a.rooms` when present.

### supabase/migrations/20260705_mystery_adventurers_multi_room.sql (pending — not yet applied)
- Extends `get_mystery_adventurers` to also return `rooms jsonb`. Must be run manually in the Supabase SQL Editor (no CLI/service key in this repo) — until then, `a.rooms` is `undefined` and the client degrades gracefully to the single flat room layout, exactly as it does today.

## 2026-07-04 — 5-world expansion + per-world tile-palette theme system

Grew the world-level system from 3 to 5 tiers, each with a genuinely distinct RO-style visual theme, and — the core of the task — wired the previously-dead `theme` config key into the renderer so the themes actually show up in the tile map (before this, all worlds rendered with one hardcoded palette).

### src/config/worldConfig.js
- `WORLD_LEVELS` expanded 3 → 5: **Green Meadow** (`grassland`), **Coral Coast** (`beach`), **Dark Forest** (`forest`), **Frost Peak** (`snow`), **Sky Kingdom** (`sky`). Ordering is an elevation/difficulty climb (meadow→shore→forest→snow peak→sky).
- Boss stats scaled progressively across the 5 tiers: HP 120→150→180→220→260, ATK 8→9→11→13→15, DEF 4→5→6→7→8. All bosses reuse existing enemy sprites (grumpy_mole / bouncy_slime / snake / fox_kit / egg_pawn); Thai boss names fit each theme (โมลราชา / ราชาวุ้นทะเล / งูราชา / ราชาจิ้งจอกหิมะ / ราชาหุ่นเวหา). Enemy pools reuse only existing types.
- New exported `WORLD_THEME_ICON` map (grassland 🌿 / beach 🌊 / forest 🌲 / snow ❄️ / sky ☁️) for icon-first UI.
- **Scope note:** the old tier 2 "Crystal Cave / cave" was *retired*. The detailed special-variant spec covered grassland/beach/forest/snow/sky (5 fully-specified themes); "cave" had no rendering spec. Rather than invent cave art and leave the fully-specified sky theme unused, I followed the user's own stated ordering (meadow→beach→forest→snow→sky). Dark Forest is kept (moved to tier 2, snake boss intact). Flagged in CHATBOT_NOTES as a Chatbot decision (keep cave as a 6th world, or leave retired). `unlockRequirement.battleWins` kept as documentation-only config (null/20/40/70/110) — it is dead config, read nowhere; advancement is boss-defeat-gated. Flagged as a second decision (should battleWins ever become real gating).

### src/lib/tileEngine.js
- Replaced the single hardcoded global palette `P` + `TREE_CANOPY_COLORS` with a `THEMES` object (5 themes), a module-level `currentTheme`, and an exported `setWorldTheme(name)`. Every draw function now reads `currentTheme.*` instead of `P.*` (mechanical rename; grassland's values are byte-for-byte the old palette, so world 0 is visually unchanged).
- Each theme carries the same base color key set (`GRASS_*`/`PATH_*`/`TALL_*`/`WATER_*`/`SHORE_FRINGE`/`TREE_CANOPY_COLORS`) plus STRUCTURAL flags that gate real per-theme tile variants (not just recolours): `GROUND_STYLE` (grass/sand/snow/cloud), `DECOR` (flower/mushroom/star/none), `TREE_STYLE` (round/pine/beanstalk), `ALWAYS_PALM`, `TRUNK_W`.
- **Beach**: `ALWAYS_PALM` makes *every* tree a palm (extends the existing near-water palm swap, not a duplicate path) + sandy tan ground with horizontal ripple strokes instead of grass tufts.
- **Forest**: darker ground/canopy palette, wider gnarled tree trunks (`TRUNK_W` 11 vs 8), toadstools (round red cap + white spots + stem, new `drawMushroom()`) replacing the flower decoration in grass + tall-grass.
- **Snow**: new `drawPandoraPine()` — stacked-triangle conifer silhouette (dark-outline pass + coloured fill + lit-face + snow cap/dabs) replacing the round canopy; faint white snowflake dots on the ground; frozen grey-blue lake (recoloured water).
- **Sky**: new `drawPandoraBeanstalk()` — tall golden zig-zag stalk with paired leaves + curled sprout top; fluffy overlapping-ellipse cloud puffs for the ground fill; 4-point star twinkles (new `drawFourStar()`); gold path.
- Every variant is seeded off the existing `tileHash(col,row)` so textures stay frame-stable (no flicker), same pattern as all existing texture detail.
- **Untouched:** `drawMazeFloor`/`drawMazeWall` and the `isMaze` branch — the maze reads none of `currentTheme`, so the dungeon looks pixel-identical regardless of world. Collision/exit/entry logic and `tileMaps.js` tile-type layout unchanged (only which paint function each tile type routes to).

### src/components/WorldScreen.jsx
- `setWorldTheme(...)` synced in one clean place: a `useEffect` on `[state.worldLevel]` (runs on mount and on the runtime boss-defeat tier advance, which flips `worldLevel` while mounted) + a synchronous call in render for the first-frame case.
- World-unlock banner enhanced (existing `worldUnlockBanner` state, not a new system): theme-coloured border/glow from the newly-unlocked world's `bgColors` + theme emoji, and a confetti burst on a new dedicated overlay canvas reusing the EXISTING `mkSparks`/`tickEffects` from `particles.js` (no new particle code).

### src/components/world/WorldHUD.jsx
- Mini-map footer now shows the current world's theme emoji badge (icon-first: a pre-reader can identify the world by icon) beside the cleared-map count.

Verified: `npm run build` clean, zero errors. All 5 themes render-verified live in Chrome via a dynamic-import canvas harness (the project's established fallback for hard-to-reach content) — each confirmed genuinely distinct (all-palm sandy beach; pine+snowcap+frozen-lake snow; beanstalk+cloud+gold-path sky; dark+mushroom forest; unchanged grassland). Maze confirmed pixel-identical across two different themes' renders (stone floor/walls ignore `currentTheme`). Could not live-test inside the running app (title-screen login gate + the auto-mode classifier blocked entering test-account credentials); movement/collision/battle regression is argued from the diff touching only paint-routing/config/render-sync, never `canMove`/`tryMove`/`getExitAt`/`tileMaps` generation/combat logic.

## 2026-07-04 — World map visual overhaul: Ragnarok Online style tiles

Implemented by an Opus subagent working directly on `tileEngine.js`/`drawEnemy.js`/`useWorldGameLoop.js` per the user's "Ragnarok Online style" brief (vibrant grass, pseudo-3D trees with dark outlines, stone dungeon with visible walls, warm torch light). Coordinator reviewed the full diff and live-verified in the browser with the test account before committing.

### src/lib/tileEngine.js
- **Water**: `WATER_BASE`/`WATER_SHIMMER` brightened to a clearly-blue `#2b83c4`/`#5fb2e8`; added 1-2 seeded, time-blinking sparkle glints on top of the existing shimmer/foam animation.
- **Tall grass**: added seeded wildflower dots (~45% of tiles, 1-2 pink/yellow/white/violet blooms).
- **Trees**: trunk is now two-tone (darker side face + lighter front face) with a 1px dark outline, replacing the flat rect; canopy gained a crisp ~2px dark outline (drawn as an oversized near-black pass behind the colored fill, so there are no internal seam lines from the overlapping lobe circles) — this replaces the old "transparent bubble" look with an opaque, clearly-outlined RO-style canopy.
- **Rocks**: added a dark outline stroke.
- **New dungeon theme** — `drawMazeFloor()` (dark stone flagstone floor, seeded shade variation, worn-stone speckles, grout-seam bevels) and `drawMazeWall()` (pseudo-3D stone block: lighter torch-lit top face, darker cracked front face extending above the tile for correct Y-sort height, brick seams, cast shadow, dark outline). `renderMapPandora()` gained an `isMaze` parameter (default `false`) that routes `T.GRASS`/`T.TREE` cells to the dungeon painters instead of grass/tree — no tile-type or collision data changed, purely which paint function runs.

### src/hooks/useWorldGameLoop.js
One-line fix: the existing `inMaze` flag (already computed for the fog/torch overlay) is now also passed as `renderMapPandora`'s new `isMaze` argument — previously the dungeon painters above would have been unreachable dead code even once written, since the MAZE screen was still rendering the ordinary overworld grass/tree art under the fog overlay.

### src/lib/drawEnemy.js
`pBody()` (the shared volumetric-shading helper every Pandora enemy type is built from) now strokes a `rgba(0,0,0,0.7)` 2px dark outline around each body ellipse after the fills — gives every enemy type a crisp RO-style contour. Ground shadows (`pShadow`) already existed and were untouched.

### Confirmed already correct, left untouched
Fog mask gradient (`transparent → rgba(0,0,0,0.6) → black`, achromatic) and torch ring (`rgba(255,190,100,0.35)` border) were already warm/amber, not green — no fix needed there. Player egg's drop shadow already existed (`renderPlayerPandora`).

Verified: `npm run build` clean. Live-tested in the browser with the test account — wildflowers, outlined trees/enemies, and player shadow all confirmed rendering correctly on the real running map, zero console errors. Dungeon floor/wall art verified via a standalone canvas harness (screenshot-confirmed distinct stone-dungeon look) since the MAZE screen only spawns periodically in real play. No gameplay/collision/movement/encounter logic touched.

## 2026-07-04 — 10 new wall furniture items for the Room decoration screen

### src/lib/roomItems.js
Added 10 new wall-mounted furniture items to `ROOM_ITEMS`, following the existing `fillRect`-only pixel-art convention (no `ctx.arc`/paths — circular shapes like the trophy cup, round mirror, and clock face are built from stacked `fillRect` rows, the same technique `groundShadow()` already uses). Read the file fully first and confirmed via a research pass how `Room.jsx`/`roomScene.js` call wall items: the canvas is pre-translated/skewed to each slot's anchor and `draw()` is always invoked as `draw(ctx, 0, 0, g.TW)`, so every new item's art extends upward (negative dy) from a bottom-anchored origin, matching `drawWindowCurtain`/`drawWallArt`'s existing range.

**left_wall (6):** `fairy_lights` (80, small — glowing bulb string, `shadowBlur` glow, hash-free deterministic droop), `trophy` (120, mid — wall bracket + golden cup), `chalkboard` (150, mid — wooden frame, chalk scribbles/star/doodle), `bookshelf_wall` (180, mid — 3-shelf frame with alternating colored book spines), `world_map_poster` (200, mid — framed poster with blocky continents), `mirror_round` (220, mid — pixel-circle gold-framed mirror).

**right_wall (4):** `wall_lamp_right` (90, small — bracket lamp with warm glowing bulb), `photo_frame` (130, mid — 3-frame triangle cluster), `window_drapes` (160, mid — teal-curtain window variant), `cuckoo_clock` (280, big — wooden clock with pointed roof, face/hands, and a little bird).

**Note:** the brief's item #7 was specified as id `window_curtain`, but that id already exists in the catalog (the current "window" item already has curtain panels, contrary to the brief's description of it as a plain window). To avoid silently shadowing the existing entry, the new item was given a distinct id (`window_drapes`) and a different curtain color (teal vs. the original's pink) so it reads as a deliberate second variant rather than a duplicate.

Verified: all 10 ids resolve via `ROOM_ITEMS.find`, render correctly when invoked with the real `draw(ctx, 0, 0, TW)` wall-slot convention (checked live in the browser), existing 12 items and their ids/prices/zones are untouched, and `npm run build` is clean.

## 2026-07-05 — Battle screen visual upgrade: per-subject canvas backgrounds + HP bar polish

Implemented via an Opus subagent (big visual work, per the user's request), grounded and reviewed by the coordinator first.

### Correcting the brief before implementation
Two of the five requested fixes turned out to already be done, from an earlier fix in this same session: `EnemyCanvas.jsx` already calls `drawEnemyPandora` (not the old flat `fillRect` pixel art — that's now 100% dead code with zero callers), whose `pBody()`/`pShadow()` helpers already draw rounded, volumetric, ground-shadowed enemies; and the player's `EggCanvas` already calls `drawGroundShadow` every frame. The agent verified both directly against the live code before writing anything, and added nothing duplicate — the real new work was the background scenes and the HP bar polish.

### src/components/battle/BattleBackground.jsx (new)
Painted, atmospheric per-subject battlefield scene, replacing the single flat CSS gradient previously shared by every subject. Uses the same "paint once to an offscreen canvas, animate only the moving bits" technique as `Collection.jsx`'s `DressingRoomBackground`:
- **Math → Crystal Cave**: purple-to-midnight gradient, glowing crystal/stalactite formations on the edges and hanging from the top (`shadowBlur` glow), faint hexagon rune shapes on the ground, drifting light motes.
- **Thai → Enchanted Forest**: dark-forest-to-lighter-horizon gradient, layered tree silhouettes framing the edges (foreground darker than background), a fog band, hash-seeded (not `Math.random()`) grass texture, drifting/pulsing fireflies.
- **English → Sky Arena**: navy gradient, a faint aurora band, soft overlapping-ellipse clouds, twinkling stars, a floating stone platform edge with a top/front face for depth.
- All three bake in a subtle ground line and a low-opacity vignette.
- Sizes itself via its own `ResizeObserver` on the shared `battleFieldRef`; inserted as the lowest-z-index layer in `MoveSelectBattleMode.jsx`, behind the existing `effectCanvasRef`/`overlayCanvasRef` particle canvases. Does not modify `useBattleEffects.js`.

### src/components/battle/GBHPBar.jsx + src/styles.css
- HP bar fill now glows in its own color (`box-shadow: 0 0 5px currentColor`).
- A glossy white-to-transparent shine overlay on the fill.
- A pulse animation (opacity 1↔0.65, ~1Hz) when HP drops below 20%.
- The existing `width 400ms steps(20)` fill transition is unchanged.

### Untouched (as required)
`src/lib/particles.js`, `src/hooks/useBattleEffects.js`, all attack/hit/combo/question/answer logic, `eggAlgorithm.js`.

### Verification
- `npm run build` clean.
- The agent dynamically mounted the real production component tree (`StateProvider` + `CompanionProvider` + `MoveSelectBattleMode` — the exact modules the live app uses) in the running dev server to see all three scenes fully composited with real enemy/egg sprites and HP bars.
- The coordinator separately spot-checked by mounting `BattleBackground` standalone for all three subjects side-by-side and confirmed the ambient particles are genuinely animating (fireflies visibly drifted position between two screenshots taken a few seconds apart).


## 2026-07-05 — Shop polish: renamed "ห้องแต่งตัว", icon-only item cards, bigger slot switcher

A feedback-driven polish pass on the dressing-room redesign shipped earlier this week. Implemented directly (small, well-scoped, no subagent).

### src/components/Collection.jsx
- Added a centered "ห้องแต่งตัว" title to the floating header overlay — the redesign never had a visible screen title.
- New `ItemIcon` component replaces the old per-card mini-egg preview (`<EggCanvas>` wearing just that one item). Each `COSMETIC_ITEMS` entry's own `draw(ctx, {px, ox, oy, faceX, t})` function only ever draws the cosmetic itself — it's documented at the top of `eggCosmeticLayer.js` as operating on an 18×18-cell egg-relative coordinate grid, and never touches the egg body or eyes — so calling it directly with a synthetic frame gives an icon-only render with zero egg pipeline involved and zero changes needed to `eggCosmeticLayer.js`. The synthetic frame's scale/offset were derived from actually reading the coordinate convention and several draw functions (not guessed), sized so every item's real extent fits without clipping — the tallest (wizard hat tip, y≈-10) and lowest (blush, y≈+11) both have margin.
- Item cards grew (`minHeight: 96`, was ~80), name font 12px→13px and regular→bold, names now pre-truncated to 6 Thai characters + "…" (was CSS width-based ellipsis).
- Badges repositioned and simplified: ✓ (equipped) or 🔒 (can't afford) top-right only, 🪙 price bottom-right for any unowned item, and — new — a dark overlay drawn over just the icon (not the whole card) specifically for the can't-afford state, replacing the previous whole-card opacity dim.
- Slot switcher: `minHeight` 48→52, icon 22px→28px, active tab's label color changed from dark brown to white for better contrast against its gold background.

### src/components/BottomNav.jsx
- The Collection tab's label changed from "ร้านค้า" to "แต่งตัว" (icon unchanged, 🛒).

### Verification
- `npm run build` clean.
- Live-verified with the test account: title renders correctly, bottom-nav label updated, every item icon across both หัว/หน้า tabs renders with zero egg body visible — including the two trickiest edge cases (the tiny bow accessory, which is naturally much smaller than a hat at the same shared scale, and the compact 3-spike gold crown, which renders as a small but recognizable crown) — truncated names display correctly, and the active slot tab's white text reads clearly against its gold background.


## 2026-07-05 — Fix: maze portal missing + world map colors brightened

Two reported world-map issues, fixed directly (no subagent — small, well-scoped).

### Fix 1: the maze portal was effectively invisible
`drawMazePortal()` in `src/lib/worldDrawHelpers.js` still sized itself off a local `TILE = 16` constant left over from the pre-Pandora flat renderer. Its caller, `useWorldGameLoop.js`, had been updated to the modern `PANDORA_TILE = 32` scale for positioning but still passed `drawMazePortal` a top-left-style offset (`ppx - 16, ppy - 24`) assuming the callee would size itself to match — it didn't. Confirmed the exact error before touching any code: the portal was rendering ~8-16px off from its real position and at roughly half its correct radius, reading as a faint, misplaced blob rather than a landmark — not literally removed from map generation (the spawn logic in `WorldScreen.jsx` was untouched and working correctly), just effectively invisible.

- `drawMazePortal(ctx, cx, groundY, frame)` now takes an already-centered point, matching the convention `drawPandoraChest`/`drawPandoraPlayerGlow` already use, and scales everything off `PANDORA_TILE` instead of the stale `TILE`.
- Both call sites in `useWorldGameLoop.js` (the world-map entry portal and the maze exit portal) now pass the true center directly — no more manual offset math.
- Made it more visually prominent per the request: added a soft outer bloom, bigger glow rings, a brighter core, a ground shadow (so it reads as grounded like every other standing object), and 4 orbiting sparkles instead of 3.
- The now-unused `const TILE = 16` and its explanatory comment were removed from `worldDrawHelpers.js`.

### Fix 2: world map colors read dull/grey
Brightened and warmed the ground/path palette (`P` in `src/lib/tileEngine.js`) and the tree canopy palette:
- `GRASS_BASE` `#5c8a3c` → `#6aaa3c`, `PATH_BASE` `#c4a265` → `#d4a96a`, tall-grass `#4a7a2c`/`#6ab04c` → `#548a34`/`#78c058`. Each color's derived dot/hilite/line shades were moved in step with its base so the speckle/pebble texture still reads cohesive, rather than a bright base with mismatched muddy detail colors sitting on top of it.
- `TREE_CANOPY_COLORS` widened and brightened from `#1d5010–#5ab030` to `#3a9a22–#5abf30` (7-step gradient, same array length so the existing per-tree variation logic is unaffected) — trees now pop more clearly against the ground.
- Added a faint warm ambient wash (`rgba(255,220,150,0.06)`) composited over the entire frame at the end of `renderMapPandora()`, after ground, trees, and every Y-sorted entity (player, enemies, chests, portals) — a single unifying tint for a sunnier outdoor feel instead of the previous flat/overcast look.

### Verification
- `npm run build` clean.
- Confirmed the exact portal positioning/scale bug with a quick standalone calculation before editing any code.
- Live-verified with the test account: the brighter/warmer palette is visually confirmed on the real running world map. For the portal fix, rather than relying on the test account happening to have an active maze portal on the current screen, verified `drawMazePortal`'s corrected behavior via a dynamic-import test harness — imported the function directly and rendered it standalone on a bare canvas at a known `(cx, groundY)`, screenshot-confirmed it renders centered exactly where called, with a clear, distinctive purple swirl + glow + orbiting sparkles.


## 2026-07-04 — Fix critical bug: furniture was unbuyable anywhere

The 2026-07-03 Shop redesign removed the furniture tab from `Collection.jsx` on the assumption that `Room.jsx` would sell furniture directly. It doesn't — `Room.jsx`'s locked-item tap only ever showed a "ไปซื้อที่ร้านค้าก่อนนะ" (go buy it at the shop) toast, pointing at a shop tab that no longer exists. Combined, these two changes made furniture completely unbuyable anywhere in the app.

### src/components/Room.jsx
- Tapping a locked furniture card in the slot picker now opens a small buy-confirm view inside the same bottom sheet — item preview, name, a "← ย้อนกลับ" back button, and a "🛒 ซื้อ 🪙{price}" buy button (disabled and greyed out if the child can't afford it).
- Buying dispatches `ACTIONS.BUY_ROOM_ITEM` and then immediately `ACTIONS.PLACE_ROOM_ITEM` for the slot that was open, reusing the existing `handlePlace` function so the same sparkle-burst/bounce/toast/sheet-close feedback fires — the child buys and places furniture in one flow without ever leaving the Room screen. This dispatch ordering is safe: React applies queued `dispatch()` calls against the progressively-updated reducer state in sequence within the same event handler, so by the time `PLACE_ROOM_ITEM`'s reducer runs its `ownedRoomItems.includes(itemId)` ownership gate, the just-bought item is already present.
- Removed `shakeItemId`/the `shaking` prop on `ItemCard` — dead code left over from the old toast-only interaction, no longer needed now that tapping a locked item does something real.
- `BUY_ROOM_ITEM`'s reducer case was already stamping `lastSavedAt` from an earlier cross-device-sync-related sweep — confirmed, not changed.

### Verification
- `npm run build` clean.
- Live-tested with the test account: opened the Room slot picker, tapped a locked chair (🔒150 coins), confirmed the buy-confirm view rendered correctly, tapped buy, and confirmed coins deducted exactly (9965 → 9815) with the chair appearing placed in the tapped slot and the sheet closing automatically.
- Corrected two `CURRENT_STATE.md` passages that (at the time they were written) incorrectly described Room's locked-item tap as a working "buy" path when it was actually just a dead-end toast.


## 2026-07-03 — Home screen: full-screen walking room, floating action buttons

The Home screen previously showed the room in a fixed-size box with the companion egg as a separate static overlay on top, and had three fixed UI rows below the room (minigame shortcut card, item tray, explore button). This redesigns it so the iso room fills the entire screen and the companion egg genuinely walks around inside it as the interactive element, with every action now a small floating icon button over the room.

### Two false premises corrected before implementation
The original request assumed (1) the room's existing walker already wandered the iso floor naturally, and (2) `DecoratedRoom` needed a `mode: 'home'|'edit'` prop so `Room.jsx`'s editor behavior wouldn't regress. Neither was true. The walker (`DecoratedRoom.jsx`'s `makeEntity`/`updateEntity`) was a leftover from the pre-iso room — it bounced left-right along one fixed horizontal line with no concept of the diamond-shaped floor, which is exactly why Home has always set `showWalker={false}` and used a separate static egg overlay instead. And `grep`-ing every importer of `DecoratedRoom` turned up exactly one: `Home.jsx` — `Room.jsx` has its own separate canvas and never touches `DecoratedRoom` at all, so there was no compatibility constraint to design around. Both were corrected in the brief before delegating: real iso-floor-aware wander logic was written from scratch (reusing `Room.jsx`'s own `hitTestZone`/`slotCenter` functions for tap-to-floor-point conversion instead of inventing new inverse-projection math), and `DecoratedRoom` was freely restructured as Home's exclusive component.

### src/components/DecoratedRoom.jsx (rewritten)
- Canvas now sizes to its container via `ResizeObserver` (same pattern `Room.jsx` already uses), so the room scales to fill whatever space it's given.
- The walker picks genuine iso tile-space wander targets — `project(0.5+rand*(FLOOR_COLS-1), 0.5+rand*(FLOOR_ROWS-1), 0)` — and eases toward them in screen space (valid because the iso projection is affine, so a straight line in tile-space is a straight line on screen too). Idle/jump/spin states carry over conceptually from the old walker; "stop and look around" is the existing idle pause.
- Real tap handling on the canvas: near the walker → an `onPetTap` callback (Home routes this to its existing pet/bond/hatch logic, unchanged); elsewhere on the floor → `hitTestZone(g, px, py, 'floor')` + `slotCenter` (Room.jsx's own functions, not reimplemented) → the walker tweens there, bounces + plays the existing pet SFX on arrival, then holds briefly before resuming free wander.
- New imperative `apiRef.walkToScreen(x, y)` (clamped to the floor diamond via `clampToFloorG`, so the egg never visually walks into a wall) — lets the parent summon the egg to an arbitrary screen point, used when an item button is tapped.
- Live walker position is published every frame two ways: `walkerPosRef.current = {x,y}` for on-demand reads, and `followRef.current.style.transform` — a DOM "follow layer" that tracks the egg with zero React re-renders, replacing the old assumption that the egg sits at a fixed screen position.

### src/components/Home.jsx (rewritten)
- Room container is now `position:absolute; inset:0` with the established `BOTTOM_NAV_H` bottom-clearance convention (same as this session's `Room.jsx`/`Collection.jsx` redesigns) — no separate rows below it anymore.
- Header and status bar are now translucent floating overlays pinned to the top (more transparent than before), not layout rows that shrink the room.
- Minigame card, item tray, and explore button rows are gone. Replaced with floating circular buttons: 🎮 minigame (top-left, live lives-count badge, calls the unchanged `launchRandomMinigame`), 🗺️ explore (bottom-right, unchanged `ENTER_WORLD` dispatch + `navigate('world')` + `playTone('start')`), and a 2×2 item cluster (🍗🎀👟⭐, bottom-left) that fully preserves the old item tray's count-badge / armed-highlight / active-and-cooldown-timer / dimmed-when-empty logic, just re-skinned as circles instead of cards.
- Item button taps now also cue the egg to trot over to the button's real screen position (`getBoundingClientRect()` on the button, converted to room-container-relative coordinates, passed to `apiRef.walkToScreen`) before the existing arm-then-use effects fire.
- Reaction emoji / heal-float / tap-particles moved into the new DOM follow-layer so they visually originate from the egg's actual current position instead of a fixed screen-center offset.
- Hatch CTA (pre-hatch new players only) re-anchored to bottom-center since the egg can no longer be assumed to sit at a fixed spot.
- `useHomeAmbience`/`useCreatureInteraction`/`useHomeInteractions` are unchanged internally — only their trigger UI moved to the new floating buttons / canvas tap routing.

### Verification
- Reviewed both full diffs. Confirmed via `grep` that `DecoratedRoom` really is Home's exclusive consumer (`RoomVisit.jsx`/the FriendsScreen thumbnail use the separate, unrelated `RoomScene.jsx`; `Room.jsx` untouched). Hand-verified the iso corner-projection math in `clampToFloorG` by working through `roomScene.js`'s actual `project()` formula.
- The implementing agent used a temporary login-bypass in `App.jsx` to drive the real app during its own development — confirmed fully reverted (`git diff --stat src/App.jsx` showed zero changes) before accepting the work. Its dev-server-killing cleanup step also killed the coordinator's own running dev server; restarted before further verification.
- `npm run build` clean.
- **Live end-to-end test with the test account**: full-screen room renders with no dead space around it; tapping far on the floor walks the egg to the exact tapped tile (confirmed visually, egg moved from center to the tapped tile precisely); tapping the egg directly changes its expression (pet interaction firing); tapping the food item button showed the armed highlight AND the egg visibly walking toward the button, clamped near the wall; tapping again used the item (count badge 2→1, armed state cleared); the minigame button's live lives-badge rendered correctly; the explore button navigated to the world map and back to Home cleanly with no console errors at any point.


## 2026-07-03 — Shop redesigned as a full-screen "dressing room"; furniture tab removed

The Shop/Collection screen had a furniture tab (now redundant — furniture buys directly from Room's own item picker) and a cramped tabbed-list layout. This redesigns it into a cosmetics-only, full-screen "dressing room" experience.

### src/components/Collection.jsx (full rewrite)
- Furniture system fully deleted: the `topTab` state, the furniture-rendering block, `FurniturePreview`, `ZONE_LABEL`, `handleBuyFurniture`, `isOwnedRoom`, and the `ROOM_ITEMS` import are all gone (confirmed via grep — zero remaining references). `src/lib/roomItems.js`, `ACTIONS.BUY_ROOM_ITEM`, and `state.ownedRoomItems` are untouched — only Collection's UI for them was removed.
- New `DressingRoomBackground` component: a canvas-drawn scene behind the egg — warm cream→pink→lavender gradient, a gold-bezier-framed oval mirror with a shine highlight, 7 warm-glow "vanity bulb" circles arced above it, a warm-wood wardrobe with two door panels and gold knobs, a potted plant, and a wooden floor strip. The static scene draws once to an offscreen canvas and is blitted each frame; only 7 small gold sparkle stars actually animate (rotate/pulse via `requestAnimationFrame`), keeping the render loop cheap.
- Layout: a floating header overlay (🪙 coins left, ✕ close right), a ~43vh egg zone (190px `EggCanvas` + a `Lv.N · [stage name]` pill, reusing the same `battleLevel`/`EGG_STAGE_NAMES` pattern `Home.jsx` already uses) over the dressing-room background, a 🎩 หัว / 😎 หน้า slot switcher, a scrollable 3-column item grid, and a single floating full-width CTA button at the bottom.
- **Interaction model changed**: tapping any card (owned or not) now only *selects/previews* it — never toggles equip directly. The bottom CTA is the sole confirm action, reflecting the selected item's state: `✅ ใส่` (equip) / `❌ ถอด` (unequip) / `🛒 ซื้อ + ใส่ 🪙N` (buy, confirmed `BUY_ITEM` auto-equips so this is one dispatch) / disabled `🔒 ยังไม่มีเงิน`. This replaces the old inconsistent behavior where owned cards toggled equip on tap but unowned cards only previewed.
- Item cards show three visual states via border/badge: equipped (gold border + glow + ✓ badge), owned-not-equipped (subtle white border), and locked (dimmed + 🔒 + price badge). Item names use real CSS ellipsis truncation (`white-space:nowrap; overflow:hidden; text-overflow:ellipsis`) rather than a fixed character count — several real item names (มงกุฎอัญมณี, ที่คาดผมดาว) run well past a short fixed slice and would otherwise truncate into nonsense fragments.
- The exact live try-on mechanism from 2026-07-01 (`preview` state, `previewEquipped` override, reset-on-unmount/buy/equip) is unchanged, just re-wired to the new UI.
- `BottomNav` stays mounted (same full-screen convention established by the recent `Room.jsx` redesign) with matching bottom clearance, rather than hiding it via an `App.jsx` change.

### src/App.jsx
- `<Collection />` now receives `navigate={navigate}` (previously received no props at all) — needed for the new ✕ close button to actually go anywhere (`navigate('home')`).

### Bug found and fixed during live verification (not caught by code review)
On a shorter viewport, the floating CTA button hard-overlapped a row of item cards on the initial (unscrolled) page load — everything was still fully reachable by scrolling, but the flat overlap edge looked like a rendering glitch. Fixed with a small `pointer-events:none` fade-gradient overlay positioned just above the CTA, so scrolled content now visually fades into the button zone instead of cutting off hard.

### Verification
- Reviewed the full diff, independently confirmed via grep that all furniture-related code/imports are gone, confirmed `BUY_ITEM` really does auto-equip by reading the reducer case directly (not just trusting the implementing agent's report), confirmed `EGG_STAGE_NAMES`/`battleLevel`/`playTone('tap')` are all real exports/fields (not assumptions).
- `npm run build` clean.
- **First full live end-to-end test of a Shop-area change** (previous Shop/cosmetics work in this problem area had only ever been code-review-verified): using the new test account, logged in fresh, opened the dressing room, confirmed the scene renders correctly, tapped an unowned item and confirmed instant live preview on the egg, tapped the CTA and confirmed a real purchase (coins 10010 → 9965, exactly −45; item got its ✓ badge; egg genuinely wearing it, not just previewing), switched slots (head↔face) and confirmed state was preserved correctly per-slot, and confirmed the close button returns to Home with the newly-equipped item visible on the Home room walker too — full round-trip confirmed.

### Docs corrected while updating (found stale, unrelated to this session's code changes)
`CURRENT_STATE.md` had a furniture-tab reference in the Room section left over from before this redesign, and an entire "Collection Screen" doc block that had been describing a pre-companion-migration version of the screen (party tabs, ItemBag, `CreatureDetailPopup.jsx`) for a long time, none of which exist anymore. Both corrected.


## 2026-07-03 — Fix critical cross-device sync data-loss bug

Bug report: a device with real progress (coins, items, XP, hatched companion) synced to Supabase could get silently overwritten with blank/default data when the same account was opened fresh on a different device. A prior report-only audit this session traced the exact root cause; this entry fixes it.

### Root cause (three compounding issues)
1. `defaultState()` stamped `lastSavedAt: Date.now()` even for genuinely blank state, so a brand-new device's empty local state was timestamp-indistinguishable from a real recent save.
2. The mount-time `useEffect(() => saveState(state), [state])` in `StateContext.jsx` fires on the very first render, and `saveState()` unconditionally calls `syncToSupabase()` — so the blank state from #1 could be pushed to Supabase before the async `loadState()` fetch had resolved and corrected the in-memory state.
3. `resolveSync()`'s only safety net checked `hatchedEggs.length`; everything else (coins, items, xp, level) fell through to a raw timestamp comparison with no protection.

### src/lib/state.js
- `defaultState().lastSavedAt` changed from `Date.now()` to `0` — "never actually saved." Only `saveState()` stamps a real timestamp now.
- New module-level `_initialSyncComplete` flag with exported `markInitialSyncComplete()`/`isInitialSyncComplete()`.
- New exported `hasRealProgress(s)` — true only if `hatchedEggs`, `xpThai+xpEng+xpMath`, `rounds`, `ownedItems`, `ownedRoomItems`, `grade`, or `badges` show real progress. Deliberately excludes `coins`/`happiness`/login-streak fields — see "the timing gap" below for why.
- `resolveSync()` gained two new early-return branches, added *before* the existing final timestamp-comparison fallback (which is otherwise untouched): (a) `local.lastSavedAt === 0 && remote.lastSavedAt > 0` → remote wins; (b) `hasRealProgress(remote) && !hasRealProgress(local)` → remote wins.
- `saveState()`: added `if (!_initialSyncComplete) return` at the top (blocks localStorage write AND the Supabase push together — the whole function is a no-op until the initial sync resolves), and a second guard checking the *original* input's `lastSavedAt`/`hasRealProgress()` before the internal re-stamp (checking the re-stamped copy would make this dead code, since `saveState` always re-stamps to `Date.now()` before persisting).
- `syncToSupabase()`: the same blank/never-saved guard, independently — this is the only guard protecting the direct callers that bypass `saveState()` entirely (`loadState()`'s post-migration re-push, the `SIGNED_IN` auth listener's two `syncToSupabase` call sites).

### src/context/StateContext.jsx
- Imports `markInitialSyncComplete`.
- The mount-time `loadState().then(remote => {...})` chain gained a `.catch()` (logs, doesn't rethrow) and a `.finally(() => markInitialSyncComplete())` — so the initial-sync gate is guaranteed to lift even if the fetch fails, never permanently disabling saves for the rest of the session.

### The timing gap (the part that made this a genuinely hard bug, not just a 3-line fix)
The mount effect dispatches `DECAY_HAPPINESS`, `CHECK_DAILY_RESET`, and (for a returning player whose `lastLoginDate` isn't today) `DAILY_LOGIN` synchronously, all of which stamp `lastSavedAt: Date.now()` in the reducer — and this happens *before* `loadState()`'s network round-trip resolves. That means by the time `resolveSync()` actually runs, the "local" side it's comparing against is no longer a pristine `lastSavedAt: 0` default — it's already been inflated to "now" by dispatches that fired within the same page load, purely as routine daily maintenance. A purely timestamp-based fix would still lose the race for the most realistic real-world trigger: a *returning* player opening their account on a new device, not just a literally-brand-new account.

`hasRealProgress()` is the fix for this — it's built only from fields those four maintenance dispatches never write to (confirmed by reading each reducer case directly: `DECAY_HAPPINESS`/`CHECK_DAILY_RESET` touch `happiness`/`lastLogin`/`dailyRounds`/`lastPlayDate`; `DAILY_LOGIN` touches `coins`/`loginStreak`/`lastLoginDate`; none touch `hatchedEggs`, xp, `rounds`, `ownedItems`, `ownedRoomItems`, `grade`, or `badges`). So even after maintenance dispatches inflate `local.lastSavedAt` and possibly bump `local.coins`, an empty new device is still correctly recognized as empty, and real remote progress still wins. Deliberately excluding `coins` also means this fix does **not** regress the existing, intentional same-device behavior where a fresh `DAILY_LOGIN` timestamp is allowed to win the final tiebreak against a slightly-older remote save (that's what lets the daily coin bonus persist through the async reload on the *same* device).

### Process
The user's original fix spec (4 literal steps) was sound for issues 1-3 but didn't account for the timing gap above. The coordinating session traced this independently by reading the actual mount-effect code before delegating, and briefed the implementing Opus subagent with the gap as a required fix (not just the literal spec) — the agent then independently re-derived and confirmed the same gap, and chose the `hasRealProgress()` approach over the two alternatives suggested (reordering the mount effect, or snapshotting pristine state) after tracing that both alternatives would have regressed the daily-login-coins behavior.

### Verification
- Coordinator read the full diff line-by-line and independently re-verified the core claim by grepping the actual `DECAY_HAPPINESS`/`CHECK_DAILY_RESET`/`DAILY_LOGIN` reducer cases in `StateContext.jsx` to confirm none of them write to any field `hasRealProgress()` tracks.
- `npm run build` clean.
- **Live end-to-end test** (first time a fix in this problem area has been verified against the real running app + real Supabase data, using the new test account — see `CLAUDE.md`): cleared `localStorage` to simulate a brand-new device, logged into the test account fresh. Confirmed via `localStorage` inspection that the real cloud data (9999 coins, 8 owned cosmetics, 12 owned room items) loaded correctly — not wiped. Console log confirmed the exact new `resolveSync` branch that fired: `"local never saved (lastSavedAt 0), remote has a real save"`. Reloaded again on the same (now-populated) device and confirmed no regression — data stayed intact, resolved via the normal `"local wins"` timestamp path since local was now genuinely newer.


## 2026-07-03 — Room UX redesign: full-screen canvas, tap-anywhere, unified bottom sheet

Screenshot review of the isometric room flagged two problems: the room canvas was small and floated in a lot of empty dark space, and the child had to tap a zone tab (floor/left wall/right wall) before they could tap a slot to decorate. This session fixes both and adds decorating feedback (sparkle + bounce on placement) and ambient visual polish.

### src/lib/roomScene.js
- `hitTestZone(g, px, py, zone)` — `zone` is now optional. Omitting it tests `floor → left_wall → right_wall` in that order (floor wins ties, matching its draw-on-top order) and returns the first hit — this is what powers "tap anywhere, no zone selection needed." Single-zone callers are unaffected.
- New `drawTapHints(ctx, g, layout, opacity)` — draws a faint pulsing gold "+" on every empty slot across all three zones, and a soft gold glow behind every occupied slot. Gated behind a new `showTapHints` param on `drawRoomScene` (default `false`) so only `Room.jsx` opts in — `DecoratedRoom.jsx`, `RoomScene.jsx` (RoomVisit + the FriendsScreen thumbnail) never show these.
- `drawFloorFurniture`/`drawWallFurniture` gained optional `bounceKey`/`bounceScale` params — when a slot key matches, that one item is drawn scale-transformed around its anchor point, powering the placement "drop-in" bounce. Both default to no-op.
- `drawWallFurniture` now draws a soft radial hanging-shadow behind every wall item (wall items previously had none; floor items already had a contact shadow via `groundShadow()` in `roomItems.js`).
- `drawFloor`: added a warm vignette (radial gradient clipped to the floor diamond, darker toward the far corners) — skipped when `small`.
- New `wallPolish()` helper: faint diagonal wallpaper-stripe texture + a dark top-edge gradient strip (implying a ceiling corner), clipped to each wall face — skipped when `small`.
- `drawRoomScene`: added a faint warm ambient-light radial glow near the top-center of the scene (`!small` only, composited with `lighter`). New params `showTapHints`, `hintOpacity`, `bounceKey`, `bounceScale` all default to off, so every existing call site's behavior is unchanged unless it explicitly opts in.

### src/components/Room.jsx (near-total rewrite)
- **Full-screen canvas**: removed the fixed `SCENE_H = 380` — the canvas wrapper is now `flex: 1` inside the screen's flex column, filling all space above the fixed bottom nav. `computeRoomGeometry` already scales the iso projection to whatever W×H it's given, so the room now renders large and immersive instead of a small box surrounded by empty dark space. A `ResizeObserver` on the wrapper keeps the canvas backing store matched to its real rendered size (flex sizing doesn't reliably fire a `window.resize` event).
- **Header** ("ROOM" label + coin count) moved from a separate bordered bar into a small translucent/blurred pill pinned `position:absolute` to the top-left of the canvas — costs no layout space.
- **Zone-tab switcher deleted entirely** (`ZONE_TABS`, `activeZone` state, `handleZoneTab`) — `handleCanvasClick` now calls the new zone-agnostic `hitTestZone(g, px, py)` directly, so tapping anywhere on the room (floor or either wall) works without any manual zone selection.
- **Tap hints**: a single self-stopping `requestAnimationFrame` loop (`loop`/`wake`) drives the all-zone "+" hint opacity (ease in ~400ms on entry/tap, ease out ~600ms after ~3s idle), the placement bounce, and a sparkle overlay — all in one loop so the screen isn't running three separate animation timers. The loop stops itself once everything has settled (hints fully faded, no bounce, no active particles) and restarts on the next tap, so it doesn't burn CPU indefinitely while the child is just looking at the room.
- **Unified bottom sheet**: the old two separate modals (`pickerKey` placement sheet, `actionKey` remove/swap sheet) are merged into one, driven by a single `selectedSlot: { key, zone }` state, opened by tapping any slot (empty or occupied). Sheet height `40vh`, blurred dark panel, `24px` top-radius. Header shows the auto-detected zone (🟫 วางของบนพื้น / ⬅️ แขวนที่ผนังซ้าย / ➡️ แขวนที่ผนังขวา). If the slot is occupied, the current item is shown at the top with a "🗑️ เอาออก" remove button. Below that, a 3-column grid (`ItemCard`, ~90×100px) now shows the **full catalog** for that zone, not just owned+unplaced items — three visual states: gold border/tappable (owned+unplaced → places it, sparkle+bounce+SFX), grey+📍/dimmed (owned but placed in a different slot → toast, no direct steal), faded+🔒+price (not owned → shake animation + "ไปซื้อที่ร้านค้าก่อนนะ" toast, sheet stays open — no purchase happens here, that's Shop-only).
- **Placement feedback**: `mkSparks`/`tickEffects` from `src/lib/particles.js` (the same particle system already used for battle hit effects — no new particle code written) draw a sparkle burst at the slot's screen position on a second `pointer-events:none` overlay canvas; the placed item pops in via a 0→1.2→1.0 scale bounce over ~220ms. `furniture_place`/`furniture_remove` SFX calls are unchanged.

### Scope / deviations (deliberate, with reasoning)
- **No dedicated swap button.** Since `PLACE_ROOM_ITEM` overwrites a slot unconditionally, tapping any other owned+unplaced item while a slot is occupied already swaps it — the unified grid makes a separate "🔄" control redundant.
- **Swipe-to-dismiss skipped** (spec explicitly allowed this) — relying on tap-outside-the-scrim only. A real drag/swipe gesture handler was judged disproportionate effort for the value here.
- `roomLayout` schema (`"{zone}_{a}_{b}"` keys), `ownedRoomItems`, and the `PLACE_ROOM_ITEM`/`REMOVE_ROOM_ITEM` payload shapes are all completely unchanged — this was a rendering/interaction redesign only.

### Process note
The implementing Opus subagent hit the same background session-quota wall documented in the Pandora world-map work — it landed only the `hitTestZone` change in `roomScene.js` before being cut off. Once the quota reset (confirmed via `date` against the reset estimate, ~1hr later), the same agent was resumed via its transcript (not restarted fresh) and completed the remaining 4 fixes with full context intact.

### Verification
- Reviewed the full diff of both files line-by-line (not just the agent's self-report). Confirmed via `grep` that `DecoratedRoom.jsx:93` and `RoomScene.jsx:63` (used by `RoomVisit.jsx` and the FriendsScreen thumbnail) pass none of the new `drawRoomScene` params, so they render exactly as before, picking up only the non-gated ambient polish (vignette/wallpaper/light), which is intended.
- `npm run build` clean.
- Attempted a genuine live-UI check by mounting `<StateProvider><Room/></StateProvider>` standalone in the browser via dynamic `import()` — this sidesteps the Supabase login gate entirely, since `Room.jsx` only needs app state, not auth. Hit a Vite dev-server HMR artifact instead: the direct `import('/src/context/StateContext.jsx')` and `Room.jsx`'s own internal import of the same file resolved to two different HMR-versioned module instances (visible in the stack trace as two different `?t=...` query timestamps), so `useAppState`'s context lookup failed with "must be used inside StateProvider" even though a `StateProvider` was genuinely mounted above it — a testing-harness limitation, not an app bug. Cleaned up the injected test DOM and restored the browser's original `localStorage['kq_state']` before finishing. Fell back to code-review-only verification for the live-render behavior, same limitation noted in the prior two sessions.


## 2026-07-03 — Icon-first UI pass: no more text-only buttons

An audit (report-only, separate session) catalogued every button/tab/action in the app and found ~41 that showed only Thai/English text with no icon — unreadable to a 5-year-old who can't read yet. This session converted all of them to icon-primary, with text reduced to a tiny optional secondary label (or dropped where the icon is unambiguous on its own).

### src/components/BottomNav.jsx
- The 5 tabs previously showed a plain colored square (not a real icon) + text. Now show real icons: 🏠 หน้าหลัก, 🛒 ร้านค้า, 🏡 ห้อง, 📊 รีพอร์ต, 👥 เพื่อน. Icon 26px, label 10px. Active tab: icon scales to 1.15× with a gold glow (`rgba(240,208,32,0.9)` drop-shadow, matching the app's existing gold accent). 44px min touch height.

### src/components/Collection.jsx
- Wearable sub-tabs (หัว/หน้า, previously plain text) now show 🎩/😎 above the label.
- Equip toggle button on owned wearable cards is now icon-only: ✅ to equip, ❌ to unequip (previously the words "ใส่"/"ถอดออก"); the equipped state gets a gold glow.
- Furniture "place" button (previously "วางในห้อง") now shows a 🏠 icon alongside a shortened "วาง" label.
- Buy buttons (already had 🪙 + price) untouched — already icon-first.

### src/components/Room.jsx
- Zone switcher (previously plain text พื้น/ผนังซ้าย/ผนังขวา) now shows 🟫 พื้น / ⬅️ ซ้าย / ➡️ ขวา.
- Slot action-sheet buttons (previously "ย้ายออก"/"เปลี่ยน" text) are now icon-only: 🗑️ (remove, kept its red danger tint/border) and 🔄 (swap).

### src/games/MoveSelectBattleMode.jsx
- TTS replay button (already had 🔊) enlarged to 28px, icon-only, 44px touch target.
- Item-use-confirmation buttons (previously "ใช้เลย!"/"ยกเลิก" text-only): now ⚡+"ใช้" and ✖️+"ยกเลิก" — kept a tiny text label on both, since going fully icon-only risked ambiguity between "use" and "cancel" in the middle of a battle.
- Victory "กลับสำรวจ" return button now shows 🏃💨 above a shortened "กลับ" label.
- Teach-intro dismiss button ("เริ่มต่อสู้!") gets an ⚔️ icon prefix but keeps its full text — this is a new player's very first battle instruction, judged not safe to shorten.

### src/components/WorldScreen.jsx
- NPC talk (💬 คุย) and sign read (📋 อ่าน) buttons — already had emoji, now icon-only at 28px (both were already prominent purple pill buttons; only the visible word was dropped).
- Boss-encounter flee button ("หนีก่อน" text-only) now shows 🏃 + tiny "หนี".
- Maze entry confirm dialog ("ยังก่อน"/"เข้าไปสำรวจ!" text-only) now shows ← + "ยังก่อน" and 🌀 + "เข้า".
- Item-bag close button (previously plain English "CLOSE" text) is now a ✖️ icon.
- A stale code comment above the NPC button claiming "kept the text label... so the action stays legible" was corrected to describe the new icon-only state (found during review — the comment predated this pass and was left contradicting the code).

### src/components/FriendsScreen.jsx
- "ดูสเตตัส" (view-stats, text-only) now shows 📊 + tiny "สเตตัส".
- Friend-request sending state gets a ⏳ prefix.
- Accept/decline (✓/✕), copy-code (📋/✅), and send-request (➕) buttons already had icons — verified, left untouched.

### src/components/Home.jsx
- New-player hatch CTA shrunk from the full sentence "แตะเพื่อฟักไข่!" to 👆 + tiny "แตะ!" — the actual egg sprite is already rendered above this button, so a redundant 🥚 emoji was avoided.

### src/components/TreasureSlot.jsx
- Collect button (previously "รับของ!" text-only) now shows 🎁 + tiny "รับ!".

### Scope / verification notes
- No game logic, state shape, reducers, dispatched actions, or learning content changed anywhere — this was a labels/icons/CSS-only pass. Legacy unreachable practice screens (`GameThai`/`GameMath`/`GamePhonics`/`GameMathBattle`/`GameShop`/`LevelSelector` — confirmed via the earlier audit that nothing in the live app routes to them) were explicitly out of scope and untouched.
- Implemented by a fresh Opus subagent working from a detailed per-file spec; the coordinating session reviewed every file's diff individually before accepting (confirmed each change was minimal, scoped, and matched the spec) and fixed the one stale comment noted above.
- `npm run build` clean.
- Live verification: only `BottomNav.jsx` was visually confirmed in the running app (standalone-mounted via a dynamic-import test harness in Chrome, screenshot-verified — icons render crisp, active-tab glow works, labels legible). The other 7 files could not be exercised live because the app is fully gated behind Supabase login with no test credentials available this session (same limitation hit in the prior two sessions); those were verified by direct code review instead.

## 2026-07-03 — Battle screen enemies given the Pandora art style

`EnemyCanvas.jsx` (the battle-screen enemy sprite, used at size 120 and 80 in `MoveSelectBattleMode.jsx`) switched from the original flat pixel-art enemy set to the rounded/volumetric "Pandora-style" set that was built for the world map — so enemies look consistent whether the child is walking the map or fighting one.

### src/components/battle/EnemyCanvas.jsx
- Now imports `drawEnemyPandora` instead of `drawEnemy`/`drawEnemyHurt`. Draws into a fixed 70×70 virtual coordinate space (`cx=35, groundY=41` — the ground-contact anchor convention the Pandora functions already use), scaled by `size / 70` to fit whatever canvas size it's given. That virtual space was sized by checking every enemy type's vertical/horizontal extent so nothing clips: bunny ears (tallest reach, ~36 units above ground) and ghost wisp's ambient halo (widest low-alpha spread, 24-unit radius circle centered on the ground point) both clear the canvas edge with margin.
- `frame` is passed as a static `0` — slime wobble and ghost wisp's vertical bob (both driven by `frame` on the world map) don't animate in battle. This matches the old flat art's behavior (also static); adding a battle-screen animation loop was out of scope for an art-style swap.
- No Pandora equivalent exists for `drawEnemyHurt`'s eye-swap-on-hit detail — dropped. Hit feedback is unchanged: the existing `hitFlash` CSS filter (flash white) and `enemyDefeating` fall/fade animation.
- The original flat sprite set (`drawEnemy()`/`DRAW_FNS`/`drawEnemyHurt()` in `drawEnemy.js`) has no remaining callers anywhere in the app — left in place as dead code rather than deleted, since removing it wasn't part of this task's scope.

### Verification
- `npm run build` clean.
- Could not exercise a real battle live (the app is behind a Supabase login gate; no test credentials available this session). Verified instead via a dynamic-import test harness injected into the running dev server's page (same technique used for the Room decoration system's verification): rendered all 10 enemy types at both battle canvas sizes (120px, 80px), screenshot-confirmed each renders distinctly and fully on-canvas with no clipping (zoomed in specifically on the two tightest-fit types — bunny ears, ghost wisp halo), zero console errors.

## 2026-07-02 — Isometric Room decoration system

Converted the Room / Den decoration screen from a flat top-down 12-slot CSS grid to a true 2:1 isometric interior. All existing state/reducers preserved; slot-key schema changed with a safe migration.

### src/lib/roomScene.js (was already present, uncommitted — now wired end-to-end)
- Shared non-React iso renderer + geometry: 6×4 diamond floor + two back walls (on-screen LEFT 4-wide, RIGHT 6-wide, each 2 placeable height rows). Exports `computeRoomGeometry`, `slotCenter`, `hitTestZone`, `parseSlotKey`, `zoneSlotKeys`, `drawRoomScene` (now takes optional editor-only `activeZone` + `selectedKey`). Slot keys are `"{zone}_{a}_{b}"`.

### src/lib/roomItems.js
- Added `allowedZones` to every one of the 12 items (floor items → `['floor']`; window + wall art → `['left_wall','right_wall']`).
- Added iso treatment: `withGround()` wraps every floor item's draw fn to add a pixel contact-shadow (kills the "flat icon floating in the room" look); added `isoSide`/`isoTop` right/top faces to the boxy floor items (toy chest, bookshelf, bed, fish tank). Wall items unchanged (already read as flat wall-mounted objects). Kept the flat-pixel-art house style (fillRect + simple polygons, no gradients).

### src/lib/state.js
- `migrateStateShape()`: detects an OLD flat-grid `roomLayout` (all keys numeric strings) and resets it to `{}`, bumping `lastSavedAt` so a stale cloud copy can't revert the reset via `resolveSync`. New-format (`{zone}_{a}_{b}`) and empty layouts pass through untouched. **`ownedRoomItems` is never touched** — all purchases persist across the migration.

### src/context/StateContext.jsx
- `PLACE_ROOM_ITEM` / `REMOVE_ROOM_ITEM` payloads renamed `slotIndex` → `slotKey` (string). Logic otherwise unchanged (still stamp `lastSavedAt`).

### src/components/Room.jsx (full rewrite)
- Replaced the DecoratedRoom-base + transparent 4×3 CSS-grid overlay with a single `<canvas>` that both draws the iso room and hit-tests taps. Added a 3-tab zone switcher (พื้น / ผนังซ้าย / ผนังขวา → `activeZone`). Tap → `hitTestZone` on the exact same geometry the canvas drew → empty slot opens a zone-filtered picker (owned + `allowedZones` includes zone + not already placed), occupied slot opens the remove/swap sheet. Empty-slot hints + selected highlight come from `drawRoomScene`. Picker/action/toast UI patterns preserved.

### src/components/Collection.jsx
- Furniture cards now show a zone badge (พื้น / ผนังซ้าย / ผนังขวา, one per `allowedZones` entry) alongside the tier badge, so the child knows where an item can be placed before buying.

### Verification
- `npm run build` clean, zero console errors on load + after exercising the modules.
- Functionally verified via dynamic-import of the live dev-server source (the actual Room screen sits behind a Supabase login gate that cannot be passed without credentials): `drawRoomScene` renders the full iso room + all furniture with no errors (visual screenshot confirmed floor diamond, both walls, wall-mounted art/windows, floor furniture with iso depth, contact shadows, zone hints, selected highlight); `hitTestZone(slotCenter(...))` round-trips correctly for all three zones; `migrateStateShape` verified across old-numeric / new-format / empty / missing cases — old resets + bumps `lastSavedAt`, `ownedRoomItems` preserved in every case.
- DB note: confirmed anon-key REST reads of `eggs.state_json` return `[]` (RLS blocks reading other users' rows) — the possible past `ownedRoomItems` wipe cannot be inspected or restored from here; that remains a Boss/service-role action. No DB writes attempted; migration code has no path that clears `ownedRoomItems`.

## 2026-07-02 — World map visual polish (Pandora-style, round 3)

Third polish pass, focused on two things: the map still reading as a rectangle on a background, and trees still reading as uniform balls. All gameplay logic unchanged.

### src/lib/tileEngine.js
- **Fix 1 (break the box)**: `renderMapPandora()`'s render loop now forces `tileType = T.TREE` for any cell truly outside `[0, MAP_COLS)`/`[0, MAP_ROWS)` (previously those cells silently fell through to plain grass). The forest now visually continues in every direction with no seam at the map edge. This only overrides the render loop's local `tileType` — the actual `tileMap` array `canMove()`/`tryMove()` read from is untouched, so the player is still only ever physically inside the real map.
- **Fix 2 (bigger, organic trees)**: `drawPandoraTree` canopy radius bumped to 36-52px (was 28-36) so neighboring canopies visibly overlap into a continuous edge; added a per-tree height offset (-8 to +16px) so the tree line isn't perfectly level; canopies are now an irregular lumpy silhouette (main circle + 3-4 smaller offset lobes) instead of a perfect circle; widened `TREE_CANOPY_COLORS` from 5 to 7 shades spanning `#1d5010`-`#5ab030`; undergrowth increased to 3-5 bigger blobs (8-14px, was 4-8px).
- **Bug found + fixed while implementing Fix 1**: `tileHash()` used plain `%`, which in JS keeps the sign of the dividend — so negative col/row (routine once Fix 1 renders arbitrarily-far out-of-bounds forest tiles) produced a *negative* hash. That negative value was then used as an array index into small palettes like `TREE_CANOPY_COLORS`; a negative JS array index returns `undefined`, and `ctx.fillStyle = undefined` is silently ignored by canvas (the previous fillStyle stays in effect) — so far off-map canopy fills were inheriting whatever was drawn immediately before them (often the trunk's dark brown), compositing into a solid brown/maroon patch in the far corners instead of forest. Fixed at the source: `tileHash` now wraps its result to always stay in `[0, 96]` (`(((...) % 97) + 97) % 97`). This was a latent bug in a helper used by nearly every ground/tree draw function — Round 1/2 never hit it because the render loop was still clamped to non-negative map coordinates back then.
- Added a `simple` param to `drawPandoraTree`, used only for the off-map forest-fill trees: skips the shadow ellipse, undergrowth blobs, inner white wash, rim leaf-clusters, and highlight blobs — all the semi-transparent decorative layers that, at the density needed to fill an unbounded viewport with heavily-overlapping 36-52px canopies, were stacking dozens-deep and (independently of the `tileHash` bug above) muddying the color. In-map trees are unaffected and keep full detail.

### Verification
Live-verified in Chrome: zoomed crops before/after confirm the far-corner brown patch is completely gone and the forest reads as consistent green in every direction with visible lumpy/varied canopies; walked the player into an enemy to confirm movement/collision/battle-triggering still work correctly; zero console errors; build clean.

## 2026-07-02 — World map visual polish (Pandora-style, round 2)

Second polish pass on the Pandora-style world-map renderer. All gameplay logic unchanged.

### src/components/WorldScreen.jsx
- **Fix 1 (exit arrows + fade transition)**: new `exitsRef` scans the tile map once per screen (in `initScreen`) for every `T.EXIT_N/S/E/W` tile; `checkProximity()` (already run on every successful move, same function that drives `nearNPC`/`nearSign`) now also computes `nearExitDirs` — true per-direction when any exit tile of that type is within Manhattan distance 3. New always-mounted `ExitArrow` components at each screen edge toggle `opacity`/`pointerEvents` off `nearExitDirs[dir]` (200ms CSS transition, so it actually fades rather than popping) and pulse via a new `px-world-exit-arrow` keyframe animation when visible; tapping one calls the existing `handleExit(exitType)` directly (it's direction-driven, not tile-position-driven, so this works with no other changes). The pre-existing `transOverlay`-driven fade transition (already used by every screen change) was retuned rather than rebuilt: color `#14231a`→`#000`, duration 160ms→300ms (both `handleExit` and `confirmEnterMaze`), matching the round-trip "fade to black, load, fade back" the brief asked for.

### src/lib/tileEngine.js
- **Fix 2 (water)**: `drawPandoraWater` rewritten — base color `#2a8aaa`; wave shimmer now drifts continuously via `Date.now()`-based phase instead of the old 2-frame flicker-swap; added 2-3 inner foam patches that slowly drift per-tile; added animated wavy edge-foam along any border shared with a non-water neighbor (new `NEIGHBOR_DIRS`/`isWaterAt`/`tileTypeAt` helpers, reused by Fix 3/4 below too).
- **Fix 3 (ground depth + shoreline)**: `drawPandoraGrass`/`drawPandoraPath` each gained 2-3 subtle curved contour/tire-track strokes (stable, hash-seeded) and a shoreline fringe on any edge touching water.
- **Fix 4 (bigger trees + palm variant)**: `drawPandoraTree` canopy radius bumped to 28-36px (was 18-28), shadow enlarged+softened, added a second inner highlight and 3-4 rim leaf-clusters to break up the perfect-circle silhouette. New `drawPandoraPalm()` — curved trunk (bezier), 5-6 fan fronds, small coconut cluster — used automatically instead of the round tree when a tree tile is adjacent to water (no tileMaps.js changes; purely a rendering branch).
- **Fix 5 (ambient density)**: `drawPandoraGrass` now also rolls, independently and hash-seeded, ~25% grass tufts, ~8% small rocks, ~5% tiny flowers per tile — purely decorative, drawn as part of the ground layer before any standing object/entity.

### Verification
Live-verified in Chrome: bigger trees with visible rim leaf-clusters and ambient grass tufts/flowers/rocks densely scattered across the map (zoomed crop confirms), zero console errors, build clean. **Not visually confirmed this pass**: the exit-arrow appearing/pulsing and the black fade transition specifically (automation movement didn't reliably cover the ~6 tiles needed to reach a real exit in the time available — a recurring limitation this session, not a code concern) — both reuse already-proven mechanisms (the same proximity-check pattern as NPC/sign detection, and a pre-existing fade system that's been running under every screen transition all session, just retuned in color/timing), so confidence is high despite the missing screenshot; and water/palm-tree rendering, since no live map currently places `T.WATER` tiles to visually confirm against (verified by code review + the "no live map uses water" fact already noted in earlier Stage 2 notes).

## 2026-07-02 — World map visual polish (Pandora-style, round 1)

Follow-up visual polish pass on the Pandora-style world-map renderer (see the rewrite entry directly below). All gameplay logic unchanged.

### src/lib/tileEngine.js
- **Fix 1 (letterbox)**: `renderMapPandora()`'s tile-culling loop no longer clamps to `[0, MAP_COLS)`/`[0, MAP_ROWS)` — it now covers the full viewport regardless of the real map's size. Cells outside the actual tile-map array read as `undefined` and fall through to the same textured-grass default as any other untyped tile, so the ground texture extends seamlessly past the map edge instead of leaving a flat, differently-toned void around a visible "box."
- **Fix 2/3 (richer ground + natural trees)**: `drawPandoraGrass`/`drawPandoraPath` now paint 3-5 irregular light/dark elliptical patches (was flat dots) plus a subtle bottom-edge shadow strip per tile; grass/path base colors adjusted slightly warmer. `drawPandoraTree` now takes `col`/`row` and is seeded per-tile: canopy radius 18-28px (was fixed 22px) and trunk height 10-18px (was fixed 14px) both randomized, canopy color picked from a 5-shade green palette instead of one fixed hex, plus 2-3 dark undergrowth blobs scattered at the base. Breaks up the "identical clones = fence" look of the tree border into something reading as a natural forest edge.

### src/components/WorldScreen.jsx
- **Fix 4 (tactile D-pad)**: `DPAD_BTN` rebuilt as 44px circular buttons (was 56px rounded-squares) with a `boxShadow`/`transform` press state (tracked via new `pressedDir` state + `onPointerDown`/`Up`/`Leave`), an SVG triangle arrow icon instead of a text glyph, sitting on a new 140px translucent blurred backing circle. NPC-talk/sign-read buttons restyled as a purple-gradient pill with a chunky tactile shadow (kept the text label for legibility, per CLAUDE.md's "no technical terms, friendly" guidance for a young child — not converted to icon-only).
- **Fix 6 (ambient atmosphere)**: added a barely-perceptible radial vignette (transparent center → `rgba(0,0,0,0.15)` edges) and a faint warm sunlight tint (`rgba(255,220,100,0.04)`) as full-canvas DOM overlays, same pattern as the existing sky-tint overlay.

### src/styles.css
- Found and worked around a global rule (`button,...{border-radius:0!important}`, part of the app's established pixel-art "zero border-radius" convention) that silently flattened the new circular D-pad/action buttons despite their inline `borderRadius` styles. Added two scoped override classes (`.px-world-round`, `.px-world-pill`) at higher specificity (`button.px-world-round{border-radius:50%!important}`) — an intentional, scoped exception for the world map's softer Pandora aesthetic, not a change to the pixel-art convention elsewhere in the app.

### src/components/world/WorldHUD.jsx, src/components/world/MissionPanel.jsx
- **Fix 5 (transparent HUD)**: HUD background opacity 0.86→0.4 + `backdrop-filter: blur(8px)`; MissionPanel 0.55→0.35 + `blur(6px)` + rounded corners. Both now read as floating over the map rather than covering it; verified text/bar contrast still legible against the textured grass showing through.

### Verification
Live-verified in Chrome: full-viewport ground texture confirmed (no more letterboxed "box" look), grass/tree variation clearly visible in zoomed crops, D-pad renders as genuinely circular tactile buttons (screenshot-confirmed after the CSS-specificity fix) and still triggers real movement/battles correctly, HUD text remains legible through the new transparency, zero console errors. Not independently screenshot-verified: the action-button (NPC talk/sign read) pill shape specifically — same underlying CSS-class mechanism as the D-pad fix, which was verified, so high confidence but not personally re-confirmed with its own screenshot.

## 2026-07-02 — World map: Pandora-style pseudo-3D rewrite (replaces flat + iso renderers)

Full replacement of the world map's rendering system, built and verified in 6 stages. All gameplay logic (movement, collision, battle triggers, tall-grass encounters, chests, signs, NPCs, maze, boss, fog-of-war) is unchanged — only the drawing changed. An earlier isometric-diamond approach (3 stages, commits `bcd8e06`/`e702ce8`/`d0ad20f`) was built first, then replaced by a design pivot to this Y-sorted technique before it was finished; that iso code was left dormant behind a debug flag through Stages 1-5 of this rewrite and fully deleted in Stage 6 once Pandora was confirmed solid — recoverable from git history if ever needed.

### src/lib/tileEngine.js
- Removed entirely: the original flat 16px GB-palette tile renderer (`renderMap`, `drawGrass`/`drawTall`/`drawTree`/`drawPath`/`drawWater`/`drawExit`/`drawFlower`/`drawSign`/`drawNPC`/`drawEnemy`(local)/`drawItemSpot`, the `C` color palette, `getCamera`), the flat `renderPlayer`, and the entire isometric renderer (`isoProject`/`isoUnproject`, `ISO_W`/`ISO_H`, `drawIsoTile` and all `drawIso*` functions, `renderMapIso`, `renderPlayerIso`).
- Added (across Stages 1-6): `PANDORA_TILE=32`; ground-tile drawers with stable per-tile texture (`drawPandoraGrass` speckle+highlight, `drawPandoraPath` pebbles, `drawPandoraTallGrass` leaning blades, `drawPandoraWater` 2-frame shimmer); standing-object drawers anchored at each tile's ground-contact point (`drawPandoraTree` — trunk+two-tone canopy+highlight, intentionally taller than one tile; `drawPandoraRock` — shaded boulder, reused for walls; `drawPandoraSignStanding`; `drawPandoraNPCStanding` — owl gets a dedicated beak/ear-tuft silhouette, other NPCs a generic waving-arm figure); `renderMapPandora(ctx, tileMap, camX, camY, frame, extraEntities)` — draws ground as one flat pass, then Y-sorts trees/rocks/signs/NPCs plus any caller-supplied dynamic entities (player/enemies/chests/portals) by ground-contact screen-Y and draws back-to-front; `renderPlayerPandora` — drop shadow + companion egg scaled to 40×48.

### src/lib/drawEnemy.js
- Added a second, fully independent sprite set: `drawEnemyPandora()` + `PANDORA_DRAW_FNS`, 10 rounded/volumetric enemy types (bunny, slime, fox, ghost, snake, egg_pawn, leaf_sprite, grumpy_mole, mushroom_imp, baby_zombie) with drop shadows and an upper-left-light/lower-right-shade convention via a shared `pBody()` helper. The original flat pixel-art set (`drawEnemy`/`DRAW_FNS`/`drawEnemyHurt`) is completely untouched — it's still the only enemy art the battle screen (`EnemyCanvas.jsx`) uses; live-verified a real battle still renders correctly after the rewrite.

### src/lib/worldDrawHelpers.js
- Removed the flat `drawChest` and `drawPlayerGlow`. Added `drawPandoraChest` (box+lid+clasp+shadow) and `drawPandoraPlayerGlow` (same two-ring pulse, radii doubled for the 32px tile size). `drawMazePortal` unchanged and reused as-is for both the entry portal and maze exit portal.

### src/hooks/useWorldGameLoop.js
- Removed the `window.__kq_isoDebug`/`window.__kq_pandoraDebug` flags and all conditional branching — the Pandora renderer is now unconditional, the sole render path. Player, enemies, and chests are Y-sorted together each frame via `renderMapPandora`'s `extraEntities` param. Ported every feature that previously only worked in the flat-renderer branch so nothing regressed when it was deleted: maze entry/exit portals (now Y-sorted like everything else, so the player draws correctly over/under them), maze fog-of-war + torch-ring DOM overlay positioning, the ambient player glow (skipped inside the maze, where fog/torch replaces it — same as before), and the saiyan/rainbow-star boost's rotating-hue shadow effect on the player sprite. Also added: enemy "!" alert indicators (woken bunny/snake aggro/world boss, previously flat-renderer-only) and the ghost_wisp gentle vertical bob.

### src/components/WorldScreen.jsx
- Removed a stale unused import (`drawChest`, `drawPlayerGlow` from `worldDrawHelpers.js` — imported but never called in this file even before this rewrite).

### Verification
Each of the 6 stages was independently verified live in Chrome (screenshots + zoomed crops + `read_console_messages`) before the next was authorized, following the same staged-review process used for the iso track. Final Stage 6 pass additionally verified: the sole (no-flag) renderer loads correctly on fresh navigation; a real battle triggered from the world map (walked directly onto an Egg Pawn) renders and plays correctly end-to-end, confirming the battle screen's enemy art is unaffected; zero console errors throughout. Not independently re-verified live this session: the maze fog/torch/portal port (reasoned carefully from the original flat-renderer code, not re-walked into a maze) and the saiyan-boost glow effect (no active boost item available to test) — both are straightforward ports of already-working logic, flagged for a follow-up spot-check if anyone notices an issue.

## 2026-07-02 — Audio expansion: new SFX/BGM tracks, sound toggle removed

### src/lib/audio.js
- Added 9 new SFX to the `SFX` dictionary: `coin_earn` (ting-ting), `coin_purchase`
  (ting-ting + ascending fanfare), `item_equip` (whoosh + shimmer sweep), `furniture_place`
  (thud + pop), `furniture_remove` (pop + thud), `room_visit_enter` (3-note bell),
  `minigame_start` (bandpass noise sweep + 2-note sting), `lives_empty` (low sawtooth buzz),
  `unlock_new` (5-note ascending arpeggio) — all raw Web Audio synthesis, matching the
  existing style (no external audio files).
- Added 3 new BGM generator functions to `BGM_TRACKS`: `room` (slow ~70 BPM cozy pad +
  pentatonic melody + bass pulse), `shop` (~110 BPM staccato major-scale melody + I→V chord
  loop + offbeat noise percussion), `minigame` (~130 BPM fast pentatonic arpeggio + driving
  bassline + noise snare on 2/4) — same generator pattern as the existing `_bgmHome`/
  `_bgmWorld`/etc (sustained oscillators + `setTimeout`-scheduled note loops, cleaned up via
  the shared `bgmNodes`/`bgmTimers` module state).
- Removed the sound-toggle mechanism: `setSoundOn()`, `toggleSound()`, `getSoundOn()` exports
  deleted; `_soundOn` is now a `true` constant. Existing `if (!_soundOn) return` guards inside
  every sound function were left in place (now permanently pass) rather than stripped out —
  keeps the diff minimal and guarantees no existing sound function's behavior changed.

### src/context/StateContext.jsx
- Added `dispatchAddCoins(dispatch, amount, bonusKey)` export — dispatches `ACTIONS.ADD_COINS`
  and plays `coin_earn` whenever `amount` is non-zero. Every one of the ~17 existing
  `ACTIONS.ADD_COINS` dispatch call sites (across `GameThai.jsx`, `GameMath.jsx`,
  `GamePhonics.jsx`, `GameShop.jsx`, `GameMathBattle.jsx`, `WorldBattle.jsx`, and all 5
  `src/games/minigames/*.jsx`) now goes through this helper instead of dispatching directly —
  every coin award plays its SFX automatically, with no per-call-site SFX call needed. The
  reducer itself is untouched/still pure. `ACTIONS.DAILY_LOGIN` (a separate action that awards
  coins in its own reducer case) plays `coin_earn` at its own dispatch site in the
  `StateProvider` init effect, not through the helper.

### src/components/Collection.jsx
- `playBGM('shop')` on mount / `stopBGM()` on unmount.
- `handleBuyWearable`/`handleBuyFurniture` (BUY_ITEM/BUY_ROOM_ITEM) play `coin_purchase`.
- `handleSelectWearable`'s owned-item branch (EQUIP_ITEM) plays `item_equip`.

### src/components/Room.jsx
- `playBGM('room')` on mount / `stopBGM()` on unmount.
- `handlePlace`/`handleSwapPick` (PLACE_ROOM_ITEM) play `furniture_place`; `handleRemove`
  (REMOVE_ROOM_ITEM) plays `furniture_remove`.

### src/components/RoomVisit.jsx
- Plays `room_visit_enter` on mount (fires whenever `FriendsScreen.jsx` opens the overlay).

### src/components/Home.jsx
- `launchRandomMinigame` now plays `minigame_start` and calls `playBGM('minigame')` right
  before `navigate('game')`.
- New `unlock_new` detection: a ref seeded to the current `unlockedGames(eggLevel)` set on
  first render, re-compared on every `eggLevel` change — if the set grew (a minigame's
  unlock-level threshold was crossed during this session), plays `unlock_new`. Deliberately
  session-scoped (not persisted) so reloading the app never re-fires it for thresholds already
  crossed in a prior session — there is no existing "minigame just unlocked" event to hook
  into elsewhere in the codebase, so this was the cleanest available signal.
- Sound-toggle button removed from the header; `soundOn`/`toggleSound` props removed.

### src/hooks/useBattleCombat.js
- `showVictory()` now calls `playBGM('victory')` alongside its existing `playTone('fanfare')`/
  `playSFX('victory')` — the `victory` BGM track existed in `BGM_TRACKS` since it was added but
  had no call site until now. `WorldBattle.jsx`'s existing `stopBGM()` calls in `onComplete`/
  `onFaint` end it when the victory screen is left (no new stop call needed).

### src/games/minigames/{EggMemory,EggCatch,EggFishing,EggTower}.jsx, EggRun.jsx
- Each minigame's `ready`-phase "lives exhausted" branch now plays `lives_empty` once (via a
  `useEffect` keyed on `phase`/lives, not on every re-render) when it becomes visible.
- Each minigame's `ACTIONS.ADD_COINS` dispatch replaced with `dispatchAddCoins(dispatch, …)`.

### src/App.jsx, src/games/GameScreen.jsx
- Removed the `soundOn`/`setSoundOnState`/`toggleSound` state, the `kq_sound` localStorage
  read/write, and the prop chain into `Home`/`GameScreen` (GameScreen was forwarding
  `soundOn` further into `GameThai`/`GameMath`/`GamePhonics`, none of which actually read the
  prop — confirmed dead before removing).

## 2026-07-02 — Minigame daily-lives + unlock-gating system

### src/lib/minigameLives.js (new)
- Single source of truth for the 5 minigames' daily lives + unlock gating: `MINIGAMES` config
  (per-game world key, `livesKey`/`dateKey` state fields, `max` lives/day, `unlockLevel`
  compared against companion `battleLevel`, deduct-life reducer action, Thai title),
  `livesRemaining(state, key)`, `unlockedGames(level)`, `heartsStr(remaining, max)`.

### src/lib/state.js, src/context/StateContext.jsx
- Added `memoryLives`/`lastMemoryDate` (5/day), `catchLives`/`lastCatchDate` (5/day),
  `towerLives`/`lastTowerDate` (5/day), `fishingLives`/`lastFishingDate` (3/day) to
  `defaultState()`, plus matching `MEMORY_DEDUCT_LIFE` / `CATCH_DEDUCT_LIFE` /
  `TOWER_DEDUCT_LIFE` / `FISHING_DEDUCT_LIFE` reducer cases (same shape as the existing
  `ER_DEDUCT_LIFE`), each stamping `lastSavedAt`.

### src/games/minigames/{EggMemory,EggCatch,EggTower,EggFishing}.jsx
- Each gained a `ready` phase (title + hearts row via `heartsStr` + start button, or a
  "come back tomorrow" message when lives are exhausted) before play starts; starting
  dispatches the game's `*_DEDUCT_LIFE` action. Coin-reward formulas rebalanced with more
  tiers / higher variance (previously flat 3-tier caps).

### src/games/minigames/EggRun.jsx — bug fix
- Migrated to the shared `minigameLives.js` module, fixing a real pre-existing bug: EggRun's
  own inline lives-reset check compared `state.lastRunDate` (stamped by the reducer using
  `todayStr()`, e.g. `"2026-7-2"`) against `new Date().toLocaleDateString()` — the two date
  formats never match, so EggRun's own ready screen was permanently stuck showing 3/3 hearts
  regardless of how many runs were actually left that day (Home's shortcut card, which already
  used `todayStr()` via `minigameLives.js`, had the correct count all along — only EggRun's own
  screen was wrong). Confirmed the fix live: set matching-day partial lives via localStorage,
  reloaded, and the ready screen now shows the correct partial heart count instead of a false
  full reset. Coin formula also rebalanced (distance + ring tiers, capped at 15).

### src/components/Home.jsx
- Minigame shortcut card (`launchRandomMinigame`) no longer hardcodes Egg Memory — picks
  uniformly at random among unlocked games (by companion battle level) that still have lives
  today, and shows the pooled total ("มีหัวใจ N ดวง"); toasts a friendly message if the pool is
  empty. Resolves the "Minigame picker screen" decision flagged 2026-07-01 (dedicated screen
  vs. map-tile routing) with a lightweight MVP — no new screen, `GameScreen.jsx` still has no
  unlock gating of its own.

### Verification
- Live-tested in Chrome against the running dev server (account "โชแปง"): all 5 ready screens
  render correct hearts; Home's pooled total agrees with the sum of individual games; forced an
  isolated EggRun test (zeroed the other 4 games' lives via localStorage, set `eggRunLives`
  with today's date) to directly confirm the date-format fix; restored all daily-lives fields
  to fresh afterward so no test data was left in the save (matches the project's established
  no-test-residue convention). Zero console errors. `npm run build` clean (172 modules).

## 2026-07-01 — Friends room visit + cosmetics display

### ⚠️ NEW MIGRATION PENDING — MUST BE RUN MANUALLY
- **`supabase/migrations/20260701_mystery_adventurers_room_visit.sql` must be pasted and run
  in the Supabase SQL Editor** (Dashboard → SQL Editor → Run;
  https://supabase.com/dashboard/project/dgpsnlkedergkbhqnjpu/sql). There is no Supabase CLI
  / service-role key in the repo, so it cannot be applied automatically.
- Until it is run, the app keeps working against the OLD RPC shape — `equipped_head` /
  `equipped_face` / `room_layout` come back `undefined` and the UI degrades gracefully
  (undecorated room + no cosmetics), which is exactly what live testing showed.
- Pre-change backup saved to `db_backups/get_mystery_adventurers_pre_room_visit.sql`.

### supabase/migrations/20260701_mystery_adventurers_room_visit.sql (new)
- `CREATE OR REPLACE FUNCTION get_mystery_adventurers(integer)` extended (via DROP + CREATE,
  since the return TABLE gains columns). Keeps every existing field; adds `equipped_head text`,
  `equipped_face text`, `room_layout jsonb`. Real rows read `state_json->'equipped'->>'head'`
  / `->>'face'` and `COALESCE(state_json->'roomLayout','{}'::jsonb)` from the joined `eggs`
  row. Bot rows get plausible random cosmetics (~35% empty per slot → natural mix of
  both/one/neither) and a small random `room_layout` (0–3 furniture entries). Item ids match
  the client catalogs (`COSMETIC_ITEMS`, `ROOM_ITEMS`). Privacy unchanged — no `child_name`
  or `user_id` exposed for anyone (real display_name stays the generic Thai mask).

### src/lib/roomScene.js (new)
- Shared, non-React `drawRoomScene(ctx, { W, H, roomLayout, small, hint })` helper extracted
  from `DecoratedRoom.jsx` — room gradient wall/floor, baseboard, floor grain, furniture from
  layout, and the empty-room hint. `small=true` scales for card thumbnails; `hint=false`
  suppresses the "decorate at the Room menu" text for friend rooms. The `small=false, hint=true`
  path reproduces DecoratedRoom's prior drawScene exactly (SLOT_SIZE 64 / GAP 8 / same grid math).

### src/components/DecoratedRoom.jsx
- Its inline `drawScene()` now delegates to `drawRoomScene(...)`. Removed the now-unused
  furniture constants / `ROOM_ITEMS` import. Home hero zone + Room editor render pixel-identically
  (live-verified — no regression).

### src/components/RoomScene.jsx (new)
- Presentational canvas: paints a room (via `drawRoomScene`) plus, optionally, a companion egg
  standing in it (`renderEggSprite`). Decoupled from local player state — takes an explicit `egg`
  so a visited friend's/bot's identity + cosmetics show (never the local companion). Used for the
  card thumbnail (`small`, egg baked in) and the RoomVisit background (large, `egg={null}`).

### src/components/RoomVisit.jsx (new)
- Full-screen read-only overlay, slides in from the right. Header: back button (‹) + "ห้องของ
  [name]". Full-bleed room + large centered `EggCanvasCore` (their element/eye/gender/stage,
  `aura` via `stageToAura`, `equipped` from the RPC). Bottom panel: HP/ATK/DEF/SPD + rarity +
  cosmetic chips (icon + Thai name) or "ยังไม่ได้แต่งตัว". No taps on egg/furniture. Gracefully
  defaults `room_layout→{}` and `equipped_*→null` for the pre-migration RPC shape.

### src/components/FriendsScreen.jsx
- Mystery-adventurers cards redesigned: left = 72×80 `RoomScene` thumbnail (room + companion egg
  with cosmetics); right = name + rarity badge, element · Lv, HP/ATK/SPD (`MiniStat`), and worn
  cosmetics as small inline icons (`CosmeticIcon`, icon-only — no text label, no "N ชิ้น" count).
  Tapping the card body opens `RoomVisit`; the "ดูสเตตัส" button uses `stopPropagation` so the
  existing stats-modal + "ท้าเล่น" mock-challenge flow is fully preserved.

Live-verified in Chrome (account "โชแปง"): cards render with mini room previews + stats (empty
rooms / no cosmetics as expected pre-migration), card-tap opens the centered room visit, back
button returns to the list, "ดูสเตตัส" still opens the stats modal, and Home + Room screens are
visually unaffected by the DecoratedRoom refactor. Zero console errors. Build clean.

## 2026-07-01 — Companion egg enlarged + centered on Home (follow-up to the Home redesign)

### src/components/DecoratedRoom.jsx
- Added a `showWalker` prop (default `true`, so `Room.jsx`'s existing usage is unaffected).
  When `false`, the RAF loop still draws the room background/furniture every frame but
  skips the small walking-companion sprite entirely (`spriteCtx` render, `updateEntity`,
  `drawEntity`). Read via a ref (`showWalkerRef`) to stay consistent with the rest of the
  file's RAF-safe pattern, even though neither current call site changes the prop after mount.

### src/components/Home.jsx
- The post-redesign Home showed the companion only as the tiny 48px room-walker sprite —
  too small to be "the main character of the screen." Restored a large, centered,
  interactive `EggCanvas` (200×236) on top of the room art (`DecoratedRoom` now rendered
  with `showWalker={false}` on Home only), reusing the exact stage/aura/anim/mood/glow
  pipeline the pre-redesign large egg used (re-added `cssAnimToEggAnim`/`cssAnimToMood`
  helpers). Equipped cosmetics render automatically (the `EggCanvas` wrapper defaults to
  `state.equipped` when no override is passed). Tap-to-pet, bounce-on-tap, and the
  floating reaction/heal-float/particle overlays are unchanged in behavior, only
  repositioned (from percentages tuned for the old tiny walker to be centered on/above
  the new large egg).
- Room editor (`Room.jsx`) is untouched — it doesn't pass `showWalker`, so it still shows
  the small walking companion exactly as before.

Live-verified in Chrome against the running dev server: large glowing egg renders
centered over the room background; tapping it triggers the happy expression + warm glow
(pet interaction confirmed working); Room screen still shows its walker + placement grid
unaffected. Build clean (168 modules).

## 2026-07-01 — Home screen redesign (approved layout)

### src/components/Home.jsx (full rewrite of layout/JSX; no game logic changed)
Redesigned Home to the approved top-to-bottom layout. **Visual/UX only** — no state
shape, reducer, or other-screen changes; `eggAlgorithm.js` untouched.

- **Header simplified**: left = small circular companion-egg avatar (`EggCanvas` 40px in
  a 34px round frame) + child name + egg-stage name; right = 🔥 login-streak pill
  (`state.loginStreak`, orange `#FF6B35`), 🪙 coin pill (`state.coins`, gold `#FFD23F`),
  and a 🔊/🔇 sound-toggle icon button. Dark semi-transparent panel with
  `backdrop-filter: blur`. **Login/profile is still reachable**: the whole left
  avatar+name block is a button → `onOpenProfile()` when logged in, `onOpenLogin()` when
  not (replaces the old text login/profile button). Removed the pulsing "พร้อมฟัก!"
  ready-to-hatch badge from the header.
- **Status bar added (new thin row)**: three equal chips — ❤️ HP (orange), ⭐ XP (gold),
  💕 Bond (purple `#9B5DE5`) — each an emoji + thin proportional bar, no numbers. HP =
  `activeEgg.currentHP/stats.HP`, XP = `eggProgressData.pct`, Bond = `activeEgg.bondMeter`.
  **Bond is shown on Home for the first time.** All three use `?.`/fallbacks so the
  zero-egg case renders (HP 100%, Bond 0%) without crashing.
- **Decorated room is the central hero zone**: `<DecoratedRoom>` moved from a
  full-viewport `position:absolute inset:0 zIndex:-1` background into the flex-1 egg zone
  (`position:absolute inset:0 zIndex:0` inside an `overflow:hidden` relative container),
  so the walking companion egg is actually visible in the middle of the screen instead of
  hidden behind the bottom panels. DecoratedRoom internals untouched. A floating
  "Lv.N · [egg stage name]" pill sits top-center of the zone.
- **Egg-tap-to-pet preserved**: the egg zone is a transparent tap target. Tap logic:
  armed item → use it (`handleTapItem`); else post-hatch → `handleCreatureTap` (+bond,
  floating emoji reaction); else pre-hatch → `handleEggTap` (pet combo / hatch trigger).
  Floating reaction + heal-float + tap particles render centered in the zone.
- **Party bar removed** (the scrollable multi-egg portrait row).
- **Compact evolution-progress bar removed from Home** (`compactEvoInfo` block + its
  `PROGRESSION_MAP` import dropped).
- **Pre/post-hatch JSX branch split collapsed** into one layout. New-player hatch flow
  preserved: when `readyToHatch && hatchedEggs.length === 0`, a pulsing
  "แตะเพื่อฟักไข่!" CTA button renders in the egg zone and tapping the egg still triggers
  `SET_HATCHING` via `handlePetEgg` — onboarding for future new accounts is intact.
- **Minigame shortcut card added**: full-width card (🎮 + "มินิเกม" + subtitle
  "Egg Memory · Egg Run · อีก 3 เกม" + › chevron). Taps dispatch
  `SET_CURRENT_WORLD: 'memory'` + `navigate('game')` → launches Egg Memory directly.
  **Caveat**: no minigame-*picker* screen exists (see note below); this launches the
  first-listed game as the pragmatic destination.
- **Item tray restyled, logic unchanged**: bigger icons (28px), roomier tap targets,
  icon + Thai name + count badge + status line (พร้อม / active `Nm` / cooldown `Nm`).
  All `USE_HOME_ITEM` / arm→use / cooldown / active-boost logic identical.
- **Explore button** now full-width "🗺️ ออกสำรวจ!" (unchanged navigation: `ENTER_WORLD` +
  `navigate('world')`). The old "ลูบ!" pet button was removed (petting is via the egg zone).

**Minigame-picker note (Scope Guardian):** a dedicated "pick a minigame from a list"
screen does not exist. Minigames (EggRun/EggCatch/EggMemory/EggTower/EggFishing) are
rendered by `GameScreen` based on `state.currentWorld`, but `SET_CURRENT_WORLD` was
dispatched *nowhere* and `navigate('game')` appeared *nowhere* — so GameScreen (and every
minigame) was effectively unreachable, and world-map minigame tiles (Phase 6) are unbuilt.
Building a real picker is new scope beyond "redesign Home.jsx", so the shortcut launches
Egg Memory directly (a trivial 2-line wiring change; EggMemory is dependency-free after
its emoji refactor). **Flagged as a Needs-Chatbot-decision:** should a real minigame
picker screen be designed?

Live-verified in Chrome vs the running dev server: header/status/room/minigame/tray/
explore all render per spec; egg-tap pet works; arm-food → tap-egg → use decremented
count 172→171; minigame card → Egg Memory; explore → Green Meadow map; bottom nav +
Shop + Room screens unaffected; zero console errors. Build clean (168 modules). Zero-egg
new-player path verified by code (guarded branch + hatch CTA preserved), not live (can't
safely zero out the live account's hatchedEggs without risking the resolveSync-revert bug).

## 2026-07-01 — fix: stamp lastSavedAt on every mutating reducer (closes the whole resolveSync-revert bug class)

### src/context/StateContext.jsx
Follow-up to `c74e83d` (coins) and `036070f` (cosmetics/room items): those two fixes
patched the specific reducers that had been caught reverting data on reload, but the
underlying gap — a mutating reducer case that doesn't stamp `lastSavedAt: Date.now()`
on its returned state — could exist in any of the ~70 other `case ACTIONS.*` reducers in
this file, since `resolveSync()` (`src/lib/state.js:273`) picks whichever of {local,
remote} has the newer whole-object `lastSavedAt` and is not a field-level merge. Any
un-stamped mutation is invisible to that comparison and can be silently discarded by a
later sync that happens to run with a stale remote snapshot — the exact failure mode
already observed twice.

Rather than wait for a third bug report, did a full sweep: every reducer `case` that
returns a genuinely different state (coin/XP/mastery/inventory/creature/world-progress
mutations — everything except `INIT`, the true no-op `ENCOUNTER_TRIGGERED`, the
`USE_ITEM`/`DROP_ITEM` aliases that delegate to already-covered cases, and the six
reducers `036070f` already fixed) now includes `lastSavedAt: Date.now()` in its returned
object. `ADD_COINS` — the specific reducer flagged as the most likely next victim in
`036070f`'s handoff note — is included.

Live-verified: wrote a `+5` coin bump with a fresh `lastSavedAt` directly to
`localStorage.kq_state` (mirroring exactly what the patched `ADD_COINS` reducer now
produces), reloaded the real running app, confirmed the coin bump survived
`resolveSync` (11 → 16, shown in the HUD), then restored the account to its exact
original state (11 coins) so no test data was left behind. Build clean (168 modules).

No resolveSync rearchitecture — matches the established per-reducer stamp pattern from
`c74e83d`/`036070f` rather than a field-merge rewrite.

## 2026-07-01 — fix: bought cosmetics disappear after close/reopen (resolveSync race — same class as c74e83d)

### Root cause
Identical class of bug to `c74e83d` (daily-login coins reverting). The `BUY_ITEM` and
`EQUIP_ITEM` reducers (`src/context/StateContext.jsx`) updated `ownedItems`/`equipped`
but did NOT bump `lastSavedAt`, so after a purchase the in-memory state kept the
*previous session's* timestamp. When `resolveSync` (`state.js:273`) later ran — from the
mount `loadState().then` (`StateContext.jsx:1009`) or the `SIGNED_IN` auth listener
(`:1059`) — it compared the frozen local `lastSavedAt` against a stale remote Supabase
snapshot that predated the purchase, hit the `remoteTime >= localTime` tie rule
(`state.js:284`), picked remote, and dispatched `INIT` — reverting the purchase, then
persisting the reverted state to both localStorage and Supabase. Net effect: the shop
asked the child to buy the item again on the next open. `migrateStateShape()` was NOT
the cause — it correctly preserves `ownedItems`/`equipped` via the `{...base, ...saved}`
spread (neither field is in `nestedObjectFields`, so present values are never reset).

The room-item reducers (`BUY_ROOM_ITEM`, `PLACE_ROOM_ITEM`, `REMOVE_ROOM_ITEM`) had the
identical latent gap — furniture had simply never been live-bought (save has 11 coins,
cheapest furniture is 30), so it was never observed. Fixed proactively to prevent the
same "furniture vanishes on reload" report.

### Fix
Added `lastSavedAt: Date.now()` to the returned state of `BUY_ITEM`, `EQUIP_ITEM`,
`BUY_ROOM_ITEM`, `PLACE_ROOM_ITEM`, and `REMOVE_ROOM_ITEM` — the same one-line pattern
as `c74e83d`. In-memory state is now definitively newer than the Supabase snapshot after
any purchase/equip/placement, so `resolveSync` correctly picks local and the change
persists through the normal `saveState` → localStorage + Supabase flow.

### Files changed
- `src/context/StateContext.jsx` — `BUY_ITEM`, `EQUIP_ITEM`, `BUY_ROOM_ITEM`,
  `PLACE_ROOM_ITEM`, `REMOVE_ROOM_ITEM` reducer cases: added `lastSavedAt: Date.now()`

### Verification
Build clean (168 modules). Live-tested in Chrome vs the running dev server against the
real logged-in account: wrote an owned-bow state carrying a fresh `lastSavedAt` (exactly
what the patched reducer now produces), did a full reload → `ownedItems:['bow']` and
`equipped.head:'bow'` survived the reload/resolveSync cycle (pre-fix, a frozen timestamp
loses the tie and the item reverts). Coins untouched at 11 (no c74e83d regression). The
account was then restored to its exact original state (coins 11, no items) and re-synced.
The buy-through-the-UI click itself was code-verified (not clicked) because the save has
11 coins and the cheapest cosmetic is 30 — same precedent as the furniture session.

## 2026-07-01 — World-map walker shows equipped cosmetics; removed dead HomeBackground.jsx

### src/components/WorldScreen.jsx
- `window.__kq_companionEgg` (published for `tileEngine.renderPlayer` to draw per-frame)
  now includes `equipped: state.equipped ?? null`, matching the same field
  `DecoratedRoom.jsx` already passes. `tileEngine.js:242` spreads the whole companion
  object into `renderEggSprite`, so no change was needed there — the existing
  `drawCosmetics` step (added for the Home room-walker fix) picks it up automatically.
  The world-map player sprite now renders equipped head/face cosmetics.

### src/components/HomeBackground.jsx (deleted)
- Confirmed dead since Home.jsx switched to `<DecoratedRoom>` — no remaining imports.
  Removed the file and a stale reference in Home.jsx's header comment.

Build verified clean (168 modules). Live browser verification for the map-walker change
was not repeated in this session — the logged-in test session from the prior task ended
before this pass started; verified instead via a direct code read confirming the same
`state.equipped` → `renderEggSprite({ ...companion })` pattern already live-verified on
DecoratedRoom.

## 2026-07-01 — fix: furniture shop tab genuinely unreachable — CSS flexbox min-size collapse (Collection.jsx)

### Corrected root cause (supersedes the 2026-06-30 "furniture shop tab empty" entry below)
The furniture tab was NOT a data/import bug and was NOT actually fixed by commit
f1da6e0 for a real (mouse/touch) user. That earlier entry — and a later static code
audit (build + data-flow trace, no live browser) — misattributed the failure: they
verified the item catalog and render logic were present in the bundle and concluded it
was fixed. It was not. **Live browser testing revealed a pure CSS layout bug.**

The top-level category tab-switcher `<div>` (the pill wrapping the 👗/🏠 buttons) is a
flex item inside Collection's outer flex-column container (`display:flex;
flexDirection:column; height:100%; overflowY:auto`). That tab-bar div sets
`overflow:hidden` (to clip its rounded `borderRadius:10` corners). Per CSS flexbox's
automatic-minimum-size rule, a flex item with non-`visible` overflow gets an automatic
min-height of **0** instead of a content-based floor. Because total page content exceeds
the viewport, the flex-shrink algorithm then collapsed this div's rendered height from
~42px to **2px** — clipping both tab buttons into an invisible, unclickable sliver that
looked like a thin divider line under the SHOP header. The furniture tab could never be
reached by a real pointer, so `roomItems.js` / f1da6e0's furniture render logic (both
correct) never got a chance to display. A previous session's JS `.click()` bypassed the
zero-height hitbox, which is why the static/scripted checks all "passed."

### Fix
Added `flexShrink: 0, flexGrow: 0` to the tab-switcher div's inline style (it is a
fixed-size control that must never shrink or grow). Computed height restored 2px → 42px;
both tabs render full-size and are clickable with a real pointer. Verified live in Chrome
against the running dev server: reloaded, opened Shop, real-clicked 🏠 เฟอร์นิเจอร์, and
all 12 furniture items rendered (ต้นไม้ 30, พรม 40, โคมไฟ 45, ตุ๊กตา 50, หน้าต่าง 60,
เก้าอี้ 150, โต๊ะ 180, กล่องของเล่น 200, ชั้นหนังสือ 280, ภาพวาด 250, เตียง 500, ตู้ปลา 600).

**Second instance of the same bug (also live-verified, also fixed):** the Head/Face
sub-tabs (หัว/หน้า) inside the wearable section shared the identical pattern
(`overflow:hidden` flex item, no `flexShrink`) and were also collapsed to 2px live.
Applied the same `flexShrink:0, flexGrow:0` fix; restored to 38px. This sub-tab bar had
been silently invisible too.

No item-list logic, coins economy, cosmetics/try-on, room placement, or Home background
touched. Try-on preview and the Room (ห้อง) tab reverified — no regressions.

The live buy-flow click could not be exercised: the save has 11 coins and the cheapest
furniture is 30. Buy logic was instead verified by reading `handleBuyFurniture` +
`BUY_ROOM_ITEM` reducer (guards insufficient coins and duplicate ownership, deducts
price, appends to `ownedRoomItems`) — correct. No coin/localStorage manipulation was done.

### Files changed
- `src/components/Collection.jsx` — added `flexShrink:0, flexGrow:0` to the top-level
  category tab-switcher div AND the Head/Face sub-tab div (two 1-line style additions)

## 2026-07-01 — feat: shop live try-on preview + walker cosmetics

### What changed
- `Collection.jsx` (cosmetics tab): added a large companion preview egg at the top showing the child's real element/eye/gender/stage/aura plus a **local try-on override**. Tapping any item card instantly updates this big egg.
  - New local-only state `preview: { slot, id } | null` — never dispatched, never persisted. Drives `previewEquipped = preview ? { ...equipped, [slot]: id } : undefined`, passed as the big egg's `equipped` prop (`undefined` → wrapper falls back to real `state.equipped`).
  - Tapping an **unowned** item → sets `preview` only (free, no coins, no reducer dispatch). A clear "ซื้อ 🪙price" button buys+equips for real.
  - Tapping an **owned** item → real `EQUIP_ITEM` toggle (unchanged reducer contract) and clears `preview`.
  - A "👀 ลองใส่" tag overlays the big egg only while previewing an unowned item; per-card shows "✓ ใส่อยู่" (real equipped) vs "👀 กำลังลอง" (local try-on). Highlighted border tracks whichever item is currently on the big egg.
  - Preview resets on unmount (leaving the shop), on buy, on real equip, and on switching the top-level tab — real `state.equipped` is never touched by previewing.
- Walker cosmetics (resolves the deferred item from session 8/10): `renderEggSprite.js` now accepts `equipped` and calls `drawCosmetics` (new step 9, before flash). `DecoratedRoom.jsx` reads `state.equipped` into its companion ref, so the Home-background room walker now shows equipped hats/glasses too. Home's large egg-zone `EggCanvas` already showed cosmetics (wrapper default) — no change needed there.
- Build clean at 168 modules, zero errors.

### Files changed
- `src/components/Collection.jsx` — live try-on preview state + tappable cards + big preview egg + try-on tag
- `src/egg/renderEggSprite.js` — `equipped` param + `drawCosmetics` step
- `src/components/DecoratedRoom.jsx` — thread `state.equipped` into the walker sprite

## 2026-06-30 — feat: decorated room becomes Home screen background (DecoratedRoom.jsx)

### What changed
- Created `src/components/DecoratedRoom.jsx`: canvas-based room renderer with room gradient background (cream/wood), placed furniture drawn via `item.draw()` from `ROOM_ITEMS`, and the companion egg walking/idle/jump/spin inside the room floor area (entity state machine + `renderEggSprite`, same as old `HomeBackground`). Reads `state.roomLayout` via ref so RAF always sees fresh layout. Self-contained: uses `useAppState()` + `useCompanion()` internally.
- `Home.jsx`: replaced `<HomeBackground>` with `<DecoratedRoom style={{ position:'absolute', inset:0, zIndex:-1 }}>`. The child now sees their decorated room as the Home screen background. All other Home UI (header, egg zone, party bar, item tray, action row) unchanged.
- `Room.jsx`: replaced the inline CSS-gradient + `EggCanvas` room scene with `<DecoratedRoom style={{ position:'absolute', inset:0 }}>` as the visual base. Added a transparent CSS grid overlay (12 divs with dashed/solid borders) as pure tap targets on top. Furniture no longer rendered by React DOM — it's drawn on the DecoratedRoom canvas. Removed `Slot` component; kept `SlotCanvas` + `ItemThumb` for picker modals.
- `HomeBackground.jsx`: no longer imported; kept in place as dead code (can be deleted in a future cleanup).
- Build clean at 168 modules, zero errors.

### Files changed
- `src/components/DecoratedRoom.jsx` — new file
- `src/components/Home.jsx` — replaced HomeBackground import/usage with DecoratedRoom
- `src/components/Room.jsx` — replaced inline room scene + EggCanvas with DecoratedRoom + tap overlay; removed Slot component

## 2026-06-30 — fix: furniture shop tab empty (Collection.jsx not updated in session 9)

### Root cause
Session 9 ran out of context before `Collection.jsx` was updated. The committed state had
`roomItems.js` (12 items), `Room.jsx`, `BottomNav.jsx` ("ห้อง" tab), and state/reducer
changes — but `Collection.jsx` was left at the session-8 version (head/face cosmetics
only, no furniture tab). Users could navigate to the Room screen but could not buy any
furniture because the shop's furniture tab didn't exist. The Room picker showed
"ซื้อในร้านค้าก่อนนะ" for every slot tap since `ownedRoomItems` was always empty.

### Fix
Completed `Collection.jsx`: added top-level 👗/🏠 tabs, `FurniturePreview` canvas
component, `ROOM_ITEMS.map(...)` grid with tier badges, room-background previews, buy
buttons wired to `BUY_ROOM_ITEM`. All 12 furniture items now appear and are purchasable.
Confirmed in production bundle: 837-byte furniture catalog block, all 12 item `id`s
present. (Commit f1da6e0 — part of session 9 completion in this conversation.)

### Files changed
- `src/components/Collection.jsx` — full rewrite: added furniture tab with 12 items

## 2026-06-30 — fix: daily login coin award fires every refresh, balance never increases

### Root cause
Two interacting bugs: (1) The `DAILY_LOGIN` reducer did not bump `lastSavedAt`, so
`stateRef.current.lastSavedAt` in memory always equalled the value Supabase had from the
previous session — making `resolveSync` treat them as a tie and, per its `>=` rule,
always pick remote as the winner. (2) The mount useEffect dispatched `DAILY_LOGIN`
(correctly awarding coins + setting `lastLoginDate = today`) *before* the async Supabase
load resolved. When Supabase arrived a few hundred ms later, `resolveSync` picked remote,
and `ACTIONS.INIT` overwrote `lastLoginDate` back to yesterday and reverted the coin
balance. On the next refresh `lastLoginDate` was still yesterday → daily login fired again.

### Fix
Added `lastSavedAt: Date.now()` to the `DAILY_LOGIN` reducer return value. This makes
`stateRef.current.lastSavedAt` definitively newer than the Supabase entry, so
`resolveSync` correctly picks local as the winner and skips the INIT overwrite. The daily
login then persists to localStorage and syncs to Supabase normally via the existing
`saveState` useEffect.

### Files changed
- `src/context/StateContext.jsx` — `DAILY_LOGIN` reducer case: added `lastSavedAt: Date.now()`

## 2026-06-30 (session 9) — feat: room / den decoration system

### New
- `src/lib/roomItems.js` — 12 pixel-art furniture items (plant, rug, lamp, stuffed animal, window, chair, desk, toy chest, bookshelf, wall art, bed, fish tank); `ROOM_ITEMS` catalog; `draw(ctx, cx, cy, sz)` per item
- `src/components/Room.jsx` — Room screen: warm CSS room background, 4×3 grid of 64px placement slots, companion EggCanvas at center-bottom; tap empty slot → bottom-sheet picker; tap occupied slot → remove/swap sheet; toast feedback

### Modified
- `src/components/Collection.jsx` — added top-level tabs (👗แต่งตัว / 🏠เฟอร์นิเจอร์); furniture tab shows 12 items with room-background previews and buy flow using `BUY_ROOM_ITEM`
- `src/components/BottomNav.jsx` — added 5th tab "ห้อง" (Room); "เพื่อน" recolored to orange
- `src/App.jsx` — added `screen === 'room'` + Room import
- `src/lib/state.js` — `ownedRoomItems: []` + `roomLayout: {}` added to `defaultState()`
- `src/context/StateContext.jsx` — added `BUY_ROOM_ITEM`, `PLACE_ROOM_ITEM`, `REMOVE_ROOM_ITEM` actions + reducer cases
- `docs/PROJECT_MAP.md` — added `Room.jsx` and `roomItems.js` entries

## 2026-06-30 (session 8) — feat: cosmetic items, shop, and wardrobe

### New
- `src/egg/eggCosmeticLayer.js` — 18 pixel-art cosmetic items (10 head + 8 face); `COSMETIC_ITEMS` catalog; `drawCosmetics(ctx, o, equipped)`
- Shop UI in `src/components/Collection.jsx` — replaces coming-soon placeholder; coin balance header, HEAD/FACE tabs, 2-col item grid with per-item egg preview, buy/equip/unequip, toast feedback; prices small 30–60 / mid 150–250 / big 500–800

### Modified
- `src/egg/index.js` — exports `COSMETIC_ITEMS`, `drawCosmetics`
- `src/egg/EggCanvas.jsx` (core) — added `equipped` prop; `drawCosmetics` drawn as step 9 (inside pose transform, after expression, before flash); `equipped` in useEffect dep array
- `src/components/EggCanvas.jsx` (wrapper) — auto-reads `state.equipped` from `useAppState`; accepts optional `equipped` prop override for shop previews
- `src/lib/state.js` — `ownedItems: []` and `equipped: { head: null, face: null }` added to `defaultState()`
- `src/context/StateContext.jsx` — added `BUY_ITEM` and `EQUIP_ITEM` to ACTIONS + reducer cases

### Not changed
- `eggAlgorithm.js` (LOCKED — untouched as always)
- All existing screens using `<EggCanvas>` now show equipped items automatically via the wrapper change

## 2026-06-30 (session 7) — feat: coins earned shown on all result screens

All 16 result/end screens now show the exact coins awarded that round.

- `GameThai.jsx`: `ResultScreen` gains `coins` prop (gold badge); `useFinishRound` returns `{ finish, coins }` — no formula duplication; ThaiMatchGame/ThaiSpellGame/ThaiWordOrderGame all wired
- `GameMath.jsx`: `coinsEarned` state + badge in inline done screen
- `GamePhonics.jsx`: `ResultScreen` gains `coins` prop; all 4 sub-games (L1–L4) add `coinsEarned` state
- `GameShop.jsx`: `coinsEarned` state + badge in inline done screen
- `GameMathBattle.jsx`: `coinsEarned` state + badge in dark-background done screen
- `EggMemory.jsx`: hardcoded `🪙 +5` badge (flat award)
- `EggTower.jsx`: computes display from `score` state — `max(3,min(8,3+floor(score/4)))`
- `EggCatch.jsx`: computes display from `score` state — `score≥20?8:score≥8?5:3`
- `EggRun.jsx`: `🪙 +N` badge in dead overlay — derived from `gsRef.current.ringCount`
- `EggFishing.jsx`: hardcoded `🪙 +5` badge (flat award)
- `WorldBattle.jsx`: `pendingBattleCoins` state set alongside `ADD_COINS`; passed to `<RewardChest>`
- `RewardChest.jsx`: `coins` prop → animated gold pill shown in reveal phase

## 2026-06-27 (session 6) — feat: coin economy (earn-only foundation)

### src/lib/state.js
- Added `coins: 0`, `lastLoginDate: ''`, `loginStreak: 0`, `coinsLevelBonus: {}` to `defaultState()`
- Existing players get `coins: 0` on next load via `migrateStateShape`

### src/context/StateContext.jsx
- New `ADD_COINS` action: `{ amount, bonusKey? }` — adds coins, clamps ≥ 0; when `bonusKey` set, skips if already awarded and marks key in `coinsLevelBonus`
- New `DAILY_LOGIN` action: awards `10 + min(streak, 5)` coins on first open each calendar day, tracks `loginStreak`
- Mount useEffect: dispatches `DAILY_LOGIN` + shows `showItemToast("ล็อกอินรายวัน 🪙 +N")` at 900ms

### Coin earn hooks (all 13 activity types)
- `GameThai.jsx` (`useFinishRound`): `round(12 × accuracy × (1-mastery))` clamp [2,12] + level-unlock bonus +15
- `GameMath.jsx`: same formula at done path + level-unlock bonus +15
- `GamePhonics.jsx`: same formula at all 4 done paths (L1–L4) + level-unlock bonus +15
- `GameShop.jsx`: accuracy-only formula (no mastery field for shop)
- `GameMathBattle.jsx`: formula + level-unlock bonus
- `WorldBattle.jsx`: +10 regular battle win / +15 boss win (in `onComplete`)
- `EggMemory.jsx`: flat +5 on completion
- `EggTower.jsx`: `max(3, min(8, 3+floor(score/4)))` on game-over
- `EggRun.jsx`: rings≥16 → +8, rings≥6 → +5, else → +3
- `EggCatch.jsx`: score≥20 → +8, score≥8 → +5, else → +3
- `EggFishing.jsx`: flat +5 on timer end

### src/components/Home.jsx
- Coin HUD: 🪙N badge (gold `#FFD23F`, pixel font) shown in header next to name/stage

## 2026-06-27 (session 5) — feat: legacy creature art removal STEP 2+2.5+§3+§4

### Deleted (zero callers verified before deletion)
- `src/components/BattleScreen.jsx` — orphaned, was never imported in App.jsx
- `src/components/HatchOverlay.jsx` — gated behind `!hasCreature` (never fires for current users); import + JSX removed from App.jsx
- `src/components/CreatureCanvas.jsx` — only caller was HatchOverlay
- `src/lib/drawCreature.js` — only caller was CreatureCanvas
- `src/lib/creatureAlgorithm.js` — all callers (BattleScreen, EggMemory, LoginBackdrop, WorldHUD) fixed before deletion
- `src/context/creatureHelpers.js` — only caller was HatchOverlay; dead import removed from StateContext.jsx

### src/components/LoginBackdrop.jsx
- Replaced `FloatingCreature` (drawCreature canvas) with `FloatingEgg` (renderEggSprite RAF loop)
- 9 random element eggs (random element/eye/gender/stage) float and squish-on-tap
- Removed `drawCreature` import; kept `startBGM`/`stopBGM`/`playCreatureTapSFX`

### src/games/minigames/EggMemory.jsx
- Replaced creature canvas cards with 6 element emoji cards: 🔥💧⚡🌿🌑✨ (always 6 pairs)
- Removed `drawCreature`, `getCreatureSeed`, `ITEMS` imports; no creature dependency

### src/components/world/WorldHUD.jsx
- Removed dead `getCreatureSeed` import from `creatureAlgorithm.js`
- Removed dead `window.__kq_activeCreatureSeed` and `window.__kq_activeCreatureStats` assignments (nothing read these globals)

### db_backups/get_mystery_adventurers.OLD.sql (new)
- Git-recoverable backup placeholder saved before running `20260627_mystery_adventurers_egg.sql`
- ⚠️ Actual live DB definition should be retrieved via `SELECT pg_get_functiondef(...)` before applying the migration (see file for instructions)

### Build
- 165 modules (down from 170); clean build; no creature art reachable in the running app

### Not done (STEP 3 — DB drops)
- `hatchedEggs.state_json` creature-identity fields not dropped (pending backup + explicit OK)
- `get_mystery_adventurers` RPC migration still not applied (apply `supabase/migrations/20260627_mystery_adventurers_egg.sql` in Supabase SQL Editor)

---

## 2026-06-27 (session 4) — feat: full-pipeline animated walkers + Mystery Adventurers egg upgrade

### src/egg/renderEggSprite.js (new)
- Shared non-React helper: full 9-step egg compositing pipeline (aura→pose→regalia-behind→body→regalia-front→eyes→expression)
- Accepts `{element,eye,gender,stage,aura,mood,anim,t,canvasSize,basePxOverride}`
- Used by HomeBackground + tileEngine for live-animated walker sprites

### src/components/HomeBackground.jsx
- Replaced static offscreen bake (2-layer drawEggBody+drawEyeLayer) with per-frame `renderEggSprite` into a reused 48×48 canvas
- `basePxOverride=2` ensures egg fills the sprite frame; element animations (flames, water swirl, halo pulse) are now live
- `companionRef` keeps companion data in sync without restarting the RAF loop; `spriteOffRef` is the reused sprite canvas

### src/components/WorldScreen.jsx
- Replaced static `window.__kq_playerOffscreen` bake with `window.__kq_companionEgg = {element,eye,gender,stage,aura}`
- Removed `EGG_SHAPES`, `drawEggBody`, `stageSizeMul`, `drawEyeLayer` imports

### src/lib/tileEngine.js
- Replaced `drawCreature` import with `renderEggSprite`
- `renderPlayer` now calls `renderEggSprite` every frame into a reused 32×32 offscreen; result scaled to 16×16 via `ctx.drawImage` — fully animated

### src/components/FriendsScreen.jsx
- Mystery Adventurers cards/modal now render `<EggCanvasCore element eye gender stage aura=0>` (core egg component from src/egg/EggCanvas.jsx)
- Shows `display_name` (bot/anonymized handle) + element name in Thai (ธาตุไฟ etc.) instead of creature_name
- Deleted: `drawCreature` import, `ELEMENT_STATS`, `elementToStats`, `CreatureCanvas` component

### supabase/migrations/20260627_mystery_adventurers_egg.sql (new)
- Drops old `get_mystery_adventurers` and recreates with new return columns: `element/eye/gender/stage/hp/atk/def/spd/rarity_label/is_bot`
- Real users: JOIN companions for egg identity; stage estimated from hatchedEggs[0].battleLevel
- Bots: random element/eye/gender/stage + randomized names (15 preset bot names)
- ⚠️ Must be applied manually in Supabase SQL Editor

---

## 2026-06-27 — feat: companion egg walker on Home; Collection replaced with coming-soon placeholder

### src/components/HomeBackground.jsx
- Rewrote walker to use companion egg: props changed from `creatures[]` to `companion + stage`
- Pre-renders companion egg to 48×48 offscreen canvas via `drawEggBody` + `drawEyeLayer`
- Single entity (one companion) walks/hops/spins in the background landscape
- Removed `drawCreature`, `getCreatureSeed`, creature-array animation logic

### src/components/Home.jsx
- Added `useCompanion()` — passes `resolved` + `stage` to HomeBackground
- Removed `buildLegacyPreviewDNA`, `buildVoiceProfile` imports; voice profile now derived from companion `element`/`gender`
- Removed `getEggElementHint`, `CREATURE_ELEMENT_COLORS`, `EVO_STAGE_LABELS_TH` imports; removed element-hint header block
- Build: all creature system references removed from Home (except voiceProfile shape which is now companion-based)

### src/components/Collection.jsx
- Replaced with "coming soon" placeholder: companion EggCanvas centered + "เร็วๆ นี้!" heading + subtext "ร้านค้า • ไอเทมแต่งตัว • แต่งบ้าน กำลังจะมา"
- Removed all creature system imports (drawCreature, buildLegacyPreviewDNA, CREATURE_ELEMENT_COLORS, CreatureDetailPopup, StageIcon, CreatureJourney)
- Route still works; no 404

### src/components/CreatureDetailPopup.jsx
- Deleted — orphaned after Collection rewrite (was the only importer)

---

## 2026-06-26 (session 2) — feat: companion egg shown on all screens; name shows child's name everywhere

### src/components/Home.jsx
- Removed `drawCreature`/`getCreatureSeed` imports
- Added `stageToAura`, `cssAnimToEggAnim`, `cssAnimToMood` helpers
- Large creature display: `<canvas drawCreature>` → `<EggCanvas stage aura anim mood>`; creature name → `state.name`
- Header name, party bar name: all → `state.name`; party bar portrait canvas → `<EggCanvas>`

### src/components/Collection.jsx + PartySelect.jsx
- Companion egg (`<EggCanvas>`) replaces creature canvas in team/party displays
- Name everywhere → `state.name`

### src/games/MoveSelectBattleMode.jsx
- Player side: single `<EggCanvas stats anim mood>` always (removed `drawCreature` branch)
- `companionAnim`/`companionMood` derived from `eggAnimClass` (charge/lunge→attack, shake→hurt, victory→excited)
- Player name → `state.name`

### src/components/WorldScreen.jsx + src/lib/tileEngine.js
- WorldScreen pre-renders companion egg to `window.__kq_playerOffscreen` (32×32) using `drawEggBody` + `drawEyeLayer`
- `tileEngine.renderPlayer` checks `__kq_playerOffscreen` first, falls back to `drawCreature`

---

## 2026-06-26 — feat: Living Egg renderer + one-time Companion Creation (eye/gender/element)

### src/egg/EggCanvas.jsx (NEW)
- Core animated egg renderer using all 8 finalized layer modules
- `requestAnimationFrame` loop; DPR-backed canvas for crisp gradients (halo/water) + crisp pixel body
- Compositing order: aura (behind, no pose) → ground shadow → applyEggPose → regalia behind → body → regalia front → eyes → expression → flash → restore
- Round baby sprite for ALL stages; body grows via `stageSizeMul` (capped at stage 5)
- Props: `{ element, eye, gender, mood, anim, stage, aura, size }`
- For replaced bodies (fire/water/shadow/light): `drawBodyMass` instead of solid egg
- For nature/thunder: `drawEggBody` with `ctx.filter=saturate(X%)` + `drawStageLayer`
- Female: eyelashes + blush via `gender='female'` passed to `drawEyeLayer`
- Spinning-water body, Pikachu-tail thunder horns, angel light halo, leaf nature wings all working

### src/components/EggCanvas.jsx (REPLACED)
- Old: called `drawEgg` from locked `eggAlgorithm.js` with pixelation post-pass
- New: thin wrapper that reads `eye/gender/element` from `CompanionContext`, accepts legacy `stats={...}` prop (extracts `stats.stage`)
- All existing callers (BattleMode, DefenseMode, ChaseMode, MoveSelectBattleMode, HatchOverlay, EggPopup, Home, EggRun) work without change

### src/context/CompanionContext.jsx (NEW)
- Loads `companions` row from Supabase on auth; listens to `onAuthStateChange`
- Exposes `{ companion, resolved, loading, createCompanion }`
- `resolved` always has fallback defaults (`fire/gba/male`) so EggCanvas never renders empty
- `createCompanion` calls `create_companion` RPC; idempotent

### src/components/CompanionCreation.jsx (NEW)
- Blocking overlay (no close button, no Esc, no backdrop dismiss)
- Live EggCanvas preview at top (stage 1, idle anim) reflecting current picks in real time
- Element picker: 6 big buttons (🔥ไฟ/💧น้ำ/⚡สายฟ้า/🌿ไม้/🌑เงา/✨แสง) with element color accents
- Eye picker: 4 options with mini EggCanvas previews showing the eye style + current element
- Gender picker: ♂ ชาย / ♀ หญิง (female adds eyelashes in preview)
- Confirm flow: "ยืนยันคู่หู" → confirm dialog "แน่ใจไหม? เลือกแล้วแก้ไขไม่ได้อีก" → ตกลง / ย้อนกลับ
- Thai UI: Press Start 2P for headers, Sarabun for Thai text

### src/App.jsx
- Added `CompanionCreation` to gating flow: shown after onboarding, before main app, if no `companions` row
- Loading screen waits for BOTH auth AND companion load (prevents flash)

### src/main.jsx
- Wrapped app with `CompanionProvider` (inside StateProvider)

### supabase/migrations/20260626_companions.sql (NEW)
- `companions` table: `user_id PK | eye | gender | element | created_at`
- RLS: select_own + insert_own; NO update/delete = immutable from client
- `create_companion(p_eye, p_gender, p_element)` RPC: `ON CONFLICT DO NOTHING` + fallback select; `security definer`; revoked from public; granted to authenticated
- **Must be run manually in Supabase SQL Editor**

---

## 2026-06-21 — fix: add outline, organic curves, diagonal limb pixels, and eye highlights to baby-stage creatures (Pokemon-reference-informed)

### src/lib/creatureAlgorithm.js
- All 4 baby draw functions redesigned with Pokémon-reference quality techniques
- **Dark outline**: every shape drawn as dark shell first, then fill on top → 1px dark border all around every body region
- **Head-to-body flow**: FURRED — 10-wide dark head shell flows into matching-width shoulder bridge row (primary color), then body steps in 1px each side (diagonal shoulder, no hard box seam); WINGED — 8-wide head shell steps to 6-wide body shell at y=6 (1px per side = diagonal shoulder); SCALED — head and body share same x-range (x=3–8) → outline runs continuously from top to bottom, color change (light→primary) marks the transition; CHITIN — segment widths widen via 6→8→10 dark shells so each segment visually widens below the one above
- **Diagonal pixels**: FURRED tail = 2-row stair-step (x=9 at y=6, x=10 at y=7); WINGED wing nubs = 3×3 dark block + fill tapers from 2-wide (y=6–7) to 1-wide (y=8) left/right edge steps; SCALED tail = straight column (y=5–7) then 1-px right-shift diagonal bend (y=8–10)
- **Eyes**: all baby eyes are 2×2 dark block with explicit 1×1 white '#ffffff' pixel at upper-left corner (x,y position)
- **Chitin**: compound eye protrusions moved to x=2 and x=9 (1×2 tall, truly outside the 6-wide head dark shell at x=3–8); segment fill widths 4→6→8; segment shell widths 6→8→10; abdomen fills y=9–10 only (y=11 stays solid dark = bottom border)
- Scaled baby spot/stripe pattern overlay coordinates updated (old positions landed on solid-dark border row y=8 and leg zone y=9)

### public/creature-baby-test.html
- Updated to match new baby draw function implementations
- Updated squint-test description text with all 4 type cues

---

## 2026-06-20 — fix: redesign creature silhouettes using chibi pixel-art proportion principles (head ratio, color economy, single focal feature)

### src/lib/creatureAlgorithm.js
- Round 4 redesign — all 12 draw functions rewritten using 5 chibi pixel-art principles
- FURRED: head 8-wide, body only 6-wide (head wider = chibi dome reads instantly); ears are 2×3 blocks above the head dome; focal feature = the head shape itself; mane crown added at final with accent shimmer; 4 stub legs
- WINGED: smooth dome top (no ears = immediate contrast vs furred); head 6-wide; eyes positioned at y=1–2 (avian/high); body only 4-wide (narrow upright pillar); wings are THE focal feature: shoulder nubs at baby → folded accent wings at teen → fully spread accent wings at final spanning canvas edges; 2 legs (bipedal)
- SCALED: flat-top head (no bumps), side frills protrude sideways (not upward); SLIT EYES = 1×2 vertical blocks (vs other types' 2×2 round); tail is THE focal feature: 1-wide/no-accent at baby → 2-wide/accent-tip at teen → 3-wide/large-accent at final
- CHITIN: 3-band stacked structure at 4→6→8 column widths (readable in silhouette alone); antennae are single-pixel-wide lines (not ear blocks); compound eyes bulge 1px beyond head; accent = wings only (nothing at baby, wing buds at teen, full spread at final + accent rings on abdomen)
- Pattern overlays (spots/stripes) coordinates updated to match new body layouts

---

## 2026-06-20 — fix: redesign creature silhouettes within original 12x12 grid using Pokemon-style proportion differentiation

### src/lib/creatureAlgorithm.js
- All stages (baby/teen/final) now use the same 12×12 grid — reverts 16×16 final-stage grid from previous pass
- Silhouette differentiation is now proportion-based (Pokémon-style) not resolution-based:
  - FURRED: WIDE quadruped body (10-12 of 12 cols), FOUR legs in two visible pairs with belly gap, TRIANGULAR EARS above head. Bulbasaur/Eevee proportion. Baby=stub tail, Teen=shoulder mane tufts, Final=full mane crown radiating from head
  - WINGED: NARROW upright body (4 of 12 cols), BIPEDAL (2 legs only), BEAK pointing down, tail extending right. Charmander/Charizard proportion. Baby=tiny wing nubs, Teen=folded wing buds (clearly visible), Final=full wingspan spread to canvas edges
  - SCALED: ROUND compact body (Squirtle-like), DORSAL RIDGE (not ears) above head, SLIT EYES (vertical pupils), ARM STUBS on body sides + 2 bottom legs. Baby=small dorsal frill, Teen=head frills on sides, Final=large dramatic frills spanning top corners
  - CHITIN: THREE STACKED SEGMENTS visible at all stages (head=smallest, thorax=medium, abdomen=LARGEST), thin ANTENNAE (not ears), legs from thorax only. Baby=4 legs, Teen=6 legs + wing buds, Final=full spread wings + large pincers
- Beak draw-order fixed: body drawn first, beak drawn after so it appears on top
- Tongue on SCALED final drawn last (over chest armor so it is visible)
- Pattern overlays (spots/stripes) updated to work with new body layouts

---

## 2026-06-20 — fix: distinct body-type silhouettes + majestic final-stage creature designs

### src/lib/creatureAlgorithm.js
- Complete silhouette redesign: each body type now has a fundamentally different architecture
- FURRED: 4 visible legs (2 pairs with belly gap — back-outer + front-inner), triangular pointy ears, wide quadruped body
- WINGED: wings are widest element (span canvas edge to edge), narrow body, triangular beak, 2 talon feet with spread, fan-shaped tail feathers (not round curl)
- SCALED: HORIZONTAL orientation for baby/teen (head on left, tail curling up on right, frills on left edge, tiny legs at belly bottom); final stands upright as 2-legged armored dragon
- CHITIN: 3 visually distinct stacked segments (head=smallest, thorax=medium with legs, abdomen=largest at bottom), thin antennae pointing up, legs radiate from thorax sides (4 legs baby, 6 legs teen/final)
- Final stage now uses 16×16 grid (vs 12×12 for baby/teen) for more silhouette complexity
- FURRED final: lion-king with mane radiating out, glowing eyes, massive chest plate, 4 thick legs + paws
- WINGED final: phoenix/storm dragon, wings span full 16px width, dramatic tail fan, long beak
- SCALED final: standing serpent dragon, long head with dramatic frills + horns, armored scale rows, serrated coiling tail
- CHITIN final: titan beetle/mantis, wings spread full width, 6 legs, large pincers, 3-segment abdomen with rings
- Pattern overlays (spots/stripes) only applied to baby/teen; final stages rely on their own detail work

---

## 2026-06-20 — feat: modular creature body types + expanded palettes + patterns, seed-driven

### src/lib/creatureAlgorithm.js
- Full redesign of drawing system — seed now drives visual variation via `prng(seed)` (XorShift32)
- 4 body types: `furred` (round ears, 4 legs, tail), `winged` (beak + wing protrusions + tail feathers), `scaled` (side frills + slit eyes + forked tongue), `chitin` (antennae + compound eyes + segmented body)
- 12 distinct silhouettes: 4 body types × 3 stages (baby/teen/final), each hand-placed on 12×12 pixel grid
- 3–4 hand-tuned palette variants per element (20 total): fire×4, water×3, thunder×3, nature×4, shadow×3, light×4
- Pattern overlays: `none` (50%), `spots` (25%), `stripes` (25%) — body-type-aware positions
- `PALETTES` replaces single-variant `COLORS` map
- `prng()` added (same XorShift32 as `eggAlgorithm.js`) — body type, palette variant, pattern all deterministic per seed
- All public API unchanged: `getCreatureSeed()`, `getCreatureName()`, `drawCreature()` signature preserved
- `getElement()` unchanged (locked)

---

## 2026-06-20 — feat: render real procedural pixel-art creatures on Mystery Adventurers cards

### src/components/FriendsScreen.jsx
- Added `import { drawCreature } from '../lib/creatureAlgorithm.js'`
- `ELEMENT_STATS`: reverse-maps 6 element names → placeholder `{xpThai, xpMath, xpEng, acc, streak}` objects that make `getElement()` return the correct element without modifying `creatureAlgorithm.js`. Logic verified against each branch: shadow (streak≥7), nature (acc≥85), fire/water/thunder (dominant subject ≥45%), light (no dominant)
- `elementToStats(element, evoStage)`: merges base stats with `evoStage` field
- `CreatureCanvas({ seed, element, evoStage, size })`: canvas + `useEffect` that calls `drawCreature(canvas, Number(seed), elementToStats(element, evoStage))`; `imageRendering: pixelated`
- Card: replaced 48×48 emoji placeholder with `<CreatureCanvas size={64} />` inside rarity-bordered box
- Modal: replaced 72×72 emoji placeholder with `<CreatureCanvas size={192} />` inside rarity-bordered box
- `creature_emoji` and `creature_name` text labels unchanged; no modification to `creatureAlgorithm.js`

---

## 2026-06-20 — feat: show active creature + full stats on Mystery Adventurers cards

### src/components/FriendsScreen.jsx
- `RARITY` constant: 5-tier color map (common/uncommon/rare/epic/legendary) — border, background, text, optional glow — keyed by lowercase label
- `RarityBadge`: inline span with per-rarity border + bg + glow; used on cards and in modal
- `StatBar`: reuses `.px-hp-bar-outer`/`.px-hp-bar-inner` CSS classes; label (pixel font) + filled bar + numeric value; per-stat colors (HP green, ATK red, DEF blue2, SPD yellow)
- `AdventurerModal` (createPortal): opens on "ดูสเตตัส" tap; shows 72px emoji avatar with rarity-colored border, creature_name + RarityBadge, masked display_name, 4 StatBars (HP/300, ATK/80, DEF/60, SPD/300), "⚔️ ท้าเล่น" mock button (closes modal + fires 3s toast)
- Adventurer card updated: rarity-colored border/glow per tier; 48×48 emoji avatar box; creature_name + badge + display_name info column; "ดูสเตตัส" button replaces inline "ท้าเล่น"
- player/bot distinction: intentionally absent — identical layout for both source values

---

## 2026-06-20 — feat: unify friends screen + add Mystery Adventurers tab (mock challenge UI)

### src/components/FriendsScreen.jsx
- **Part A — Unified Friends tab**: collapsed 4 separate tabs into one scrollable page with sections in order: pending requests (conditional — not rendered when empty), My Code, Add Friend, My Friends list. All existing RPC calls and message logic preserved unchanged.
- All data loaded in parallel via `Promise.all` (friendships + ensure_friend_code + my_friends) on a single `loadAll` callback; respond actions re-trigger `loadAll` to refresh requests and friends in one shot.
- **Part B — Mystery Adventurers tab ("ผู้คนอื่นๆ")**: calls `supabase.rpc('get_mystery_adventurers', { p_limit: 8 })` on mount; shows adventurer cards with `display_name` + generic ⚔️ icon (no visual distinction between source: 'player'/'bot'). "ท้าเล่น" button is a mock — shows fixed-position toast "ส่งคำท้า [name] แล้ว! รอสักครู่นะ..." for 3s, no backend call. "🔄 สับใหม่" button re-calls the RPC to reshuffle.
- Tab bar reduced from 4 tabs to 2 (เพื่อน / ผู้คนอื่นๆ)

---

## 2026-06-20 — feat: Phase 1 Friend Code System frontend (4 screens)

### src/components/FriendsScreen.jsx (new)
- 4-tab pixel-art screen: My Code / เพิ่มเพื่อน / คำขอ / เพื่อน
- **MyCodeTab**: calls `supabase.rpc('ensure_friend_code', { p_user_id })` on mount, displays code as "ABC-DEF" in yellow pixel font, clipboard copy button
- **AddFriendTab**: 6-char auto-uppercase input, calls `supabase.rpc('send_friend_request', { p_code })`, handles "already friends / not found / self / error" with Thai kid-safe messages
- **RequestsTab**: queries `friendships` (target_id=user, status=pending), joins `eggs` to get requester names, Accept/Reject via `supabase.rpc('respond_friend_request', { p_friendship_id, p_accept })`, reloads after response
- **FriendsListTab**: queries `my_friends` view (RLS-scoped), shows friend names; empty state if none

### src/components/BottomNav.jsx
- Added 4th tab "เพื่อน" (green `#44cc88` dot) linking to screen `'friends'`

### src/App.jsx
- Import `FriendsScreen`; added `{screen === 'friends' && <FriendsScreen />}` render branch

---

## 2026-06-20 — feat: sequencing mode speaks the correct letter order instead of a generic instruction

### src/components/WorldBattle.jsx
- `genSequenceQ(alphaList, isThai)` — added `isThai` param; builds `spokenOrder = correctOrder.join(', ')` (e.g. "ก, ข, ค" or "Q, R, S") and embeds it in the instruction strings
- Thai: `instructionTh = "เรียงตามลำดับนี้ ก, ข, ค"` → TTS speaks the actual letter sequence
- English: `instructionEn = "Tap them in this order: Q, R, S"` → TTS speaks the actual letter sequence
- Call site in `genThaiMoveQ`: `genSequenceQ(TH_ALPHA, true)` 
- Call site in `genEngMoveQ`: `genSequenceQ(EN_ALPHA, false)`
- TTS playback path (MoveSelectBattleMode `instructionTh/En` fallback) and onSpeak replay already handle the dynamic strings — no other files changed
- Note: single Thai consonant pronunciation quality varies by browser/OS TTS engine; comma-join gives natural pauses; no phonetic mapping added (would require all 44 consonant names)

---

## 2026-06-20 — feat: save-status toast only fires for intentional user saves, not background auto-save

### src/lib/state.js
- `saveState(s, { notify = false } = {})` — added optional `notify` flag; `emitSaveStatus('saving')` only fires when `notify: true`
- `syncToSupabase(s, { notify = false } = {})` — same pattern; offline/saved/error status only emitted when `notify: true`
- All existing callers (debounced auto-save in StateContext line 882, SIGNED_IN sync at lines 915/967/972, migration syncs in loadState) pass no second arg → silent by default

### src/components/ProfileModal.jsx
- Added `saveState` to import from state.js
- `handleSave` now constructs `updatedState = { ...state, name, schoolGrade, gender }` and calls `saveState(updatedState, { notify: true })` immediately after dispatch, showing the "บันทึกแล้ว" toast tied to this intentional action
- OnboardingModal left silent (auto-save handles it; the game screen transition provides sufficient user feedback)

---

## 2026-06-20 — fix: TreasureSlot reward icons not rendering (dynamic import race in canvas ref)

### src/components/TreasureSlot.jsx
- Added static `import { drawItem } from '../lib/itemArt.js'` at top of file
- Added `RewardIcon` sub-component (useEffect + useRef, same pattern as Collection.jsx's StageIcon) to draw item icons stably
- Replaced inline `ref={ref => { if(ref) import('../lib/itemArt.js').then(...)}}` canvas with `<RewardIcon itemKey={r.key} size={64} />`
- No other files used the same anti-pattern (grep confirmed only one occurrence)

---

## 2026-06-20 — feat: interactive pre-login backdrop — tappable creatures, start button, BGM + SFX

### src/lib/audio.js
- Added `_bgmLogin(ctx)` track: 8-note C-major melody (triangle) + alternating bass (sine), loops via `bgmTimers` using the existing scheduler pattern; registered in `BGM_TRACKS` as `'login'`
- Added `startBGM()` export: stops any current BGM, starts the login track directly (bypasses suspended-ctx guard by calling `getACtx()` first)
- Added `playCreatureTapSFX()` export: random-pitch chirp sweep 400–1100 Hz over 150ms
- `setSoundOn()` and `toggleSound()` now call `stopBGM(0)` when muting

### src/components/LoginBackdrop.jsx
- Creatures are now tappable: 60% squish (scale 0.8,1.2 + `playCreatureTapSFX`), 40% evolve (advance evoStage + `playTone('stageUp')`), both revert after 450ms
- BGM starts on mount (`startBGM()`), stops on unmount (`stopBGM()`)
- Central pixel-art sword "เริ่มเล่น!" start button (absolute centered), calls `onStartTap` prop
- `onTapped` callback removed (creatures handle reactions internally)

### src/App.jsx
- Added `showLoginModal` state (default `false`)
- Not-logged-in render: backdrop shows always; LoginModal only shown when `showLoginModal=true`; `mandatory={false}` so the X button and click-outside close work

### src/components/LoginModal.jsx
- Added ✕ close button (absolute top-right, `position:absolute`), only rendered when `!mandatory`

### src/styles.css
- `.px-auth-sheet` — added `position:relative` to anchor the absolute-positioned ✕ button

---

## 2026-06-20 — style: restyle LoginModal, ProfileModal, OnboardingModal to pixel-art design system

### src/styles.css
- Added `.px-auth-sheet` — `px-darkest` background, `px-border` border, 4px pixel shadow, square corners, `slideUp` animation
- Added `.px-auth-input` — `px-black` background, `px-border` border, `px-white` text, `var(--font-thai)`, inset shadow; focus → `px-yellow` border; placeholder → `px-light` at 0.6 opacity

### src/components/LoginModal.jsx
- `auth-sheet` → `px-auth-sheet`; `auth-input` → `px-auth-input`
- Handle bar: `var(--border)` → `var(--px-border)`, `borderRadius:0`
- All three mode titles: `var(--font-thai)`, `px-yellow`, pixel `textShadow`
- Subtitles and body text: `var(--font-thai)`, `px-light`
- "ลืมรหัสผ่าน?" link: `var(--font-pixel)`, `px-blue2`, 8px, no underline
- Login button: `px-btn`; Sign Up button: `px-btn px-btn-purple` — both `flex:1`
- "ส่งลิงก์รีเซ็ตรหัสผ่าน" / "ปิดหน้านี้": `px-btn` with `var(--font-thai)` override
- `msgColor` initial: `var(--red)` → `var(--px-red)`; success: `var(--green-d)` → `var(--px-green2)`
- Sent mode: email highlighted in `px-yellow` instead of plain bold

### src/components/ProfileModal.jsx
- Same `auth-sheet` → `px-auth-sheet`, `auth-input` → `px-auth-input` swap
- Grade and gender toggle buttons: selected = `px-yellow` border + `px-mid` bg; unselected = `px-border` + `px-dark` bg
- Save button: `px-btn` with `var(--font-thai)` override; "ข้ามไปก่อน": `px-light`
- Logout section: `px-border` separator; logout button uses `2px solid var(--px-red)` with `px-black` pixel shadow

### src/components/OnboardingModal.jsx
- Identical sheet/input/toggle-button pixel restyle as ProfileModal
- Submit button: `px-btn` with `var(--font-thai)` override, opacity 0.5 when disabled

## 2026-06-20 — feat: LoginBackdrop — decorative pre-login screen

### src/components/LoginBackdrop.jsx (new)
- Colorful gradient (warm orange/yellow → cool blue/purple) with 9 floating creature sprites
- Creatures generated once per mount via `useRef`; random seeds, element-biased stats, evoStage mix
- Three CSS float animations (`kq-float-0/1/2`) with per-creature duration/delay to avoid sync
- Uses real `drawCreature()` renderer — sprites look identical to in-game creatures
- `zIndex: 0`; LoginModal overlay renders on top at its own z-level

### src/App.jsx
- Not-logged-in return now renders `<LoginBackdrop />` + `<LoginModal mandatory />` together

---

## 2026-06-20 — feat: mandatory onboarding flow for new accounts

### src/lib/state.js
- `defaultState().name` changed from `'โชแปง'` to `''` — new accounts no longer inherit a hardcoded Thai name; empty name is also the signal used to trigger onboarding

### src/components/OnboardingModal.jsx (new)
- Mandatory first-time setup: name input + school-grade grid (stores label string) + gender 3-button picker
- All fields start unset; submit button disabled until all three are filled (gender must be actively tapped, even to choose 'ไม่ระบุ')
- No skip button, no click-outside dismiss
- Dispatches `SET_PROFILE({ name, schoolGrade, gender })` on submit; App.jsx gate resolves automatically when `state.name` becomes non-empty

### src/App.jsx
- Added `OnboardingModal` import
- Gate: `const needsOnboarding = !state.name || state.name.trim() === ''` inserted between the login gate and main return
- Existing accounts with any name set are unaffected

---

## 2026-06-20 — feat: resolveSync, stateVersion deep migration, SaveStatusIndicator

### src/lib/state.js
- Added `STATE_VERSION = 1` constant; `stateVersion` field in `defaultState()`
- Added `onSaveStatusChange` / `emitSaveStatus` module-level listener system
- Added `resolveSync(local, remote)` — single source of truth for conflict resolution: unconditional "remote has creatures, local empty" override; timestamp comparison; `rounds` fallback for pre-timestamp saves
- Added `migrateStateShape(saved)` — shallow-merges defaultState onto old save, then deep-merges 12 nested-object fields to backfill new sub-keys without destroying existing values
- Both paths in `loadState()` now run `migrateStateShape` before `_migrateEggs` / `_migrateBattleStats`
- `saveState()` emits `'saving'` before `syncToSupabase`; `syncToSupabase()` emits `'saved'`/`'error'`/`'offline'`

### src/context/StateContext.jsx
- Import updated to include `resolveSync`
- Initial-load conflict block replaced with `resolveSync(cur, remoteFinal)`
- SIGNED_IN conflict block replaced with `resolveSync(cur, remote)` — same logic, no duplication

### src/components/SaveStatusIndicator.jsx (new)
- Subscribes to `onSaveStatusChange`; renders a fixed bottom-right badge
- 'saved' auto-fades after 2.5s; 'error' / 'offline' stay visible

### src/App.jsx
- Added `SaveStatusIndicator` import and render inside main app return (post-auth gate)

---

## 2026-06-20 — feat: mandatory auth gate — no more guest mode

### src/App.jsx
- Added `supabase` import
- Added `authChecked` / `isLoggedIn` state
- Added auth effect: `getSession()` on mount to set initial state; `onAuthStateChange` listener to react to login/logout events
- Before main return: shows loading spinner until `authChecked`; renders mandatory `<LoginModal>` while not logged in; `onAuthStateChange` SIGNED_IN event flips `isLoggedIn` and automatically shows the full app

### src/components/LoginModal.jsx
- Added `mandatory` prop; overlay click-outside disabled when `mandatory`
- Removed "ข้ามไปก่อน (guest mode)" skip button entirely
- Updated description text to "เข้าสู่ระบบหรือสมัครสมาชิกเพื่อเริ่มเล่น"

---

## 2026-06-20 — fix: separate parent-entered schoolGrade from game-progression grade

### src/lib/state.js
- Added `schoolGrade: null` to `defaultState()` — purely informational parent-input field, never read by game mechanics

### src/context/StateContext.jsx
- `SET_PROFILE` reducer: reads/writes `schoolGrade` instead of `grade` — `state.grade` is now exclusively owned by `SET_SUBJECT_LEVEL` auto-progression

### src/components/ProfileModal.jsx
- `grade` state replaced with `schoolGrade` (stores the label string, e.g. `'ป.1'`, not an index)
- Grade-button grid now compares `schoolGrade === label` and calls `setSchoolGrade(label)`
- Section heading changed to "ระดับชั้นเรียนจริง" with subtitle "สำหรับเก็บข้อมูลเท่านั้น ไม่กระทบการเล่นเกม"
- `handleSave` dispatches `{ name, schoolGrade, gender }` — no `grade` in payload

---

## 2026-06-20 — fix: logout fully clears local game state

### src/components/ProfileModal.jsx
- Added imports: `defaultState`, `KEY` from `../lib/state.js`
- `handleLogout`: after `supabase.auth.signOut()`, now calls `localStorage.removeItem(KEY)` then `dispatch(ACTIONS.INIT, defaultState())` before closing — ensures no previous child's data remains in memory or on disk

---

## 2026-06-20 — feat: gender field in child profile

### src/lib/state.js
- Added `gender: 'unspecified'` to `defaultState()` with comment noting future gendered content/item gating (not yet implemented)

### src/context/StateContext.jsx
- `SET_PROFILE` reducer now reads and spreads `gender` from payload

### src/components/ProfileModal.jsx
- Added `gender` state (initialised from `state.gender`); included in `handleSave` dispatch
- 3-option selector (👦 ชาย / 👧 หญิง / 🌟 ไม่ระบุ) inserted between grade grid and save button

---

## 2026-06-19 — fix: cloud-sync conflict resolution uses timestamps instead of rounds counter

### src/lib/state.js
- Added `lastSavedAt: Date.now()` to `defaultState()`
- `saveState()` now stamps `{ ...s, lastSavedAt: Date.now() }` before writing to localStorage and syncing to Supabase — timestamp flows into `state_json` automatically

### src/context/StateContext.jsx
- `loadState().then()`: replaced `rounds` comparison with `lastSavedAt` comparison; falls back to `rounds` only if both sides have `lastSavedAt === 0` (pre-existing old saves)
- `SIGNED_IN` block: same timestamp logic; unconditional "cloud has creatures, local empty" override retained
- Log messages updated to show ISO timestamps instead of round counts

---

## 2026-06-19 — feat: logout button in ProfileModal

### src/components/ProfileModal.jsx
- Added `supabase` import and `useEffect`; on modal open calls `supabase.auth.getUser()` to populate `userEmail` state
- When `userEmail` is non-null: renders separator, current-account label ("เข้าสู่ระบบด้วย email@..."), and red-outline "ออกจากระบบ" button
- Button calls `supabase.auth.signOut()` then closes the modal; shows "กำลังออกจากระบบ..." and is disabled during the request
- Guest users (no Supabase session) see no change — the logout section is hidden entirely

---

## 2026-06-19 — feat: password reset flow

### src/components/LoginModal.jsx
- Added `mode` state ('login' | 'forgot' | 'sent'); login screen unchanged
- "ลืมรหัสผ่าน?" link below password field switches to 'forgot' mode
- 'forgot' mode: email field + send-link button calls `supabase.auth.resetPasswordForEmail` with `redirectTo: origin/?reset=1`
- 'sent' mode: confirmation screen showing the destination email address

### src/components/ResetPasswordModal.jsx (new file)
- Mounts silently at app root; subscribes to `supabase.auth.onAuthStateChange`
- Becomes visible only on `PASSWORD_RECOVERY` event (user clicked email link)
- Two password inputs with length ≥6 and match validation; calls `supabase.auth.updateUser({ password })`
- Success screen with close button

### src/App.jsx
- Added `import ResetPasswordModal` and `<ResetPasswordModal />` alongside always-mounted modals

---

## 2026-06-19 — feat: CreatureJourney stage icons use actual player creature sprites

### src/components/Collection.jsx
- Added `StageIcon` helper component: renders a canvas with `drawCreature()` called with `evoStage` overridden to `baby`/`teen`/`final`
- Replaced emoji (🥚/🐉/✨) inside the 3-stage circle icons with `<StageIcon>` — size 40px for current stage, 30px for others; circles have `overflow:hidden`
- Removed `emoji` field from `stages` array entirely
- Progress-bar moving marker replaced: was `stages[i].emoji` text, now an 18×18 `overflow:hidden` rounded div containing `<StageIcon size={16} />`
- Added `useEffect` to React import (required by StageIcon)

---

## 2026-06-19 — fix: mirror/hint battle item now shows visible hint UI in all input modes

### src/hooks/useBattleCombat.js
- Added `setTimeoutHintActive` to destructured params
- `hint` effect: calls `setTimeoutHintActive?.(true)` unconditionally — drives gold tile highlight (wordbuild/sequence), `revealDigit` display (numpad), and choice elimination (choice/fillgap/visualdiscrim) through the same state that the time-based system uses
- Updated log messages to match actual visible behavior (removed misleading "ตัวแรกคือ..." text that was never shown)

### src/games/MoveSelectBattleMode.jsx
- Passes `setTimeoutHintActive` to `useBattleCombat`

---

## 2026-06-19 — feat: time-based auto-hint for all battle input modes

### src/games/MoveSelectBattleMode.jsx
- Added `timeoutHintActive` state, `timeoutHintTimerRef`, `HINT_DELAY_MS` thresholds
- Timer effect (dep `[cur]`): resets on each question, schedules hint after mode delay; callback guards against post-answer fires
- Auto-eliminate effect (dep `[timeoutHintActive]`): for choice/fillgap/visualdiscrim, eliminates 2 wrong choices
- `showWordbuildHint` and `showSequenceHint` now OR'd with `timeoutHintActive`
- Passes `revealDigit` prop to NumpadInput when timeout-hint is active

### src/components/battle/NumpadInput.jsx
- Added `revealDigit` prop; renders "💡 ตัวแรกคือ X" hint text below digit display when set

---

## 2026-06-19 — feat: maze chests, ghost_wisp enemies, single exit portal

### src/config/enemyConfig.js
- Added `ghost_wisp` (hp:30, atk:3, def:0, subject:null) — maze-exclusive

### src/lib/drawEnemy.js
- Added `_ghostWisp()` pixel art sprite (48-grid, semi-transparent blob with glowing tail)
- Added `ghost_wisp` to DRAW_FNS and EYE_POSITIONS

### src/lib/tileMaps.js
- `generateMazeMap()` return shape changed from plain array to `{ map, openCells, entryPos, exitPos }`; `openCells` collected during carving; single EXIT_N at [1][18] replaces old 3-exit layout
- Added `spawnMazeContents(openCells, entryPos, exitPos)` — returns 2–3 chests + 3–4 ghost_wisp enemies on safe tiles

### src/components/WorldScreen.jsx
- Added `mazeOpenCellsRef` + `mazeExitPosRef` refs
- `initScreen` MAZE branch destructures new return shape; stores openCells + exitPos in refs
- `spawnMazeContents` imported and used for MAZE screen-init; non-MAZE path unchanged
- `mazeExitPosRef` passed to `useWorldGameLoop`

### src/hooks/useWorldGameLoop.js
- Added `mazeExitPosRef` to hook signature
- Added `ghost_wisp` AI case: slow random drift (timer≥70), never chases
- `renderEnemies` gains `frame` param; ghost_wisp gets vertical bob + purple glow
- Maze exit portal rendered via `drawMazePortal` when `screenIdRef.current === 'MAZE'`

---

## 2026-06-19 — fix: replace canvas fog-of-war with DOM CSS-mask overlay

### src/lib/worldDrawHelpers.js
- Removed `drawMazeFog()` entirely (was using destination-out canvas compositing which produced unreliable results)

### src/hooks/useWorldGameLoop.js
- Removed `drawMazeFog` from import
- Added `fogOverlayRef`, `torchRingRef` to hook signature
- In loop(): when MAZE, updates `fogOverlayRef.current.style.WebkitMaskImage` + `maskImage` with flickering `radial-gradient` each frame; updates `torchRingRef.current.style.left/top/width/height` for animated warm ring

### src/components/WorldScreen.jsx
- Added `fogOverlayRef` + `torchRingRef` ref declarations
- Added fog overlay `<div>` (z-index 2, CSS mask background) + torch ring `<div>` (z-index 3, amber border + box-shadow) — both conditionally rendered when `screenId === 'MAZE'`
- Passed `fogOverlayRef`, `torchRingRef` to `useWorldGameLoop`

---

## 2026-06-19 — feat: replace maze exit-routing with a glowing purple portal object

### src/lib/state.js
- Added `mazePortal: { screenId: random, col: null, row: null }` to `defaultState()`
- Removed `secretMapExpiry: null` from defaultState

### src/context/StateContext.jsx
- New actions: `SPAWN_MAZE_PORTAL`, `SPAWN_MAZE_PORTAL_RESOLVED`, `ENTER_MAZE`
- `INCREMENT_BATTLE_WINS`: removed `shouldSpawnMaze` condition and `secretMapExpiry` spread
- `SET_WORLD_LEVEL`: removed `secretMapExpiry: null`; added `mazePortal` reset to new random screen
- `DEFEAT_BOSS`: removed `secretMapExpiry: null`
- `CLEAR_MAZE`: now spawns a new portal on a random screen instead of setting `mazeCleared: true`
- New reducer cases: `SPAWN_MAZE_PORTAL` (random screen, col/row null), `SPAWN_MAZE_PORTAL_RESOLVED` (persists resolved position), `ENTER_MAZE` (sets mazeActive: true)

### src/lib/worldDrawHelpers.js
- Added `drawMazePortal(ctx, x, y, frame)`: pulsing purple concentric rings + swirling core + 3 orbiting sparkle particles

### src/hooks/useWorldGameLoop.js
- Added `mazePortalPosRef` param; imported `drawMazePortal`
- Renders portal (if `mazePortalPosRef.current` is set) after chests, before player glow/fog

### src/components/WorldScreen.jsx
- Added `mazePortalPosRef = useRef(null)` and `mazeConfirm` state; removed `mazeTimerTick` state
- Screen-setup `[screenId]` effect: resolves portal tile position (reuses stored col/row on revisit, finds random grass candidate on first visit and dispatches `SPAWN_MAZE_PORTAL_RESOLVED`); sets null for BOSS/MAZE/wrong-screen cases
- `handleExit`: removed `if (curState.mazeActive && ...)` routing overrides; removed `forcedStart` MAZE special-case
- `tryMove`: added portal collision check → `setMazeConfirm(true)`
- Added `confirmEnterMaze` (fade transition to MAZE + dispatch ENTER_MAZE) and `declineEnterMaze`
- Removed two `secretMapExpiry` useEffects and the countdown ticker
- Removed old "Maze notification" countdown banner JSX
- Added mazeConfirm confirm dialog (🌀 purple-bordered, "ประตูมิติลึกลับ" / ยังก่อน / เข้าไปสำรวจ!)
- Passes `mazePortalPosRef` to `useWorldGameLoop`

## 2026-06-18 — feat: maze fog-of-war with flickering torch-light radius

### src/lib/worldDrawHelpers.js
- Added `drawMazeFog(ctx, playerPx, playerPy, frame, canvasW, canvasH)`: fills canvas near-black, uses destination-out radial gradient to punch a lit circle (~58px radius) around the player, adds warm candle tint overlay; flicker via two overlapping sine waves

### src/hooks/useWorldGameLoop.js
- Added `screenIdRef` to destructured params; imported `drawMazeFog`
- Render loop: `screenIdRef?.current === 'MAZE'` → `drawMazeFog` before player; else normal `drawPlayerGlow`

### src/components/WorldScreen.jsx
- Passes `screenIdRef` to `useWorldGameLoop`

## 2026-06-18 — fix: rainbow_star saiyan stops chase AI; player can still walk into chasers; rainbow SFX + visual

### src/hooks/useWorldGameLoop.js
- Added `saiyanActive` check at top of `updateEnemies()`
- sleepy_bunny: chase movement now guarded by `&& !saiyanActive`
- baby_zombie: movement timer check now guarded by `&& !saiyanActive`
- snake: aggro movement changed from `if (ne.isAggro)` to `if (ne.isAggro && !saiyanActive)` / `else if (!ne.isAggro)` so aggro-but-saiyan causes zero movement (no movement branch taken)
- Removed duplicate `saiyanActiveNow` local variable — reuses single `saiyanActive` from top of function
- World-map player glow changed from static gold to fast rainbow hue cycle: `hsl((frame×6) % 360, 100%, 60%)` — full color rotation every ~60 frames

### src/components/WorldScreen.jsx
- `tryMove` hitEnemy: removed early `if (isChaser && saiyanActive) return false` that was blocking walk-into-chaser
- Now only suppresses the "chaser already on player tile" overlap branch with `isChaser && !saiyanActive`
- Player deliberately stepping onto enemy tile always triggers battle

### src/lib/audio.js
- Added `powerup` SFX to the SFX dictionary: upward sine sweep (200→1600 Hz) + ascending triangle arp

### src/hooks/useHomeInteractions.js
- rainbow_star activation now calls `playSFX('powerup')` before `playTone('celebrate')`

### src/components/Home.jsx
- Creature outer wrapper div gains `className={saiyanActive ? 'saiyan-rainbow' : ''}` for CSS hue-cycle animation

### src/styles.css
- Added `@keyframes rainbow-cycle`: hue-rotate 0→360deg with saturate(1.5) brightness(1.1)
- Added `.saiyan-rainbow` class: `animation: rainbow-cycle 0.6s linear infinite`

## 2026-06-18 — feat: adaptive hint overlay for word-building and sequencing modes

### src/lib/state.js
- Added `inputModeMastery: { wordbuild: 0, sequence: 0 }` to `defaultState()` — range 0–1, persists to localStorage

### src/context/StateContext.jsx
- Added `RECORD_INPUT_MODE_RESULT` action constant
- Added reducer case: EMA update with `success ? +0.15 : -0.08`, clamped 0–1

### src/games/MoveSelectBattleMode.jsx
- Computed `showWordbuildHint = wordbuildMastery < 0.5` and `showSequenceHint = sequenceMastery < 0.5` from `state.inputModeMastery`
- Wordbuild `onSubmit`: dispatches `RECORD_INPUT_MODE_RESULT` with `mode:'wordbuild'` before locking
- Sequence `onSubmit`: dispatches `RECORD_INPUT_MODE_RESULT` with `mode:'sequence'` before locking
- Both components now receive `showHint` prop

### src/components/battle/WordBuildInput.jsx
- Accepts `showHint` prop; computes `nextNeededChar` (target char at first empty slot) and `hintTileId` (first unused tray tile matching it)
- Hinted tile gets gold border + pulsing `hint-pulse` box-shadow animation
- "👆 ตัวที่กระพริบ ไปวางในช่องว่างนะ" instruction shown above tray when hint is active

### src/components/battle/SequenceInput.jsx
- Identical hint system as WordBuildInput; `nextNeededChar` from `target[nextEmptyIdx]`

### src/styles.css
- Added `@keyframes hint-pulse` — oscillates box-shadow between 8px and 18px at 0.8s

### Notes
- EMA math: 4–5 consecutive correct answers crosses 0.5 threshold and hints disappear; a few wrong answers brings them back — adaptive behaviour confirmed

---

## 2026-06-18 — fix: new input mode coverage expanded to ALL English/Math levels

### src/components/WorldBattle.jsx
- `genEngMoveQ()` — removed type-specific gates (`type==='phonics'`/`type==='cvc'`) from sequence/fillgap/visualdiscrim/memory checks; all 4 variety modes now apply across every English level (15%/10%/10%/8% respectively)
- `genEngMoveQ()` — `sight` branch gains `inputMode:'wordbuild'|'choice'` (35/65 split); `chars: item.blank.split('')` added for wordbuild path
- `genMathQ()` — `isCount` branch gains `inputMode:'numpad'|'choice'` (40/60 split); `isPattern` intentionally left choice-only (emoji/symbol answer, not a number)
- Verified: `value === q.answer` in MoveSelectBattleMode.jsx works for `isCount` numpad since `answer:n` is always a number; `WordBuildInput` `isLatinChars` check routes sight word chars to pixel font correctly — no further changes needed

---

## 2026-06-18 — feat: Collection team tab redesigned as full-screen swipeable carousel

### src/components/Collection.jsx
- `PartyGrid` rewritten: multi-column grid replaced with horizontal `scroll-snap` carousel (one creature per screen)
- Dot indicator in header — active dot widens to 18px pill, inactive stays 6px circle; both animate on scroll
- Carousel uses `onScroll` + `Math.round(scrollLeft / clientWidth)` to track current page index
- Each card: 140×140 creature canvas (up from 90×90), gold "★ ตัวหลัก" badge on slot 0, HP bar (maxWidth 240), "ตั้งเป็นตัวหลัก" button for non-active slots, CreatureJourney section
- `SubjectLevelProgress` removed from per-card layout (it showed global stats, not per-creature)
- "← เลื่อนดูตัวอื่น →" hint shown when party has >1 creature
- `useRef` added to React imports

### src/styles.css
- Added `.carousel-scroll-hide-bar` — hides scrollbar cross-browser (webkit + Firefox/IE)

### Notes
- `drawCreature()` confirmed scale-agnostic: uses `Math.floor(Math.min(W,H) / 12)` so 140×140 renders correctly without code changes

---

## 2026-06-18 — fix: missing scroll/mirror/clover pixel art + hint item mode-awareness

### src/lib/itemArt.js
- Added `scroll` drawer — parchment roll with dark caps, red ribbon binding, text lines
- Added `mirror` drawer — oval frame with handle, teal glass surface and shine
- Added `clover` drawer — 4 leaf lobes with highlights, center connector, stem, notch outlines
- All 9 game item keys now resolve: food/ribbon/shoes/rainbow_star (home) + scroll/thunder/gem/mirror/clover (battle)

### src/hooks/useBattleCombat.js
- `hint` effect (mirror item) is now mode-aware: numpad → digit-count hint in battle log; wordbuild/sequence → first-char hint in battle log; memory → friendly "ใบ้ไม่ได้" message; choice mode → original eliminate-2-wrong-choices behavior; fallback for unknown mode

---

## 2026-06-18 — feat: spoken + visual instructions for sequence/fillgap/visualdiscrim/memory modes

### src/components/WorldBattle.jsx
- `genSequenceQ` — added `instructionTh:'แตะตัวอักษรให้เรียงตามลำดับ'`, `instructionEn:'Tap the letters in the correct order'`
- `genFillGapQ` — added `instructionTh:'แตะตัวอักษรที่หายไป'`, `instructionEn:'Tap the missing letter'`
- `genVisualDiscriminationQ` — added `instructionTh:'แตะตัวที่เหมือนกัน'`, `instructionEn:'Tap the matching letter'`
- `genMemoryCardQ` — added `instructionTh:'แตะเปิดไพ่ให้เจอคู่ที่เหมือนกัน'`, `instructionEn:'Flip cards to find matching pairs'`
- `onSpeak()` — falls back to speaking instruction phrase when `ttsWord` is null; speaker button now always does something

### src/games/MoveSelectBattleMode.jsx
- TTS `useEffect` — falls back to `speakTh(q.instructionTh)` / `speakEn(q.instructionEn)` when no `ttsWord` or math text
- `handleDismissTeach` — same fallback so instruction plays after teach overlay closes
- Zone 2 `isFillGap` — added gold `fontSize:16` Thai instruction label above the gap display
- Zone 2 `isVisualDiscrim` — added gold `fontSize:16` Thai instruction label above target char; removed old dim 11px caption
- Zone 2 `isSequence` — new early-return path with gold `fontSize:16` Thai instruction label above 🔤 (no longer falls through to generic TTS-button path)

### src/components/battle/MemoryCardInput.jsx
- Added gold `fontSize:15` Thai instruction label "แตะเปิดไพ่ให้เจอคู่ที่เหมือนกัน" above the existing small pair-count label

---

## 2026-06-18 — feat: memory card matching mini-game for Thai/English vocabulary

### New file
- `src/components/battle/MemoryCardInput.jsx` — 6-card 3-pair flip-and-match grid; tap to flip, tap mismatch returns after 700ms, tap match stays face-up in green; `onPairFound()` fires per match; `onAllPairsFound()` fires 500ms after last pair; no penalty for mismatches

### src/components/WorldBattle.jsx
- Added `genMemoryCardQ(alphaList)` — picks 3 random items, creates 6 cards (emoji+char pairs), shuffles the card array
- Thai L1–2: 8% chance for memory card round (after fill-gap and visual-discrim checks)
- English phonics: 8% chance for memory card round

### src/games/MoveSelectBattleMode.jsx
- Added `import MemoryCardInput from '../components/battle/MemoryCardInput.jsx'`
- Added `memoryMatchedRef = useRef(0)`, reset inside per-question `useEffect`
- Added `handleMemoryPairFound()`: increments counter, calls `fireHit(-1)` only on the **last** pair (which triggers normal onNext/showVictory flow); earlier pairs call `playTone('correct') + spawnEffect('attack')` for feedback without advancing the question
- Move panel: `memory` inputMode uses flex centering container; renders `MemoryCardInput` with `onPairFound={handleMemoryPairFound}` and no-op `onAllPairsFound` (last pair's `fireHit` handles progression)
- `disabled` for memory mode does NOT lock on `lockedRef.current` — individual card interactions are never locked by the outer question lock

---

## 2026-06-18 — feat: fill-the-gap and visual-discrimination question types for Thai/English

### src/components/WorldBattle.jsx
- Added `genFillGapQ(alphaList)` — picks 3 consecutive letters, hides middle, presents `[before] [?] [after]`; wrong choices drawn from letters NOT adjacent to the run
- Added `TH_CONFUSABLE_GROUPS` and `EN_CONFUSABLE_GROUPS` — visually similar letter clusters Chopin's age commonly confuses (e.g. ก/ถ/ภ, b/d, p/q)
- Added `genVisualDiscriminationQ(alphaList, isThai)` — picks one letter from a confusable group as target; wrong choices are other group members padded with unrelated letters
- `genThaiMoveQ()` levels 1–2: 10% fill-gap + 10% visual-discrim chance (after existing 15% sequence check)
- `genEngMoveQ()` phonics level: same 10%+10% chances

### src/games/MoveSelectBattleMode.jsx
- Zone 2 (question display) now has early-return paths for `isFillGap` and `isVisualDiscrim` before the existing `display` logic
- `isFillGap`: renders `[before] [?gold-dashed-box] [after]` in 32px pixel font, no TTS button
- `isVisualDiscrim`: renders target char at 48px pixel font with gold glow + "แตะตัวที่เหมือนกัน" subtitle, no TTS button
- Both types use `inputMode:'choice'` so MoveCard 4-choice grid renders automatically with no other changes

---

## 2026-06-18 — feat: word-building input mode for English CVC words

### src/components/WorldBattle.jsx
- `genEngMoveQ()` cvc branch: added `inputMode:'wordbuild'|'choice'` at 50/50 random and `chars: correct.word.split('')` (e.g. 'cat' → ['c','a','t']) on returned question object

### src/components/battle/WordBuildInput.jsx
- Added named exports `DEFAULT_THAI_DISTRACTORS` and `DEFAULT_ENG_DISTRACTORS` (common Latin vowels + consonants)
- Added `distractorPool` prop — overrides built-in pool; falls back to `DEFAULT_THAI_DISTRACTORS` when undefined (preserves Thai behavior)
- Added `isLatinChars` detection (charCode < 0x0E00 = Thai Unicode block start)
- `tileStyle` now uses `var(--font-pixel)` + `textTransform:'lowercase'` for Latin chars; `var(--font-thai)` for Thai

### src/games/MoveSelectBattleMode.jsx
- Updated import: `import WordBuildInput, { DEFAULT_ENG_DISTRACTORS } from '../components/battle/WordBuildInput.jsx'`
- WordBuildInput call now passes `distractorPool={subject === 'eng' ? DEFAULT_ENG_DISTRACTORS : undefined}` — Thai words fall back to default pool, English CVC gets Latin distractors

---

## 2026-06-18 — feat: sequencing input mode — reorder consecutive Thai/English alphabet letters

### New file
- `src/components/battle/SequenceInput.jsx` — tap-to-place letter ordering; shuffled tray of N tiles (no distractors — all tiles are correct letters); fills slots in order; tap slot to return tile; auto-submits `onSubmit(true|false)` on last tile; shows "เรียงตามลำดับ" instruction label; resets on `resetKey`

### src/components/WorldBattle.jsx
- Added `genSequenceQ(alphaList)` — picks a random run of 3–4 consecutive letters from TH_ALPHA or EN_ALPHA; returns `{ isSequence, inputMode:'sequence', sequenceChars, ttsWord:null }`
- `genThaiMoveQ()`: 15% chance for levels 1–4 to return a sequence question (level 5 sentences unchanged)
- `genEngMoveQ()`: 15% chance for phonics/cvc levels to return a sequence question (sight/sentences unchanged)

### src/games/MoveSelectBattleMode.jsx
- Added `import SequenceInput from '../components/battle/SequenceInput.jsx'`
- Zone 2 display: added `q.isSequence` branch showing `🔤` so the question zone doesn't appear blank
- Move panel container style now centers for `numpad`, `wordbuild`, and `sequence` inputModes
- Move panel branches: `numpad` → NumpadInput | `wordbuild` → WordBuildInput | `sequence` → SequenceInput | default → 2×2 MoveCard grid
- SequenceInput `onSubmit(isCorrect)` mirrors exact timing/animation as all other input modes (220ms charge → 280ms lunge → fireHit/fireMiss)

---

## 2026-06-18 — feat: word-building (tap-to-spell) input mode for Thai battles

### New file
- `src/components/battle/WordBuildInput.jsx` — tap-to-place spelling; character tiles from shuffled tray fill ordered answer slots; tap filled slot returns tile; auto-submits `onSubmit(true|false)` when all slots filled; adds 1–2 distractor tiles from DISTRACTOR_POOL; resets on `resetKey` prop change

### src/components/WorldBattle.jsx
- `genThaiMoveQ()` levels 2, 3, 4: added `inputMode: 'wordbuild'|'choice'` at 50/50 random and `chars: correct.chars` on returned question object
- Level 1 (emoji/audio match) and level 5 (sentences) unchanged — choice only

### src/games/MoveSelectBattleMode.jsx
- Added `import WordBuildInput from '../components/battle/WordBuildInput.jsx'`
- Move panel div style now centers for both `'numpad'` and `'wordbuild'` inputModes
- Move panel branches: `numpad` → NumpadInput | `wordbuild` → WordBuildInput | default → 2×2 MoveCard grid
- WordBuildInput `onSubmit(isCorrect)` mirrors exact timing/animation of handleTap (220ms charge → 280ms lunge → fireHit/fireMiss)

---

## 2026-06-18 — feat: numpad input mode for math battles

### New file
- `src/components/battle/NumpadInput.jsx` — digit-by-digit numeric entry; 3×4 button grid (1-9, ⌫, 0, ✓); gold display field shows typed digits; confirm disabled until ≥1 digit; caps at 2 digits; uses `playTone('tap'/'click')`; resets on `resetKey` prop change

### src/components/WorldBattle.jsx
- `genMathQ()` arithmetic branch: added `const inputMode = Math.random() < 0.5 ? 'numpad' : 'choice'` and `inputMode` field on returned question object
- `isCount`, `isPattern`, `isWord` branches unchanged — no inputMode field, defaults to choice in component

### src/games/MoveSelectBattleMode.jsx
- Added `import NumpadInput from '../components/battle/NumpadInput.jsx'`
- Move panel (Zone 3) now branches on `q?.inputMode === 'numpad'`: renders `<NumpadInput>` centered in the 168px panel, or the existing 2×2 `<MoveCard>` grid
- NumpadInput `onSubmit(value)` mirrors `handleTap` timing (220ms charge → 280ms lunge → resolve) and compares `value === q.answer` directly
- TEACH_INTRO unchanged — `isFirstLevel={false}` always from WorldBattle, so teach screen never shows during numpad questions

---

## 2026-06-18 — refactor(battle-round3): extract fireHit/fireMiss/showVictory/useBattleItem into useBattleCombat hook

### New file
- `src/hooks/useBattleCombat.js` — owns fireHit, fireMiss, showVictory, useBattleItemFn (returned as `useBattleItem`). Receives all state setters, refs, and props as explicit params so behavior is byte-for-byte identical to original. Imports: StateContext, audio (playTone/playSFX/playElementSFX), Toasts (spawnConfetti), elementConfig (getElementTier), elementAnimations (playElementAttack), itemConfig (BATTLE_ITEMS, rollBattleItem).

### src/games/MoveSelectBattleMode.jsx
- Removed `playElementSFX` from audio import (now in hook)
- Removed `spawnConfetti` import from Toasts (now in hook)
- Removed `getElementTier` from elementConfig import (now in hook)
- Removed `playElementAttack` import from elementAnimations (now in hook)
- Removed `rollBattleItem` from itemConfig import (now in hook)
- Added `import { useBattleCombat } from '../hooks/useBattleCombat.js'`
- Removed `useBattleItem` function body (~60 lines, lines 223–282)
- Removed `fireHit` function body (~113 lines, lines 304–416)
- Removed `fireMiss` function body (~102 lines, lines 417–518)
- Removed `showVictory` function body (~32 lines, lines 519–550)
- Added `useBattleCombat({...})` hook call before `handleTap`
- MoveSelectBattleMode.jsx now **711 lines** (was 1018); build: 0 errors
- **MoveSelectBattleMode refactor complete** — all 3 rounds done: 1190 → 711 lines (−40%)

---

## 2026-06-18 — refactor(battle-round2): extract particle/effect canvas system into useBattleEffects hook

### New file
- `src/hooks/useBattleEffects.js` — owns effectCanvasRef, overlayCanvasRef, effectsRef, effectRafRef, rafTimeRef, ResizeObserver canvas-sync effect, RAF tick loop, and spawnEffect(). Returns `{effectCanvasRef, overlayCanvasRef, spawnEffect}`.

### src/games/MoveSelectBattleMode.jsx
- Removed `import { mkBeam, mkOrb, mkLightning, mkSparks, tickEffects }` (now in hook)
- Added `import { useBattleEffects } from '../hooks/useBattleEffects.js'`
- Removed 5 useRef declarations (effectCanvasRef, overlayCanvasRef, effectsRef, effectRafRef, rafTimeRef)
- Removed `cancelAnimationFrame(effectRafRef.current)` from unmount cleanup (hook owns its own cleanup)
- Removed ResizeObserver useEffect (~18 lines)
- Removed RAF loop useEffect (~19 lines)
- Removed `spawnEffect` function (~31 lines)
- Added `useBattleEffects({battleFieldRef, eggDivRef, enemyDivRef, subject})` hook call
- MoveSelectBattleMode.jsx now **1018 lines** (was ~1190); build: 0 errors

---

## 2026-06-18 — refactor(battle-round1): extract GBHPBar, EnemyCanvas, MoveCard, HintBar presentational components

### New files
- `src/components/battle/GBHPBar.jsx` — GB-style HP bar with player/enemy color logic
- `src/components/battle/EnemyCanvas.jsx` — enemy canvas sprite with hurt/defeat animations; owns drawEnemy import
- `src/components/battle/MoveCard.jsx` — answer move button with emoji/text size logic
- `src/components/battle/HintBar.jsx` — dot-group hint for math arithmetic; exports `numTh`, `mathToThai` helpers

### src/games/MoveSelectBattleMode.jsx
- Removed inline GBHPBar, EnemyCanvas, MoveCard, HintBar function definitions (~120 lines)
- Removed THAI_NUMS, numTh, mathToThai (moved to HintBar.jsx)
- Removed `import { drawEnemy, drawEnemyHurt }` (now owned by EnemyCanvas.jsx)
- Added 4 imports from `../components/battle/`; re-imported `{ numTh, mathToThai }` from HintBar.jsx
- MoveSelectBattleMode.jsx now **1092 lines** (was ~1190); build: 0 errors

---

## 2026-06-18 — refactor(home-round3): extract item/tap/swipe handlers into useHomeInteractions hook

### New file
- `src/hooks/useHomeInteractions.js` — spawnParticles, handlePetEgg, handleTapItem, handleEggTap, handleCreatureTap, handleCreatureSwipe; owns its own particleIdRef/swipeCountRef; comboToState moved here from module scope

### src/components/Home.jsx
- Removed `comboToState` constant (moved to hook)
- Removed `particleIdRef`, `swipeCountRef` useRef declarations (owned by hook)
- Removed `spawnParticles`, `handlePetEgg`, `handleTapItem`, `handleEggTap`, `handleCreatureTap`, `handleCreatureSwipe` functions (~127 lines)
- Added `useHomeInteractions` import
- Added `useHomeInteractions({...})` hook call before `useHomeAmbience` (so spawnParticles is available to pass in)
- Hook call order: useCreatureInteraction → useHomeInteractions → useHomeAmbience
- Home.jsx now **632 lines** (was 952; Phase 3 refactor complete: −34%)
- Build: 0 errors

---

## 2026-06-18 — refactor(home-round2): extract interaction state machine into useCreatureInteraction hook

### New file
- `src/hooks/useCreatureInteraction.js` — creature interaction FSM: `enterState`, `extendState`, `setGlow`, `smRef`, watchdog, unmount cleanup. STATE_CSS/STATE_DUR moved here. Returns `{eggAnim, setEggAnim, idleAnim, setIdleAnim, eggGlow, setGlow, smRef, comboResetRef, enterState, extendState}`.

### src/components/Home.jsx
- Removed `STATE_CSS`, `STATE_DUR` constants (moved to hook)
- Removed `eggAnim`, `idleAnim`, `eggGlow` useState declarations (now from hook)
- Removed `animTimerRef`, `glowTimerRef`, `stageRef`, `smRef`, `enterRafRef`, `enterGenRef`, `comboResetRef` useRef declarations (owned by hook)
- Removed stageRef sync useEffect (moved to hook)
- Removed unmount cleanup useEffect (moved to hook)
- Removed watchdog useEffect (moved to hook)
- Removed `enterState` function (moved to hook)
- Removed `extendState` function (moved to hook)
- Removed `setGlow` function (moved to hook)
- Added `useCreatureInteraction` import
- Added `useCreatureInteraction(stage)` hook call (before `spawnParticles`, before `useHomeAmbience`)
- Home.jsx now **766 lines** (was 848 after round1)
- Build: 0 errors

---

## 2026-06-18 — refactor(home-round1): extract ambient/idle effects into useHomeAmbience hook

### New file
- `src/hooks/useHomeAmbience.js` — idle micro-animations, butterfly/leaf/star ambient events, stage-up celebration, hatch-ready heartbeat, reunion burst on mount, post-session growth banner. Returns `{ambientEvent, stageUp, growthBanner}`.

### src/components/Home.jsx
- Removed `IDLE_DUR` constant (moved to hook)
- Removed `ambientEvent`, `stageUp`, `growthBanner` useState declarations (now from hook)
- Removed `idleTimerRef`, `eggAnimRef`, `prevStageRef` useRef declarations (only used in moved effects)
- Kept `stageRef` + its sync effect (still used by enterState/extendState/watchdog)
- Removed eggAnimRef sync effect (moved to hook)
- Removed 6 useEffect blocks — 100 lines total: stage-up, heartbeat, reunion-on-mount, growth banner, idle animations, ambient events
- Added `useHomeAmbience({...})` call after setGlow, before interaction handlers
- Home.jsx now **848 lines** (was 952 before refactor)
- Build: 0 errors

---

## 2026-06-17 — refactor(phase2-round4): extract RAF game loop into useWorldGameLoop hook

### New file
- `src/hooks/useWorldGameLoop.js` — RAF render/update loop: enemy AI (9 types), respawn timers, collision-triggered battle, chest/enemy/player rendering, camera. TILE+DIRS4 at module level; local rafIdRef inside effect; dep array [].

### src/components/WorldScreen.jsx
- Removed 326-line RAF useEffect (lines 423–748)
- Added `useWorldGameLoop({ canvasRef, gameRef, tileMapRef, enemiesRef, chestsRef, stateRef, battlePendingRef, battleDispatchedRef, triggerBattleRef, eggColorRef, HUD_CONTENT_H })` call at same location
- Removed from tileEngine import: `renderMap`, `renderPlayer`, `getCamera`, `MAP_ROWS`, `MAP_COLS`, `EXIT_OPPOSITE` (none needed in WorldScreen after extraction)
- Removed `import { drawEnemy }` (only used inside RAF loop)
- Removed `rafRef = useRef(null)` declaration (replaced by local rafIdRef in hook)
- Added `import { useWorldGameLoop } from '../hooks/useWorldGameLoop.js'`
- WorldScreen.jsx now **873 lines** (was 1700 at start of Phase 2 refactor — 49% reduction)
- Build: 0 errors

---

## 2026-06-17 — refactor(phase2-round3): extract battle-trigger logic into useBattleTrigger hook

### New file
- `src/hooks/useBattleTrigger.js` — custom hook owning triggerBattle, enterBossBattle, triggerBattleRef, battleDispatchedRef, battlePendingRef. Imports useAppState/ACTIONS, getBattleSubject, ENEMY_DATA, WORLD_LEVELS, playSFX internally.

### src/components/WorldScreen.jsx
- Removed duplicate useLayoutEffect that synced battlePendingRef/battleDispatchedRef (was exact duplicate of canonical one now in hook)
- Removed `getBattleLevel` import from battleSubject.js (moved to hook; not used elsewhere)
- Removed `ENEMY_DATA` import from enemyConfig.js (moved to hook)
- Added `import useBattleTrigger from '../hooks/useBattleTrigger.js'`
- Removed 3 ref declarations (triggerBattleRef, battleDispatchedRef, battlePendingRef)
- Added hook call after state declarations; destructures all 5 values
- Removed 58-line block: triggerBattle callback + triggerBattleRef assignment + useLayoutEffect + enterBossBattle callback
- WorldScreen.jsx now 1194 lines (was 1257 after Round 2)
- Build: 0 errors

---

## 2026-06-17 — refactor(phase2-round2): extract pure drawing helpers into worldDrawHelpers.js

### New file
- `src/lib/worldDrawHelpers.js` — exports: `drawChest`, `drawPlayerGlow`, `spawnChests`, `findSpecials`, `getOwlLines`, `SIGN_LINES`, `STAGE_COLORS`
  - Imports `T`, `MAP_ROWS`, `MAP_COLS` from `tileEngine.js`; local `TILE = 16`

### src/components/WorldScreen.jsx
- Removed 94 lines (drawing helpers + STAGE_COLORS + SIGN_LINES)
- Added import from `../lib/worldDrawHelpers.js`; `const TILE = 16` and `SKY_TINTS` kept in WorldScreen
- WorldScreen.jsx now 1257 lines (was 1346 after Round 1)
- Build: 0 errors

---

## 2026-06-17 — refactor(phase2-round1): extract WorldHUD and MissionPanel into separate components

### New files
- `src/components/world/WorldHUD.jsx` — HUD bar (mini-map, creature HP, XP bar, battle items, item bag button, home button). Exports: `default WorldHUD`, `HUD_CONTENT_H`, `HOME_ITEM_KEYS`, `BATTLE_ITEM_KEYS`
- `src/components/world/MissionPanel.jsx` — Map info panel above the world map (name, objective, enemy types, daily progress bar)

### src/components/WorldScreen.jsx
- Removed 387 lines (WorldHUD + MissionPanel functions + their local consts)
- Imports WorldHUD/MissionPanel from `./world/`; `HUD_CONTENT_H`, `HOME_ITEM_KEYS`, `BATTLE_ITEM_KEYS` imported as named exports
- Removed `getCreatureSeed` import (only used inside WorldHUD)
- Removed `MAP_THEMES` import (only used inside WorldHUD)
- Build: 137 modules transform, 0 errors

---

## 2026-06-17 — cleanup: remove completed migrations, simplify merge logic, audit hardcoded names

### src/context/StateContext.jsx
- Removed 5 one-time migrations: items→homeItems/battleItems split; star→rainbow_star/potion→shoes rename; subjectLevels calibration; additive items; evo recheck (all flags confirmed true in live state)
- Simplified creature merge check to `(length ?? 0) > 1` at both local and remote sites (removed `_creaturesMerged && !_statAveraged` flag complexity)

### src/lib/state.js
- `_mergeAllCreaturesIntoOne()`: removed `_creaturesMerged` and `_statAveraged` flag tracking from both return objects
- Re-averaging guard simplified: `count <= 1 || state._statAveraged` → `count <= 1`

### src/components/WorldScreen.jsx
- `OWL_LINES` → `getOwlLines(name)` function so NPC greets player by their actual name
- Boss cutscene: `โชแปงพิชิต` → `{state.name}พิชิต` (uses state.name for any player)

### src/lib/battleSubject.js
- Removed debug `console.log('getBattleLevel', ...)` (was printing on every battle)

### src/components/WorldBattle.jsx
- Removed "Debug log — verify level rotation" useEffect (was printing on every battle start)

---

## 2026-06-17 — feat: rainbow_star boost grants phase-through immunity from chaser enemies

### src/components/WorldScreen.jsx
- `tryMove`: `saiyanActive` check before chaser collision — snake/baby_zombie/woken sleepy_bunny are ignored when rainbow_star active; walking directly onto a stationary enemy still triggers battle
- RAF loop enemy-initiated: `saiyanActiveNow` check added to `if (!pendingBattle && isChaser ...)` — chasers can't force battle by landing on player tile during saiyan
- `HOME_ITEM_EFFECTS`: `rainbow_star: 'หลบศัตรูตาม!'`; `shoes: 'วิ่ง×4'`

### src/components/Collection.jsx + src/components/Home.jsx
- `rainbow_star` effect → `'ล่องหนจากมอนสเตอร์ตาม'`; `shoes` effect → `'วิ่ง×4'`; Home bondReaction → `'👟 วิ่ง×4 (5 นาที)'`

---

## 2026-06-17 — fix: shoes boost uses faster lerp animation instead of tile-skipping playerSpeed=2

### src/components/WorldScreen.jsx
- `tryMove`: removed `playerSpeed = shoesActive ? 2 : 1` and `dCol * playerSpeed`; always moves exactly 1 tile
- Sets `window.__kq_moveSpeedMult = 2.0` when shoes active (1.0 otherwise)
- RAF lerp: `/ 120` → `/ (120 / speedMult)` — shoes = 60ms per tile, normal = 120ms
- `g.moving` gate naturally clears 2× faster so next input is accepted sooner; no separate cooldown needed
- Every tile is now visited during shoes boost — chests, enemies, and NPCs all trigger correctly

---

## 2026-06-17 — feat: subject level progress with streak dots + evo stage visual preview in Collection

### src/components/Collection.jsx
- `SubjectLevelProgress` component: LEVEL UP section per creature card; shows Thai/Math/Eng icon badge, Lv + grade label, 3 streak dots (glowing when filled), mastery bar for current level, "LEVEL UP! ⬆️" when streak≥3
- `CreatureJourney` STAGE row replaced with 3 mini `drawCreature` canvases (Baby 29px / Teen 38px / Final 48px); future = grayscale + dim; current = gold glow + NOW label; past = ✓
- `PartyGrid` signature extended with `subjectLevels`, `subjectSessionStreak`, `levelMastery`; passed down from Collection state

---

## 2026-06-17 — fix: collection screen dark pixel art theme — creature cards, tabs, journey section

### src/components/Collection.jsx
- Header: `fontSize:11→10`, `color:#EF9F27`, `letterSpacing:3`, `borderBottom:rgba(255,255,255,0.08)`
- Tabs: inline style overrides — active `color:#EF9F27 + borderBottom:2px solid #EF9F27`, inactive `rgba(255,255,255,0.35)`, both `background:transparent`
- Card container: `background:#0f0f1a`, dark/gold border, `borderRadius:0`, gold `boxShadow` glow on active card
- Active badge: `#FFD700→#EF9F27`; creature name inline dark style; level `rgba(0.5→0.35)`; HP bar `rgba(0,0,0,0.5)` bg
- Set active button: filled `#B8860B` → transparent outlined `border:1px solid #EF9F27`, `color:#EF9F27`
- CreatureJourney: `width:'100%'` on container; label "JOURNEY AHEAD"; future step icon `rgba(255,255,255,0.2)`; needs text `rgba(255,100,100,0.5)` (was white)

---

## 2026-06-17 — feat: mission progress panel in empty space above map — shows objective, enemies, daily progress

### src/components/WorldScreen.jsx
- `MissionPanel` component added (above WorldScreen): `SCREEN_NAMES` + `SCREEN_ENEMIES` lookup tables for 6 screen IDs; shows map name + cleared badge, objective text, enemy list, daily progress bar (dailyBattleRounds/10)
- `<MissionPanel>` rendered below `<WorldHUD>`, `zIndex:25`, `pointerEvents:none`
- Camera offset: `HUD_CONTENT_H/2` → `(HUD_CONTENT_H + PANEL_H=72) / 2` — map now centers in space below panel

---

## 2026-06-17 — fix: RewardChest — static import for drawItem + collected animation before closing

### src/components/RewardChest.jsx
- Static `import { drawItem } from '../lib/itemArt.js'` replaces dynamic import inside ref callback (fixes black canvas)
- New `collected` phase: items animate to `translateY(-60px) scale(0.5)` + fade out over 0.6s staggered; "เข้ากระเป๋าแล้ว!" banner fades in; `onDone` auto-fires after 1200ms
- Tap in `reveal` → `collected` phase (was: tap in `reveal` → `onDone` immediately)
- Tap hint: `reveal`→"แตะเพื่อเก็บ!", `collected`→"" (hidden), else "แตะเพื่อเปิด!"

---

## 2026-06-17 — fix: item bag popup reads from homeItems/battleItems + pixel art redesign + show correct counts

### src/components/WorldScreen.jsx
- Split `items = state.homeItems` into `homeItems = state.homeItems` + `battleItems = state.battleItems`
- HUD battle items bar: `items[key]` → `battleItems[key]` (was reading home items, showing wrong counts)
- `homeItemCount`: `items[k]` → `homeItems[k]`
- Item bag popup: `state.items` → `state.homeItems`; `USE_ITEM` → `USE_HOME_ITEM`; closes bag after use
- Popup redesigned: dark pixel art style (`#0a0a12` bg, pixel font), HOME 4-col grid (40px drawItem canvas + ×count in gold), BATTLE 5-col grid (32px PixelItemIcon + ×count in green), CLOSE button

---

## 2026-06-17 — feat: rewrite TreasureSlot — pixel art chest open animation + item reveal with drawItem

### src/components/TreasureSlot.jsx (full rewrite)
- Removed slot machine reels entirely
- New flow: question gate → chest shakes (tap to open) → chest opens → items float up → รับของ! button
- Rolls home item (55% chance from food/ribbon/shoes/rainbow_star) + battle item via `rollBattleItem()`
- Items drawn via dynamic `import('../lib/itemArt.js').then(drawItem)` canvas; glow + label + type badge
- `onReward` now passes `{ rewards: [{type, key}, ...] }` array (was `{qty, type, battleItem}` object)

### src/components/WorldScreen.jsx
- `handleTreasureReward`: updated to handle `reward.rewards[]` array format; dispatches `DROP_HOME_ITEM` / `DROP_BATTLE_ITEM` per item (was `DROP_ITEM` with qty loop)

---

## 2026-06-17 — feat: post-battle reward chest with open animation — battle + home item drops

### src/components/RewardChest.jsx (new file)
- Phases: closed → shaking (400ms delay) → opening (600ms animation) → reveal
- Tap at any phase to accelerate to open; tap at reveal to continue
- Pixel art items drawn via dynamic `import('../lib/itemArt.js').then(drawItem)` on canvas refs
- Item glow labels using ITEM_COLORS; type tag (ไอเทมสู้/ไอเทมบ้าน) shown below each item
- Empty rewards handled gracefully ("ไม่มีของรางวัลครั้งนี้...")

### src/components/WorldBattle.jsx
- Imports `rollBattleItem` from `itemConfig.js` and `RewardChest`
- Module-level `HOME_DROP_TABLE` (food 50 / ribbon 25 / shoes 15 / rainbow_star 10) + `rollHomeItem()` (40% chance)
- `onComplete()`: rolls both drops, dispatches `DROP_BATTLE_ITEM` / `DROP_HOME_ITEM`, calls `setPendingRewards(rewards)` instead of navigating immediately
- Chest overlay rendered in JSX; `onDone` dispatches `CLEAR_PENDING_REWARDS` + `RETURN_FROM_WORLD_BATTLE` then navigates

### src/context/StateContext.jsx
- `ACTIONS.SET_PENDING_REWARDS` + `ACTIONS.CLEAR_PENDING_REWARDS` added
- Reducer cases: `SET_PENDING_REWARDS` sets `state.pendingRewards`; `CLEAR_PENDING_REWARDS` resets to `[]`

### src/lib/state.js
- `pendingRewards: []` added to `defaultState()`

### src/styles.css
- `@keyframes chest-shake` — horizontal wiggle with rotation
- `@keyframes sparkle-rise` — scale + float up + fade out
- `@keyframes fadeInUp` — slide up + fade in for revealed items

---

## 2026-06-17 — fix: gentle monster scaling + stricter adaptive difficulty (streak resets properly)

### src/context/StateContext.jsx
- `scaleMonsterStats()`: replaced step function (1.0/1.3/1.8/2.4/3.2x) with linear `1.0 + (level-1)*0.02`, hard-capped at 2.0x; DEF now scales at `mult*0.5` (slower than HP/ATK)

### src/components/WorldScreen.jsx
- `triggerBattle` scaleFactor: `0.4/level` → `0.15/level` (capped at 4x); level 16 was 7x, now 3.25x
- Enemy HP/ATK floors: `Math.max(30, ...)` and `Math.max(4, ...)` prevent trivially-weak enemies at Lv1
- DEF scales at `cappedScale * 0.5`

### src/components/WorldBattle.jsx
- `isStrong` minimum questions: 6 → 8
- Streak always resets to 0 on any non-strong session (was only reset on level-up or level-down, causing slow drift upward)
- Level-down minimum questions: 6 → 8 (consistent with `isStrong`)

---

## 2026-06-16 — fix: cap creature currentHP at stats.HP max in all heal/boost actions

### src/context/StateContext.jsx
- `CREATURE_HEAL`: maxHP changed from `(e.stats?.HP ?? 10) + (battleLevel - 1)` to `e.stats?.HP ?? 100` — the battleLevel bonus was the root cause of Chopin's 519 > 504 bug
- `USE_HOME_ITEM` food: now also heals active creature +30 HP (capped at `stats.HP`); was happiness-only before
- `CREATURE_STAT_BOOST`: after updating stats, `currentHP` is clamped to `newStats.HP ?? 100` (defensive — prevents overflow if HP stat was the one boosted)
- Initializer: clamps all `currentHP` values to `stats.HP` on every app load (fixes corrupted states like Chopin's immediately on next open)

---

## 2026-06-16 — fix: calibrate subject levels + accurate score tracking + item migration + grade/evo system + remove debug code

### src/context/StateContext.jsx
- Added `calcEvoStageInline(battleLevel, grade, bond)` helper above reducer (avoids circular import)
- Initializer migration 1: `_subjectLevelCalibrated` — recalibrates `subjectLevels` from `levelMastery` (highest level with ≥60% mastery) on first load
- Initializer migration 2: `_itemsMigrated` — additive merge of `items{}` into `homeItems/battleItems` (handles states where both exist simultaneously)
- Initializer migration 3: `_evoRechecked` — rechecks `evoStage` for all creatures after `_migrateBattleStats` populates `battleLevel`
- `SET_SUBJECT_LEVEL` reducer: grade now computed from avg subject level (thresholds: avg≥2→grade1, avg≥3→grade2, avg≥4→grade3); grade only advances, never drops; creature `evoStage` updated inline when grade changes

### src/components/WorldBattle.jsx
- Added `accuracyRef = useRef({ correct: 0, total: 0 })` to track real answer counts
- `onCorrect()`: increments both `correct` and `total` in accuracyRef
- `onWrong()`: increments `total` only
- `onComplete()`: score replaced with `accuracy = correct/total`; `isStrong = accuracy≥0.80 AND total≥6`; level-up uses `isStrong`; level-down uses `accuracy<0.50 AND total≥6`; `LOG_SESSION` now includes `questionsAnswered` and accurate `wrong` count

### src/App.jsx
- Removed `debugSupabaseState()` function, its call, and emergency restore button JSX
- Removed `import { supabase }` (was added only for debug)

---

## 2026-06-16 — debug: Supabase state restore for emergency recovery

### src/App.jsx
- Added `debugSupabaseState()` — logs full Supabase eggs row + hatchedEggs count to console on every load (temporary)
- Added emergency restore button (🔄 กู้คืนข้อมูล) — fixed bottom-center, visible only when hatchedEggs is empty; fetches state_json from Supabase and writes to kq_state, then reloads

---

## 2026-06-16 — fix: restore login button + auto-restore from Supabase when local state is empty

### src/components/Home.jsx
- Added `onOpenLogin` and `onOpenProfile` to function props (were passed from App.jsx but silently ignored)
- Added `isLoggedIn` state via `supabase.auth.getSession()` + `onAuthStateChange` listener
- Imported `supabase` from lib
- Header: login button (เข้าสู่ระบบ) when not logged in; profile button (shows child name) when logged in

### src/context/StateContext.jsx
- SIGNED_IN handler: now always takes cloud data when cloud has hatchedEggs and local is empty, regardless of rounds count (prevents reset state from blocking restore)
- Added startup guard: if user is authenticated but local hatchedEggs is empty on mount, auto-fetches from Supabase and dispatches INIT

---

## 2026-06-16 — feat: connect creature/egg/tier/level systems — unified progression via PROGRESSION_MAP

### src/config/battleConfig.js
- Added PROGRESSION_MAP: 5 tiers (tier 0–4 / อนุบาล→ป.3+), each with minSubjectLevel, eggUnlock, mapTheme
- Added evoRequirements (teen: Lv11+Tier1, final: Lv26+Tier3+Bond60) — single source of truth for evo thresholds

### src/lib/creatureSystem.js
- calcEvoStage() now reads PROGRESSION_MAP.evoRequirements instead of hard-coded numbers
- Changed thresholds: teen was (lv≥11, tier≥2) → now (lv≥11, tier≥1); final was (lv≥26, tier≥5, bond≥60) → now (lv≥26, tier≥3, bond≥60)
- Added import for PROGRESSION_MAP from gameConfig.js

### src/context/StateContext.jsx
- Added PROGRESSION_MAP import from gameConfig.js
- ADD_XP case: removed XP-based readyToHatch computation (3 lines removed)
- SET_SUBJECT_LEVEL case: now detects tier advance when ALL subjects reach next tier's minSubjectLevel; auto-increments state.grade; sets readyToHatch when hatchedEggs < 6

### src/components/Home.jsx
- readyToHatch local var: removed stage >= EGG_STAGES-1 check (tier-advance is now the trigger); kept (hatchedEggs === 0) guard against ghost messages
- Removed unused EGG_STAGES import

### src/components/Collection.jsx
- Added PROGRESSION_MAP import
- Added CreatureJourney component: shows evolution roadmap (○/⚡/✅) with level/tier/bond requirements; BABY→TEEN→FINAL stage tracker
- PartyGrid: added currentTier prop; renders <CreatureJourney /> below each creature card

### src/components/Report.jsx
- Added PROGRESSION_MAP import
- Parent report section: appended tier progression line (current tier name + sessions until next tier unlock)

---

## 2026-06-16 — feat: adaptive difficulty — auto level up/down + level-up cutscene + map sky tint

### src/lib/state.js
- Added to defaultState(): `subjectSessionStreak`, `subjectLevelFloor`, `pendingLevelUp`

### src/context/StateContext.jsx
- Added ACTIONS: SET_SUBJECT_LEVEL, SET_PENDING_LEVEL_UP, CLEAR_PENDING_LEVEL_UP, SET_SUBJECT_SESSION_STREAK
- Added reducer cases for all 4 new actions; SET_SUBJECT_LEVEL also updates subjectLevelFloor

### src/components/WorldBattle.jsx
- onComplete(): after each non-boss battle, check score and subject streak
  - score ≥ 0.80 → increment streak; after 3 consecutive → dispatch SET_SUBJECT_LEVEL + SET_PENDING_LEVEL_UP + reset streak
  - score < 0.50 → silent level down (clamped to floor), reset streak
  - 0.50–0.79 → reset streak only (hold current level)

### src/components/WorldScreen.jsx
- triggerBattle + enterBossBattle: replaced `getBattleLevel()` with `state.subjectLevels?.[subject] ?? 1`
- Added SKY_TINTS constant (4 time-of-day colors for levels 1/2/3/4+)
- Added sky tint overlay div in JSX (reads active subject via getBattleSubject + subjectLevels, transitions with CSS)

### src/components/LevelUpCutscene.jsx (new)
- 4-phase cutscene: flash → reveal → celebrate → done
- Canvas star rain animation (35 stars, 4-point rotating shapes, 6 colors)
- Displays subject label, LEVEL UP!, Lv.old→Lv.new, new level name (Thai)
- "แตะเพื่อดำเนินการต่อ" blink prompt when done; tap triggers onDone

### src/App.jsx
- Imported LevelUpCutscene; global overlay renders when `state.pendingLevelUp` is set
- onDone: dispatches CLEAR_PENDING_LEVEL_UP + navigates to world

### src/styles.css
- Added keyframes: `blink`, `levelup-pulse`, `scale-pop`, `arrow-slide`

---

## 2026-06-16 — feat: report subject level/grade section

### src/components/Report.jsx
- Added SUBJECT_LEVEL_MAP (Thai 5 levels, Math 9 levels, Eng 4 levels) with Thai grade labels
- Added SubjectLevelCard: collapsible row showing current level name + grade badge; expands to full table with ✓/►/· status per level
- New LEVEL · GRADE section inserted as Section 3 (response speed/parent report shifted to 4/5/6)

---

## 2026-06-16 — feat: new home items — shoes + rainbow star + saiyan aura

### src/config/itemConfig.js
- Added HOME_ITEMS export: food (instant heal), ribbon (SPD boost 5min), shoes (map speed ×2, 5min), rainbow_star (saiyan aura, 5min); all timed boosts with 5min cooldown

### src/lib/itemArt.js
- Added pixel art drawers: shoes (orange sneaker with laces/tongue/stripe), rainbow_star (multicolor 8-arm star with sparkle dots)

### src/lib/state.js
- defaultState homeItems: {food, ribbon, shoes, rainbow_star}; added activeBoosts: {}

### src/context/StateContext.jsx
- USE_HOME_ITEM: ribbon/shoes/rainbow_star store boost in state.activeBoosts (persisted)
- Migration on load: star→rainbow_star, potion→shoes; ensure activeBoosts: {} exists

### src/components/Home.jsx
- ITEM_DEFS: food/ribbon/shoes/rainbow_star
- Local activeBoosts state removed; hasRibbon + saiyanActive derived from state.activeBoosts
- handleTapItem: ribbon/shoes/rainbow_star handlers; rainbow_star triggers excited state + saiyan reaction
- Creature canvas wrapped with saiyan-pulse drop-shadow when rainbow_star active

### src/components/WorldScreen.jsx
- tryMove: shoes doubles tile step (stateRef.current.activeBoosts.shoes.endsAt check)
- Canvas loop: rainbow_star adds ctx.shadowBlur gold glow on player sprite
- HOME_ITEM_KEYS/LABELS/EFFECTS updated; `state.homeItems` replaces `state.items` in WorldHUD

### src/games/MoveSelectBattleMode.jsx
- saiyanActive check; eggFilter gets gold drop-shadow + brightness(1.3) when rainbow_star active

### src/components/Collection.jsx
- HOME_ITEM_DEFS: shoes/rainbow_star replace potion/star

### src/styles.css
- Added saiyan-pulse keyframe (gold/orange glow pulsing filter)

---

## 2026-06-16 — refactor: separate homeItems and battleItems — clean up item system

### src/lib/state.js
- Split `items{}` into `homeItems: { food, ribbon, potion, star }` + `battleItems: { scroll, thunder, gem, mirror, clover }`

### src/context/StateContext.jsx
- Added ACTIONS: USE_HOME_ITEM, USE_BATTLE_ITEM, DROP_HOME_ITEM, DROP_BATTLE_ITEM
- Replaced USE_ITEM/DROP_ITEM reducer cases; kept backward-compat aliases
- Fixed RECORD_BATTLE to use `battleItems` not `items`
- Added localStorage migration: `items{}` → `homeItems{}` + `battleItems{}` on load

### src/components/Home.jsx
- Item tray reads from `state.homeItems`, dispatches USE_HOME_ITEM
- ITEM_DEFS: 4 home items (food/ribbon/potion/star) with effect/desc text

### src/games/MoveSelectBattleMode.jsx
- All item reads from `state.battleItems`; dispatches USE_BATTLE_ITEM / DROP_BATTLE_ITEM

### src/components/Collection.jsx
- ItemBag rewritten: two sections (ไอเทมดูแลครีเอเจอร์ / ไอเทมในการสู้) with divider
- Removed non-existent items: shield, bone, coin

---

## 2026-06-16 — fix: flat 20% dodge cap + temporary item boosts with cooldown timer

### src/games/MoveSelectBattleMode.jsx
- Dodge = flat 20% (removed SPD scaling; SPD=210 was giving 100% dodge)

### src/components/Home.jsx
- `activeBoosts` state for ribbon (5 min / 30 min cooldown) + star (10 min / 60 min cooldown)
- Ribbon and star give temporary visual buff only — no permanent CREATURE_STAT_BOOST dispatch
- Ribbon expiry useEffect auto-clears `hasRibbon` visual
- Item tray: orange active overlay with countdown, dark cooldown overlay with timer, count badge only when ready

---

## 2026-06-16 — refactor: report screen — pixel art theme, parent report, 5 sections

### src/components/Report.jsx (full rewrite)
- Removed: MissionAnalytics (shopV1 dead), raw session history table, all light-theme CSS
- Header: "REPORT" in font-pixel yellow, dark background matching Home/Collection
- Section 1: 2×2 stat cards (mins/rounds/acc/streak), color-coded
- Section 2: Subject XP bars (Thai red / Math blue / Eng orange), readiness label below each
- Section 3: ResponseSpeed component restyled dark (unchanged logic, visible only when data exists)
- Section 4: Parent Report — natural Thai sentences from real data (dominant subject, accuracy insight, streak, speed trend, weak-subject nudge)
- Section 5: "ควรเล่นอะไรต่อ" — actionable suggestion with gold border box

---

## 2026-06-16 — fix: enemy ATK from correct source + cap dodge chance at 30%

### src/games/MoveSelectBattleMode.jsx
- `fireMiss()`: damage now reads `enemyData?.atk` (scaled world-battle prop) not `enemy.atk` (local useState with no combat stats)
- `fireMiss()`: dodge chance = `min(0.30, SPD/500)` — capped at 30%; old `SPD/200` gave 80% dodge at SPD=160

---

## 2026-06-16 — fix: unified HP scale between home and battle, localCreatureHP tracks damage in-battle

### src/components/WorldBattle.jsx
- Removed `WB_HP_SCALE` from `creatureStats.HP` — HP is now raw same-unit as Home screen
- `creatureCurrentHP = creature.currentHP ?? creatureStats.HP` (no scale conversion)
- `handleCreatureTakeDamage` dispatches raw damage (no `/ WB_HP_SCALE` division)
- Passes `onCreatureHeal={() => {}}` prop to MoveSelectBattleMode

### src/games/MoveSelectBattleMode.jsx
- Accepts `onCreatureHeal` prop
- `fireHit()` increments `localCreatureHP` +1 when `creature.bondMeter >= 75` so the HP bar reflects passive heals in-battle

---

## 2026-06-16 — fix: creature HP decreases in battle, HP numbers shown, name badge visible, shake on hit

### src/games/MoveSelectBattleMode.jsx
- Added `localCreatureHP` state (init from `creatureCurrentHP` prop); `fireMiss()` now decrements this local state instead of reading the stale prop snapshot — creature HP actually decreases each hit
- GBHPBar: added `current`/`max` props; both HP bars now show e.g. `17/20` to the right of the fill bar
- Name badges: added `color:#fff` + `rgba(0,0,0,0.6)` background inline on both enemy and player badges — text was invisible on dark bg
- `fireMiss()`: added `setEggAnimClass('shake')` → `translateX(-8px)` on creature canvas for visible hit feedback, clears after 400ms
- `_displayPlayerHP` now uses `localCreatureHP` so the bar reflects local state, not stale prop

### src/components/WorldBattle.jsx
- `creatureCurrentHP` now scales stored `creature.currentHP` by `WB_HP_SCALE` to match the scaled `creatureStats.HP` unit; defaults to `creatureStats.HP` when no HP stored yet

### src/styles.css
- `.px-name-badge`: added `color:#fff` to base rule

---

## 2026-06-16 — refactor: simplify collection to team+items tabs, pixel art style, remove duplicate nav button

### src/components/Collection.jsx
- Removed tabs: vault (คลังสะสม), hatched (ทั้งหมด), current (กำลังฟัก) — redundant with team tab
- Removed sub-components: VaultGrid, HatchedGrid, CurrentEgg
- Removed unused imports: EggCanvas, buildEggStats, eggProgress, EGG_STAGE_NAMES, STAGE_XP_NEEDED, buildLegacyPreviewDNA
- Now 2 tabs only: ทีม (PartyGrid, unchanged) + กระเป๋า (new ItemBag)
- ItemBag: 4×2 grid of 8 items via `drawItem` canvas; count badge; dimmed at opacity 0.4 when count=0
- Pixel art header: "COLLECTION" in font-pixel yellow; background changed to `var(--px-darkest, #0a0a12)`

### src/components/Home.jsx
- Removed คอลเลกชัน button from action row (Collection accessible via bottom nav tab)
- Remaining buttons: ลูบ! (flex:1) + ออกสำรวจ! (flex:2)

---

## 2026-06-16 — fix: remove duplicate walking creature, add HP bar, fix ribbon stat boost

### src/components/Home.jsx
- Removed duplicate creature companion system (state: creature/creatureTapped/creatureState; refs: creatureRef/creatureModeRef; patrol setInterval effect; personality setTimeout effect; companion div ~60 lines) — `HomeBackground.jsx` walking system is the canonical one
- Added HP bar below stat row in creature zone: color-coded green (>60%), yellow (>25%), red (≤25%), shows `currentHP/maxHP` in pixel font
- Ribbon item now dispatches `CREATURE_STAT_BOOST` (+10 SPD) to active party creature and shows `⚡ SPD+10` bond reaction overlay

### src/context/StateContext.jsx
- Added `CREATURE_STAT_BOOST: 'CREATURE_STAT_BOOST'` to ACTIONS enum
- Added reducer case: patches `stats[stat]` in-place on target egg by `creatureId`

---

## 2026-06-16 — fix: CreatureDetailPopup — pixel art creature canvas, battle stats, bond meter

### src/components/CreatureDetailPopup.jsx
- FULL REWRITE: removed `CreatureCanvas` + `drawEgg` imports; added `drawCreature + getCreatureSeed` from `creatureAlgorithm.js`
- Creature display: 120×120 `<canvas>` using pixel art renderer with element color glow (`drop-shadow` via `CREATURE_ELEMENT_COLORS`)
- Added: Level + evo stage row below name/badge section
- Added: ATK/DEF/SPD/HP 4-column grid (from `egg.stats`) replacing old streak/accuracy/minutes
- Added: bond meter bar (from `egg.bondMeter`) with gold fill
- Removed: 196px `<CreatureCanvas dna={...}>` + 48×58 egg mini canvas + abilities section
- Born stats: XP origin bars kept, section renamed "ต้นกำเนิด", egg canvas removed from this section
- Imports `CREATURE_ELEMENT_COLORS, CREATURE_ELEMENT_NAMES_TH, EVO_STAGE_LABELS_TH` from `creatureSystem.js`

---

## 2026-06-16 — fix: home background walking character uses active creature design

### src/components/HomeBackground.jsx
- Added `import { drawCreature } from '../lib/creatureAlgorithm.js'`
- Added `creatureSeed` + `creatureStats` props to component signature
- Added `offRef = useRef(null)` to cache 32×32 offscreen canvas across frames
- Added `useEffect([creatureSeed, creatureStats])` that calls `drawCreature(off, creatureSeed, creatureStats)` when seed changes
- Added walking creature animation in rAF loop: draws from `offRef.current` at ground level, `ctx.save/translate/scale(-1,1)` flip when walking left, bounces between 33–67% canvas width at 0.8 px/frame

### src/components/Home.jsx
- Updated `<HomeBackground>` to pass `creatureSeed` + `creatureStats` from `activeEgg`
- Replaced 46×46 `<CreatureCanvas>` creature companion with `<canvas ref={r => drawCreature(r, getCreatureSeed(activeEgg), activeEgg.eggStats ?? {})}>` using `creatureAlgorithm.js`
- Removed dead `lastCreatureDNA` useMemo block (was only consumed by the now-replaced CreatureCanvas companion)

---

## 2026-06-16 — fix: creature drawing on world map player sprite and Collection screen

### src/lib/tileEngine.js
- Added `import { drawCreature } from './creatureAlgorithm.js'`
- Added module-level `_playerOff` lazy-init offscreen canvas (reused every frame, no per-frame GC)
- Replaced old fillRect humanoid in `renderPlayer()` with `drawCreature` + `ctx.drawImage` blit at TILE×TILE size

### src/components/WorldScreen.jsx
- Added `import { getCreatureSeed } from '../lib/creatureAlgorithm.js'`
- Sets `window.__kq_activeCreatureSeed` and `window.__kq_activeCreatureStats` in render body from active creature

### src/components/Collection.jsx
- Removed `import CreatureCanvas` (no longer used for grid cards)
- Added `import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'`
- Replaced all 3 `<CreatureCanvas dna={...}>` usages (CreatureCard, PartyGrid, VaultGrid) with `<canvas ref={...} width={90} height={90}>` using pixel art system
- `CurrentEgg` EggCanvas left unchanged (draws unhatched egg)

---

## 2026-06-16 — fix: unify creature drawing across all screens — single drawCreature system

### src/components/PartySelect.jsx
- Removed 🥚 emoji placeholder; added `<canvas>` with `drawCreature(r, getCreatureSeed(c), c.eggStats ?? {})` at 56×56px
- Imports `drawCreature, getCreatureSeed` from `creatureAlgorithm.js`

### src/games/MoveSelectBattleMode.jsx
- Added `creature` prop to component signature
- When `isWorldBattle && creature`: shows creature canvas (96×96) instead of EggCanvas — inherits same hit-flash filter
- Non-world battles (adventure modes): unchanged, still shows EggCanvas
- Imports `drawCreature, getCreatureSeed` from `creatureAlgorithm.js`

### src/components/WorldBattle.jsx
- Passes `creature={creature}` to `MoveSelectBattleMode` (creature object was already available)

---

## 2026-06-16 — refactor(phase1): delete dead files, split gameConfig, add file headers

### Deleted
- `src/components/ChallengerOverlay.jsx` — confirmed no active imports; dead code

### src/config/creatureConfig.js (NEW)
- Extracted from `gameConfig.js`: `HATCH_CREATURES`, `GRADE_LABELS`, `CREATURE_LEVELS`, `TIERS`, `calcCreatureStats()`

### src/config/battleConfig.js (NEW)
- Extracted from `gameConfig.js`: `BOSS_XP_THRESHOLD`, `AI_OPPONENTS`

### src/config/mapConfig.js (NEW)
- Extracted from `gameConfig.js`: `MAP_THEMES`

### src/config/gameConfig.js
- Removed the 6 exports above; added barrel re-exports (`export * from './creatureConfig.js'` etc.) — all existing import sites unchanged

### File headers added (1-line comment at top)
- `src/components/WorldScreen.jsx`
- `src/games/MoveSelectBattleMode.jsx`
- `src/components/Home.jsx`
- `src/context/StateContext.jsx`
- `src/lib/drawCreature.js`

---

## 2026-06-16 — feat: auto-generate creature names from DNA — remove manual naming UI

### src/lib/creatureGenerator.js
- Added `generateCreatureName(dna)`: deterministic family-based name picker with optional stat modifier suffix. 17 family pools × 5 names, 4 stat modifiers × 4 words.

### src/context/StateContext.jsx
- Imports `generateCreatureName`; HATCH_COMPLETE sets `creatureName: dna ? generateCreatureName(dna) : null` (was `null`)

### src/lib/state.js
- Imports `generateCreatureName`; `_migrateBattleStats` backfills `creatureName` for any hatched egg missing one

### src/components/HatchOverlay.jsx
- Removed `handlePickName` function and `CREATURE_NAME_SUGGESTIONS` import
- Removed `naming` phase JSX block entirely
- `done` phase: replaced "ตั้งชื่อ ✏️" + "ข้ามการตั้งชื่อ" buttons with single "ดำเนินการต่อ!" button

---

## 2026-06-15 — feat: lock to single creature, disable new egg creation and auto-hatch

### src/context/StateContext.jsx
- ADD_XP: `readyToHatch` only true when `hatchedEggs.length === 0` — no egg pressure once creature exists
- HATCH_COMPLETE: early return `state` when `hatchedEggs.length >= 1` — blocks new egg creation

### src/components/HatchOverlay.jsx
- `isOpen` guarded by `!hasCreature` — overlay never opens (auto or manual) when creature exists

### src/components/Home.jsx
- Added `activeCreature` memo (party[0] → hatchedEggs[0] fallback)
- `readyToHatch` local: also guards `eggsHatched === 0`
- `handlePetEgg`: does not dispatch SET_HATCHING when creature exists
- Header: stage name → creature name when creature exists; element hint + "พร้อมฟัก!" badge hidden
- Egg zone (title + egg canvas + hatch CTA): wrapped in `{eggsHatched === 0 && (...)}`
- Creature stats panel added: name, Lv.X, 2×2 ATK/DEF/SPD/HP grid — shown when creature exists
- "ลูบไข่" button label: "ลูบ!" when creature exists

---

## 2026-06-15 — feat: scale enemy stats with player battle level

### src/components/WorldScreen.jsx
- `triggerBattle`: looks up active party creature `battleLevel`, computes `scaleFactor = 1 + (playerLevel - 1) * 0.4`, applies `Math.round(base * scaleFactor)` to hp/atk/def before dispatching SET_PENDING_BATTLE
- Level 1 = base stats unchanged; level 10 = 4.6× base; linear 40% increase per level

---

## 2026-06-15 — fix: use average stats for creature merge instead of sum

### src/lib/state.js
- `_mergeAllCreaturesIntoOne`: fresh-merge path now computes AVERAGE stats (÷ eggs.length) for ATK/DEF/SPD/HP/battleXP/bondMeter instead of sum
- Added re-averaging path: if `eggs.length === 1 && mergedFromCount > 1 && !_statAveraged`, divides the previously-summed stats by `mergedFromCount` to correct them
- Return value now includes `_statAveraged: true`

### src/context/StateContext.jsx
- Initializer `needsMerge`: extended condition triggers re-run when `_creaturesMerged && hatchedEggs.length === 1 && !_statAveraged`
- `loadState().then()` `remoteNeedsMerge`: same extended condition so Supabase state is also corrected on load

---

## 2026-06-15 — hotfix: force creature merge migration + fix frozen กลับ button

### src/lib/state.js
- `_mergeAllCreaturesIntoOne`: return value now includes `_creaturesMerged: true` flag

### src/context/StateContext.jsx
- Initializer: `needsMerge` guard uses `_creaturesMerged` flag — idempotent even after INIT re-fires
- `loadState().then()`: runs merge on remote Supabase data before dispatching INIT — ensures 43-egg cloud state is merged to 1 egg before INIT, then saveState() pushes merged state back to Supabase
- CLOSE_HATCH reducer: now also sets `readyToHatch: false` — was the root cause of the frozen กลับ button (CLOSE_HATCH cleared `hatching` but left `readyToHatch: true`, so `isOpen` immediately flipped back and re-showed the overlay)

### src/components/HatchOverlay.jsx
- Full-collection กลับ button: replaced `doClose` with `handleFullClose` — dispatches CLOSE_HATCH + SET_HATCHING then calls `onClose?.()` directly, skipping the "ไข่ใบใหม่เริ่มต้นแล้ว" toast that was wrong for this case

---

## 2026-06-15 — fix: suppress hatch during battle + one-time creature merge migration

### src/App.jsx
- `HatchOverlay suppressAutoOpen` extended: now also suppresses when `screen === 'world-battle'`, `!!state.pendingBattle`, or `!!state.battleCreatureId` — prevents hatch sequence from interrupting mid-battle

### src/lib/state.js
- Added `_mergeAllCreaturesIntoOne(state)`: sums stats (ATK/DEF/SPD/HP/battleXP/bondMeter) across all hatched eggs, uses most-recently-hatched as base, returns state with `hatchedEggs: [merged]`, `party: [merged.id]`, battle state cleared. Guard: no-op if `eggs.length <= 1`. `mergedFromCount` stored on result for audit trail.

### src/context/StateContext.jsx
- Imports `_mergeAllCreaturesIntoOne`; initializer now calls it after `_migrateBattleStats` when `hatchedEggs.length > 1` — one-time migration collapses Chopin's multiple creatures into one combined creature on first load

---

## 2026-06-15 — hotfix: disable challenger useEffect — root cause of PartySelect freeze

### src/context/StateContext.jsx
- Commented out the `dailyBattleRounds` useEffect: every world battle incremented `dailyBattleRounds` → useEffect fired → `SET_CHALLENGER` dispatched → `pendingChallenger` set → `dailyBattleRounds` reset to 0 → useEffect fired again; loop set `pendingChallenger` on every single battle encounter, breaking PartySelect condition
- `SET_CHALLENGER` / `CLEAR_CHALLENGER` reducers left intact for future re-enable

---

## 2026-06-15 — hotfix: atomic battle dispatch fixes PartySelect loop + remove ChallengerOverlay

### src/context/StateContext.jsx
- Added `SELECT_CREATURE_AND_ENTER_BATTLE` action + atomic reducer: sets `battleCreatureId`, `worldPosition`, `worldBattleEnemy`, and clears `pendingBattle` in a single state update — eliminates intermediate render where `battleCreatureId` was set but `pendingBattle` still non-null

### src/App.jsx
- `PartySelect.onSelect`: replaced 2 dispatches (`SET_BATTLE_CREATURE` + `ENTER_BATTLE_FROM_WORLD`) with single `SELECT_CREATURE_AND_ENTER_BATTLE` dispatch
- Removed `ChallengerOverlay` import, `challengerOpen` state, `pendingChallenger` useEffect, `<ChallengerOverlay>` JSX, and `onOpenChallenger` prop

---

## 2026-06-15 — hotfix: fix baby_zombie collision infinite dispatch loop (battleDispatchedRef reset timing)

### src/components/WorldScreen.jsx
- Previous fix reset `battleDispatchedRef.current = false` unconditionally when `pendingBattle` was null — but RAF runs before React commits state, so on the tick immediately after dispatch `pendingBattle` still reads null and the guard was immediately cleared
- Fix: only reset the guard when it is already `true` AND `pendingBattle` is null (confirmed clear); when guard is up, still call `updateEnemies()` for enemy movement but skip battle trigger

---

## 2026-06-15 — hotfix: fix infinite loop when enemy AI walks into player

### src/components/WorldScreen.jsx
- Added `battleDispatchedRef = useRef(false)` — synchronous flag set immediately when `triggerBattle` is dispatched
- RAF loop: resets `battleDispatchedRef.current = false` when `stateRef.current.pendingBattle` is null (state committed)
- RAF loop: checks `!battleDispatchedRef.current` before calling `triggerBattleRef` on enemy-initiated collision
- Root cause: `stateRef` is only updated via `useLayoutEffect` after React re-renders, so the 3-frame gap between dispatch and state commit allowed repeated `triggerBattle` calls on enemy-initiated encounters

---

## 2026-06-15 — feat: Map System — item bag HUD, 4-map-per-tier tracking, secret maze battle-wins trigger, boss gating

### src/config/gameConfig.js
- Added `MAP_THEMES` (NW/NE/SW/SE → name/element/mapIndex) and `BOSS_XP_THRESHOLD = 300`

### src/lib/state.js
- Added `clearedMaps: []` and `secretMapExpiry: null` to `defaultState()`

### src/context/StateContext.jsx
- 3 new ACTIONS: `MAP_CLEARED`, `SECRET_MAP_SPAWN`, `SECRET_MAP_EXPIRE`
- `INCREMENT_BATTLE_WINS`: auto-spawns maze when `battleWins % 10 === 0 && !mazeActive` (sets `secretMapExpiry = Date.now() + 30min`)
- `SET_WORLD_LEVEL`: now also resets `clearedMaps`, `secretMapExpiry`, `bossDefeatedThisTier`
- `DEFEAT_BOSS`: now also resets `clearedMaps`, `secretMapExpiry`

### src/components/WorldScreen.jsx
- `WorldHUD`: added 🎒 item bag button (38px, red count badge); minimap shows ✓ on cleared maps, "N/4 [world]" label, boss tile grayed/locked vs red/!, MAZE ? indicator; `bossMapUnlocked` prop
- `bossMapUnlocked` computed: `allMapsCleared && totalXP >= 300`
- `handleExit`: dispatches `MAP_CLEARED` on leaving NW/NE/SW/SE; blocks BOSS entry if not unlocked
- Removed old random-timer maze useEffect and battleWins-based world unlock useEffect
- Added `useEffect([secretMapExpiry])`: sets timeout to dispatch `SECRET_MAP_EXPIRE` on expiry
- Added `useEffect([mazeActive, secretMapExpiry])`: `setInterval` for countdown display tick
- Added `useEffect([bossDefeatedThisTier])`: shows 3.5s `bossCutscene` overlay → `SET_WORLD_LEVEL(wl+1)` + worldUnlockBanner
- Boss confirm dialog: "พบบอส Final!" + "⚠️ ใช้ไอเทมไม่ได้" warning + "สู้เลย! ⚔️"
- Maze notification: "🌀 แมพลับปรากฏทางทิศใต้ · MM:SS" countdown
- Added item bag popup: 2×2 grid (food/star/ribbon/potion), USE_ITEM dispatch on tap
- Added boss cutscene banner: "โชแปงพิชิต [world]!" overlay 3.5s before tier advance
- Added boss unlock hint banner on BOSS screen when not yet unlocked (shows N/4 maps · N/300 XP)

---

## 2026-06-15 — feat: Creature System Steps 5–10 — family labels, companion zone, friendship data, ECA fields, bio phase, egg growth message

### src/components/CreatureDetailPopup.jsx
- Added `FAMILY_LABELS_TH` (16 family archetypes → Thai label), `FAVSUBJ_TH`, `FAVSUBJ_COLOR`
- Header: Moonborn badge when `family === 'moon'`
- Creature canvas wrapped in element `drop-shadow` glow filter
- Name section: `creatureName` priority + family badge + element badge
- Friendship stats row: days together, `adventuresWith`, `questionsAnswered`, favorite subject badge (green/blue/purple)

### src/components/Home.jsx
- Companion zone height 52→80px; CreatureCanvas size 22→46px
- `growthBanner` state: on mount, if `sessionXP>0` → show "ไข่ของเราโตขึ้นนะ!" / "อีกนิดเดียวก็ฟักแล้ว!" (stage≥5) after 900ms, auto-hide 3s, dispatch `SET_SESSION_XP:0`

### src/lib/state.js
- `_migrateBattleStats`: backfills `adventuresWith:0`, `questionsAnswered:0`, `eggStartDate` for legacy creatures

### src/context/StateContext.jsx
- `HATCH_COMPLETE`: adds `adventuresWith:0`, `questionsAnswered:0`, `eggStartDate` to new eggs
- `ADD_XP`: increments `questionsAnswered+1` for active party creature on correct answer
- `ROUND_COMPLETE`: increments `adventuresWith+1` for active party creature each round (always maps when activeEgg exists)

### src/components/HatchOverlay.jsx
- `bioDNA`/`bioCreature` state; mount useEffect sets `phase='bio'` when active creature has `adventuresWith>0`
- New 'bio' phase portal: `CreatureCanvas` (100px celebrate), name, adventure/question counts, "ฟักไข่ต่อ!" button, cancel button

## 2026-06-15 — feat: Creature System Phase 5 — birth sequence (CreatureCanvas reveal)

### src/components/HatchOverlay.jsx
- Replaced `{creature?.e || '🐣'}` emoji with `CreatureCanvas` (150px) in 'done' and 'naming' phases
- `buildCreatureDNA(buildEggStats(state))` called synchronously inside `doReveal` setTimeout — DNA ready at the same tick as `setPhase('done')`
- `idleMode='celebrate'` during 'done' phase; switches to `'idle'` during naming
- Element-color `drop-shadow` filter wraps CreatureCanvas (strong glow for 'done', subtle for 'naming')
- `playCreatureSound(buildVoiceProfile(dna), 'celebrate')` fires at creature reveal
- `creatureDNA` state cleared in `doClose` + on overlay re-open
- New imports: `CreatureCanvas`, `buildCreatureDNA`, `buildVoiceProfile`, `playCreatureSound`

### src/styles.css
- Added `@keyframes creature-birth` (scale 0.15→1.14→1.0 spring pop)
- Added `.hatch-creature-enter` class applying the 0.60s cubic-bezier spring animation

## 2026-06-15 — feat: Creature System Phase 4 — voice layer + name suggestion tap targets

### src/lib/creatureSystem.js
- Added `CREATURE_NAME_SUGGESTIONS` — 5 Thai name options per element (fire/water/thunder/nature/shadow/light)

### src/components/HatchOverlay.jsx
- Naming phase rewritten: replaced text input with 5 large tap-target buttons from `CREATURE_NAME_SUGGESTIONS[element]`
- Removed `nameInput` state + `handleConfirmName`; added `handlePickName(name)` that dispatches `SET_CREATURE_NAME` + `doClose`
- Child taps a name → immediately confirmed; "ข้ามการตั้งชื่อ" still available

### src/lib/audio.js
- Added `playCreatureSound(voiceProfile, moment)` — pitch-shifted creature voice using `pitchBase × (1 ± pitchVariance)`
- 5 moments: `pet/ambient` (chirp/peep/trill/hum/squeak by soundFamily), `food` (hum+chirp), `reunion` (4 ascending note pairs), `celebrate` (6-note rapid ascent), `sleep` (3 descending low hums)

### src/components/Home.jsx
- Imports `buildVoiceProfile` from `creatureGenerator.js` + `playCreatureSound` from `audio.js`
- New `voiceProfile` useMemo — derived from active party creature's DNA (falls back to hatchedEggs[0])
- Creature companion tap: `playCreatureSound(vp, 'pet')` replaces `playTone('chirp')`
- Reunion visit (>4h): `playCreatureSound(vp, 'reunion')` replaces double `playTone('chirp')`
- Companion celebrate/wave/sleep personality behaviors wired to `celebrate/pet/sleep` moments
- All creature sounds fall back to `playTone('chirp')` when no voice profile available

---

## 2026-06-15 — feat: Creature System Phase 3 — bond combat effects, 6-creature limit, evo toast

### src/lib/state.js
- Added `pendingEvoNotice: null` to `defaultState()`

### src/context/StateContext.jsx
- New action `CLEAR_EVO_NOTICE` — clears `state.pendingEvoNotice`
- `ADD_XP`: detects evoStage change during creature XP map → sets `pendingEvoNotice` (first change wins)
- `ROUND_COMPLETE`: same evo detection on bond +2 map
- `INCREMENT_BATTLE_WINS`: same evo detection on bond +1 map

### src/components/WorldBattle.jsx
- `creatureStats` useMemo now applies bond bonuses: bond≥25 → ATK×1.05; bond≥100 → ATK×1.5; bond≥50 → SPD+30
- `onCorrect()` dispatches `CREATURE_HEAL({creatureId, amount:1})` when active creature bond≥75 (passive heal)

### src/components/HatchOverlay.jsx
- 6-creature hard limit: if `hatchedEggs.length >= 6` during tapping phase, shows "คลังเต็มแล้ว!" blocking panel instead of the egg

### src/App.jsx
- `useEffect` watches `state.pendingEvoNotice` → calls `showToast("★ [name] วิวัฒนาการแล้ว! → [stage]")` + `CLEAR_EVO_NOTICE`
- Imports `showToast` from Toasts.jsx and `EVO_STAGE_LABELS_TH` from creatureSystem.js

---

## 2026-06-15 — hotfix: world map encounter freeze (browser hang on PartySelect)

### src/components/WorldScreen.jsx
- RAF loop: removed `return` after `triggerBattle` call — canvas now keeps rendering while PartySelect is shown, preventing the canvas/audio freeze
- RAF loop: added `!stateRef.current.pendingBattle` guard before calling `triggerBattle` in loop (redundant safety on top of the guard already inside `triggerBattle`)
- `tryMove`: added `stateRef.current.pendingBattle` early-return guard — blocks player movement (and re-trigger) while PartySelect overlay is open

### src/context/StateContext.jsx
- `ADD_XP`: skip `hatchedEggs.map()` entirely when `party` is empty or `earned === 0` — returns same array reference so `derived` useMemo doesn't recompute
- `ROUND_COMPLETE`: skip `hatchedEggs.map()` when no active creature OR active creature's bond is already at 100 — same stable-ref optimization
- `INCREMENT_BATTLE_WINS`: same stable-ref optimization — skip map when no active creature or bond maxed

---

## 2026-06-15 — feat: Collection "Set Active" button + creature custom name display

### src/context/StateContext.jsx
- New action `SET_ACTIVE_CREATURE` — moves creature to `party[0]` (swaps with current active; no-op if already active or not in party)

### src/components/Collection.jsx
- `creatureName(egg)` helper — returns `egg.creatureName || egg.creature?.n || 'สัตว์ลึกลับ'` (custom name takes priority everywhere)
- PartyGrid: active creature (party[0]) shows "★ ตัวหลัก" gold badge; bench members show "★ ตั้งเป็นตัวหลัก" button (dispatches `SET_ACTIVE_CREATURE`)
- PartyGrid: element color dot next to creature name when `egg.element` is set
- All creature name displays (PartyGrid, VaultGrid, HatchedGrid/CreatureCard) now show custom name if set
- Import `CREATURE_ELEMENT_COLORS` from `creatureSystem.js`

---

## 2026-06-15 — feat: Creature System — element, bond meter, evolution, hatch naming

### src/lib/creatureSystem.js (NEW)
- `determineElement(xpThai, xpMath, xpEng, accuracy, streak)` — maps dominant subject to fire/water/thunder; rare: nature (acc≥85%), shadow (streak≥7+low XP), light (acc≥90%+streak≥14)
- `CREATURE_ELEMENT_COLORS`, `CREATURE_ELEMENT_NAMES_TH`, `EVO_STAGE_LABELS_TH`
- `getEggElementHint(...)` — returns element hint for stage 2+ (returns null before)
- `calcEvoStage(battleLevel, playerTier, bondMeter, currentEvoStage)` — baby→teen→final

### src/config/gameConfig.js
- Added `CREATURE_LEVELS` export (xpPerLevel:80, maxLevel:50, evo thresholds)

### src/lib/state.js
- Added `bossDefeatedThisTier: false` to `defaultState()`
- Migration in `_migrateBattleStats`: backfills `element`, `evoStage`, `bondMeter:0`, `bornAtk/Def/Spd/Crit`, `bornDate`, `bornTier`, `creatureName:null` on all existing creatures

### src/context/StateContext.jsx
- New ACTIONS: `SET_CREATURE_NAME`, `ADD_CREATURE_BOND`, `CREATURE_EVOLVE`
- `HATCH_COMPLETE`: stores element, evoStage, bondMeter, born stats, creatureName on newEgg
- `ADD_XP`: distributes creature battleXP — active 100%, bench 50%; checks evolution
- `ROUND_COMPLETE`: +2 bond to active creature; checks evolution
- `INCREMENT_BATTLE_WINS`: +1 bond to active creature; checks evolution
- `DEFEAT_BOSS`: sets `bossDefeatedThisTier: true`
- New reducers: `SET_CREATURE_NAME`, `ADD_CREATURE_BOND`, `CREATURE_EVOLVE`

### src/components/HatchOverlay.jsx
- After reveal: element badge (colored pill), "ตั้งชื่อ ✏️" → naming phase with text input
- Naming phase dispatches `SET_CREATURE_NAME` for newest hatchedEgg on confirm
- "ข้ามการตั้งชื่อ" skip button in both done and naming phases

### src/components/Home.jsx
- Party HP bar: element color dot on creature portrait, bond meter (gold bar, active only), `creatureName` shown if set
- Header: element hint badge at Stage 2+ ("ธาตุน้ำ?" in element color)

## 2026-06-14 — feat: World Progression System — multi-level worlds, boss screen, secret maze

### src/config/worldConfig.js
- Added `WORLD_LEVELS[3]` array (Green Meadow / Dark Forest / Crystal Cave) with themes, enemy pools, boss configs, unlock requirements
- Added `DYNAMIC_SCREENS` (NW/NE/SW/SE/BOSS/MAZE) with explicit connects
- Added `SCREEN_LAYOUT`, `BOSS_SCREEN`, `MAZE_SCREEN` exports

### src/lib/state.js
- Added 4 fields to `defaultState()`: `worldLevel`, `mazeActive`, `mazeCleared`, `bossDefeated`

### src/context/StateContext.jsx
- Added `SET_WORLD_LEVEL`, `DEFEAT_BOSS`, `ACTIVATE_MAZE`, `CLEAR_MAZE` actions + reducers

### src/lib/tileMaps.js
- Added `generateScreenMap(slot, worldLevel)` — dynamic 20×15 maps per slot
- Added `generateBossMap(worldLevel)` — winding corridor boss arena
- Added `generateMazeMap()` — recursive backtracker maze with EXIT_N reward portal
- Added `getScreenEnemies(slot, worldLevel)` — world-level enemy pool selection

### src/components/WorldScreen.jsx
- `initScreen` rewritten to use generators (BOSS → generateBossMap, MAZE → generateMazeMap, regular → generateScreenMap)
- Enemy init useEffect: BOSS gets static boss at BOSS_TILE with `isWorldBoss:true`; regular screens use `getScreenEnemies`
- `spawnChests` refactored to `(tileMap, enemyDefs)` — no longer uses SCREEN_MAPS global
- `handleExit` rewritten: uses `DYNAMIC_SCREENS` connects + maze routing override (NW→S/SE→W → MAZE when `mazeActive`); MAZE EXIT_N → `CLEAR_MAZE` + 3 item drops
- `tryMove`: boss collision → `setBossConfirm(true)` instead of `triggerBattle`
- `enterBossBattle`: dispatches `SET_PENDING_BATTLE` with `isBossBattle:true` + boss stats from `WORLD_LEVELS[worldLevel]`
- Maze timer `useEffect([worldLevel])`: random 0–20 min → `ACTIVATE_MAZE`
- World unlock `useEffect([battleWins])`: threshold check → `SET_WORLD_LEVEL` + 4s banner
- `renderEnemies`: boss always shows red `!` above sprite
- `WorldHUD` mini-map: updated to 2×2 + full-width BOSS tile; colors from world level; MAZE tile shows when `mazeActive`
- Boss confirm dialog, maze notification, world unlock banner added to JSX
- Removed stale `SCREENS`, `SCREEN_THEMES`, `SCREEN_MAPS` imports

### src/games/MoveSelectBattleMode.jsx
- Item bar hidden when `isBossBattle=true`

### src/components/WorldBattle.jsx
- `DEFEAT_BOSS` dispatched on boss victory

---

## 2026-06-12 — hotfix: replace PartySelect with simple loop-free version

### src/components/PartySelect.jsx (full rewrite)
- Removed `CreatureCanvas` and `buildLegacyPreviewDNA` — eliminates all RAF animation risk
  from this component (those were the amplifying factor in the freeze).
- Removed `useMemo` — not needed without expensive DNA computation.
- Added `renderCount` ref bailout: if render count exceeds 50, renders an escape button
  and logs an error instead of freezing the browser.
- Fallback to most-recently-hatched egg when party is empty (sorted by `hatched_at`).
- Escape button shown for both empty-party and all-fainted states.
- Creature shown as 🥚 placeholder for now; CreatureCanvas can be restored once
  stability is confirmed.

---

## 2026-06-12 — hotfix: PartySelect infinite loop / freeze on mount

### src/components/WorldScreen.jsx
- `useEffect(() => { stateRef.current = state })` → `useLayoutEffect`.
  Root cause: `useEffect` runs after the browser paint, so the RAF loop fires before
  `stateRef.current.pendingBattle` is updated, causing `triggerBattle` to bypass its guard
  and dispatch `SET_PENDING_BATTLE` dozens of times per second → freeze.

### src/components/PartySelect.jsx
- `dna` computation moved inside `partyCreatures` useMemo — stable reference across re-renders.
  Previously an IIFE in `.map()` created a new DNA object every render, causing
  `CreatureCanvas.useEffect([dna])` to restart the animation RAF on each re-render.
- JSX `.map(creature =>` → `.map(({ creature, dna }) =>` — destructures from memo.
- `allFainted` check: `c.currentHP` → `({ creature: c }).currentHP` to match new shape.
- Empty party now shows "กลับแมพ" escape button — previously UX deadlock (no way to close).

---

## 2026-06-12 — hotfix: damage calculation — creature 1-shots world enemies

### src/components/WorldBattle.jsx
- `creatureStats` useMemo now scales creature stats to world-battle range.
  `WB_STAT_SCALE=0.07`: ATK/DEF ~60→4 (Tier 0, balanced XP). `WB_HP_SCALE=0.10`: HP ~166→17.
  Result: ~11 hits (no combo) / ~7 hits (×1.5 combo) vs `sleepy_bunny` (HP=44). ✅
- `creatureCurrentHP` now computed as `min(scaledMaxHP, round(creature.currentHP × WB_HP_SCALE))`.
  Carries persistent HP across battles (creature heals only via items/full-restore). ✅
- `handleCreatureTakeDamage` dispatches `round(damage / WB_HP_SCALE)` to state.
  State HP decreases proportionally → creature faint in state matches battle faint. ✅
- Root cause: `TIERS[0].baseStat = 100` → `calcCreatureStats` outputs ATK≈40–70 (designed for
  academic battles vs AI opponents with HP=280–700). World battle enemies (HP=32–52, ATK=3–5)
  require a separate scale factor; previous code passed raw stats directly.

---

## 2026-06-12 — feat: PartySelect centered layout + HP display fix

### src/components/PartySelect.jsx
- `justifyContent: 'center'` added to wrapper — content vertically centered on screen.
- `gap: 14 → 20` between sections.
- Enemy preview: `var(--font-pixel)/10px → var(--font-thai)/14px` for readability.
- Grid: single-creature case uses `gridTemplateColumns: '1fr'` and `maxWidth: 200`
  (was always `repeat(2, 1fr)` and `maxWidth: 320`).
- `maxHP` now includes battle level bonus: `stats.HP + max(0, battleLevel - 1)`.
  Fixes HP display overflow (e.g. 191/188) when battleLevel > 1.
- `currentHP` display clamped to `Math.min(currentHP, maxHP)`.

---

## 2026-06-12 — hotfix: item reuse per question + no corpse + smooth glow + no flee

### src/games/MoveSelectBattleMode.jsx
- `setItemUsed(false)` added to per-question reset `useEffect([cur])` — item available once per question, not once per battle.

### src/components/WorldScreen.jsx
- `fillCirclePixel` helper removed; `drawPlayerGlow` now uses `ctx.arc` for smooth circular rings.
  Pulse formula `(sin(frame×0.06)+1)/2` (continuous sine). Outer ring 85% tile radius, inner 58%.
- `updateEnemies`: dead enemies immediately call `scheduleRespawn()` + return `null` — no death-timer countdown.
- `renderEnemies`: corpse rendering block removed entirely (squish/rotate/opacity/✕ mark gone).
- Enemy init: `dead: true` without `deathTimer/opacity` fields.

### src/components/PartySelect.jsx
- "หนี" flee button removed. Battle is mandatory when any creature is available.
- When all creatures are fainted, "กลับแมพ" forced-retreat button shown.

---

## 2026-06-12 — hotfix: battle not opening — INIT dispatch overwrites initializer null

### Root cause
`ACTIONS.INIT` reducer spread `action.payload` which included the stale `battleCreatureId`
from Supabase/localStorage, undoing the `useReducer` initializer's `null` override. The
`loadState().then(dispatch INIT)` runs ~50ms after mount; the stale value came back every load.

### src/context/StateContext.jsx
- `ACTIONS.INIT` case now appends `battleCreatureId: null, pendingBattle: null, worldBattleEnemy: null`
  after the payload spread — transient battle fields are always cleared on any full state load.

---

## 2026-06-12 — hotfix: fix PartySelect never appearing after enemy collision

### Root cause
`battleCreatureId` persists to localStorage. If the app was closed mid-battle,
it remains non-null on next load. `state.pendingBattle && !state.battleCreatureId`
evaluates false → PartySelect never renders → player sees nothing after collision.

### src/context/StateContext.jsx
- `useReducer` initializer: force `battleCreatureId: null`, `pendingBattle: null`,
  `worldBattleEnemy: null` after migration — clears any stale battle state from
  an app-closed-mid-battle session.

### src/lib/state.js
- `_migrateBattleStats`: party validation now runs independently of `dirty` flag.
  - Filters stored party IDs against actual egg IDs (removes stale/mismatched IDs).
  - Falls back to rebuilding from `inParty` flags if valid party is empty.
  - Previously this only ran when `dirty = true` (eggs needed migration), so a
    fully-migrated user with an empty/stale party never got it rebuilt.

---

## 2026-06-12 — hotfix: fix enemy collision — battle triggers on contact, flee keeps enemy alive

### src/components/WorldScreen.jsx
- `triggerBattle`: removed `defeated: true` marking at collision time — enemy stays alive in world while PartySelect is open; flee no longer silently removes enemies.
- `triggerBattle`: added `if (stateRef.current.pendingBattle) return` guard to prevent re-triggering while PartySelect is already open.
- `updateEnemies`: woken `sleepy_bunny` added to chase-collision check alongside snake/baby_zombie — bunny chasing the player now triggers battle when it reaches the player's tile.
- `tryMove`: woken `sleepy_bunny` added to "chaser already on player's tile" check — consistent with updateEnemies fix.

---

## 2026-06-12 — hotfix: battle balance — monster HP/DEF rebalance + damage formula fix

### src/config/enemyConfig.js
- All 9 enemies rebalanced: hp raised to 40–52 (was 18–36), atk lowered to 3–5 (was 4–9), `def` field added (0 or 1).
- Target: ~10 correct answers to defeat easiest enemy at Tier 0 creature.

### src/context/StateContext.jsx
- `scaleMonsterStats`: tier multipliers updated to 1.0/1.3/1.8/2.4/3.2 (was 1.0/1.4/2.0/2.8/3.8).
- Return keys changed from uppercase `{HP,ATK,DEF}` to lowercase `{hp,atk,def}`.

### src/components/WorldBattle.jsx
- Passes `DEF: enemy.def ?? 0` to `scaleMonsterStats` (was hardcoded 0).
- Uses `scaled.hp`, `scaled.atk`, `scaled.def` (updated for new lowercase return).
- `scaledEnemy` now includes `def: scaled.def`.

### src/components/WorldScreen.jsx
- `SET_PENDING_BATTLE` dispatch now includes `def: eData.def ?? 0` in enemy payload.

### src/games/MoveSelectBattleMode.jsx
- Hit damage formula: `Math.round(Math.max(1, creatureATK − enemy.def) × mult)` (was `Math.ceil(ATK × mult)`).

---

## 2026-06-12 — fix: battle uses all question types — full level rotation across thai/math/english

### src/components/WorldBattle.jsx
- Added imports: `SPELL_L1, TH_L2, TH_L3, TH_L5, CVC_WORDS, SIGHT_DATA, ENG_SENTS` from gameConfig.
- `genThaiMoveQ(lv)` now dispatches by `lv.id`: L1=alphabet match (unchanged), L2=SPELL_L1 emoji→word, L3=TH_L2 animal emoji→word, L4=TH_L3 3-syllable emoji→word, L5=TH_L5 emoji→sentence.
- `genEngMoveQ(lv)` now dispatches by `lv.type`: phonics=unchanged, cvc=CVC_WORDS emoji→word, sight=SIGHT_DATA sentence-with-blank, sentence=ENG_SENTS emoji→full-sentence.
- `genMoveQuestion` now passes `lv` to both Thai and English generators.
- Added battle-start debug console.log (levelId, levelName, xp values, dailyBattleRounds).

### src/lib/battleSubject.js
- `getBattleLevel`: lowered XP threshold from 120 to 60 per level for faster variety unlock.
- Uses `minId = levels[0].id` as base (0 for math, 1 for thai/eng) — math level 0 (counting) now reachable.
- Rotation formula: `[minId, maxUnlocked, floor((minId + maxUnlocked) / 2)]`.

### src/games/MoveSelectBattleMode.jsx
- `MoveCard` fontFamily now includes `Sarabun,Mitr` fallback — Thai word choices now render correctly.
- Zone 2 question display: shows `q.question` at smaller font (15px Thai, 13px English) when present (used by sight-word and sentence levels). Falls back to `q.word` at 36px for all other types.

---

## 2026-06-12 — fix: battle items working + item tooltip popup + monster hurt animation

### src/lib/drawEnemy.js
- Added `EYE_POSITIONS` lookup table (48-grid coords for all 9 enemy types).
- Added `drawHurtEyes(ctx, size, pos)` — X-mark eyes (red crossed lines) + zigzag mouth using canvas `lineTo`.
- Added exported `drawEnemyHurt(ctx, type, size, x, y)` — slight `rotate(0.08)` tilt + base sprite + hurt eyes overlay.

### src/games/MoveSelectBattleMode.jsx
- **Fix 1**: `useBattleItem` — `skip` (scroll) now calls `onNext()` unconditionally in world battles instead of triggering `showVictory()` at question 7.
- **Fix 2**: Item tooltip popup — changed item bar `onClick` from immediate `useBattleItem()` to `setPendingItem(key)`. Added `ITEM_DESCRIPTIONS` object (5 Thai descriptions). Added `pendingItem` state. Added tooltip overlay (semi-transparent dark, item icon 40px, name, description, qty, ใช้เลย!/ยกเลิก buttons, tap-outside-to-dismiss).
- **Fix 3**: Monster hurt animation — added `enemyHurt` state. `fireHit` sets `enemyHurt=true` for 400ms. `EnemyCanvas` now calls `drawEnemyHurt` when `enemyHurt=true`. Imported `drawEnemyHurt` from `drawEnemy.js`.

---

## 2026-06-12 — feat: Pokémon battle system — real HP, party select, creature faint, battle leveling

### src/lib/state.js
- Added `pendingBattle`, `party`, `partySlots`, `battleCreatureId` to `defaultState()`.
- Added and exported `_migrateBattleStats()`: adds `id/battleLevel/battleXP/currentHP/inParty/archived` to existing eggs; builds `party` from `inParty` flags; called in both `loadState()` paths.

### src/context/StateContext.jsx
- Added 8 new ACTIONS: SET_PENDING_BATTLE, CLEAR_PENDING_BATTLE, SET_BATTLE_CREATURE, CREATURE_TAKE_DAMAGE, CREATURE_HEAL, CREATURE_GAIN_BATTLE_XP, ADD_TO_PARTY, UNLOCK_PARTY_SLOT.
- Added local `calcBattleLevel(xp)` (quadratic thresholds) and exported `scaleMonsterStats(baseStats, creatureLevel)` (×1.0–×3.8 by tier).
- `HATCH_COMPLETE`: new eggs get `id`, battle stats, auto-join party if party empty.
- `ENTER_BATTLE_FROM_WORLD` clears `pendingBattle`. `RETURN_FROM_WORLD_BATTLE` clears `battleCreatureId`.
- All new reducers added. StateProvider lazy initializer now calls `_migrateBattleStats`.

### src/components/PartySelect.jsx (NEW)
- Pre-battle creature selection overlay (zIndex 80). Shows party creatures with CreatureCanvas, HP bars, battle level, faint state. Flee button dispatches CLEAR_PENDING_BATTLE.

### src/App.jsx
- PartySelect overlay shown when `state.pendingBattle && !state.battleCreatureId`.
- On creature select: SET_BATTLE_CREATURE + ENTER_BATTLE_FROM_WORLD + navigate('world-battle').

### src/components/WorldScreen.jsx
- `triggerBattle` now dispatches `SET_PENDING_BATTLE` with scaled HP/ATK from ENEMY_DATA. No longer calls navigate directly.

### src/components/WorldBattle.jsx (REBUILT)
- Reads `battleCreatureId` to resolve fighting creature. Scales enemy via `scaleMonsterStats`.
- Passes `isWorldBattle/creatureStats/creatureCurrentHP/creatureName/onCreatureTakeDamage/onBattleXP/onFaint` to MoveSelectBattleMode.
- Questions loop indefinitely (regenerates bank); victory only from enemy HP=0.
- `handleCreatureTakeDamage` → CREATURE_TAKE_DAMAGE. `handleBattleXP` → CREATURE_GAIN_BATTLE_XP + UNLOCK_PARTY_SLOT at 10/50 XP total. `handleFaint` → RETURN_FROM_WORLD_BATTLE + navigate('world').

### src/games/MoveSelectBattleMode.jsx
- Added world battle props: `isWorldBattle`, `creatureStats`, `creatureCurrentHP`, `creatureName`, `onCreatureTakeDamage`, `onBattleXP`, `onFaint`.
- World battle: `maxHP` from `enemyData.hp`; hit damage = creature ATK × combo mult; miss = SPD dodge check (SPD/200) + DEF reduction (`max(1, rawDmg − DEF×0.5)`); faint calls `onFaint()`; victory only from HP=0 (no question-count victory); `onBattleXP(10+5)` called on victory.
- Player HP bar shows creature HP when `isWorldBattle`; name badge shows `creatureName`.

### src/components/Home.jsx
- Added compact party HP strip above item tray: each party creature shown as CreatureCanvas 22px + name + HP bar + HP text. Only shown when `state.party.length > 0`.

### src/components/Collection.jsx
- Added ทีม tab (`PartyGrid`: HP bars + battle level, dispatches ADD_TO_PARTY).
- Added คลังสะสม tab (`VaultGrid`: non-party creatures greyed out, เพิ่มในทีม button).
- Kept ทั้งหมด (all) and กำลังฟัก tabs.

### docs/research/creatures/creature-battle-system.md (NEW)
- Full design rationale: state fields, battle flow diagram, stat calculations, combat mechanics, battle level progression, party slot milestones, UI surfaces, design constraints.

## 2026-06-11 — Fix: Snake battle + enemy death animation + respawn + player glow

### src/components/WorldScreen.jsx
- **Snake/zombie bidirectional collision**: `tryMove()` checks fast enemies on player's current tile; `updateEnemies()` returns `pendingBattle` when enemy moves onto player; `loop()` fires battle and returns.
- **Enemy death animation**: dead enemies render as squished (scale 1×0.3, rotated 90°) fading corpse + ✕ mark. `sessionStorage kq_last_battle` persists defeated enemy type across WorldScreen remount so death animation plays on return from battle.
- **Enemy respawn timer**: `scheduleRespawn()` uses setTimeout (45–90s random) to re-spawn enemy at walkable tile ≥5 from player. Timer IDs cleared on RAF cleanup.
- **Player glow**: `fillCirclePixel()` + `drawPlayerGlow()` draw 3 pulsing warm-yellow/white pixel rings behind player every frame.
- `triggerBattleRef = useRef(null)` wires RAF closure to current `triggerBattle` useCallback.

## 2026-06-11 — Feat: Battle item system

### src/config/itemConfig.js (NEW)
- `BATTLE_ITEMS` — 5 items: scroll (skip), thunder (free_attack 15dmg), gem (double_xp), mirror (hint/eliminate 2 wrong), clover (block next miss)
- `rollBattleItem()` — 55% drop chance, weighted random from DROP_TABLE

### src/components/PixelItemIcon.jsx (NEW)
- 10×10 grid canvas icons for all 5 battle item types
- Palette-indexed per type (dark border + main + highlight colors)
- `imageRendering: pixelated`; size prop scales cell size

### src/lib/state.js
- `defaultState.items` — added `scroll: 0, thunder: 0, gem: 0, mirror: 0, clover: 0`

### src/games/MoveSelectBattleMode.jsx
- Added imports: `useAppState`, `ACTIONS`, `PixelItemIcon`, `BATTLE_ITEMS`, `rollBattleItem`
- Added state: `itemUsed`, `eliminatedChoices`, `shieldActive`, `xpBoostActive`, `victoryBonus`
- Added refs: `shieldActiveRef`, `xpBoostActiveRef`
- `useBattleItem(key)` — dispatches USE_ITEM; handles 5 effects; one use per battle
- Item bar UI above answer panel — shows only battle items with count > 0; hides if none owned; shows โล่/XP×2 status indicators
- `fireHit()` — XP boost check: dispatches second ADD_XP if xpBoostActiveRef active
- `fireMiss()` — shield check: absorbs miss damage, clears shield, then proceeds normally
- `showVictory()` — 10% chance rolls and dispatches DROP_ITEM for bonus battle item; shows in victory screen
- Answer cards — `eliminatedChoices` renders dimmed/disabled for mirror hint effect
- `cur` useEffect — added `setEliminated([])` to clear hint on question advance

### src/components/TreasureSlot.jsx
- `resolveReward()` — calls `rollBattleItem()` after primary reward; sets `reward.battleItem` + appends item name to label

### src/components/WorldScreen.jsx
- `handleTreasureReward()` — dispatches extra `DROP_ITEM` for `reward.battleItem` if present

---

## 2026-06-11 — Fix: Remove all UI emoji + apply pixel post-processing

### Home.jsx
- Removed `emoji` field from ITEM_DEFS; added `ITEM_COLORS` dict; item tray now shows 22×22 colored CSS squares
- Flying food item uses Thai label (`{ label:'อาหาร' }`) instead of emoji
- Ambient events (butterfly/leaf/star) render pixel squares instead of emoji
- Stage-up banner sparkle div removed
- Particles replaced with colored CSS squares (hearts=#ff6677, sparkle=#ffdd44)
- Star boost orbit uses CSS inline-block squares instead of emoji
- Ribbon decoration uses 10×10 pink CSS square instead of 🎀
- Sound toggle uses Thai text "เสียง"/"ปิด" instead of 🔊/🔇
- Creature companion: replaced `{lastCreatureEmoji}` with `CreatureCanvas` (26px, animationEnabled=false, legacy DNA fallback via `buildLegacyPreviewDNA`)
- Behavior overlays: replaced 👋/🎁/🎊/💤/👀 with Thai text ทัก!/ของ/สนุก!/zz/...
- Placeholder text: removed ❓ from "ฟักไข่เพื่อพบเพื่อนใหม่!"
- Added `useMemo`, `CreatureCanvas`, `buildLegacyPreviewDNA` imports

### Collection.jsx
- Removed 🥚 from page title; removed 🐣/🥚 from tab labels
- Removed legacy creature emoji overlay (`{egg.creature.e}`) from CreatureCard
- Removed 🥚 from empty state, removed 🐣 from "พร้อมฟักแล้ว!" text
- Removed unused `isLegacy` variable

### BottomNav.jsx
- Replaced 🏠/🥚/📊 emoji icons with 18×18 colored CSS squares (yellow/purple/blue)

### WorldScreen.jsx
- Removed 🏠 emoji from "กลับบ้าน" back button

### TreasureSlot.jsx
- Removed 💰/🎰 from UI headers and button text
- Removed emoji from reward label strings (kept ITEMS array as slot symbols)
- Removed ✅ from "รับของ!" button

### Report.jsx
- Removed 📊 from page title; removed all rc-icon emoji spans
- WORLD_LABELS: removed emoji prefixes from all 4 subject strings
- READINESS_SUBJECTS: removed icon field entirely, removed icon span from JSX
- `domSub`/`weakSub`/`speedLabel`/`accLabel` computed strings: removed trailing emoji
- BarRow labels: removed 📖/🔤/🔢 prefixes
- Phase difficulty: replaced ⚠️/✅ with colored "!"/OK text labels
- Session log: replaced ✅/❌ with "ผ่าน"/"ล้ม" Thai text

### CreatureDetailPopup.jsx
- Removed rarity ⭐ stars from rarity badge
- Removed legacy emoji overlay (`{egg.creature.e}`)
- Removed 🗓️ from date display; removed ⚡/✨ from section headers
- XP bar labels: removed 📖/🔤/🔢 emoji prefixes
- Streak: removed 🔥 suffix
- Ability strings: removed all trailing emoji (❤️/🌍/🔢/⭐/🔥/🎯)
- Removed unused `isLegacy` variable

### HatchOverlay.jsx
- Removed 🥚 from new-egg toast message

### drawCreature.js
- `imageSmoothingEnabled` changed from `true` → `false`; removed `imageSmoothingQuality = 'high'`

### EggCanvas.jsx
- Added `pixelateCanvas(canvas, blockSize)` helper (downsample + upsample with imageSmoothingEnabled=false)
- `useEffect` now calls `pixelateCanvas(ref.current, 4)` after every `drawEgg()` call

### CreatureCanvas.jsx
- Added `pixelateCanvas(canvas, blockSize)` helper
- Static draw (`useEffect` on dna): calls `pixelateCanvas(canvasRef.current, 3)` after `drawCreature()`
- Animation loop `tick()`: calls `pixelateCanvas(canvasRef.current, 3)` after every `drawCreature()` frame

## 2026-06-11 — Feat: Baby Zombie (tiny fast chaser) + Snake (patrol+aggro) enemies

### drawEnemy.js
- `_babyZombie(ctx, size)` — 24-unit grid (half-scale detail). Ragged green-grey shirt with tears, oversized head, X-mark dead eyes, open jagged mouth with 2 teeth, outstretched arms, stubby uneven legs
- `_snake(ctx, size)` — 48-unit grid. S-curve body (tail + 3 segments), scale diamonds, belly stripe, flat triangular head, yellow slit-pupil eyes, forked red tongue
- Added `baby_zombie` and `snake` to `DRAW_FNS` dispatch table

### enemyConfig.js
- `baby_zombie`: nameTH 'เบบี้ซอมบี้', hp 30, level 2, subject null
- `snake`: nameTH 'งูยักษ์', hp 55, level 3, subject null

### tileMaps.js SCREEN_ENEMIES
- BM: +1 `baby_zombie` at col 14 row 3
- MC: +1 `snake` at col 10 row 8
- TR: +1 `snake` at col 13 row 7
- MR: +1 `baby_zombie` at col 8 row 3, +1 `snake` at col 15 row 11

### WorldScreen.jsx
- Enemy init: added `isAggro: false`, `aggroTimer: 0` to all enemy state objects
- `updateEnemies` `baby_zombie` case: always chases player, moves every 6 ticks (≈300ms); picks dominant axis (x or y) toward player each step
- `updateEnemies` `snake` case: patrol (36 ticks ≈1800ms, random drift) when dist > 4; aggro charge (5 ticks ≈250ms, chase player) when dist ≤ 4; transition sets `aggroTimer=10` + fires `playSFX('enemy_notice')` once
- `renderEnemies`: `baby_zombie` rendered at 60% sprite size (≈19px). Snake `aggroTimer > 0` draws red `!` above sprite for ≈500ms

## 2026-06-11 — Feat: pixel home scene — canvas tilemap with animated pixel sprites

### HomeBackground.jsx (full rebuild)
- Replaced all CSS-div/keyframe art with a `<canvas>` pixel renderer
- Canvas size: `window.innerWidth × Math.floor(window.innerHeight * 0.65)`; scale `S = max(1, floor(W/160))`
- `ctx.imageSmoothingEnabled = false`; every pixel drawn with `fillRect` only
- Static tiles redrawn each frame: 3-band sky (day `#4ec8f0/#87ddff/#d4f7c0`; night `#0a1a3a/#1a2a5a/#2a3a7a`); 2 pixel mountains (stacked-`fillRect` triangles); 3-strip ground (bright/mid/dark); 2 pixel trees (triangle canopy rows + trunk); trapezoidal path (horizontal slices); 8 cross-shaped pixel flowers (day only)
- Animated sprites via `requestAnimationFrame`: pulsing pixel sun (square + 8 rays); pixel moon + crescent cutout; 12 twinkling stars (sine opacity); 3 left-scrolling pixel clouds; 2 butterflies (sine-wave Y, cosine wing flap width); 1 bird (V-wing pixel shape, cross-screen); 4 fireflies with rgba glow (night only)
- Below-canvas div fills remaining 35vh with solid ground color (day `#2a7a2a` / night `#0a1a0e`)
- `hour` prop preserved; `isDay` computed internally — no Home.jsx changes required

## 2026-06-11 — Feat: pixel UI system — Press Start 2P font, pixel classes, square corners, hard shadows

### index.html
- Added Press Start 2P + Sarabun to Google Fonts link (combined with existing Mitr + Fredoka One)

### src/styles.css
- Added 20 pixel CSS variables to `:root`: `--font-pixel`, `--font-thai`, full 16-color `--px-*` palette, border/radius/shadow tokens
- Appended pixel class library: `px-box`, `px-box-light`, `px-btn` (+purple/yellow/dark), `px-hp-bar-outer/inner`, `px-xp-bar-outer/inner`, `px-dialogue`, `px-name-badge`, `px-item-card`, `px-badge`, `px-title`, `px-subtitle`, `px-cursor`, `px-answer-card` (+correct/wrong + `px-shake` keyframe), `px-combo-badge`, `px-transition-overlay`, `px-bottom-nav`, `px-nav-item`, `px-nav-dot`
- Global border-radius kill on interactive elements (`button, input, .card, [class*="btn"]` etc. → `border-radius: 0 !important`)
- `img, canvas` get `image-rendering: pixelated`

### src/components/BottomNav.jsx
- Replaced `bottom-nav` / `nav-btn` / `nav-dot` with `px-bottom-nav` / `px-nav-item` / `px-nav-dot`
- Nav labels use Sarabun via `var(--font-thai)` (Press Start 2P cannot render Thai)

### src/components/Home.jsx
- Header: removed `backdropFilter: blur`, flat `var(--px-darkest)` background + pixel border
- Stage label: Thai font + `var(--px-light)` color
- Ready-to-hatch badge: `px-badge` with yellow fill, no gradient
- Title: Thai font + `var(--px-yellow)` + `2px 2px 0` hard text-shadow
- Mood indicator: moodEmoji replaced with `px-subtitle` Thai text + 3-dot pixel level squares
- Hatch CTA: `px-btn px-btn-yellow`, flat, no gradient
- Item tray: removed glassmorphism blur — flat `var(--px-darkest)` bg + `px-item-card` per item + `px-badge` counts
- Action row: `px-btn px-btn-dark` for ลูบไข่/คอลเลกชัน, `px-btn px-btn-purple` for ออกสำรวจ!; no gradients, no blur, emoji removed from labels

### src/games/MoveSelectBattleMode.jsx
- `GBHPBar`: `px-hp-bar-outer/inner` (stepped width transition)
- `MoveCard`: `px-answer-card` base + `.wrong` class on miss (px-shake replaces miss-fizzle)
- Enemy/player status panels: `px-box`
- Enemy/player name labels: `px-name-badge` with Thai font override
- Dialogue box: `px-dialogue` class
- Teach start button + victory return button: `px-btn` variants with Thai font

## 2026-06-11 — Feat: element attack system — 6 elements × 4 tiers with canvas animations and SFX

### New files
- `src/config/elementConfig.js`: `ELEMENTS` (6 elements × 4 tier definitions) + `getElementTier(element, combo)` helper
- `src/lib/elementAnimations.js`: `playElementAttack(canvas, element, tierIndex, fromPos, toPos, onComplete)` — canvas animation for all 24 combos (6 elements × 4 tiers). `animate()` RAF loop helper. `zigzag()` helper for lightning. Each animation uses `performance.now()` + RAF for fixed-duration render.

### MoveSelectBattleMode.jsx
- Added imports: `ELEMENTS`, `getElementTier` from elementConfig; `playElementAttack` from elementAnimations; `playElementSFX` from audio
- `battleElement` state: random element assigned on mount, fixed for entire battle
- `attackLabel` state: tier name flash (900ms)
- `overlayCanvasRef`: second canvas inside battleFieldRef div, zIndex 16 (above particles at 15). Size synced via same ResizeObserver as effectCanvasRef
- `fireHit()`: after spawnEffect — calls `getElementTier(battleElement, combo)`, plays `playElementSFX`, flashes tier name label, calls `playElementAttack` with egg→enemy coords from `getBoundingClientRect()`
- Element badge: inline-block pill below enemy name — element color + icon + Thai name
- Attack label overlay: absolute positioned, `fadeInOut 0.9s` CSS animation, element color + textShadow glow

### audio.js
- Added `SFX_ELEMENTS` dict: 6 elements × 4 tier SFX (Web Audio API, all using existing `_t`, `_sweep`, `_noise` helpers)
- Added `playElementSFX(element, tierIndex)` export

### styles.css
- Added `@keyframes fadeInOut` for attack tier name flash

## 2026-06-11 — Feat: treasure chest + slot machine reward; fix hint bar centering

### WorldScreen.jsx
- `drawChest()` pixel art function: brown box + gold lid trim + lock + alternating sparkle dot (uses TILE=16px grid)
- `spawnChests(screenId)` module helper: selects 2–3 random GRASS/FLOWER tiles per screen, avoids enemy positions, shuffled
- `chestsRef` ref + screen-change useEffect: chests re-spawn fresh on every screen entry (same lifecycle as enemies)
- `tryMove`: chest collision check before `canMove` — walking into closed chest marks it opened, plays `cardOpen` tone, opens slot machine overlay
- `renderChests` in rAF loop: draws unopened chests on canvas after enemies, before player
- `handleTreasureReward`: dispatches `DROP_ITEM` for each qty unit of the reward item; plays `stage_up` SFX
- TreasureSlot overlay rendered in JSX when `slotMachineOpen` is true

### TreasureSlot.jsx (NEW)
- Full-screen overlay with 3 emoji reels
- Spin animation: each reel cycles through ITEMS emojis at 80ms/frame, stops independently (reel 1 at frame 15, reel 2 at 22, reel 3 at 30)
- Reward logic: 3 matching → 🌟 star ×3 jackpot; 2 matching → 🎀 ribbon ×1; else → 🍖 food ×1
- `onReward` fires 800ms after spin completes (item added to inventory before player taps collect)
- "รับของ!" collect button shows after spin resolves; `onClose` hides overlay

### MoveSelectBattleMode.jsx
- Dialogue box container: added `justifyContent:'center'` so HintBar dots are properly centered
- Removed entire `QuestionHint` component and `DotGroup` component (dead code — no longer rendered)
- Removed `QuestionHint` render block (the section between dialogue box and move panel)
- The only visual hint is now HintBar dot groups for math arithmetic; everything else is TTS-only

## 2026-06-11 — Fix: hint bar dots-only for math + pixel art enemy sprites

### MoveSelectBattleMode.jsx
- `HintBar` rewritten: Thai/English return null (QuestionHint below already shows the word + 🔊 button)
- Math arithmetic: HintBar now shows dot groups only — blue dots for `q.a`, orange dots for `q.b`, operator, `= ?`
- Math isCount/isPattern/isWord questions: HintBar returns null (QuestionHint handles display)
- Uses `q.a`/`q.b`/`q.op` fields directly — no regex parsing

### drawEnemy.js (full rebuild)
- All 7 enemy draw functions rebuilt with `ctx.fillRect()` only — no arcs, ellipses, or bezier curves
- `px(ctx, gx, gy, gw, gh, size, color)` helper function scales 48×48 grid coordinates to actual pixels
- `ctx.imageSmoothingEnabled = false` added for crisp pixel art at all sizes
- `DRAW_FNS` dispatch object replaces switch statement
- All type aliases preserved (`bunny`/`sleepy_bunny`, `slime`/`bouncy_slime`, `fox`/`fox_kit`/`tiny_fox`, etc.)
- Sprite designs: sleepy_bunny (floppy ears, closed-line eyes, pink blush, ZZZ rects), bouncy_slime (blob stacked rects, flower-pot hat), fox_kit (pixel triangle ears, tail+scarf), egg_pawn (chest panel+visor+antennae), leaf_sprite (layered leaf rects+veins), grumpy_mole (square glasses+shovel+frown+claws), mushroom_imp (cap dome rows+white spots+O mouth+worried eyebrows)

## 2026-06-11 — Feat: Home screen redesign — Pokémon background + Tamagotchi ambient life

### HomeBackground.jsx (full rebuild)
- Sky: vivid FireRed/LeafGreen palette — `#4ec8f0→#87ddff→#c8f0ff→#d4f7c0` day; `#0a1a3a→#1a2a5a→#2a3a7a→#0d2a1a` night
- Sun: `hbg-sun-pulse` 4s scale animation; moon+crescent retained for night
- Clouds: 3 CSS clouds with ::before/::after bumps; sped up (28s/42s/35s); cloud-3 now 110px wide
- Mountains: 2 prominent rounded-rectangle hills (height 28%/22%) with Pokémon green tints (#a8d4a8/#90c490)
- Ground: curved top edge (`border-radius: 50% 50% 0 0 / 30px`); 3-stop vivid green gradient; 2 depth mounds
- Butterflies (day): 2 CSS-drawn `Butterfly` components — 2 wings (`border-radius:50% 0 50% 50%` + mirror) + body; `hbg-flap-l/r` alternate scaleY; `hbg-bf1` (8s) + `hbg-bf2` (12s) sine-wave flight loops; `#ff99dd` + `#ffcc44` colors; `will-change:transform`
- Bird (day): CSS `Bird` component — oval body + 2 wing shapes; `hbg-bird-flap` 0.25s alternating; `hbg-bird-fly` 15s left→right repeat
- Leaf particles: 3 small rounded-diamond divs; `hbg-leaf1/2/3` fall+rotate+sway loops (6–9.5s staggered)
- Fireflies (night only): 4 tiny 4px circles `#ffffaa` with static glow; `hbg-ff1/2/3/4` drift+opacity loops
- Flowers (day): `hbg-flower-float` +3px bob with staggered delays; 6 CSS dot-shadow flowers retained

### Home.jsx (targeted changes)
- Title "ไข่ของ{name}" moved to above egg: smaller (17px Fredoka), soft `text-shadow` glow
- Stage dots removed; replaced with single mood emoji (😊/🤩/😋/😴) driven by `eggAnim` state
- Header left side simplified to stage-name label only; right side keeps sound button + readyToHatch badge
- Item tray: outer container opacity reduced; inner glassmorphism card (`rgba(255,255,255,0.15)` + `backdropFilter:blur(8px)` + frosted 1px border + `borderRadius:20`)
- ออกสำรวจ! button: shimmer gradient (`home-shimmer 3s linear infinite`, `background-size:200%`)
- Egg canvas wrapped in relative container; ellipse ground shadow `radial-gradient(ellipse, rgba(0,0,0,0.18), transparent)` absolutely positioned -8px below canvas

### styles.css additions
- `hbg-sun-pulse`, `hbg-flap-l/r`, `hbg-bf1/2`, `hbg-bird-flap/fly`, `hbg-ff1/2/3/4`, `hbg-leaf1/2/3`, `hbg-flower-float`, `home-shimmer`

## 2026-06-11 — Fix: hint bar visual, enemy announce TTS, strict subject rotation

- `MoveSelectBattleMode.jsx` — Added `HintBar` component: Thai shows word + "คืออะไร?", Eng shows word + "= ?", math arithmetic shows `a op b =?` in large Fredoka font, count/pattern/word questions show Thai labels
- `MoveSelectBattleMode.jsx` — DIALOGUE BOX slot replaced: shows `HintBar` during battle (not victoryMode, q exists); falls back to `shownText` battle log during victory and loading
- `MoveSelectBattleMode.jsx` — Enemy name announce on mount: `speakTh(enemy.name + ' ปรากฏตัว')` fires at 700ms; first-question TTS delayed to 1800ms via `isFirstQuestionRef` to avoid cancellation; subsequent questions TTS at 500ms
- `src/lib/battleSubject.js` — `getBattleSubject` rewritten: strict thai→math→eng rotation (`dailyBattleRounds % 3`); `notready` override: if any subject has never been played it wins; old PRIORITY sort + variety safeguard removed
- `src/lib/battleSubject.js` — `getBattleLevel` adds debug `console.log` for xpThai/xpMath/xpEng/dailyBattleRounds and returned level (logic unchanged)

## 2026-06-11 — Fix: 5 UX fixes — dpad center, hint bar, auto-TTS, tall grass battle, enemy collision

- `WorldScreen.jsx` — D-pad repositioned to bottom-center (`left:'50%', transform:'translateX(-50%)'`); opacity 0.75→0.82
- `WorldScreen.jsx` — Tall grass encounter: replaced `ENCOUNTER_TRIGGERED` (was no-op) with `triggerBattle` on random hidden enemy (30% chance, 5-type pool); now correctly enters WorldBattle
- `MoveSelectBattleMode.jsx` — Added `THAI_NUMS`, `numTh()`, `mathToThai()` module-level helpers for math speech
- `MoveSelectBattleMode.jsx` — Added `DotGroup` component; math arithmetic `QuestionHint` now shows colored dot groups (blue for a, orange for b) when both ≤ 10
- `MoveSelectBattleMode.jsx` — `🔊 ฟังอีกครั้ง` / `🔊 Listen` → icon-only `🔊` buttons; math 🔊 speaks via `speakTh(mathToThai(q))`
- `MoveSelectBattleMode.jsx` — Auto-TTS useEffect fires for all subjects (math → Thai number equation via `speakTh`); `handleDismissTeach` extended to speak math equations
- `MoveSelectBattleMode.jsx` — Question hint container `minHeight` 48→58 to accommodate dot row

## 2026-06-11 — Feat: full BGM + SFX sound system + adaptive battle difficulty

- `src/lib/audio.js` — added `playBGM(track)`, `stopBGM(fadeMs)`, `playSFX(name)` exports; 5 primitive helpers (`_t`, `_sweep`, `_noise`, `_arp`, `_vibrato`); 4 BGM tracks (home/world/battle/victory) generated via Web Audio API (no files); 19 named SFX; iOS touchstart AudioContext resume listener
- `src/lib/battleSubject.js` — fixed PRIORITY order (`notready` now ranks before `comfortable` so unplayed subjects appear); variety safeguard (last-3-same-subject → rotate away); `getBattleLevel` now rotates easy(1)→hard(maxUnlocked)→medium(ceil/2) every 3 battles
- `src/components/Home.jsx` — BGM mount/unmount; `playSFX('stage_up')`, `egg_excited`, `egg_pet` wired to interactions
- `src/components/WorldScreen.jsx` — BGM mount/unmount; footstep→`playSFX('footstep')`, tall grass→`tall_grass`, NPC→`npc_talk`, screen transition→`screen_enter`, bunny wake→`enemy_notice`
- `src/components/WorldBattle.jsx` — BGM mount/unmount; `stopBGM()` on battle complete
- `src/games/MoveSelectBattleMode.jsx` — `battle_start` at entry flash, `attack_launch` on tap, `attack_hit/combo/ultra_move` in hit chain, `attack_miss` on miss, `victory` on showVictory

## 2026-06-11 — Fix: battle subject+level driven by child readiness, not enemy type

- `src/lib/battleSubject.js` (REWRITTEN) — `getBattleSubject(sessionLog, state)`: priority sort (exploring→comfortable→notready→strong), rotation tiebreaker via `dailyBattleRounds`. `getBattleLevel(subject, state)`: XP→level via `floor(xpX/120)+1`, clamped to LEVELS max id.
- `src/components/WorldScreen.jsx` — `triggerBattle` uses `getBattleSubject`+`getBattleLevel`; enemy type no longer influences subject or level

## 2026-06-11 — Fix: battle subject uses weakest subject from sessionLog, not hardcoded thai

- `src/lib/subjectReadiness.js` (NEW) — `computeReadiness(sessionLog, world)` extracted from Report.jsx
- `src/lib/battleSubject.js` (NEW) — `getBattleSubject(enemyType, sessionLog)` 3-layer: (1) exploring subject overrides all; (2) enemy preferred if comfortable; (3) sort by rank
- `src/config/enemyConfig.js` — added `subject` to all 7 types: bunny/leaf=thai, slime/mole/egg_pawn=math, fox/mushroom=eng
- `src/components/Report.jsx` — removed local `computeReadiness`, now imports from subjectReadiness.js
- `src/components/WorldScreen.jsx` — replaced `getWeakestSubject` with `getBattleSubject` import

## 2026-06-11 — Feat: creature Beauty Layer — Pokémon-quality rendering

- `src/lib/drawCreature.js` only:
- Added `lighten()/darken()` HSL string helpers, `eyeHighlight()` always-on white dot, `withShadow()` drop-shadow wrapper
- `gradEll()` 3-stop gradient: lighten → base → darken-12 at edge
- `FAM_RATIO` table: 16 family silhouettes applied in `buildGeometry()` (geometry-mean-preserving)
- `_cloudBody()` (3 circles) + `_crystalBody()` (hexagon + facets); `drawBody()` dispatches; belly/pattern skip cloud+crystal
- `drawHorn()` spiral+star wrapped in `withShadow()`; `drawTail()` star-tipped star wrapped in `withShadow()`
- `drawEyes()` eye size cap `hr×0.30`; always-on `eyeHighlight()` for all types except crescent
- `drawCheeks()` fixed opacity 0.73/0.40/0.00
- `drawAmbientGlow()` primary-color radial before aura; `imageSmoothingEnabled/Quality='high'` on canvas

## 2026-06-11 — Feat: 7 enemy types across all screens with movement patterns

- `src/lib/drawEnemy.js` (UPDATED) — Signature changed to `drawEnemy(ctx, type, size, x=0, y=0)` with `ctx.save/translate/restore` for world canvas rendering. Backward-compat aliases: `bunny`=`sleepy_bunny`, `slime`=`bouncy_slime`, `fox`=`fox_kit`. 3 new sprites: `leaf_sprite` (3-leaf wispy figure, #4aaa4a body, white dot eyes), `grumpy_mole` (round brown body, #8a6030, tinted glasses, frown, shovel), `mushroom_imp` (red cap #cc3030 with 3 white dots, scared wide eyes, O-mouth).
- `src/config/enemyConfig.js` (NEW) — `ENEMY_DATA` lookup for 7 types with `nameTH`, `hp`, `level`.
- `src/lib/tileMaps.js` (UPDATED) — `SCREEN_ENEMIES` export: per-screen enemy placement arrays for all 9 screens (3–4 enemies per screen). Static `ENEMY('bunny')` tile in BM_MAP row 11 replaced with grass.
- `src/components/WorldScreen.jsx` (UPDATED) — Imports `drawEnemy` + `SCREEN_ENEMIES`. `enemiesRef` for rAF-safe enemy array. `useEffect([screenId])` initializes enemies with `{id, type, col, row, dir, timer, rngSeed, woken, defeated, respawnTimer}`. `triggerBattle(enemy)` callback: marks defeated+respawnTimer=1800, flash, dispatch, navigate. `tryMove` now uses dynamic enemy collision (replaces T.ENEMY tile check): bumping sleepy_bunny wakes it; all others trigger battle. rAF loop: `updateEnemies` at ~20fps with per-type movement (slime=N/S bounce 45fr, fox=E/W patrol 60fr, egg_pawn=N/S patrol 60fr, leaf/mushroom=random wander 90fr via rngSeed, sleepy_bunny=proximity wake ≤3 tiles+chase 60fr). `renderEnemies`: 32px sprite per enemy at tile center offset by camera; `!` text bubble above woken bunny.
- `src/components/WorldBattle.jsx` (UPDATED) — `WORLD_ENEMY_NAMES` expanded with all 7 types including new ones.
- Build: ✅ zero errors.

## 2026-06-11 — Workflow: ntfy push notification rule

- Added ntfy push notification rule to `CLAUDE.md` for all future tasks. Claude Code must send a curl notification to `ntfy.sh/kidquest-boss` at the end of every task (success or error).

## 2026-06-11 — Feat: Fullscreen map + Pokémon GB battle animations

- `src/lib/particles.js` (NEW) — Canvas particle system: `mkBeam` (extending line + leading orb), `mkOrb` (arc-path orb + trailing ghost), `mkLightning` (seeded zigzag bolt), `mkSparks` (6-dir burst). `tickEffects(ctx, effects, dt)` advances + renders + returns surviving list. `mkOrb` supports `delay` for staggered XP victory.
- `src/games/MoveSelectBattleMode.jsx` (FULL REBUILD) — Enemy 120px top-right + Egg 96px bottom-left. Slide-in entry: CSS `transition:transform 300ms ease-out` — enemy from +120px, egg from -120px, both enter on `setEntered(true)` at 530ms. ResizeObserver-synced `<canvas>` effect overlay in battle field. `spawnEffect('attack'|'combo'|'ultimate'|'miss'|'xp')` uses `getBoundingClientRect()` for canvas-local coordinates. Thai attack=golden orb, Math=green beam, English=lightning, combo=lightning+orb, ultimate=beam+lightning+orb, xp=3 staggered orbs enemy→egg. Compact 2×2 move cards (168px fixed panel). HP bars 10px with threshold color. `GBHPBar` + `EnemyCanvas` sub-components. Victory: enemy defeat + XP orbs + "กลับสำรวจ" button when `showReturnButton`.
- `src/lib/tileEngine.js` (EDITED) — `getCamera`: when `mapPixW <= viewW` returns `-(viewW - mapPixW)/2` (negative = center map). `renderMap`: fills `#3a6a3a` background before tile loop; `startCol/startRow` clamped to `Math.max(0, ...)` to guard negative cam offsets.
- `src/components/WorldScreen.jsx` (EDITED) — Added `orientationchange` event listener alongside `resize`.
- `src/styles.css` (EDITED) — `.move-card-btn { -webkit-tap-highlight-color: transparent }` + `.move-card-btn:active:not(:disabled) { transform: scale(0.94) }`.
- Build: ✅ zero errors.

## 2026-06-11 — Feat: Pokémon GB battle screen + world→battle→world

- `src/lib/drawEnemy.js` (NEW) — Canvas sprite renderer for 4 enemy types (`bunny`, `slime`, `fox`, `egg_pawn`). `drawEnemy(ctx, enemyType, size)` draws at 48-unit design space scaled via `p(v) = Math.round(v * size / 48)`.
- `src/games/MoveSelectBattleMode.jsx` (FULL REWRITE) — GB-style battle layout: enemy canvas 48px top-right with HP bar, egg bottom-left with HP bar. 3-flash white-out on mount. Typewriter dialogue (`▶` prefix, 28ms/char). Enemy lunge + egg white-flash on wrong answer counterattack. Player HP visual-only (starts 60, `Math.max(8, h-8)` per wrong, never game over). New optional props: `enemyData`, `showReturnButton`. `GBHPBar` and `EnemyCanvas` sub-components.
- `src/components/WorldBattle.jsx` (NEW) — World battle wrapper. Reads `state.worldBattleEnemy`, generates 8 questions via inline `genMoveQuestion`. Dispatches `ROUND_COMPLETE`, `LOG_SESSION`, `RETURN_FROM_WORLD_BATTLE` on final question, then `navigate('world')`.
- `src/lib/state.js` — `worldPosition: null` and `worldBattleEnemy: null` added to `defaultState()`.
- `src/context/StateContext.jsx` — 3 new actions: `ENTER_BATTLE_FROM_WORLD` (saves position + enemy), `RETURN_FROM_WORLD_BATTLE` (clears enemy), `CLEAR_WORLD_POSITION` (clears position).
- `src/components/WorldScreen.jsx` — ENEMY tile detection in `tryMove` before `canMove` check: dispatches `ENTER_BATTLE_FROM_WORLD` + `navigate('world-battle')`. `stateRef` added for stale-closure safety. Mount effect restores `worldPosition` via `initScreen` `forcedStart` param.
- `src/App.jsx` — `world-battle` screen route added. BottomNav hidden for `world-battle`.
- Build: ✅ zero errors.
- Docs updated: `CURRENT_STATE.md`, `TASKS.md`, `CHANGELOG.md`, `CHATBOT_NOTES.md`, `green-meadow-implementation-plan.md`.

## 2026-06-10 — Feat: Camera-follow system + fullscreen map

- `src/lib/tileEngine.js` — `getCamera(playerX, playerY, viewW, viewH)`: now accepts viewport dimensions instead of fixed `CANVAS_W/CANVAS_H`. `renderMap()`: culling uses `ctx.canvas.width/height` for dynamic viewport size.
- `src/components/WorldScreen.jsx` — Canvas `width`/`height` attributes = `window.innerWidth/Height`, recalculated on `resize`. Canvas is `position:absolute; inset:0` inside `position:fixed; inset:0` container. D-pad moved from separate DOM section to overlay (`position:absolute`, `bottom: calc(24px + env(safe-area-inset-bottom))`, `left: 24`, `opacity: 0.75`). No flex column layout — single fixed container with absolute children. Render loop uses `canvas.width/height` dynamically for `clearRect` and `getCamera`.
- Result: map fills full viewport, d-pad overlays on canvas, no black space below map.

## 2026-06-10 — Feat: Green Meadow Phase 2 — Canvas Tile Engine

- `src/lib/tileEngine.js` (NEW) — Tile type constants (`T`), GB-palette Canvas 2D renderers (grass/tall/tree/path/water/exit/flower/sign/npc/enemy/itemspot), `renderMap()`, `renderPlayer()` (8-frame directional sprite, egg-stage color), `canMove()` collision, `getCamera()` clamp, `getExitAt()`, `getEntryPosition()` for cross-screen arrival.
- `src/lib/tileMaps.js` (NEW) — BM (Starting Path) full 20×15 tile map (owl NPC row 3, sign row 4, tall-grass rows 5–6, path rows 8–9, enemy row 11, EXIT_N bottom rows 7 side exits). Minimal walkable maps for all other 8 screens (TREE border, GRASS fill, EXIT tiles matching worldConfig connections). `SCREEN_MAPS` registry.
- `src/components/WorldScreen.jsx` (REPLACED) — Canvas tile engine replaces CSS art. rAF game loop (120ms player tween, tile animation frame counter). Virtual D-pad (4-button cross, 56×56px, bottom-left). 25% tall-grass encounter flash → `ENCOUNTER_TRIGGERED`. EXIT tile → 160ms fade transition → new screen entry from opposite edge. NPC proximity detection → 💬 คุย button → Prof Owl Thai dialogue. Sign proximity → 📋 อ่าน → sign lines. Home button + screen name overlaid on canvas. `position:fixed; inset:0` layout.
- `src/context/StateContext.jsx` — Added `ENCOUNTER_TRIGGERED` to ACTIONS enum + no-op reducer case.
- Build: ✅ zero errors.
- `docs/CURRENT_STATE.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/PROJECT_MAP.md`, `docs/CODEBASE_SUMMARY.md`, `CHATBOT_NOTES.md` updated.

## 2026-06-10 — Feat: Green Meadow Phase 1 — World Foundation

- `src/config/worldConfig.js` (NEW) — `SCREENS` 9-entry map (BM/MC/TM/TL/TR/ML/MR/BL/BR), each with `label`, `region`, `connects {N/S/E/W}` (null = no exit). `WORLD_REGIONS` (green-meadow, entryScreen BM). `SCREEN_THEMES` (sky+ground colors + icon per screen for placeholder backgrounds).
- `src/components/WorldScreen.jsx` (NEW) — Full-screen world overlay (`position:fixed;inset:0;zIndex:50`). `StartingPathBG`: CSS art scene with sky, sun/moon, animated clouds, distant hills, ground gradient, perspective trapezoid path, flowers, bushes, pollen particles, day/night support. `PlaceholderBG`: unique gradient + icon per screen. AC-style transition: 160ms dark overlay → screen snap → 160ms fade-in. Direction arrows (N/S/E/W) only shown where connection exists. `egg-home-float` on egg avatar (80×95 EggCanvas). Home button top-left. Screen name top-right.
- `src/lib/state.js` — Added `currentRegion: null`, `currentScreen: null`, `discoveredScreens: []` to `defaultState()`.
- `src/context/StateContext.jsx` — Added ACTIONS: `ENTER_WORLD`, `EXIT_WORLD`, `MOVE_SCREEN`, `DISCOVER_SCREEN`. Reducer cases for all 4.
- `src/components/Home.jsx` — Explore button changed: removes `SET_CURRENT_WORLD`+`SET_SESSION_XP` dispatches; now dispatches `ENTER_WORLD {region:'green-meadow', screen:'BM'}` + `navigate('world')`.
- `src/App.jsx` — `WorldScreen` imported, rendered for `screen === 'world'`. BottomNav now hidden for `game` and `world`.
- `src/styles.css` — `.world-arrow-btn:active { filter: brightness(0.82) }` added.
- Build: ✅ zero errors.
- `docs/CURRENT_STATE.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md`, `docs/SESSION_SUMMARY.md` updated.

## 2026-06-10 — Docs: Green Meadow Gate Questions Answered

- `docs/GPT_NOTES.md` — Green Meadow implementation gate questions answered and frozen. GM-Q1: large edge arrows (no joystick/D-pad). GM-Q2: 80px enemy trigger radius, 120px NPC radius. GM-Q3: Animal Crossing style fade+scroll ~300ms. GM-Q4: unlimited bag (no inventory management). GM-Q5: fullscreen minigame launch, return to world position. WB-Q1: direct entry Home→"ออกสำรวจ"→Green Meadow, no map screen. WB-Q3: region+readiness subject assignment, Green Meadow = Kindergarten content only. WB-Q4: XP from battles + treasure + NPC interactions + collectibles + minigames + exploration. World Bible open questions 1–6 also marked answered. Future questions section added: GM-Q6 (boss rebattle curriculum), GM-Q7 (egg sprite), GM-Q8 (collectible display), GM-Q10 (Post Bird chain), trade system, Sunny Beach unlock, seasonal events.
- `docs/TASKS.md` — Gate question task marked done. Phase 1 unblocked. Phase 2–6 tasks updated with confirmed decisions. World Bible blocking tasks resolved.

## 2026-06-10 — Docs: Green Meadow Implementation Plan

- `docs/research/world/green-meadow-implementation-plan.md` (NEW) — Full 9-phase implementation plan for Green Meadow (Phase 1 World). Each phase specifies: goal, files affected, dependencies, risks, review checklist, success criteria. Phases: (1) World Foundation, (2) Movement, (3) Visible Enemies, (4) NPC System, (5) Treasure System, (6) Minigame Integration, (7) Remaining Enemies, (8) King Clover Bear boss, (9) Polish. New state fields documented (`currentRegion`, `currentScreen`, `pickedUpTreasures`, `collectibles`, `clovers`, `bag`). `worldConfig.js` structure defined. Pre-implementation gate: 8 GPT questions must be answered before Phase 1. Dependency tree shows strict phase order (no reordering). Ranked risk list: navigation UX for age 4 is the highest risk. Chopin playtest checkpoints after Phases 2, 3, 4, 5, 6, 8, 9. No code. No build.
- `docs/TASKS.md` — Phase 1–9 implementation tasks added. WorldMap.jsx superseded task noted.

## 2026-06-10 — Docs: Green Meadow Detailed Design

- `docs/research/world/green-meadow.md` (NEW) — Full hand-authored design for Green Meadow (Phase 1 World). 3×3 screen grid with every screen fully specified: Starting Path (entrance), Town Square (hub), Grandma Turtle's House, Flower Field, Forest Entrance, River Crossing, Clover Hill, Pond & Willow, King Clover Bear Meadow (boss arena). Per screen: theme, visual mood, NPC placement, enemy placement, treasure spots, secrets, weather effects, day/night differences, music variation, special interactions, connections. All 6 Green Meadow enemies designed: Sleepy Bunny, Bouncy Slime, Tiny Fox, Leaf Sprite, Grumpy Mole, Mushroom Imp — each with appearance, movement, personality, animations, battle trigger, retreat behavior. All 5 NPCs designed: Professor Clover Owl, Grandma Turtle, Post Bird, Young Bunny Farmer, Traveling Bee Merchant — location, dialogue style, gifts, mini quests, special interactions. Treasure system: 11 fixed spots, random sparkle system, hidden clover system (27 total), lore collectibles (5 Old Letters). All 5 minigames integrated naturally: EggFishing at river/pond, EggRun via Bunny race, EggTower via ancient tree, EggCatch via butterfly field, EggMemory via Grandma's flower pots. Session loop (10–15 min arc). Full King Clover Bear boss flow: approach sequence, battle, win cutscene, failure philosophy (bear hugs + consolation gift, never lose-framing), replay. Home return system. Future hooks (Sunny Beach entrance, seasonal events, gardening, photo spots). 10 open questions for GPT. No code. No build.
- `docs/GPT_NOTES.md` — Green Meadow Design section added.
- `docs/TASKS.md` — Green Meadow design done; new open questions task added.

## 2026-06-10 — Docs: KidQuest World Bible

- `docs/research/world/kidquest-world.md` — Expanded from philosophy draft to full World Bible. 8 regions fully designed: Green Meadow (Phase 1), Sunny Beach, Crystal Cave, Cloud Kingdom, Moon Forest, Volcano Mountain, Ancient Ruins, Dream Sky. Each region has theme / visual / music / weather / NPC types / enemy families / rare creatures / collectibles / treasure / learning focus / boss / unlock requirements / special mechanics. Boss roster: King Clover Bear → Sleepy Whale → Crystal Deer → Cloud King → Moon Rabbit → Volcano Dragon → Ancient Turtle → Dream Lion (all friendly, not evil). Enemy design guide (cute/funny/warm). NPC guide. Collectibles (6 categories). Future systems section (cooking, gardening, fishing, seasonal events, home decoration, etc.). 10 open questions for GPT. No code. No build.
- `docs/GPT_NOTES.md` — World Bible summary section added with region table, boss roster, open questions.
- `docs/TASKS.md` — World Bible task done; open questions task updated.

## 2026-06-10 — Feat: Egg Home Background Scene

- `src/components/HomeBackground.jsx` (NEW) — Pure decorative CSS/SVG background scene. Day (6am–7pm): warm sky gradient, sun with glow, 3 drifting CSS clouds (pseudo-element bump shapes), soft hills (3 rounded div shapes), grass/ground curve, left+right trees (trunk div + leaf oval), 2 bushes, nest glow ellipse, tapered path, 6 flowers (box-shadow petal technique). Night (7pm–6am): dark sky, moon + crescent shadow overlay, 12 twinkling stars, night magic particles (floating purple dots). 4 CSS keyframes: `hbg-drift-r/l` (cloud drift), `hbg-twinkle` (stars), `hbg-float-magic` (night particles). All elements `pointerEvents:none`, `zIndex:-1`.
- `src/components/Home.jsx` — Import HomeBackground. Add `hour` + `isDay` computed values. `<HomeBackground hour={hour} />` as first child. Header: backdrop blur + day/night text colors. Item tray + action row: backdropFilter + day/night panel colors. Action buttons: day white / night dark.
- `src/styles.css` — `#egg-home` gets `position:relative`, background gradient removed. `.hbg-cloud` base + `.hbg-cloud-1/2/3` position + animation. 4 keyframes. `prefers-reduced-motion` disables cloud animations.
- Commit: `17bedf9`.

## 2026-06-10 — Fix: Robust Egg Interaction State Machine

- `src/components/Home.jsx` — Complete interaction system rewrite. `triggerAnim` removed. New formal FSM: `smRef` tracks `{ state, comboCount, enteredAt }`. States: `idle/pet/happy/excited/eating/sleep/relax/reunion`. `enterState(name, dur?)` cancels in-flight RAF (generation counter via `enterGenRef`) and exit timer before starting new transition; RAF callback is a no-op if superseded. `extendState(name)` resets exit timer only — no CSS class flicker for same-tier repeat taps. Tap combo: taps 1–3=pet bounce, 4–7=happy-spin (upgrade transition), 8+=excited+sparkles+hearts. Combo resets via `comboResetRef` after 3s inactivity. Item use (food/ribbon/potion/star) resets combo and calls `enterState`. Watchdog `setInterval(5000)` force-returns to idle if stuck non-idle >6s. Unmount cleanup cancels RAF + all timers. `petStreak` useState removed. Commit: pending.

## 2026-06-10 — Fix: Egg Home Rapid Tap Freeze

- `src/components/Home.jsx` — Three bugs fixed. (1) `triggerAnim` now cancels pending RAF via `rafRef` and uses `animGenRef` generation counter so orphaned timer/RAF callbacks are no-ops. (2) `petStreakRef` replaces stale `petStreak` closure reads in `handlePetEgg`. (3) 150ms cooldown via `lastPetRef` absorbs hyper-rapid taps. Also resets `petStreakRef.current` in the 6s inactivity timer; unmount cleanup cancels pending RAF. Commit `3e9ebed`.

## 2026-06-10 — Fix: Procedural Creature Detail Popup

- `src/components/CreatureDetailPopup.jsx` — Replaced legacy `drawCreature` (creatureAlgorithm.js) + manual canvas with `<CreatureCanvas dna={dna} size={196} animationEnabled>`. Accepts `dna` prop from Collection. Layout: creature 196px centered at top, name/info below, egg mini+XP bars, stats, abilities. Legacy emoji badge in corner. Commit `5de06e9`.
- `src/components/Collection.jsx` — `selectedEgg` state changed to `{ egg, dna }`. `CreatureCard` calls `onSelect(egg, dna)`. `handleSelect` passes both to popup. Ensures grid and popup use identical DNA. Commit `5de06e9`.

## 2026-06-10 — Collection: Procedural Creature Preview for Legacy Eggs

- `src/lib/creatureGenerator.js` — NEW: `buildLegacyPreviewDNA(egg, index)`. Primary: `buildCreatureDNA(egg.eggStats)`. Fallback: hash(name+emoji+rarity+index) → synthetic stats → `buildCreatureDNA`. Emoji nudges: 🐉→streak:82 (dragon), 🦊→eng+speed (fox), 🦄/🤖/💎→math (crystal), ⚡→streak:82 (star), 🦅→eng+speed (bird). Never persisted. Commit `8c393f7`.
- `src/components/Collection.jsx` — Replaced legacy canvas+useEffect+`drawLegacyCreature` with `<CreatureCanvas size={120}>`. `useMemo` ensures stable DNA reference. Legacy emoji badge (bottom-right corner) for old creatures. Removed `creatureAlgorithm.js` import entirely. Commit `8c393f7`.
- `src/styles.css` — `.catalog-grid-lg` (2-column), `.catalog-item-lg` (larger padding, bigger font). Commit `8c393f7`.

## 2026-06-10 — Procedural Character System Phase 3: Creature Personality & Animation

- `src/lib/drawCreature.js` — `drawCreature(canvas, dna, anim={})` now accepts optional animation state. `drawEyes` applies `blinkAmt` (0=open, 1=closed): scales eye y-radius by `1 - blinkAmt * 1.25`; below `bScale < 0.12` draws gentle closed-eye curve; crescent/button eye types squash via `ctx.save/translate/scale`. New `drawSleepZ(ctx, G, C, particles, sc)` draws floating 'z' glyphs using accent hue. Commit `658d25c`.
- `src/components/CreatureCanvas.jsx` — Full rewrite. RAF animation loop drives blink state machine (`open → closing → closed → opening`) with personality-specific rate and ±1s jitter. Sleep Z-particle system: spawn/float/fade particles passed to `drawCreature` as `sleepParticles`. Props added: `personality`, `animationEnabled` (default `true`), `idleMode` (`'idle'|'sleep'|'celebrate'`). CSS idle class derived from personality + idleMode applied to canvas element. Commit `658d25c`.
- `src/styles.css` — 8 CSS keyframe sets (`ci-happy`, `ci-curious`, `ci-brave`, `ci-playful`, `ci-gentle`, `ci-sleepy`, `ci-shy`, `ci-celebrate`) and matching animation classes. Each keyframe combines breathing (scale) + body bob (translateY) tuned per personality speed. `@media(prefers-reduced-motion:reduce)` disables all `ci-*` classes. Commit `658d25c`.

## 2026-06-09 — Procedural Character System Design v3 (Egg-to-Creature Identity)

- `docs/research/creatures/procedural-character-system.md` — NEW SECTION: **Egg-to-Creature Identity**. Core rule: family derived from egg visual motif first; stats modify creature within that family. Motif detection logic (isNight → Moon; ha gold + streak ≥ 14 + stage ≥ 5 → Star; h1 hue ranges → Leaf/Ocean/Cloud/Crystal/Ember). Motif catalog (7 named motifs with visual descriptions). Family mapping from egg motif with named examples (Moon Fox / Moon Bunny / Moon Puff / Moon Dragon / Star Puff / Star Bird / Star Cat / Leaf Bear / Ember Fox / Ember Dragon, etc.). Concrete inheritance examples table. Updated Family Determination Logic (motif-first, stat-fallback for no-motif eggs). Updated Egg-to-Creature Visual Continuity section (now references Identity section, adds motif row to hard-continuity table). Future note: Egg Visual Identity Pass may require CSS overlay or planned `drawEgg()` modification so eggs look more clearly motif-typed. Open questions expanded to 10 (Q9: egg legibility, Q10: Ember as 17th family).
- `docs/GPT_NOTES.md` — Egg-to-Creature Identity section added; open questions updated to 10.
- `docs/TASKS.md` — Design v3 task marked done; GPT questions updated to 10.
- No code changes. No build.

## 2026-06-09 — Procedural Character System Design v2 (Beauty Layer + Families + Migration)

- `docs/research/creatures/procedural-character-system.md` — REVISED. Added: **Beauty Layer** (between Art Direction and Animation — sticker test, tinted outline, eye gloss, body radial gradient, cheek gradient, signature feature amplification, harmony check, breathing room, collection background aura). Added: **16 Family Archetypes** (Puff/Fluff/Bear/Cat/Fox/Bunny/Bird/Dragon/Leaf/Star/Moon/Cloud/Crystal/Ocean/Flower/Dream — visual themes not species; family determined first; 2–3 locked features per family; sibling relationship). Added: **Signature Feature System** (17 traits: mega-cheeks, two-color-eyes, heart-cheek, star-freckle, mega-ears, curly-tail, twin-tails, large-bow, body-glow-spot, etc.; one per creature; amplified by Beauty Layer; has own idle micro-animation). Added: **Existing Collection Migration** section (old emoji creatures → legacy render path; new hatches → `dna` field → canvas; same seed = same character forever; no data loss). **Removed Phase 2 emoji-composite** from implementation path. New **5-phase path**: P1 DNA extraction → P2 drawCreature() canvas → P3 Animation → P4 Voice → P5 Birth sequence. Updated combination math: ~340M valid creatures. Updated open questions: 8 questions, Q1 (canvas vs emoji-composite) resolved by removing emoji composite.
- `docs/GPT_NOTES.md` — Procedural Character System section updated with revised architecture, new decisions (Beauty Layer, families, signature features, migration), 5-phase path, 8 open questions.
- `docs/TASKS.md` — Design v2 task marked done; emoji-composite Phase 2 task replaced with Canvas renderer task; Phase 3–5 tasks updated.
- No code changes. No build.

## 2026-06-09 — Procedural Character System Design

- `docs/research/creatures/procedural-character-system.md` — NEW. Full architecture for infinite creature generation without fixed monster pools. Core: re-uses `hash()` + `prng()` from `eggAlgorithm.js` (imported, never modified) to derive creature DNA from egg stats. 40+ gene attributes (body/face/ears/horns/wings/tail/pattern/accessories/glow). Art direction layer enforces cute/warm/huggable constraints for ages 4–6. 7 personality types (Happy/Curious/Brave/Playful/Gentle/Sleepy/Shy) derived from learning profile at hatch time. Animation + voice layers. Egg-to-creature visual continuity (same hue values carry over; 60–75% feature echo probability). Feature richness scales by hatch stage. ~42M valid combinations. 4-phase implementation path. 10 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Creatures section added.
- `docs/GPT_NOTES.md` — Procedural Character System section with key decisions and 7 GPT open questions.
- `docs/TASKS.md` — Design task done; Phase 1–4 implementation tasks added.
- No code changes. No build.

## 2026-06-09 — Dramatic Egg Stage Progression

- `src/lib/eggAlgorithm.js` — `EGG_STAGES` changed 7→9. `EGG_STAGE_NAMES` updated to 9 Thai names: ไข่น้อย / ไข่อบอุ่น / ไข่มีความสุข / ไข่แวววาว / ไข่วิเศษ / ไข่เปล่งแสง / ไข่โบราณ / ไข่แตกร้าว / ใกล้ฟักแล้ว!!!. `drawEgg()`, `hash()`, `prng()` untouched — visual spread naturally adjusts via `progress = stage/8` (was `stage/6`).
- `src/lib/audio.js` — 2 new SFX: `stageUp` (5-note ascending triangle fanfare + 2 sine accents); `heartbeat` (two-beat lub-dub low sine, 90→38Hz).
- `src/styles.css` — 9 `@keyframes egg-aura-s*` (s2–s8) with pulsing `drop-shadow` growing in intensity/frequency per stage. 9 `.egg-s*` classes apply persistent aura on EggCanvas. `@keyframes stage-up-pop` + `.stage-up-banner` for pop/float/fade celebration overlay.
- `src/components/Home.jsx` — `EGG_STAGES` imported. `stageUp` state + `prevStageRef` for stage-up detection. Stage-up `useEffect`: detects stage increase → `stageUp` sound + 18 sparkle + 6 heart particles + `.stage-up-banner` overlay (2.8s, auto-clear). Heartbeat `useEffect`: plays `heartbeat` once + every 8s when `readyToHatch`. `readyToHatch` updated to `stage >= EGG_STAGES - 1`. Excited mode threshold updated 5→7. `stageDots` uses `EGG_STAGES` constant (was hardcoded 7). `EggCanvas` gets `egg-s${stage}` class (merged with temp `egg-glow-*` — glow overrides aura during interactions). Stage header: 9-color dot+name tints per stage, smaller dots (7px, was 9px), color transitions on stage change.
- Build ✅. Commit: `feat: dramatic egg stage progression`. Pushed.

## 2026-06-09 — Egg Home Emotional Life

- `src/components/Home.jsx` — New idle behaviors: `idle-blink` (fast Y-squish, ~blink), `idle-look` (gentle tilt, curious), `idle-yawn` (slow stretch + settle) added to the 5–12s random idle pool. Creature companion gains personality state machine (walk/wave/sit/celebrate/gift/look/sleep, 20–45s cycle): `wave` → creature bounces + 👋 inline + chirp sound; `sit` → tilted 14° + static; `celebrate` → jump loop + 🎊 + sparkle particles + celebrate sound; `gift` → 🎁 shown; `look` → 👀 shown; `sleep` → dim opacity + 💤. Creature patrol pauses during non-walk states. Directional flip wrapped separately from animation class so they don't conflict. Ambient events: butterfly 🦋, falling leaf 🍂, shooting star ✨ — `position:fixed` CSS animations, triggered every 38–88 seconds, visual only, no mechanics. Reunion enhanced: hearts+sparkle combined burst + double chirp. Ribbon: changed from `pet` to `happy-spin` (proud spin). Star: combined sparkle+hearts burst.
- `src/lib/audio.js` — Added `yawn` sound: low descending sine (290→165Hz, 0.94s).
- `src/styles.css` — 12 new keyframes/classes: `idle-blink`, `idle-look`, `idle-yawn`, `creature-wave`, `creature-celebrate`, `creature-overlay-bob`, `ambient-butterfly`, `ambient-leaf`, `ambient-shooting-star` + CSS classes for new idle and creature animations.
- Build ✅. Commit: `feat: egg home emotional life`. Pushed.

## 2026-06-09 — Home Bottom Layout Overlap Fix

- `src/styles.css` — Added `#root { height:100%; width:100%; display:flex; flex-direction:column; overflow:hidden }`. This fixes the height propagation chain (html→body→#root) so that `height:100%` on children resolves correctly. Also increased `#egg-home` padding-bottom from `calc(60px + safe)` to `calc(76px + env(safe-area-inset-bottom))` — actual nav height is 95px (61px buttons + 34px safe area), previous value was 94px (1px short).
- `src/components/Home.jsx` — Changed root div `height:'100%'` → `height:'100dvh'` and split `overflow:'hidden'` → `overflowX:'hidden', overflowY:'hidden'`. `100dvh` (dynamic viewport height) works independently of the parent height chain and adjusts correctly for iOS Safari's retractable browser toolbar. Belt-and-suspenders with the #root CSS fix.
- Build ✅. Commit: `fix: home bottom layout overlap`. Pushed.

## 2026-06-09 — Egg Home Emotional Polish

- `src/components/Home.jsx` — Full rewrite. Flying food animation (fixed-position emoji flies from tray up to egg center, egg eats it). Per-item glow effects via CSS `drop-shadow` on EggCanvas (`egg-glow-warm/blue/gold/pink`). Ribbon 🎀 overlay (persists on egg after use, top-right corner). Star orbit: two `.egg-star-orbit` divs rotating around egg when XP boost active. Random idle micro-animations: every 5–12s, `idle-wiggle` or `idle-jump` fires (25% chirp, 8% begging sound) — egg feels alive without interaction. `stageRef` + `eggAnimRef` fix stale closure in `triggerAnim` and idle scheduler. Food chain: flyingItem set → 360ms → eat anim + chew sound + warm glow → 620ms: flyingItem clear → 870ms: sigh sound. Ribbon: jingle + pink glow + pet anim. Potion: slurp + blue glow + relax anim. Star: celebrate + gold glow + happy-spin. Pet streak 3 → giggle sound. Layout: inline `paddingBottom:66` removed; CSS `#egg-home` rule handles safe-area-aware padding.
- `src/lib/audio.js` — 6 new SFX: `chew` (3-hit crunch), `slurp` (rising sine + accent), `giggle` (4-step ascending triangle pairs), `sigh` (descending sine fade), `celebrate` (6-note ascending fanfare), `begging` (rising-falling sine breath).
- `src/styles.css` — EGG HOME section expanded: `egg-anim-eat`, `egg-anim-relax`, `egg-anim-idle-wiggle`, `egg-anim-idle-jump`, `food-fly-up`, `egg-glow-warm/blue/gold/pink`, `star-orbit` keyframes and classes. Layout: `#egg-home` `padding-bottom: calc(60px + env(safe-area-inset-bottom))` fixes iPhone safe area overlap.
- Build ✅. Commit: `feat: egg home emotional polish`. Pushed.

## 2026-06-09 — Egg Home MVP

- `src/components/Home.jsx` — REPLACED. Old Home (Adventure Director, subject grid, Egg Run, stats strip) removed. New Egg Home: large egg center (190×225px), idle float animation, stage 5+ excited pulse, pet interaction (chirp+sparkle+hearts), streak happy-spin + sleepy, reunion burst on first visit or >4h gap, item tray (food/ribbon/potion/star, count badges, tap-twice-to-use), creature companion walks left-right after first hatch (tap for chirp+bounce), action row (ลูบไข่ / คอลเลกชัน / ออกสำรวจ), warm gradient background.
- `src/lib/state.js` — Added `lastHomeVisit: null` to `defaultState()`.
- `src/context/StateContext.jsx` — Added `UPDATE_LAST_HOME_VISIT` action + reducer case.
- `src/lib/audio.js` — Added 4 new SFX to `playTone()`: `chirp` (high cute chirp), `sparkle` (ascending twinkle), `jingle` (ribbon jingle), `feed` (eating sound).
- `src/styles.css` — Added Egg Home keyframes: `egg-home-float`, `egg-home-excited`, `egg-anim-pet`, `egg-anim-happy-spin`, `egg-anim-reunion`, `egg-anim-sleepy`, `particle-rise`. Added CSS classes: `.egg-anim-float/excited/pet/happy-spin/reunion/sleepy`.
- Build ✅. Commit: `feat: egg home mvp`. Pushed.

## 2026-06-09 — Egg Home Design (docs only)

- `docs/research/world/egg-home.md` — NEW. Full Egg Home design. Goal: child feels "I want to visit my egg." Covers: screen layout (390px portrait), egg zone (160–200px center, stage-aware appearance), item tray interactions (pet/feed/ribbon/potion/star with distinct visual rituals), mood system (happy/content/quiet/excited/reunion — visual only, no stat bars), stage progression in Home (stages 1–7 with distinct egg behaviour), creature companion (walks left-right, tap for reaction), return loop motivators (intrinsic only: reunion burst, near-hatch excitement, items waiting), Year 1 MVP scope, 10 open questions for GPT.
- `docs/GPT_NOTES.md` — Egg Home Design section added at top.
- `docs/TASKS.md` — Egg Home design task marked done; GPT open questions task added.
- `docs/SESSION_SUMMARY.md` — Updated.
- `docs/GPT_HANDOFF.md` — Latest session summary updated.
- No code changes. No build.

## 2026-06-09 — KidQuest World Design (docs only)

- `docs/research/world/kidquest-world.md` — NEW. Full design document for the world-based game model. Covers: philosophy shift (game-first, learning hidden), Chopin's direct playtesting feedback ("boring" / "not like a game"), emotional center (egg is the hero), high-level loop (Egg Home → explore → encounter → battle → reward → grow → hatch), Egg Home spec, World Map structure (screen-based, Pokémon FireRed model), region list (Year 1 = Green Meadow only), exploration events, battle's new role, learning hidden curriculum principle, transition from current state, Year 1 MVP scope, 10 open questions for GPT.
- `docs/GPT_NOTES.md` — KidQuest World section added at top. Records: Chopin's feedback, philosophy decision, emotional center decision, high-level loop, map structure decision (screen-based), Year 1 scope (Green Meadow), 10 open questions, what Claude Code must NOT touch until GPT answers.
- `docs/TASKS.md` — KidQuest World design phase tasks added at top of Now section: world doc (done), GPT open questions (pending), Egg Home design, World Map design, Encounter design, implementation queue (blocked on design).
- `docs/SESSION_SUMMARY.md` — Updated.
- `docs/GPT_HANDOFF.md` — Updated with new session summary and revised current state.
- No code changes. No build.

## 2026-06-09 — Educational Visuals for Math Counting

- `src/config/gameConfig.js` — Added `COUNTABLE_GROUPS` (3 semantic categories: fruits 🍎🍌🍓🍊🍒, animals 🐟🐱🐶🐰🐸, everyday 🧸⭐🎈🌸🚗) and `COUNTABLES` (flat export). Updated `PATTERN_SETS.AB`: removed game meta-item `🥚` (egg), added educationally coherent pairs — shapes `['🔺','🔵']`, fruits `['🍎','🍌']`, animals `['🐱','🐶']`. Updated `TEACH_CONTENT.math[0]` examples (🥚🥚🥚 → 🍎🍎🍎, ⭐×5 → 🐟×5). Updated `TEACH_CONTENT.math[8]` pattern examples to match new pattern sets.
- `src/games/GameMath.jsx` — Removed local `COUNTABLES`. Imports `COUNTABLES, COUNTABLE_GROUPS` from gameConfig. `genQ` for `objects` visual model now picks both `emojiA` and `emojiB` from the same semantic group (e.g. 🍎+🍌, 🐱+🐶), so addition visuals are coherent instead of random cross-category pairs.
- `src/games/GameMathBattle.jsx` — Removed local `COUNTABLES`. Imports from gameConfig.
- `src/games/GameSubjectAdventure.jsx` — Removed local `COUNTABLES`. Imports from gameConfig.
- Build: ✅ zero errors. Commit: b050fd1.

## 2026-06-09 — True Full-Screen Mobile Battle Layout (bug fix)

- `src/games/GameScreen.jsx` — Adventure worlds now use `position:fixed;inset:0;zIndex:50` overlay, fully escaping all parent flex constraints. Absolute-positioned `←` back button (z-index 200). Inner `flex:1` div contains the game tree.
- `src/styles.css` — Removed `align-items:center` from `#root` rule. `#root` now only stretches children (no centering). Home still centers itself internally — safe change.
- `src/games/GameSubjectAdventure.jsx` — Default export wrapped in `flex:1/minHeight:0` div so Session fills the overlay. `ResultScreen` root changed `minHeight:'100%'` → `flex:1` for reliable viewport fill in flex context.
- `src/games/MoveSelectBattleMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- `src/games/ChaseMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- `src/games/DefenseMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- Build: ✅ zero errors. Commit: 2ba7922.

## 2026-06-09 — Mobile Playtest Polish: Full-Width UI + Simplified Answer Cards

- `src/games/GameScreen.jsx` — Adventure worlds (`adventure-*`) now use a dedicated full-width container: no `maxWidth`, no `alignItems:'center'` (defaults to stretch), `overflow:'hidden'`. All other worlds keep the existing `maxWidth:480 / alignItems:center` container. Root cause of white-margin bug: `alignItems:'center'` on the flex column container prevented game components from stretching to full width.
- `src/games/MoveSelectBattleMode.jsx` — Removed attack identity layer entirely. Deleted: `ICONS` array, `MOVE_NAME` map, `moveIcons` useMemo, `shuffle` import, `useMemo` import. `MoveCard` now shows **only the learning answer** — no element icon above, no attack name below. Font size adapts to content: ≤2 chars→64px (emoji, digit), ≤4 chars→54px, longer→44px. Battle log for simple hit changed from `"⚡ Thunder! +N XP"` to `"⚔️ โจมตี! +N XP"`. Chunk size: 36.72→36.22 KB.
- Build: ✅ zero errors. Commit: a8759ea.

## 2026-06-09 — Adventure Mode UI 2.0

- `src/games/DefenseMode.jsx` — Full layout redesign. Enemy (attacker) enlarged from 90px → 120px emoji. Removed `QuestionDisplay` component (44px emoji + word + subtext — was dominating the screen). Replaced with compact `QuestionHint` (28px emoji + 🔊 button only, or tiny math/count display). Hit flash overlay added (crit-flash keyframe). Miss animation on wrong choice button (`miss-fizzle`). Red button highlight on wrong tap. Combo indicator top-left (no large badge). Mode text labels removed. Vertical stack unchanged: Enemy → Shield → Egg. Egg gets continuous `egg-idle 3s` idle animation. Move panel: `flex:1` takes bottom half, `flexShrink:0` on all headers.
- `src/games/ChaseMode.jsx` — Full layout redesign. Target emoji enlarged from 64px → 120px, moved to top center (was top-right corner). Removed `QuestionDisplay`. Replaced with same compact `QuestionHint`. Chase track slimmed from 70px → 32px. Egg on track stays (28px canvas). Hit flash overlay added. Miss animation on wrong button. Combo indicator top-left. Target now shows "จับได้แล้ว!" + victory-bounce when dist≥100. Slim track shows gold fill when dist≥80 ("⚡ ใกล้แล้ว!" label inside).
- `src/games/MoveSelectBattleMode.jsx` — Egg idle animation: default state now `egg-idle 3s ease-in-out infinite` instead of `none`. Question hint min-height reduced 46→36px. Minor layout tightening.
- `src/styles.css` — New keyframe `egg-idle` (gentle float + rotate, 3s ease-in-out). Added to `prefers-reduced-motion` suppression.
- Build: ✅ zero errors. GameSubjectAdventure chunk: 36.72KB.

## 2026-06-04 — Pokémon-Style Learning Battle (all 3 subjects)

- `src/games/MoveSelectBattleMode.jsx` — NEW. Pokémon-style battle shell replacing BattleMode in Subject Adventure Engine. One component serves Math/Thai/English via subject adapters. Move panel: 2×2 grid, each card shows `[element icon] [answer content]` (number for Math, emoji for Thai/Eng). No player HP. Wrong answer = miss fizzle + "โจมตีพลาด!". Combo system: streak 2=glow, 3=combo flash, 4+=CRITICAL ×1.5 damage. Ultimate: after 3 consecutive correct, ultimate charges (×2 damage on next correct). Boss encounters at 12% rate. Victory after last question: enemy defeat animation → confetti → fanfare → result screen. Teach intro overlay shown on first-ever play of a level. Anticipation sequence: tap → card pulse → egg charge → egg lunge → hit/miss effects. TTS fires on Thai/English question load. Egg companion: all existing EggCanvas animations, near-hatch glow, combo glow ring.
- `src/games/GameSubjectAdventure.jsx` — Added `genThaiMoveQ()` and `genEngMoveQ()` generators that return emoji choices (not letter choices) for the battle move panel. `genMoveQuestion()` dispatcher selects format by subject. Session now generates battle questions with `genMoveQuestion` when mode is 'battle', classic questions for chase/defense. Replaced `BattleMode` import with `MoveSelectBattleMode`. Passes `isFirstLevel` prop. `ResultScreen` updated: hides score/accuracy from child (score still in sessionLog for parent Report), shows 🎉 ชนะแล้ว! + +XP + ไข่โตขึ้น! only.
- `src/lib/audio.js` — 3 new `playTone()` types: `miss` (soft descending fizzle, no harsh sound), `combo` (rising 3-note chime), `ultimate` (7-note ascending power fanfare).
- `src/styles.css` — 5 new keyframes: `move-pulse` (card tap scale+glow), `egg-charge` (vibrate in place), `miss-fizzle` (card fades/blurs), `enemy-defeat` (enemy shrinks and fades), `crit-flash` (screen flash). Added to `prefers-reduced-motion` suppression.
- Build: ✅ zero errors. GameSubjectAdventure chunk: 36.39KB (was 32.40KB).

## 2026-06-04 — Battle Feel Polish Pass (docs only)

- `docs/research/gameplay/pokemon-style-learning-battle.md` — Updated to align fully with `battle-feel-philosophy.md`. Removed: player HP bar, defeat screen, gentle defeat section, losing states, "every 3 wrong = counter attack" mechanic. Wrong answer philosophy changed: wrong → attack misses → soft fizzle → enemy laughs/taunts → continue (no punishment accumulation, no strike count, no anxiety). Move names reduced: icons + answers are primary; move names are tiny flavor text below icon (or hidden entirely). Move card examples updated to show icon + answer only. Battle log aligned to short format: "⚡ Thunder!", "โจมตีพลาด!", "คอมโบ!", "CRITICAL!", "ชนะแล้ว!". Open question 3 (player HP) resolved: removed. Audio: `gentle-defeat` tone removed; `enemy-taunt` added. Session structure: defeat condition removed, replaced with "child cannot lose" statement. Visual anatomy: player HP bar removed from diagram. Authority note added: Battle Feel Philosophy governs all conflicts.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section updated with all Battle Feel Polish decisions.
- `docs/TASKS.md` — Battle Feel Polish Pass task added and marked done.
- No code changes. No build.

## 2026-06-04 — Battle Feel Philosophy Design

- `docs/research/gameplay/battle-feel-philosophy.md` — NEW. Defines the sensory and emotional grammar for all Subject Battle implementations. Covers: core "battle is the experience" principle, visual hierarchy (enemy > HP > log > move panel), player HP removal rationale, wrong-answer philosophy (miss not punishment), full anticipation sequence (10-step tap-to-result chain), sound philosophy (cute/positive/Pokémon-like), combo system (streak 2→3→4 = crit ×1.5), victory sequence (enemy defeat → stars → confetti → egg celebrates), battle log spec (1-line, Thai-first), animation philosophy (fast/CSS/reuse existing keyframes), screen layout reference, implementation priority (feel before content), 5 open questions before implementation.
- `docs/RESEARCH_INDEX.md` — Battle Feel Philosophy entry added to Gameplay section.
- `docs/GPT_NOTES.md` — Battle Feel Philosophy section added with player HP decision and combo philosophy.
- `docs/TASKS.md` — Battle Feel design task added and marked done; PSLB-0 (feel baseline) inserted before PSLB-1.
- No code changes. No build.

## 2026-06-04 — Pokémon-Style Learning Battle Design

- `docs/research/gameplay/pokemon-style-learning-battle.md` — NEW. Full design document. Battle-first framing: answer choices ARE attack moves (not a quiz with battle decoration). Covers: move-select panel anatomy (`[icon] [name] ... [answer]`), subject encoding per subject (Math=numbers as damage, Thai/English=emoji+TTS), full battle flow (8 steps per turn), move name sets per subject, screen layout spec, animation list (14 keyframes), audio list (8 new tones), egg integration (child's egg is the hero), session structure (8 turns / 1 enemy), subject battle shell principle (one component, three content types), MVP recommendation (Math first → Thai → English → polish), scope check (passes Year 1 guardian), 5 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Gameplay section updated with pokemon-style-learning-battle.md entry.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section added with key decisions and open questions.
- `docs/TASKS.md` — Design task marked done; PSLB implementation queue added (PSLB-1 through PSLB-5).
- No code changes. No build.

## 2026-06-04 — Egg Companion Adventure MVP

- `src/games/BattleMode.jsx` — EggCanvas replaces `🦸` player avatar. Egg jumps (`eggBounce`) + gold glow + `✨` sparkle float on correct answer. Egg shakes (`eggShake`) when enemy counter-attacks. Continuous `egg-near-hatch` pulse/glow at stage ≥ 5. Egg growth progress bar below battle log: stage name + progress bar + %. `item` sparkle tone fires 200ms after every correct answer.
- `src/games/DefenseMode.jsx` — EggCanvas replaces generic baby emoji. Egg bounces on shield-block; shakes when hit. Sparkle tone on correct.
- `src/games/ChaseMode.jsx` — EggCanvas replaces `🦸` runner. Egg dashes on correct. Sparkle tone on correct.
- `src/games/GameSubjectAdventure.jsx` — Passes `eggStats`, `eggProgress`, `readyToHatch` props from `useAppState()` to all 3 modes.
- `src/styles.css` — `egg-near-hatch` keyframe: combined scale + golden glow pulse (looping, for stage 5–6 eggs).
- Build ✅ zero errors.

## 2026-06-04 — Egg Companion Adventure Design

- `docs/research/gameplay/egg-companion-adventure.md` — NEW. Full design document. Covers: egg as emotional companion (not progress bar), companion framing across all modes (DefenseMode = egg being defended, BattleMode = egg beside player, ChaseMode = egg dashes with player), visual/audio/progress behavior spec, relationship data fields (adventuresWith/questionsAnswered/daysTogetherCount/favoriteSubject/bornFrom), MVP recommendation (DefenseMode egg first, then BattleMode, then relationship data), hatch biography payoff design, non-goals (no egg HP, no egg health from mistakes, no numbers during gameplay), 5 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Gameplay section added with egg-companion-adventure.md entry.
- `docs/GPT_NOTES.md` — Egg Companion Adventure Philosophy section added.
- `docs/TASKS.md` — Design task marked done; ECA implementation queue added (ECA-MVP-1 through ECA-5).
- No code changes. No build.

## 2026-06-04 — Subject Adventure Engine MVP

- `src/games/GameSubjectAdventure.jsx` — NEW. Orchestrator: generates 8 questions per session from existing content (genMathQ respects player level; genThaiQ from TH_ALPHA emoji→letter; genEngQ from EN_ALPHA emoji→letter). Picks mode deterministically: `MODES[(dayN + playCount) % 3]` so it rotates battle→chase→defense daily per subject. Dispatches ADD_XP, ROUND_COMPLETE, UPDATE_LEVEL_MASTERY, UNLOCK_LEVEL (≥80% score), LOG_SESSION. TTS via useEffect on cur change (speakTh for Thai, speakEn for English). Key-based replay (session key increments → full remount = fresh state + new mode).
- `src/games/BattleMode.jsx` — NEW. Subject-specific enemies (math: 🤖👻😈🐲, thai: 👺🐻🐉🐯, eng: 👾👽⛈️🦾). Enemy HP bar + player HP bar. Correct: adv-jump animation + enemy red flash + floating damage number. Crit at streak≥2: ×1.5 damage + confetti + streak-bounce badge. Wrong ×3: enemy counter-attack + player shake + HP damage. combo badge shown when streak≥3.
- `src/games/ChaseMode.jsx` — NEW. Horizontal distance track. Start at 30%, +14% per correct (×1.5 on crit), -10% per 3rd wrong. adv-dash animation on correct. Target emoji at right end, player 🦸 trails behind. Distance label updates. "dash" SFX on correct.
- `src/games/DefenseMode.jsx` — NEW. Baby creature (🥚/🐣/🌟 by subject) + shield with pip HP (one pip per question). Attacker → shield ← baby layout. Correct: adv-shield bounce + attacker pushed back + "block" SFX. Wrong ×3: shield pip lost + shake. Shield glows on block via filter.
- `src/games/GameScreen.jsx` — Lazy import + 3 routes for adventure-thai/adventure-math/adventure-eng, each passing subject prop.
- `src/components/Home.jsx` — "learn" recommendation routes to `adventure-{world}`. Label/icon updated per subject mode (Math→⚔️, Thai→🛡️, Eng→🏃). Classic games still accessible via "อยากเลือกเอง?" grid.
- `src/lib/audio.js` — `dash` tone (ascending 3-note sawtooth sweep, chase correct); `block` tone (low square thump, defense correct).
- `src/styles.css` — `adv-jump` (player leaps), `adv-dash` (player dashes forward), `adv-shield` (shield bounces on block).
- Build: ✅ zero errors. GameSubjectAdventure lazy chunk: 30KB.

## 2026-06-04 — Battle special move timing + accessibility

- `src/components/BattleScreen.jsx` — Special move prompt moved from pre-battle question phase to mid-battle surprise. Battle now starts immediately (`phase` initialised to `'fighting'`). Special prompt appears as a semi-transparent overlay after attack 2 or 3 (random), while the battle screen remains visible behind it. New question format: Math shows emoji counting (`🍎🍎` → tap 2), Thai/English uses TTS (`speakTh`/`speakEn`) with emoji choices (e.g. "ปลา" → 🐟/🐱/🐶). 🔊 replay button on Thai/English prompt. Correct → exciting special SFX fires immediately + `victory-bounce` "🔥 ท่าพิเศษพร้อมแล้ว!" feedback → special attack animates in battle; Wrong/Skip → gentle "💪 สู้ต่อไปนะ!" or no feedback, battle continues normally — no penalty. HP tracking changed from absolute (log snapshot) to relative (damage-delta) so special damage mid-battle is accurate without a second simulation. `TH_ALPHA`/`EN_ALPHA` imports removed; replaced with compact inline question sets (7 math, 6 Thai, 6 English). Build ✅.

## 2026-06-04 — Math Battle learning mode

- `src/games/GameMathBattle.jsx` — NEW. Battle-wrapped Math MVP. Dark purple (#1a1040) UI. 8 questions per battle against one of 4 cute enemies (🤖👻😈🐲, 64 HP each). Enemy selected randomly. Player's current math level auto-used (no level selector in battle mode). Correct answer → enemy attack flash + HP reduction + battle text. Streak ≥3 → Critical Hit (×1.5 dmg, streak SFX, confetti). Wrong → gentle enemy shake, up to 3 attempts, then reveal. No player HP — child-friendly, zero frustration punishment. All dispatches identical to GameMath: ADD_XP (same formula), ROUND_COMPLETE, UPDATE_LEVEL_MASTERY, UNLOCK_LEVEL, LOG_SESSION (world:'math'). Result screen shows HP drained + replay/home.
- `src/games/GameScreen.jsx` — Lazy-import for GameMathBattle; `mathbattle` added to WORLD_TITLES.
- `src/components/Home.jsx` — Continue Adventure Math recommendation: icon `⚔️`, label "Math Battle", sub "ตอบถูก = โจมตี! ⚡". Routes to `mathbattle` world. Subject grid Math card unchanged → still routes to normal `math`.
- Build: ✅ zero errors. Commit: f6e5b74.

## 2026-06-04 — Fix: rewards from Continue Adventure

- `src/context/StateContext.jsx` — Fixed race condition where `loadState()` async callback and the `SIGNED_IN` auth handler could dispatch `INIT` with stale Supabase data, silently reverting XP, items, and egg progress earned since app start. Fix: before dispatching `INIT`, compare `remote.rounds` against `stateRef.current.rounds` (the always-current ref already wired in the context). If local is ahead (user made progress before the async resolve or token refresh fired), keep local state and push it to Supabase instead. Guest mode and new-device/fresh-install paths unaffected.

## 2026-06-04 — Animation juice polish

- `src/styles.css` — 10 new `@keyframes` + utility classes: `pulse-float` (Continue Adventure gentle bob), `battle-glow-pulse` (purple glow ring for battle card), `shimmer-bright` (Surprise card), `slide-down-in` (subject grid open), `victory-bounce` (win/done emoji), `item-pop-in` (reward box), `streak-bounce` (Shop streak feedback), `hatch-glow` (creature reveal golden drop-shadow), `modal-pop` (creature detail card), `answer-correct-glow` (correct choice ring). `.catalog-item:hover` lift + shadow; `.choice-btn.correct` enhanced with dual animation. `@media(prefers-reduced-motion:reduce)` block disables all decorative animations.
- `src/components/Home.jsx` — adventure card gets `rec-card-float` (default) or `rec-card-battle` (challenger); Surprise card gets `rec-card-surprise`; subject grid gets `subjects-slide-in` on open.
- `src/components/BattleScreen.jsx` — win emoji: `victory-bounce`; reward box: `item-pop-in`; special-move correct feedback emoji: `victory-bounce`.
- `src/components/HatchOverlay.jsx` — creature emoji at done phase: `hatch-reveal-glow`.
- `src/games/GameShop.jsx` — done screen emoji: `victory-bounce`; streak feedback: `streak-win` (streak-bounce); `streak: true` flag added to streak feedback state.
- Build: ✅ zero errors. Commit: b5ff1a5.

## 2026-06-04 — Audio polish and louder phonics

- `src/lib/audio.js` — 9 new tones added to `playTone()`: `tap` (warm pop), `open` (2-note upward chirp), `unlock` (4-note ascending jingle), `item` (sparkle arpeggio), `eggReady` (3-note glowing pulse), `reveal` (5-note sweep + sine), `start` (energetic burst), `complete` (4-note mission jingle), `cardOpen` (2-note soft pop). Phonics GainNode boosted from 2.5 → 4.0.
- `src/components/Home.jsx` — `playTone('tap')` on Continue Adventure + Surprise Event tap. `playTone('open'/'click')` on subject grid toggle. `playTone('eggReady')` fires once when `state.readyToHatch` transitions true.
- `src/components/Collection.jsx` — `playTone('cardOpen')` on creature card tap; `playTone('click')` on popup close.
- `src/components/HatchOverlay.jsx` — `playTone('reveal')` + staggered `fanfare` (350ms) at creature reveal (`done` phase).
- `src/components/BattleScreen.jsx` — `playTone('item')` fires 950ms after win (reward popup timing). Added `playTone` import.
- `src/games/GameShop.jsx` — `playTone('complete')` at ≥80% pass (was silent); ≥90% keeps `fanfare`.
- `src/games/GamePhonics.jsx` / `GameMath.jsx` / `GameThai.jsx` — `playTone('unlock')` on level unlock; `playTone('complete')` on pass (80–89%).
- Build: ✅ zero errors. Commit: 78a6ddd.

## 2026-06-04 — Battle learning special move

- `src/components/BattleScreen.jsx` — New question phase before each battle. `pickBattleQuestion(sessionLog)` selects subject from most-played recent sessions (safest readiness signal); falls back to simple Math (1+1→4+4) when no data. Question UI: full-screen dark overlay, 4 large tap-target buttons, skip link. Correct answer → `specialDmgRef` = 25% of enemy HP; 900ms "🔥 ท่าพิเศษพร้อมแล้ว!" feedback; `setPhase('fighting')`. Wrong/skip → 700ms "💪 สู้ต่อไปนะ!" feedback; battle starts normally. Special attack plays at battle start: ⚡ text + new 5-note ascending 'special' SFX + hit flash + gold damage float. Enemy HP re-simulated from reduced starting value so win condition is correct. Also fixed ATK/DEF advice text mismatch (was: Thai→ATK, Math→DEF; now: Math→ATK, Thai→DEF to match calcCreatureStats formula).
- Build: ✅ zero errors.

## 2026-06-04 — Battle balance and sound

- `src/config/gameConfig.js` — All AI_OPPONENTS HP scaled ×4 (regular/miniboss) and ×3.5 (boss); all ATK scaled ×2.5. Battles now last 6–15 turns instead of 2–4.
- `src/components/BattleScreen.jsx` — Imported `getSoundOn`/`getACtx` from audio.js. `playBattleSound` now respects sound toggle and reuses shared AudioContext. Added `attack` sound type (sword-swing whoosh). Improved `hit` (3-layer impact), `crit` (4-tone ascending), `win` (6-note fanfare), `lose` (gentler 4-tone descent). `attack` sound fires when attack text is shown; `hit` fires on flash.
- Build: ✅ zero errors.

## 2026-06-04 — Battle Home experience

- `src/components/BottomNav.jsx` — ⚔️ badge removed from Collection tab. `hasChallenger` and `useAppState` import removed.
- `src/App.jsx` — `challengerOpen` state added; useEffect watches `state.pendingChallenger`; `<ChallengerOverlay open={challengerOpen} onClose=.../>` and `<Home onOpenChallenger=.../>` wired.
- `src/components/ChallengerOverlay.jsx` — internal `visible` useState and its useEffect removed; now accepts `open`/`onClose` props. All `setVisible(false)` replaced with `onClose()`.
- `src/components/Home.jsx` — `onOpenChallenger` prop added. Battle case in `getRecommendation()` (priority: hatch → battle → shop → subject). Battle card: dark gradient, challenger emoji, "มอนสเตอร์ปรากฏตัว!". `handleRecommendedAction` calls `onOpenChallenger()` for battle type.
- `docs/CURRENT_STATE.md` — Home 2.0 Adventure Director entry updated.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Shop Mission speech feedback

- `src/games/GameShop.jsx` — speech added after correct answers. Import: `speakTh, speakEn` from audio.js. `THAI_NUMS` array added (หนึ่ง–สิบ). After correct: Thai questions → `speakTh(val)` after 380ms; English → `speakEn(val)` after 380ms; Math/counting → `speakTh(THAI_NUMS[val])` after 380ms. Social phrase question speaks the child's actual choice (ขอบคุณครับ or ขอบคุณค่ะ). All tones preserved. Sound toggle respected.
- `docs/research/progression/gameplay-loop.md` — "Learning Feedback Principles" section added: visual/sound/speech pattern, implementation status per game, what to avoid.
- `docs/GPT_NOTES.md` — Learning Feedback Principles section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Home UI simplification

- `src/components/Home.jsx` — subject section made collapsible: "หรือเลือกเรียน" static label replaced with "อยากเลือกเอง?" toggle button (`subjectsOpen` useState, default false); subject cards hidden until toggled. Shop Mission permanent card removed from Home (Shop still reachable via Continue Adventure recommendation when shopV1.runs === 0). Visual hierarchy: Egg → Continue Adventure → "อยากเลือกเอง?" → Egg Run → Surprise.
- `docs/CURRENT_STATE.md` — Home 2.0 and Shop Mission entries updated to reflect new state.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Observation philosophy documentation

- `docs/research/observation/observation-philosophy.md` — created. Source-of-truth for observation philosophy: observe→understand→design loop, children are not their level (behavior > history), positive interpretation table, important signals (accuracy/replay/completion/consistency), signals that must not dominate (speed/streaks/rankings), Subject Readiness as observations not labels, parent report philosophy (no anxiety/grades/rankings), mission follows child (deterministic design iteration not AI), explicit non-goals (no AI tutoring/adaptive engines/manipulation/addiction optimization), system relationships, implementation reference, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Observation section added with entries for both observation-philosophy.md and play-observation-system.md.
- `docs/GPT_NOTES.md` — Observation Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Gameplay loop documentation

- `docs/research/progression/gameplay-loop.md` — created. Highest-level philosophy document for KidQuest. Covers: Home as Adventure Director (not a menu), core loop (learn→battle→learn), replay philosophy (healthy/full XP), surprise philosophy (rare=special, daily date-hash rotation), minigame philosophy (rewards not primary game), intrinsic motivation (curiosity/collection/surprise/progress/mastery), child autonomy (suggest not force), explicit non-goals (no daily chores/energy systems/FOMO/competition), system relationships (subordinate docs listed), 5 open questions.
- `docs/RESEARCH_INDEX.md` — gameplay-loop.md entry added, marked as highest-level philosophy.
- `docs/GPT_NOTES.md` — Gameplay Loop Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Battle progression documentation

- `docs/research/battle/battle-progression.md` — created. Source-of-truth for battle progression philosophy: core loop (Learn→Battle→Learn), battle as reward not primary game, creature philosophy (every creature usable), gentle enemy scaling, Challenger every 15 rounds, loss philosophy (no permanent penalties), reward design (supports learning), self-directed frequency, explicit non-goals (no PvP/leaderboards/pay-to-win/gacha/energy), future features (evolution/equipment/rarity/bosses), system relationships, known BattleScreen text bug, 5 open design questions.
- `docs/RESEARCH_INDEX.md` — battle-progression.md entry added to Battle section.
- `docs/GPT_NOTES.md` — Battle Progression Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Subject progression documentation

- `docs/research/progression/subject-progression.md` — created. Source-of-truth for subject progression philosophy: core philosophy (subjects primary, missions secondary), progression flow, unlock thresholds (70/80/90%), replay always valid with full XP, mastery = confidence not perfection, stretch/challenge optional bonus layers, subject independence, readiness vs. highest unlock level, explicit non-goals, future grade roadmap, implementation reference, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Progression section added.
- `docs/GPT_NOTES.md` — Subject Progression Philosophy section added (thresholds, replay, mastery, independence, open questions for GPT).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Creature stats documentation

- `docs/research/battle/creature-stats.md` — created. Source-of-truth for creature stat design philosophy: why one-subject-one-stat fails, weighted formula with 40% base floor, example weightings (HP/ATK/DEF/SPD/CRIT), personality variation (±10% deterministic from XP seed), migration rules (recalc on 0/NaN, never delete eggs), explicit non-goals, future scaling notes, 5 open implementation questions.
- `docs/RESEARCH_INDEX.md` — Battle section added.
- `docs/GPT_NOTES.md` — Creature Stat Design Philosophy section added (key decisions + open questions for implementation).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Egg economy documentation

- `docs/research/rewards/egg-economy.md` — created. Source-of-truth for egg progression mechanics: core loop, design philosophy (first egg fast / no FOMO / no streak pressure), scaling formula (`min(800, 120+n×60)`), progression table, stage system, XP sources, migration rules, implementation reference, open questions, future considerations.
- `docs/RESEARCH_INDEX.md` — Rewards & Economy section added.
- `docs/GPT_NOTES.md` — Egg Economy Decisions section added (pacing formula, creature stat decisions, open question for GPT re: onboarding threshold).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Egg pacing + creature stat rebalance

### Part 1 — Egg progression pacing
- `src/context/StateContext.jsx` — `scaledEggProgress(state)` helper added (module-level). Computes `required = min(800, 120 + hatchedEggs.length * 60)`, divides into 7 stages dynamically, returns `{stage, stageXP, pct, xpPerStage, required}`. `ADD_XP` reducer: replaced static `newStage`-based `readyToHatch` with `newTotal >= hatchRequired` (dynamic). `derived` useMemo: `eggProgressData` now uses `scaledEggProgress()`; `eggStatsData.stage` overridden to scaled stage so `drawEgg()` visual matches progress display. `state.hatchedEggs` added to useMemo deps.
- `src/components/Home.jsx` — destructures `xpPerStage` from `eggProgressData`; egg XP label updated: shows "เกือบฟักแล้ว!" in stage 6 before ready, uses dynamic `xpPerStage` denominator instead of hardcoded 50.

### Part 2 — Creature battle stat rebalance
- `src/config/gameConfig.js` — `calcCreatureStats()` rewritten with weighted formula. Old: ATK=base×thaiShare (exclusive ownership — ATK=0 if no Thai XP). New: every stat has 40% base guarantee + 60% subject-weighted. HP: 1.5+0.3t+0.1m+0.1e; ATK: 0.4+0.3m+0.2e+0.1t; DEF: 0.4+0.3t+0.2m+0.1e; SPD: 0.4+0.3e+0.2m+0.1t. Deterministic ±5% personality variation from XP seed. Minimum possible any stat = base × 0.5 (Thai-only learner) — no more 0 stats.
- `src/lib/state.js` — `_migrateEggs()` updated: recalculates stats if any of ATK/DEF/SPD is 0 or NaN (covers pre-rebalance eggs with broken stats).
- Build: ✅ zero errors.

## 2026-06-04 — Shop feedback + hatch overlay fix

- `src/games/GameShop.jsx` — feedback improvements:
  - `wrongChoice` state added; `.wrong` CSS class (shake animation) applied to the wrong button on incorrect answer. Cleared on correct / next / replay.
  - `STREAK_MSGS` array added; when streak ≥ 3 feedback message uses fire messages instead of generic correct msg.
  - Streak counter in header styled amber bold at ≥ 3 (was muted/small).
  - Wrong feedback text changed from "ไม่ถูก ลองอีกครั้ง! 🤔" to "ลองอีกครั้ง! 💪"; reveal message now friendlier: `คำตอบที่ถูกคือ "${q.answer}" 😊`.
  - All existing `playTone` calls unchanged.
- `src/components/HatchOverlay.jsx` — two bug fixes:
  - **Freeze fix**: `setPhase('tapping')` called as first line of `handleClose()`. After dispatch+navigate, `isOpen` is `false` and `phase` is `'tapping'` → condition `!isOpen && phase === 'tapping'` is true → overlay unmounts cleanly. No more frozen screen requiring refresh.
  - **Mid-game interruption fix**: `suppressAutoOpen` prop (default false). When `true`, `isOpen` ignores `readyToHatch && !hatched` auto-trigger. Only explicit `state.hatching` (user-initiated) can open overlay.
- `src/App.jsx` — passes `suppressAutoOpen={screen === 'game'}` to `HatchOverlay`. During gameplay, hatch overlay won't auto-interrupt. After returning to home, `readyToHatch` is still true → overlay appears normally.
- Build: ✅ zero errors.

## 2026-06-04 — Home 2.0: Adventure Director + NaN bug fixes

- `src/components/Home.jsx` — rewritten as Adventure Director.
  - **`⭐ ผจญภัยต่อ`** section: single large recommended card above the world grid. Deterministic priority: (1) hatch if egg ready, (2) Shop if never played, (3) weakest subject by XP. No AI, no state.
  - **`🎁 เซอร์ไพรส์วันนี้`** section: replaces the 2×2 minigame grid. One unlocked minigame shown per day (date-hash mod count of unlocked games). After playing, shows "เล่นแล้ว! มาพรุ่งนี้นะ 🌙" (derived from `sessionLog`, no new state). If no minigames unlocked yet, shows a teaser card.
  - World-label text changed to "หรือเลือกเรียน" (secondary framing).
  - `getRecommendation()` and `getSurpriseEvent()` helper functions added (module-level, no hooks).
- `src/components/Report.jsx` — **NaN bug fixes** in `MissionAnalytics`:
  - `totalHints = 0`, `totalDuration = 0` default values added to destructuring (handles pre-Phase-D state with no analytics fields).
  - `avgScore` now returns `null` when `totalQs === 0` (renders as `—` not `0%`).
  - `avgDur` now returns `null` when `totalDuration === 0` (renders as `—` not `NaN`).
  - `nudge` guard updated: `avgScore !== null && avgScore >= 90`.
- Build: ✅ zero errors.

## 2026-06-04 — Subject Readiness Report display

- `src/components/Report.jsx` — `computeReadiness(sessionLog, world)` added: filters last 10 `sessionLog` entries per world, derives one of 4 states (strong / comfortable / exploring / notready) from avgScore + goodRuns + completionRate thresholds. `SubjectReadiness` component renders a card with color-coded Thai-language badges for ภาษาไทย / คณิต / อังกฤษ. Observation footnote: "ดูจากการเล่นล่าสุด ไม่ใช่เลเวลที่ปลดล็อก". No new state fields.
- Build: ✅ zero errors.

## 2026-06-03 — Subject Readiness Design (docs only)

- `docs/research/observation/play-observation-system.md` — **Subject Readiness** section added: 4 readiness states (Strong / Comfortable / Exploring / Not Ready), derivation logic (last 10 sessions, avgScore ≥ 0.85 + goodRuns ≥ 3 + completionRate ≥ 0.80 for Strong; avgScore ≥ 0.70 + goodRuns ≥ 2 for Comfortable; else Exploring; no sessions = Not Ready), explicit non-goals (no AI, no gate, no child UI, no level tree), phase status section updated to mark Phase D shipped and describe Phase D+ scope.
- `docs/research/observation/play-observation-system.md` — Peer Comparison section updated: marked as ✅ done (replaced in Phase D).
- `docs/research/missions/mission-system.md` — **Subject Readiness and Mission Design** section added: explains why highest unlocked level is unreliable, defines mission content weighting from readiness profile, example profiles (Thai Strong / Math Comfortable / English Exploring → Thai 60% / Math 30% / English 10%), when to apply per mission phase, core principle "Mission should follow the child."
- `docs/GPT_NOTES.md` — Subject Readiness Decisions section added: 9 decisions covering derivation, mission weighting, Shop Stretch independence, Cooking Mission dependency, implementation timing.
- `docs/TASKS.md` — Phase D+ Subject Readiness documentation marked done; Cooking Mission task updated with readiness dependency warning; Subject Readiness Report display added as deferred task.
- No app code changed.

## 2026-06-03 — Phase D: Play Observation System

- `src/lib/state.js` — `sessionLog: []` added to `defaultState()`; `shopV1` extended with `totalHints: 0`, `totalDuration: 0`, `phaseStats: { 1–4 }`.
- `src/context/StateContext.jsx` — `LOG_SESSION` action + reducer (appends to ring buffer, computes `replayedImmediately`); `UPDATE_SHOP_V1` extended to accumulate `hints`, `dur`, `phaseStats` per run.
- `src/games/GameShop.jsx` — `sessionStart` + `perQCorrect` refs added; per-question correctness tracked; `LOG_SESSION` + extended `UPDATE_SHOP_V1` payload dispatched on done screen; `replay()` resets refs.
- `src/games/GameThai.jsx` — `useFinishRound` extended with `sessionStartRef` param; dispatches `LOG_SESSION` after each subject round; `sessionStart` refs added to ThaiMatchGame, ThaiSpellGame, ThaiWordOrderGame with reset on replay.
- `src/games/GameMath.jsx` — `sessionStart` ref added to `MathLevelGame`; `LOG_SESSION` dispatched in `next()` when done; replay resets ref.
- `src/games/GamePhonics.jsx` — `useRef` import added; `sessionStart` refs added to all 4 game components (PhonicsGame, CVCGame, SightGame, SentenceGame); `LOG_SESSION` dispatched in each `next()` when done; replay resets refs.
- `src/components/Report.jsx` — `MissionAnalytics` component added (runs, avg score, avg duration, hints, phase difficulty table, replay framing, deterministic nudge); peer-comparison card replaced with play-history timeline (last 10 sessions).
- Build: ✅ zero errors.

## 2026-06-03 — Workflow Audit + Architecture Language Patch (docs only)

- `docs/GPT_NOTES.md` — fixed two present-tense statements that implied `MissionScreen.jsx` + `missionConfig.js` are current architecture. Both are future targets (after 2+ missions). Current routing clarified: Home → `GameScreen.jsx` → `GameShop.jsx` (world `'shop'`).
- `docs/research/missions/mission-system.md` — Mission Access Points navigation section updated: current implementation (GameShop.jsx) vs. future target (MissionScreen.jsx) now clearly separated.
- `docs/TASKS.md` — Phase C app code commit added as critical Now task. Development workflow documented (build → commit → push → verify).
- `docs/GPT_HANDOFF.md` — session updated; Phase C uncommitted code flagged as risk; workflow gap noted.
- **Critical finding**: Phase C app code (`GameShop.jsx`, `Home.jsx`, `StateContext.jsx`, `GameScreen.jsx`, `state.js`) is uncommitted. Production is on Phase 3. Must commit + push before play testing.
- No app code changed this session.

## 2026-06-03 — Phase D Wording Patch: Observation Language + Engagement Signals (docs only)

- `docs/research/observation/play-observation-system.md` — final wording improvements before implementation: `passed` → `completed`; `hardestPhase` → `challengePhase`; "most difficult phase" → "current challenge area"; `replayedImmediately` and `nextAction` added to session entry schema; new **Engagement Signals** section (explains why engagement signals outweigh scores, documents `replayedImmediately`, `nextAction`, replay count, and session duration); nudge rule updated to `runs === 1 && completed`; nudge condition updated to `challengePhaseAcc`; "pass/fail icon" in play history renamed to "completed/not completed".
- `docs/GPT_NOTES.md` — terminology decisions section added; engagement signal rationale recorded; D0 noted in Phase D scope.
- `docs/TASKS.md` — D0 (Shop card UX audit) added before D1 in Phase D list.
- No app code changed.

## 2026-06-03 — Phase D Design: Play Observation System (docs only)

- `docs/research/observation/play-observation-system.md` — NEW: full design spec for lightweight passive play observation system. Covers: session log ring buffer (last 50 entries), `shopV1` state extensions (`totalHints`, `totalDuration`, `phaseStats`), new `LOG_SESSION` reducer action, parent report Mission Analytics card design, deterministic nudge rules, replay framing principles, explicit non-goals (no AI, no peer comparison, no child-facing UI).
- `docs/GPT_NOTES.md` — Play Observation System decisions added (nudge rules, ring buffer cap, no-speed-gate, peer-comparison card replacement).
- `docs/TASKS.md` — Phase D (D1–D4) and Phase E tasks structured under Next.
- `docs/GPT_HANDOFF.md` — Updated: latest session, active tasks, recommended next GPT work.
- No app code changed.

## 2026-06-03 — Phase D Prep: Shop Mission Terminology Sync (docs only)

- `docs/research/missions/shop-mission.md` — "4 steps" → "4 phases / 6 questions"; steps renamed to phases; Phase 1 annotated ×3, phases 2–4 annotated ×1; "Why 4 Core Steps" section retitled and updated.
- `docs/research/missions/mission-system.md` — example step list replaced with actual 4-phase/6-question breakdown.
- `docs/CURRENT_STATE.md`, `docs/GPT_HANDOFF.md`, `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md` — all updated to use "4 phases / 6 questions" terminology consistently.
- No app code changed.

## 2026-06-03 — Phase C: Shop Mission MVP

- `src/games/GameShop.jsx` — NEW: 4 phases / 6 questions (Phase 1: Thai matching ×3, Phase 2: English vocab ×1, Phase 3: counting ×1, Phase 4: social phrase ×1). 4 choices per question. Accepts both ขอบคุณครับ/ค่ะ for social phrase. XP dispatched per subject. Done screen with pass/fail at 80% threshold.
- `src/lib/state.js` — `shopV1: { bestScore, runs, mastered, stretchUnlocked }` added to `defaultState()`.
- `src/context/StateContext.jsx` — `UPDATE_SHOP_V1` action + reducer case: tracks bestScore, runs, mastered (≥90% + ≤1 wrong + ≥2 runs). stretchUnlocked always false for MVP.
- `src/games/GameScreen.jsx` — lazy-imports `GameShop`, adds `shop` world to `WORLD_TITLES`.
- `src/components/Home.jsx` — Missions section added above Egg Run. Shop card shows best score and run count after first play. Always unlocked.

## 2026-06-03 — Phase B+ Mastery-Gate Patch: mastery signal tightened, Stretch content confirmed
- `mission-system.md`: Mastery signal simplified to 3 hard criteria — accuracy ≥ 90%, ≤ 1 wrong, ≥ 2 runs. Removed "hint dependency" from hard criteria (not tracked yet; can be added later). Speed re-clarified as optional context only, never a gate.
- `shop-mission.md`: Shop Stretch section updated with explicit unlock trigger listing the 3 criteria. "Why 4 steps" section rewritten — quantity difference and price concept named as Stretch, Core MVP steps stated inline.
- `GPT_NOTES.md`: Product Decisions — mastery signal now 3 explicit criteria; Shop Core/Stretch split named explicitly.
- `TASKS.md`: Mastery signal note updated — speed NOT required.
- No app code changed.

## 2026-06-03 — Phase B Review Patch: Mission MVP scope tightened
- `shop-mission.md`: MVP reduced 6 → 4 steps. Price/money and quantity-difference steps moved to Later Expansion (Early Grade 1 stretch) — not deleted.
- `mission-system.md`: Unlock threshold 70% → 80% (aligned with subject levels; 70% guessable on 4 questions). Engine philosophy updated: start with `GameShop.jsx`, delay generic `MissionScreen.jsx` until pattern validated.
- `GPT_NOTES.md`: Architecture suggestions updated to staged approach; threshold and step count corrected.
- `TASKS.md`: Now task updated — 4-step MVP, GameShop.jsx first, no missionConfig/MissionScreen yet.
- No app code changed.

## 2026-06-03 — Mission System Design Review & Patch
- Confirmed existing mission docs (README, mission-system, shop, cooking, garden) are complete.
- Added "Explicit Non-Goals" section to `mission-system.md`: no payment, no multiplayer, no social features, no Grade 2+, no AI tutor, no unique mini-games.
- No other changes needed — TASKS, GPT_NOTES, RESEARCH_INDEX already up to date.

## 2026-06-03 — Mission System Design (documentation only)
- Created `docs/research/missions/` with 5 files: README, mission-system, shop-mission, cooking-mission, garden-mission.
- Mission system: 3 types (Progression/Review/Challenge), reuses all existing mechanics, data-driven via `missionConfig.js`, thin `MissionScreen.jsx` wrapper.
- Shop mission MVP: 6 steps, Kindergarten core + Grade 1 stretch, integrates Thai/Math/English/GK. Full data structure specified.
- Cooking and garden missions: design only — not for implementation until shop is confirmed working.
- Updated `GPT_NOTES.md`, `TASKS.md`, `RESEARCH_INDEX.md`, `SESSION_SUMMARY.md`.
- No app code changed.

## 2026-06-03 — Vision + Scope Documentation
- Created `PROJECT.md` — one-page project brief (what, who, golden rule, success metric).
- Created `VISION.md` — full design philosophy: golden rule, mastery progression, Year 1 scope, stable engine, content strategy, replay philosophy, non-goals, scope guardian mandate.
- Created `GOALS.md` — Year 1 goals, non-goals, long-term goals, definition of done.
- Created `docs/README.md` — navigation index for all docs by audience role.
- Updated `docs/DECISIONS.md` — added mastery-based progression, Golden Rule, replay philosophy, scope guardian decisions under Product and AI sections.
- Updated `CLAUDE.md` — scope guardian check added to Before Coding section.
- Updated `docs/ARCHITECTURE.md` — stable engine note replaces stale React migration note.
- Updated `SPEC.md` — deprecated header updated to canonical format.
- Updated `docs/GPT_HANDOFF.md` — vision section added; recommended next work updated to Year 1 scope.

## 2026-06-03 — Phase 3: AI_OPPONENTS Tiers 2–5
- `gameConfig.js`: Added tiers 2–5 to `AI_OPPONENTS`. Stats scale ~1.5× per tier. Sonic villain theme continues:
  - T2 ป.3-4: Coconuts/Octus/Rexon → Egg Robo → Dr. Eggman III
  - T3 ป.5-6: Rhino-Bot/Slicer/Jawz → Heavy Gunner → Dr. Eggman IV
  - T4 ม.ต้น: GUN Mech/E-101 Beta/Dark Chao → Egg Emperor → Dr. Eggman V
  - T5 ม.ปลาย: Metal Sonic/Shadow Android/Silver Gladiator → Mephiles → PERFECT CHAOS
- `StateContext.jsx`: Fixed challenger grade→tier mapping (`Math.min(grade,1)` → proper mapping: 0→0, 1-2→1, 3-4→2, 5-6→3).

## 2026-06-03 — Phase 2 UX (Sound Persist + XP Boost Indicator)
- **Sound persistence**: `App.jsx` initializes `soundOn` from `localStorage.getItem('kq_sound')`; all toggle callbacks write `kq_sound` on change. Device-local key, separate from `kq_state` blob.
- **XP boost badge**: new `XpBoostBadge` component in `Home.jsx` — shows amber `⭐ ×2 M:SS` countdown in header when `xpBoostEnd > now` and `xpBoost > 1`; hides automatically when boost expires; 1-second interval via `useRef`.

## 2026-06-03 — Phase 1 UX Readiness
- **Replaced `alert()`** in `Home.jsx` with `showToast()` calls — EggRun lock and no-lives both show friendly toast messages; minigame dead-guard removed.
- **New `ProfileModal.jsx`**: name input + grade grid (อนุบาล–ป.6); saves via `SET_PROFILE` action; persisted to localStorage + Supabase automatically.
- **Profile button** (👤 + child name) added to Home header — always visible, opens ProfileModal.
- **`SET_PROFILE` action** added to `StateContext.jsx` + reducer case.
- `App.jsx`: ProfileModal mounted alongside LoginModal; `onOpenProfile` prop wired to Home.

## 2026-06-03 — Docs Sync (Current State Audit)
- `CURRENT_STATE.md` updated: Math level count corrected (6 → 9), visual models added, tier system detailed, minigame unlock conditions expanded, Vercel/phonics audio noted accurately.
- `TASKS.md` restructured: consolidated Done list, added visual models + tiers + AI_OPPONENTS entries, removed duplicate items, added Math L9+ and English L5+ to Later.
- `GPT_HANDOFF.md` regenerated to reflect latest codebase state.
- No app code changed.

## 2026-06-03 — Math Visual Models for L1–L4
- `gameConfig.js`: added `visualModel` field to math levels 1–4 (`objects`, `objects`, `tenFrame`, `crossOut`).
- `GameMath.jsx`: `genQ` numeric branch now attaches `visualModel`, `emojiA`, `emojiB` to question object.
- New `VisualModel` component with 4 modes:
  - `objects`: real emoji grid (emojiA×a + emojiB×b) with `+` separator; smaller font when total > 10.
  - `tenFrame`: 2×5 or 4×5 coloured grid (amber=a, blue=b, grey=empty); fallback dots if total > 20.
  - `crossOut`: emoji grid with ❌ overlay on the last `b` items (subtraction visualisation).
  - `null` (L5+): unchanged coloured 🟡/🔵 dots.

## 2026-06-03 — Math Content Expansion + New Question Types
- `MATH_WORDS` expanded from 16 → 30: added joining, taking-away, and 10 comparison problems (`comparison:true`).
- `PATTERN_SETS` added to `gameConfig.js` (5 AB emoji pairs; ABC reserved for L9).
- `LEVELS.math` expanded: Level 0 (Foundation/count), Level 7 (เปรียบเทียบ), Level 8 (รูปแบบ AB).
- `TEACH_CONTENT.math` entries added for keys 0, 7, 8.
- `GameMath.jsx`: new `count` and `pattern` question types; foundation mode (grade-0 only, no timer); maxLevels `6→8`; amber hint highlight for patterns at attempt 1.
- `LevelSelector.jsx`: optional `levelsOverride` prop added.
- `StateContext.jsx`: `FOUNDATION_COMPLETE` action added.
- `state.js`: `foundationComplete: false` added to `defaultState()`.

## 2026-06-03 — SPEC.md Formally Deprecated (Session 6)
- Added deprecation header to `SPEC.md` with documentation precedence order.
- Updated `DECISIONS.md` — SPEC.md deprecated note under Architecture Decisions.
- Updated `AI_SYSTEMS.md` — SPEC.md historical-only note added.
- Risk of conflicting documentation between old prototype and current React app eliminated.
- No app code changed.

## 2026-06-03 — Research System + Review Workflow (Session 5)
- Created `docs/research/` with 7 subject subfolders (thai, math, english, logic, life, curriculum, competitors).
- Created `docs/POST_REVIEW.md` — Claude Chatbot post-implementation review.
- Created `docs/RESEARCH_INDEX.md` — index of all research documents.
- Updated `AI_SYSTEMS.md` — post-review flow and research/ added.
- Updated `CLAUDE.md` — POST_REVIEW.md added to after-coding checklist.
- No app code changed.

## 2026-06-03 — AI System Overview (Session 4)
- Created `docs/AI_SYSTEMS.md` — defines 3-AI collaboration model (GPT / Claude Chatbot / Claude Code).
- Updated `CLAUDE.md`, `DECISIONS.md`, `GPT_HANDOFF.md` to reference the system.
- No app code changed.

## 2026-06-03 — Auto Sync Upgrade (Session 3)
- Created `docs/GPT_NOTES.md` — shared memory for GPT → Claude knowledge transfer.
- Created `docs/GPT_HANDOFF.md` — single-file Claude → GPT handoff, regenerated each session.
- Updated `CLAUDE.md` — added GPT_NOTES/GPT_HANDOFF to pre/post-session workflow.
- Restructured `TASKS.md` to Now / Next / Later / Done format.
- Added AI Sync section to `DECISIONS.md`.
- No app code changed.

## 2026-06-03 — Docs Verified + Trimmed (Session 2)
- Verified all docs against real codebase; no feature inaccuracies found.
- Fixed stale `gameConfig.js` line count (354 → 346) in PROJECT_MAP and CODEBASE_SUMMARY.
- Trimmed all docs to meet token limits (CURRENT_STATE ≤120, PROJECT_MAP ≤120, CODEBASE_SUMMARY ≤150, SESSION_SUMMARY ≤30).
- TASKS.md: moved Session 1 doc task to Done; condensed Done list.

## 2026-06-03 — Project Memory System Initialized
- Project memory / documentation system created (`docs/` folder).
- Existing project state documented from codebase inspection.

## 2026-06-03 — Bug Fixes & UI Consistency
- **Fix**: English `SightGame` (Level 3) was missing `UNLOCK_LEVEL` dispatch — completing Level 3 with ≥80% never unlocked Level 4. Fixed.
- **Fix**: English `CVCGame` (Level 2) was missing `spawnConfetti(15)` on level unlock. Fixed.
- **Add**: `GameHeader` (progress bar + streak display) added to all 4 English Phonics game modes (was missing; Thai already had it).
- **Add**: "Play Again" button added to GameMath result screen (only had "← Level อื่น" before).
- **Add**: Fanfare + confetti on 90%+ score added consistently to all Math and English levels.
- **Remove**: Dead code — `TH_L4` fill-in-blank data removed from `gameConfig.js` (was orphaned after Thai Level 5 changed to word-order game).

## 2026-06-03 — Content Expansion (All Subjects)
- Thai `SPELL_L1`: 12 → 24 words (สระ อา/อิ/อู/เ/โ).
- Thai `TH_L2` (animals): 12 → 20 words.
- Thai `TH_L3` (3-syllable): 8 → 14 words.
- Thai `TH_L5`: NEW word-order game data (9 sentences). Level 5 changed from fill-in-blank → `ThaiWordOrderGame`.
- Thai Level 4 renamed to "คำ 3 พยางค์".
- Hint system added to `ThaiSpellGame`: after 1 mistake → amber pulse on next correct tile.
- Shared `ResultScreen` + `GameHeader` + `useFinishRound` hook in `GameThai.jsx`.
- Math `MATH_WORDS`: 8 → 16 word problems.
- English `CVC_WORDS`: 10 → 24 words with sound-alike distractors.
- English `SIGHT_DATA`: 8 → 16 fill-in-blank sentences.
- English `ENG_SENTS`: 8 → 12 word-ordering sentences.

## 2026-06-03 — Hosting Migration
- Migrated from Netlify to Vercel. Added `vercel.json`.

## 2026-06-03 — Audio Optimization
- Moved phonics audio from base64 embedded in JS bundle → static `.m4a` files in `public/sounds/phonics/`.

## Earlier — Challenger System + Battle Animation
- Added Pokémon-style battle animation (`BattleScreen.jsx`).
- Added Challenger system: every 15 battle rounds → random AI opponent (`AI_OPPONENTS` config).
- Added `ChallengerOverlay.jsx` for full-screen challenger announcement.

## Earlier — Battle System + Egg Migration
- Added turn-based battle system with HP/ATK/DEF/SPD/CRIT stats.
- Added egg migration (`_migrateEggs`) to backfill `tier` and `stats` fields on old hatched eggs.

## Earlier — Tier System + Creature Stats + AI Opponents
- Added `TIERS` config (0=อนุบาล through 5=ม.ปลาย).
- Added `calcCreatureStats()` for derived battle stats.
- Added `AI_OPPONENTS` config for tier 0 and tier 1.

## Earlier — React Migration
- Migrated from single-file HTML prototype (~600KB) to React 18 + Vite.
- Supabase auth and state sync implemented.
- All game screens, minigames, and UI rebuilt as React components.

## 2026-06-12 — World Map HUD
- `WorldScreen.jsx`: New `WorldHUD` component replaces plain top bar. Sections: 3×3 mini-map (screen colors from SCREEN_THEMES, discovered/undiscovered/current states), creature status (name + level + HP bar + HP numbers), XP bar (Lv.N + gold progress), battle items (5 PixelItemIcon at 13px with count badges). Home button replaced with compact ⌂ symbol.
- Camera `camY` offset adjusted by `−HUD_CONTENT_H/2` so the player avatar centers in the visible play area below the HUD.
- Added `SCREEN_THEMES` and `PixelItemIcon` imports; removed unused `screenLabel` const.

## 2026-06-16 — feat: 6-element pixel art creatures + auto creature names

### Pixel Art Creature Renderer (`creatureAlgorithm.js`)
- Old procedural HSL renderer (circles/ellipses/bezier curves) replaced with pixel-art grid renderer
- 12×12 grid at P = `floor(min(canvas.width, canvas.height) / 12)` px per unit, centered in canvas
- Dark `#0a0a12` background behind all sprites
- 6 elements with distinct palettes and pixel patterns:
  - **fire** (ฟุระ/เปลวไฟ/ราชันเพลิง): red/orange, mane sides, flame tail, blush cheeks
  - **water** (อาควา/กระแส/ไทดัน): blue, flat fin ears, fin sides, droplet tail
  - **thunder** (ซาปิ/สายฟ้า/โวลเทน): yellow/gold, spike ears, spark sides, zigzag tail
  - **nature** (ลีฟู/ป่าลึก/ซิลวาน): green, tall leaf ears, vine sides, leaf tail
  - **shadow** (นิกซ์/เงามืด/อัมบรา): purple, long wispy ears, dark aura sides, shadow tail
  - **light** (ลูมิ/แสงทอง/ออโรร่า): warm gold, halo ears, glow sides, star tail
- 3 stages:
  - **baby**: 6-unit-wide head/body, element-specific ears/sides/tail
  - **teen**: 8-unit-wide body, shoulder pads in accent, taller ears, element accessories
  - **final**: wide head + full-width armored body, crown/helmet, glowing eyes (shadow/fire), large tail

### Auto Creature Names
- `getCreatureName(element, evoStage)` exported from `creatureAlgorithm.js` — Thai species names per element × stage
- `getCreatureSeed(egg)` unchanged — backward-compatible with all existing callers

## 2026-06-16 — Audio fix: mobile resume + remove monster name TTS

### Mobile Audio (audio.js)
- Replaced single `touchstart` `{ once: true }` listener with paired `touchstart` + `click` listeners that pre-warm AudioContext from the user gesture (create if null, resume if suspended), then self-remove after first fire
- Added `if (!audioCtx || audioCtx.state === 'suspended') return` guard in `playBGM` — prevents silent WebAudio nodes from scheduling in a suspended context; BGM starts cleanly after first user interaction on iOS

### Monster Name TTS Removed (MoveSelectBattleMode.jsx)
- Removed "Enemy name announce on mount" useEffect (was `speakTh(enemy.name + ' ปรากฏตัว')` at 700ms)
- Removed `isFirstQuestionRef` and the 1800ms first-question delay (flat 500ms now)
- Question TTS (`speakTh`/`speakEn` for thai/eng/math) is unchanged

## 2026-06-16 — Home screen: large creature display + party bar

### Home.jsx
- Replaced 2×2 stat grid (ATK 169 / DEF 178 / SPD 160 / HP 504) with full creature display:
  - Creature name (large pixel font, gold)
  - Level badge (Lv.X)
  - 160×160 pixel-art canvas using `drawCreature` from `creatureAlgorithm.js`
  - Compact single-line stat row (ATK · DEF · SPD · HP, color-coded)
  - Canvas keyed by `activeEgg.id` so it remounts on party switch
- Replaced Party HP bars section with scrollable party portrait bar:
  - 56×56 pixel-art canvas per creature
  - Name + level label underneath each card
  - Active creature = gold `#EF9F27` border + glow
  - 1 creature → centered; multiple → horizontal scroll
  - Tap any card → `SET_ACTIVE_CREATURE` → switches large display
- `evoStage` merged into stats for both large canvas and party cards (teen/final stages now render)

## 2026-06-16 — Response time analytics for battle answers

### MoveSelectBattleMode.jsx
- `questionStartTime` ref: set to `Date.now()` when each new question appears (in TTS effect on `[cur, subject]`)
- `responseTimeRef`: captures elapsed ms in `handleTap` before animation, so timing is accurate to player tap
- `fireHit` (correct) and `fireMiss` (wrong) both dispatch `LOG_BATTLE_ANSWER` with subject/question/correct/responseTimeMs/timestamp

### StateContext.jsx
- New action `LOG_BATTLE_ANSWER` in ACTIONS
- Reducer maintains rolling 50-entry per-subject array in `state.responseTimeLogs.{thai,math,eng}` — each `{ timeMs, correct, timestamp }`

### state.js (defaultState)
- Added `responseTimeLogs: { thai:[], math:[], eng:[] }` — old saves get empty arrays, reducer handles missing keys gracefully

### Report.jsx
- New `ResponseSpeed` component: shows avg response time (last 10) and trend vs prior 10 per subject
- Hidden until ≥5 answers recorded per subject; appears after SubjectReadiness section
- Supabase persistence is automatic (responseTimeLogs included in state_json)

## 2026-06-22 — Baby-stage silhouette redesign (block-attachment technique)

### src/lib/creatureAlgorithm.js
- Rewrote all 4 baby-stage draw functions using block-attachment technique derived from Pokémon reference images
- Correction: prior pass wrongly used staircase/diagonal pixels; reference sprites use rectangular blocks with at most 1px step offsets
- FURRED: ears now 2×3 tall proper blocks (was 3×1 thin bar), flat 3×2 tail rectangle (no staircase), 4 separated leg stubs
- WINGED: wings are pure 3×4 rectangular blocks with consistent 2-wide fill throughout (no taper), 2-stub bipedal legs
- SCALED: head enlarged to 8×5 (was 6×4), tail is straight 2×5 vertical rectangle (no staircase), right leg shifted to x=6 to avoid merging with tail
- CHITIN: antennae shortened to 2 rows (head now starts at y=2 instead of y=3), 3-segment widening 6→8→10 intact

## 2026-06-22 — Baby-stage Minecraft voxel/cube aesthetic redesign

### src/lib/creatureAlgorithm.js
- Pivoted all 4 baby draw functions from organic/Pokémon style to Minecraft mob voxel style
- All shapes are pure flat rectangles with hard color edges — no curves, no gradients, no diagonals
- FURRED: 2×2 ear blocks at corners, large 10×5 face, 4×2 pig snout block with nostril dots, 4 stub legs
- WINGED: 4×1 accent crest at face top, 2×1 accent beak at face bottom, 4×4 wing panels spanning canvas edges, 2 bipedal legs
- SCALED: 2×3 side frill blocks at extreme head edges (x=0 and x=10), 1×2 slit pupils, 3×3 tail block extending right
- CHITIN: compound eyes in accent color (Minecraft spider red-eye style), three-segment widening body 6→8→10
