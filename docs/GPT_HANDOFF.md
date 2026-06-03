# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-03 (Docs Sync — Current State Audit)_

**AI System:** GPT (research/curriculum/product) → `GPT_NOTES.md` → Claude Code (implementation) → `GPT_HANDOFF.md` → GPT. Claude Chatbot reads both sides for review. Chat history is NOT source of truth. See `docs/AI_SYSTEMS.md`.

---

## Latest Session Summary

**What changed this session:**
- Docs-only sync: CURRENT_STATE.md, TASKS.md, CHANGELOG.md, GPT_HANDOFF.md updated to accurately reflect the codebase
- Key corrections: Math level count was wrong (6 → 9), visual models were undocumented, tier system details were missing

**No app code changed.**

---

## Current Project State

KidQuest is a React 18 SPA (Vite, Vercel) — educational RPG for Thai children aged ~5+.

**Core loop:** Learn (quiz) → earn XP → egg evolves (7 stages × 50 XP) → hatch → get creature → battle AI opponents.

**What's fully working:**
- **Thai**: 5 levels (letter match, spell×3, word-order)
- **Math**: 9 levels — L0 Foundation (count emoji, grade-0 only), L1–L5 (add/sub/mixed), L6 (word problems), L7 (comparison), L8 (pattern AB). Visual models for L1–L4: objects / ten-frame / cross-out.
- **English**: 4 levels (A–Z phonics, CVC words, sight words, sentence ordering)
- Procedural egg + creature drawing on Canvas (egg algorithm LOCKED — do not modify `eggAlgorithm.js`)
- Turn-based battle with Pokémon-style animation; challenger system every 15 rounds
- 6-tier system (อนุบาล → ม.ปลาย); creature stats derived from XP proportions + tier
- AI_OPPONENTS defined for tiers 0 and 1 only (normal + mini-boss + boss per tier)
- 5 minigames: EggRun (daily, 10 rounds/day req), EggCatch (2 eggs), EggMemory (4), EggTower (6), EggFishing (10)
- Supabase email/password auth + cloud sync; full guest mode (no login required)
- Parent Report tab (time, accuracy, per-subject breakdown)
- Phonics audio: 26 static `.m4a` files in `public/sounds/phonics/`

**Not done:** single child only (hardcoded `name:'โชแปง', grade:0`), no payment, no landing page, no multi-child.

---

## Active Tasks

**Now (highest priority):**
- Replace `alert()` in `Home.jsx` with friendly in-app lock UI for EggRun and minigames
- Add UI to change child name and grade (profile / onboarding screen)

**Next:**
- Add `AI_OPPONENTS` tiers 2–5 (currently only 0+1; older grades silently fall back to tier 1)
- Sound toggle that persists across sessions

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
src/config/gameConfig.js      — ALL game content (~380 lines) — edit here for content/levels
src/context/StateContext.jsx  — Global state + all ACTIONS (352 lines)
src/lib/eggAlgorithm.js       — LOCKED procedural egg drawing
src/lib/state.js              — loadState(), saveState(), defaultState()
src/games/GameThai.jsx        — Thai: Match + Spell + WordOrder (381 lines)
src/games/GameMath.jsx        — Math: 9 level types + VisualModel component (~270 lines)
src/games/GamePhonics.jsx     — English: 4 game modes + GameHeader (191 lines)
src/components/BattleScreen.jsx — Battle sim + animation (292 lines)
src/components/Home.jsx       — Home screen (has alert() issue) (176 lines)
```

Full map: `docs/PROJECT_MAP.md`
Architecture: `docs/CODEBASE_SUMMARY.md`

---

## Risks / Unknowns

- `alert()` in `Home.jsx` is child-unfriendly — known, not yet fixed
- `AI_OPPONENTS` only covers tiers 0–1; grades 2–6 silently fall back to tier 1 data
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail — all progress in one Supabase blob per user

---

## Recommended Next GPT Work

1. **Curriculum plan** — what should Thai/Math/English Levels 6–10 teach for ป.1–ป.3?
2. **AI_OPPONENTS tiers 2–5** — what stats/names/dialogue fit ป.3–ม.ปลาย age groups?
3. **Profile UX** — how should child name/grade onboarding work on first run?
4. **Monetisation** — validate 199 THB/month; compare to Thai edu-app competitors
5. Write findings to `docs/GPT_NOTES.md` for Claude Code to act on
