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

### RPG / Egg System
- **Procedural egg**: 7 stages × 50 XP = 350 XP total; `drawEgg()` Canvas — **LOCKED**
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
- **Battle SFX**: `attack` (sword swing) + `hit` (impact) + `crit` (4-tone) + `special` (5-note ascending) + `win` (6-note fanfare) + `lose` (gentle descent). Sound toggle respected via `getSoundOn()` from audio.js.
- **Item reward** on win; defeated bosses tracked in `defeatedBosses[]`

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
- **Home 2.0 — Adventure Director**: `Home.jsx` restructured. Single `⭐ ผจญภัยต่อ` recommendation card (deterministic: hatch → **battle** → shop-first-run → weakest-subject). Battle card shows when `state.pendingChallenger` exists: dark gradient card with challenger emoji + "มอนสเตอร์ปรากฏตัว!" — tapping opens ChallengerOverlay. Subject grid behind collapsible "อยากเลือกเอง?" toggle (closed by default). Shop Mission card removed from Home. 2×2 minigame grid replaced with `🎁 เซอร์ไพรส์วันนี้` single-event rotation. `getRecommendation()` and `getSurpriseEvent()` helpers.
- **Hatch overlay fix**: `suppressAutoOpen` prop added — overlay no longer interrupts gameplay (`screen === 'game'`). Freeze-after-hatch fixed: `setPhase('tapping')` called in `handleClose()` before dispatches, ensuring `!isOpen && phase === 'tapping'` → overlay unmounts cleanly.
- **Shop Mission feedback**: wrong choice now shows `.wrong` shake animation; streak >= 3 shows `STREAK_MSGS` (🔥 messages) with louder celebration; streak counter styled amber/bold when active. All existing `playTone` calls preserved.
- **Egg pacing (graduated)**: `scaledEggProgress()` in StateContext. Required XP = `min(800, 120 + n×60)` where n = hatched egg count. Egg 1: 120 XP (fast). Egg 5: 360 XP. Cap 800 at egg 12+. `eggStatsData.stage` overridden in derived useMemo so canvas and display stay in sync. Home XP label uses dynamic `xpPerStage`, shows "เกือบฟักแล้ว!" in stage 6.
- **Creature stats rebalanced**: `calcCreatureStats()` uses weighted formula. Every stat: 40% base guarantee + 60% subject-weighted. ATK weighted to Math, DEF to Thai, SPD to English. Minimum any stat = base × 0.50 (no zeros). ±5% deterministic personality. Migration recalculates broken (0/NaN) stats on load.

---

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
