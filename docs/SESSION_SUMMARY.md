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
