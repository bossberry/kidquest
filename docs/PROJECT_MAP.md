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
│   └── gameConfig.js       — ALL game content + config (346 lines — edit here for content)
│       ├── TH_ALPHA(44) SPELL_L1(24) TH_L2(20) TH_L3(14) TH_L5(9)
│       ├── EN_ALPHA(26) CVC_WORDS(24) SIGHT_DATA(16) ENG_SENTS(12)
│       ├── MATH_WORDS(16)
│       ├── LEVELS, TEACH_CONTENT, MG_UNLOCK/COLORS
│       ├── TIERS(0-5), calcCreatureStats(), AI_OPPONENTS(tier 0+1)
│       └── shuffle(), todayStr()
│
├── lib/
│   ├── state.js            — defaultState(), loadState(), saveState(), syncToSupabase()
│   ├── supabase.js         — createClient (URL + publishable key)
│   ├── eggAlgorithm.js     — LOCKED: drawEgg(), hash(), prng(), eggProgress(), buildEggStats()
│   ├── creatureAlgorithm.js — drawCreature(), getCreatureSeed()
│   └── audio.js            — playTone(), speakTh(), speakEn(), playPhonicsSound()
│
├── games/
│   ├── GameScreen.jsx      — Routes by currentWorld; all 8 games are lazy-loaded (44 lines)
│   ├── GameThai.jsx        — Match + Spell + WordOrder; GameHeader + useFinishRound (381 lines)
│   ├── GameMath.jsx        — MathLevelGame; timer, 3-attempt hints (157 lines)
│   ├── GamePhonics.jsx     — Phonics + CVC + Sight + Sentence; GameHeader (191 lines)
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
│   ├── Home.jsx            — Egg + XP bar + world cards + minigame buttons (176 lines)
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
