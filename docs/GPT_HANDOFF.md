# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-03 (Phase D: Play Observation System — app code)_

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

**What changed this session (Phase D: Play Observation System):**

Phase D fully implemented and committed. All 4 sub-tasks done:

- **D1**: `sessionLog: []` + extended `shopV1` (totalHints, totalDuration, phaseStats) in `state.js`. `LOG_SESSION` reducer + extended `UPDATE_SHOP_V1` in `StateContext.jsx`.
- **D2**: `LOG_SESSION` dispatched from all game result screens — `GameShop.jsx` (with per-phase stats + duration), `GameThai.jsx` (via extended `useFinishRound` hook), `GameMath.jsx` (in `next()` when done), `GamePhonics.jsx` (all 4 game components: PhonicsGame, CVCGame, SightGame, SentenceGame).
- **D3**: `MissionAnalytics` component added to `Report.jsx` — shows runs, avg score, avg duration, hints, per-phase difficulty (✅/⚠️ with challenge/easiest labels), replay behavior text (framing replays positively), one deterministic nudge.
- **D4**: Peer-comparison card ("เทียบกับเด็กวัยเดียวกัน") replaced with play-history timeline (last 10 sessions: world label + date + ✅/❌ completed).

Build: ✅ zero errors (verified with `npm run build`).

**Previous session (docs only — workflow audit):**
- Found Phase C uncommitted (now confirmed it was committed in `feat: Shop Mission MVP + Phase B–D docs`).
- Docs patched: `GPT_NOTES.md`, `mission-system.md`, `TASKS.md`.

---

## Current Project State

KidQuest is a React 18 SPA (Vite, Vercel) — educational RPG for Thai children aged ~5+.

**Core loop:** Learn (quiz) → earn XP → egg evolves (7 stages × 50 XP) → hatch → get creature → battle AI opponents.

**What's fully working:**
- **Thai**: 5 levels (letter match, spell×3, word-order)
- **Math**: 9 levels — L0 Foundation (count emoji, grade-0 only), L1–L5 (add/sub/mixed), L6 (word problems), L7 (comparison), L8 (pattern AB). Visual models for L1–L4.
- **English**: 4 levels (A–Z phonics, CVC words, sight words, sentence ordering)
- **Shop Mission** (`GameShop.jsx`): 4 phases / 6 Qs. `shopV1` state with extended analytics fields. Shop card on Home.
- **Play Observation System** (Phase D): `sessionLog` ring buffer (50 entries), `replayedImmediately` auto-computed, Mission Analytics card in Report, play history timeline.
- Procedural egg + creature drawing on Canvas (egg algorithm LOCKED)
- Turn-based battle with Pokémon-style animation; challenger system every 15 rounds
- 6-tier system; **AI_OPPONENTS all 6 tiers (0–5)**
- 5 minigames: EggRun (daily), EggCatch (2), EggMemory (4), EggTower (6), EggFishing (10)
- Supabase auth + cloud sync; full guest mode
- Parent Report tab with Mission Analytics + play history
- **ProfileModal**: child name and grade editable via 👤 button
- **No alert() calls** — all lock messages are friendly toasts
- **Sound persists** across reloads (`kq_sound` localStorage key)
- **XP boost badge** in header shows live countdown when star item is active

**Not done:** single child per account, no payment, no landing page, no multi-child, no PWA.

---

## Active Tasks

**Now (highest priority):**
- **Play Shop Mission with Chopin** — validate fun and 2–3 min timing. Check: Thai matching clear? Emoji choices obvious? Social phrase step lands? Timing right?
- **D0: Shop card UX audit** — review Home screen. Is Shop card prominent, exciting, above the fold? Document ideas only.

**Phase E (after play validation with Chopin):**
- Shop Stretch (quantity difference + price concept) with mastery-gate UI
- Cooking Mission MVP (after Shop Core + Stretch confirmed)

**Later:**
- Thai Levels 6+ / Math Levels 9+ / English Levels 5+ content expansion
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
src/context/StateContext.jsx    — Global state + ACTIONS (now includes LOG_SESSION)
src/lib/eggAlgorithm.js         — LOCKED procedural egg drawing
src/lib/state.js                — loadState(), saveState(), defaultState() (sessionLog + shopV1 extended)
src/components/ProfileModal.jsx — child name + grade editor
src/components/Home.jsx         — Home screen + profile button
src/components/Report.jsx       — Report: Overview + Subject time + Strengths + MissionAnalytics + PlayHistory
src/games/GameThai.jsx          — Thai: Match + Spell + WordOrder (useFinishRound dispatches LOG_SESSION)
src/games/GameMath.jsx          — Math: 9 level types + VisualModel (dispatches LOG_SESSION on done)
src/games/GamePhonics.jsx       — English: 4 game modes (all dispatch LOG_SESSION)
src/games/GameShop.jsx          — Shop Mission 6 Qs (dispatches LOG_SESSION + extended UPDATE_SHOP_V1)
src/components/BattleScreen.jsx — Battle sim + animation
```

---

## Risks / Unknowns

- **`nextAction` field in sessionLog is always `null`** — tracking where the child navigates after a result screen requires a navigation event system. Not implemented yet. The field exists in the schema for future use.
- Tier 4 and 5 opponents exist but are unreachable in current game (max grade 6 → tier 3); reserved for future ม.ต้น/ม.ปลาย
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail in Supabase — all progress in one blob per user (still true; `sessionLog` is part of the state blob)

---

## Recommended Next Work

**Stay within Year 1 scope (Kindergarten + Early Grade 1 only).**

**GPT — next:**
1. **Validate Shop Mission with Chopin** — play it together. Note which steps feel clear, which feel hard or boring. Feed back to Claude Code as notes in `GPT_NOTES.md`.
2. **D0: Shop card UX audit** — before next implementation cycle, review Home screen. Can Chopin find the Shop card easily? Is it visually prominent? Would a first-time child notice it? Write ideas to `GPT_NOTES.md`.
3. **Shop Stretch design review** — is the quantity difference question at the right level for early Grade 1? Write to `GPT_NOTES.md`.
4. **Thai Levels 6–8 content** — fruits, everyday objects, short action sentences for อนุบาล/early ป.1? Write to `GPT_NOTES.md`.
5. **Math Levels 9–10 content** — place value? Counting to 100? Write to `GPT_NOTES.md`.

**Claude Code — after GPT play validation:**
1. **Phase E: Shop Stretch** — implement quantity difference + price concept questions with mastery gate.
