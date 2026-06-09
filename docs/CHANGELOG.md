# Changelog — KidQuest

## 2026-06-09 — Egg Home Emotional Life

- `src/components/Home.jsx` — New idle behaviors: `idle-blink` (fast Y-squish, ~blink), `idle-look` (gentle tilt, curious), `idle-yawn` (slow stretch + settle) added to the 5–12s random idle pool. Creature companion gains personality state machine (walk/wave/sit/celebrate/gift/look/sleep, 20–45s cycle): `wave` → creature bounces + 👋 inline + chirp sound; `sit` → tilted 14° + static; `celebrate` → jump loop + 🎊 + sparkle particles + celebrate sound; `gift` → 🎁 shown; `look` → 👀 shown; `sleep` → dim opacity + 💤. Creature patrol pauses during non-walk states. Directional flip wrapped separately from animation class so they don't conflict. Ambient events: butterfly 🦋, falling leaf 🍂, shooting star ✨ — `position:fixed` CSS animations, triggered every 38–88 seconds, visual only, no mechanics. Reunion enhanced: hearts+sparkle combined burst + double chirp. Ribbon: changed from `pet` to `happy-spin` (proud spin). Star: combined sparkle+hearts burst.
- `src/lib/audio.js` — Added `yawn` sound: low descending sine (290→165Hz, 0.94s).
- `src/styles.css` — 12 new keyframes/classes: `idle-blink`, `idle-look`, `idle-yawn`, `creature-wave`, `creature-celebrate`, `creature-overlay-bob`, `ambient-butterfly`, `ambient-leaf`, `ambient-shooting-star` + CSS classes for new idle and creature animations.
- Build ✅. Commit: `feat: egg home emotional life`. Pushed.

## 2026-06-09 — Home Bottom Layout Overlap Fix

- `src/styles.css` — Added `#root { height:100%; width:100%; display:flex; flex-direction:column; overflow:hidden }`. This fixes the height propagation chain (html→body→#root) so that `height:100%` on children resolves correctly. Also increased `#egg-home` padding-bottom from `calc(60px + safe)` to `calc(76px + env(safe-area-inset-bottom))` — actual nav height is 95px (61px buttons + 34px safe area), previous value was 94px (1px short).
- `src/components/Home.jsx` — Changed root div `height:'100%'` → `height:'100dvh'` and split `overflow:'hidden'` → `overflowX:'hidden', overflowY:'hidden'`. `100dvh` (dynamic viewport height) works independently of the parent height chain and adjusts correctly for iOS Safari's retractable browser toolbar. Belt-and-suspenders with the #root CSS fix.
- Build ✅. Commit: `fix: home bottom layout overlap`. Pushed.

## 2026-06-09 — Egg Home Emotional Polish

- `src/components/Home.jsx` — Full rewrite. Flying food animation (fixed-position emoji flies from tray up to egg center, egg eats it). Per-item glow effects via CSS `drop-shadow` on EggCanvas (`egg-glow-warm/blue/gold/pink`). Ribbon 🎀 overlay (persists on egg after use, top-right corner). Star orbit: two `.egg-star-orbit` divs rotating around egg when XP boost active. Random idle micro-animations: every 5–12s, `idle-wiggle` or `idle-jump` fires (25% chirp, 8% begging sound) — egg feels alive without interaction. `stageRef` + `eggAnimRef` fix stale closure in `triggerAnim` and idle scheduler. Food chain: flyingItem set → 360ms → eat anim + chew sound + warm glow → 620ms: flyingItem clear → 870ms: sigh sound. Ribbon: jingle + pink glow + pet anim. Potion: slurp + blue glow + relax anim. Star: celebrate + gold glow + happy-spin. Pet streak 3 → giggle sound. Layout: inline `paddingBottom:66` removed; CSS `#egg-home` rule handles safe-area-aware padding.
- `src/lib/audio.js` — 6 new SFX: `chew` (3-hit crunch), `slurp` (rising sine + accent), `giggle` (4-step ascending triangle pairs), `sigh` (descending sine fade), `celebrate` (6-note ascending fanfare), `begging` (rising-falling sine breath).
- `src/styles.css` — EGG HOME section expanded: `egg-anim-eat`, `egg-anim-relax`, `egg-anim-idle-wiggle`, `egg-anim-idle-jump`, `food-fly-up`, `egg-glow-warm/blue/gold/pink`, `star-orbit` keyframes and classes. Layout: `#egg-home` `padding-bottom: calc(60px + env(safe-area-inset-bottom))` fixes iPhone safe area overlap.
- Build ✅. Commit: `feat: egg home emotional polish`. Pushed.

## 2026-06-09 — Egg Home MVP

- `src/components/Home.jsx` — REPLACED. Old Home (Adventure Director, subject grid, Egg Run, stats strip) removed. New Egg Home: large egg center (190×225px), idle float animation, stage 5+ excited pulse, pet interaction (chirp+sparkle+hearts), streak happy-spin + sleepy, reunion burst on first visit or >4h gap, item tray (food/ribbon/potion/star, count badges, tap-twice-to-use), creature companion walks left-right after first hatch (tap for chirp+bounce), action row (ลูบไข่ / คอลเลกชัน / ออกสำรวจ), warm gradient background.
- `src/lib/state.js` — Added `lastHomeVisit: null` to `defaultState()`.
- `src/context/StateContext.jsx` — Added `UPDATE_LAST_HOME_VISIT` action + reducer case.
- `src/lib/audio.js` — Added 4 new SFX to `playTone()`: `chirp` (high cute chirp), `sparkle` (ascending twinkle), `jingle` (ribbon jingle), `feed` (eating sound).
- `src/styles.css` — Added Egg Home keyframes: `egg-home-float`, `egg-home-excited`, `egg-anim-pet`, `egg-anim-happy-spin`, `egg-anim-reunion`, `egg-anim-sleepy`, `particle-rise`. Added CSS classes: `.egg-anim-float/excited/pet/happy-spin/reunion/sleepy`.
- Build ✅. Commit: `feat: egg home mvp`. Pushed.

## 2026-06-09 — Egg Home Design (docs only)

- `docs/research/world/egg-home.md` — NEW. Full Egg Home design. Goal: child feels "I want to visit my egg." Covers: screen layout (390px portrait), egg zone (160–200px center, stage-aware appearance), item tray interactions (pet/feed/ribbon/potion/star with distinct visual rituals), mood system (happy/content/quiet/excited/reunion — visual only, no stat bars), stage progression in Home (stages 1–7 with distinct egg behaviour), creature companion (walks left-right, tap for reaction), return loop motivators (intrinsic only: reunion burst, near-hatch excitement, items waiting), Year 1 MVP scope, 10 open questions for GPT.
- `docs/GPT_NOTES.md` — Egg Home Design section added at top.
- `docs/TASKS.md` — Egg Home design task marked done; GPT open questions task added.
- `docs/SESSION_SUMMARY.md` — Updated.
- `docs/GPT_HANDOFF.md` — Latest session summary updated.
- No code changes. No build.

## 2026-06-09 — KidQuest World Design (docs only)

- `docs/research/world/kidquest-world.md` — NEW. Full design document for the world-based game model. Covers: philosophy shift (game-first, learning hidden), Chopin's direct playtesting feedback ("boring" / "not like a game"), emotional center (egg is the hero), high-level loop (Egg Home → explore → encounter → battle → reward → grow → hatch), Egg Home spec, World Map structure (screen-based, Pokémon FireRed model), region list (Year 1 = Green Meadow only), exploration events, battle's new role, learning hidden curriculum principle, transition from current state, Year 1 MVP scope, 10 open questions for GPT.
- `docs/GPT_NOTES.md` — KidQuest World section added at top. Records: Chopin's feedback, philosophy decision, emotional center decision, high-level loop, map structure decision (screen-based), Year 1 scope (Green Meadow), 10 open questions, what Claude Code must NOT touch until GPT answers.
- `docs/TASKS.md` — KidQuest World design phase tasks added at top of Now section: world doc (done), GPT open questions (pending), Egg Home design, World Map design, Encounter design, implementation queue (blocked on design).
- `docs/SESSION_SUMMARY.md` — Updated.
- `docs/GPT_HANDOFF.md` — Updated with new session summary and revised current state.
- No code changes. No build.

## 2026-06-09 — Educational Visuals for Math Counting

- `src/config/gameConfig.js` — Added `COUNTABLE_GROUPS` (3 semantic categories: fruits 🍎🍌🍓🍊🍒, animals 🐟🐱🐶🐰🐸, everyday 🧸⭐🎈🌸🚗) and `COUNTABLES` (flat export). Updated `PATTERN_SETS.AB`: removed game meta-item `🥚` (egg), added educationally coherent pairs — shapes `['🔺','🔵']`, fruits `['🍎','🍌']`, animals `['🐱','🐶']`. Updated `TEACH_CONTENT.math[0]` examples (🥚🥚🥚 → 🍎🍎🍎, ⭐×5 → 🐟×5). Updated `TEACH_CONTENT.math[8]` pattern examples to match new pattern sets.
- `src/games/GameMath.jsx` — Removed local `COUNTABLES`. Imports `COUNTABLES, COUNTABLE_GROUPS` from gameConfig. `genQ` for `objects` visual model now picks both `emojiA` and `emojiB` from the same semantic group (e.g. 🍎+🍌, 🐱+🐶), so addition visuals are coherent instead of random cross-category pairs.
- `src/games/GameMathBattle.jsx` — Removed local `COUNTABLES`. Imports from gameConfig.
- `src/games/GameSubjectAdventure.jsx` — Removed local `COUNTABLES`. Imports from gameConfig.
- Build: ✅ zero errors. Commit: b050fd1.

## 2026-06-09 — True Full-Screen Mobile Battle Layout (bug fix)

- `src/games/GameScreen.jsx` — Adventure worlds now use `position:fixed;inset:0;zIndex:50` overlay, fully escaping all parent flex constraints. Absolute-positioned `←` back button (z-index 200). Inner `flex:1` div contains the game tree.
- `src/styles.css` — Removed `align-items:center` from `#root` rule. `#root` now only stretches children (no centering). Home still centers itself internally — safe change.
- `src/games/GameSubjectAdventure.jsx` — Default export wrapped in `flex:1/minHeight:0` div so Session fills the overlay. `ResultScreen` root changed `minHeight:'100%'` → `flex:1` for reliable viewport fill in flex context.
- `src/games/MoveSelectBattleMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- `src/games/ChaseMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- `src/games/DefenseMode.jsx` — Root div changed from `height:100%/minHeight:100%` → `flex:1/minHeight:0`.
- Build: ✅ zero errors. Commit: 2ba7922.

## 2026-06-09 — Mobile Playtest Polish: Full-Width UI + Simplified Answer Cards

- `src/games/GameScreen.jsx` — Adventure worlds (`adventure-*`) now use a dedicated full-width container: no `maxWidth`, no `alignItems:'center'` (defaults to stretch), `overflow:'hidden'`. All other worlds keep the existing `maxWidth:480 / alignItems:center` container. Root cause of white-margin bug: `alignItems:'center'` on the flex column container prevented game components from stretching to full width.
- `src/games/MoveSelectBattleMode.jsx` — Removed attack identity layer entirely. Deleted: `ICONS` array, `MOVE_NAME` map, `moveIcons` useMemo, `shuffle` import, `useMemo` import. `MoveCard` now shows **only the learning answer** — no element icon above, no attack name below. Font size adapts to content: ≤2 chars→64px (emoji, digit), ≤4 chars→54px, longer→44px. Battle log for simple hit changed from `"⚡ Thunder! +N XP"` to `"⚔️ โจมตี! +N XP"`. Chunk size: 36.72→36.22 KB.
- Build: ✅ zero errors. Commit: a8759ea.

## 2026-06-09 — Adventure Mode UI 2.0

- `src/games/DefenseMode.jsx` — Full layout redesign. Enemy (attacker) enlarged from 90px → 120px emoji. Removed `QuestionDisplay` component (44px emoji + word + subtext — was dominating the screen). Replaced with compact `QuestionHint` (28px emoji + 🔊 button only, or tiny math/count display). Hit flash overlay added (crit-flash keyframe). Miss animation on wrong choice button (`miss-fizzle`). Red button highlight on wrong tap. Combo indicator top-left (no large badge). Mode text labels removed. Vertical stack unchanged: Enemy → Shield → Egg. Egg gets continuous `egg-idle 3s` idle animation. Move panel: `flex:1` takes bottom half, `flexShrink:0` on all headers.
- `src/games/ChaseMode.jsx` — Full layout redesign. Target emoji enlarged from 64px → 120px, moved to top center (was top-right corner). Removed `QuestionDisplay`. Replaced with same compact `QuestionHint`. Chase track slimmed from 70px → 32px. Egg on track stays (28px canvas). Hit flash overlay added. Miss animation on wrong button. Combo indicator top-left. Target now shows "จับได้แล้ว!" + victory-bounce when dist≥100. Slim track shows gold fill when dist≥80 ("⚡ ใกล้แล้ว!" label inside).
- `src/games/MoveSelectBattleMode.jsx` — Egg idle animation: default state now `egg-idle 3s ease-in-out infinite` instead of `none`. Question hint min-height reduced 46→36px. Minor layout tightening.
- `src/styles.css` — New keyframe `egg-idle` (gentle float + rotate, 3s ease-in-out). Added to `prefers-reduced-motion` suppression.
- Build: ✅ zero errors. GameSubjectAdventure chunk: 36.72KB.

## 2026-06-04 — Pokémon-Style Learning Battle (all 3 subjects)

- `src/games/MoveSelectBattleMode.jsx` — NEW. Pokémon-style battle shell replacing BattleMode in Subject Adventure Engine. One component serves Math/Thai/English via subject adapters. Move panel: 2×2 grid, each card shows `[element icon] [answer content]` (number for Math, emoji for Thai/Eng). No player HP. Wrong answer = miss fizzle + "โจมตีพลาด!". Combo system: streak 2=glow, 3=combo flash, 4+=CRITICAL ×1.5 damage. Ultimate: after 3 consecutive correct, ultimate charges (×2 damage on next correct). Boss encounters at 12% rate. Victory after last question: enemy defeat animation → confetti → fanfare → result screen. Teach intro overlay shown on first-ever play of a level. Anticipation sequence: tap → card pulse → egg charge → egg lunge → hit/miss effects. TTS fires on Thai/English question load. Egg companion: all existing EggCanvas animations, near-hatch glow, combo glow ring.
- `src/games/GameSubjectAdventure.jsx` — Added `genThaiMoveQ()` and `genEngMoveQ()` generators that return emoji choices (not letter choices) for the battle move panel. `genMoveQuestion()` dispatcher selects format by subject. Session now generates battle questions with `genMoveQuestion` when mode is 'battle', classic questions for chase/defense. Replaced `BattleMode` import with `MoveSelectBattleMode`. Passes `isFirstLevel` prop. `ResultScreen` updated: hides score/accuracy from child (score still in sessionLog for parent Report), shows 🎉 ชนะแล้ว! + +XP + ไข่โตขึ้น! only.
- `src/lib/audio.js` — 3 new `playTone()` types: `miss` (soft descending fizzle, no harsh sound), `combo` (rising 3-note chime), `ultimate` (7-note ascending power fanfare).
- `src/styles.css` — 5 new keyframes: `move-pulse` (card tap scale+glow), `egg-charge` (vibrate in place), `miss-fizzle` (card fades/blurs), `enemy-defeat` (enemy shrinks and fades), `crit-flash` (screen flash). Added to `prefers-reduced-motion` suppression.
- Build: ✅ zero errors. GameSubjectAdventure chunk: 36.39KB (was 32.40KB).

## 2026-06-04 — Battle Feel Polish Pass (docs only)

- `docs/research/gameplay/pokemon-style-learning-battle.md` — Updated to align fully with `battle-feel-philosophy.md`. Removed: player HP bar, defeat screen, gentle defeat section, losing states, "every 3 wrong = counter attack" mechanic. Wrong answer philosophy changed: wrong → attack misses → soft fizzle → enemy laughs/taunts → continue (no punishment accumulation, no strike count, no anxiety). Move names reduced: icons + answers are primary; move names are tiny flavor text below icon (or hidden entirely). Move card examples updated to show icon + answer only. Battle log aligned to short format: "⚡ Thunder!", "โจมตีพลาด!", "คอมโบ!", "CRITICAL!", "ชนะแล้ว!". Open question 3 (player HP) resolved: removed. Audio: `gentle-defeat` tone removed; `enemy-taunt` added. Session structure: defeat condition removed, replaced with "child cannot lose" statement. Visual anatomy: player HP bar removed from diagram. Authority note added: Battle Feel Philosophy governs all conflicts.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section updated with all Battle Feel Polish decisions.
- `docs/TASKS.md` — Battle Feel Polish Pass task added and marked done.
- No code changes. No build.

## 2026-06-04 — Battle Feel Philosophy Design

- `docs/research/gameplay/battle-feel-philosophy.md` — NEW. Defines the sensory and emotional grammar for all Subject Battle implementations. Covers: core "battle is the experience" principle, visual hierarchy (enemy > HP > log > move panel), player HP removal rationale, wrong-answer philosophy (miss not punishment), full anticipation sequence (10-step tap-to-result chain), sound philosophy (cute/positive/Pokémon-like), combo system (streak 2→3→4 = crit ×1.5), victory sequence (enemy defeat → stars → confetti → egg celebrates), battle log spec (1-line, Thai-first), animation philosophy (fast/CSS/reuse existing keyframes), screen layout reference, implementation priority (feel before content), 5 open questions before implementation.
- `docs/RESEARCH_INDEX.md` — Battle Feel Philosophy entry added to Gameplay section.
- `docs/GPT_NOTES.md` — Battle Feel Philosophy section added with player HP decision and combo philosophy.
- `docs/TASKS.md` — Battle Feel design task added and marked done; PSLB-0 (feel baseline) inserted before PSLB-1.
- No code changes. No build.

## 2026-06-04 — Pokémon-Style Learning Battle Design

- `docs/research/gameplay/pokemon-style-learning-battle.md` — NEW. Full design document. Battle-first framing: answer choices ARE attack moves (not a quiz with battle decoration). Covers: move-select panel anatomy (`[icon] [name] ... [answer]`), subject encoding per subject (Math=numbers as damage, Thai/English=emoji+TTS), full battle flow (8 steps per turn), move name sets per subject, screen layout spec, animation list (14 keyframes), audio list (8 new tones), egg integration (child's egg is the hero), session structure (8 turns / 1 enemy), subject battle shell principle (one component, three content types), MVP recommendation (Math first → Thai → English → polish), scope check (passes Year 1 guardian), 5 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Gameplay section updated with pokemon-style-learning-battle.md entry.
- `docs/GPT_NOTES.md` — Pokémon-Style Learning Battle section added with key decisions and open questions.
- `docs/TASKS.md` — Design task marked done; PSLB implementation queue added (PSLB-1 through PSLB-5).
- No code changes. No build.

## 2026-06-04 — Egg Companion Adventure MVP

- `src/games/BattleMode.jsx` — EggCanvas replaces `🦸` player avatar. Egg jumps (`eggBounce`) + gold glow + `✨` sparkle float on correct answer. Egg shakes (`eggShake`) when enemy counter-attacks. Continuous `egg-near-hatch` pulse/glow at stage ≥ 5. Egg growth progress bar below battle log: stage name + progress bar + %. `item` sparkle tone fires 200ms after every correct answer.
- `src/games/DefenseMode.jsx` — EggCanvas replaces generic baby emoji. Egg bounces on shield-block; shakes when hit. Sparkle tone on correct.
- `src/games/ChaseMode.jsx` — EggCanvas replaces `🦸` runner. Egg dashes on correct. Sparkle tone on correct.
- `src/games/GameSubjectAdventure.jsx` — Passes `eggStats`, `eggProgress`, `readyToHatch` props from `useAppState()` to all 3 modes.
- `src/styles.css` — `egg-near-hatch` keyframe: combined scale + golden glow pulse (looping, for stage 5–6 eggs).
- Build ✅ zero errors.

## 2026-06-04 — Egg Companion Adventure Design

- `docs/research/gameplay/egg-companion-adventure.md` — NEW. Full design document. Covers: egg as emotional companion (not progress bar), companion framing across all modes (DefenseMode = egg being defended, BattleMode = egg beside player, ChaseMode = egg dashes with player), visual/audio/progress behavior spec, relationship data fields (adventuresWith/questionsAnswered/daysTogetherCount/favoriteSubject/bornFrom), MVP recommendation (DefenseMode egg first, then BattleMode, then relationship data), hatch biography payoff design, non-goals (no egg HP, no egg health from mistakes, no numbers during gameplay), 5 open questions for GPT.
- `docs/RESEARCH_INDEX.md` — Gameplay section added with egg-companion-adventure.md entry.
- `docs/GPT_NOTES.md` — Egg Companion Adventure Philosophy section added.
- `docs/TASKS.md` — Design task marked done; ECA implementation queue added (ECA-MVP-1 through ECA-5).
- No code changes. No build.

## 2026-06-04 — Subject Adventure Engine MVP

- `src/games/GameSubjectAdventure.jsx` — NEW. Orchestrator: generates 8 questions per session from existing content (genMathQ respects player level; genThaiQ from TH_ALPHA emoji→letter; genEngQ from EN_ALPHA emoji→letter). Picks mode deterministically: `MODES[(dayN + playCount) % 3]` so it rotates battle→chase→defense daily per subject. Dispatches ADD_XP, ROUND_COMPLETE, UPDATE_LEVEL_MASTERY, UNLOCK_LEVEL (≥80% score), LOG_SESSION. TTS via useEffect on cur change (speakTh for Thai, speakEn for English). Key-based replay (session key increments → full remount = fresh state + new mode).
- `src/games/BattleMode.jsx` — NEW. Subject-specific enemies (math: 🤖👻😈🐲, thai: 👺🐻🐉🐯, eng: 👾👽⛈️🦾). Enemy HP bar + player HP bar. Correct: adv-jump animation + enemy red flash + floating damage number. Crit at streak≥2: ×1.5 damage + confetti + streak-bounce badge. Wrong ×3: enemy counter-attack + player shake + HP damage. combo badge shown when streak≥3.
- `src/games/ChaseMode.jsx` — NEW. Horizontal distance track. Start at 30%, +14% per correct (×1.5 on crit), -10% per 3rd wrong. adv-dash animation on correct. Target emoji at right end, player 🦸 trails behind. Distance label updates. "dash" SFX on correct.
- `src/games/DefenseMode.jsx` — NEW. Baby creature (🥚/🐣/🌟 by subject) + shield with pip HP (one pip per question). Attacker → shield ← baby layout. Correct: adv-shield bounce + attacker pushed back + "block" SFX. Wrong ×3: shield pip lost + shake. Shield glows on block via filter.
- `src/games/GameScreen.jsx` — Lazy import + 3 routes for adventure-thai/adventure-math/adventure-eng, each passing subject prop.
- `src/components/Home.jsx` — "learn" recommendation routes to `adventure-{world}`. Label/icon updated per subject mode (Math→⚔️, Thai→🛡️, Eng→🏃). Classic games still accessible via "อยากเลือกเอง?" grid.
- `src/lib/audio.js` — `dash` tone (ascending 3-note sawtooth sweep, chase correct); `block` tone (low square thump, defense correct).
- `src/styles.css` — `adv-jump` (player leaps), `adv-dash` (player dashes forward), `adv-shield` (shield bounces on block).
- Build: ✅ zero errors. GameSubjectAdventure lazy chunk: 30KB.

## 2026-06-04 — Battle special move timing + accessibility

- `src/components/BattleScreen.jsx` — Special move prompt moved from pre-battle question phase to mid-battle surprise. Battle now starts immediately (`phase` initialised to `'fighting'`). Special prompt appears as a semi-transparent overlay after attack 2 or 3 (random), while the battle screen remains visible behind it. New question format: Math shows emoji counting (`🍎🍎` → tap 2), Thai/English uses TTS (`speakTh`/`speakEn`) with emoji choices (e.g. "ปลา" → 🐟/🐱/🐶). 🔊 replay button on Thai/English prompt. Correct → exciting special SFX fires immediately + `victory-bounce` "🔥 ท่าพิเศษพร้อมแล้ว!" feedback → special attack animates in battle; Wrong/Skip → gentle "💪 สู้ต่อไปนะ!" or no feedback, battle continues normally — no penalty. HP tracking changed from absolute (log snapshot) to relative (damage-delta) so special damage mid-battle is accurate without a second simulation. `TH_ALPHA`/`EN_ALPHA` imports removed; replaced with compact inline question sets (7 math, 6 Thai, 6 English). Build ✅.

## 2026-06-04 — Math Battle learning mode

- `src/games/GameMathBattle.jsx` — NEW. Battle-wrapped Math MVP. Dark purple (#1a1040) UI. 8 questions per battle against one of 4 cute enemies (🤖👻😈🐲, 64 HP each). Enemy selected randomly. Player's current math level auto-used (no level selector in battle mode). Correct answer → enemy attack flash + HP reduction + battle text. Streak ≥3 → Critical Hit (×1.5 dmg, streak SFX, confetti). Wrong → gentle enemy shake, up to 3 attempts, then reveal. No player HP — child-friendly, zero frustration punishment. All dispatches identical to GameMath: ADD_XP (same formula), ROUND_COMPLETE, UPDATE_LEVEL_MASTERY, UNLOCK_LEVEL, LOG_SESSION (world:'math'). Result screen shows HP drained + replay/home.
- `src/games/GameScreen.jsx` — Lazy-import for GameMathBattle; `mathbattle` added to WORLD_TITLES.
- `src/components/Home.jsx` — Continue Adventure Math recommendation: icon `⚔️`, label "Math Battle", sub "ตอบถูก = โจมตี! ⚡". Routes to `mathbattle` world. Subject grid Math card unchanged → still routes to normal `math`.
- Build: ✅ zero errors. Commit: f6e5b74.

## 2026-06-04 — Fix: rewards from Continue Adventure

- `src/context/StateContext.jsx` — Fixed race condition where `loadState()` async callback and the `SIGNED_IN` auth handler could dispatch `INIT` with stale Supabase data, silently reverting XP, items, and egg progress earned since app start. Fix: before dispatching `INIT`, compare `remote.rounds` against `stateRef.current.rounds` (the always-current ref already wired in the context). If local is ahead (user made progress before the async resolve or token refresh fired), keep local state and push it to Supabase instead. Guest mode and new-device/fresh-install paths unaffected.

## 2026-06-04 — Animation juice polish

- `src/styles.css` — 10 new `@keyframes` + utility classes: `pulse-float` (Continue Adventure gentle bob), `battle-glow-pulse` (purple glow ring for battle card), `shimmer-bright` (Surprise card), `slide-down-in` (subject grid open), `victory-bounce` (win/done emoji), `item-pop-in` (reward box), `streak-bounce` (Shop streak feedback), `hatch-glow` (creature reveal golden drop-shadow), `modal-pop` (creature detail card), `answer-correct-glow` (correct choice ring). `.catalog-item:hover` lift + shadow; `.choice-btn.correct` enhanced with dual animation. `@media(prefers-reduced-motion:reduce)` block disables all decorative animations.
- `src/components/Home.jsx` — adventure card gets `rec-card-float` (default) or `rec-card-battle` (challenger); Surprise card gets `rec-card-surprise`; subject grid gets `subjects-slide-in` on open.
- `src/components/BattleScreen.jsx` — win emoji: `victory-bounce`; reward box: `item-pop-in`; special-move correct feedback emoji: `victory-bounce`.
- `src/components/HatchOverlay.jsx` — creature emoji at done phase: `hatch-reveal-glow`.
- `src/games/GameShop.jsx` — done screen emoji: `victory-bounce`; streak feedback: `streak-win` (streak-bounce); `streak: true` flag added to streak feedback state.
- Build: ✅ zero errors. Commit: b5ff1a5.

## 2026-06-04 — Audio polish and louder phonics

- `src/lib/audio.js` — 9 new tones added to `playTone()`: `tap` (warm pop), `open` (2-note upward chirp), `unlock` (4-note ascending jingle), `item` (sparkle arpeggio), `eggReady` (3-note glowing pulse), `reveal` (5-note sweep + sine), `start` (energetic burst), `complete` (4-note mission jingle), `cardOpen` (2-note soft pop). Phonics GainNode boosted from 2.5 → 4.0.
- `src/components/Home.jsx` — `playTone('tap')` on Continue Adventure + Surprise Event tap. `playTone('open'/'click')` on subject grid toggle. `playTone('eggReady')` fires once when `state.readyToHatch` transitions true.
- `src/components/Collection.jsx` — `playTone('cardOpen')` on creature card tap; `playTone('click')` on popup close.
- `src/components/HatchOverlay.jsx` — `playTone('reveal')` + staggered `fanfare` (350ms) at creature reveal (`done` phase).
- `src/components/BattleScreen.jsx` — `playTone('item')` fires 950ms after win (reward popup timing). Added `playTone` import.
- `src/games/GameShop.jsx` — `playTone('complete')` at ≥80% pass (was silent); ≥90% keeps `fanfare`.
- `src/games/GamePhonics.jsx` / `GameMath.jsx` / `GameThai.jsx` — `playTone('unlock')` on level unlock; `playTone('complete')` on pass (80–89%).
- Build: ✅ zero errors. Commit: 78a6ddd.

## 2026-06-04 — Battle learning special move

- `src/components/BattleScreen.jsx` — New question phase before each battle. `pickBattleQuestion(sessionLog)` selects subject from most-played recent sessions (safest readiness signal); falls back to simple Math (1+1→4+4) when no data. Question UI: full-screen dark overlay, 4 large tap-target buttons, skip link. Correct answer → `specialDmgRef` = 25% of enemy HP; 900ms "🔥 ท่าพิเศษพร้อมแล้ว!" feedback; `setPhase('fighting')`. Wrong/skip → 700ms "💪 สู้ต่อไปนะ!" feedback; battle starts normally. Special attack plays at battle start: ⚡ text + new 5-note ascending 'special' SFX + hit flash + gold damage float. Enemy HP re-simulated from reduced starting value so win condition is correct. Also fixed ATK/DEF advice text mismatch (was: Thai→ATK, Math→DEF; now: Math→ATK, Thai→DEF to match calcCreatureStats formula).
- Build: ✅ zero errors.

## 2026-06-04 — Battle balance and sound

- `src/config/gameConfig.js` — All AI_OPPONENTS HP scaled ×4 (regular/miniboss) and ×3.5 (boss); all ATK scaled ×2.5. Battles now last 6–15 turns instead of 2–4.
- `src/components/BattleScreen.jsx` — Imported `getSoundOn`/`getACtx` from audio.js. `playBattleSound` now respects sound toggle and reuses shared AudioContext. Added `attack` sound type (sword-swing whoosh). Improved `hit` (3-layer impact), `crit` (4-tone ascending), `win` (6-note fanfare), `lose` (gentler 4-tone descent). `attack` sound fires when attack text is shown; `hit` fires on flash.
- Build: ✅ zero errors.

## 2026-06-04 — Battle Home experience

- `src/components/BottomNav.jsx` — ⚔️ badge removed from Collection tab. `hasChallenger` and `useAppState` import removed.
- `src/App.jsx` — `challengerOpen` state added; useEffect watches `state.pendingChallenger`; `<ChallengerOverlay open={challengerOpen} onClose=.../>` and `<Home onOpenChallenger=.../>` wired.
- `src/components/ChallengerOverlay.jsx` — internal `visible` useState and its useEffect removed; now accepts `open`/`onClose` props. All `setVisible(false)` replaced with `onClose()`.
- `src/components/Home.jsx` — `onOpenChallenger` prop added. Battle case in `getRecommendation()` (priority: hatch → battle → shop → subject). Battle card: dark gradient, challenger emoji, "มอนสเตอร์ปรากฏตัว!". `handleRecommendedAction` calls `onOpenChallenger()` for battle type.
- `docs/CURRENT_STATE.md` — Home 2.0 Adventure Director entry updated.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Shop Mission speech feedback

- `src/games/GameShop.jsx` — speech added after correct answers. Import: `speakTh, speakEn` from audio.js. `THAI_NUMS` array added (หนึ่ง–สิบ). After correct: Thai questions → `speakTh(val)` after 380ms; English → `speakEn(val)` after 380ms; Math/counting → `speakTh(THAI_NUMS[val])` after 380ms. Social phrase question speaks the child's actual choice (ขอบคุณครับ or ขอบคุณค่ะ). All tones preserved. Sound toggle respected.
- `docs/research/progression/gameplay-loop.md` — "Learning Feedback Principles" section added: visual/sound/speech pattern, implementation status per game, what to avoid.
- `docs/GPT_NOTES.md` — Learning Feedback Principles section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Home UI simplification

- `src/components/Home.jsx` — subject section made collapsible: "หรือเลือกเรียน" static label replaced with "อยากเลือกเอง?" toggle button (`subjectsOpen` useState, default false); subject cards hidden until toggled. Shop Mission permanent card removed from Home (Shop still reachable via Continue Adventure recommendation when shopV1.runs === 0). Visual hierarchy: Egg → Continue Adventure → "อยากเลือกเอง?" → Egg Run → Surprise.
- `docs/CURRENT_STATE.md` — Home 2.0 and Shop Mission entries updated to reflect new state.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- Build: ✅ zero errors.

## 2026-06-04 — Observation philosophy documentation

- `docs/research/observation/observation-philosophy.md` — created. Source-of-truth for observation philosophy: observe→understand→design loop, children are not their level (behavior > history), positive interpretation table, important signals (accuracy/replay/completion/consistency), signals that must not dominate (speed/streaks/rankings), Subject Readiness as observations not labels, parent report philosophy (no anxiety/grades/rankings), mission follows child (deterministic design iteration not AI), explicit non-goals (no AI tutoring/adaptive engines/manipulation/addiction optimization), system relationships, implementation reference, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Observation section added with entries for both observation-philosophy.md and play-observation-system.md.
- `docs/GPT_NOTES.md` — Observation Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Gameplay loop documentation

- `docs/research/progression/gameplay-loop.md` — created. Highest-level philosophy document for KidQuest. Covers: Home as Adventure Director (not a menu), core loop (learn→battle→learn), replay philosophy (healthy/full XP), surprise philosophy (rare=special, daily date-hash rotation), minigame philosophy (rewards not primary game), intrinsic motivation (curiosity/collection/surprise/progress/mastery), child autonomy (suggest not force), explicit non-goals (no daily chores/energy systems/FOMO/competition), system relationships (subordinate docs listed), 5 open questions.
- `docs/RESEARCH_INDEX.md` — gameplay-loop.md entry added, marked as highest-level philosophy.
- `docs/GPT_NOTES.md` — Gameplay Loop Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Battle progression documentation

- `docs/research/battle/battle-progression.md` — created. Source-of-truth for battle progression philosophy: core loop (Learn→Battle→Learn), battle as reward not primary game, creature philosophy (every creature usable), gentle enemy scaling, Challenger every 15 rounds, loss philosophy (no permanent penalties), reward design (supports learning), self-directed frequency, explicit non-goals (no PvP/leaderboards/pay-to-win/gacha/energy), future features (evolution/equipment/rarity/bosses), system relationships, known BattleScreen text bug, 5 open design questions.
- `docs/RESEARCH_INDEX.md` — battle-progression.md entry added to Battle section.
- `docs/GPT_NOTES.md` — Battle Progression Philosophy section added.
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Subject progression documentation

- `docs/research/progression/subject-progression.md` — created. Source-of-truth for subject progression philosophy: core philosophy (subjects primary, missions secondary), progression flow, unlock thresholds (70/80/90%), replay always valid with full XP, mastery = confidence not perfection, stretch/challenge optional bonus layers, subject independence, readiness vs. highest unlock level, explicit non-goals, future grade roadmap, implementation reference, 5 open questions.
- `docs/RESEARCH_INDEX.md` — Progression section added.
- `docs/GPT_NOTES.md` — Subject Progression Philosophy section added (thresholds, replay, mastery, independence, open questions for GPT).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Creature stats documentation

- `docs/research/battle/creature-stats.md` — created. Source-of-truth for creature stat design philosophy: why one-subject-one-stat fails, weighted formula with 40% base floor, example weightings (HP/ATK/DEF/SPD/CRIT), personality variation (±10% deterministic from XP seed), migration rules (recalc on 0/NaN, never delete eggs), explicit non-goals, future scaling notes, 5 open implementation questions.
- `docs/RESEARCH_INDEX.md` — Battle section added.
- `docs/GPT_NOTES.md` — Creature Stat Design Philosophy section added (key decisions + open questions for implementation).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Egg economy documentation

- `docs/research/rewards/egg-economy.md` — created. Source-of-truth for egg progression mechanics: core loop, design philosophy (first egg fast / no FOMO / no streak pressure), scaling formula (`min(800, 120+n×60)`), progression table, stage system, XP sources, migration rules, implementation reference, open questions, future considerations.
- `docs/RESEARCH_INDEX.md` — Rewards & Economy section added.
- `docs/GPT_NOTES.md` — Egg Economy Decisions section added (pacing formula, creature stat decisions, open question for GPT re: onboarding threshold).
- `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated.
- No code changes. No build.

## 2026-06-04 — Egg pacing + creature stat rebalance

### Part 1 — Egg progression pacing
- `src/context/StateContext.jsx` — `scaledEggProgress(state)` helper added (module-level). Computes `required = min(800, 120 + hatchedEggs.length * 60)`, divides into 7 stages dynamically, returns `{stage, stageXP, pct, xpPerStage, required}`. `ADD_XP` reducer: replaced static `newStage`-based `readyToHatch` with `newTotal >= hatchRequired` (dynamic). `derived` useMemo: `eggProgressData` now uses `scaledEggProgress()`; `eggStatsData.stage` overridden to scaled stage so `drawEgg()` visual matches progress display. `state.hatchedEggs` added to useMemo deps.
- `src/components/Home.jsx` — destructures `xpPerStage` from `eggProgressData`; egg XP label updated: shows "เกือบฟักแล้ว!" in stage 6 before ready, uses dynamic `xpPerStage` denominator instead of hardcoded 50.

### Part 2 — Creature battle stat rebalance
- `src/config/gameConfig.js` — `calcCreatureStats()` rewritten with weighted formula. Old: ATK=base×thaiShare (exclusive ownership — ATK=0 if no Thai XP). New: every stat has 40% base guarantee + 60% subject-weighted. HP: 1.5+0.3t+0.1m+0.1e; ATK: 0.4+0.3m+0.2e+0.1t; DEF: 0.4+0.3t+0.2m+0.1e; SPD: 0.4+0.3e+0.2m+0.1t. Deterministic ±5% personality variation from XP seed. Minimum possible any stat = base × 0.5 (Thai-only learner) — no more 0 stats.
- `src/lib/state.js` — `_migrateEggs()` updated: recalculates stats if any of ATK/DEF/SPD is 0 or NaN (covers pre-rebalance eggs with broken stats).
- Build: ✅ zero errors.

## 2026-06-04 — Shop feedback + hatch overlay fix

- `src/games/GameShop.jsx` — feedback improvements:
  - `wrongChoice` state added; `.wrong` CSS class (shake animation) applied to the wrong button on incorrect answer. Cleared on correct / next / replay.
  - `STREAK_MSGS` array added; when streak ≥ 3 feedback message uses fire messages instead of generic correct msg.
  - Streak counter in header styled amber bold at ≥ 3 (was muted/small).
  - Wrong feedback text changed from "ไม่ถูก ลองอีกครั้ง! 🤔" to "ลองอีกครั้ง! 💪"; reveal message now friendlier: `คำตอบที่ถูกคือ "${q.answer}" 😊`.
  - All existing `playTone` calls unchanged.
- `src/components/HatchOverlay.jsx` — two bug fixes:
  - **Freeze fix**: `setPhase('tapping')` called as first line of `handleClose()`. After dispatch+navigate, `isOpen` is `false` and `phase` is `'tapping'` → condition `!isOpen && phase === 'tapping'` is true → overlay unmounts cleanly. No more frozen screen requiring refresh.
  - **Mid-game interruption fix**: `suppressAutoOpen` prop (default false). When `true`, `isOpen` ignores `readyToHatch && !hatched` auto-trigger. Only explicit `state.hatching` (user-initiated) can open overlay.
- `src/App.jsx` — passes `suppressAutoOpen={screen === 'game'}` to `HatchOverlay`. During gameplay, hatch overlay won't auto-interrupt. After returning to home, `readyToHatch` is still true → overlay appears normally.
- Build: ✅ zero errors.

## 2026-06-04 — Home 2.0: Adventure Director + NaN bug fixes

- `src/components/Home.jsx` — rewritten as Adventure Director.
  - **`⭐ ผจญภัยต่อ`** section: single large recommended card above the world grid. Deterministic priority: (1) hatch if egg ready, (2) Shop if never played, (3) weakest subject by XP. No AI, no state.
  - **`🎁 เซอร์ไพรส์วันนี้`** section: replaces the 2×2 minigame grid. One unlocked minigame shown per day (date-hash mod count of unlocked games). After playing, shows "เล่นแล้ว! มาพรุ่งนี้นะ 🌙" (derived from `sessionLog`, no new state). If no minigames unlocked yet, shows a teaser card.
  - World-label text changed to "หรือเลือกเรียน" (secondary framing).
  - `getRecommendation()` and `getSurpriseEvent()` helper functions added (module-level, no hooks).
- `src/components/Report.jsx` — **NaN bug fixes** in `MissionAnalytics`:
  - `totalHints = 0`, `totalDuration = 0` default values added to destructuring (handles pre-Phase-D state with no analytics fields).
  - `avgScore` now returns `null` when `totalQs === 0` (renders as `—` not `0%`).
  - `avgDur` now returns `null` when `totalDuration === 0` (renders as `—` not `NaN`).
  - `nudge` guard updated: `avgScore !== null && avgScore >= 90`.
- Build: ✅ zero errors.

## 2026-06-04 — Subject Readiness Report display

- `src/components/Report.jsx` — `computeReadiness(sessionLog, world)` added: filters last 10 `sessionLog` entries per world, derives one of 4 states (strong / comfortable / exploring / notready) from avgScore + goodRuns + completionRate thresholds. `SubjectReadiness` component renders a card with color-coded Thai-language badges for ภาษาไทย / คณิต / อังกฤษ. Observation footnote: "ดูจากการเล่นล่าสุด ไม่ใช่เลเวลที่ปลดล็อก". No new state fields.
- Build: ✅ zero errors.

## 2026-06-03 — Subject Readiness Design (docs only)

- `docs/research/observation/play-observation-system.md` — **Subject Readiness** section added: 4 readiness states (Strong / Comfortable / Exploring / Not Ready), derivation logic (last 10 sessions, avgScore ≥ 0.85 + goodRuns ≥ 3 + completionRate ≥ 0.80 for Strong; avgScore ≥ 0.70 + goodRuns ≥ 2 for Comfortable; else Exploring; no sessions = Not Ready), explicit non-goals (no AI, no gate, no child UI, no level tree), phase status section updated to mark Phase D shipped and describe Phase D+ scope.
- `docs/research/observation/play-observation-system.md` — Peer Comparison section updated: marked as ✅ done (replaced in Phase D).
- `docs/research/missions/mission-system.md` — **Subject Readiness and Mission Design** section added: explains why highest unlocked level is unreliable, defines mission content weighting from readiness profile, example profiles (Thai Strong / Math Comfortable / English Exploring → Thai 60% / Math 30% / English 10%), when to apply per mission phase, core principle "Mission should follow the child."
- `docs/GPT_NOTES.md` — Subject Readiness Decisions section added: 9 decisions covering derivation, mission weighting, Shop Stretch independence, Cooking Mission dependency, implementation timing.
- `docs/TASKS.md` — Phase D+ Subject Readiness documentation marked done; Cooking Mission task updated with readiness dependency warning; Subject Readiness Report display added as deferred task.
- No app code changed.

## 2026-06-03 — Phase D: Play Observation System

- `src/lib/state.js` — `sessionLog: []` added to `defaultState()`; `shopV1` extended with `totalHints: 0`, `totalDuration: 0`, `phaseStats: { 1–4 }`.
- `src/context/StateContext.jsx` — `LOG_SESSION` action + reducer (appends to ring buffer, computes `replayedImmediately`); `UPDATE_SHOP_V1` extended to accumulate `hints`, `dur`, `phaseStats` per run.
- `src/games/GameShop.jsx` — `sessionStart` + `perQCorrect` refs added; per-question correctness tracked; `LOG_SESSION` + extended `UPDATE_SHOP_V1` payload dispatched on done screen; `replay()` resets refs.
- `src/games/GameThai.jsx` — `useFinishRound` extended with `sessionStartRef` param; dispatches `LOG_SESSION` after each subject round; `sessionStart` refs added to ThaiMatchGame, ThaiSpellGame, ThaiWordOrderGame with reset on replay.
- `src/games/GameMath.jsx` — `sessionStart` ref added to `MathLevelGame`; `LOG_SESSION` dispatched in `next()` when done; replay resets ref.
- `src/games/GamePhonics.jsx` — `useRef` import added; `sessionStart` refs added to all 4 game components (PhonicsGame, CVCGame, SightGame, SentenceGame); `LOG_SESSION` dispatched in each `next()` when done; replay resets refs.
- `src/components/Report.jsx` — `MissionAnalytics` component added (runs, avg score, avg duration, hints, phase difficulty table, replay framing, deterministic nudge); peer-comparison card replaced with play-history timeline (last 10 sessions).
- Build: ✅ zero errors.

## 2026-06-03 — Workflow Audit + Architecture Language Patch (docs only)

- `docs/GPT_NOTES.md` — fixed two present-tense statements that implied `MissionScreen.jsx` + `missionConfig.js` are current architecture. Both are future targets (after 2+ missions). Current routing clarified: Home → `GameScreen.jsx` → `GameShop.jsx` (world `'shop'`).
- `docs/research/missions/mission-system.md` — Mission Access Points navigation section updated: current implementation (GameShop.jsx) vs. future target (MissionScreen.jsx) now clearly separated.
- `docs/TASKS.md` — Phase C app code commit added as critical Now task. Development workflow documented (build → commit → push → verify).
- `docs/GPT_HANDOFF.md` — session updated; Phase C uncommitted code flagged as risk; workflow gap noted.
- **Critical finding**: Phase C app code (`GameShop.jsx`, `Home.jsx`, `StateContext.jsx`, `GameScreen.jsx`, `state.js`) is uncommitted. Production is on Phase 3. Must commit + push before play testing.
- No app code changed this session.

## 2026-06-03 — Phase D Wording Patch: Observation Language + Engagement Signals (docs only)

- `docs/research/observation/play-observation-system.md` — final wording improvements before implementation: `passed` → `completed`; `hardestPhase` → `challengePhase`; "most difficult phase" → "current challenge area"; `replayedImmediately` and `nextAction` added to session entry schema; new **Engagement Signals** section (explains why engagement signals outweigh scores, documents `replayedImmediately`, `nextAction`, replay count, and session duration); nudge rule updated to `runs === 1 && completed`; nudge condition updated to `challengePhaseAcc`; "pass/fail icon" in play history renamed to "completed/not completed".
- `docs/GPT_NOTES.md` — terminology decisions section added; engagement signal rationale recorded; D0 noted in Phase D scope.
- `docs/TASKS.md` — D0 (Shop card UX audit) added before D1 in Phase D list.
- No app code changed.

## 2026-06-03 — Phase D Design: Play Observation System (docs only)

- `docs/research/observation/play-observation-system.md` — NEW: full design spec for lightweight passive play observation system. Covers: session log ring buffer (last 50 entries), `shopV1` state extensions (`totalHints`, `totalDuration`, `phaseStats`), new `LOG_SESSION` reducer action, parent report Mission Analytics card design, deterministic nudge rules, replay framing principles, explicit non-goals (no AI, no peer comparison, no child-facing UI).
- `docs/GPT_NOTES.md` — Play Observation System decisions added (nudge rules, ring buffer cap, no-speed-gate, peer-comparison card replacement).
- `docs/TASKS.md` — Phase D (D1–D4) and Phase E tasks structured under Next.
- `docs/GPT_HANDOFF.md` — Updated: latest session, active tasks, recommended next GPT work.
- No app code changed.

## 2026-06-03 — Phase D Prep: Shop Mission Terminology Sync (docs only)

- `docs/research/missions/shop-mission.md` — "4 steps" → "4 phases / 6 questions"; steps renamed to phases; Phase 1 annotated ×3, phases 2–4 annotated ×1; "Why 4 Core Steps" section retitled and updated.
- `docs/research/missions/mission-system.md` — example step list replaced with actual 4-phase/6-question breakdown.
- `docs/CURRENT_STATE.md`, `docs/GPT_HANDOFF.md`, `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md` — all updated to use "4 phases / 6 questions" terminology consistently.
- No app code changed.

## 2026-06-03 — Phase C: Shop Mission MVP

- `src/games/GameShop.jsx` — NEW: 4 phases / 6 questions (Phase 1: Thai matching ×3, Phase 2: English vocab ×1, Phase 3: counting ×1, Phase 4: social phrase ×1). 4 choices per question. Accepts both ขอบคุณครับ/ค่ะ for social phrase. XP dispatched per subject. Done screen with pass/fail at 80% threshold.
- `src/lib/state.js` — `shopV1: { bestScore, runs, mastered, stretchUnlocked }` added to `defaultState()`.
- `src/context/StateContext.jsx` — `UPDATE_SHOP_V1` action + reducer case: tracks bestScore, runs, mastered (≥90% + ≤1 wrong + ≥2 runs). stretchUnlocked always false for MVP.
- `src/games/GameScreen.jsx` — lazy-imports `GameShop`, adds `shop` world to `WORLD_TITLES`.
- `src/components/Home.jsx` — Missions section added above Egg Run. Shop card shows best score and run count after first play. Always unlocked.

## 2026-06-03 — Phase B+ Mastery-Gate Patch: mastery signal tightened, Stretch content confirmed
- `mission-system.md`: Mastery signal simplified to 3 hard criteria — accuracy ≥ 90%, ≤ 1 wrong, ≥ 2 runs. Removed "hint dependency" from hard criteria (not tracked yet; can be added later). Speed re-clarified as optional context only, never a gate.
- `shop-mission.md`: Shop Stretch section updated with explicit unlock trigger listing the 3 criteria. "Why 4 steps" section rewritten — quantity difference and price concept named as Stretch, Core MVP steps stated inline.
- `GPT_NOTES.md`: Product Decisions — mastery signal now 3 explicit criteria; Shop Core/Stretch split named explicitly.
- `TASKS.md`: Mastery signal note updated — speed NOT required.
- No app code changed.

## 2026-06-03 — Phase B Review Patch: Mission MVP scope tightened
- `shop-mission.md`: MVP reduced 6 → 4 steps. Price/money and quantity-difference steps moved to Later Expansion (Early Grade 1 stretch) — not deleted.
- `mission-system.md`: Unlock threshold 70% → 80% (aligned with subject levels; 70% guessable on 4 questions). Engine philosophy updated: start with `GameShop.jsx`, delay generic `MissionScreen.jsx` until pattern validated.
- `GPT_NOTES.md`: Architecture suggestions updated to staged approach; threshold and step count corrected.
- `TASKS.md`: Now task updated — 4-step MVP, GameShop.jsx first, no missionConfig/MissionScreen yet.
- No app code changed.

## 2026-06-03 — Mission System Design Review & Patch
- Confirmed existing mission docs (README, mission-system, shop, cooking, garden) are complete.
- Added "Explicit Non-Goals" section to `mission-system.md`: no payment, no multiplayer, no social features, no Grade 2+, no AI tutor, no unique mini-games.
- No other changes needed — TASKS, GPT_NOTES, RESEARCH_INDEX already up to date.

## 2026-06-03 — Mission System Design (documentation only)
- Created `docs/research/missions/` with 5 files: README, mission-system, shop-mission, cooking-mission, garden-mission.
- Mission system: 3 types (Progression/Review/Challenge), reuses all existing mechanics, data-driven via `missionConfig.js`, thin `MissionScreen.jsx` wrapper.
- Shop mission MVP: 6 steps, Kindergarten core + Grade 1 stretch, integrates Thai/Math/English/GK. Full data structure specified.
- Cooking and garden missions: design only — not for implementation until shop is confirmed working.
- Updated `GPT_NOTES.md`, `TASKS.md`, `RESEARCH_INDEX.md`, `SESSION_SUMMARY.md`.
- No app code changed.

## 2026-06-03 — Vision + Scope Documentation
- Created `PROJECT.md` — one-page project brief (what, who, golden rule, success metric).
- Created `VISION.md` — full design philosophy: golden rule, mastery progression, Year 1 scope, stable engine, content strategy, replay philosophy, non-goals, scope guardian mandate.
- Created `GOALS.md` — Year 1 goals, non-goals, long-term goals, definition of done.
- Created `docs/README.md` — navigation index for all docs by audience role.
- Updated `docs/DECISIONS.md` — added mastery-based progression, Golden Rule, replay philosophy, scope guardian decisions under Product and AI sections.
- Updated `CLAUDE.md` — scope guardian check added to Before Coding section.
- Updated `docs/ARCHITECTURE.md` — stable engine note replaces stale React migration note.
- Updated `SPEC.md` — deprecated header updated to canonical format.
- Updated `docs/GPT_HANDOFF.md` — vision section added; recommended next work updated to Year 1 scope.

## 2026-06-03 — Phase 3: AI_OPPONENTS Tiers 2–5
- `gameConfig.js`: Added tiers 2–5 to `AI_OPPONENTS`. Stats scale ~1.5× per tier. Sonic villain theme continues:
  - T2 ป.3-4: Coconuts/Octus/Rexon → Egg Robo → Dr. Eggman III
  - T3 ป.5-6: Rhino-Bot/Slicer/Jawz → Heavy Gunner → Dr. Eggman IV
  - T4 ม.ต้น: GUN Mech/E-101 Beta/Dark Chao → Egg Emperor → Dr. Eggman V
  - T5 ม.ปลาย: Metal Sonic/Shadow Android/Silver Gladiator → Mephiles → PERFECT CHAOS
- `StateContext.jsx`: Fixed challenger grade→tier mapping (`Math.min(grade,1)` → proper mapping: 0→0, 1-2→1, 3-4→2, 5-6→3).

## 2026-06-03 — Phase 2 UX (Sound Persist + XP Boost Indicator)
- **Sound persistence**: `App.jsx` initializes `soundOn` from `localStorage.getItem('kq_sound')`; all toggle callbacks write `kq_sound` on change. Device-local key, separate from `kq_state` blob.
- **XP boost badge**: new `XpBoostBadge` component in `Home.jsx` — shows amber `⭐ ×2 M:SS` countdown in header when `xpBoostEnd > now` and `xpBoost > 1`; hides automatically when boost expires; 1-second interval via `useRef`.

## 2026-06-03 — Phase 1 UX Readiness
- **Replaced `alert()`** in `Home.jsx` with `showToast()` calls — EggRun lock and no-lives both show friendly toast messages; minigame dead-guard removed.
- **New `ProfileModal.jsx`**: name input + grade grid (อนุบาล–ป.6); saves via `SET_PROFILE` action; persisted to localStorage + Supabase automatically.
- **Profile button** (👤 + child name) added to Home header — always visible, opens ProfileModal.
- **`SET_PROFILE` action** added to `StateContext.jsx` + reducer case.
- `App.jsx`: ProfileModal mounted alongside LoginModal; `onOpenProfile` prop wired to Home.

## 2026-06-03 — Docs Sync (Current State Audit)
- `CURRENT_STATE.md` updated: Math level count corrected (6 → 9), visual models added, tier system detailed, minigame unlock conditions expanded, Vercel/phonics audio noted accurately.
- `TASKS.md` restructured: consolidated Done list, added visual models + tiers + AI_OPPONENTS entries, removed duplicate items, added Math L9+ and English L5+ to Later.
- `GPT_HANDOFF.md` regenerated to reflect latest codebase state.
- No app code changed.

## 2026-06-03 — Math Visual Models for L1–L4
- `gameConfig.js`: added `visualModel` field to math levels 1–4 (`objects`, `objects`, `tenFrame`, `crossOut`).
- `GameMath.jsx`: `genQ` numeric branch now attaches `visualModel`, `emojiA`, `emojiB` to question object.
- New `VisualModel` component with 4 modes:
  - `objects`: real emoji grid (emojiA×a + emojiB×b) with `+` separator; smaller font when total > 10.
  - `tenFrame`: 2×5 or 4×5 coloured grid (amber=a, blue=b, grey=empty); fallback dots if total > 20.
  - `crossOut`: emoji grid with ❌ overlay on the last `b` items (subtraction visualisation).
  - `null` (L5+): unchanged coloured 🟡/🔵 dots.

## 2026-06-03 — Math Content Expansion + New Question Types
- `MATH_WORDS` expanded from 16 → 30: added joining, taking-away, and 10 comparison problems (`comparison:true`).
- `PATTERN_SETS` added to `gameConfig.js` (5 AB emoji pairs; ABC reserved for L9).
- `LEVELS.math` expanded: Level 0 (Foundation/count), Level 7 (เปรียบเทียบ), Level 8 (รูปแบบ AB).
- `TEACH_CONTENT.math` entries added for keys 0, 7, 8.
- `GameMath.jsx`: new `count` and `pattern` question types; foundation mode (grade-0 only, no timer); maxLevels `6→8`; amber hint highlight for patterns at attempt 1.
- `LevelSelector.jsx`: optional `levelsOverride` prop added.
- `StateContext.jsx`: `FOUNDATION_COMPLETE` action added.
- `state.js`: `foundationComplete: false` added to `defaultState()`.

## 2026-06-03 — SPEC.md Formally Deprecated (Session 6)
- Added deprecation header to `SPEC.md` with documentation precedence order.
- Updated `DECISIONS.md` — SPEC.md deprecated note under Architecture Decisions.
- Updated `AI_SYSTEMS.md` — SPEC.md historical-only note added.
- Risk of conflicting documentation between old prototype and current React app eliminated.
- No app code changed.

## 2026-06-03 — Research System + Review Workflow (Session 5)
- Created `docs/research/` with 7 subject subfolders (thai, math, english, logic, life, curriculum, competitors).
- Created `docs/POST_REVIEW.md` — Claude Chatbot post-implementation review.
- Created `docs/RESEARCH_INDEX.md` — index of all research documents.
- Updated `AI_SYSTEMS.md` — post-review flow and research/ added.
- Updated `CLAUDE.md` — POST_REVIEW.md added to after-coding checklist.
- No app code changed.

## 2026-06-03 — AI System Overview (Session 4)
- Created `docs/AI_SYSTEMS.md` — defines 3-AI collaboration model (GPT / Claude Chatbot / Claude Code).
- Updated `CLAUDE.md`, `DECISIONS.md`, `GPT_HANDOFF.md` to reference the system.
- No app code changed.

## 2026-06-03 — Auto Sync Upgrade (Session 3)
- Created `docs/GPT_NOTES.md` — shared memory for GPT → Claude knowledge transfer.
- Created `docs/GPT_HANDOFF.md` — single-file Claude → GPT handoff, regenerated each session.
- Updated `CLAUDE.md` — added GPT_NOTES/GPT_HANDOFF to pre/post-session workflow.
- Restructured `TASKS.md` to Now / Next / Later / Done format.
- Added AI Sync section to `DECISIONS.md`.
- No app code changed.

## 2026-06-03 — Docs Verified + Trimmed (Session 2)
- Verified all docs against real codebase; no feature inaccuracies found.
- Fixed stale `gameConfig.js` line count (354 → 346) in PROJECT_MAP and CODEBASE_SUMMARY.
- Trimmed all docs to meet token limits (CURRENT_STATE ≤120, PROJECT_MAP ≤120, CODEBASE_SUMMARY ≤150, SESSION_SUMMARY ≤30).
- TASKS.md: moved Session 1 doc task to Done; condensed Done list.

## 2026-06-03 — Project Memory System Initialized
- Project memory / documentation system created (`docs/` folder).
- Existing project state documented from codebase inspection.

## 2026-06-03 — Bug Fixes & UI Consistency
- **Fix**: English `SightGame` (Level 3) was missing `UNLOCK_LEVEL` dispatch — completing Level 3 with ≥80% never unlocked Level 4. Fixed.
- **Fix**: English `CVCGame` (Level 2) was missing `spawnConfetti(15)` on level unlock. Fixed.
- **Add**: `GameHeader` (progress bar + streak display) added to all 4 English Phonics game modes (was missing; Thai already had it).
- **Add**: "Play Again" button added to GameMath result screen (only had "← Level อื่น" before).
- **Add**: Fanfare + confetti on 90%+ score added consistently to all Math and English levels.
- **Remove**: Dead code — `TH_L4` fill-in-blank data removed from `gameConfig.js` (was orphaned after Thai Level 5 changed to word-order game).

## 2026-06-03 — Content Expansion (All Subjects)
- Thai `SPELL_L1`: 12 → 24 words (สระ อา/อิ/อู/เ/โ).
- Thai `TH_L2` (animals): 12 → 20 words.
- Thai `TH_L3` (3-syllable): 8 → 14 words.
- Thai `TH_L5`: NEW word-order game data (9 sentences). Level 5 changed from fill-in-blank → `ThaiWordOrderGame`.
- Thai Level 4 renamed to "คำ 3 พยางค์".
- Hint system added to `ThaiSpellGame`: after 1 mistake → amber pulse on next correct tile.
- Shared `ResultScreen` + `GameHeader` + `useFinishRound` hook in `GameThai.jsx`.
- Math `MATH_WORDS`: 8 → 16 word problems.
- English `CVC_WORDS`: 10 → 24 words with sound-alike distractors.
- English `SIGHT_DATA`: 8 → 16 fill-in-blank sentences.
- English `ENG_SENTS`: 8 → 12 word-ordering sentences.

## 2026-06-03 — Hosting Migration
- Migrated from Netlify to Vercel. Added `vercel.json`.

## 2026-06-03 — Audio Optimization
- Moved phonics audio from base64 embedded in JS bundle → static `.m4a` files in `public/sounds/phonics/`.

## Earlier — Challenger System + Battle Animation
- Added Pokémon-style battle animation (`BattleScreen.jsx`).
- Added Challenger system: every 15 battle rounds → random AI opponent (`AI_OPPONENTS` config).
- Added `ChallengerOverlay.jsx` for full-screen challenger announcement.

## Earlier — Battle System + Egg Migration
- Added turn-based battle system with HP/ATK/DEF/SPD/CRIT stats.
- Added egg migration (`_migrateEggs`) to backfill `tier` and `stats` fields on old hatched eggs.

## Earlier — Tier System + Creature Stats + AI Opponents
- Added `TIERS` config (0=อนุบาล through 5=ม.ปลาย).
- Added `calcCreatureStats()` for derived battle stats.
- Added `AI_OPPONENTS` config for tier 0 and tier 1.

## Earlier — React Migration
- Migrated from single-file HTML prototype (~600KB) to React 18 + Vite.
- Supabase auth and state sync implemented.
- All game screens, minigames, and UI rebuilt as React components.
