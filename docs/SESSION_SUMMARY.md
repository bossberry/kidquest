# Session Summary — 2026-06-09 (Procedural Character System Design)

**Session type:** Documentation and architecture only. No code. No build.

**Files changed:**
- `docs/research/creatures/procedural-character-system.md` — NEW
- `docs/RESEARCH_INDEX.md` — Creatures section added
- `docs/GPT_NOTES.md` — Procedural Character System section added
- `docs/TASKS.md` — Design task marked done; Phase 1–4 implementation tasks added
- `docs/CHANGELOG.md` — Entry prepended
- `docs/SESSION_SUMMARY.md` — This file
- `docs/GPT_HANDOFF.md` — Latest session updated

**What was designed:**

The current creature system is 15 fixed emojis. This session replaces it with a full procedural generation architecture that produces ~42 million valid creature combinations, each visually continuous with its egg.

**Core architecture:**
- Same `hash()` + `prng()` functions from `eggAlgorithm.js` (imported, never modified) generate a creature-specific prng stream
- Same hue values (`h1`, `h2`, `ha`, `h3`) that define the egg's colors are re-used for the creature's body/pattern/glow/eyes
- Every creature is deterministic from its egg stats — no random pull at hatch time

**Gene system (40+ attributes):**
- Body: type (5), head ratio, cheeks (mandatory), belly patch
- Face: eye type (6), eye size, eye color, blush, mouth
- Features: ears (7), horns (5), wings (6), tails (6)
- Surface: pattern (6), accessories (8)
- Effects: glow + particles (rarity-driven, 5 tiers)

**Art direction constraints (7 rules):**
- Cheeks are never absent (warmth anchor)
- All colors in 45–85% saturation range
- ATK creatures are "spirited", not aggressive
- No sharp-contrast dark features on large fills
- Eye area ≥ 25% of head area (enforced in code)
- Pattern color harmony enforced (avoid ugly split-comp)
- Feature richness scales with hatch stage (stage 2 = simple, stage 8 = full)

**7 personality types** derived from learning profile at hatch time — not cosmetic. Each has distinct idle pool, voice pitch, behaviors.

**Egg-to-creature continuity:**
- Hard: same `h1/h2/ha/h3` hue values always carry over
- Soft: 60–75% probability feature echoes (egg dots → creature spots, egg glow → creature aura, etc.)
- Battle mark: creatures hatched at stage 7–8 have a small mark matching the egg's crack color

**4-phase implementation path:**
1. `creatureGenerator.js` — DNA extraction (no visual change)
2. Emoji-composite MVP (playtest vehicle, 2–4 layered emoji)
3. Canvas creature `drawCreature.js` (after GPT answers key questions)
4. Voice profile + birth moment sequence

**10 open questions** raised for GPT (see doc + GPT_NOTES.md). Phase 3 must not begin until Q1–Q3 are answered.

---

# Session Summary — 2026-06-09 (Dramatic Egg Stage Progression)

**Session type:** Code change. Build: ✅.

**Files changed:**
- `src/lib/eggAlgorithm.js` — `EGG_STAGES` 7→9, `EGG_STAGE_NAMES` updated to 9 Thai names
- `src/lib/audio.js` — 2 new SFX: `stageUp`, `heartbeat`
- `src/styles.css` — Per-stage aura keyframes + classes (`egg-s0`–`egg-s8`), `stage-up-pop` animation, `.stage-up-banner`
- `src/components/Home.jsx` — Stage-up detection, aura class on canvas, stage-up banner, heartbeat effect, 9-dot header

**Core changes:**

`EGG_STAGES` changed from 7 to 9. `drawEgg()` is untouched — changing the constant naturally spreads visual layers across 9 stages via `progress = stage / (total-1)`. Key threshold shifts:
- Dots: always visible from stage 1
- Lines: stage 2 (was stage 1)
- Shapes: stage 4 (was stage 3)
- Shadow creature: stage 5 (was stage 4)
- Glyphs: stage 6 (was stage 5)
- Stars + eye: stage 7 (was stage 5-6)
- Cracks: stage 7 (was stage 6)
- Full cracks at maximum: stage 8

**Per-stage persistent aura** (pulsing CSS `drop-shadow` on EggCanvas):
- Stage 0-1: none / whisper glow
- Stage 2: soft cool blue pulse (3.5s)
- Stage 3: soft purple shimmer (3.2s)
- Stage 4: golden pulse (2.8s)
- Stage 5: orange-gold pulse (2.4s)
- Stage 6: crystal blue pulse (2.0s)
- Stage 7: white-blue intense dual drop-shadow (1.6s)
- Stage 8: gold-white max intensity (1.1s, fastest)

Aura class merged with temporary `egg-glow-*` — glow wins during item interactions, aura resumes after.

**Stage-up banner:** `stageUp` state tracks `{stage, id}`. A `useEffect` on stage detects increases (skips first render via `prevStageRef = null` init). On stage up: plays `stageUp` fanfare, spawns 18 sparkles + 6 hearts, shows `.stage-up-banner` overlay "ขึ้นระดับแล้ว!" + stage name for 2.8s.

**Heartbeat:** `useEffect` on `readyToHatch` plays `heartbeat` (lub-dub) once + repeats every 8s.

**Architecture note:**
- `eggStatsData.stage` is overridden with `sp.stage` in StateContext (line 433), so drawEgg always receives the correct 9-stage scaled stage number
- `egg-s*` must appear before `egg-glow-*` in CSS so glow animation cascade wins during interactions (confirmed: aura defined in EGG HOME section before glow classes)

**Known risks:**
- Stage-up detection skips first render correctly — but on page reload, if the player is at stage 5, the banner won't show (correct: it only shows on actual stage increase)
- Heartbeat sound is subtle (0.32 gain) — may not be audible on phone speakers with device volume low

---

# Session Summary — 2026-06-09 (Egg Home Emotional Life)

**Session type:** Code change. Build: ✅.

**Files changed:**
- `src/components/Home.jsx` — creature state machine + ambient events + expanded idle pool
- `src/lib/audio.js` — `yawn` sound added
- `src/styles.css` — 12 new keyframes/classes

**New idle behaviors (egg):**
- `idle-blink` (0.26s): fast Y-squish + spring back — looks like a cartoon blink
- `idle-look` (1s): gentle left-right tilt — curious glance
- `idle-yawn` (1.2s): slow stretch up and settle — yawn + `yawn` sound
- Pool now has 10 options (wiggle ×3, jump ×2, blink ×2, look, yawn, etc.)
- Sound: yawn always plays; chirp 16-28% for wiggle/jump; begging 12% for look

**Creature personality behaviors (state machine, 20–45s cycle):**
- `walk`: default patrol (pauses during other states)
- `wave`: bounce loop + 👋 inline + chirp
- `sit`: tilted 14° + static (stopped at current position)
- `celebrate`: jump loop + 🎊 inline + sparkle particles + celebrate sound
- `gift`: shows 🎁 inline + jingle sound
- `look`: shows 👀 inline (quiet)
- `sleep`: 48% opacity + 💤 inline (quiet)

**Ambient events (38–88s between events):**
- 🦋 butterfly: crosses screen diagonally at 38% height (4.4s animation)
- 🍂 leaf: falls from top center with rotation (4s animation)
- ✨ shooting star: fast diagonal slash from top-right (0.85s animation)
- All: `position:fixed`, `pointer-events:none`, visual only

**Other enhancements:**
- Reunion: hearts+sparkle combined + double chirp (was sparkle only + single chirp)
- Ribbon: `happy-spin` proud spin (was `pet` bounce)
- Star: hearts+sparkle combined burst (was sparkle only)

**Architecture note:**
- `creatureModeRef` ref tracks creature state for patrol interval (avoids stale closure)
- Directional flip (`scaleX`) on outer div, animation class on inner div — prevents transform conflicts
- Ambient events use `prev?.id === id` check on clear timeout to prevent stale clears

---

# Session Summary — 2026-06-09 (Home Bottom Layout Overlap Fix)

**Session type:** Bug fix. Build: ✅.

**Files changed:**
- `src/styles.css` — `#root` height fix + `#egg-home` padding increase
- `src/components/Home.jsx` — `height:'100dvh'` + split overflow props

**Root cause:**
Three compounding issues:
1. `#root` had no explicit height → `height:100%` on `#egg-home` resolved to nothing → `flex:1` on egg zone didn't expand → CSS padding-bottom had no visible effect
2. `padding-bottom: calc(60px + safe)` = 94px vs actual nav height = 95px (1px short: 61px button area + 34px safe area)
3. `height:100%` (not `100dvh`) doesn't adjust for iOS Safari's retractable browser toolbar

**Safe-area strategy:**
- Nav button height: `padding:10px 4px 8px` + icon 22px + margin 2px + text 12px + dot 7px = 61px
- Plus `env(safe-area-inset-bottom)` = 34px on iPhone 14/15 → total nav = 95px
- New padding: `calc(76px + env(safe-area-inset-bottom))` = 110px on iPhone 14/15 → 15px safety margin above nav

**Layout hierarchy (fixed):**
```
html (height:100%) → body (height:100%, flex column) → #root (height:100%, flex column)
→ #egg-home (height:100dvh, flex column, padding-bottom:calc(76px+safe))
  → header (flex-shrink:0)
  → egg zone (flex:1, min-height:0)
  → item tray (flex-shrink:0)
  → action row (flex-shrink:0)
  → [padding space: 76px+safe area ≈ 110px]
← BottomNav (position:fixed, bottom:0, height ≈ 95px) sits inside padding space
```

---

# Session Summary — 2026-06-09 (Egg Home Emotional Polish)

**Session type:** Code change. Build: ✅.

**Files changed:**
- `src/components/Home.jsx` — Full rewrite (emotional polish)
- `src/lib/audio.js` — 6 new SFX: chew, slurp, giggle, sigh, celebrate, begging
- `src/styles.css` — eat/relax/idle/food-fly/glow/star-orbit keyframes + classes + safe-area layout fix

**What was built:**
Full emotional polish on Egg Home. Food: emoji flies from tray to egg (fixed-position overlay, `food-fly-up` CSS animation), egg eats with `egg-anim-eat` + chew sound + warm glow (`egg-glow-warm` drop-shadow), then sigh sound. Ribbon: 🎀 overlay persists on egg (top-right), pink glow, jingle. Potion: slurp + blue glow + relax animation. Star: celebrate fanfare + gold glow + happy-spin. Pet streak 3 now uses giggle sound. Random idle behavior: `useEffect` fires every 5–12s, triggers `idle-wiggle` or `idle-jump` (25% chirp, 8% begging); only when egg is in base float state. `stageRef` + `eggAnimRef` fix stale closure in `triggerAnim` and idle scheduler. iPhone safe-area layout fixed (inline paddingBottom removed; CSS handles it).

**Architecture:**
- `flyingItem` state: `{emoji, id}` | null — triggers fixed-position overlay + CSS animation
- `eggGlow` state: CSS class suffix (warm/blue/gold/pink) applied to EggCanvas className
- `hasRibbon` state: boolean — shows 🎀 absolutely positioned on egg
- `idleAnim` state: string | null — overrides base float class when no active animation
- `stageRef` / `eggAnimRef`: useEffect-synced refs so setTimeout callbacks always have current values
- Glow uses CSS `filter: drop-shadow()` on canvas — works with transparent canvas background, follows egg shape

**Known risks:**
- `hasRibbon` resets when component unmounts (app reload). Not persisted to state. Could add `state.eggHasRibbon` in a future pass if child cares about persistence.
- Flying food animation height (`-265px`) assumes egg is roughly centered at ~340px from bottom on 390px viewport. May be slightly off on very tall or very short phones — minor visual only.

---

# Session Summary — 2026-06-09 (Egg Home MVP)

**Session type:** Code change. Build: ✅.

**Files changed:**
- `src/components/Home.jsx` — REPLACED with Egg Home
- `src/lib/state.js` — `lastHomeVisit: null` added
- `src/context/StateContext.jsx` — `UPDATE_LAST_HOME_VISIT` action added
- `src/lib/audio.js` — 4 new SFX: chirp, sparkle, jingle, feed
- `src/styles.css` — 7 new keyframes + 6 utility classes

**What was built:**
Egg Home replaces the old Adventure Director Home. Goal: "I want to visit my egg." The child sees their procedural egg large at center with a gentle float animation. They can pet the egg (chirp + sparkle + hearts; escalates to happy-spin at streak 3, sleepy at streak 6). On first visit or after >4 hours, a reunion burst triggers. Item tray shows food/ribbon/potion/star with count badges — tap once to select, tap egg (or tap again) to use. Creature companion walks left-right in the lower zone after first hatch. Three action buttons: ลูบไข่ (pet), คอลเลกชัน (collection), ออกสำรวจ (Go Explore → adventure-thai). All subject selectors, XP bars, stats, Egg Run, and Adventure Director removed.

**Architecture:**
- Home.jsx is now fully self-contained. No longer uses supabase, MG_UNLOCK/MG_COLORS, showToast, getRecommendation, getSurpriseEvent.
- `lastHomeVisit` stored in state for reunion detection across sessions.
- Creature patrol uses a ref-backed interval (25fps, avoids stale closure) to animate creature left-right.
- Particle system: random direction + distance, stored in array, cleared after 1200ms.
- triggerAnim: clears timer, sets 'float' for 1 frame, then sets target name via rAF to force CSS animation restart.
- Go Explore hardcoded to adventure-thai — subject rotation by day will be a future refinement.

**Known risks:**
- GPT's 10 open questions for Egg Home (from egg-home.md) are still unanswered. The implementation proceeds with reasonable MVP defaults — most questions are deferred to the next design iteration.
- Go Explore always routes to adventure-thai. This is a placeholder. Future: rotate by most-needed subject or add a subject picker.
- Creature companion only shows the most recently hatched creature (index 0). Future: cycling selector.
- No ambient sound / home music. Future: low-priority after core feel is validated.

---

# Previous Session Summary — 2026-06-09 (Egg Home Design)

**Session type:** Documentation and architecture only. No code. No build.

**Files changed:**
- `docs/research/world/egg-home.md` — NEW
- `docs/GPT_NOTES.md` — Egg Home section added
- `docs/TASKS.md` — Egg Home task done; GPT questions task added
- `docs/CHANGELOG.md` — Entry prepended
- `docs/SESSION_SUMMARY.md` — This file
- `docs/GPT_HANDOFF.md` — Latest session updated

**What was designed:**
Egg Home as the emotional center of KidQuest. Goal: "I want to visit my egg." Fully learning-free zone. Interactions: pet (tap), feed (food → warm glow), ribbon (decoration), potion (XP arc moves), star (golden orbit). Mood system — 5 states expressed through animation, not stat bars. Reunion burst on return after >4 hours. Creature companion walking in lower screen. Stage 5–7 near-hatch excitement as the strongest natural return motivator. 10 open questions for GPT before code begins.

**Known risks / blockers:**
- Nothing should be coded until GPT answers the 10 open questions (see GPT_NOTES.md → Egg Home Design)
- Egg algorithm remains LOCKED — any visual changes must work as canvas overlays or CSS

---

# Previous Session Summary — 2026-06-09 (KidQuest World Design)

**Session type:** Documentation and architecture only. No code. No build.

**Files changed:**
- `docs/research/world/kidquest-world.md` — NEW (world design source-of-truth)
- `docs/GPT_NOTES.md` — KidQuest World section added
- `docs/TASKS.md` — Design phase tasks added at top of Now
- `docs/CHANGELOG.md` — Entry prepended
- `docs/SESSION_SUMMARY.md` — This file
- `docs/GPT_HANDOFF.md` — Latest session summary updated

**What was designed:**

Philosophy shift triggered by real playtesting. Chopin (~5 years old) said the game is "boring" and "not like a game." He enjoys egg collecting, caring, feeding, hatching, and taking eggs into battle — but does not engage with the subject selector, Adventure Director, or level system.

New model: **game first, learning hidden inside.** The egg is the emotional center, not subjects or levels.

World loop: Egg Home → enter world → explore region → random encounter → battle (learning happens here) → reward → return home → care for egg → egg grows → hatch → new egg → repeat.

Map structure: Screen-based, Pokémon FireRed model. NOT open-world scrolling. A region = small grid of screens (3×3 or 5×5). Year 1 scope = Green Meadow only.

10 open questions raised for GPT — must all be answered before any code begins.

**Architecture:**
- Home.jsx and Adventure Director: superseded conceptually, NOT yet changed in code
- Battle system, egg algorithm, subject content, sessionLog: all unchanged, carry forward

**Known risks:**
- Nothing should be coded until GPT answers the 10 open questions (see GPT_NOTES.md → KidQuest World)
- BattleMode.jsx is dead code (no imports), safe to delete in a future cleanup pass

---

# Previous Session Summary — 2026-06-04 (Pokémon-Style Learning Battle — all 3 subjects)

**Session type:** Code change. Build: ✅.

**Files changed:**
- `src/games/MoveSelectBattleMode.jsx` — NEW
- `src/games/GameSubjectAdventure.jsx` — modified
- `src/lib/audio.js` — 3 new tones
- `src/styles.css` — 5 new keyframes
- `docs/CHANGELOG.md`, `docs/TASKS.md`, `docs/CURRENT_STATE.md`, `docs/PROJECT_MAP.md`, `docs/SESSION_SUMMARY.md`, `docs/GPT_HANDOFF.md`

**What was built:**
- `MoveSelectBattleMode.jsx`: Pokémon-style battle shell for Math/Thai/English. Move panel 2×2. No player HP. Wrong = miss fizzle. Combo system (glow at 2, flash at 3, CRITICAL ×1.5 at 4+). Ultimate after 3 consecutive (×2 damage). Boss 12% rate. Teach intro first play. Full anticipation sequence. Egg companion full integration.
- Thai/English now use emoji choices (not letter choices) in battle — TTS speaks word, child taps matching picture.
- ResultScreen hides score fraction from child (only XP + egg growth shown). sessionLog still records for parent Report.

**Architecture:**
- Continue Adventure → `adventure-{subject}` → `GameSubjectAdventure` → `MoveSelectBattleMode` (battle mode)
- Classic GameThai/GameMath/GamePhonics unchanged, reachable via "อยากเลือกเอง?"
- ChaseMode and DefenseMode unchanged
- BattleMode.jsx still exists but is no longer imported by GameSubjectAdventure

**Known risks:**
- `BattleMode.jsx` is now dead code (no imports). Safe to delete in a future cleanup pass.
- `ResultScreen` no longer shows score fraction — confirmed correct per Battle Feel Philosophy.
- `isFirstLevel` check uses `levelMastery` — if a child has played chase/defense but never battle, they'll still see the teach intro on first battle session. This is desirable.
