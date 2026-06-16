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
