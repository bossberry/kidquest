# Play Observation System

## Purpose

Collect play behavior passively and surface useful, non-judgmental insights to parents.

This system is for **understanding the child**, not judging the child.

Parents see patterns. Children see nothing new — no scores flashed at them, no rankings, no pressure.

---

## Core Principles

| Principle | What it means |
|-----------|---------------|
| Observation, not evaluation | Record what happened; never infer what the child "should" do |
| Replay is healthy | High replay count is always shown positively — engagement, not incompetence |
| No comparison | Never compare Chopin to other children, averages, or norms |
| No AI | Nudges are deterministic rules, not generated text |
| No pressure on child | None of this data is shown to the child in any form |
| Silent collection | No new UI for the child; data written during existing result-screen dispatches |

---

## What We Track

### Per-session (lightweight ring buffer, last 50 entries)

Each completed session appends one entry to `sessionLog[]`:

```js
{
  ts:       1748908800000,   // start time (unix ms)
  world:    'shop',          // 'thai' | 'math' | 'english' | 'shop' | ...
  missionId: 'shop-v1',      // null for subject levels
  level:    null,            // null for missions, 0–8 for subject levels
  dur:      145000,          // duration ms (end − start)
  score:    0.92,            // 0–1 (correct / total questions)
  wrong:    1,               // wrong answer count
  hints:    0,               // hint requests used
  completed: true,           // score >= completion threshold (0.80 for missions, 0.80 for levels)
  replayedImmediately: false, // true if child started another session of the same world within ~60 s
  nextAction: 'shop',        // 'shop'|'math'|'thai'|'english'|'eggRun'|'battle'|'quit' — first navigation after result screen
  phaseStats: [              // missions only; null for subject levels
    { phase: 1, subject: 'thai',    correct: 3, total: 3 },
    { phase: 2, subject: 'english', correct: 0, total: 1 },
    { phase: 3, subject: 'math',    correct: 1, total: 1 },
    { phase: 4, subject: 'thai',    correct: 1, total: 1 },
  ]
}
```

Ring buffer: capped at **50 entries**. When full, oldest entry is dropped. Approx. 3–5 KB maximum.

### Per-mission accumulation (in mission state, e.g. `shopV1`)

Add to existing `shopV1` (and future mission states):

```js
shopV1: {
  // existing
  bestScore:       0,
  runs:            0,
  mastered:        false,
  stretchUnlocked: false,

  // new
  totalHints:    0,        // sum of hints across all runs
  totalDuration: 0,        // sum of duration ms across all runs (for avg)
  phaseStats: {            // accumulated correct/total per phase (all runs combined)
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
    4: { correct: 0, total: 0 },
  }
}
```

Derived at render time (no separate stored fields):
- `avgScore` = sum of scores / runs
- `avgDuration` = totalDuration / runs
- `avgHints` = totalHints / runs
- `challengePhase` = phase with lowest `correct / total` ratio across all runs
- `easiestPhase` = phase with highest `correct / total` ratio

---

## State Additions

### `sessionLog` in `defaultState()`

```js
sessionLog: []   // ObsSession[]  — ring buffer, max 50
```

### New reducer action: `LOG_SESSION`

Appended to `StateContext.jsx`. Triggered from game result screens.

```js
case 'LOG_SESSION': {
  const entry = action.payload
  const next = [...state.sessionLog, entry].slice(-50)
  return { ...state, sessionLog: next }
}
```

### `UPDATE_SHOP_V1` extension

Extend the existing reducer to also update `totalHints`, `totalDuration`, `phaseStats`:

```js
case 'UPDATE_SHOP_V1': {
  const { score, wrong, hints, dur, phaseStats: ps } = action.payload
  const prev = state.shopV1
  const nextPhaseStats = { ...prev.phaseStats }
  ps?.forEach(({ phase, correct, total }) => {
    nextPhaseStats[phase] = {
      correct: (nextPhaseStats[phase]?.correct || 0) + correct,
      total:   (nextPhaseStats[phase]?.total   || 0) + total,
    }
  })
  return {
    ...state,
    shopV1: {
      ...prev,
      runs:          prev.runs + 1,
      bestScore:     Math.max(prev.bestScore, score),
      mastered:      prev.mastered || (score >= 0.9 && wrong <= 1 && prev.runs + 1 >= 2),
      totalHints:    prev.totalHints + (hints || 0),
      totalDuration: prev.totalDuration + (dur || 0),
      phaseStats:    nextPhaseStats,
    }
  }
}
```

---

## Where Data Is Written

| Event | Action dispatched | Writer location |
|-------|------------------|-----------------|
| Shop Mission result screen shown | `UPDATE_SHOP_V1` + `LOG_SESSION` | `GameShop.jsx` done-screen `useEffect` |
| Subject level result screen shown | `LOG_SESSION` only | `useFinishRound` hook (shared by GameThai/GameMath/GamePhonics) |

No changes to game flow or child-facing UI. Data is written silently on the existing result-screen render.

---

## Parent Report Design

### Section: Mission Analytics (new card in `Report.jsx`)

Appears only if `shopV1.runs > 0`.

```
🏪 Shop Mission
──────────────────────────────
Plays:            5
Average score:    92%
Average duration: 2 min 10 sec
Hints used:       1 total (avg 0.2 per play)

Phase difficulty:
  ✅ Thai matching      100%  (easiest)
  ⚠️  English vocab      60%  (current challenge area)
  ✅ Counting 1–5       100%
  ✅ Social phrase      100%

Replay behavior:
  Chopin chose to replay 3 times after first pass.
  Replaying is a great sign of engagement.

[nudge if applicable]
  Chopin is meeting the mastery signal — Shop Stretch is available.
```

### Replay behavior phrasing rules

| Condition | Shown as |
|-----------|---------|
| `runs === 1` | "Completed once" |
| `runs === 2` | "Played twice" |
| `runs >= 3 && mastered` | "Chose to replay [runs−1] times after first pass — strong engagement." |
| `runs >= 3 && !mastered` | "Played [runs] times — keeping at it." |

Replay is **never** framed as "still trying" or "struggling". If runs are high without mastery, it reads as persistence, not failure.

---

## Engagement Signals

Engagement signals reveal how much the child *wants* to be here — more honestly than scores.

| Signal | Field | Why it matters |
|--------|-------|----------------|
| Immediate replay | `replayedImmediately: true` | Child started the same world within ~60 s of finishing — the strongest "I liked it" signal |
| Voluntary replay count | `runs` (per-mission state) | High run count without external pressure = genuine enjoyment |
| Next action after completion | `nextAction` | Where the child chose to go (`'shop'`, `'math'`, `'thai'`, `'english'`, `'eggRun'`, `'battle'`, `'quit'`) — intent after a session is a proxy for motivation |
| Session duration | `dur` | Longer sessions suggest sustained attention, not just a quick tap-through |

**Engagement signals are more important than scores.**

A child who replays a session three times with 70% accuracy is more engaged — and likely learning more — than a child who completes once with 95% and quits. The parent report must reflect this hierarchy: engagement is highlighted first, accuracy is context.

`nextAction` is especially valuable for product decisions: if most children immediately visit the shop after a math session, that informs where to invest next. This signal is never shown to parents as a number — it informs how the parent report is written.

---

### Nudge rules (deterministic — no AI)

These are parent-facing suggestions only. Never shown to child.

| Condition | Nudge text |
|-----------|-----------|
| `mastered === true && !stretchUnlocked` | "Chopin is meeting the mastery signal. Shop Stretch is waiting when you're ready to try it." |
| `avgScore >= 0.90 && runs >= 3` | "Chopin is consistently strong here." |
| `challengePhaseAcc < 0.60 && runs >= 2` | "English vocabulary is the current challenge area. Replaying the Shop Mission or the English subject levels will help naturally." |
| `runs === 1 && completed` | "Great first run. A few more plays will show a clearer picture." |

Rules are evaluated in priority order. Show maximum one nudge. No stacking.

### What nudges must NOT say

- ❌ Any number that sounds like a grade or score compared to a norm
- ❌ "Chopin is behind / ahead of average"
- ❌ "You should practice more"
- ❌ "Chopin failed" / "did not pass" — use "completed session" language only
- ❌ Anything generated by AI

---

## Existing Report Section: Peer Comparison

The current `Report.jsx` has a "เทียบกับเด็กวัยเดียวกัน" (compare with peers) card that compares total minutes to a "research average for 5–6 year olds."

This card conflicts with the no-comparison principle.

**Recommendation for Phase D:** Replace this card with a "Play History" card showing a simple timeline of recent sessions (world + date + completed/not completed), with no peer reference. The spirit of encouragement is preserved; the comparison framing is removed.

This is not a blocker for Phase D implementation — it can be addressed in the same PR or deferred.

---

## Storage Budget

| Data | Max size |
|------|---------|
| `sessionLog` (50 entries × ~150 bytes) | ~7.5 KB |
| `shopV1` additions (~5 fields + 4 phase stats) | ~200 bytes |
| Per future mission (same shape) | ~200 bytes each |
| Total new state after 5 missions | ~9 KB |

Current `kq_state` blob is well under 50 KB. No storage risk.

---

## What We Do NOT Track

| Rejected field | Reason |
|----------------|--------|
| Response speed (ms per question) | Speed is never a gate; tracking it adds anxiety without insight |
| Attempts before correct (beyond wrong count) | Wrong count is enough; per-attempt trace is invasive |
| Daily/weekly streaks | Creates obligation anxiety ("I have to play today") |
| Comparison to other children | No multi-child profiles; violates no-comparison principle |
| Time of day played | Not relevant to learning; privacy-adjacent |
| Session abandonment rate | Abandoned sessions have no end time; do not infer |

---

## What We Do NOT Show Parents

| Rejected display | Reason |
|-----------------|--------|
| Percentile rankings | Comparison framing |
| Grade labels (A/B/C) | Evaluation, not observation |
| "Chopin is behind / ahead" | Comparison and pressure |
| Red indicators on low-score phases | Judgment framing; use neutral language |
| Session counts as a demand ("only 2 sessions this week") | Guilt framing |

---

## Explicit Non-Goals

- ❌ **No AI recommendations** — nudges are deterministic rules, not generated text
- ❌ **No Supabase sessions table yet** — that belongs in Later (see `TASKS.md`)
- ❌ **No child-facing observation UI** — children see nothing from this system
- ❌ **No cross-child analytics** — single-child design only
- ❌ **No export or sharing** — parent report is in-app only
- ❌ **No learning path generation** — parents read the report and decide; the app does not direct

---

## Implementation Scope (Phase D)

Estimated code changes: small and contained.

### New / changed files

| File | Change |
|------|--------|
| `src/lib/state.js` | Add `sessionLog: []` and `phaseStats` + `totalHints` + `totalDuration` to `shopV1` in `defaultState()` |
| `src/context/StateContext.jsx` | Add `LOG_SESSION` reducer; extend `UPDATE_SHOP_V1` to write hints/duration/phaseStats |
| `src/games/GameShop.jsx` | Dispatch `LOG_SESSION` and updated `UPDATE_SHOP_V1` payload on done screen |
| `src/games/GameThai.jsx` / `GameMath.jsx` / `GamePhonics.jsx` | Dispatch `LOG_SESSION` from `useFinishRound` (or the result screen useEffect) |
| `src/components/Report.jsx` | Add Mission Analytics card; optionally replace peer-comparison card with play history |

### No new components needed for MVP

All report UI fits inside the existing `Report.jsx` card pattern.

---

## Phase D+ Recommendation

**Yes, this should become Phase D.**

Reasons:
1. The data collection is small, non-disruptive, and can be implemented before or alongside play validation with Chopin.
2. Starting observation *before* the next content expansion means data accumulates from the beginning — avoiding the "no history to show" problem when parents first open the report.
3. It does not depend on Shop Stretch or new missions — it runs in parallel to the validation phase.
4. The peer-comparison card replacement is a quick win on an existing issue.

**Suggested Phase D scope:**
- D1: Add `LOG_SESSION` + extend `UPDATE_SHOP_V1` (state + reducer, ~50 lines)
- D2: Dispatch `LOG_SESSION` from all game result screens (~10 lines each, 3 files)
- D3: Add Mission Analytics card to `Report.jsx` with phase difficulty + nudge rules
- D4 (optional, same PR): Replace peer-comparison card with play history timeline

**Phase E (after play validation with Chopin):**
- Shop Stretch implementation + mastery-gate UI
- Cooking Mission MVP

Phase D can ship independently of Phase E.
