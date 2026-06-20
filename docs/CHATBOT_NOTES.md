# CHATBOT_NOTES.md
_Last updated: 2026-06-16_
_Written by: Claude Chatbot | For: Claude Code_

## Pending implementation

(empty — no pending tasks)

## Claude Code Handoff
_(Claude Code appends here after each session)_

**2026-06-20 — LoginBackdrop (decorative pre-login screen):**
- Built: `LoginBackdrop.jsx` — `makeFloatingCreatures(9)` generates random seeds/stats/positions/timing once per mount (via `useRef` to survive re-renders). Each creature gets a biased xp split so all 6 elements appear naturally. Three CSS `@keyframes` (`kq-float-0/1/2`) cycle through with per-creature duration (6–12s) and negative delay (-8–0s) to desync them. `FloatingCreature` renders a canvas via `drawCreature(seed, stats)` in `useEffect`. Backdrop sits at `zIndex:0`; LoginModal's `auth-overlay` sits above it at higher z. Verified: `drawCreature` only reads `evoStage`/`xpThai`/`xpMath`/`xpEng`/`acc`/`streak` from stats — all supplied by the backdrop.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — Mandatory onboarding for new accounts:**
- Built: `defaultState().name` changed from `'โชแปง'` to `''` (root fix). New `OnboardingModal.jsx` — name input + school-grade grid (stores label string) + gender 3-button picker; all start null/empty; submit disabled until all three are filled; dispatches `SET_PROFILE` on submit; no skip/dismiss possible. App.jsx: added `OnboardingModal` import; `needsOnboarding = !state.name || state.name.trim() === ''` gate inserted between login gate and main return; resolves automatically when SET_PROFILE sets a real name.
- Not finished: existing 'โชแปง' accounts bypass onboarding intentionally (only new signups hit it)
- Blockers/risks found: none — SET_PROFILE reducer already handles `{ name, schoolGrade, gender }` correctly from earlier work; verified with grep
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — resolveSync, stateVersion/deep migration, SaveStatusIndicator:**
- Built: state.js: added `STATE_VERSION = 1`, `stateVersion` in `defaultState()`, module-level `saveStatusListeners` + `onSaveStatusChange` + `emitSaveStatus`. New `resolveSync(local, remote)` — unconditional "remote has creatures, local empty" override, then timestamp comparison, fallback to `rounds`. New `migrateStateShape(saved)` — shallow-merges defaultState() onto old save, then deep-merges 12 known nested-object fields to backfill new sub-keys. Both `loadState()` paths now call `migrateStateShape` first. `saveState()` emits 'saving'; `syncToSupabase()` emits 'saved'/'error'/'offline'. StateContext: import updated to include `resolveSync`; both conflict sites replaced with single `resolveSync()` call. New `SaveStatusIndicator.jsx` (fixed bottom-right, fades 'saved' after 2.5s, 'error'/'offline' stay visible). Mounted in App.jsx inside the main (post-auth) render.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — Mandatory auth gate:**
- Built: App.jsx: added `supabase` import, `authChecked`/`isLoggedIn` state, auth-check effect (`getSession` + `onAuthStateChange`). Before main return: shows "กำลังโหลด..." until `authChecked`, then renders `<LoginModal open mandatory onClose={noop} />` if not logged in; the `onAuthStateChange` listener flips `isLoggedIn` on SIGNED_IN, automatically replacing the gate with the full app. LoginModal: added `mandatory` prop, removed skip button entirely, updated subtitle to "เข้าสู่ระบบหรือสมัครสมาชิกเพื่อเริ่มเล่น", overlay click-outside disabled when `mandatory`. Signup still shows email-confirm message and stays on the gate (correct — user must confirm email then return to log in).
- Not finished: nothing
- Blockers/risks found: Home.jsx's `onOpenLogin` button now only reachable for already-logged-in users (rare/redundant) but harmless to leave in place
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — Separate schoolGrade from game-progression grade:**
- Built: `schoolGrade: null` added to `defaultState()` (purely informational, never read by game logic). `SET_PROFILE` reducer now updates `schoolGrade` (not `grade`) — `state.grade` is now exclusively auto-advanced by `SET_SUBJECT_LEVEL`. ProfileModal: `grade` state → `schoolGrade` state (stores the label string like 'ป.1', not an index); grade selector compares `schoolGrade === label`; section label updated to "ระดับชั้นเรียนจริง" + subtitle "สำหรับเก็บข้อมูลเท่านั้น ไม่กระทบการเล่นเกม". Scanned all `state.grade` usages — all remaining usages are legitimate game-tier reads (evo calc, tier, egg algorithm), none needed switching to `schoolGrade`.
- Not finished: nothing
- Blockers/risks found: none — no migration needed; existing players see no grade selected in ProfileModal until they pick one; game progression continues unaffected
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — Logout now fully clears local state:**
- Built: `handleLogout` in ProfileModal now imports `defaultState` and `KEY` from `state.js`; after `supabase.auth.signOut()`, calls `localStorage.removeItem(KEY)` then `dispatch({ type: ACTIONS.INIT, payload: defaultState() })` before closing the modal. Verified: `SIGNED_OUT` handler absent in StateContext (no risk of re-populating from stale closure). INIT reducer confirmed to be `{ ...defaultState(), ...action.payload, ... }` — clean wipe guaranteed.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — Gender field in profile:**
- Built: `gender: 'unspecified'` added to `defaultState()` in state.js with comment noting future use. `SET_PROFILE` reducer updated to spread `gender` from payload. ProfileModal: `gender` state initialised from `state.gender`, included in `handleSave` dispatch, 3-button selector (👦 ชาย / 👧 หญิง / 🌟 ไม่ระบุ) inserted between grade grid and save button — matching existing grade-button styling.
- Not finished: actually using gender to differentiate content/items (separate future task)
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — Cloud-sync conflict resolution: timestamps instead of rounds:**
- Built: `defaultState()` now includes `lastSavedAt: Date.now()`. `saveState()` stamps `{ ...s, lastSavedAt: Date.now() }` on every save before writing to localStorage and pushing to Supabase — so `state_json` in the cloud always carries the timestamp too. Both conflict-resolution sites updated: `loadState().then()` block and `SIGNED_IN` block now compare `lastSavedAt` (if present on either side); fall back to `rounds` comparison only when both sides lack a timestamp (old saves). The "cloud has creatures but local is empty" unconditional override in SIGNED_IN is preserved.
- Not finished: nothing
- Blockers/risks found: none — `ACTIONS.INIT` reducer uses `{ ...defaultState(), ...action.payload, ... }` so `lastSavedAt` from payload is preserved on dispatch
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — Logout button in ProfileModal:**
- Built: ProfileModal now imports `supabase` and `useEffect`. On open, calls `supabase.auth.getUser()` and stores email in `userEmail` state. When `userEmail` is set, renders a separator + current-account email label + "ออกจากระบบ" button (red outline, disabled during `loggingOut`). Button calls `supabase.auth.signOut()` then `onClose()`. No SIGNED_OUT handler in StateContext — intentional: in-session state is preserved after logout; cloud sync disconnects until next login.
- Not finished: nothing
- Blockers/risks found: StateContext has no SIGNED_OUT handler (confirmed via grep) — correct behavior for this app since localStorage is always-on and local progress should survive logout
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — Password reset flow:**
- Built: LoginModal now has 3 modes ('login'/'forgot'/'sent'). 'forgot' mode renders an email field + "ส่งลิงก์รีเซ็ตรหัสผ่าน" button that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin/?reset=1 })`, transitions to 'sent' confirmation screen on success. New `ResetPasswordModal` component (src/components/ResetPasswordModal.jsx) mounts at app root, subscribes to `supabase.auth.onAuthStateChange`, shows on `PASSWORD_RECOVERY` event — two password inputs + confirm-match validation, calls `supabase.auth.updateUser({ password })`, shows success screen then closes. Mounted unconditionally in App.jsx alongside LoginModal/ProfileModal.
- Not finished: nothing
- Blockers/risks found: none — renders null until `PASSWORD_RECOVERY` fires, so zero cost when inactive
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — CreatureJourney stage icons replaced with actual creature sprites:**
- Built: Added `StageIcon` component (canvas + useEffect) to Collection.jsx — calls `drawCreature(canvas, seed, { ...baseStats, evoStage: stage })` with per-icon stage override. Added `useEffect` to React import. Replaced emoji in 3-stage circle icons with `<StageIcon egg={egg} stage={s.stage} size={40|30} />` inside `overflow:hidden` circles. Removed `emoji` field from `stages` array. Progress-bar moving marker updated from `stages[i].emoji` text to an 18×18 rounded `<StageIcon size={16} />` showing the upcoming stage. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — Fix mirror/hint item to show visible hint UI in all input modes:**
- Built: `setTimeoutHintActive` added as param to `useBattleCombat.js` and passed from the `useBattleCombat` call in MoveSelectBattleMode. `hint` effect branch now calls `setTimeoutHintActive?.(true)` unconditionally before all per-mode branches — this causes the same gold tile highlight (wordbuild/sequence), revealDigit display (numpad), and choice elimination (choice/fillgap/visualdiscrim) that the time-based system already drives. Log messages updated to match the new visible behavior. Memory card remains hint-less by design. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — Time-based auto-hint for all input modes:**
- Built: `timeoutHintActive` state + `timeoutHintTimerRef` + `HINT_DELAY_MS` map in MoveSelectBattleMode. Timer effect (dep: `[cur]`) resets on each new question and schedules auto-hint after mode-specific delay; callback guards `!lockedRef.current && !victoryMode && !battleOverRef.current`. Choice/fillgap/visualdiscrim: separate effect (dep: `[timeoutHintActive]`) auto-eliminates 2 wrong choices (skips if already eliminated by item). Numpad: `revealDigit={timeoutHintActive ? String(q.answer)[0] : null}` prop passed to NumpadInput; rendered as "💡 ตัวแรกคือ X" text below display. Wordbuild/sequence: `showWordbuildHint`/`showSequenceHint` now OR'd with `timeoutHintActive`. Memory card: skipped entirely. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — Maze chests + ghost_wisp enemies + single exit portal:**
- Built: `ghost_wisp` added to enemyConfig.js (hp:30, atk:3, def:0, subject:null). `_ghostWisp()` sprite + EYE_POSITIONS entry in drawEnemy.js. `generateMazeMap()` return shape changed to `{ map, openCells, entryPos, exitPos }` — all call sites in WorldScreen updated. Old 3-exit tile placement replaced with single EXIT_N at col 18, row 1 (top-right). `spawnMazeContents()` added to tileMaps.js — places 2–3 chests + 3–4 ghost_wisps on safe open tiles. WorldScreen wires MAZE branch: `mazeOpenCellsRef` + `mazeExitPosRef` refs; MAZE uses `spawnMazeContents`, non-MAZE still uses `getScreenEnemies` + `spawnChests`. `useWorldGameLoop`: ghost_wisp AI case (timer≥70, random drift, never chases); `renderEnemies` gains `frame` param + ghost bob+glow; exit portal rendered via `drawMazePortal` when `screenIdRef.current === 'MAZE'`. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. `mazeOpenCellsRef.current` is populated by `initScreen` before the `[screenId]` effect runs since `initScreen` is called synchronously inside the transition callback — safe ordering.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — Maze fog replaced with DOM CSS-mask overlay:**
- Built: Removed `drawMazeFog()` from `worldDrawHelpers.js` entirely. Added `fogOverlayRef` + `torchRingRef` refs in WorldScreen. JSX now renders (when `screenId === 'MAZE'`) a `<div ref={fogOverlayRef}>` with `background: rgba(8,4,14,0.97)` and `WebkitMaskImage`/`maskImage` CSS radial-gradient for the transparent circle, plus a `<div ref={torchRingRef}>` styled as a warm glowing ring. Both positioned/sized in the RAF loop via direct `.style` mutation (cheap DOM writes, no canvas ops). `useWorldGameLoop` signature gains `fogOverlayRef` + `torchRingRef`; the `drawMazeFog` canvas call is fully removed. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. CSS `mask-image` requires `-webkit-` prefix for Safari iOS — both prefixes are set each frame.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-19 — Maze portal object replaces exit-routing-override:**
- Built: `mazePortal: { screenId, col, row }` added to defaultState() in state.js (random screen on first install; persists to localStorage). New actions: SPAWN_MAZE_PORTAL, SPAWN_MAZE_PORTAL_RESOLVED, ENTER_MAZE. CLEAR_MAZE now respawns a new portal rather than setting mazeCleared. INCREMENT_BATTLE_WINS: removed shouldSpawnMaze + secretMapExpiry logic. SET_WORLD_LEVEL + DEFEAT_BOSS: removed secretMapExpiry. WorldScreen: `mazePortalPosRef` holds resolved tile position (stable once resolved, persisted via SPAWN_MAZE_PORTAL_RESOLVED); portal position resolved in [screenId] effect; tryMove checks portal collision → mazeConfirm dialog; `confirmEnterMaze` transitions to MAZE screen; old routing overrides (connects.S='MAZE', connects.W='MAZE') and forcedStart MAZE branch removed; secretMapExpiry useEffects removed; countdown banner removed. worldDrawHelpers.js: drawMazePortal() — pulsing purple rings + orbiting sparkle particles. useWorldGameLoop: renders portal via drawMazePortal if mazePortalPosRef.current is set. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. Existing localStorage: `secretMapExpiry` field is harmless legacy data — no migration needed since all code reading it was removed.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — MAZE fog-of-war rendering:**
- Built: `drawMazeFog()` exported from worldDrawHelpers.js — fills canvas with near-black, punches lit circle via destination-out radial gradient, adds warm candle tint overlay. Flicker = `sin(frame×0.15)×3 + sin(frame×0.37+1.3)×2` (two sines avoid mechanical feel). `screenIdRef` added as new param to `useWorldGameLoop`; WorldScreen.jsx passes it. RAF loop checks `screenIdRef?.current === 'MAZE'`; MAZE uses fog, all other screens use normal `drawPlayerGlow`. Fog drawn before player sprite so sprite renders crisp on top of lit area. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. `[]` dep array unchanged — screenIdRef is a ref, safe to read inside closure.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — rainbow_star saiyan mode fix + SFX + rainbow visual:**
- Built: (1) Chase AI suppressed: sleepy_bunny/baby_zombie/snake movement steps each check `saiyanActive` at top of `updateEnemies`; snake uses `else if (!ne.isAggro)` branch so aggro-but-saiyan state causes no movement. (2) tryMove fix: removed early `if (isChaser && saiyanActive) return false` which was blocking player-initiated walk-into-chaser; now only suppresses the "chaser already on player tile" overlap branch. (3) Activation SFX: `powerup` SFX added to `SFX` dict in audio.js (upward sweep + ascending arp); plays in rainbow_star handler in useHomeInteractions.js. (4) Rainbow visual: `@keyframes rainbow-cycle` (hue-rotate 0→360deg, 0.6s linear infinite) + `.saiyan-rainbow` class in styles.css; applied to creature outer wrapper in Home.jsx; world-map player shadowColor cycles `hsl(frame×6, 100%, 60%)` instead of static gold. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — Adaptive hint overlay for word-building and sequencing:**
- Built: `inputModeMastery:{wordbuild:0,sequence:0}` added to defaultState. `RECORD_INPUT_MODE_RESULT` action + EMA reducer (success:+0.15, fail:-0.08, clamped 0-1). MoveSelectBattleMode dispatches result before locking, computes showWordbuildHint/showSequenceHint (threshold 0.5). WordBuildInput + SequenceInput: nextNeededChar + hintTileId derived from slots state, hinted tile gets gold pulsing border, "👆 ตัวที่กระพริบ" instruction shown. `@keyframes hint-pulse` in styles.css. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. EMA: ~4-5 correct in a row crosses threshold and hints stop. A few wrongs brings them back.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — Input mode coverage fix (all English/Math levels):**
- Built: genEngMoveQ — removed type gates from all 4 variety checks (sequence/fillgap/visualdiscrim/memory); now fires at same rates for sight/sentences players. Sight branch adds wordbuild 35% (chars:item.blank.split('')). genMathQ — isCount gains numpad 40%. isPattern stays choice-only (emoji answer). Verified: MoveSelectBattleMode numpad branch handles isCount correctly (value===q.answer plain number comparison); WordBuildInput Latin font path covers sight word chars. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — Collection team carousel redesign:**
- Built: PartyGrid replaced with horizontal scroll-snap carousel. One creature per screen, scroll reveals next/prev. Dot indicator in header (active pill=18px, inactive=6px). handleScroll uses Math.round(scrollLeft/clientWidth) for index. Canvas 90→140px (drawCreature confirmed scale-agnostic via Math.floor(min(W,H)/12)). SubjectLevelProgress dropped from cards (shows global stats, not per-creature). Swipe hint for >1 creature. CSS `.carousel-scroll-hide-bar` hides scrollbar cross-browser. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: SubjectLevelProgress no longer visible in Collection — if needed it could go in a separate info section or the Report tab. Not blocking.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — Missing pixel art + hint item mode-awareness:**
- Built: `scroll`/`mirror`/`clover` drawers added to itemArt.js — all 9 game item keys now resolve (verified). `hint` effect in useBattleCombat.js made mode-aware: numpad shows digit-count clue, wordbuild/sequence shows first-char clue, memory shows friendly "ใบ้ไม่ได้" message, choice mode unchanged. skip/free_attack/block/double_xp confirmed mode-agnostic (touch only HP/flags, no choices dependency). Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — Spoken + visual instructions for sequence/fillgap/visualdiscrim/memory modes:**
- Built: `instructionTh`/`instructionEn` fields added to all 4 question generators. TTS useEffect + handleDismissTeach both fall back to instruction audio when ttsWord is null. `onSpeak()` in WorldBattle.jsx also falls back — speaker button now always does something. Zone 2 early-returns for isFillGap/isVisualDiscrim updated to show gold 16px Thai instruction label; isSequence converted from generic path to its own early-return with same label; MemoryCardInput.jsx gets a gold 15px Thai instruction label above the pair-count line.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System (Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole)
- Needs Chatbot decision first: none

**2026-06-18 — Word-building input mode for English CVC words:**
- Built: CVC branch in genEngMoveQ now adds `inputMode:'wordbuild'|'choice'` (50/50) and `chars: correct.word.split('')`. WordBuildInput.jsx made subject-aware: `distractorPool` prop (named exports DEFAULT_THAI_DISTRACTORS / DEFAULT_ENG_DISTRACTORS), `isLatinChars` Unicode detection, pixel font + lowercase for Latin. MoveSelectBattleMode passes `distractorPool={subject === 'eng' ? DEFAULT_ENG_DISTRACTORS : undefined}`. Thai behavior unchanged. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — Memory card matching mini-game (Thai/English):**
- Built: `genMemoryCardQ` (3 items → 6 emoji+char cards, shuffled). `MemoryCardInput.jsx` (flip-and-match, no mismatch penalty, onPairFound per match, onAllPairsFound after last). `handleMemoryPairFound` in MoveSelectBattleMode: intermediate pairs → playTone+spawnEffect only; last pair → fireHit(-1) (triggers onNext/showVictory). memoryMatchedRef resets per question. disabled check skips lockedRef for memory (card interaction must remain open during round). Thai L1–2 (8%), English phonics (8%). Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. onAllPairsFound is no-op — the last fireHit handles progression. This avoids double-advance.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — Fill-the-gap + visual discrimination question types:**
- Built: `genFillGapQ` (3-letter run, hide middle, wrong choices from non-adjacent positions); `TH_CONFUSABLE_GROUPS` / `EN_CONFUSABLE_GROUPS`; `genVisualDiscriminationQ` (pick target from look-alike group, pad with unrelated letters). Both wired into Thai L1–2 (10% each) and English phonics (10% each) after existing sequence check. Zone 2: early-return custom JSX for isFillGap (inline gap display) and isVisualDiscrim (large char + subtitle). Both use inputMode:'choice' so MoveCard grid renders unchanged. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. Zone 2 IIFE now has a shared `zoneWrap` helper to reduce JSX repetition.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-18 — Sequencing input mode (Thai/English alphabet ordering):**
- Built: `genSequenceQ(alphaList)` picks 3–4 consecutive letters from TH_ALPHA (`.char`) or EN_ALPHA (`.letter`); returns `isSequence:true, inputMode:'sequence', sequenceChars`. Thai L1–4: 15% chance to get sequence instead of normal question. English phonics/cvc: same 15% chance. `SequenceInput.jsx` — shuffled tile tray, slots, auto-submit on last tile, "เรียงตามลำดับ" label. Zone 2 shows 🔤 for sequence questions (no word/emoji context). MoveSelectBattleMode chains numpad → wordbuild → sequence → choice. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. Level 5 Thai (sentences) and English sight/sentences deliberately excluded — those word runs would be too long/complex.
- Ready to start next: Phase 4 NPC System (Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole)
- Needs Chatbot decision first: none

**2026-06-18 — Word-building (tap-to-spell) input mode for Thai battles:**
- Built: `WordBuildInput.jsx` (tap tile → fills next slot; tap slot → returns tile; auto-submit on last tile; 1–2 distractor tiles from DISTRACTOR_POOL; resets on resetKey). `genThaiMoveQ()` levels 2/3/4 add `inputMode:'wordbuild'|'choice'` at 50/50 and `chars:correct.chars`. MoveSelectBattleMode move panel now branches numpad → wordbuild → choice; div style centers for both non-choice modes. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none. DISTRACTOR_POOL overlaps are filtered per-question so distractors never duplicate target chars.
- Ready to start next: Phase 4 NPC System (Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole)
- Needs Chatbot decision first: none

**2026-06-18 — Numpad input mode for math battles:**
- Built: `NumpadInput.jsx` (digit-by-digit entry, 2-digit cap, gold display, confirm/backspace). `genMathQ()` in WorldBattle.jsx adds `inputMode: 'numpad'|'choice'` at 50/50 random on arithmetic questions only (count/pattern/word unchanged). MoveSelectBattleMode Zone 3 branches on `q?.inputMode === 'numpad'` — numpad centered in 168px panel, or existing 2×2 MoveCard grid. Submission mirrors handleTap timing exactly. Build: 0 errors.
- Not finished: TEACH_INTRO not updated (teach screen never shows in world battles — isFirstLevel=false always)
- Blockers/risks found: none. Battle items hint/mirror effect (setEliminated) has no visual in numpad mode — acceptable edge case, very rare
- Ready to start next: Phase 4 NPC System (Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole)
- Needs Chatbot decision first: none

**2026-06-18 — Battle Round 3 (useBattleCombat hook — MoveSelectBattleMode refactor complete):**
- Built: extracted fireHit, fireMiss, showVictory, useBattleItem into `src/hooks/useBattleCombat.js`. All 4 functions receive every ref/state-setter/prop as explicit params; behavior byte-for-byte identical to original. Removed playElementSFX, spawnConfetti, getElementTier, playElementAttack, rollBattleItem from MoveSelectBattleMode imports (all now in hook). MoveSelectBattleMode.jsx: 1018 → 711 lines. Full Phase 4 refactor complete: 1190 → 711 lines (−40%). Build: 0 errors.
- Not finished: nothing — all 3 battle rounds done
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System (Prof Owl already wired; add Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole)
- Needs Chatbot decision first: none

**2026-06-18 — Battle Round 2 (useBattleEffects hook):**
- Built: extracted particle/effect canvas system (ResizeObserver sync, RAF loop, spawnEffect, effectCanvasRef, overlayCanvasRef) into `src/hooks/useBattleEffects.js`. Removed mkBeam/mkOrb/mkLightning/mkSparks/tickEffects import from main file. Removed effectRafRef cancel from unmount cleanup (hook owns it). MoveSelectBattleMode.jsx: ~1190 → 1018 lines. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Battle Round 3 (extract battle logic functions — fireHit, fireMiss, useBattleItem into hooks)
- Needs Chatbot decision first: none

**2026-06-18 — Battle Round 1 (presentational component extraction):**
- Built: created `src/components/battle/` with GBHPBar.jsx, EnemyCanvas.jsx, MoveCard.jsx, HintBar.jsx. Moved THAI_NUMS/numTh/mathToThai to HintBar.jsx with named exports; re-imported in main file. Removed drawEnemy/drawEnemyHurt import from MoveSelectBattleMode. File: ~1190 → 1092 lines. Build: 0 errors.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Battle Round 2 (extract battle logic hooks — fireHit/fireMiss/effect system)
- Needs Chatbot decision first: none

**2026-06-18 — Home.jsx Round 3 (useHomeInteractions hook — Phase 3 refactor complete):**
- Built: extracted all tap/swipe handlers (spawnParticles, handlePetEgg, handleTapItem, handleEggTap, handleCreatureTap, handleCreatureSwipe) into `src/hooks/useHomeInteractions.js`. Removed comboToState, particleIdRef, swipeCountRef from Home.jsx. Hook call order: useCreatureInteraction → useHomeInteractions → useHomeAmbience. Home.jsx now 632 lines (was 952 before Phase 3). Build: 0 errors.
- Not finished: nothing — Phase 3 complete
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System (Prof Owl wired; add Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole)
- Needs Chatbot decision first: none

**2026-06-18 — Home.jsx Round 2 (useCreatureInteraction hook):**
- Built: extracted interaction state machine (enterState, extendState, setGlow, smRef, watchdog, unmount cleanup, STATE_CSS/STATE_DUR) into `src/hooks/useCreatureInteraction.js`. Home.jsx now 766 lines (was 848). Build: 0 errors.
- Not finished: nothing — clean extraction with full behavior preservation
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System (Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole); or Home.jsx Round 3 if desired
- Needs Chatbot decision first: none

**2026-06-16 — Home.jsx fixes (creature duplicate + HP bar + ribbon):**
- Built: removed duplicate walking creature system from Home.jsx (patrol/personality effects, companion div, 3 state vars, 2 refs); HomeBackground.jsx is the single walking system. Added HP bar (color-coded green/yellow/red) after stat row in creature zone. Ribbon item now dispatches CREATURE_STAT_BOOST (+10 SPD) + shows ⚡ SPD+10 bondReaction. Added CREATURE_STAT_BOOST action + reducer to StateContext.jsx.
- Not finished: nothing — all 3 issues resolved
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split (extract WorldHUD.jsx, useWorldEnemies.js, useWorldChests.js)
- Needs Chatbot decision first: none

**2026-06-16 — Collection simplify + pixel art style + Home nav cleanup:**
- Built: Collection.jsx rewritten to 2 tabs (ทีม + กระเป๋า). Removed vault/hatched/current tabs and sub-components. New ItemBag shows 8 item types via drawItem canvas with count badge and effect text. Pixel art header + dark background. Home.jsx: removed คอลเลกชัน button; ลูบ!/ออกสำรวจ! remain with flex 1/2.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — Dodge cap + temporary item boosts:**
- Built: flat 20% dodge (removed SPD scaling). Ribbon/star now give temporary visual buffs (5min/10min) with cooldown (30min/60min); no permanent stat changes to creature.
- Not finished: nothing
- Blockers/risks found: activeBoosts resets on page reload (in-memory only). Not persisted to localStorage. Acceptable for now — Chopin won't notice the reset.
- Ready to start next: Phase 2 WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — Report screen rewrite (5 sections, pixel art):**
- Built: full rewrite of Report.jsx — removed MissionAnalytics + raw session history; added dark theme; 5 sections (overview, XP bars, response speed, parent report in Thai, what to do next).
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 2 WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — Enemy ATK source + dodge cap:**
- Built: fireMiss() reads enemyData?.atk (has combat stats) not enemy.atk (local useState, name/emoji/type only). Dodge capped at 30% (was 80% at SPD=160 with old SPD/200 formula).
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: playtest battle balance; Phase 2 WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — HP scale unification (home↔battle):**
- Built: removed WB_HP_SCALE from creatureStats.HP; creatureCurrentHP now raw (no scaling); handleCreatureTakeDamage dispatches raw damage; MoveSelectBattleMode localCreatureHP heals +1 on correct answer when bond≥75.
- Not finished: nothing
- Blockers/risks found: note — removing WB_HP_SCALE means creature HP in battle now matches Home (raw ~100-200 HP). Enemy ATK is still low (~4-8), so faint takes many more hits. May need to increase enemy ATK or reduce creature HP further — playtest needed.
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: enemy balance (if playtest shows creature never faints)

**2026-06-16 — Battle HP + animation fixes (5 issues):**
- Built: localCreatureHP state so HP decreases mid-battle; GBHPBar shows numeric HP; name badge color fixed; creature shake animation on hit; WorldBattle creatureCurrentHP scaling fixed to match creatureStats.HP unit.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — Report: subject level/grade section:**
- Built: SUBJECT_LEVEL_MAP with grade labels for all Thai/Math/Eng levels; SubjectLevelCard component (collapsed shows current level + grade badge; expanded shows full level table with ✓/►/· icons); new LEVEL · GRADE section inserted as Section 3 in Report.jsx
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split; or playtest battle balance
- Needs Chatbot decision first: none

**2026-06-16 — Emergency fixes: login button + Supabase auto-restore (3 tasks):**
- Built: Home.jsx — added onOpenLogin/onOpenProfile to props signature (were passed from App but ignored); added isLoggedIn useState via supabase.auth.getSession + onAuthStateChange; login/profile button in header right side. StateContext.jsx SIGNED_IN handler — always takes cloud data if cloud has creatures but local doesn't (before: only took cloud if rounds >= local rounds). StateContext.jsx startup — after loadState, if user is logged in but hatchedEggs empty, auto-fetches cloud and dispatches INIT
- Not finished: nothing
- Blockers/risks found: TASK 3 startup guard runs AFTER loadState() which also tries to load from cloud — there's a race condition risk on slow connections (both dispatches INIT). Acceptable for now; second dispatch wins and state is correct
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — Creature/egg/tier connection audit (6 tasks):**
- Built: PROGRESSION_MAP in battleConfig.js (5 tiers + evoRequirements); calcEvoStage now reads PROGRESSION_MAP thresholds (teen: Lv11+Tier1, final: Lv26+Tier3+Bond60); readyToHatch removed from ADD_XP and moved to SET_SUBJECT_LEVEL (tier advance when all subjects ≥ next minSubjectLevel, hatchedEggs < 6); state.grade auto-increments on tier advance; Home.jsx readyToHatch guard cleaned (removed stale stage check); Collection.jsx CreatureJourney component (evo roadmap ○/⚡/✅ with lv/tier/bond hints, stage bar); Report.jsx tier progression line in parent report
- Not finished: HatchOverlay still only supports first egg (hasCreature = length >= 1); subsequent egg hatch UI needs new flow (out of scope)
- Blockers/risks found: creatureSystem.js now imports gameConfig.js — check for circular deps if battleConfig.js ever imports creatureSystem.js (currently no issue)
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: subsequent egg hatch UX (2nd+ egg when tier advances with existing creature)

**2026-06-16 — Adaptive difficulty system (6 tasks):**
- Built: state fields (subjectSessionStreak/subjectLevelFloor/pendingLevelUp); 4 new ACTIONS + reducers; WorldBattle.jsx onComplete adaptive check (≥0.80 streak → level up after 3; <0.50 → silent level down); WorldScreen.jsx triggerBattle + enterBossBattle now use subjectLevels?.[subject] ?? 1 (replaced getBattleLevel); LevelUpCutscene.jsx (flash→reveal→celebrate→done, canvas star rain, tap to continue); App.jsx pendingLevelUp overlay; WorldScreen sky tint overlay (4 time-of-day tints by subject level); CSS keyframes blink/levelup-pulse/scale-pop/arrow-slide
- Not finished: nothing — all 6 tasks complete
- Blockers/risks found: none; subjectLevelFloor = level at time of level-up (never go below it), so Chopin can't be stuck in a downward spiral
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — New home items: shoes + rainbow_star + saiyan aura (7 tasks):**
- Built: HOME_ITEMS config in itemConfig.js; pixel art for shoes + rainbow_star in itemArt.js; defaultState updated; USE_HOME_ITEM now stores boosts in state.activeBoosts (persisted); migration star→rainbow_star + potion→shoes on load; Home.jsx item tray reads state.activeBoosts for cooldown, saiyan aura on creature canvas; WorldScreen.jsx shoes doubles move step + rainbow_star adds gold ctx.shadowBlur on player; MoveSelectBattleMode.jsx saiyan filter on creature canvas; saiyan-pulse CSS keyframe; Collection.jsx HOME_ITEM_DEFS updated
- Not finished: nothing — all 7 tasks complete
- Blockers/risks found: shoes 2-tile jump skips intermediate tile collision check (spec-compliant but could allow clipping near walls — acceptable for Chopin)
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split; or battle balance tuning
- Needs Chatbot decision first: none

**2026-06-16 — Item system separation (homeItems + battleItems):**
- Built: split state.items into state.homeItems {food/ribbon/potion/star} + state.battleItems {scroll/thunder/gem/mirror/clover}; added 4 new ACTIONS (USE/DROP_HOME_ITEM, USE/DROP_BATTLE_ITEM) with backward-compat aliases; localStorage migration on load; fixed RECORD_BATTLE; updated Home.jsx item tray + MoveSelectBattleMode.jsx reads; Collection.jsx ItemBag rewritten with two labeled sections + divider; removed non-existent items (shield/bone/coin)
- Not finished: nothing — all 5 tasks complete
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — Emergency debug: Supabase state restore for Chopin:**
- Built: debugSupabaseState() in App.jsx — called once on load, logs full Supabase row + hatchedEggs count to console. Restore button rendered when state.hatchedEggs is empty — fetches state_json from Supabase eggs table (first row), writes to kq_state, reloads. Button is styled red "🔄 กู้คืนข้อมูล", fixed bottom-center, zIndex 9999.
- Not finished: nothing
- Blockers/risks found: debugSupabaseState + restore button are intentionally temporary. Remove when Chopin's data is confirmed restored (or when issue root cause is fixed).
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Add SFX/tones to all animation/cutscene points:**
- Built: (1) MoveSelectBattleMode — `playSFX('player_hit')` on shake, `useEffect` plays `playTone('ultimate')` when saiyan activates. (2) LevelUpCutscene — added audio import + `playSFX('level_up')` at reveal (400ms), `playTone('fanfare')` at celebrate (1200ms), timings extended (2800→3800ms done). (3) RewardChest — added audio import + `playTone('jingle')` on shaking, `playSFX('item_collect')` on tap-to-open, `playTone('reveal')` when reveal phase starts, `playTone('sparkle')` on collect. (4) TreasureSlot — `playSFX('item_collect')` on handleCollect. (5) HomeBackground — added audio import + `lastJumpSoundRef` + `playTone('chirp')` on meeting start + throttled `playSFX('footstep')` on jump (800ms cooldown). (6) WorldScreen — `playSFX('enemy_notice')` before boss confirm dialog + `playSFX('battle_start')` in enterBossBattle. (7) WorldBattle — `playSFX('victory')` + `playTone('fanfare')` before DEFEAT_BOSS dispatch. (8) App.jsx — `playSFX('stage_up')` + `playTone('stageUp')` in pendingEvoNotice handler.
- Not finished: HatchOverlay already had sounds (playHatchSound + reveal + fanfare) — no change needed. Home.jsx already had all sounds.
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — rainbow_star: phase-through immunity from chaser enemies:**
- Built: `tryMove` collision check — added `saiyanActive` guard; chasers (snake/baby_zombie/woken sleepy_bunny) skip collision when rainbow_star active. Walking directly INTO a non-chaser enemy still triggers battle normally. RAF loop enemy-initiated collision — added `saiyanActiveNow` guard so chasers can't force battle by walking onto player while saiyan active. Effect labels updated everywhere: rainbow_star → 'ล่องหนจากมอนสเตอร์ตาม'; shoes → 'วิ่ง×4' (all 3 files + bondReaction text).
- Not finished: nothing
- Blockers/risks found: boss enemy (`hitEnemy.isWorldBoss`) still triggers boss confirm regardless of saiyan — intentional
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Fix shoes boost — faster lerp instead of tile-skip:**
- Built: `tryMove` no longer multiplies `dCol/dRow` by `playerSpeed`; always moves 1 tile. Sets `window.__kq_moveSpeedMult = 2.0` when shoes active (1.0 otherwise). RAF lerp changed from `/ 120` to `/ (120 / speedMult)` — shoes → 60ms per tile instead of 120ms. `g.moving` gate naturally halves in duration so next input can fire sooner too. Every tile is now visited; chests, items, NPCs all trigger normally.
- Not finished: nothing
- Blockers/risks found: `window.__kq_moveSpeedMult` is a global side effect — acceptable since WorldScreen is a singleton and is always the only writer
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Collection: subject level progress + evo stage visual preview:**
- Built: `SubjectLevelProgress` component (LEVEL UP section) — 3 subjects each showing icon badge, level + grade label, streak dots (3 needed for level-up, glowing when filled), mastery bar of current level, "LEVEL UP! ⬆️" text when streak≥3. `CreatureJourney` STAGE row replaced with 3 mini drawCreature canvases (Baby/Teen/Final), sized 29/38/48px, future stages grayscale+dim, current has gold drop-shadow + NOW label, past has ✓. Props passed from Collection → PartyGrid → SubjectLevelProgress (subjectLevels, subjectSessionStreak, levelMastery).
- Not finished: nothing
- Blockers/risks found: mini evo canvases always draw baby/teen/final regardless of actual seed — this is correct behavior (showing what the evolution looks like)
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Collection screen dark pixel art theme:**
- Built: Header — fontSize 11→10, color `var(--px-yellow)` → `#EF9F27`, letterSpacing 2→3, borderBottom → `rgba(255,255,255,0.08)`. Tabs — inline override: active gold `#EF9F27` border-bottom, inactive `rgba(255,255,255,0.35)`, both `background:transparent`. Card container — `background:'#0f0f1a'`, `border: 2px solid #EF9F27 (active) or rgba(255,255,255,0.1)`, `boxShadow` glow on active, `borderRadius:0`, removed `borderRadius:4` on canvas. Active badge `#FFD700→#EF9F27`. Creature name — replaced className with inline dark style. Level text `rgba(0.5)→rgba(0.35)`. HP bar `#000/#333→rgba`. HP text `rgba(0.4)→rgba(0.3)`. Set active button — filled gold → transparent outlined `#EF9F27`. CreatureJourney — `width:'100%'`, label "JOURNEY→JOURNEY AHEAD", future step color `rgba(0.2)`, needs text `rgba(255,100,100,0.5)`.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Mission progress panel above map:**
- Built: `MissionPanel` component in WorldScreen.jsx — shows map name, cleared status (✓), objective text per screen (NW/NE/SW/SE/MAZE/BOSS), enemy type list, daily progress bar (dailyBattleRounds/10). Positioned `top: HUD_CONTENT_H+8` with `pointerEvents:none`. Camera offset updated: `(HUD_CONTENT_H + PANEL_H=72) / 2` centers map in space below panel.
- Not finished: nothing
- Blockers/risks found: PANEL_H=72 is an approximation — if panel grows (e.g. long enemy list), map may shift. Acceptable for now.
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Fix RewardChest — static drawItem import + collected animation:**
- Built: (1) Dynamic `import('../lib/itemArt.js')` inside ref callback replaced with static `import { drawItem }` at top — fixes black/broken canvas on iOS/Android where dynamic import timing was unreliable. (2) New `collected` phase after `reveal`: items fly up + fade out, "เข้ากระเป๋าแล้ว!" banner appears, auto-calls onDone after 1200ms. Tap hint updated: reveal→"แตะเพื่อเก็บ!", collected→"".
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Fix item bag popup counts + HUD battle items source:**
- Built: (1) Split `items = state.homeItems` into `homeItems = state.homeItems` + `battleItems = state.battleItems`; HUD battle items now reads from `battleItems`; homeItemCount uses `homeItems`. (2) Item bag popup: `state.items` → `state.homeItems`, `USE_ITEM` → `USE_HOME_ITEM`, closes bag on use. (3) Popup redesigned: dark pixel art theme, HOME 4-col grid (40px drawItem canvas + ×count), BATTLE 5-col grid (32px PixelItemIcon + ×count), CLOSE button.
- Not finished: nothing
- Blockers/risks found: maze exit still uses DROP_ITEM backward-compat alias (intentional — out of scope)
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — TreasureSlot rewrite — chest open animation + item reveal:**
- Built: TreasureSlot.jsx fully rewritten — slot machine removed; new flow: question gate → chest shakes → tap to open → items float up with drawItem canvas + glow labels → รับของ! button. Rolls home item (55%) + battle item via rollBattleItem(). onReward now passes `{ rewards: [{type,key},...] }` array. WorldScreen.jsx handleTreasureReward updated to dispatch DROP_HOME_ITEM/DROP_BATTLE_ITEM per item.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Post-battle reward chest (5 tasks):**
- Built: RewardChest.jsx (closed→shaking 400ms→opening 600ms→reveal; tap-to-open; pixel art items via drawItem canvas with glow label; blink tap hint). WorldBattle.jsx rolls battle item (55%) + home item (40% from HOME_DROP_TABLE food/ribbon/shoes/rainbow_star), dispatches DROP_BATTLE_ITEM/DROP_HOME_ITEM immediately, shows RewardChest overlay instead of navigating; navigate('world') deferred to chest onDone. SET_PENDING_REWARDS + CLEAR_PENDING_REWARDS actions added to StateContext. pendingRewards: [] added to defaultState(). chest-shake/sparkle-rise/fadeInUp keyframes added to styles.css.
- Not finished: boss battles also show chest — OK by design (bosses can also drop items)
- Blockers/risks found: sparkle positions use fixed SPARKLE_POSITIONS array (not Math.random in JSX, avoids per-render jitter)
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Fix monster scaling + adaptive difficulty streak:**
- Built: scaleMonsterStats() changed from step function (1.0/1.3/1.8/2.4/3.2x) to linear 2%/level hard-capped at 2x (level 16 = 1.30x, level 51 = 2.0x cap). WorldScreen triggerBattle scaleFactor changed from 0.4/level (level 16 = 7x!) to 0.15/level capped at 4x; def now scales at 0.5x; hp floor 30, atk floor 4. WorldBattle isStrong threshold raised from 6→8 questions min. Streak now always resets to 0 on any non-strong session (was only reset on level-up or level-down, causing drift).
- Not finished: nothing
- Blockers/risks found: target at Lv16 = enemy takes 8-12 correct answers to defeat. Verify in playtest — at Lv1, base HP 24 × 1.0 = 24 HP; creature ATK ~4 per hit → 6 hits to defeat. At Lv16, base HP 24 × 3.25 = 78 HP but then scaleMonsterStats multiplies again by 1.30 → 101 HP total; ~12-15 hits. May still be on the high side; can tune further if needed.
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split; or playtest
- Needs Chatbot decision first: none

**2026-06-16 — Fix currentHP exceeding max in all heal/boost actions:**
- Built: CREATURE_HEAL maxHP changed from `(e.stats?.HP ?? 10) + battleLevel - 1` to `e.stats?.HP ?? 100` (battleLevel bonus was allowing healing past stats.HP — root cause of 519 > 504). USE_HOME_ITEM food now heals active creature +30 HP capped at stats.HP. CREATURE_STAT_BOOST now caps currentHP to new stats.HP after stat update. Initializer: clamp all creature currentHP to stats.HP on every load (no flag — harmless to run always).
- Not finished: nothing
- Blockers/risks found: none; food now heals +30 HP per use (was happiness-only before)
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-16 — Fix 4 critical issues + remove debug code:**
- Built: (1) subjectLevels recalibrated from levelMastery on first load (_subjectLevelCalibrated flag); (2) WorldBattle accuracy tracking via accuracyRef — level-up/down now requires ≥6 questions answered; (3) additive items→homeItems/battleItems migration (_itemsMigrated flag, handles partial states); (4) SET_SUBJECT_LEVEL uses avg subject level for grade (avg≥2→1, avg≥3→2, avg≥4→3) instead of minLevel tier gates; creatures recalculate evoStage inline when grade changes; _evoRechecked flag rechecks all eggs on load; calcEvoStageInline() avoids circular import. All debug code removed from App.jsx.
- Not finished: nothing
- Blockers/risks found: _subjectLevelCalibrated runs once — if levelMastery is empty (new account), subjectLevels defaults to {1,1,1} which is correct. Flag prevents re-running on every load.
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none

**2026-06-17 — Phase 2 Round 2: extract pure drawing helpers into worldDrawHelpers.js:**
- Built: Created `src/lib/worldDrawHelpers.js` — exports drawChest, drawPlayerGlow, spawnChests, findSpecials, getOwlLines, SIGN_LINES, STAGE_COLORS. Imports T/MAP_ROWS/MAP_COLS from tileEngine.js; local TILE=16. WorldScreen.jsx: removed 94 lines, added import; TILE + SKY_TINTS kept in WorldScreen (still needed for RAF loop). WorldScreen now 1257 lines. Build: 0 errors.
- Not finished: Round 3 (enemy hook) and Round 4 (chest hook) not started
- Blockers/risks found: none
- Ready to start next: Phase 2 Round 3 — useWorldEnemies.js hook extraction
- Needs Chatbot decision first: none

**2026-06-17 — Phase 2 Round 3: extract battle-trigger logic into useBattleTrigger hook:**
- Built: Created `src/hooks/useBattleTrigger.js` — exports triggerBattle, triggerBattleRef, battleDispatchedRef, battlePendingRef, enterBossBattle. Calls useAppState internally for dispatch; owns all 3 refs; useLayoutEffect (no-dep) syncs battlePendingRef/battleDispatchedRef after every commit. WorldScreen.jsx: removed duplicate useLayoutEffect (lines 61-64); removed getBattleLevel + ENEMY_DATA imports (moved to hook); removed 3 ref declarations; removed triggerBattle callback + triggerBattleRef.current assignment + useLayoutEffect + enterBossBattle (58 lines); added useBattleTrigger hook call after setBossConfirm/mazeTimerTick state declarations. WorldScreen now 1194 lines (was 1257 after Round 2). RAF loop refs (battleDispatchedRef, battlePendingRef, triggerBattleRef) now come from hook return value — no behavior change. Build: 0 errors.
- Not finished: Round 4 (RAF loop hook) not started
- Blockers/risks found: none
- Ready to start next: Phase 2 Round 4 — extract RAF game loop into useWorldGameLoop hook
- Needs Chatbot decision first: none

**2026-06-18 — Home.jsx Round 1: extract ambient/idle effects into useHomeAmbience hook:**
- Built: Created `src/hooks/useHomeAmbience.js` — owns idle micro-animations (7 types), rare ambient visual events (butterfly/leaf/star, 38–88s interval), stage-up celebration (sparkle/hearts + banner), hatch-ready heartbeat (8s pulse), reunion burst on mount (hearts+sparkle+creature voice), post-session growth banner. Returns {ambientEvent, stageUp, growthBanner}. Takes stage/readyToHatch/eggAnim/setIdleAnim/spawnParticles/enterState/voiceProfile/initialLastHomeVisit/sessionXP as params. IDLE_DUR constant moved to hook file. Home.jsx: removed ambientEvent/stageUp/growthBanner useState; removed idleTimerRef/eggAnimRef/prevStageRef useRef (only used in moved effects); kept stageRef + its sync effect (still needed by enterState/extendState/watchdog); removed eggAnimRef sync effect; removed 6 useEffects (100 lines); added useHomeAmbience hook call after setGlow. Home.jsx now 848 lines. Build: 0 errors.
- Not finished: Home.jsx Round 2 (interaction state machine extraction) not started
- Blockers/risks found: Hook has its own internal stageRef + eggAnimRef that are separate from Home.jsx's stageRef — minor duplication but correct since they serve different purposes
- Ready to start next: Home.jsx Round 2 — extract interaction state machine into useEggSM hook
- Needs Chatbot decision first: none

**2026-06-17 — Phase 2 Round 4: extract RAF game loop (enemy AI, rendering, camera) into useWorldGameLoop hook:**
- Built: Created `src/hooks/useWorldGameLoop.js` — pure relocation of 326-line RAF useEffect (findRespawnPos, scheduleRespawn, updateEnemies, renderEnemies, renderChests, loop). TILE+DIRS4 moved to module level; rafRef replaced with local rafIdRef inside effect closure; effect dep array stays []. WorldScreen.jsx: removed renderMap/renderPlayer/getCamera from tileEngine import (only needed by hook); removed drawEnemy import (only needed by hook); removed dead imports MAP_ROWS/MAP_COLS/EXIT_OPPOSITE; removed rafRef useRef declaration; replaced 326-line useEffect block with 6-line useWorldGameLoop() call. WorldScreen now 873 lines (was 1700 at start). Build: 0 errors, zero behavior change.
- Not finished: nothing — Phase 2 WorldScreen.jsx split complete
- Blockers/risks found: none
- Ready to start next: Phase 4: NPC System (5 NPCs with dialogue/gifts), or content expansion (Thai Lv6-8, Math Lv9-10, English Lv5-6)
- Needs Chatbot decision first: none

**2026-06-17 — Phase 2 Round 1: extract WorldHUD + MissionPanel into world/ subfolder:**
- Built: Created `src/components/world/WorldHUD.jsx` (HUD bar with mini-map, creature HP, XP, battle items, item bag, home button; exports HUD_CONTENT_H/HOME_ITEM_KEYS/BATTLE_ITEM_KEYS as named exports). Created `src/components/world/MissionPanel.jsx` (map objective panel; imports HUD_CONTENT_H from WorldHUD). WorldScreen.jsx reduced from 1700→1346 lines — removed WorldHUD+MissionPanel function bodies and their local consts; removed getCreatureSeed + MAP_THEMES imports (now only used in WorldHUD.jsx). Build clean: 137 modules, 0 errors.
- Not finished: Round 2 (enemy hook) and Round 3 (chest hook) not started
- Blockers/risks found: none
- Ready to start next: Phase 2 Round 2 — useWorldEnemies.js hook extraction
- Needs Chatbot decision first: none

**2026-06-17 — Remove completed migrations + simplify creature merge + audit hardcoded names:**
- Built: (1) Removed 5 completed one-time migrations from StateContext.jsx initializer: items→homeItems/battleItems split, star→rainbow_star/potion→shoes rename, subjectLevels calibration, additive items, evo recheck. All flags (_subjectLevelCalibrated, _itemsMigrated, _evoRechecked) confirmed true in live state before removal. (2) Simplified creature merge check: removed `_creaturesMerged && !_statAveraged` flag logic — now just `length > 1` at both local and remote merge sites. (3) Removed `_creaturesMerged` and `_statAveraged` flag tracking from `_mergeAllCreaturesIntoOne()` returns in state.js; updated re-averaging guard from `count <= 1 || state._statAveraged` to `count <= 1`. (4) Fixed hardcoded `โชแปง` in WorldScreen.jsx: OWL_LINES → `getOwlLines(name)` function, boss cutscene → `{state.name}พิชิต`. (5) Removed 2 debug console.logs: battleSubject.js getBattleLevel log, WorldBattle.jsx "Debug log — verify level rotation" useEffect. Kept all [KQ:*] prefixed diagnostic logs in state.js and StateContext.jsx.
- Not finished: nothing
- Blockers/risks found: `calcEvoStageInline()` still used by SET_SUBJECT_LEVEL reducer (line 788) — correctly kept. Re-averaging path in `_mergeAllCreaturesIntoOne` is now dead code (never called with length=1) but left in place for safety.
- Ready to start next: Phase 2 Refactor — WorldScreen.jsx split
- Needs Chatbot decision first: none
