# Current State — KidQuest
_Last updated: 2026-06-16_

---

## Live Systems

### Egg System
- Procedural canvas egg — `eggAlgorithm.js` (**LOCKED**: `drawEgg`, `hash`, `prng` must never change)
- 9 display stages (ไข่น้อย → ใกล้ฟักแล้ว!!!), adaptive XP threshold (`120 + n×60`, cap 800)
- Stage-up celebration: banner overlay + ascending fanfare + confetti burst
- Per-stage persistent aura via `egg-s0`–`egg-s8` CSS drop-shadow classes
- `EggCanvas.jsx` wraps `drawEgg` + `pixelateCanvas(canvas, 4)` post-processing
- Pet/feed/item interaction with formal FSM in `useCreatureInteraction.js`: `idle/pet/happy/excited/eating/sleep/relax/reunion`
- Tap/swipe handlers extracted to `useHomeInteractions.js`: spawnParticles, pet-combo escalation, item effects, creature bond rewards
- Heartbeat sound on ready-to-hatch; reunion burst on return after >4h

### Creature System
- **Pixel art rendering** — `drawCreature(canvas, seed, stats)` + `getCreatureSeed(egg)` from `creatureAlgorithm.js` — **single source of truth for all screens**
  - Used by: Home.jsx (large 160px + party bar), HomeBackground.jsx (walking sprites), Collection.jsx (90px cards), PartySelect.jsx (56px), MoveSelectBattleMode.jsx (world battles), BattleScreen.jsx, EggMemory.jsx, WorldScreen.jsx (player sprite via `window.__kq_activeCreatureSeed/Stats` globals)
  - 12×12 pixel grid, 6 elements × 3 evo stages (baby/teen/final)
- **DNA beauty layer** — `drawCreature.js` + `CreatureCanvas.jsx` — used by HatchOverlay only
- `src/lib/creatureSystem.js`: `determineElement()`, `calcEvoStage()`, `CREATURE_ELEMENT_COLORS`, `CREATURE_ELEMENT_NAMES_TH`, `EVO_STAGE_LABELS_TH`
- `src/lib/creatureGenerator.js`: `buildCreatureDNA()`, `buildVoiceProfile()`, `generateCreatureName()`
- Bond meter (0–100): `ADD_CREATURE_BOND` action; bond≥25 ATK×1.05, bond≥50 SPD+30, bond≥100 ATK×1.5, bond≥75 passive heal per correct answer
- Evolution: baby→teen (battleLevel≥11, tier≥2); teen→final (battleLevel≥26, tier≥5, bond≥60)
- Auto-generated Thai names via `generateCreatureName(dna)` — set at hatch, backfilled for legacy eggs
- 6-creature hard limit; single active creature shown large on Home
- `HomeBackground.jsx` canvas: `creatures` prop (array of hatchedEggs) → one animated entity per creature, walk/idle/jump/spin state machine, meeting gimmick, golden glow on center creature

### Treasure Chest (Map Chests)
- `TreasureSlot.jsx`: question gate → correct → chest shakes (tap to open) → chest opens → items float up → collect
- Rolls home item (55% from food/ribbon/shoes/rainbow_star) + battle item via `rollBattleItem()`
- Items drawn via `drawItem` canvas with glow + Thai label + type badge (สู้/บ้าน)
- `onReward` passes `{ rewards: [{type,key},...] }`; WorldScreen dispatches `DROP_HOME_ITEM`/`DROP_BATTLE_ITEM` per item
- Wrong answer: red flash + close (no retry)

### Post-Battle Reward Chest
- `RewardChest.jsx`: shown after every world battle victory (incl. bosses); phases: closed→shaking→opening→reveal; tap to open, tap to continue
- Battle item drop: 55% chance via `rollBattleItem()` from `itemConfig.js`
- Home item drop: 40% chance from `HOME_DROP_TABLE` (food 50 / ribbon 25 / shoes 15 / rainbow_star 10) in `WorldBattle.jsx`
- Items dispatched immediately (DROP_BATTLE_ITEM / DROP_HOME_ITEM) then chest shows pixel art of each reward
- Navigate-to-world deferred until player taps through chest

### Battle System (World Battles)
- `MoveSelectBattleMode.jsx` (~1190 lines) — answer choices = attack moves
- Real HP combat: hit damage = `max(1, creatureStats.ATK − enemy.def) × mult`; miss = SPD/200 dodge + DEF reduction
- Element attack system: 1 random element per battle × 4 tiers (T0–T3 by combo streak); 24 canvas animations in `elementAnimations.js`; `playElementSFX()` 6×4 Web Audio tones
- Battle items: scroll (skip), thunder (15 free damage), gem (double XP), mirror (hint — eliminate 2 wrong), clover (block miss damage). `itemConfig.js` + `PixelItemIcon.jsx`
- Party system: `state.party[]` (up to 4 slots), `PartySelect.jsx` overlay between encounter and battle
- Response time analytics: rolling 50-entry log per subject in `state.responseTimeLogs`
- `WorldBattle.jsx`: wraps MoveSelectBattleMode for world map battles; scales enemy stats via `Math.pow(level, 1.8)`
- Canvas particle effects: `particles.js` (beam/orb/lightning/sparks)
- Enemy sprites: `drawEnemy.js` — 9 types via `ctx.fillRect` pixel art

### Map System
- Canvas tile engine: `tileEngine.js` (T constants, GB palette, collision, camera) + `tileMaps.js` (map generators)
- 3 world tiers: Green Meadow (tier 0), Dark Forest (tier 1), Crystal Cave (tier 2) — defined in `worldConfig.js`
- Per tier: 4 regular maps (NW/NE/SW/SE) + BOSS map + secret MAZE map
- Boss unlock: all 4 maps cleared + totalXP ≥ 300; defeat boss → cutscene → next tier
- Secret maze: spawns when `battleWins % 10 === 0`; 30-min countdown; clear for 3 random item drops
- 9 enemy types with movement patterns (patrol/wander/chase/aggro); 30s respawn timer
- World HUD (WorldScreen.jsx): mini-map + creature status + XP bar + battle items + item bag + home button
- Treasure chests: `TreasureSlot.jsx` slot machine overlay with gate question; `PixelItemIcon.jsx`
- Screen transitions: 160ms fade; player position restored after battle (`state.worldPosition`)

### Learning System
- 3 subjects, mastery-based unlock (≥80% accuracy EMA):
  - **Thai** — 5 levels: letter match, spell ×3, word-order
  - **Math** — 9 levels: L0 count, L1–L5 add/sub/mixed, L6 word-problems, L7 comparison, L8 patterns AB
  - **English** — 4 levels: phonics, CVC, sight words, sentence ordering
- Math visual models: L1/L2 = emoji objects grid; L3 = ten-frame; L4 = cross-out; L5+ = dot visualization
- Teach overlay (first time per level), GameHeader (progress + streak), hint system (amber highlight / reveal)
- Battle subject routing: `battleSubject.js` — strict thai→math→eng rotation with `notready` override
- **Adaptive difficulty system** (2026-06-16):
  - `state.subjectLevels` drives actual battle level (replaces `getBattleLevel()` rotation)
  - After each non-boss battle: `isStrong = accuracy≥80% AND questions≥6`; 3 consecutive strong → level up + cutscene
  - Accuracy <50% AND questions≥6 → silent level down (clamped to `subjectLevelFloor`)
  - Level up dispatches `SET_PENDING_LEVEL_UP` → `LevelUpCutscene.jsx` global overlay shows
  - `LevelUpCutscene.jsx`: flash→reveal→celebrate→done phases; canvas star rain; tap to continue → navigate('world')
  - Map sky tint shifts by subject level: L1=dawn, L2=golden, L3=sunset, L4+=dark (CSS rgba overlay, 3s transition)
  - `WorldBattle.jsx` uses `accuracyRef` (correct/total) — `scoreRef` preserved for backward compat only
- **Grade system** (updated 2026-06-16): `state.grade` computed from avg subject level in `SET_SUBJECT_LEVEL` reducer: avg≥2→grade1, avg≥3→grade2, avg≥4→grade3; grade only advances; creature evoStage updated immediately on grade change via `calcEvoStageInline()`
- **PROGRESSION_MAP** (2026-06-16) — `battleConfig.js` — unified tier/evo/egg system:
  - 5 tiers: อนุบาล (L1) → ป.1ต้น (L2) → ป.1ปลาย (L3) → ป.2 (L4) → ป.3+ (L5)
  - `readyToHatch` set when grade advances and hatchedEggs < 6
  - `calcEvoStage()` reads PROGRESSION_MAP evo thresholds: teen (Lv≥11, Tier≥1); final (Lv≥26, Tier≥3, Bond≥60)
  - `calcEvoStageInline()` in StateContext.jsx for reducer use (avoids circular import)
- `subjectReadiness.js` shared utility: 4 states (Strong/Comfortable/Exploring/Not Ready)

### Home Screen (`Home.jsx`, ~969 lines)
- `HomeBackground.jsx` canvas: pixel scene (sky, mountains, ground, sun/moon, clouds, butterflies, bird, fireflies) + animated creature entities
- Egg zone: large EggCanvas (190×225px), floating + aura. Post-session growth banner when `sessionXP > 0`
- Creature zone: large 160×160 `drawCreature` canvas (tap/swipe for bond), party portrait bar (56×56 per creature, gold border on active)
- Item tray: food/ribbon/shoes/rainbow_star; cooldown status from `state.activeBoosts`; active/cooldown overlays; saiyan aura drop-shadow on creature canvas when rainbow_star active
- HatchOverlay biography phase (`bio`) before egg tapping when active creature has adventures
- Creature companion tap: `handleCreatureTap` (+1 bond + bounce + emoji reaction); 3 swipes = +3 bond + 💖

### Collection Screen (`Collection.jsx`)
- CreatureJourney: evolution roadmap shown under each party creature card; ○/⚡/✅ per step (teen/final); shows Lv, Tier, Bond requirements; BABY→TEEN→FINAL stage bar
- 2 tabs: ทีม (party with HP bars + level + ★ ตัวหลัก badge) + กระเป๋า (ItemBag)
- ItemBag: two sections — "ไอเทมดูแลครีเอเจอร์" (homeItems: food/ribbon/shoes/rainbow_star) + "ไอเทมในการสู้" (battleItems: scroll/thunder/gem/mirror/clover); divider between sections; `drawItem` canvas per slot; count badge; dimmed when count=0
- Pixel art header: "COLLECTION" in font-pixel yellow; dark background matching Home screen
- Creature cards: 90×90 pixel art `drawCreature` canvas per creature
- `CreatureDetailPopup.jsx`: 120×120 pixel art canvas + element glow, Level + evo stage, ATK/DEF/SPD/HP grid, bond meter bar, born-stats XP bars

### Report Screen
- Pixel art dark theme (matches Home/Collection)
- Section 1: Overview stats — mins played, rounds passed, accuracy %, streak
- Section 2: Subject XP bars (Thai/Math/Eng) with readiness label from `computeReadiness()`
- Section 3: LEVEL · GRADE — `SubjectLevelCard` per subject; header shows current level name + grade badge; tap expands full level table with ✓/►/· status icons per level
- Section 4: Response speed per subject — avg seconds + trend arrow (only when ≥5 logs)
- Section 5: Parent Report — natural Thai sentences generated from real data
- Section 6: "ควรเล่นอะไรต่อ" — actionable suggestion based on weakest subject + streak
- `SUBJECT_LEVEL_MAP` in Report.jsx: 5 Thai levels, 9 Math levels, 4 Eng levels each with Thai grade label (อนุบาล/ป.1/ป.2)

### Item System
- `state.homeItems`: food/ribbon/shoes/rainbow_star — used on Home screen; affect HP/activeBoosts
- `state.battleItems`: scroll/thunder/gem/mirror/clover — used in battle; drop 10% on victory, 55% from treasure chests
- `state.activeBoosts`: persisted boost state (ribbon/shoes/rainbow_star) with `endsAt` timestamp; ribbon/shoes/rainbow_star boosts stored here after use
- ACTIONS: USE_HOME_ITEM, USE_BATTLE_ITEM, DROP_HOME_ITEM, DROP_BATTLE_ITEM (backward-compat USE_ITEM/DROP_ITEM aliases remain)
- localStorage migration: old `items{}` → homeItems/battleItems; star→rainbow_star, potion→shoes on load
- HOME_ITEMS config in `itemConfig.js` with duration/cooldown per item
- itemArt.js: pixel art for shoes (orange sneaker) + rainbow_star (multicolor 8-arm star)

### Audio
- BGM: `playBGM(track)` / `stopBGM()` — 4 tracks (home/world/battle/victory) via Web Audio API
- SFX: `playSFX(name)` — 19 named sounds; iOS `touchstart` resume
- TTS: Web Speech API — Thai (`speakTh`), English (`speakEn`), math Thai number words
- Creature voice: `playCreatureSound(voiceProfile, moment)` — 5 families, pitch-shifted per DNA
- Static `.m4a` phonics files in `public/sounds/phonics/`

### Minigames (5, lazy-loaded)
| Game | Unlock | Description |
|------|--------|-------------|
| EggRun | daily (10 rounds) | Endless runner, 3 lives/day |
| EggCatch | 2 hatched eggs | Catch items, dodge rocks |
| EggMemory | 4 hatched eggs | Match pairs of creature canvases |
| EggTower | 6 hatched eggs | Stack blocks |
| EggFishing | 10 hatched eggs | Timing-based fish for items |

### Persistence & Auth
- localStorage key `kq_state` — always-on, written every state change
- Supabase `eggs` table: `user_id, child_name, state_json, updated_at`
- Guest mode: full functionality without login
- `_migrateBattleStats()` backfills all new fields for legacy eggs on load
- One-time migration flags: `_subjectLevelCalibrated` (recalibrate subjectLevels from levelMastery), `_itemsMigrated` (additive items→homeItems/battleItems merge), `_evoRechecked` (recheck all creature evoStage on load)

### Config Architecture (2026-06-16 refactor)
`gameConfig.js` is a barrel re-exporting from focused split files. All existing imports unchanged.

| File | Contents |
|------|----------|
| `creatureConfig.js` | `HATCH_CREATURES`, `GRADE_LABELS`, `CREATURE_LEVELS`, `TIERS`, `calcCreatureStats()` |
| `battleConfig.js` | `BOSS_XP_THRESHOLD`, `AI_OPPONENTS` |
| `mapConfig.js` | `MAP_THEMES` |
| `gameConfig.js` | All learning content (ITEMS, TH_ALPHA, LEVELS, TEACH_CONTENT, etc.) + barrel re-exports |

### Visual System
- Pixel font: Press Start 2P (EN/numbers), Sarabun (Thai), Mitr/Fredoka One (headings)
- 16-color pixel palette + CSS variable library (`--px-*`) in `styles.css`
- Pixel class library: `px-box`, `px-btn`, `px-hp-bar`, `px-answer-card`, `px-dialogue`, etc.
- `image-rendering: pixelated` on all `img,canvas`; square corners everywhere

---

## Removed Systems
- **ChallengerOverlay** — deleted 2026-06-16, confirmed dead code
- **Collection vault/hatched/current tabs** — deleted 2026-06-16; replaced by ItemBag
- **Manual creature naming UI** — replaced by auto-generated names via `generateCreatureName(dna)`
- **GPT workflow** — Claude Chatbot handles all design/research

---

## Not Implemented
- NPC dialogue system (Phase 4 — next major feature)
- Multi-child profiles / parent account management
- Payment / subscription (target: 199 THB/month)
- Landing / marketing page
- PWA / offline service worker
- Per-session Supabase logging (currently one state blob per user)

---

## Known Issues
None currently.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, plain CSS |
| State | useReducer + Context + localStorage |
| Backend | Supabase (PostgreSQL + email/password Auth) |
| Hosting | Vercel (auto-deploy from `main`) |
| Canvas | HTML Canvas 2D — procedural egg (LOCKED) + pixel art creatures |
| Audio | Web Speech API (TTS), Web Audio API (SFX), static `.m4a` phonics |
