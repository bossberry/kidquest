# Project Map — KidQuest

## Root Files
```
kidquest/
├── CLAUDE.md          — Rules for Claude Code (read first each session)
├── SPEC.md            — OUTDATED (describes old HTML prototype, ignore)
├── index.html         — Vite entry HTML
├── index.html.bak     — Old single-file prototype backup (ignore)
├── package.json       — react 18, react-dom, @supabase/supabase-js, vite
├── vite.config.js     — Vite + react plugin
├── vercel.json        — Vercel SPA rewrite rule
└── netlify.toml       — Legacy (no longer active)
```

## docs/
```
docs/
├── CURRENT_STATE.md   — Features, tech stack, risks
├── TASKS.md           — Backlog + done history
├── DECISIONS.md       — Locked rules + architecture constraints
├── CHANGELOG.md       — Reverse-chronological changes
├── SESSION_SUMMARY.md — Latest session (overwritten each session)
├── PROJECT_MAP.md     — This file
├── CODEBASE_SUMMARY.md — Architecture + key functions for GPT
└── ARCHITECTURE.md    — User/game/egg/persistence flow diagrams
```

## src/
```
src/
├── main.jsx           — ReactDOM entry, wraps App in StateProvider
├── App.jsx            — Screen router (home/game/collection/report) + global overlays
├── styles.css         — All CSS (CSS vars, utility classes, game styles)
│
├── context/
│   ├── StateContext.jsx    — useReducer + Context, 20+ ACTIONS, Supabase sync (350 lines)
│   └── creatureHelpers.js  — getCreatureForHatch()
│
├── config/
│   ├── gameConfig.js       — barrel re-exporter + remaining content (ITEMS, LEVELS, TEACH_CONTENT, etc.)
│   ├── creatureConfig.js   — HATCH_CREATURES, CREATURE_LEVELS, TIERS, calcCreatureStats, GRADE_LABELS
│   ├── battleConfig.js     — BOSS_XP_THRESHOLD, AI_OPPONENTS
│   └── mapConfig.js        — MAP_THEMES
│       ├── TH_ALPHA(44) SPELL_L1(24) TH_L2(20) TH_L3(14) TH_L5(9)
│       ├── EN_ALPHA(26) CVC_WORDS(24) SIGHT_DATA(16) ENG_SENTS(12)
│       ├── MATH_WORDS(16)
│       ├── LEVELS, TEACH_CONTENT, MG_UNLOCK/COLORS
│       ├── TIERS(0-5), calcCreatureStats(), AI_OPPONENTS(tier 0+1)
│       └── shuffle(), todayStr()
│
├── hooks/
│   ├── useBattleTrigger.js       — triggerBattle, enterBossBattle, all 3 battle refs; extracted from WorldScreen
│   ├── useWorldGameLoop.js       — RAF render/update loop: enemy AI (9 types), respawn, rendering, camera
│   ├── useHomeAmbience.js        — idle animations, butterfly/leaf/star events, stage-up, heartbeat, reunion, growth banner
│   ├── useCreatureInteraction.js — creature interaction FSM (enterState/extendState/setGlow/watchdog); owns eggAnim, eggGlow, smRef
│   ├── useHomeInteractions.js    — tap/swipe handlers (handlePetEgg/handleTapItem/handleCreatureTap/handleCreatureSwipe); owns spawnParticles, particleIdRef, swipeCountRef
│   ├── useBattleEffects.js       — particle/effect canvas system: ResizeObserver sync, RAF loop, spawnEffect(); owns effectCanvasRef, overlayCanvasRef
│   └── useBattleCombat.js        — battle combat engine: fireHit, fireMiss, showVictory, useBattleItem; receives all state setters/refs as params
│
├── lib/
│   ├── state.js            — defaultState(), loadState(), saveState(), syncToSupabase()
│   ├── supabase.js         — createClient (URL + publishable key)
│   ├── eggAlgorithm.js     — LOCKED: drawEgg(), hash(), prng(), eggProgress(), buildEggStats()
│   ├── creatureAlgorithm.js — drawCreature(), getCreatureSeed()
│   ├── creatureSystem.js   — determineElement(), calcEvoStage(), getEggElementHint(), CREATURE_ELEMENT_COLORS
│   ├── audio.js            — playTone(), speakTh(), speakEn(), playPhonicsSound()
│   ├── tileEngine.js       — T constants, renderMap/Player/canMove/getCamera/getExitAt/getEntryPosition
│   ├── tileMaps.js         — BM_MAP (20×15) + 8 minimal screen maps + SCREEN_MAPS registry
│   └── worldDrawHelpers.js — drawChest, drawPlayerGlow, spawnChests, findSpecials, getOwlLines, SIGN_LINES, STAGE_COLORS
│
├── games/
│   ├── GameScreen.jsx      — Routes by currentWorld; all 8 games are lazy-loaded (44 lines)
│   ├── GameThai.jsx        — Match + Spell + WordOrder; GameHeader + useFinishRound (381 lines)
│   ├── GameMath.jsx        — MathLevelGame; timer, 3-attempt hints (157 lines)
│   ├── GamePhonics.jsx     — Phonics + CVC + Sight + Sentence; GameHeader (191 lines)
│   ├── MoveSelectBattleMode.jsx — Pokémon-style battle shell for all 3 subjects (711 lines; fully refactored)
│   ├── LevelSelector.jsx   — Level grid (locked/preview/unlocked) (61 lines)
│   ├── TeachOverlay.jsx    — First-time intro per level (32 lines)
│   └── minigames/
│       ├── EggRun.jsx      — Endless runner daily reward (217 lines)
│       ├── EggCatch.jsx    — Catch falling items (111 lines)
│       ├── EggMemory.jsx   — Card matching (105 lines)
│       ├── EggTower.jsx    — Block stacking (102 lines)
│       └── EggFishing.jsx  — Timing fishing game (132 lines)
│
├── components/
│   ├── Home.jsx            — Egg Home: layout + state wiring only; interaction logic in 3 hooks (632 lines)
│   ├── WorldScreen.jsx     — Canvas tile engine: rAF loop, D-pad, GB palette tiles, NPC dialogue (~250 lines)
│   │
│   ├── battle/             — Extracted presentational components from MoveSelectBattleMode
│   │   ├── GBHPBar.jsx     — GB-style HP bar (player green/yellow/red; enemy red/orange)
│   │   ├── EnemyCanvas.jsx — Enemy pixel art canvas with hurt/defeat animation states
│   │   ├── MoveCard.jsx    — Answer move button with emoji/text font-size logic
│   │   ├── HintBar.jsx     — Dot-group math hint bar; exports numTh(), mathToThai()
│   │   ├── NumpadInput.jsx    — Digit-by-digit numeric entry for math numpad mode; resets on resetKey prop
│   │   ├── WordBuildInput.jsx  — Tap-to-place spelling for Thai wordbuild mode; shuffled tray + distractors; auto-submits on last tile
│   │   └── SequenceInput.jsx   — Tap-to-place letter ordering for sequence mode; shuffled run of 3-4 alphabet chars; auto-submits on last tile
│   ├── BattleScreen.jsx    — Turn-based battle sim + animation (292 lines)
│   ├── ChallengerOverlay.jsx — Full-screen challenger announcement (169 lines)
│   ├── Collection.jsx      — Hatched creatures + current egg tabs (86 lines)
│   ├── CreatureDetailPopup.jsx — Creature stats popup (68 lines)
│   ├── EggCanvas.jsx       — Canvas wrapper for drawEgg() (19 lines)
│   ├── EggPopup.jsx        — Egg detail / item feed popup (92 lines)
│   ├── HatchOverlay.jsx    — Hatch animation sequence (121 lines)
│   ├── LoginModal.jsx      — Supabase email/password form (63 lines)
│   ├── Report.jsx          — Parent dashboard (76 lines)
│   ├── BottomNav.jsx       — Home/Collection/Report nav (28 lines)
│   ├── Toasts.jsx          — XPToast, ItemToast, ConfettiLayer (88 lines)
│   └── ErrorBoundary.jsx   — React error boundary (34 lines)
│
└── assets/
    └── phonicsAudio.js     — Exports path map for .m4a files (5 lines)

public/sounds/phonics/      — a.m4a → z.m4a (26 static phonics audio files)
```
