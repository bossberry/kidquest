# Session Summary — 2026-06-04 (Subject Adventure Engine MVP)

**Session type:** Code change. Build ✅ zero errors.

**Files changed:**
- `src/games/GameSubjectAdventure.jsx` — NEW. Orchestrator. Generates questions per subject+level, picks mode deterministically (battle/chase/defense rotates by day+playCount). Dispatches ADD_XP, ROUND_COMPLETE, UPDATE_LEVEL_MASTERY, UNLOCK_LEVEL, LOG_SESSION. TTS via useEffect on question change. Key-based session reset for replay.
- `src/games/BattleMode.jsx` — NEW. Enemy HP + player HP bars. Enemy per subject. Correct: adv-jump + enemy flash + floating damage. Crit (streak≥2): confetti + streak-bounce badge. Wrong ×3: enemy counter-attack + player shake.
- `src/games/ChaseMode.jsx` — NEW. Horizontal distance track. Correct: +14% progress + adv-dash + "dash" SFX. Wrong ×3: -10% + target flee. Caught at 100%.
- `src/games/DefenseMode.jsx` — NEW. Baby creature + shield pip HP + attacker. Correct: adv-shield pulse + "block" SFX. Wrong ×3: shield HP -1 + hit flash.
- `src/games/GameScreen.jsx` — Added lazy import + 3 routes: adventure-thai/math/eng → GameSubjectAdventure with subject prop.
- `src/components/Home.jsx` — All "learn" recommendations now route to `adventure-{world}` instead of mathbattle/plain subject. Label shows "{subject} ผจญภัย" with mode-appropriate icon/sub.
- `src/lib/audio.js` — Added `dash` (chase correct: ascending sweep) and `block` (defense correct: low thump) playTone types.
- `src/styles.css` — Added `adv-jump`, `adv-dash`, `adv-shield` keyframes.

**Architecture:** Session orchestrator (GameSubjectAdventure) owns all dispatch logic. 3 mode adapters (BattleMode/ChaseMode/DefenseMode) are purely visual — receive question + callbacks. Mode is chosen deterministically per day+playCount.

**Subjects:** All 3 (thai/math/eng). TTS on Thai/English every question (400ms delay). 🔊 replay button in Thai/English modes.

**XP/sessionLog:** Unchanged dispatch pattern identical to GameMath/GameThai/GamePhonics.

**Classic games:** Untouched. "อยากเลือกเอง?" grid still routes to Thai/Math/Phonics.
