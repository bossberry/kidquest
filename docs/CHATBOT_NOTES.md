# CHATBOT_NOTES.md
_Last updated: 2026-06-16_
_Written by: Claude Chatbot | For: Claude Code_

## Pending implementation

(empty — no pending tasks)

## Claude Code Handoff
_(Claude Code appends here after each session)_

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
