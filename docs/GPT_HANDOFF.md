# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-03 (Mission System Design)_

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

**What changed this session (Mission System Design — docs only, no code):**
- Created `docs/research/missions/` — mission-system.md, shop-mission.md, cooking-mission.md, garden-mission.md
- Shop mission: 6-step MVP design with full data structure. Thai/Math/English/GK integrated in one shop visit. Kindergarten core + Grade 1 stretch.
- Mission system: 3 types (Progression/Review/Challenge), reuses existing mechanics, `missionConfig.js` + `MissionScreen.jsx` only new code needed
- Updated `GPT_NOTES.md` with research decisions, architecture suggestions, rejected ideas, open questions for Claude
- **Next coding task: Shop Mission MVP** — see `docs/research/missions/shop-mission.md`

---

## Current Project State

KidQuest is a React 18 SPA (Vite, Vercel) — educational RPG for Thai children aged ~5+.

**Core loop:** Learn (quiz) → earn XP → egg evolves (7 stages × 50 XP) → hatch → get creature → battle AI opponents.

**What's fully working:**
- **Thai**: 5 levels (letter match, spell×3, word-order)
- **Math**: 9 levels — L0 Foundation (count emoji, grade-0 only), L1–L5 (add/sub/mixed), L6 (word problems), L7 (comparison), L8 (pattern AB). Visual models for L1–L4.
- **English**: 4 levels (A–Z phonics, CVC words, sight words, sentence ordering)
- Procedural egg + creature drawing on Canvas (egg algorithm LOCKED)
- Turn-based battle with Pokémon-style animation; challenger system every 15 rounds
- 6-tier system; **AI_OPPONENTS all 6 tiers (0–5)** — no grade falls back to wrong data
- 5 minigames: EggRun (daily), EggCatch (2), EggMemory (4), EggTower (6), EggFishing (10)
- Supabase auth + cloud sync; full guest mode
- Parent Report tab
- **ProfileModal**: child name and grade now editable via 👤 button in Home header
- **No alert() calls remain** — all lock messages are friendly toasts
- **Sound persists** across reloads (`kq_sound` localStorage key)
- **XP boost badge** in header shows live countdown when star item is active

**Not done:** single child per account, no payment, no landing page, no multi-child, no PWA.

---

## Active Tasks

**Now (highest priority):**
- **Implement Shop Mission MVP** — design is complete, ready to code. See `docs/research/missions/shop-mission.md`. Requires: `missionConfig.js`, `MissionScreen.jsx`, mission cards on Home, `completedMissions` state, `FINISH_MISSION` action.

**Next:**
- Review shop mission with Chopin → confirm fun before cooking/garden
- Cooking Mission MVP (after shop confirmed)
- Thai Levels 6+ / Math Levels 9+ / English Levels 5+ content expansion

**Later:**
- Multi-child profiles; per-session Supabase logging; payment (199 THB/month); landing page; PWA

---

## Important Decisions

| Decision | Rule |
|----------|------|
| Egg algorithm | **LOCKED** — `eggAlgorithm.js` must not be modified |
| LocalStorage | Mandatory fallback — Supabase must never throw to user |
| Guest mode | Always works — full app without login |
| Child errors | Silent or friendly only — no stack traces |
| State blob | Full `state_json` in one Supabase row (not per-session rows) |
| SPEC.md | **Deprecated** — describes old HTML prototype, ignore it |

---

## Codebase Map (key files)

```
src/config/gameConfig.js        — ALL game content (~380 lines)
src/context/StateContext.jsx    — Global state + ACTIONS (355 lines)
src/lib/eggAlgorithm.js         — LOCKED procedural egg drawing
src/lib/state.js                — loadState(), saveState(), defaultState()
src/components/ProfileModal.jsx — NEW: child name + grade editor
src/components/Home.jsx         — Home screen + profile button (no alert)
src/games/GameThai.jsx          — Thai: Match + Spell + WordOrder (381 lines)
src/games/GameMath.jsx          — Math: 9 level types + VisualModel (~270 lines)
src/games/GamePhonics.jsx       — English: 4 game modes (191 lines)
src/components/BattleScreen.jsx — Battle sim + animation (292 lines)
```

---

## Risks / Unknowns

- Tier 4 and 5 opponents exist but are unreachable in current game (max grade 6 → tier 3); reserved for future ม.ต้น/ม.ปลาย curriculum
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail — all progress in one Supabase blob per user

---

## Recommended Next GPT Work

**Stay within Year 1 scope (Kindergarten + Early Grade 1 only).**

1. **Review shop mission design** in `docs/research/missions/shop-mission.md` — is the content right for Chopin? Are the Thai item names good? Is the flow natural?
2. **Thai Levels 6–8 content** — what อนุบาล/early ป.1 Thai content comes next? Fruits, everyday objects, short action sentences? Write decisions to `GPT_NOTES.md`.
3. **Math Levels 9–10 content** — place value? Counting to 100? What mechanic variations work? Write to `GPT_NOTES.md`.
4. **Monetisation timing** — when is the app ready to share? What does the minimum viable parent experience look like?
5. Write all findings to `docs/GPT_NOTES.md` for Claude Code to act on
