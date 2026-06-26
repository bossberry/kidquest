# Tasks — KidQuest
_Last updated: 2026-06-22_

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

- [ ] **Phase 4: NPC System** — 5 NPCs (Prof Owl already wired; add Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole). Per-NPC: dialogue lines, gift on first talk, repeat-visit dialogue. Use `SCREEN_NPCS` config in `tileMaps.js`.
- [ ] **Creature names per element** — `CREATURE_NAME_SUGGESTIONS[element]` in `creatureSystem.js` — 5 Thai names per element (30 total). Used in HatchOverlay tap-to-name phase.
- [ ] **Thai content expansion** — Levels 6–8: fruits/everyday objects, short phrases, simple sentences (อนุบาล → early ป.1 content)
- [ ] **Math content expansion** — Levels 9–10: place value, counting to 100 (early ป.1 stretch)
- [ ] **English content expansion** — Levels 5–6: longer sentences, basic comprehension

---

## Later (needs Chatbot design first)

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

- [x] **Living Egg renderer + Companion Creation** — `src/egg/` 8-layer system; `CompanionContext`; blocking `CompanionCreation` modal; `companions` Supabase table + RPC (2026-06-26)
- [x] **Companion egg on all screens** — Home/Collection/PartySelect/Battle/Map all show companion egg; name = `state.name`; `drawCreature` retired from player-side rendering (2026-06-26)

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
