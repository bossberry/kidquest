# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-03 (Phase 3 — AI_OPPONENTS Tiers 2–5)_

**AI System:** GPT (research/curriculum/product) → `GPT_NOTES.md` → Claude Code (implementation) → `GPT_HANDOFF.md` → GPT. Claude Chatbot reads both sides for review. Chat history is NOT source of truth. See `docs/AI_SYSTEMS.md`.

---

## Latest Session Summary

**What changed this session (Phase 3):**
- `AI_OPPONENTS` tiers 2–5 added to `gameConfig.js` — all grades now have proper opponent data; no more silent fallback to tier 1
- Fixed `StateContext.jsx` challenger trigger: was `Math.min(grade, 1)` (always tier 1 for grade ≥ 1); now maps grade 0→T0, 1-2→T1, 3-4→T2, 5-6→T3

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

**Now:** _(nothing urgent — Phase 3 complete)_

**Next:**
- Curriculum content expansion (Thai L6+, English L5+, Math L9+)

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

1. **AI_OPPONENTS tiers 2–5** — what stats, names, and dialogue fit ป.3–ม.ปลาย age groups?
2. **Curriculum plan** — what should Thai/Math/English Levels 6–10 teach for ป.1–ป.3?
3. **Sound persistence** — is persisting sound preference high priority for the target child age?
4. **Monetisation** — validate 199 THB/month vs Thai edu-app competitors
5. Write findings to `docs/GPT_NOTES.md` for Claude Code to act on
