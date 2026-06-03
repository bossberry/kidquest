# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-03 (Workflow audit + architecture language patch — docs only)_

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

**What changed this session (workflow audit + architecture language patch — docs only):**

⚠️ **Critical finding: Phase C app code is uncommitted and not deployed.** `GameShop.jsx`, `Home.jsx`, `StateContext.jsx`, `GameScreen.jsx`, `state.js` are all sitting uncommitted. Production is still on Phase 3 (no Shop Mission). Docs describe Phase C as complete, but the code hasn't been pushed.

**Immediate action required:** Run `npm run build`, commit Phase C app files, push to main to trigger Vercel deploy, then verify production.

**Docs fixed this session:**
- **`docs/GPT_NOTES.md`** — removed language implying `MissionScreen.jsx` and `missionConfig.js` are current architecture. Both are future targets (after 2+ missions). Current routing: `GameScreen.jsx` → `GameShop.jsx`.
- **`docs/research/missions/mission-system.md`** — Mission Access Points navigation section now distinguishes current implementation (GameShop.jsx) from future target (MissionScreen.jsx).
- **`docs/TASKS.md`** — Phase C commit added as critical Now task. Development workflow documented.
- **`docs/GPT_HANDOFF.md`** — this file updated.
- **`docs/SESSION_SUMMARY.md`** — new entry.
- **`docs/CHANGELOG.md`** — new entry.

**Previous session (Phase D wording patch):**
- `play-observation-system.md` — `passed` → `completed`; `hardestPhase` → `challengePhase`; engagement signals section added; D0 added.

**Two sessions back (Phase D design):**
- `docs/research/observation/play-observation-system.md` CREATED — full design spec.

**Phase C (app code — not yet committed):**
- `src/games/GameShop.jsx` CREATED — 4 phases / 6 questions. Build claimed to pass. `shopV1` state + `UPDATE_SHOP_V1` reducer. Shop card on Home.

---

## Current Project State

KidQuest is a React 18 SPA (Vite, Vercel) — educational RPG for Thai children aged ~5+.

**Core loop:** Learn (quiz) → earn XP → egg evolves (7 stages × 50 XP) → hatch → get creature → battle AI opponents.

**What's fully working:**
- **Thai**: 5 levels (letter match, spell×3, word-order)
- **Math**: 9 levels — L0 Foundation (count emoji, grade-0 only), L1–L5 (add/sub/mixed), L6 (word problems), L7 (comparison), L8 (pattern AB). Visual models for L1–L4.
- **English**: 4 levels (A–Z phonics, CVC words, sight words, sentence ordering)
- **Shop Mission** (`GameShop.jsx`): 4 phases / 6 Qs — Phase 1 Thai matching × 3, Phase 2 English vocab × 1, Phase 3 counting 1–5 × 1, Phase 4 social phrase × 1. `shopV1` state persisted. Mastery signal tracked. Shop card on Home.
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
- **[CRITICAL] Commit + push Phase C app code** — `GameShop.jsx`, `Home.jsx`, `StateContext.jsx`, `GameScreen.jsx`, `state.js` are uncommitted. Run `npm run build` → commit → `git push origin main` → verify production URL shows Shop card.
- **Play Shop Mission with Chopin** — validate fun and 2–3 min timing. Check: does the Thai matching feel clear? Are emoji choices obvious? Does the social phrase step land? (Requires Phase C deployed first.)

**Phase D (can start independently of play validation):**
- D0: Shop card UX audit — is the card prominent, exciting, above the fold? Document ideas only, no implementation.
- D1: `LOG_SESSION` reducer + extend `UPDATE_SHOP_V1` in state.js / StateContext.jsx
- D2: Dispatch `LOG_SESSION` from all game result screens (GameShop + useFinishRound)
- D3: Mission Analytics card in Report.jsx (avg score, avg duration, phase difficulty, replay framing, nudge)
- D4 (optional): Replace peer-comparison card with play-history timeline

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
src/context/StateContext.jsx    — Global state + ACTIONS (355 lines)
src/lib/eggAlgorithm.js         — LOCKED procedural egg drawing
src/lib/state.js                — loadState(), saveState(), defaultState()
src/components/ProfileModal.jsx — NEW: child name + grade editor
src/components/Home.jsx         — Home screen + profile button (no alert)
src/games/GameThai.jsx          — Thai: Match + Spell + WordOrder (381 lines)
src/games/GameMath.jsx          — Math: 9 level types + VisualModel (~270 lines)
src/games/GamePhonics.jsx       — English: 4 game modes (191 lines)
src/games/GameShop.jsx          — NEW: Shop Mission 6 Qs, shopV1 tracking (~150 lines)
src/components/BattleScreen.jsx — Battle sim + animation (292 lines)
```

---

## Risks / Unknowns

- **⚠️ Phase C app code uncommitted** — `GameShop.jsx` and related changes not yet pushed to git. Production is on Phase 3. Docs and code are out of sync.
- **No build-verify-deploy workflow enforced** — sessions were committing docs without running `npm run build` or verifying production. Expected workflow: build → commit → push → verify.
- Tier 4 and 5 opponents exist but are unreachable in current game (max grade 6 → tier 3); reserved for future ม.ต้น/ม.ปลาย curriculum
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail — all progress in one Supabase blob per user

---

## Recommended Next Work

**Stay within Year 1 scope (Kindergarten + Early Grade 1 only).**

**Claude Code — do first:**
1. **Commit + deploy Phase C** — `npm run build` → commit app files → push → verify production shows Shop card.

**GPT — after deploy:**
1. **Validate Shop Mission with Chopin** — play it together. Note which steps feel clear, which feel hard or boring. Feed back to Claude Code as notes in `GPT_NOTES.md`.
2. **D0: Shop card UX audit** — before implementation, review Home screen. Questions: Can Chopin easily find the Shop card? Is it visually prominent? Does it look exciting? Is it above the fold? Would a first-time child notice it? Write ideas to `GPT_NOTES.md` — do not implement yet.
3. **Play Observation System is now final** — wording patched (`completed`, `challengePhase`, "current challenge area", engagement signals, D0). Implementation can begin with D1.
4. **Shop Stretch design review** — is the quantity difference question (`แม่ต้องการ 3 ลูก มี 1 ลูก ต้องซื้อเพิ่มกี่ลูก?`) at the right level? Is the price/addition step appropriately early Grade 1? Write to `GPT_NOTES.md`.
5. **Thai Levels 6–8 content** — what อนุบาล/early ป.1 Thai content comes next? Fruits, everyday objects, short action sentences? Write to `GPT_NOTES.md`.
6. **Math Levels 9–10 content** — place value? Counting to 100? Mechanic variations? Write to `GPT_NOTES.md`.
7. Write all findings to `docs/GPT_NOTES.md` for Claude Code to act on.
