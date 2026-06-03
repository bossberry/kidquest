# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-04 (Subject Readiness Report display)_

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

**What changed this session (Subject Readiness Report display):**

- **`src/components/Report.jsx`** — `computeReadiness(sessionLog, world)` function added. Filters last 10 `sessionLog` entries for each world (thai/math/eng), computes avgScore + goodRuns + completionRate, returns one of 4 states. `SubjectReadiness` component renders a parent-facing card with Thai-language color-coded badges. Observation footnote shown. No new state fields. No child UI.
- **`docs/CURRENT_STATE.md`** — Subject Readiness card added to Play Observation System section.
- **`docs/TASKS.md`** — Subject Readiness Report display marked done.
- **Build: ✅ zero errors.**

**Previous session (Subject Readiness Design — docs only):**
- Spec complete in `play-observation-system.md`. 4 states defined. No app code.

**Session before that (Phase D — app code):**
- `sessionLog` ring buffer, `shopV1` extended, `LOG_SESSION` reducer, Mission Analytics card in Report, play history timeline.

---

## Current Project State

KidQuest is a React 18 SPA (Vite, Vercel) — educational RPG for Thai children aged ~5+.

**Core loop:** Learn (quiz) → earn XP → egg evolves (7 stages × 50 XP) → hatch → get creature → battle AI opponents.

**What's fully working:**
- **Thai**: 5 levels (letter match, spell×3, word-order)
- **Math**: 9 levels — L0 Foundation, L1–L5 (add/sub/mixed), L6 (word problems), L7 (comparison), L8 (pattern AB)
- **English**: 4 levels (A–Z phonics, CVC words, sight words, sentence ordering)
- **Shop Mission** (`GameShop.jsx`): 4 phases / 6 Qs. `shopV1` with extended analytics (totalHints, totalDuration, phaseStats). Shop card on Home.
- **Play Observation System** (Phase D): `sessionLog` ring buffer (50 entries), `replayedImmediately` auto-computed, Mission Analytics card in Report, play history timeline (peer comparison removed).
- **Subject Readiness** (Phase D+, now implemented): `SubjectReadiness` component in `Report.jsx`. `computeReadiness()` derives state from last 10 `sessionLog` entries per subject at render time. 4 states with Thai labels. Observation footnote. No new state fields.
- Procedural egg + creature drawing on Canvas (egg algorithm LOCKED)
- Turn-based battle; challenger system every 15 rounds; AI_OPPONENTS all 6 tiers
- 5 minigames (EggRun, EggCatch, EggMemory, EggTower, EggFishing)
- Supabase auth + cloud sync; full guest mode
- Parent Report: overview, subject time, strengths, Mission Analytics, Subject Readiness, play history

**Not done:** payment, landing page, multi-child, PWA, Cooking/Garden missions.

---

## Active Tasks

**Now (highest priority):**
- **Play Shop Mission with Chopin** — validate fun and 2–3 min timing. Which steps feel clear? Which feel hard or boring? Report back to `GPT_NOTES.md`.
- **D0: Shop card UX audit** — Is the Shop card prominent, exciting, above the fold on Home? Document ideas only.

**Phase E (after play validation):**
- Shop Stretch (quantity difference + price concept) with mastery-gate UI
- ⚠️ Shop Stretch is independent of Subject Readiness — proceed after play validation

**Phase F / Content expansion (after Phase E):**
- **Cooking Mission MVP** — ⚠️ Do not design step sequence before consulting Subject Readiness data from real play sessions.

---

## Important Decisions

| Decision | Rule |
|----------|------|
| Egg algorithm | **LOCKED** — `eggAlgorithm.js` must not be modified |
| LocalStorage | Mandatory fallback — Supabase must never throw to user |
| Guest mode | Always works — full app without login |
| Child errors | Silent or friendly only — no stack traces |
| State blob | Full `state_json` in one Supabase row (not per-session rows) |
| Highest unlock level | **Not a readiness proxy** — use `sessionLog` derived Subject Readiness instead |
| Subject Readiness | Computed at render time from `sessionLog`. No new state. No AI. Now live in Report.jsx. |
| Mission content | Must follow readiness profile, not assumed level gates |

---

## Subject Readiness Reference

Computed from `sessionLog` per subject. Four states:

| State | Thai Label | Threshold |
|-------|------------|-----------|
| **Strong** | แข็งแรงมาก | avgScore ≥ 0.85 AND goodRuns ≥ 3 AND completionRate ≥ 0.80 (last 10 sessions) |
| **Comfortable** | กำลังมั่นใจ | avgScore ≥ 0.70 AND goodRuns ≥ 2 |
| **Exploring** | กำลังสำรวจ | Sessions exist but below Comfortable |
| **Not Ready** | ยังไม่มีข้อมูลพอ | No sessions for this world |

Full spec: `docs/research/observation/play-observation-system.md` → "Subject Readiness"

---

## Codebase Map (key files)

```
src/config/gameConfig.js        — ALL game content (~380 lines)
src/context/StateContext.jsx    — Global state + ACTIONS (includes LOG_SESSION, UPDATE_SHOP_V1)
src/lib/state.js                — defaultState() — sessionLog + shopV1 with analytics fields
src/components/Report.jsx       — Report: Overview + Subject time + Strengths + MissionAnalytics + SubjectReadiness + PlayHistory
src/games/GameShop.jsx          — Shop Mission 6 Qs — dispatches LOG_SESSION + extended UPDATE_SHOP_V1
src/games/GameThai.jsx          — Thai: useFinishRound dispatches LOG_SESSION
src/games/GameMath.jsx          — Math: dispatches LOG_SESSION in next() when done
src/games/GamePhonics.jsx       — English: all 4 game components dispatch LOG_SESSION
src/components/BattleScreen.jsx — Battle sim + animation
src/lib/eggAlgorithm.js         — LOCKED procedural egg drawing
```

---

## Risks / Unknowns

- **`nextAction` in sessionLog is always `null`** — tracking post-result navigation requires a navigation event system. Deferred. Field exists in schema for future use.
- **Subject Readiness display will show "ยังไม่มีข้อมูลพอ" for all subjects until Chopin plays** — expected behavior. Labels will update naturally as sessions accumulate.
- **Cooking Mission readiness dependency** — Cooking Mission step sequence must not be designed until Subject Readiness data from real play is available.
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail in Supabase — all progress in one blob per user

---

## Recommended Next Work

**GPT — next:**
1. **Play Shop Mission with Chopin** — play it together. Note which phases feel clear vs confusing, whether timing is right, whether Chopin replays voluntarily. Write to `GPT_NOTES.md`.
2. **D0: Shop card UX audit** — on the Home screen: Is the Shop card prominent? Above the fold? Visually exciting? Would a 5-year-old notice it? Write ideas to `GPT_NOTES.md`.
3. **Shop Stretch design review** — is the quantity difference question (แม่ต้องการ 3 ลูก มี 1 ลูก ต้องซื้อเพิ่มกี่ลูก?) at the right Early Grade 1 level? Write to `GPT_NOTES.md`.
4. **Thai Levels 6–8 content** — fruits, everyday objects, short action sentences for อนุบาล/early ป.1. Write to `GPT_NOTES.md`.
5. **Math Levels 9–10 content** — place value, counting to 100, early ป.1 stretch. Write to `GPT_NOTES.md`.

**Claude Code — after play validation:**
1. Phase E: Shop Stretch implementation + mastery-gate UI
2. (Later) Cooking Mission MVP — only after Subject Readiness data from real play accumulates
