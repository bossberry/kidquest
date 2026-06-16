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
- Pet/feed/item interaction with formal FSM in `Home.jsx`: `idle/pet/happy/excited/eating/sleep/relax/reunion`
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
- Adaptive level rotation: `getBattleLevel()` cycles easy→hard→medium every 3 battles
- `subjectReadiness.js` shared utility: 4 states (Strong/Comfortable/Exploring/Not Ready)

### Home Screen (`Home.jsx`, ~969 lines)
- `HomeBackground.jsx` canvas: pixel scene (sky, mountains, ground, sun/moon, clouds, butterflies, bird, fireflies) + animated creature entities
- Egg zone: large EggCanvas (190×225px), floating + aura. Post-session growth banner when `sessionXP > 0`
- Creature zone: large 160×160 `drawCreature` canvas (tap/swipe for bond), party portrait bar (56×56 per creature, gold border on active)
- Item tray: food/ribbon/potion/star with count badges; fly animation on use
- HatchOverlay biography phase (`bio`) before egg tapping when active creature has adventures
- Creature companion tap: `handleCreatureTap` (+1 bond + bounce + emoji reaction); 3 swipes = +3 bond + 💖

### Collection Screen (`Collection.jsx`)
- Tabs: ทีม (party with HP bars + level), คลังสะสม (vault + add-to-party), ทั้งหมด (all hatched), กำลังฟัก (current egg with EggCanvas)
- Creature cards: 90×90 pixel art `drawCreature` canvas per creature
- `CreatureDetailPopup.jsx`: 120×120 pixel art canvas + element glow, Level + evo stage, ATK/DEF/SPD/HP grid, bond meter bar, born-stats XP bars

### Report Screen
- Subject Readiness: 4 states from last 10 sessions per subject
- Response Speed: avg response time per subject (last 10 answers) + trend vs previous 10
- Session history: last 10 entries, world label + date + completed status
- Mission Analytics: runs/avg score/avg duration/hints/per-phase difficulty for Shop Mission

### Item System
- Home items: food/ribbon/star/potion — drop from minigames, affect egg state
- Battle items: scroll/thunder/gem/mirror/clover — drop 10% on battle victory, 55% from treasure chests
- `DROP_ITEM`, `USE_ITEM` actions; `USE_BATTLE_ITEM` in battle flow

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
