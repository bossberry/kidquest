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
