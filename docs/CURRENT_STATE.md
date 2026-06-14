# Current State — KidQuest

## Implemented Features

### Core Game System
- **3 subjects** with level-unlock (≥80% accuracy → EMA unlock next)
  - Thai: 5 levels (match, spell×3, word-order)
  - Math: 9 levels (L0 Foundation count · L1–L5 add/sub/mixed · L6 word-problems · L7 comparison · L8 pattern AB)
  - English: 4 levels (phonics, CVC, sight words, sentence ordering)
- **Teach overlay**: first-time per level; mascot + examples; tracked in `seenTeach[]`
- **GameHeader**: progress bar + streak in all game modes across all 3 subjects
- **Hint system**: Thai spell → amber-highlight next correct tile after 1 miss; Math → 3-attempt reveal; Pattern → amber unit-highlight after attempt 1

### Math Visual Models (L1–L4)
- **L1/L2** (`objects`): real emoji objects grid — emojiA×a **+** emojiB×b
- **L3** (`tenFrame`): 2×5 or 4×5 coloured grid (amber=a, blue=b, grey=empty)
- **L4** (`crossOut`): emoji objects with ❌ overlay on last b items
- **L5+**: original 🟡/🔵 dot visualization

### Visual System — Pixel UI (2026-06-11)
- **Pixel font**: Press Start 2P loaded via Google Fonts for EN/numbers/UI labels. Sarabun loaded for Thai text. CSS variables `--font-pixel` and `--font-thai` in `:root`.
- **16-color pixel palette**: `--px-black` through `--px-pink` in `:root`. Shadow token `--px-shadow: 3px 3px 0px var(--px-darkest)` (hard NES-style offset, no blur). `--px-radius: 0px` (square corners everywhere).
- **Pixel class library** in `styles.css`: `px-box`, `px-box-light`, `px-btn` (+purple/yellow/dark), `px-hp-bar-outer/inner`, `px-xp-bar-outer/inner`, `px-dialogue`, `px-name-badge`, `px-item-card`, `px-badge`, `px-title`, `px-subtitle`, `px-cursor`, `px-answer-card` (+correct/wrong with `px-shake`), `px-combo-badge`, `px-transition-overlay`, `px-bottom-nav`, `px-nav-item`, `px-nav-dot`.
- **Global overrides**: `img,canvas { image-rendering: pixelated }`. Border-radius killed on buttons/inputs/cards/panels/modals via `!important`.
- **Home.jsx pixel redesign**: Header flat `var(--px-darkest)` (no blur). Title uses Thai font + `--px-yellow` + hard shadow. Mood emoji replaced with Thai mood text (`px-subtitle`) + 3-dot pixel mood-level indicator. Hatch CTA = `px-btn-yellow`. Item tray = flat dark bg + `px-item-card` per item + colored CSS squares as item icons (ITEM_COLORS dict), `px-badge` counts. Action row = `px-btn-dark` + `px-btn-purple`, no emoji.
- **BottomNav.jsx pixel redesign**: `px-bottom-nav` + `px-nav-item` + `px-nav-dot`. Thai font override on labels. Navigation icons are 18×18px colored CSS squares (yellow/purple/blue) instead of emoji.
- **Emoji-free UI (2026-06-11)**: All emoji removed from UI across Home.jsx, Collection.jsx, BottomNav.jsx, WorldScreen.jsx, TreasureSlot.jsx, Report.jsx, CreatureDetailPopup.jsx, HatchOverlay.jsx (toast only). Remaining intentional emoji: TreasureSlot ITEMS array (slot symbols), HatchOverlay creature reveal line 91, BattleScreen creature displays, mini-game egg visuals.
- **Pixel post-processing (2026-06-11)**: `EggCanvas.jsx` runs `pixelateCanvas(canvas, 4)` after `drawEgg()` (downsample→upsample with `imageSmoothingEnabled=false`). `CreatureCanvas.jsx` runs `pixelateCanvas(canvas, 3)` after every `drawCreature()` call (static and animation loop). `drawCreature.js` now uses `imageSmoothingEnabled = false` (was true).
- **MoveSelectBattleMode.jsx pixel redesign**: `px-hp-bar-outer/inner` on HP bars. `px-answer-card` on move cards (`.wrong` = red + px-shake). `px-box` on status panels. `px-name-badge` on enemy/player name labels. `px-dialogue` on dialogue box. `px-btn-purple` on teach start button.

### Egg Home (Home.jsx — redesigned 2026-06-11)
- **Egg Home Pixel Scene** (2026-06-11): `HomeBackground.jsx` fully rebuilt as `<canvas>` pixel renderer. Scale `S = max(1, floor(W/160))`. `imageSmoothingEnabled=false`, all drawing via `fillRect`. Static layer: 3-band sky (day/night), 2 stacked-fillRect mountains, 3-strip ground, 2 pixel-triangle canopy trees, trapezoidal path, 8 cross-shaped pixel flowers (day). Animated layer via RAF: pulsing pixel sun + 8 rays; pixel moon with crescent cutout; 12 twinkling stars (sine opacity); 3 scrolling pixel clouds; 2 butterflies (sine-wave path + cosine wing flap); 1 cross-screen bird (V-wing shape); 4 fireflies with rgba glow (night). Below-canvas div fills bottom 35vh with matching ground color. `hour` prop unchanged; `isDay` computed internally.
- **Egg Home MVP**: Large egg (190×225px) center, idle float / stage 7+ excited pulse. Pet → chirp+sparkle+hearts; streak 3 → giggle+happy-spin; streak 6 → sleepy. Reunion burst on first visit or after >4h. Item tray: food/ribbon/potion/star with count badges. Action row: ลูบไข่ / คอลเลกชัน / ออกสำรวจ. All Adventure Director UI removed.
- **Robust Egg Interaction State Machine (2026-06-10)**: Formal state machine with states `idle/pet/happy/excited/eating/sleep/relax/reunion`. `smRef` tracks `{ state, comboCount, enteredAt }`. `enterState(name, dur?)` cancels in-flight RAF + exit timer before transitioning; generation counter prevents orphaned RAF callbacks. `extendState(name)` extends exit timer without re-triggering CSS animation (smooth repeat taps). Tap combo: 1–3 → pet bounce, 4–7 → happy-spin upgrade, 8+ → excited + sparkles + hearts. Combo resets after 3s inactivity. Item use (food/ribbon/potion/star) resets combo and calls `enterState`. Safety watchdog: setInterval 5s checks if non-idle > 6s → force idle + clear all timers. Unmount cleans up RAF + all timers. All `triggerAnim` calls removed; `petStreak` state removed.
- **Egg Home Emotional Polish (2026-06-09)**: Flying food animation (fixed-position emoji flies to egg, eat chain + chew sound + warm glow, sigh after). Per-item glow (drop-shadow on EggCanvas via `egg-glow-warm/blue/gold/pink` CSS classes). Ribbon 🎀 overlay persists on egg. Star orbit when XP boost active. Random idle micro-animations every 5–12s (`idle-wiggle`/`idle-jump`, occasional chirp/begging sounds). `stageRef` fixes stale closure. 6 new SFX: chew, slurp, giggle, sigh, celebrate, begging. iPhone safe-area layout (CSS `padding-bottom: calc(76px + env(safe-area-inset-bottom))`).
- **Dramatic Egg Stage Progression (2026-06-09)**: 9 display stages (0=ไข่น้อย → 8=ใกล้ฟักแล้ว!!!). Per-stage persistent aura on canvas: `egg-s0`–`egg-s8` CSS classes with pulsing `filter:drop-shadow` (grow stronger + faster each stage). Stage colors in header (dots + name tinted per stage). Stage-up celebration: `stageUp` state → `.stage-up-banner` overlay with "ขึ้นระดับแล้ว!" + stage name, pop+fade animation, `stageUp` ascending fanfare sound, confetti burst (18 sparkles + 6 hearts). Heartbeat sound (`heartbeat`) when ready to hatch (plays once + every 8s). `readyToHatch` check updated to `stage >= 8`. Excited mode starts at stage 7 (was 5).

### Green Meadow World (Phase 2 — Canvas Tile Engine) — NEW 2026-06-10

- **Canvas tile engine**: `src/lib/tileEngine.js` (T constants, GB palette, all tiles drawn in Canvas 2D), `src/lib/tileMaps.js` (BM 20×15 + 8 minimal screens).
- **BM — Starting Path**: Full tile map. Owl NPC (row 3), sign (row 4), tall-grass bands (rows 5–6), stone path (rows 8–9), bunny enemy (row 11), flowers, EXIT_N bottom, EXIT_E/W on sides.
- **Player sprite**: 8-frame directional (4 dirs × 2 walk), egg-stage color body, 120ms tween animation.
- **Camera**: follows player, clamped to map bounds. Canvas = full viewport (`window.innerWidth × window.innerHeight`), `getCamera` takes viewport dimensions, `renderMap` culls to actual canvas size. D-pad overlays on canvas — no separate DOM section.
- **D-pad**: 4-button cross, 56×56px, `position:absolute` overlay on canvas, bottom-left, `opacity:0.75`.
- **Collision**: TREE / WATER / WALL / NPC / SIGN / ENEMY block movement.
- **Screen transition**: EXIT tile → 160ms fade overlay → MOVE_SCREEN + DISCOVER_SCREEN dispatch → player enters new screen from opposite edge.
- **NPC interaction**: Prof Owl at BM col 6, row 3. Proximity → 💬 คุย button → Thai dialogue overlay.
- **Sign**: proximity → 📋 อ่าน → 3-line sign text.
- **Encounter**: 25% on TALL tile → encounter flash + `ENCOUNTER_TRIGGERED` dispatch (no-op, placeholder for future battle entry).
- **8 other screens**: minimal walkable (TREE border, GRASS fill, EXIT tiles), all reachable.
- **State**: No new fields. `ENCOUNTER_TRIGGERED` action added (no-op).
- Phase 1 CSS art WorldScreen fully replaced.

### World Map HUD (2026-06-12, updated 2026-06-14)

- **`WorldHUD` component** in `WorldScreen.jsx` (module-level, above `export default`): Semi-transparent dark strip at top of world screen (`64px + env(safe-area-inset-top)`). 4 sections divided by hairline separators:
  - **Mini-map** (52px wide): 2×2 grid (NW/NE/SW_or_MAZE/SE) + full-width BOSS tile row. Colors: regular tiles = `WORLD_LEVELS[worldLevel].bgColors.ground`; BOSS = dark red `#380000`; MAZE = dark purple `#180830`; undiscovered = `#080e08`. Current screen = yellow outline + • dot (red outline + ★ on BOSS screen). World name (`nameTH`) shown below mini-map.
  - **Creature status**: First party member (fallback: most recently hatched egg). Shows name, Lv.N, HP bar (green/yellow/red by fraction), HP numbers.
  - **XP bar** (58px): Current battle level + gold progress bar using `10 + level² × 2` threshold per level.
  - **Items** (78px): 5 `PixelItemIcon` at 13px for `scroll/thunder/gem/mirror/clover`. Count badge. Dimmed to 20% opacity when count=0.
  - **Home button**: Compact ⌂ + "HOME" label.
- **Camera offset**: `camY = camYBase − round(HUD_CONTENT_H / 2)` shifts map viewport so player centers in visible area below HUD.
- New exports from `WorldScreen.jsx`: `HUD_CONTENT_H = 64` (number constant).

### World Progression System (2026-06-14)

- **`src/config/worldConfig.js`** — `WORLD_LEVELS[3]`: Level 0 = Green Meadow (`ทุ่งหญ้าเขียว`), Level 1 = Dark Forest (`ป่ามืด`, unlock at 20 battleWins), Level 2 = Crystal Cave (`ถ้ำคริสตัล`, unlock at 50 battleWins). Each level has `bgColors`, `enemies[]` pool, `bossEnemy`, `bossHP/ATK/DEF`, `bossNameTH`, `unlockRequirement`. `DYNAMIC_SCREENS` (NW/NE/SW/SE/BOSS/MAZE) with explicit `connects`. Old `SCREENS` (9-screen 3×3) still exported for backward compat.
- **State fields**: `worldLevel:0`, `mazeActive:false`, `mazeCleared:false`, `bossDefeated:[]` in `defaultState()`.
- **New ACTIONS**: `SET_WORLD_LEVEL` (resets to NW, clears maze), `DEFEAT_BOSS` (records defeated level), `ACTIVATE_MAZE`, `CLEAR_MAZE`.
- **Dynamic map generators** (`src/lib/tileMaps.js`):
  - `generateScreenMap(slot, worldLevel)`: 20×15 TREE border, PATH rows 7-8, TALL grass patches per slot, EXIT tiles matching slot position.
  - `generateBossMap(worldLevel)`: winding wall corridors, EXIT_N at row 14 cols 9-10 (entry + return portal).
  - `generateMazeMap()`: recursive backtracker, 20×15 grid carved from (13,1), EXIT_N at (0,17) for clear+reward.
  - `getScreenEnemies(slot, worldLevel)`: 4-6 random enemies from world pool (NW/NE/SW/SE); [] for BOSS/MAZE.
- **Screen layout**: 4 regular screens (NW/NE/SW/SE in 2×2) + BOSS screen (south of SW and SE) + optional MAZE screen (replaces SW when `mazeActive`).
- **Boss screen**: Static boss enemy at `BOSS_TILE = {col:7, row:3}` with `isWorldBoss:true`. Walking into boss → confirmation dialog (หนีก่อน / สู้เลย!). `enterBossBattle` dispatches `SET_PENDING_BATTLE` with `isBossBattle:true` + boss stats from `WORLD_LEVELS[worldLevel]`. Items disabled in boss battle (`isBossBattle` prop flows WorldBattle → MoveSelectBattleMode). Boss always shows red `!` above sprite. On boss victory: `DEFEAT_BOSS` dispatched.
- **Secret maze**: Random 0–20 min timer per world level → `ACTIVATE_MAZE`. When active, NW→S and SE→W route to MAZE instead of SW. Notification shown: "??? ทางลับปรากฏขึ้นทางทิศใต้!". Player always starts at `{col:1, row:13}` in MAZE. Exit via EXIT_N at top → `CLEAR_MAZE` + 3 random item drops (from battle item pool).
- **World unlock**: `useEffect([battleWins])` checks `WORLD_LEVELS[currentLevel+1].unlockRequirement.battleWins` → dispatches `SET_WORLD_LEVEL` + shows 4s world unlock banner.
- **Backward compat**: `VALID_DYNAMIC = new Set(['NW','NE','SW','SE','BOSS','MAZE'])` — old saves with `currentScreen:'BM'` etc. default to 'NW'.

---

### Green Meadow Phase 3 — World Battle + Pokémon Party System (2026-06-12)

- **Party system**: `state.party` (array of creature IDs), `state.partySlots` (1–4, unlocks via battle milestones), `state.battleCreatureId` (fighting creature), `state.pendingBattle` (enemy awaiting creature selection).
- **Creature battle fields**: Each hatched egg now has `id`, `battleLevel`, `battleXP`, `currentHP`, `inParty`, `archived`. Migration in `_migrateBattleStats()` adds fields to legacy eggs on load.
- **ENEMY tile collision**: Walking into enemy now dispatches `SET_PENDING_BATTLE` (stores enemy + scaled HP/ATK from ENEMY_DATA) — battle does NOT start immediately.
- **PartySelect overlay** (`PartySelect.jsx` NEW): Full-screen overlay (zIndex 80) shows when `pendingBattle && !battleCreatureId`. Player picks a creature (mandatory) or — only when all creatures are fainted — presses "กลับแมพ" forced retreat. No flee button shown when any creature is available to fight. On select: `SET_BATTLE_CREATURE + ENTER_BATTLE_FROM_WORLD + navigate('world-battle')`.
- **`WorldBattle.jsx`** (REBUILT): Reads `battleCreatureId`, resolves creature from `hatchedEggs`. Scales enemy HP/ATK/DEF via `scaleMonsterStats(baseStats, creatureLevel)` (×1.0–×3.2 by tier, tiers: ≤5/≤15/≤30/≤50/>50). Returns lowercase `{ hp, atk, def }`. Passes all creature props to `MoveSelectBattleMode`. Questions loop infinitely (regenerates bank on `cur+1 >= total`). Victory only from enemy HP=0. `handleCreatureTakeDamage` → CREATURE_TAKE_DAMAGE. `handleBattleXP` → CREATURE_GAIN_BATTLE_XP + UNLOCK_PARTY_SLOT at 10/50 XP. `handleFaint` → RETURN_FROM_WORLD_BATTLE + navigate('world').
- **Real HP combat** in `MoveSelectBattleMode.jsx`: New props `isWorldBattle/creatureStats/creatureCurrentHP/creatureName/onCreatureTakeDamage/onBattleXP/onFaint`. World battles: maxHP from `enemyData.hp`; hit damage = `Math.round(Math.max(1, creatureStats.ATK − enemy.def) × mult)`; miss = SPD dodge (SPD/200) + DEF reduction (`rawDmg − DEF×0.5`); victory ONLY from HP=0; `onBattleXP(10+5)` called on victory; faint triggers `onFaint()`.
- **`src/lib/drawEnemy.js`** (REBUILT 2026-06-11): Pixel art Canvas sprite renderer. `drawEnemy(ctx, type, size, x, y)` — 7 types: `sleepy_bunny/bunny`, `bouncy_slime/slime`, `fox_kit/fox/tiny_fox`, `egg_pawn`, `leaf_sprite`, `grumpy_mole`, `mushroom_imp`. All draw functions use `ctx.fillRect()` only via `px(ctx, gx, gy, gw, gh, size, color)` helper mapping 48×48 grid to actual pixels. `ctx.imageSmoothingEnabled = false` for crisp 8-bit look. `DRAW_FNS` lookup dispatch.
- **`src/lib/particles.js`** (NEW): Canvas particle system for battle animations. `mkBeam/mkOrb/mkLightning/mkSparks` factories + `tickEffects(ctx, effects, dt)` tick loop. Orb supports `delay` param for staggered XP-orb victory. Used exclusively by `MoveSelectBattleMode`.
- **`src/config/enemyConfig.js`** (NEW): `ENEMY_DATA` lookup for 9 types with `nameTH`, `hp`, `atk`, `def`, `level`, `subject`. Rebalanced for ~10 correct hits at T0: easiest enemies hp=44 (atk=3/4, def=0/1).
- **Dynamic enemy system** (`WorldScreen.jsx` + `tileMaps.js`): Replaced static `ENEMY` tile with `SCREEN_ENEMIES` config (per-screen array of `{type, col, row}`). Enemies initialized into `enemiesRef` on screen change, move at ~20fps in rAF loop, rendered at 32px via `drawEnemy`. Movement patterns: slime bounces N/S, fox patrols E/W, egg_pawn patrols N/S, leaf_sprite/mushroom_imp wander randomly, sleepy_bunny wakes within 3 tiles and chases player. Defeat: enemy removed, respawns after 30s (1800 frames). Player bumps enemy → `triggerBattle()` dispatches battle. Woken bunny shows `!` bubble.
- **Snake/baby_zombie bidirectional collision** (2026-06-11): `tryMove()` checks both destination tile AND whether fast enemies are already on player's current tile. `updateEnemies()` detects when snake/zombie moves onto player tile after each step — returns `pendingBattle`. `loop()` handles `pendingBattle`: calls `triggerBattleRef.current?.(enemy)` and returns immediately. `triggerBattleRef = useRef(null)` wires the RAF-loop stable closure to the current `triggerBattle` useCallback.
- **Enemy defeat disappear** (2026-06-12): On returning from battle, `sessionStorage 'kq_last_battle'` is read on enemy init — first matching type enemy is set `dead: true`. In `updateEnemies()` dead enemies immediately call `scheduleRespawn()` and are removed from the array. No corpse animation.
- **Enemy respawn timer** (2026-06-11): `scheduleRespawn(deadEnemy)` uses `setTimeout` (45–90s random delay) to spawn a fresh enemy at a walkable tile ≥5 tiles from player. `respawnTimerIds[]` collected; all cleared on RAF cleanup (`return () => { ...; respawnTimerIds.forEach(clearTimeout) }`).
- **Player glow** (2026-06-12): `drawPlayerGlow(ctx, px, py, frame)` draws 2 smooth concentric `ctx.arc` rings (outer 85%, inner 58% of tile) behind player sprite every frame. Opacity pulses with `(sin(frame×0.06)+1)/2` (0→1 smooth, outer 0.15–0.65, inner 0.30–0.70). Glow drawn between `renderMap` and `renderPlayer` calls.
- **Treasure chest system** (2026-06-11): `spawnChests(screenId)` picks 2–3 random GRASS/FLOWER tiles per screen on screen entry. Chests rendered on canvas via `drawChest()` (pixel art, 16px, gold sparkle). Walking into a chest opens it → TreasureSlot overlay (slot machine). Slot machine: 3 emoji reels spin independently, stop at frames 15/22/30. Reward: 3 match = 🌟 star ×3 jackpot; 2 match = 🎀 ribbon ×1; else = 🍖 food ×1. Items dispatched via `DROP_ITEM` to inventory. Chests respawn on screen re-entry.
- **GB-style Pokémon battle screen** (`MoveSelectBattleMode` full rebuild): Enemy 120px canvas top-right + Egg 96×112px bottom-left, both slide in from opposite sides via CSS `transform` transition (300ms ease-out, enemy from right, egg from left). ResizeObserver-synced `<canvas>` effect overlay in battle field. `spawnEffect(type)` uses `getBoundingClientRect()` to coordinate particle origins: subject-specific attacks (Thai=golden orb, Math=green beam, English=lightning), combo/ultimate combinations, XP orbs fly enemy→egg staggered on victory. HP bars 10px. Compact 2×2 move cards 168px fixed panel. Typewriter dialogue `▶` at 25ms/char. 3 entry flash sequences. `GBHPBar` sub-component (green/yellow/red threshold). `EnemyCanvas` sub-component with hit-flash + defeat animation.
- **Element attack system** (2026-06-11): 1 random element assigned per battle (lightning/fire/ice/wind/laser/water). Correct answers build `comboRef` which gates tier: T0=1+, T1=3+, T2=5+, T3=8+. Each hit: `getElementTier()` picks tier → `playElementSFX()` (6×4 Web Audio tones) + `playElementAttack()` (canvas animation on `overlayCanvasRef`) + `attackLabel` tier-name flash (element color, `fadeInOut 0.9s`). Element badge pill shown below enemy name. 24 animations in `src/lib/elementAnimations.js`: lightning=zigzag bolts (1→3→5→8-bolt escalation), fire=spark particles/fireball/wave/meteor-impact, ice=diamonds/spears/snowflake-spiral/star-crystal, wind=bezier arcs/leaves/screen-sweep/tornado-spiral, laser=thin-line/glow-beam/impact-ring/8-radial-explosion, water=bubble-float/sine-wave/flood-rise/tidal-wave-sweep.
- **Camera centering fix** (`tileEngine.js`): `getCamera` now returns negative `camX/camY` when map is smaller than viewport — centers 320px map on 390px phone. `renderMap` fills `#3a6a3a` background before tiles + clamps `startCol/startRow ≥ 0`. `WorldScreen.jsx` added `orientationchange` listener.
- **Position restore**: `WorldScreen.jsx` mount effect reads `state.worldPosition` → restores player to saved `{tileX, tileY}` via `initScreen` `forcedStart` param, then dispatches `CLEAR_WORLD_POSITION`.
- **State**: `worldPosition: null` + `worldBattleEnemy: null` added to `defaultState()`. `pendingBattle`, `party`, `partySlots`, `battleCreatureId` added 2026-06-12. New actions: `ENTER_BATTLE_FROM_WORLD`, `RETURN_FROM_WORLD_BATTLE`, `CLEAR_WORLD_POSITION`, `SET_PENDING_BATTLE`, `CLEAR_PENDING_BATTLE`, `SET_BATTLE_CREATURE`, `CREATURE_TAKE_DAMAGE`, `CREATURE_HEAL`, `CREATURE_GAIN_BATTLE_XP`, `ADD_TO_PARTY`, `UNLOCK_PARTY_SLOT`.
- **App routing**: `world-battle` screen added. BottomNav hidden for `world-battle`. PartySelect overlay renders above world screen when `pendingBattle && !battleCreatureId`.
- **Battle item system** (2026-06-12): 5 battle items in `src/config/itemConfig.js`: scroll (skip question), thunder (15 free damage), gem (double XP on next correct), mirror (hint — eliminate 2 wrong cards), clover (block next miss damage). `PixelItemIcon.jsx` — 10×10 canvas icon renderer, palette-indexed per item type. Item bar in `MoveSelectBattleMode` (shown above answer panel when any battle item owned). One use per question turn; `itemUsed` resets to `false` on each new question (`useEffect([cur])`), so player can use one item per question. Eliminated choices shown as dimmed/disabled cards. Shield absorbs 1 miss. XP boost dispatches a second `ADD_XP` on next correct. 10% victory item drop in `showVictory()`. 55% battle item drop in `TreasureSlot.resolveReward()` via `rollBattleItem()`. `WorldScreen.handleTreasureReward` dispatches extra `DROP_ITEM` for `reward.battleItem`. New state keys added to `defaultState` items object: `scroll/thunder/gem/mirror/clover`.
- **Home party HP bars** (2026-06-12): Compact strip above item tray shows each party creature (CreatureCanvas 22px + name + HP bar + HP number). Only shown when `state.party.length > 0`.
- **Collection party/vault tabs** (2026-06-12): ทีม tab (PartyGrid: HP bars + battle level), คลังสะสม tab (VaultGrid: non-party creatures + เพิ่มในทีม button → ADD_TO_PARTY), ทั้งหมด tab (existing HatchedGrid), กำลังฟัก tab (existing CurrentEgg).
- **Research doc**: `docs/research/creatures/creature-battle-system.md` (NEW).
- **`src/lib/drawEnemy.js`** (REBUILT 2026-06-11): Pixel art Canvas sprite renderer. `drawEnemy(ctx, type, size, x, y)` — 7 types: `sleepy_bunny/bunny`, `bouncy_slime/slime`, `fox_kit/fox/tiny_fox`, `egg_pawn`, `leaf_sprite`, `grumpy_mole`, `mushroom_imp`. All draw functions use `ctx.fillRect()` only via `px(ctx, gx, gy, gw, gh, size, color)` helper mapping 48×48 grid to actual pixels. `ctx.imageSmoothingEnabled = false` for crisp 8-bit look. `DRAW_FNS` lookup dispatch.
- **`src/lib/particles.js`** (NEW): Canvas particle system for battle animations. `mkBeam/mkOrb/mkLightning/mkSparks` factories + `tickEffects(ctx, effects, dt)` tick loop. Orb supports `delay` param for staggered XP-orb victory. Used exclusively by `MoveSelectBattleMode`.
- **`src/config/enemyConfig.js`** (NEW): `ENEMY_DATA` lookup for 9 types with `nameTH`, `hp`, `atk`, `def`, `level`, `subject`. Rebalanced for ~10 correct hits at T0: easiest enemies hp=44 (atk=3/4, def=0/1).
- **Dynamic enemy system** (`WorldScreen.jsx` + `tileMaps.js`): Replaced static `ENEMY` tile with `SCREEN_ENEMIES` config (per-screen array of `{type, col, row}`). Enemies initialized into `enemiesRef` on screen change, move at ~20fps in rAF loop, rendered at 32px via `drawEnemy`. Movement patterns: slime bounces N/S, fox patrols E/W, egg_pawn patrols N/S, leaf_sprite/mushroom_imp wander randomly, sleepy_bunny wakes within 3 tiles and chases player. Defeat: enemy removed, respawns after 30s (1800 frames). Player bumps enemy → `triggerBattle()` dispatches battle. Woken bunny shows `!` bubble.
- **Snake/baby_zombie bidirectional collision** (2026-06-11): `tryMove()` checks both destination tile AND whether fast enemies are already on player's current tile. `updateEnemies()` detects when snake/zombie moves onto player tile after each step — returns `pendingBattle`. `loop()` handles `pendingBattle`: calls `triggerBattleRef.current?.(enemy)` and returns immediately. `triggerBattleRef = useRef(null)` wires the RAF-loop stable closure to the current `triggerBattle` useCallback.
- **Enemy defeat disappear** (2026-06-12): On returning from battle, `sessionStorage 'kq_last_battle'` is read on enemy init — first matching type enemy is set `dead: true`. In `updateEnemies()` dead enemies immediately call `scheduleRespawn()` and are removed from the array. No corpse animation.
- **Enemy respawn timer** (2026-06-11): `scheduleRespawn(deadEnemy)` uses `setTimeout` (45–90s random delay) to spawn a fresh enemy at a walkable tile ≥5 tiles from player. `respawnTimerIds[]` collected; all cleared on RAF cleanup (`return () => { ...; respawnTimerIds.forEach(clearTimeout) }`).
- **Player glow** (2026-06-12): `drawPlayerGlow(ctx, px, py, frame)` draws 2 smooth concentric `ctx.arc` rings (outer 85%, inner 58% of tile) behind player sprite every frame. Opacity pulses with `(sin(frame×0.06)+1)/2` (0→1 smooth, outer 0.15–0.65, inner 0.30–0.70). Glow drawn between `renderMap` and `renderPlayer` calls.
- **Treasure chest system** (2026-06-11): `spawnChests(screenId)` picks 2–3 random GRASS/FLOWER tiles per screen on screen entry. Chests rendered on canvas via `drawChest()` (pixel art, 16px, gold sparkle). Walking into a chest opens it → TreasureSlot overlay (slot machine). Slot machine: 3 emoji reels spin independently, stop at frames 15/22/30. Reward: 3 match = 🌟 star ×3 jackpot; 2 match = 🎀 ribbon ×1; else = 🍖 food ×1. Items dispatched via `DROP_ITEM` to inventory. Chests respawn on screen re-entry.
- **GB-style Pokémon battle screen** (`MoveSelectBattleMode` full rebuild): Enemy 120px canvas top-right + Egg 96×112px bottom-left, both slide in from opposite sides via CSS `transform` transition (300ms ease-out, enemy from right, egg from left). ResizeObserver-synced `<canvas>` effect overlay in battle field. `spawnEffect(type)` uses `getBoundingClientRect()` to coordinate particle origins: subject-specific attacks (Thai=golden orb, Math=green beam, English=lightning), combo/ultimate combinations, XP orbs fly enemy→egg staggered on victory. HP bars 10px. Compact 2×2 move cards 168px fixed panel. Typewriter dialogue `▶` at 25ms/char. 3 entry flash sequences. `GBHPBar` sub-component (green/yellow/red threshold). `EnemyCanvas` sub-component with hit-flash + defeat animation.
- **Element attack system** (2026-06-11): 1 random element assigned per battle (lightning/fire/ice/wind/laser/water). Correct answers build `comboRef` which gates tier: T0=1+, T1=3+, T2=5+, T3=8+. Each hit: `getElementTier()` picks tier → `playElementSFX()` (6×4 Web Audio tones) + `playElementAttack()` (canvas animation on `overlayCanvasRef`) + `attackLabel` tier-name flash (element color, `fadeInOut 0.9s`). Element badge pill shown below enemy name. 24 animations in `src/lib/elementAnimations.js`: lightning=zigzag bolts (1→3→5→8-bolt escalation), fire=spark particles/fireball/wave/meteor-impact, ice=diamonds/spears/snowflake-spiral/star-crystal, wind=bezier arcs/leaves/screen-sweep/tornado-spiral, laser=thin-line/glow-beam/impact-ring/8-radial-explosion, water=bubble-float/sine-wave/flood-rise/tidal-wave-sweep.
- **Camera centering fix** (`tileEngine.js`): `getCamera` now returns negative `camX/camY` when map is smaller than viewport — centers 320px map on 390px phone. `renderMap` fills `#3a6a3a` background before tiles + clamps `startCol/startRow ≥ 0`. `WorldScreen.jsx` added `orientationchange` listener.
- **Position restore**: `WorldScreen.jsx` mount effect reads `state.worldPosition` → restores player to saved `{tileX, tileY}` via `initScreen` `forcedStart` param, then dispatches `CLEAR_WORLD_POSITION`.
- **State**: `worldPosition: null` + `worldBattleEnemy: null` added to `defaultState()`. New actions: `ENTER_BATTLE_FROM_WORLD`, `RETURN_FROM_WORLD_BATTLE`, `CLEAR_WORLD_POSITION`.
- **App routing**: `world-battle` screen added. BottomNav hidden for `world-battle`.
- **Battle item system** (2026-06-12): 5 battle items in `src/config/itemConfig.js`: scroll (skip question), thunder (15 free damage), gem (double XP on next correct), mirror (hint — eliminate 2 wrong cards), clover (block next miss damage). `PixelItemIcon.jsx` — 10×10 canvas icon renderer, palette-indexed per item type. Item bar in `MoveSelectBattleMode` (shown above answer panel when any battle item owned). One use per question turn; `itemUsed` resets to `false` on each new question (`useEffect([cur])`), so player can use one item per question. Eliminated choices shown as dimmed/disabled cards. Shield absorbs 1 miss. XP boost dispatches a second `ADD_XP` on next correct. 10% victory item drop in `showVictory()`. 55% battle item drop in `TreasureSlot.resolveReward()` via `rollBattleItem()`. `WorldScreen.handleTreasureReward` dispatches extra `DROP_ITEM` for `reward.battleItem`. New state keys added to `defaultState` items object: `scroll/thunder/gem/mirror/clover`.

### RPG / Egg System
- **Procedural egg**: 9 display stages, adaptive XP (120–800 XP per egg, scales with eggs hatched); `drawEgg()` Canvas — **LOCKED** (`hash`/`prng`/`drawEgg` untouched). `EGG_STAGES=9` in eggAlgorithm.js; `scaledEggProgress()` in StateContext computes display stage 0–8 from adaptive XP threshold.
- **Hatching**: `HatchOverlay.jsx`, tap-to-hatch → `getCreatureForHatch()` → creature revealed
- **Procedural creature**: `drawCreature()` Canvas, rarity from streak at hatch time
- **Tier system**: 6 tiers (0=อนุบาล → 5=ม.ปลาย); `calcCreatureStats()` derives HP/ATK/DEF/SPD/CRIT
- **Collection page**: hatched tab + current egg tab + creature detail popup
- **Item system**: food🍗 ribbon🎀 star⭐ potion💧 — drop in minigames, affect egg state
- **XP boost**: star item = 2× XP for 5 min
- **Happiness decay**: −3/hour after 8h idle, floor 10

### Battle System
- **Turn-based battle**: `BattleScreen.jsx` — `simulateBattle()` pre-computes turn log; animated playback with Pokémon-style per-turn display
- **Stats**: HP, ATK, DEF, SPD, CRIT via `calcCreatureStats()` (derived from subject XP proportions + tier)
- **Challenger system**: every 15 `dailyBattleRounds` → random `AI_OPPONENTS` opponent; grade→tier: 0→T0, 1-2→T1, 3-4→T2, 5-6→T3
- **AI_OPPONENTS all 6 tiers** (Sonic villain theme). **Rebalanced 2026-06-04**: enemy HP ×4 regular / ×3.5 boss; ATK ×2.5 — battles now last 6–15 turns instead of 2–4. Player still usually wins but takes meaningful HP loss.
  T0: Motobug/Buzzbomber/Crabmeat → Egg Pawn → Dr. Eggman I · T1: Caterkiller/Burrobot/Chopper → Egg Gunner → Dr. Eggman II · T2–T5: same villain progression
- **Learning special move** (updated 2026-06-04): Battle starts immediately. After attack 2 or 3 (random), a small overlay prompt appears: "⚡ พลังพิเศษมาแล้ว!" Questions are emoji-visual — Math shows counting emojis (🍎🍎 → tap 2), Thai/English uses TTS (`speakTh`/`speakEn`) with 3 emoji choices (e.g. "ปลา" → 🐟/🐱/🐶). 🔊 replay button on Thai/English. Correct → 25% bonus damage + special SFX fires in animation. Wrong/Skip → battle continues, no penalty. HP updated relative to damage dealt (not absolute log snapshots) so special mid-battle damage is accurate. One prompt per battle.
- **Pokémon-Style Learning Battle** (2026-06-04, updated 2026-06-14): `MoveSelectBattleMode.jsx` — used in world map battles (`WorldBattle.jsx`). Battle-first design: answer choices ARE attack moves. Move panel: 2×2 grid of cards, each showing `[element icon] [answer content]`. Math: number choices. Thai: emoji choices + TTS. English: emoji choices + TTS. No player HP. Wrong = miss fizzle + "โจมตีพลาด!" + continue. Combo system: streak 2=glow, 3=combo flash, 4+=CRITICAL ×1.5. Ultimate: 3 consecutive correct charges ultimate (×2 damage on next correct). Teach intro shown first time per level. Victory always at end of session (last question). Child-facing result screen hides score/accuracy; parent sessionLog still records it.
- **Educational Math Visuals** (2026-06-09): `COUNTABLE_GROUPS` + `COUNTABLES` added to `gameConfig.js` — single source of truth for all 3 math files. 3 semantic categories: fruits (🍎🍌🍓🍊🍒), animals (🐟🐱🐶🐰🐸), everyday (🧸⭐🎈🌸🚗). For addition visual models, emojiA/emojiB now always from same category. `PATTERN_SETS.AB` updated: 🥚 removed, now shape/fruit/animal pairs. Teach overlay examples updated to match.
- **Battle SFX**: `attack` (sword swing) + `hit` (impact) + `crit` (4-tone) + `special` (5-note ascending) + `win` (6-note fanfare) + `lose` (gentle descent). Sound toggle respected via `getSoundOn()` from audio.js.
- **Item reward** on win; defeated bosses tracked in `defeatedBosses[]`

### Procedural Character System (Phases 1A–3, 2026-06-09/10)
- **Phase 1A** — `src/lib/creatureGenerator.js`: `buildCreatureDNA(stats)` returns 30+ gene object (motif, family, 17 body/face/feature genes, h1/h2/h3/ha hues, voicePitch, voiceFamily, birthMark, beautyProfile). Deterministic: pre-drawn 64-value PRNG pool ensures same `buildEggStats()` output → same DNA forever. `detectEggMotif()` maps egg hue/hour/streak to named motif (golden, moon, midnight, dawn, ember, ocean, rainbow, classic). `SIG_CONFLICTS` prevents incoherent trait combos on dragon/puff/dream families. `buildVoiceProfile(dna)`, `verifyCreatureGen()` also exported. Commit: `093080f`.
- **Phase 1B** — `StateContext.jsx`: `buildCreatureDNA(eggStats)` called in `HATCH_COMPLETE` reducer; result stored as `newEgg.dna` (null on error → emoji fallback). `beautyProfile: { outlineWeight, gradientStrength, eyeGloss, cheekGlow, featureDensity }` added to DNA. Streak threshold 100→20 in family determination. Commit: `c3ff44a`.
- **Phase 2** — `src/lib/drawCreature.js` (~490 lines): deterministic canvas renderer. `drawCreature(canvas, dna)`. Painter's algorithm: aura→wings→body→bellyPatch→pattern→ears→head→horn→eyes→nose→mouth→cheeks→accessory→tail→signatureOverlay→birthMark. Beauty Layer: radial gradient body fill, hue-darkened outlines (never black), eye gloss dot always present, cheek radial gradient to transparent. 120px reference coords scaled by `sc = canvas.width/120`. `src/components/CreatureCanvas.jsx`: simple React wrapper. `Collection.jsx`: `egg.dna` → new renderer; no `dna` → legacy `drawLegacyCreature`. Commit: `8b14d00`.
- **Legacy Creature Preview** (2026-06-10): All hatched eggs in Collection now render via `CreatureCanvas` regardless of whether they have real `dna`. `buildLegacyPreviewDNA(egg, index)` in `creatureGenerator.js`: primary path calls `buildCreatureDNA(egg.eggStats)` (deterministic, uses stored hatch-time stats); fallback (no eggStats) synthesises stats from `creature.e`/`rarity`/`cat` + index hash, with emoji nudges (🐉→dragon, 🦊→fox, 🦄→crystal, 🤖→crystal, 💎→crystal, ⚡→star, 🦅→bird). Preview DNA is never persisted, never mutates egg data. `Collection.jsx`: imports `CreatureCanvas` + `buildLegacyPreviewDNA`, removed `creatureAlgorithm` import; `CreatureCard` uses `useMemo` for stable DNA reference; legacy emoji badge shown in canvas corner. Gallery grid changed 3-column 88px → 2-column 120px. CSS: `.catalog-grid-lg`, `.catalog-item-lg` classes. Commit: `8c393f7`.
- **Phase 3** — Creature Personality & Animation (2026-06-10): `drawCreature(canvas, dna, anim)` accepts optional `anim = { blinkAmt, sleepParticles }`. `drawEyes` applies blink: scales eye y-radius by `1 - blinkAmt * 1.25`; below threshold draws closed-eye curve line; crescent/button types squash via `ctx.scale`. `drawSleepZ` renders floating 'z' glyphs for sleep particles. `CreatureCanvas.jsx` rewritten with RAF animation loop: blink state machine (open/closing/closed/opening) driven by personality-specific rate + jitter; sleep Z-particle system (spawn/float/fade). CSS idle animation class (`ci-happy`, `ci-curious`, `ci-brave`, `ci-playful`, `ci-gentle`, `ci-sleepy`, `ci-shy`, `ci-celebrate`) applied to canvas element; 8 keyframe sets in `styles.css` provide body breathing+bob per personality. `prefers-reduced-motion` suppresses all `ci-*` classes. Props: `dna`, `size`, `personality`, `animationEnabled`, `idleMode`. Commit: `658d25c`.
- **Battle Subject Routing** (2026-06-11, revised 2026-06-11) — `src/lib/battleSubject.js`: `getBattleSubject(sessionLog, state)` sorts by readiness priority (exploring→**notready**→comfortable→strong), rotating ties via `dailyBattleRounds`. **Variety safeguard**: if last 3 sessionLog entries are the same subject, rotates to another. `getBattleLevel(subject, state)` now does **adaptive difficulty rotation**: `rotation=[1, maxUnlocked, ceil(maxUnlocked/2)]`; returns `rotation[dailyBattleRounds % 3]` — cycles easy→hard→medium every 3 battles. `src/lib/subjectReadiness.js`: shared `computeReadiness`. `WorldScreen.triggerBattle` uses both.
- **5 UX Fixes** (2026-06-11): D-pad bottom-center (was bottom-left); `QuestionHint` math arithmetic shows colored dot groups (blue a, orange b) + 🔊 icon button; Thai/Eng 🔊 button is icon-only; auto-TTS fires for all subjects on every question (math → Thai number speech "สอง บวก สาม เท่ากับ เท่าไหร่"); tall grass 30% encounter now triggers real battle (was ENCOUNTER_TRIGGERED no-op); visible enemy collision already worked correctly.
- **Full Web Audio BGM + SFX System** (2026-06-11) — all in `src/lib/audio.js` (additions only, no existing code broken):
  - Helper primitives: `_t()` (tone), `_sweep()` (frequency sweep), `_noise()` (white noise burst), `_arp()` (arpeggio), `_vibrato()` (vibrato tone)
  - BGM: `playBGM(track)` / `stopBGM(fadeMs=200)` exports. 4 tracks: `home` (sine pad + triangle melody loop), `world` (bass+sine melody, 8-note), `battle` (sawtooth riff, fast), `victory` (one-shot ascending arpeggio, auto-stops). Cleanup via `bgmNodes[]` + `bgmTimers[]`.
  - SFX: `playSFX(name)` export. 19 named sounds: `attack_launch`, `attack_hit`, `attack_miss`, `enemy_attack`, `player_hit`, `combo`, `ultra_move`, `victory`, `battle_start`, `level_up`, `footstep`, `tall_grass`, `npc_talk`, `screen_enter`, `item_collect`, `enemy_notice`, `egg_pet`, `egg_excited`, `egg_hatch`, `stage_up`.
  - iOS `touchstart` listener resumes suspended AudioContext once.
  - **Wired**: `Home.jsx` (BGM mount/unmount, `stage_up`, `egg_excited`, `egg_pet`); `WorldScreen.jsx` (BGM mount/unmount, `screen_enter`, `footstep`, `tall_grass`, `npc_talk`, `enemy_notice`); `WorldBattle.jsx` (BGM mount/unmount, `stopBGM` on `onComplete`); `MoveSelectBattleMode.jsx` (`battle_start` at entry flash, `attack_launch` on tap, `attack_hit/combo/ultra_move` in fireHit, `attack_miss` in fireMiss, `victory` in showVictory).
- **Beauty Layer** (2026-06-11) — `drawCreature.js` only: `lighten()/darken()` HSL string helpers; `eyeHighlight()` always-on white dot (28% eye radius); `withShadow()` drop-shadow wrapper; `gradEll()` upgraded to 3-stop gradient (lighten→base→darken-12); `FAM_RATIO` table applied geometry-mean-preserving in `buildGeometry()` (16 families, distinct silhouettes); `_cloudBody()` (3 overlapping circles) + `_crystalBody()` (hexagon + facet lines) dispatched by `drawBody()`; `drawBellyPatch()/drawPattern()` skip cloud/crystal; `drawHorn()` spiral+star wrapped in `withShadow()`; eye size cap `Math.min(er, hr*0.30)`; cheek gradient fixed at 0.73/0.40/0.00; star-tipped tail star wrapped in `withShadow()`; `drawAmbientGlow()` subtle primary radial before aura; canvas quality `imageSmoothingEnabled/Quality='high'`.

### Minigames (5 total — all lazy-loaded)
- **EggRun** 🏃: daily reward, requires 10 rounds/day, endless runner, 3 lives/day, speed scales with XP
- **EggCatch** 🧺: unlock at 2 hatched eggs — catch items, dodge rocks/bombs
- **EggMemory** 🃏: unlock at 4 eggs — match pairs of hatched creatures on Canvas
- **EggTower** 🏗️: unlock at 6 eggs — stack blocks, starting width scales with egg stage
- **EggFishing** 🎣: unlock at 10 eggs — timing game, fish drop items

### Persistence & Auth
- **localStorage** key `kq_state` — always-on, written on every state change
- **Supabase** `eggs` table: `user_id (PK), child_name, state_json (jsonb), updated_at`
- **Guest mode**: fully functional without login; localStorage only
- **On SIGNED_IN**: cloud wins if data exists; else pushes local state up silently
- **Egg migration**: `_migrateEggs()` backfills `tier` + `stats` on legacy hatched egg records

### UI / Navigation
- **Profile button** (👤 + name) in Home header — opens `ProfileModal` to change child name and grade
- **ProfileModal**: name input + grade grid (อนุบาล–ป.6), saves via `SET_PROFILE` action, persists to localStorage + Supabase
- **Lock toasts**: EggRun and minigame lock feedback now uses `showToast()` — no more `alert()` calls
- **Persistent sound toggle**: sound preference stored in `localStorage` key `kq_sound`; survives page reload
- **XP boost indicator**: `XpBoostBadge` in Home header shows `⭐ ×2 M:SS` countdown when star item is active
- **Egg Home MVP** (2026-06-09): `Home.jsx` fully replaced with egg-centric home screen. Large egg (190×225px) at center with idle float animation (`egg-anim-float`). Stage 5+ → excited pulse animation. Pet interaction: tap egg or "ลูบไข่" button → chirp + sparkle particles; streak 3 → happy-spin + hearts; streak 6 → sleepy. Reunion burst on first visit or gap >4h. Item tray: food/ribbon/potion/star slots with count badges; tap once to select, tap again (or tap egg) to use. Creature companion walks left-right in creature zone after first hatch; tap for chirp + bounce. Go Explore ("ออกสำรวจ") → routes to world map (WorldScreen). No subject grid, no XP numbers, no Adventure Director, no Egg Run, no stats strip. New state field: `lastHomeVisit` (null). New action: `UPDATE_LAST_HOME_VISIT`. New SFX: `chirp`, `sparkle`, `jingle`, `feed`. Background: soft warm gradient `#FFF9EE → #EEE6FB`.
- **Hatch overlay fix**: `suppressAutoOpen` prop added — overlay no longer interrupts gameplay (`screen === 'game'`). Freeze-after-hatch fixed: `setPhase('tapping')` called in `handleClose()` before dispatches, ensuring `!isOpen && phase === 'tapping'` → overlay unmounts cleanly.
- **Shop Mission feedback**: wrong choice now shows `.wrong` shake animation; streak >= 3 shows `STREAK_MSGS` (🔥 messages) with louder celebration; streak counter styled amber/bold when active. All existing `playTone` calls preserved.
- **Egg pacing (graduated)**: `scaledEggProgress()` in StateContext. Required XP = `min(800, 120 + n×60)` where n = hatched egg count. Egg 1: 120 XP (fast). Egg 5: 360 XP. Cap 800 at egg 12+. `eggStatsData.stage` overridden in derived useMemo so canvas and display stay in sync. Home XP label uses dynamic `xpPerStage`, shows "เกือบฟักแล้ว!" in stage 6.
- **Creature stats rebalanced**: `calcCreatureStats()` uses weighted formula. Every stat: 40% base guarantee + 60% subject-weighted. ATK weighted to Math, DEF to Thai, SPD to English. Minimum any stat = base × 0.50 (no zeros). ±5% deterministic personality. Migration recalculates broken (0/NaN) stats on load.

---

### Green Meadow — Phase 1: World Foundation (2026-06-10)
- **`WorldScreen.jsx`** (NEW): full-screen world overlay (`position:fixed;inset:0;zIndex:50`). AC-style fade transition: 160ms dark green overlay on move, snap to new screen, 160ms fade out. Direction arrows (N/S/E/W) only rendered where `connects[dir]` is non-null. Home button (🏠 กลับบ้าน) top-left, screen name top-right. Egg avatar (`EggCanvas 80×95px`) floats center (`egg-home-float` animation). Day/night computed from `new Date().getHours()`.
- **Starting Path (BM)** — full CSS art scene: sky gradient, sun with glow rings, moon+stars (night), animated clouds (`hbg-cloud-1/2/3`), distant hills (rounded divs), ground gradient, perspective trapezoid path (clip-path polygon), left+right bushes, 5 left flowers + 5 right flowers with float animation, pollen particles (day only).
- **Other 8 screens** — themed placeholder: unique sky/ground gradient palette + screen icon centered in sky. Visually distinct per screen, no "coming soon" text.
- **`worldConfig.js`** (NEW): `SCREENS` object (9 screens: BM/MC/TM/TL/TR/ML/MR/BL/BR), each with `label`, `region`, `connects {N/S/E/W}`. `WORLD_REGIONS` (green-meadow entry). `SCREEN_THEMES` (sky/ground colors + icon per screen).
- **State additions**: `currentRegion: null`, `currentScreen: null`, `discoveredScreens: []` added to `defaultState()`.
- **New ACTIONS**: `ENTER_WORLD` (sets region+screen+discovers), `EXIT_WORLD` (clears region+screen), `MOVE_SCREEN` (updates currentScreen), `DISCOVER_SCREEN` (appends to discoveredScreens, deduped).
- **`Home.jsx`** explore button: was `navigate('game')` + `SET_CURRENT_WORLD` + `SET_SESSION_XP`. Now: `ENTER_WORLD {region:'green-meadow', screen:'BM'}` + `navigate('world')`.
- **`App.jsx`**: `WorldScreen` imported + rendered for `screen === 'world'`. BottomNav hidden for both `game` and `world`.
- **`styles.css`**: `.world-arrow-btn:active { filter: brightness(0.82) }` added.

### Missions
- **Shop Mission MVP** (`GameShop.jsx`): 4 phases / 6 questions — Phase 1 Thai matching ×3 (emoji → Thai name, 4 choices), Phase 2 English vocab ×1, Phase 3 counting 1–5 ×1, Phase 4 social phrase ×1 (accepts both ขอบคุณครับ/ค่ะ). XP dispatched per subject. 80% pass threshold. State: `shopV1: { bestScore, runs, mastered, stretchUnlocked, totalHints, totalDuration, phaseStats }`. Mastery signal tracked (≥90% + ≤1 wrong + ≥2 runs). Always unlocked via Continue Adventure recommendation (first-run condition). Permanent Shop card on Home removed.

### Play Observation System (Phase D)
- **`sessionLog[]`** in state (ring buffer, max 50): each completed game/mission appends an entry with `{ ts, world, missionId, level, dur, score, wrong, hints, completed, replayedImmediately, nextAction, phaseStats }`. `replayedImmediately` computed by reducer from previous same-world entry.
- **`shopV1` extended**: `totalHints`, `totalDuration`, `phaseStats` (per-phase correct/total accumulated across all runs). Per-question correctness tracked via `perQCorrect` ref in `GameShop.jsx`.
- **`LOG_SESSION` reducer**: appends to `sessionLog`, computes `replayedImmediately` from previous log entry.
- **`UPDATE_SHOP_V1` extended**: now accepts `hints`, `dur`, `phaseStats` and accumulates them.
- **Mission Analytics card** in `Report.jsx`: shows runs, avg score, avg duration, hints, per-phase difficulty (✅/⚠️), replay behavior text, one deterministic nudge. Appears only if `shopV1.runs > 0`.
- **Play History card** in `Report.jsx`: replaces old peer-comparison card. Shows last 10 sessions with world label, date, completed/not. No peer reference.
- **All subject games dispatch `LOG_SESSION`**: GameThai (via `useFinishRound`), GameMath (in `next()`), GamePhonics (in each game's `next()`). GameShop dispatches alongside `UPDATE_SHOP_V1`.
- **Subject Readiness card** in `Report.jsx`: `computeReadiness(sessionLog, world)` derived at render time from last 10 entries per subject. 4 states: Strong (แข็งแรงมาก) / Comfortable (กำลังมั่นใจ) / Exploring (กำลังสำรวจ) / Not Ready (ยังไม่มีข้อมูลพอ). Observation footnote: "ดูจากการเล่นล่าสุด ไม่ใช่เลเวลที่ปลดล็อก". No new state fields.

---

## Partially Implemented

- **Single child profile**: editable via ProfileModal; `SET_PROFILE` action updates name + grade in global state
- **Challenger tiers**: `AI_OPPONENTS` now covers all 6 tiers (0–5); grade→tier mapping fixed in StateContext
- **Foundation mode**: Level 0 count-objects game exists; shown only when `grade===0 && !foundationComplete`

---

## Not Implemented

- Multi-child profiles / parent account management
- Payment / subscription (target: 199 THB/month)
- Landing / marketing page
- AI tutor or personalized question generation
- Classroom mode (B2B)
- PWA / mobile app
- Per-session Supabase logging (currently one state blob per user, no row history)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, plain CSS |
| State | useReducer + Context + localStorage |
| Backend | Supabase (PostgreSQL + email/password Auth) |
| Hosting | Vercel (`vercel.json` — migrated from Netlify) |
| Audio | Web Speech API (Thai/English TTS), Web Audio API (SFX), static `.m4a` in `public/sounds/phonics/` |
| Canvas | HTML Canvas 2D — procedural egg (`eggAlgorithm.js` LOCKED) + procedural creature |

---

## Known Risks

- Single-child profile is editable but still one child per account (no multi-child support)
- Single-child assumption baked into `defaultState()` — multi-child requires state shape refactor
- No session audit trail — all progress in one Supabase blob per user
- `SPEC.md` in repo root describes old HTML prototype — deprecated, do not use
