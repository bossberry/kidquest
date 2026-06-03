# Session Summary — 2026-06-03 (Mission System Design)

## What Changed
- Created `docs/research/missions/README.md` — index + recommended order + why shop first
- Created `docs/research/missions/mission-system.md` — core design: types, mechanics, rewards, replay, data structure, what not to build
- Created `docs/research/missions/shop-mission.md` — first mission MVP design with full flow, data structure, Thai/Math/English/GK content
- Created `docs/research/missions/cooking-mission.md` — second mission design (after shop)
- Created `docs/research/missions/garden-mission.md` — third mission design with daily-habit loop notes
- Updated `docs/RESEARCH_INDEX.md` — missions section added
- Updated `docs/GPT_NOTES.md` — research notes, curriculum decisions, product decisions, architecture suggestions, rejected ideas, open questions for Claude
- Updated `docs/TASKS.md` — Shop Mission MVP added to Now; cooking/garden/content expansion to Next

## Files Changed
`docs/research/missions/` (5 new files), `docs/RESEARCH_INDEX.md`, `docs/GPT_NOTES.md`, `docs/TASKS.md`, `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md`

## Current Status
Mission system fully designed. No app code changed. Shop Mission MVP is the next coding task. All three missions use existing mechanics — only ~2 new files needed (`missionConfig.js` + `MissionScreen.jsx`).

## Next Suggested Task
Implement Shop Mission MVP: read `docs/research/missions/shop-mission.md`, create `src/config/missionConfig.js` and `src/games/MissionScreen.jsx`, add mission cards to Home screen, add `completedMissions` state field and `FINISH_MISSION` action.
