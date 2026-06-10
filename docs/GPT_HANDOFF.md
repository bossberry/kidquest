# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-10 (Fix: Robust Egg Interaction State Machine)_

**AI System:** GPT (research/curriculum/product) → `GPT_NOTES.md` → Claude Code (implementation) → `GPT_HANDOFF.md` → GPT. Claude Chatbot reads both sides for review. Chat history is NOT source of truth. See `docs/AI_SYSTEMS.md`.

---

## Project Vision (read this first)

**KidQuest grows with Chopin over many years.** It does not attempt to build a complete K-6 platform from day one.

**Golden Rule:** Build one mastery level ahead. Never six years ahead.

**Year 1 scope:** Kindergarten core + Early Grade 1 stretch only.

**Success metric:** Chopin voluntarily plays KidQuest and learns through it. Not feature count. Not grades covered. Joyful learning.

**All AI systems are scope guardians.** Warn before implementing anything that violates the Golden Rule, Year 1 scope, or stable engine philosophy. See `VISION.md` for full mandate.

---

## Latest Session Summary

**What changed this session (Fix: Robust Egg Interaction State Machine — code change):**

`src/components/Home.jsx` — Complete interaction system redesign. Previous partial fix (3 targeted patches) replaced by formal FSM.

**Architecture:** `smRef = useRef({ state, comboCount, enteredAt })` is the single authoritative source of truth. States: `idle / pet / happy / excited / eating / sleep / relax / reunion`. No interaction state can be active simultaneously; every transition goes through `enterState` or `extendState`.

**`enterState(newState, dur?)`** — canonical transition function:
1. Cancels in-flight RAF via `enterRafRef` + `clearTimeout(animTimerRef)`.
2. Updates `smRef.state`, `smRef.enteredAt`.
3. Generation counter (`enterGenRef`) ensures the RAF callback is a no-op if superseded (protects against rapid tier upgrades within the same frame).
4. Sets `eggAnim('float')` briefly, then RAF fires `setEggAnim(cssName)` to restart CSS animation cleanly.
5. Exit timer returns to `idle` after `STATE_DUR[newState]` ms.

**`extendState(targetState)`** — same visual tier repeated:
- Only resets exit timer (no RAF, no CSS class change). Result: rapid same-tier tapping stays smooth — no flicker between pet/pet/pet bounces.

**Tap combo system:** `smRef.comboCount` increments on every pet tap. `comboToState(n)` maps to tier: 1–3=`pet`, 4–7=`happy`, 8+=`excited`. When tier changes → `enterState` (full transition with sound + particles). Same tier → `extendState` (extend timer, lighter particles). Combo resets after 3s inactivity via `comboResetRef`.

**Item interactions:** All four items (food/ribbon/potion/star) reset `comboCount` and call `enterState` directly. Food → `eating`. Ribbon/star → `happy`. Potion → `relax`.

**Watchdog:** `setInterval(5000)` checks if non-idle state has been held >6s → force `idle` + clear timers. Covers any edge case where exit timer fails.

**Unmount cleanup:** cancels `enterRafRef` RAF + both timers.

**Removed:** `triggerAnim`, `petStreak` useState, `rafRef`, `animGenRef`, `petStreakRef`, `lastPetRef`, petStreak reset useEffect.

Build: ✅. Commit: pending push.

**What changed last session (Fix: Egg Home Rapid Tap Freeze — code change — superseded by above):**

Partial fix via `rafRef`/`animGenRef`/`petStreakRef`/150ms cooldown. Replaced entirely by state machine this session.

**What changed last session (Fix: Procedural Creature Detail Popup — code change):**

Popup now shows the same procedural canvas character as the grid card.

**Root cause:** `CreatureDetailPopup` was still importing `drawCreature` from `creatureAlgorithm.js` (legacy renderer) and re-drawing with a manual canvas + useEffect, completely independent of the grid card's DNA computation.

**Fix — `Collection.jsx`:** `selectedEgg` state changed from `egg` → `{ egg, dna }`. `CreatureCard.onSelect(egg)` → `onSelect(egg, dna)` (passes the `useMemo`-computed DNA up). `handleSelect(egg, dna)` setter in Collection root. Popup receives `egg={selectedEgg.egg}` and `dna={selectedEgg.dna}` as separate props.

**Fix — `CreatureDetailPopup.jsx`:** Accepts `dna` prop. Replaced legacy canvas + `drawCreature(creatureAlgorithm)` with `<CreatureCanvas dna={dna} size={196} animationEnabled>`. Layout redesigned: creature 196px centered at top → name/category/date below → egg mini canvas + XP bars → stats row → abilities. Legacy emoji badge (`egg.creature.e`) shown in corner only for old creatures. `creatureAlgorithm.js` import removed entirely.

Build: ✅. Commit: `5de06e9`. Pushed.

**What changed last session (Collection: Procedural Creature Preview — code change):**

All hatched eggs in Collection now show procedural canvas creatures at 120px with idle animations, regardless of whether they were hatched before Phase 2.

**`src/lib/creatureGenerator.js`** — NEW: `buildLegacyPreviewDNA(egg, index)`. Two paths:
- Primary: `egg.eggStats` present → calls `buildCreatureDNA(egg.eggStats)`. Gives the exact creature that would have been generated at hatch time. Covers 95%+ of legacy eggs.
- Fallback: hash(`creature.n + emoji + rarity + index`) → deterministic seed → synthesised stats → `buildCreatureDNA`. Emoji nudges guide family: `🐉` streak:82 → dragon; `🦊` eng+speed → fox; `🦄`/`🤖`/`💎` math:72+ → crystal; `⚡` streak:82 → star; `🦅` eng+speed → bird. Stage 4–7 (mature-looking). Never persisted. No state writes.

**`src/components/Collection.jsx`** — Replaced manual canvas+useEffect with `<CreatureCanvas size={120} animationEnabled>`. `useMemo([egg, index])` ensures stable DNA reference (prevents animation loop reset). Legacy emoji badge (`egg.creature.e`) shown bottom-right corner for old creatures. `creatureAlgorithm.js` import removed entirely. Gallery grid: 2-column instead of 3-column.

**`src/styles.css`** — `.catalog-grid-lg` (2-column 14px gap) + `.catalog-item-lg` (larger padding/font for gallery feel).

Build: ✅. Commit: `8c393f7`. Pushed.

**What changed last session (Procedural Character System Phase 3 — code change):**

Implemented creature personality & animation. Creatures in `CreatureCanvas` are now alive — they breathe, bob, and blink. Sleep mode shows floating z particles.

**`src/lib/drawCreature.js`** (3 changes, commit `658d25c`):
- `drawCreature(canvas, dna, anim={})` — optional `anim` parameter with `{ blinkAmt, sleepParticles }`.
- `drawEyes` signature now accepts `blinkAmt`. Applies blink: `bScale = max(0, 1 - blinkAmt * 1.25)`. When `bScale < 0.12` → draws closed-eye curve. Crescent/button types squash via `ctx.save/translate/scale(1, bScale)/restore`. Standard eye types use `ery = openEry * bScale`; gloss highlights hidden when `bScale < 0.45`.
- `drawSleepZ(ctx, G, C, particles, sc)` — draws floating 'z' glyphs in accent hue; called when `anim.sleepParticles` exists.

**`src/components/CreatureCanvas.jsx`** (full rewrite, commit `658d25c`):
- Props: `dna`, `size`, `personality`, `animationEnabled` (default `true`), `idleMode` (`'idle'|'sleep'|'celebrate'`), `style`, `className`.
- RAF loop: blink state machine (`open → closing → closed → opening`). Close: 90ms. Hold: 70ms (450ms when sleepy). Open: 120ms. Blink interval = personality rate ± 1s jitter. Rates: happy=4s, curious=5s, brave=8s, playful=3s, gentle=5s, sleepy=2s, shy=4s.
- Sleep Z-particle system: when `idleMode='sleep'`, spawns particles (x=random right-of-head, y above head, alpha 0.7–0.9, random size). Each frame: float up, drift right, fade. Passed to `drawCreature` as `sleepParticles`. Max 3 concurrent particles.
- CSS idle class applied to canvas element: `ci-{personality}` for idle, `ci-celebrate` for celebrate, `ci-sleepy` for sleep.

**`src/styles.css`** (new block, commit `658d25c`):
- 8 keyframes: `ci-happy` (1.8s, −4px bob + 1.020 scale), `ci-curious` (4.5s, −8° tilt + scale), `ci-brave` (2.2s, −3px + 1.018 scale), `ci-playful` (1.5s, −5px fast), `ci-gentle` (3.2s, −2px + 1.015 scale), `ci-sleepy` (5.0s, scale-only slow breathe), `ci-shy` (3.5s, −1px minimal), `ci-celebrate` (1.2s, −10px + 1.055 scale).
- All suppressed by `@media(prefers-reduced-motion:reduce)`.

**Build:** ✅ zero errors. Pushed.

**What remained the same:** Phase 4 (voice) and Phase 5 (birth sequence) are NOT implemented.

**What changed last session (Procedural Character System Design v3 — docs only):**

Added **Egg-to-Creature Identity** section to `docs/research/creatures/procedural-character-system.md`. No code. No build.

Egg Motif Detection (first-match priority): isNight → Moon; ha 30–60° + streak ≥ 14 + stage ≥ 5 → Star; h1 80–160° → Leaf; h1 160–220° → Ocean; h1 220–270° → Cloud; h1 270–320° → Crystal; h1 ≥ 340° or < 30° → Ember. No match → stat-based fallback.

Open questions expanded to 10: Q9 = egg legibility; Q10 = Ember as formal 17th family.

**What changed earlier (Procedural Character System Design v2 — docs only):**

Architecture: Beauty Layer added (between Art Direction and Animation). 16 Family Archetypes. Signature Feature System (17 traits, one per creature). Existing Collection Migration (legacy emoji path for old creatures; DNA + canvas for new). Emoji composite removed; 5-phase path. ~340M combinations.

**What changed last session (Dramatic Egg Stage Progression — code change):**

- **`EGG_STAGES` changed 7→9** in `eggAlgorithm.js`. `drawEgg()` untouched — uses `progress = stage/(total-1)`, so adding 2 stages naturally spreads all visual layers across more milestones.
- **9 stage names**: ไข่น้อย / ไข่อบอุ่น / ไข่มีความสุข / ไข่แวววาว / ไข่วิเศษ / ไข่เปล่งแสง / ไข่โบราณ / ไข่แตกร้าว / ใกล้ฟักแล้ว!!!
- **Per-stage persistent aura**: `.egg-s0`–`.egg-s8` CSS classes on EggCanvas. Pulsing `filter:drop-shadow` growing in color intensity + pulse speed per stage. Soft cool blue at stage 2 → blazing gold-white at stage 8.
- **Stage header colors**: dots + stage name tinted per stage (purple → tan → green → purple → gold → orange → blue → crystal → gold). 7px dots (was 9px), `transition:'color 0.8s'` on stage name.
- **Stage-up celebration**: `stageUp` state + `prevStageRef`. On stage increase → `stageUp` 5-note ascending fanfare + 18 sparkle particles + 6 hearts + `.stage-up-banner` overlay "ขึ้นระดับแล้ว!" + stage name, pops/floats/fades in 2.8s.
- **Heartbeat sound**: `heartbeat` (lub-dub, 90→38Hz) plays once + every 8s when `readyToHatch=true`.
- **`readyToHatch` check**: updated `stage >= 6` → `stage >= EGG_STAGES - 1` (stage 8).
- **Excited mode threshold**: 5→7 (egg bounces faster in last 2 stages).
- Build ✅. Commit: `feat: dramatic egg stage progression`. Pushed.

**What changed last session (Egg Home Emotional Life — code change):**

- **Idle behaviors (egg):** `idle-blink`, `idle-look`, `idle-yawn` added to random pool (now 10 options, 5–12s).
- **Creature state machine:** 7 states (walk/wave/sit/celebrate/gift/look/sleep), 20–45s cycle.
- **Ambient events:** 🦋 butterfly, 🍂 leaf, ✨ shooting star — every 38–88s, `position:fixed`.
- Build ✅. Commit: `feat: egg home emotional life`. Pushed.
3. `height:100%` doesn't adjust for iOS Safari toolbar (`100dvh` does)

Fix: `#root { height:100%; display:flex; flex-direction:column }` + `height:'100dvh'` on `#egg-home` + padding increased to `calc(76px + env(safe-area-inset-bottom))`. Build ✅. Committed. Pushed.

---

**What changed last session (Egg Home Emotional Polish — code change):**

- `src/components/Home.jsx` — Full rewrite for emotional polish. Flying food animation: fixed-position emoji flies from tray to egg (360ms delay → eat anim + chew sound + warm glow → sigh after eating). Per-item glow CSS class on EggCanvas (`egg-glow-warm/blue/gold/pink`). Ribbon 🎀 overlay persists on egg top-right. Star orbit: two divs rotating when XP boost active. Random idle micro-animations every 5–12s (`idle-wiggle`/`idle-jump`, occasional chirp/begging). `stageRef` + `eggAnimRef` fix stale closure in triggerAnim. Removed inline `paddingBottom:66` — safe-area handled by CSS. Pet streak 3 → giggle + happy-spin. Food chain complete (fly → eat → glow → sigh). Ribbon: jingle + pink glow. Potion: slurp + blue glow + relax. Star: celebrate + gold glow + happy-spin.
- `src/lib/audio.js` — 6 new SFX: `chew` (3-hit crunch), `slurp` (rising sine + triangle accent), `giggle` (4-step ascending triangle pairs), `sigh` (descending sine fade), `celebrate` (6-note ascending fanfare), `begging` (rising-falling sine breath).
- `src/styles.css` — EGG HOME section expanded: `egg-anim-eat`, `egg-anim-relax`, `idle-wiggle`, `idle-jump`, `food-fly-up`, 4 glow variants, `star-orbit`. `#egg-home` padding-bottom uses `calc(60px + env(safe-area-inset-bottom))` for iPhone notch safety.
- Build ✅. Commit: `feat: egg home emotional polish`. Pushed.

**Previous session: Egg Home MVP:**
- `src/components/Home.jsx` — replaced with Egg Home. Pet (chirp+sparkle), item tray, creature companion, action row.
- `src/lib/state.js` — `lastHomeVisit: null` added. `src/context/StateContext.jsx` — `UPDATE_LAST_HOME_VISIT` action.
- Build ✅. Commit: `feat: egg home mvp`. Pushed.

**Current Home behavior:**
1. Child opens app → egg floats gently at center. Random micro-wiggles/jumps every 5–12s make it feel alive.
2. Reunion burst on first visit or after >4h (sparkle + chirp).
3. Tap egg / ลูบไข่ → chirp + sparkle; streak 3 → giggle + happy-spin; streak 6 → sleepy (no punishment).
4. Item tray: tap food (select) → tap egg (use) → food emoji flies to egg, egg eats with chewing sound + warm glow → content sigh.
5. Ribbon: wraps egg with 🎀 overlay (persists) + pink glow + jingle. Potion: slurp + blue glow + relax. Star: golden orbit + celebrate fanfare.
6. ออกสำรวจ → routes to adventure-thai battle mode. Stage 5+ → excited pulse auto.
7. Creature companion (most recently hatched) walks left-right in lower zone

**Known limitations / MVP defaults:**
- Go Explore hardcoded to `adventure-thai`. Future: rotate by most-needed subject.
- Creature only shows most recent (index 0). Future: cycling selector.
- No ambient sound / home music. Future: low-priority.
- GPT's 10 open questions for Egg Home (egg-home.md) are still unanswered — implemented with reasonable MVP defaults.

**What changed last session (Egg Home Design — docs only):**

- `docs/research/world/egg-home.md` — NEW. Full Egg Home design document. Emotional goal: "I want to visit my egg." Screen layout (390px portrait): egg large at center, item tray below, action row (pet/collection/explore). Five interaction rituals: pet (sparkle+chirp+bounce), feed (float+absorb+warm glow), ribbon (wrap+decoration persists), potion (XP arc moves, no number), star (golden orbit for boost duration). Five mood states (happy/content/quiet/excited/reunion) expressed through egg animation only — no stat bars. Stage progression: stage 1 = small/dim, stage 6 = glowing/cracking/excited, stage 7 = egg tries to hatch. Creature companion: walks left-right, tap for happy reaction. Return loop motivators: reunion burst after >4 hours, near-hatch excitement (stages 5–7), items waiting in tray — all intrinsic, no streak pressure. Year 1 MVP defined. 10 open questions raised.
- No code changes. No build.

**What changed (KidQuest World Design — docs only):**

Philosophy shift triggered by real playtesting with Chopin. Chopin said "The game is boring" and "Not like a game." He engages with egg collecting, caring, feeding, hatching, taking eggs into battle — but not with subjects, levels, or the Adventure Director.

**New model: game first, learning hidden inside.** The egg is the emotional center.

**Documents created/updated:**
- `docs/research/world/kidquest-world.md` — NEW. Full design document. Philosophy shift, emotional center, world loop, Egg Home spec, screen-based world map (Pokémon FireRed model), exploration events, battle role, learning hidden curriculum principle, Year 1 MVP scope (Green Meadow only), 10 open questions for GPT.
- `docs/GPT_NOTES.md` — KidQuest World section added. Records all decisions. Lists what Claude Code must NOT touch until GPT answers open questions.
- `docs/TASKS.md` — Design phase and implementation queue added at top of Now section.
- `docs/CHANGELOG.md`, `docs/SESSION_SUMMARY.md` — Updated.
- No code changes. No build.

**Key decisions recorded:**
- Egg Home replaces Adventure Director as the main screen. Egg is the hero.
- World = screen-based grid (Pokémon FireRed model). Year 1 = Green Meadow only.
- Battle = where learning questions appear. Battle feel philosophy unchanged.
- sessionLog + parent Report unchanged. Subjects become invisible support systems.

**What changed (Educational Math Visuals — code change):**

- `src/config/gameConfig.js` — Added `COUNTABLE_GROUPS` (3 semantic categories: fruits 🍎🍌🍓🍊🍒 / animals 🐟🐱🐶🐰🐸 / everyday 🧸⭐🎈🌸🚗) and flat `COUNTABLES`. Single source of truth for all 3 math files — previously each had its own local array with `🥚` (game mascot), `💎` (abstract), `🏀` (random). Updated `PATTERN_SETS.AB`: removed `['🥚','🔵']` (egg = game mascot, confusing), replaced all pairs with educationally coherent pairs: shapes `['🔺','🔵']`, fruits `['🍎','🍌']`, animals `['🐱','🐶']`, hearts `['❤️','💙']`, `['⭐','🌸']`. Updated `TEACH_CONTENT.math[0]` examples: `🥚×3 → 🍎×3`, `⭐×5 → 🐟×5`. Updated `TEACH_CONTENT.math[8]` pattern examples to match new pattern sets.
- `src/games/GameMath.jsx` — Removed local `COUNTABLES`. Imports `COUNTABLES, COUNTABLE_GROUPS`. For `objects` visual model, emojiA+emojiB now come from the same semantic group (shuffle one category, take first two). Example: apple+banana instead of egg+diamond. Same-group pairing makes addition visuals semantically coherent.
- `src/games/GameMathBattle.jsx` — Removed local `COUNTABLES`. Imports from gameConfig.
- `src/games/GameSubjectAdventure.jsx` — Removed local `COUNTABLES`. Imports from gameConfig.
- Build: ✅ zero errors. Commit: b050fd1.

**What changed last session (True Full-Screen Mobile Battle Layout — bug fix):**

Root cause of the white-margin problem: `height:100%`/`minHeight:100%` on flex children does not fill a flex parent — `flex:1` is needed. Every component in the adventure mode chain had this wrong. Multiple sessions only patched intermediate layers; this session fixed the full chain.

- `src/games/GameScreen.jsx` — Adventure worlds now use `position:fixed;inset:0;zIndex:50` overlay — completely escapes all parent flex constraints (`body`, `#root`, etc.). Absolute-positioned `←` back button at top-left (z-index 200). Inner `flex:1/minHeight:0` div holds game tree.
- `src/styles.css` — Removed `align-items:center` from `#root` rule. Home still centers itself internally (its own `alignItems:'center'`). Safe change.
- `src/games/GameSubjectAdventure.jsx` — Default export wrapped in `flex:1/minHeight:0` div. `ResultScreen` root div changed from `minHeight:'100%'` → `flex:1`.
- `src/games/MoveSelectBattleMode.jsx` — Root div `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- `src/games/ChaseMode.jsx` — Root div same fix.
- `src/games/DefenseMode.jsx` — Root div same fix.
- Build: ✅ zero errors. Commit: 2ba7922.

**What changed last session (Mobile Playtest Polish — code change):**

- `src/games/GameScreen.jsx` — Adventure worlds bypass the `maxWidth:480 / alignItems:center` container.
- `src/games/MoveSelectBattleMode.jsx` — Removed entire attack identity layer. Deleted `ICONS`, `MOVE_NAME`, `moveIcons`, `shuffle`, `useMemo`. `MoveCard` now shows only the learning answer. Font adapts to content length: ≤2 chars=64px, ≤4=54px, else=44px. Battle log simple-hit changed from `"⚡ Thunder! +N XP"` to `"⚔️ โจมตี! +N XP"`. Build: ✅. Commit: a8759ea.

**What changed before that (Adventure Mode UI 2.0 — code change):**

- `src/games/DefenseMode.jsx` — Full layout redesign. Enemy enlarged 90→120px. Removed large `QuestionDisplay` component (was dominating screen with 44px emoji + word + subtext). Replaced with compact `QuestionHint` (28px emoji + 🔊 only, or minimal math display). Hit flash overlay on correct. Miss animation (`miss-fizzle`) + red border highlight on wrong button. Mode text labels removed entirely. Egg gets `egg-idle 3s` continuous idle animation. Combo shown as compact top-left indicator (was large badge). Visual hierarchy: enemy top → shield → egg → log → hint → 2×2 move panel.
- `src/games/ChaseMode.jsx` — Full layout redesign. Target enemy 64→120px, moved to top center (was top-right corner, small). Removed `QuestionDisplay`, replaced with same `QuestionHint`. Chase track slimmed 70→32px. Egg slides on slimmer track. Target shows 🎉 + `victory-bounce` at dist≥100. Track fill goes gold at dist≥80 with "⚡ ใกล้แล้ว!" label inside track. Hit flash on correct. Miss animation on wrong. Combo compact top-left.
- `src/games/MoveSelectBattleMode.jsx` — Minor: egg idle animation changed from `none` to `egg-idle 3s ease-in-out infinite` at rest. Question hint min-height 46→36px.
- `src/styles.css` — New `@keyframes egg-idle` (5px float + 2-degree rotate, 3s loop). Added to `prefers-reduced-motion` suppression.
- Build: ✅ zero errors. Commit: 4247ac5.

**What changed last session (Pokémon-Style Learning Battle — code change):**

- `src/games/MoveSelectBattleMode.jsx` — NEW. Pokémon-style battle shell for all 3 subjects (Math/Thai/English). Move panel: 2×2 grid, each card = `[element icon] [answer content]`. No player HP — egg never in danger. Wrong = miss fizzle + "โจมตีพลาด!" + continue. Combo system: streak 2=glow, 3=combo flash, 4+=CRITICAL ×1.5 damage. Ultimate: after 3 consecutive correct, charges (×2 damage on next correct, huge effect). Boss at 12% rate (more HP, "BOSS" badge). Teach intro overlay on first-ever level play. Anticipation sequence: tap → card pulse (CSS) → egg charge → egg lunge → hit/miss effects (total ≤ 1000ms). Egg companion: charge/lunge animations, combo glow ring (builds with streak), near-hatch glow, victory bounce. Victory always at end of question 8: enemy defeat animation → confetti → fanfare → result screen.
- `src/games/GameSubjectAdventure.jsx` — Modified. Added `genThaiMoveQ()` (emoji choices instead of letter choices — hear word → tap picture) and `genEngMoveQ()` (same). `genMoveQuestion()` dispatches by subject. Session now generates battle-format questions when `mode === 'battle'`, classic questions for chase/defense. Replaced `BattleMode` import with `MoveSelectBattleMode`. Passes `isFirstLevel` prop. `ResultScreen` updated: hides score/accuracy from child — only shows `+XP` and `🥚 ไข่โตขึ้น!`. Score still recorded in sessionLog for parent Report.
- `src/lib/audio.js` — 3 new tones: `miss` (soft descending fizzle, no harsh sound), `combo` (rising 3-note chime), `ultimate` (7-note ascending power fanfare).
- `src/styles.css` — 5 new keyframes: `move-pulse`, `egg-charge`, `miss-fizzle`, `enemy-defeat`, `crit-flash`. All under `prefers-reduced-motion` suppression.
- Build: ✅ zero errors. GameSubjectAdventure chunk: 36.39KB (was 32.40KB).

---

**What changed last session (Battle Feel Polish Pass — docs only):**

- `docs/research/gameplay/pokemon-style-learning-battle.md` — Updated to align fully with `battle-feel-philosophy.md`. Authority note added: Battle Feel Philosophy governs all conflicts. Key changes: (1) Player HP removed — no HP bar, no defeat screen, no gentle defeat, no losing states; wrong answer = miss → fizzle → enemy taunts → continue; (2) Enemy counter-attack mechanic removed — replaced with: wrong → miss → enemy laughs → continue; no punishment accumulation, no strike count; (3) Move names reduced to tiny flavor text — icons and answers are primary; move card examples updated; (4) Battle log aligned to short format: "⚡ Thunder!", "โจมตีพลาด!", "คอมโบ!", "CRITICAL!", "ชนะแล้ว!"; (5) `gentle-defeat` audio removed, `enemy-taunt` added; (6) Session structure updated: "child cannot lose" is the stated design; (7) Open question 3 (player HP) resolved: removed.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section updated with all Battle Feel Polish decisions.
- `docs/TASKS.md` — Battle Feel Polish Pass task added and marked done.
- `docs/CHANGELOG.md` — Entry prepended.
- No code changes. No build.

---

**What changed last session (Battle Feel Philosophy Design — docs only):**

- `docs/research/gameplay/battle-feel-philosophy.md` — NEW. Required reading before implementing any Subject Battle. Defines the sensory and emotional grammar for all battle implementations. Core principle: battle is the experience — not a quiz with animation. Covers: visual hierarchy (enemy first, question disappears into move panel), player HP removal rationale (egg is never in danger, mistakes are safe), wrong-answer philosophy (miss not punishment — soft fizzle, "โจมตีพลาด!", no harsh buzzer), 10-step anticipation sequence (tap → card pulse → charge → egg lunge → elemental burst → enemy flash → camera shake → HP drain → damage float → combo/victory check, total ≤ 1000ms CSS-driven), sound philosophy (cute/positive/Pokémon-like, 10 named sound moments, no harsh sounds), combo system (streak 2=glow, 3=flash, 4+=crit ×1.5 + fanfare), victory sequence (enemy fade → stars → confetti → fanfare → egg celebrates → XP progress), battle log spec (single line, Thai-first, short labels), animation philosophy (fast/CSS/reuse existing keyframes, 8 new keyframes named), screen layout reference, implementation priority (PSLB-0 feel baseline before PSLB-1 content), 5 open questions before implementation.
- `docs/RESEARCH_INDEX.md` — Battle Feel Philosophy entry added to Gameplay section.
- `docs/GPT_NOTES.md` — Battle Feel Philosophy section added with player HP decision, combo philosophy, and implementation priority.
- `docs/TASKS.md` — Battle Feel task marked done; PSLB-0 (feel baseline) inserted before PSLB-1 in implementation queue.
- `docs/CHANGELOG.md` — Entry added.
- No code changes. No build.

---

**What changed last session (Pokémon-Style Learning Battle Design — docs only):**

- `docs/research/gameplay/pokemon-style-learning-battle.md` — NEW. Full design document. Core principle: answer choices ARE attack moves — this is battle-first design, not a quiz with battle decoration. Covers: move-select panel anatomy (`[icon] [move name] ... [answer content]`), all 3 subject encodings (Math=numbers, Thai=emoji+TTS, English=emoji+TTS), 8-step battle flow per turn (enemy appears → move panel → tap → fire → hit → HP drain → counter → next), move name sets by subject, screen layout spec, 14 animation keyframes, 8 new audio tones, full egg integration (child's egg is the hero via EggCanvas), session structure (8 turns, 1 enemy, gentle defeat), subject battle shell principle (one component — three content injections), MVP phasing (Math first → Thai → English → polish), scope check passes, 5 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Gameplay section updated.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section added.
- `docs/TASKS.md` — Design task marked done; PSLB-1 through PSLB-5 implementation queue added in Next section.
- `docs/CHANGELOG.md` — Entry added.
- No code changes. No build.

---

**What changed last session (Egg Companion Adventure MVP — code change):**

- `src/games/BattleMode.jsx` — EggCanvas replaces `🦸` player avatar. New props: `eggStats`, `eggProgress`, `readyToHatch`. Egg jumps (`eggBounce`) + gold `drop-shadow` + `✨` sparkle float (500ms) on correct answer. Egg shakes (`eggShake`) when enemy counter-attacks (3rd wrong). Continuous `egg-near-hatch` pulse/glow when stage ≥ 5 or `readyToHatch`. Egg growth progress panel below battle log: stage name (EGG_STAGE_NAMES) + progress bar + pct%. Golden bar + "✨ ใกล้ฟักแล้ว!" when near-hatch. Sparkle `item` tone fires 200ms after every correct answer (layered over existing `correct`/`streak` tone). Graceful fallback: shows `🦸` if `eggStats` is null.
- `src/games/DefenseMode.jsx` — EggCanvas replaces baby emoji (`BABIES[subject]`). Props: added `eggStats`. Egg bounces (`eggBounce`) + gold glow on shield-block (`shieldPulse`); shakes (`eggShake`) when shield is hit. The framing is now: the child is literally shielding their own egg. Sparkle `item` tone on correct.
- `src/games/ChaseMode.jsx` — EggCanvas replaces `🦸` runner. Props: added `eggStats`. Egg dashes (`adv-dash`) on correct. Sparkle `item` tone on correct.
- `src/games/GameSubjectAdventure.jsx` — `Session` destructures `eggStatsData`, `eggProgressData` from `useAppState()`. `modeProps` now includes `eggStats`, `eggProgress`, `readyToHatch` — passed to all 3 modes.
- `src/styles.css` — `@keyframes egg-near-hatch`: combined scale (1→1.05) + golden `drop-shadow` pulse, 2s looping. Used for near-hatch continuous glow in BattleMode.
- Build: ✅ zero errors. GameSubjectAdventure chunk: 32.40KB.

---

**What changed last session (Egg Companion Adventure Design — docs only):**

- `docs/research/gameplay/egg-companion-adventure.md` — NEW. Full design document. Egg as emotional companion (not progress bar). The child takes their egg on adventures — it reacts, grows, and hatching becomes a relationship payoff.
- Core framing: DefenseMode child literally shields their own egg. BattleMode egg beside player. ChaseMode egg dashes with player. BattleScreen (challenger) egg portrait in corner.
- Visual spec: egg reacts per event (adv-jump on correct, wobble on wrong, gold pulse on streak, continuous glow near hatch stage 5–6).
- Audio spec: brief chirp underscoring correct-answer tone. `eggReady` on session end near hatch. No new audio dominates the learning feedback.
- Relationship data: `adventuresWith`, `questionsAnswered`, `eggStartDate`, `daysTogetherCount`, `favoriteSubject` per egg. Shown as biography at hatch reveal. Never shown during journey.
- MVP recommendation: (1) DefenseMode egg canvas replacement — one prop change, no state change; (2) BattleMode egg portrait + adv-jump; (3) relationship data fields in ADD_XP reducer.
- Non-goals: no egg HP, no egg health from wrong answers, no XP numbers during play, no egg naming system (deferred to GPT question), no new reward economy.
- 5 open questions documented for GPT (see GPT_NOTES.md → Egg Companion Adventure Philosophy).
- No code changes. No build.

---

**What changed last session (Subject Adventure Engine MVP — code change):**

- `src/games/GameSubjectAdventure.jsx` — NEW orchestrator. Selects mode deterministically: `['battle','chase','defense'][(dayN + subjectPlayCount) % 3]`. Generates 8 questions per session: genMathQ (uses player's current level + visual models), genThaiQ (TH_ALPHA: show emoji, choose starting letter), genEngQ (EN_ALPHA: see emoji+word, choose letter). TTS via useEffect on cur change (speakTh/speakEn, 400ms delay). Dispatches ADD_XP per correct answer (10 XP + 5 crit bonus), ROUND_COMPLETE, UPDATE_LEVEL_MASTERY, UNLOCK_LEVEL (≥80%), LOG_SESSION. Key-based session reset for replay — remounting generates fresh questions and re-picks mode.
- `src/games/BattleMode.jsx` — NEW. Subject-specific enemies. Enemy HP + player HP bars. Correct: adv-jump + red flash + floating damage number. Streak≥2 = crit (×1.5 dmg + confetti). Wrong ×3 = enemy counter-attack + player shake. "dash" and "block" tones unused here; uses `correct`/`streak`/`wrong`.
- `src/games/ChaseMode.jsx` — NEW. Horizontal distance track (0%=escaped, 100%=caught). Start 30%. Correct +14% (crit ×1.5). Wrong ×3: -10% + target flee. Player 🦸 dashes forward on correct (adv-dash). "dash" SFX.
- `src/games/DefenseMode.jsx` — NEW. Baby creature (🥚/🐣/🌟 by subject) + shield HP pips + attacker emoji. Correct: shield bounces (adv-shield) + attacker pushed back. Wrong ×3: shield HP pip lost. "block" SFX on correct.
- `src/games/GameScreen.jsx` — Added lazy import + 3 new world routes: adventure-thai/math/eng.
- `src/components/Home.jsx` — "learn" recommendation now routes to `adventure-{world}`. Label: "{subject} ผจญภัย". Icon: Math=⚔️, Thai=🛡️, Eng=🏃. Classic games still accessible via "อยากเลือกเอง?" subject grid.
- `src/lib/audio.js` — `dash` (ascending 3-note sawtooth sweep) and `block` (low square thump) added to playTone.
- `src/styles.css` — `adv-jump`, `adv-dash`, `adv-shield` keyframes added.
- Build: ✅ zero errors. GameSubjectAdventure lazy chunk: 30KB.

**What changed last session (Battle special move timing + accessibility — code change):**

- `src/components/BattleScreen.jsx` — Redesigned the special move flow for accessibility and surprise feel. Battle now starts immediately (no pre-battle question gate). After attack 2 or 3 (random, clamped to valid range), a semi-transparent overlay appears mid-battle showing "⚡ พลังพิเศษมาแล้ว!" Questions are now emoji-visual: Math = count the emojis shown (🍎🍎 → tap 2/1/3); Thai/English = hear the word via TTS, pick the matching emoji (🐱/🐶/🐟). 🔊 replay button for Thai/English. Correct → `specialDmgRef` set + special SFX plays immediately + `victory-bounce` "🔥 ท่าพิเศษพร้อมแล้ว!" feedback → animation fires special attack in battle. Wrong → gentle "💪 สู้ต่อไปนะ!" feedback, battle resumes. Skip → battle resumes. HP tracking changed from absolute (pre-simulated log snapshots) to relative (apply `entry.dmg` to local HP counters) — required for mid-battle HP mutations from the special move. `TH_ALPHA`/`EN_ALPHA` imports removed; inline MATH_PROMPTS (7), THAI_PROMPTS (6), EN_PROMPTS (6) defined in file. TTS via existing `speakTh`/`speakEn` from `audio.js`. Sound toggle respected.
- Build: ✅ zero errors.

**What changed last session (Math Battle learning mode — code change):**

- `src/games/GameMathBattle.jsx` — NEW: 8-question Math battle vs cute enemy (🤖👻😈🐲). Dark purple battle UI. Correct → attack flash + HP drain; streak≥3 → Crit × 1.5 + SFX + confetti. Wrong → gentle shake, up to 3 attempts, no punishment. All XP/LOG_SESSION/UNLOCK_LEVEL dispatches identical to GameMath → Subject Readiness, egg progress, level unlock all work. Result screen: HP drained display + replay/home buttons.
- `src/games/GameScreen.jsx` — Lazy import + route for `mathbattle` world.
- `src/components/Home.jsx` — Continue Adventure Math → routes to `mathbattle` (icon ⚔️, "Math Battle", "ตอบถูก = โจมตี! ⚡"). Subject grid Math card still routes to normal `math` (LevelSelector).
- Build: ✅ zero errors. Commit: f6e5b74.

**What changed last session (Fix: rewards from Continue Adventure — bug fix):**

- `src/context/StateContext.jsx` — Fixed state-overwrite race condition. Both `loadState().then()` (mount) and the `SIGNED_IN` auth-refresh handler previously called `dispatch(INIT, remoteState)` unconditionally. If Supabase hadn't synced the latest local progress yet (async), `remote.rounds` would be behind `stateRef.current.rounds`, causing XP, items, and egg progress to silently revert. Fix: compare `remote.rounds` against `stateRef.current.rounds` before dispatching INIT. If local is ahead, skip INIT and push local state to cloud instead. Guest mode (no Supabase) and fresh-install (local rounds=0) are unaffected.

**What changed last session (Animation juice polish — code change):**

- `src/styles.css` — 10 new `@keyframes` + utility classes: `pulse-float` (3s bob on adventure card), `battle-glow-pulse` (purple ring on battle card), `shimmer-bright` (Surprise card), `slide-down-in` (subject grid), `victory-bounce` (win emoji), `item-pop-in` (reward box spring), `streak-bounce` (streak feedback), `hatch-glow` (golden drop-shadow on creature reveal), `modal-pop` (creature detail popup), `answer-correct-glow` (correct choice ring). `@media(prefers-reduced-motion:reduce)` disables all decorative animations.
- `src/components/Home.jsx` — rec card: `rec-card-float` or `rec-card-battle`; Surprise card: `rec-card-surprise`; subject grid: `subjects-slide-in` on mount.
- `src/components/BattleScreen.jsx` — `victory-bounce` on win emoji; `item-pop-in` on reward box; `victory-bounce` on special-move correct feedback.
- `src/components/HatchOverlay.jsx` — `hatch-reveal-glow` on creature emoji at done phase.
- `src/games/GameShop.jsx` — `victory-bounce` on done emoji; `streak-win` class (streak-bounce) on streak feedback.
- Build: ✅ zero errors. Commit: b5ff1a5.

**What changed last session (Audio polish and louder phonics — code change):**

- `src/lib/audio.js` — 9 new `playTone()` types: `tap` (warm pop), `open` (2-note upward), `unlock` (4-note jingle), `item` (sparkle), `eggReady` (3-note pulse), `reveal` (5-note sweep), `start` (burst), `complete` (4-note), `cardOpen` (soft pop). Phonics GainNode raised from 2.5 → 4.0.
- `src/components/Home.jsx` — `tap` on Continue Adventure + Surprise tap; `open`/`click` on subject-grid toggle; `eggReady` fires once on readyToHatch transition.
- `src/components/Collection.jsx` — `cardOpen` on creature card tap; `click` on popup close.
- `src/components/HatchOverlay.jsx` — `reveal` + staggered `fanfare` (350ms) at creature reveal.
- `src/components/BattleScreen.jsx` — `item` tone 950ms after win (reward popup). Added `playTone` import.
- `src/games/GameShop.jsx` — `complete` at ≥80% pass (was silent); ≥90% keeps `fanfare`.
- `src/games/GamePhonics/Math/Thai.jsx` — `unlock` on level unlock; `complete` on 80–89% pass.
- Build: ✅ zero errors. Commit: 78a6ddd.

**What changed last session (Battle learning special move — code change):**

- `src/components/BattleScreen.jsx` — Learning-based special move added. Before each battle a question appears: "⚡ ตอบถูก ปล่อยท่าพิเศษ!" with 4 tap-target buttons + skip link. `pickBattleQuestion(sessionLog)` selects subject from most-played recent sessions (most comfortable readiness signal). Falls back to simple Math (1+1 to 4+4) when no session data. Correct → `specialDmg = ceil(opponent.HP × 0.25)`, brief "🔥 ท่าพิเศษพร้อมแล้ว!" feedback, battle starts; special attack fires FIRST (⚡ text + 5-note ascending 'special' SFX + gold damage float + hit flash). Enemy HP re-simulated from reduced starting HP so win condition is correctly earned. Wrong/skip → "💪 สู้ต่อไปนะ!" feedback, battle continues normally — no penalty. One question per battle only. Also added 'special' sound type. Bonus fix: ATK/DEF lose-screen advice text was showing wrong subjects (was Thai→ATK, Math→DEF; now correctly Math→ATK, Thai→DEF per calcCreatureStats formula).
- Build: ✅ zero errors. Commit: d3ef85c.

**What changed last session (Battle balance and sound — code change):**

- `src/config/gameConfig.js` — AI_OPPONENTS rebalanced. Enemy HP ×4 (regular/miniboss) and ×3.5 (boss). Enemy ATK ×2.5 across all 6 tiers. Result: Tier 0 regular battles now last ~7 turns (was 2). Bosses ~14 turns (was 4). Player still usually wins but takes meaningful HP damage. DEF kept unchanged.
- `src/components/BattleScreen.jsx` — Battle SFX fixed and improved. Added `import { getSoundOn, getACtx }` from audio.js. `playBattleSound` now checks `getSoundOn()` (respects sound toggle) and reuses shared AudioContext (no more per-call context leak). Sound types: `attack` (sword-swing whoosh), `hit` (3-layer impact), `crit` (4-tone ascending), `win` (6-note fanfare), `lose` (gentle 4-tone descent).
- Build: ✅ zero errors.

**What changed last session (Battle Home experience — code change):**

- `src/components/BottomNav.jsx` — ⚔️ badge removed from Collection tab entirely.
- `src/App.jsx` — `challengerOpen` state lifted from ChallengerOverlay; useEffect fires when `pendingChallenger` set; props wired to ChallengerOverlay and Home.
- `src/components/ChallengerOverlay.jsx` — internal visible state replaced by `open`/`onClose` props.
- `src/components/Home.jsx` — battle added to Adventure Director priority (hatch → battle → shop → weakest subject). When `pendingChallenger` exists: dark gradient card with challenger emoji + "มอนสเตอร์ปรากฏตัว!" — tap opens ChallengerOverlay.
- Build: ✅ zero errors.

**Previous session (Shop Mission speech feedback — code change):**

- `src/games/GameShop.jsx` — `speakTh`/`speakEn` imported. `THAI_NUMS` array added. After each correct answer: Thai → speak Thai word (380ms delay); English → speak English word (380ms); Math/counting → speak Thai number word (หนึ่ง/สอง/สาม...). Social phrase question speaks the child's actual choice (ขอบคุณครับ or ขอบคุณค่ะ). All existing tones preserved. Sound toggle respected via `_soundOn` inside speak functions.
- `docs/research/progression/gameplay-loop.md` — "Learning Feedback Principles" section added: visual/sound/speech pattern, principles, implementation status table, what to avoid.
- `docs/GPT_NOTES.md` — Learning Feedback Principles section added.
- Build: ✅ zero errors.

**Previous session (Home UI simplification — code change):**

- `src/components/Home.jsx` — subject cards made collapsible: "หรือเลือกเรียน" static label → "อยากเลือกเอง?" toggle button (closed by default). Shop Mission permanent card removed. Visual hierarchy now: Egg → Continue Adventure (large) → "อยากเลือกเอง?" toggle → Egg Run → Surprise Event → Stats.
- Shop still reachable via Continue Adventure recommendation (triggers when `shopV1.runs === 0`).
- All game logic, minigame code, and recommendation logic unchanged.
- Build: ✅ zero errors.

**Previous session (Observation philosophy documentation — docs only):**

- `docs/research/observation/observation-philosophy.md` — created. Covers: observe→understand→design loop, children are not their level (behavior > history), positive interpretation (replay = confidence-building), important signals vs. signals that must not dominate (no speed/streaks/rankings), Subject Readiness as observations not labels, parent report philosophy (no anxiety/grades/fear), mission follows child (deterministic design iteration not AI), non-goals (no AI tutoring/adaptive engines/manipulation/addiction optimization), system relationships, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Observation section added.
- `docs/GPT_NOTES.md` — Observation Philosophy section added.
- No code changes. No build.

**Previous session (Gameplay loop documentation — docs only):**

- `docs/research/progression/gameplay-loop.md` — highest-level philosophy document created. Covers: Home as Adventure Director (answers "what next?", not "what do you choose?"), core loop (learn→battle→learn, learning always upstream), replay philosophy (healthy/full XP), surprise philosophy (rare=special, daily date-hash rotation), minigame philosophy (rewards not primary game, one daily > 2×2 grid), intrinsic motivation (curiosity/collection/surprise/progress/mastery; no FOMO/streak/time pressure), child autonomy (suggest not force), explicit non-goals, system relationships (this doc is highest-level), 5 open questions.
- `docs/RESEARCH_INDEX.md` — gameplay-loop.md added, marked highest-level philosophy.
- `docs/GPT_NOTES.md` — Gameplay Loop Philosophy section added.
- No code changes. No build.

**Previous session (Battle progression documentation — docs only):**

- `docs/research/battle/battle-progression.md` — source-of-truth created. Covers: core loop (Learn→XP→Egg→Hatch→Creature→Battle→Learn), battle as reward not primary game, creature philosophy (every creature usable), gentle enemy scaling, Challenger every 15 rounds, loss philosophy (no permanent penalties), reward design, self-directed frequency, non-goals (no PvP/leaderboards/pay-to-win/gacha/energy), future features (evolution/equipment/rarity/bosses), system relationships, known BattleScreen text bug (ATK advice still says Thai not Math), 5 open questions.
- `docs/RESEARCH_INDEX.md` — battle-progression.md entry added.
- `docs/GPT_NOTES.md` — Battle Progression Philosophy section added.
- No code changes. No build.

**Previous session (Subject progression documentation — docs only):**

- `docs/research/progression/subject-progression.md` — source-of-truth created. Covers: core philosophy (subjects primary, missions secondary), unlock thresholds (70 soft pass / 80 unlock / 90 mastery), replay always valid with full XP, mastery = confidence not perfection, stretch/challenge optional layers, subject independence, readiness vs. highest unlock, non-goals, future grade roadmap, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Progression section added.
- `docs/GPT_NOTES.md` — Subject Progression Philosophy section added.
- No code changes. No build.

**Previous session (Creature stats documentation — docs only):**

- `docs/research/battle/creature-stats.md` — source-of-truth created. Covers: design philosophy (every creature battle-viable), why one-subject-one-stat fails (ATK=0 for Thai-only learner), weighted formula with 40% base floor, example weightings for HP/ATK/DEF/SPD/CRIT, personality variation (±10% deterministic from XP seed), migration rules (recalc on 0/NaN, never delete eggs), explicit non-goals (no AI, no rerolls, no pay-to-win), future scaling (learning profile always the foundation), 5 open implementation questions.
- `docs/RESEARCH_INDEX.md` — Battle section added.
- `docs/GPT_NOTES.md` — Creature Stat Design Philosophy section added.
- No code changes. No build.

**Previous session (Egg economy documentation — docs only):**

- `docs/research/rewards/egg-economy.md` — source-of-truth created. Covers: core loop, design philosophy (no FOMO, no streak pressure, first egg fast), scaling formula table, visual stage system, XP sources, migration rules, implementation reference, open questions.
- `docs/RESEARCH_INDEX.md` — Rewards & Economy section added.
- `docs/GPT_NOTES.md` — Egg Economy Decisions + open question for GPT re: first-egg onboarding threshold.
- No code changes.

**Previous session (Egg pacing + creature stat rebalance):**

### Egg progression pacing
- **`src/context/StateContext.jsx`** — `scaledEggProgress(state)` helper added. `required = min(800, 120 + hatchedEggs.length × 60)` — first egg 120 XP (fast), gradual to 800 cap. Dynamic `xpPerStage = required/7`. `ADD_XP` now uses `newTotal >= hatchRequired` for `readyToHatch`. `derived` useMemo uses `scaledEggProgress`; `eggStatsData.stage` overridden to scaled value so canvas matches display.
- **`src/components/Home.jsx`** — egg label uses dynamic `xpPerStage`; stage 6 shows "เกือบฟักแล้ว!" before hatch trigger.

### Creature stat rebalance
- **`src/config/gameConfig.js`** — `calcCreatureStats()` rewritten. Old: Thai=ATK, Math=DEF, Eng=SPD (exclusive, ATK=0 if no Thai). New: weighted formula — `ATK = base×(0.4 + 0.3×mShare + 0.2×eShare + 0.1×tShare)`. Every stat has 40% base floor, no stat can reach 0.
- **`src/lib/state.js`** — `_migrateEggs()` now recalculates stats if ATK/DEF/SPD is 0 or NaN.
- **Build: ✅ zero errors.**

**Previous session (Shop feedback + hatch overlay fix):**
- `GameShop.jsx`: wrong-button shake, streak fire messages. `HatchOverlay.jsx`: freeze fix + `suppressAutoOpen` prop. `App.jsx`: no mid-game hatch interruption.

---

## Current Project State

KidQuest is a React 18 SPA (Vite, Vercel) — educational RPG for Thai children aged ~5+.

**Core loop:** Learn (quiz) → earn XP → egg evolves (7 stages × 50 XP) → hatch → get creature → battle AI opponents.

**What's fully working:**
- **Thai**: 5 levels (letter match, spell×3, word-order)
- **Math**: 9 levels — L0 Foundation, L1–L5 (add/sub/mixed), L6 (word problems), L7 (comparison), L8 (pattern AB)
- **English**: 4 levels (A–Z phonics, CVC words, sight words, sentence ordering)
- **Shop Mission** (`GameShop.jsx`): 4 phases / 6 Qs. `shopV1` with extended analytics (totalHints, totalDuration, phaseStats). Shop card on Home.
- **Play Observation System** (Phase D): `sessionLog` ring buffer (50 entries), `replayedImmediately` auto-computed, Mission Analytics card in Report, play history timeline.
- **Subject Readiness** (Phase D+): `SubjectReadiness` component in `Report.jsx`. `computeReadiness()` derives state from last 10 `sessionLog` entries per subject at render time. 4 states with Thai labels. No new state fields.
- **Home 2.0 — Adventure Director**: Single recommendation card (⭐ ผจญภัยต่อ) + daily surprise event (🎁 เซอร์ไพรส์วันนี้). Replaces 2×2 minigame grid.
- **Shop Mission feedback polished**: wrong-button shake, streak fire messages, amber streak counter. `playTone` calls unchanged.
- **Hatch overlay stable**: freeze-after-hatch fixed; no longer auto-interrupts gameplay (`suppressAutoOpen` prop).
- **Egg pacing**: first egg 120 XP (fast onboarding), later eggs scale by `min(800, 120 + n×60)`. Visual progress and drawEgg canvas both use scaled stage.
- **Creature stats rebalanced**: weighted formula — every stat has 40% base floor. No stat can be 0. Deterministic ±5% personality variation. Migration recalculates broken (0/NaN) stats.
- Procedural egg + creature drawing on Canvas (egg algorithm LOCKED)
- **Pokémon-Style Learning Battle**: `MoveSelectBattleMode.jsx` is the new battle mode in Subject Adventure Engine for all 3 subjects. Battle-first: move panel replaces quiz panel. No player HP. Combo/ultimate system. Boss encounters. Teach intro first play. Child result screen hides accuracy/score.
- **Subject Adventure Engine**: Continue Adventure routes all subjects to GameSubjectAdventure. 3 modes: MoveSelectBattleMode (Pokémon-style), ChaseMode (close distance), DefenseMode (shield baby). Mode rotates daily per subject. All 3 subjects. TTS on Thai/English. Full XP/sessionLog/level-unlock dispatch.
- Turn-based battle (BattleScreen) + learning special move (mid-battle emoji question, TTS); challenger system every 15 rounds; AI_OPPONENTS all 6 tiers
- 5 minigames (EggRun, EggCatch, EggMemory, EggTower, EggFishing)
- Supabase auth + cloud sync; full guest mode
- Parent Report: overview, subject time, strengths, Mission Analytics, Subject Readiness, play history

**Not done:** payment, landing page, multi-child, PWA, Cooking/Garden missions.

---

## Active Tasks

**Now (highest priority):**
- **Play Shop Mission with Chopin** — validate fun and 2–3 min timing. Which steps feel clear? Which feel hard or boring? Report back to `GPT_NOTES.md`.
- **D0: Shop card UX audit (updated)** — Now: test Home 2.0 with Chopin. Does the Adventure Director feel natural? Does Chopin tap the big recommendation card without prompting? Does the Surprise section delight or confuse? Write to `GPT_NOTES.md`.

**Phase E (after play validation):**
- Shop Stretch (quantity difference + price concept) with mastery-gate UI
- ⚠️ Shop Stretch is independent of Subject Readiness — proceed after play validation

**Phase F / Content expansion (after Phase E):**
- **Cooking Mission MVP** — ⚠️ Do not design step sequence before consulting Subject Readiness data from real play sessions.

---

## Home 2.0 Design Reference

**Adventure Director logic (`getRecommendation`):**
| Priority | Condition | Recommendation |
|----------|-----------|----------------|
| 1 | `state.readyToHatch && stage >= 6` | 🥚 ฟักไข่! |
| 2 | `shopV1.runs === 0` | 🏪 ร้านค้า (first time) |
| 3 | default | Subject with lowest XP |

**Surprise Event logic (`getSurpriseEvent`):**
- Filter: `['catch','memory','tower','fishing'].filter(id => eggsHatched >= MG_UNLOCK[id])`
- Pick: `unlocked[dateHash % unlocked.length]` — deterministic daily rotation
- Played check: `sessionLog.some(s => s.world === id && sameDay)`
- No new state fields

---

## Important Decisions

| Decision | Rule |
|----------|------|
| Egg algorithm | **LOCKED** — `eggAlgorithm.js` must not be modified |
| LocalStorage | Mandatory fallback — Supabase must never throw to user |
| Guest mode | Always works — full app without login |
| Child errors | Silent or friendly only — no stack traces |
| State blob | Full `state_json` in one Supabase row (not per-session rows) |
| Highest unlock level | **Not a readiness proxy** — use `sessionLog` derived Subject Readiness instead |
| Subject Readiness | Computed at render time from `sessionLog`. No new state. No AI. Now live in Report.jsx. |
| Mission content | Must follow readiness profile, not assumed level gates |
| Home 2.0 | Adventure Director: single recommendation + daily surprise. No 2×2 minigame grid. |

---

## Subject Readiness Reference

Computed from `sessionLog` per subject. Four states:

| State | Thai Label | Threshold |
|-------|------------|-----------|
| **Strong** | แข็งแรงมาก | avgScore ≥ 0.85 AND goodRuns ≥ 3 AND completionRate ≥ 0.80 (last 10 sessions) |
| **Comfortable** | กำลังมั่นใจ | avgScore ≥ 0.70 AND goodRuns ≥ 2 |
| **Exploring** | กำลังสำรวจ | Sessions exist but below Comfortable |
| **Not Ready** | ยังไม่มีข้อมูลพอ | No sessions for this world |

Full spec: `docs/research/observation/play-observation-system.md` → "Subject Readiness"

---

## Codebase Map (key files)

```
src/config/gameConfig.js        — ALL game content (~380 lines)
src/context/StateContext.jsx    — Global state + ACTIONS (includes LOG_SESSION, UPDATE_SHOP_V1)
src/lib/state.js                — defaultState() — sessionLog + shopV1 with analytics fields
src/components/Home.jsx         — Home 2.0: Adventure Director (rec card + surprise event)
src/components/Report.jsx       — Report: Overview + Subject time + Strengths + MissionAnalytics + SubjectReadiness + PlayHistory
src/games/GameShop.jsx          — Shop Mission 6 Qs — dispatches LOG_SESSION + extended UPDATE_SHOP_V1
src/games/GameThai.jsx          — Thai: useFinishRound dispatches LOG_SESSION
src/games/GameMath.jsx          — Math: dispatches LOG_SESSION in next() when done
src/games/GamePhonics.jsx       — English: all 4 game components dispatch LOG_SESSION
src/components/BattleScreen.jsx — Battle sim + animation
src/lib/eggAlgorithm.js         — LOCKED procedural egg drawing
```

---

## Risks / Unknowns

- **`nextAction` in sessionLog is always `null`** — tracking post-result navigation requires a navigation event system. Deferred. Field exists in schema for future use.
- **Subject Readiness will show "ยังไม่มีข้อมูลพอ" for all subjects until Chopin plays** — expected. Labels update naturally.
- **Cooking Mission readiness dependency** — step sequence must not be designed until readiness data from real play is available.
- **Home 2.0 recommendation is always lowest-XP subject** — intentional for balance. May feel repetitive if Chopin wants to replay a preferred subject. Could add "last played" tie-breaker later if needed.
- **Surprise rotation with one unlocked game** — shows same game daily until a second is unlocked. Acceptable for now.
- **Egg pacing affects only new eggs** — existing players with old state see correct new pacing on their NEXT egg (current egg's readyToHatch is recalculated on next ADD_XP).
- **Battle special move questions** — Uses hardcoded inline sets (7 math / 6 Thai / 6 English). All are emoji-visual or TTS-first (no reading required). Math: count emojis shown. Thai/English: listen + tap emoji. Child can replay TTS with 🔊. If sound is off, Thai/English shows the written word as fallback (no visual emoji cue without the sound — this is acceptable since visual choices are large emoji).
- **Creature stats ~1.8× higher than before vs old enemies** — now resolved by the HP×4 / ATK×2.5 rebalance. Battles last 6–15 turns; player still favored but takes real HP damage.
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail in Supabase — all progress in one blob per user

---

## Recommended Next Work

**GPT — next:**
1. **Answer Pokémon Battle open questions** — see `GPT_NOTES.md` → Pokémon-Style Learning Battle. Key decisions: (a) correct move = consistent damage or most damage? (b) enemy counter on wrong × 3 only vs. every N turns? (c) player HP bar — stakes vs. pressure for age 5? (d) move names random or subject-themed? (e) replace BattleMode entirely or keep both? Write answers to `GPT_NOTES.md`.
2. **Answer Egg Companion open questions** — see `GPT_NOTES.md` → Egg Companion Adventure Philosophy. Key decisions: (a) egg naming at creation? (b) hatch biography before or after creature reveal? (c) companion framing: explicit text or implicit visuals for a 5-year-old? Write answers to `GPT_NOTES.md`.
3. **Play Home 2.0 with Chopin** — does the Adventure Director feel natural? Does Chopin tap the big recommendation card? Does the Surprise section delight? Write to `GPT_NOTES.md`.
4. **Play Shop Mission with Chopin** — validate fun, timing, and which phases feel clear vs confusing. Write to `GPT_NOTES.md`.
5. **Shop Stretch design review** — is the quantity-difference question at the right Early Grade 1 level? Write to `GPT_NOTES.md`.
6. **Thai Levels 6–8 content** — fruits, everyday objects, short action sentences for อนุบาล/early ป.1. Write to `GPT_NOTES.md`.
7. **Math Levels 9–10 content** — place value, counting to 100, early ป.1 stretch. Write to `GPT_NOTES.md`.

**Claude Code — next:**
1. **Play Pokémon Battle with Chopin** — Test all 3 subjects. Does it feel like battle not quiz? Are tap targets large enough? Does the combo/ultimate feel exciting? Report to `GPT_NOTES.md`.
2. **ECA-MVP-3: Relationship data fields** — `adventuresWith`, `questionsAnswered`, `eggStartDate` to egg object in `defaultState()`. Increment in `ADD_XP` reducer.
3. **BattleMode.jsx cleanup** — `BattleMode.jsx` is now dead code (no imports). Safe to delete in a cleanup pass. Confirm no other file references it before deleting.
4. Phase E: Shop Stretch implementation + mastery-gate UI (after play validation)
5. (Later) Cooking Mission MVP — only after Subject Readiness data from real play accumulates
