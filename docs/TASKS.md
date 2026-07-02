# Tasks — KidQuest
_Last updated: 2026-06-27_

---

## Now

### Phase 4 Refactor — MoveSelectBattleMode.jsx split
`MoveSelectBattleMode.jsx` was ~1190 lines. Goal: extract logical modules without changing behavior.

- [x] Round 1 — Extract GBHPBar, EnemyCanvas, MoveCard, HintBar into `src/components/battle/` ✅
- [x] Round 2 — Extract particle/effect canvas system into `src/hooks/useBattleEffects.js` ✅
- [x] Round 3 — Extract fireHit/fireMiss/showVictory/useBattleItem into `src/hooks/useBattleCombat.js` ✅ — MoveSelectBattleMode refactor complete (1190→711 lines)

### Phase 2 Refactor — WorldScreen.jsx split
`WorldScreen.jsx` was 1700 lines; now 1346. Goal: extract logical modules without changing behavior.

- [x] Round 1 — Extract `WorldHUD` into `src/components/world/WorldHUD.jsx` ✅
- [x] Round 1 — Extract `MissionPanel` into `src/components/world/MissionPanel.jsx` ✅
- [x] Round 2 — Extract pure drawing helpers into `src/lib/worldDrawHelpers.js` ✅
- [x] Round 3 — Extract battle-trigger logic into `src/hooks/useBattleTrigger.js` ✅
- [x] Round 4 — Extract RAF game loop (enemy AI, rendering, camera) into `src/hooks/useWorldGameLoop.js` ✅

### Phase 3 Refactor — Home.jsx split
`Home.jsx` was 952 lines; now 848. Goal: extract logical modules without changing behavior.

- [x] Round 1 — Extract ambient/idle effects into `src/hooks/useHomeAmbience.js` ✅
- [x] Round 2 — Extract interaction state machine into `src/hooks/useCreatureInteraction.js` ✅
- [x] Round 3 — Extract item/tap/swipe handlers into `src/hooks/useHomeInteractions.js` ✅ — Home.jsx refactor complete
- [x] Build verify + zero behavior change after each extraction ✅

---

## Next (no Chatbot decision needed)

- [x] **Sequencing input mode** — 3–4 consecutive alphabet letters to reorder; Thai L1–4 (15%) + English phonics/cvc (15%); Zone 2 shows 🔤; SequenceInput.jsx ✅
- [x] **Word-building (tap-to-spell) input mode for Thai battles** — 50/50 random alternation for levels 2–4; WordBuildInput.jsx in battle/; levels 1 and 5 unchanged ✅
- [x] **Numpad input mode for math battles** — 50/50 random alternation; NumpadInput.jsx in battle/; TEACH_INTRO unchanged (safe — isFirstLevel=false always in world battle) ✅

- [x] **Pixel-art modal restyling** — LoginModal, ProfileModal, OnboardingModal now use `px-auth-sheet`/`px-auth-input`/`px-btn` instead of mismatched rounded Mitr/Fredoka-One styles ✅
- [x] **Interactive pre-login backdrop** — tappable creatures (squish/evolve), pixel-art start button, BGM loop + tap SFX, collapsible LoginModal ✅

- [x] **Coin economy (earn-only)** — `state.coins`; earn on round complete, battle win, minigame, level unlock, daily login; anti-farm mastery decay; Home HUD badge; no spending yet ✅ (2026-06-27)

- [x] **Coin spending system — cosmetic shop (head + face items)** — 18 pixel-art items, shop UI, wardrobe auto-wired to all EggCanvas usages ✅ (2026-06-30)
- [x] **Room / Den decoration system** — 12 furniture items, shop furniture tab, room screen with 4×3 grid placement, 5-tab BottomNav ✅ (2026-06-30)
- [x] **Walker cosmetics** — threaded `state.equipped` into `renderEggSprite.js` (drawCosmetics step) + `DecoratedRoom.jsx` companion ref, so the Home-background room walker shows hats/glasses ✅ (2026-07-01)
- [x] **Shop live try-on preview** — Collection.jsx cosmetics tab: big preview egg + tap-any-card instant try-on; unowned = local-only preview (no coins/persist) with "ลองใส่" tag + "ซื้อ" buy; owned = real equip toggle ✅ (2026-07-01)
- [x] **Furniture shop tab genuinely unreachable — CSS flexbox collapse fix** — the 👗/🏠 tab-switcher (and the หัว/หน้า sub-tab bar) collapsed to 2px because `overflow:hidden` on a shrinkable flex item gets min-height 0 inside the flex-column; both tabs were invisible/unclickable to a real pointer. Added `flexShrink:0, flexGrow:0`. Not a data/import bug — corrects the misattributed 2026-06-30 entry. Live-verified in Chrome ✅ (2026-07-01)
- [x] **World-map walker cosmetics** — `WorldScreen.jsx` now includes `equipped: state.equipped` in `window.__kq_companionEgg`; `tileEngine.renderPlayer` already spread the whole companion object into `renderEggSprite`, so the map walker picks up the existing `drawCosmetics` step automatically — same pattern as the Home room-walker fix above ✅ (2026-07-01)
- [x] **Delete dead HomeBackground.jsx** — confirmed zero remaining imports (Home.jsx uses `DecoratedRoom`); deleted the file and a stale comment reference in Home.jsx ✅ (2026-07-01)
- [x] **Stamp lastSavedAt on every mutating reducer** — full sweep of `StateContext.jsx` (~70 `case ACTIONS.*` reducers) so ANY state mutation stamps `lastSavedAt: Date.now()`, closing the whole resolveSync-revert bug class (not just the two instances already caught: coins in `c74e83d`, cosmetics/room items in `036070f`). `ADD_COINS` specifically included. Live-verified a coin bump survives reload ✅ (2026-07-01)
- [x] **Home screen redesign (approved layout)** — Home.jsx rewritten to: simplified header (avatar/name/stage · 🔥streak · 🪙coins · 🔊), new thin status bar (❤️HP · ⭐XP · 💕Bond — Bond shown on Home for the first time), DecoratedRoom promoted to the central hero zone (walking egg visible) with a floating Lv·stage pill, party bar removed, compact evolution bar removed, pre/post-hatch branch split collapsed (new-player hatch CTA preserved), minigame shortcut card added, item tray restyled (logic unchanged), full-width explore button. Live-verified in Chrome. Build clean ✅ (2026-07-01)
- [x] **Companion egg enlarged on Home** — the redesign left the companion as only a 48px room-walker sprite, too small to be the screen's main character. `DecoratedRoom` gained a `showWalker` prop (default true, `Room.jsx` unaffected); Home now renders `showWalker={false}` (room art only) plus a large centered 200×236 interactive `EggCanvas` on top, with cosmetics/tap-to-pet/bounce/glow/particles all working exactly as pre-redesign. Live-verified ✅ (2026-07-01)
- [x] **Friends room visit + cosmetics display** — mystery-adventurer cards now show a mini room preview (72×80 `RoomScene`: room + companion egg + cosmetics) + stats + inline cosmetic icons; tapping a card opens a full-screen `RoomVisit` overlay (slide-in from right, their room + large egg + stats + cosmetic chips, back button). Shared `drawRoomScene` helper extracted from `DecoratedRoom.jsx` (Home/Room verified unaffected). RPC `get_mystery_adventurers` extended with `equipped_head`/`equipped_face`/`room_layout` — **new migration `20260701_mystery_adventurers_room_visit.sql` MUST be run manually in the Supabase SQL Editor; until then the UI degrades gracefully (empty rooms / no cosmetics)**. `ดูสเตตัส`/`ท้าเล่น` modal flow preserved. Live-verified in Chrome ✅ (2026-07-01)

- [x] **Minigame daily-lives + unlock-gating system** — `src/lib/minigameLives.js` single source of truth (`MINIGAMES` config, `livesRemaining`, `unlockedGames`, `heartsStr`); all 5 minigames (Memory/Catch/Tower/Fishing/Run) now have a `ready` phase showing hearts + start/locked-out button, gated by companion battle level (0/2/6/6/10) and daily lives (5/5/5/3/3, reset via shared `todayStr()`). Fixed a real pre-existing bug found while wiring this up: `EggRun.jsx`'s own inline lives-reset check compared `state.lastRunDate` (stamped by the reducer using `todayStr()`, e.g. `"2026-7-2"`) against `new Date().toLocaleDateString()` — the two formats never match, so EggRun's own ready screen was permanently stuck showing 3/3 hearts regardless of actual remaining plays. Migrated EggRun to the shared module, closing the gap. Resolves the "Minigame picker screen" decision below with a lightweight MVP (no dedicated screen — Home's shortcut card picks randomly among unlocked games with lives left). Coin-reward formulas also rebalanced (higher variance, generally moved from flat 3-tier to reward skill more). Live-verified in Chrome: all 5 ready screens show correct/matching hearts, Home total agrees with each game, EggRun date-format fix confirmed with a direct before/after check, zero console errors. Build clean ✅ (2026-07-02)

- [ ] **Phase 4: NPC System** — 5 NPCs (Prof Owl already wired; add Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole). Per-NPC: dialogue lines, gift on first talk, repeat-visit dialogue. Use `SCREEN_NPCS` config in `tileMaps.js`.
- [ ] **Thai content expansion** — Levels 6–8: fruits/everyday objects, short phrases, simple sentences (อนุบาล → early ป.1 content)
- [ ] **Math content expansion** — Levels 9–10: place value, counting to 100 (early ป.1 stretch)
- [ ] **English content expansion** — Levels 5–6: longer sentences, basic comprehension

---

## Later (needs Chatbot design first)

- [x] **Minigame picker screen** — resolved 2026-07-02 without a dedicated screen: see "Minigame daily-lives + unlock-gating system" in Done below. Still open if wanted later: a real picker screen showing all 5 with per-game lives (vs. the current random-pick shortcut), or routing via map tiles (Phase 6) instead.
- [ ] **Cooking Mission MVP** — after Shop play-validation with Chopin; needs readiness data from real play
- [ ] **Phase 5: Treasure refinement** — fixed treasure spots + hidden clovers per screen
- [ ] **Phase 6: Minigame world triggers** — fullscreen minigame launched from map tile
- [ ] **Phase 8: King Clover Bear boss** — boss arena + full boss flow; needs Chopin playtest gate first
- [ ] **ECA-5: Shop egg presence** — small egg canvas corner of GameShop.jsx (low priority)
- [ ] **First-run onboarding** — before ProfileModal opens; needs UX design
- [ ] **Parent dashboard** — protected route, separate from Report tab

---

## Infrastructure (later)

- [ ] Per-session logging to Supabase `sessions` table
- [ ] Multi-child profiles (state shape refactor + `children` table)
- [ ] Payment integration (Omise or Stripe, 199 THB/month)
- [ ] PWA manifest + service worker
- [ ] Landing / marketing page

---

## Done (major systems)

- [x] **fix: bought cosmetics/room items reverting on reload** — `BUY_ITEM`/`EQUIP_ITEM`/`BUY_ROOM_ITEM`/`PLACE_ROOM_ITEM`/`REMOVE_ROOM_ITEM` now stamp `lastSavedAt` so `resolveSync` doesn't pick a stale remote and revert the purchase (same class as `c74e83d`) (2026-07-01)

- [x] **Living Egg renderer + Companion Creation** — `src/egg/` 8-layer system; `CompanionContext`; blocking `CompanionCreation` modal; `companions` Supabase table + RPC (2026-06-26)
- [x] **Companion egg on all screens** — Home/Collection/PartySelect/Battle/Map all show companion egg; name = `state.name`; `drawCreature` retired from player-side rendering (2026-06-26)
- [x] **Home walker + Collection placeholder** — HomeBackground uses companion egg (drawEggBody+drawEyeLayer to 48×48 offscreen) instead of drawCreature; Collection replaced with "เร็วๆ นี้!" placeholder (EggCanvas + coming-soon text); CreatureDetailPopup.jsx deleted (2026-06-27)
- [x] **Full-pipeline animated walkers + Mystery Adventurers eggs** — `renderEggSprite.js` shared helper; Home/World walkers redrawn per-frame (element animations live); FriendsScreen MysteryTab uses EggCanvasCore; `get_mystery_adventurers` RPC migration written (20260627_mystery_adventurers_egg.sql — apply manually) (2026-06-27)
- [x] **Legacy creature art removal STEP 2+2.5+§3+§4** — BattleScreen/HatchOverlay/CreatureCanvas/drawCreature.js/creatureAlgorithm.js/creatureHelpers.js deleted; LoginBackdrop→egg sprites; EggMemory→emoji; WorldHUD dead globals removed. 165 modules. STEP 3 (DB column drops) pending backup+OK. (2026-06-27)

- [x] **Phase 1.1 Friend Code System** — FriendsScreen.jsx: 2-tab layout (เพื่อน unified scroll + ผู้คนอื่นๆ mystery tab); get_mystery_adventurers RPC; mock challenge toast (2026-06-20)
- [x] **Phase 1 Friend Code System** — FriendsScreen.jsx (4 tabs: My Code / Add / Requests / List); BottomNav 4th tab; Supabase RPCs wired (ensure_friend_code, send_friend_request, respond_friend_request, my_friends view) (2026-06-20)
- [x] Adaptive difficulty system: auto level-up (3 streak ≥80%) + silent level-down (<50%) + LevelUpCutscene + map sky tint by level (2026-06-16)
- [x] Unified progression via PROGRESSION_MAP: tier advance → grade/readyToHatch; calcEvoStage reads thresholds; CreatureJourney roadmap in Collection (2026-06-16)

- [x] React 18 + Vite migration from single-file HTML prototype
- [x] Supabase auth + cloud sync; guest mode; localStorage always-on
- [x] Procedural egg algorithm (LOCKED) — 9 stages, adaptive XP pacing
- [x] Creature system: DNA (creatureGenerator.js) + pixel art (creatureAlgorithm.js), 6 elements × 3 stages, bond meter, evo, auto-names
- [x] Unified creature drawing: `drawCreature` from `creatureAlgorithm.js` used by all screens
- [x] Battle system: MoveSelectBattleMode, real HP, party (4 slots), elements × 4 tiers, battle items
- [x] Map system: canvas tile engine, 3 world tiers, 4 maps per tier + boss + maze, 9 enemy types, HUD
- [x] Learning: Thai 5L, Math 9L, English 4L — mastery unlock, teach overlay, hints, adaptive battle subject
- [x] Home screen: canvas background with walking creatures, egg FSM, creature zone, party bar
- [x] Collection: party/vault/all/current-egg tabs, creature detail popup
- [x] Report: subject readiness, response time analytics, session history
- [x] Minigames: EggRun, EggCatch, EggMemory, EggTower, EggFishing
- [x] Item system: home items (food/ribbon/star/potion) + battle items (scroll/thunder/gem/mirror/clover)
- [x] BGM + SFX (Web Audio API), creature voice (playCreatureSound), Thai/English TTS
- [x] Phase 1 refactor: split gameConfig.js into focused barrel files
- [x] Response time analytics (rolling 50-entry log, Report display)
- [x] ECA relationship fields (adventuresWith, questionsAnswered)
- [x] Hatch biography phase, evolution animation toast
- [x] Visual system: pixel fonts, 16-color palette, CSS class library, emoji-free UI
- [x] ChallengerOverlay deleted (confirmed dead code, 2026-06-16)
- [x] Home creature interaction: tap/swipe bond, bounce animation, emoji reaction

---

## Development Workflow

```
1. npm run build          → confirm zero errors before committing
2. git add <specific files>
3. git commit             → meaningful message
4. git push origin main   → Vercel auto-deploys
5. Update docs            → CURRENT_STATE, TASKS, CHANGELOG, CHATBOT_NOTES (same commit)
6. curl ntfy.sh notification
```
