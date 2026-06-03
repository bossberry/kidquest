# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-03 (Phase 2 UX — Sound Persist + XP Boost Indicator)_

**AI System:** GPT (research/curriculum/product) → `GPT_NOTES.md` → Claude Code (implementation) → `GPT_HANDOFF.md` → GPT. Claude Chatbot reads both sides for review. Chat history is NOT source of truth. See `docs/AI_SYSTEMS.md`.

---

## Latest Session Summary

**What changed this session (Phase 2 UX):**
- Sound preference now persists across reloads via `localStorage` key `kq_sound` (device-local, not in state blob)
- `XpBoostBadge` component added to Home header — shows amber `⭐ ×2 M:SS` countdown when star item active; self-managing 1s timer; hides when boost expires

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
- 6-tier system; AI_OPPONENTS tiers 0 and 1 only
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

**Now:** _(nothing urgent — Phase 2 UX complete)_

**Next:**
- Add `AI_OPPONENTS` tiers 2–5 (only 0+1 defined; older grades fall back to tier 1)

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

- `AI_OPPONENTS` only covers tiers 0–1; grades 2–6 silently fall back to tier 1 data
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail — all progress in one Supabase blob per user

---

## Recommended Next GPT Work

1. **AI_OPPONENTS tiers 2–5** — what stats, names, and dialogue fit ป.3–ม.ปลาย age groups?
2. **Curriculum plan** — what should Thai/Math/English Levels 6–10 teach for ป.1–ป.3?
3. **Sound persistence** — is persisting sound preference high priority for the target child age?
4. **Monetisation** — validate 199 THB/month vs Thai edu-app competitors
5. Write findings to `docs/GPT_NOTES.md` for Claude Code to act on
