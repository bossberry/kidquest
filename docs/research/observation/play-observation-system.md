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

## Subject Readiness

Subject Readiness is a **derived layer** of observation — computed at render time from `sessionLog`. It requires no new state fields, no AI, and no separate system. It belongs inside the Play Observation System.

### The problem with highest unlocked level

`subjectLevels[world]` (the highest unlocked level) is not a reliable signal of readiness.

A child may:
- unlock a level through a single lucky or random session
- show a level number that does not reflect sustained understanding
- appear "advanced" in the data without genuine comfort

A child may also:
- voluntarily replay easy levels — a sign of comfort, not regression
- achieve consistently high accuracy on levels below their unlock boundary
- show genuine readiness at a level the unlock number does not capture

**Subject Readiness ignores the unlock level entirely.** It is derived from recent play behavior.

### Signals used

| Signal | Source | Why it matters |
|--------|--------|----------------|
| Average score (last 10 sessions of this world) | `sessionLog` | Sustained accuracy is stronger evidence than one peak performance |
| Count of sessions with score ≥ 80% | `sessionLog` | Repeated competence across sessions matters more than best score |
| Completion rate | `sessionLog.completed` | A child who does not finish sessions is signalling something |
| Voluntary immediate replay | `sessionLog.replayedImmediately` | The strongest "I'm comfortable here" signal — the child chose to return |
| Session count for this world | `sessionLog` filtered by `world` | No data = no readiness to derive |

Signals **not used**:
- Response speed — never a readiness gate (see core principles)
- Best score alone — one high score does not establish readiness
- Highest unlocked level — see above

### Readiness states

Four states. Derived independently for each subject: Thai, Math, English.

| State | Meaning |
|-------|---------|
| **Strong** | Sustained high accuracy + repeated voluntary practice. The child owns this subject comfortably. |
| **Comfortable** | Good accuracy across multiple sessions. The child can handle this subject without anxiety. |
| **Exploring** | The child has attempted this subject but accuracy is still developing. Normal and expected. |
| **Not Ready** | No session data logged for this subject. The child has not played it. |

### Derivation (deterministic — no AI)

```
sessions = sessionLog
  .filter(s => s.world === world)
  .slice(-10)               // last 10 sessions only (recent behavior matters more)

if sessions.length === 0:
  → Not Ready

avgScore        = mean(s.score for s in sessions)
goodRuns        = count(s where s.score >= 0.80)
completionRate  = count(s where s.completed) / sessions.length

if avgScore >= 0.85 AND goodRuns >= 3 AND completionRate >= 0.80:
  → Strong

if avgScore >= 0.70 AND goodRuns >= 2:
  → Comfortable

otherwise:
  → Exploring
```

No persistence. Computed fresh on every render. No stored `readiness` field needed — `sessionLog` is the single source of truth.

### What Subject Readiness feeds into

1. **Parent Report** — show readiness per subject as a context signal alongside mission analytics. Framed positively, never as a judgment. "Thai: settling in well", "Math: building confidence", etc.
2. **Mission content weighting** — mission design can follow the readiness profile instead of assumed level thresholds. See `mission-system.md`.
3. **Cooking Mission design** — the Cooking Mission step sequence and subject mix should be designed by consulting the readiness profile, not the unlock number.

### What Subject Readiness does NOT do

- ❌ Does not gate any mission access — mastery signal (score ≥ 90% + wrong ≤ 1 + runs ≥ 2) still controls Stretch unlock
- ❌ Does not generate questions — content is pre-defined; readiness informs weighting only
- ❌ Does not build a skill tree, level map, or prerequisite chain
- ❌ Does not show readiness to the child in any form
- ❌ Does not require AI, a model, or inference beyond simple arithmetic
- ❌ Does not replace parent judgment — parents read the signal and decide

### Timing

Subject Readiness needs session data to be meaningful. Phase D deployed `LOG_SESSION` across all game result screens. Data begins accumulating from the first play session after Phase D.

Rough milestones:
- After ~3 sessions per subject: states become non-trivial (Exploring vs Not Ready)
- After ~10 sessions per subject: states are stable enough to inform mission design

**Readiness is read-only for now.** Observe it. Let data accumulate. Use it when designing the Cooking Mission step sequence.

---

## Peer Comparison Card

~~The current `Report.jsx` has a "เทียบกับเด็กวัยเดียวกัน" card that conflicts with the no-comparison principle.~~

**✅ Replaced in Phase D.** The peer-comparison card was replaced with a play-history timeline (last 10 sessions: world + date + completed/not completed). No peer reference remains.

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

## Phase Status

### ✅ Phase D (shipped 2026-06-03)

- D1: `sessionLog: []` + extended `shopV1` in `state.js`. `LOG_SESSION` reducer + extended `UPDATE_SHOP_V1` in `StateContext.jsx`.
- D2: `LOG_SESSION` dispatched from all result screens — `GameShop.jsx`, `GameThai.jsx` (via `useFinishRound`), `GameMath.jsx`, `GamePhonics.jsx` (all 4 game components).
- D3: `MissionAnalytics` card in `Report.jsx` — runs, avg score, avg duration, hints, per-phase difficulty, replay framing, nudge.
- D4: Peer-comparison card replaced with play-history timeline.

### Phase D+ (next documentation cycle)

- **Subject Readiness** — documented in this file. Computed from `sessionLog`. No new state. Available to render in `Report.jsx` once sessions accumulate (~10 per subject for reliable states).
- **Report.jsx Subject Readiness display** — add a Subject Readiness row to the existing Subject Time card, or a small new card. Implementation deferred until real session data exists.
- **Cooking Mission design** — use Subject Readiness profile to determine subject mix. Do not design Cooking Mission content before consulting readiness data from real play.

**Phase E (after play validation with Chopin):**
- Shop Stretch implementation + mastery-gate UI
- Cooking Mission MVP (readiness-informed step sequence)

Phase D ships independently of Phase E. Subject Readiness data accumulates during Phase E play.
