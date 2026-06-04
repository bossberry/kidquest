# Subject Progression — Source of Truth

_Created: 2026-06-04_
_Status: Design philosophy locked. Implementation in subject level systems across `GameThai.jsx`, `GameMath.jsx`, `GamePhonics.jsx`._

---

## Core Philosophy

Subjects are the primary progression axis in KidQuest.

The three subjects are:
- **Thai** — reading, spelling, vocabulary, sentence structure
- **Math** — counting, addition, subtraction, patterns, comparison
- **English** — phonics, sight words, vocabulary, sentence ordering

Mission systems (Shop, Cooking, Garden) are secondary. They integrate subject skills into applied contexts, but they do not replace or override subject progression. A child advances by learning subjects. Missions are experiences that reinforce and celebrate that learning.

Learning progression should feel encouraging, not punishing. The system exists to help a child feel capable — not to measure deficiencies.

---

## Progression Flow

```
Play a level
  → Score answers
    → Earn XP
      → Replay if desired
        → Reach mastery signal (≥80% accuracy)
          → Unlock next level
```

Replay is always valid at any step. A child who replays the same level five times before moving on is doing exactly the right thing. Repetition is how children build confidence.

---

## Unlock Philosophy

### Current thresholds

| Score | Outcome |
|-------|---------|
| < 70% | Try again — no unlock, gentle encouragement |
| 70–79% | Soft pass — encouragement, partial reward, no unlock |
| ≥ 80% | Unlock next level |
| ≥ 90% | Mastery signal — fanfare, full reward |

### Why these thresholds

**Children should not feel blocked.** A hard 80% gate without a soft pass creates frustration. A child who scores 72% did real learning — they should be acknowledged, not silently rejected. The soft pass (70%) provides this acknowledgement while keeping the unlock meaningful.

**80% is the unlock, not 100%.** Perfection is not required to progress. A child who gets 4 out of 5 correct has understood the material well enough to meet what comes next.

**Mastery at 90%+ represents confidence, not perfection.** A child who consistently scores 90%+ has internalized the skill. The fanfare is a celebration of that confidence, not a reward for an impossible standard.

These thresholds align with the mission system unlock rules and the Subject Readiness framework. Consistency across the app matters — the child should never encounter different standards for different parts of the system.

---

## Replay Philosophy

Replay is never punished.

Children may:
- Replay favorite levels they find enjoyable
- Revisit easier levels to strengthen confidence
- Return to earlier material after time away
- Practice a level many times before feeling ready to move on

None of these behaviors are problems. They are normal learning behaviors for a 5-year-old.

The progression system should never:
- Display a "you already completed this" message with negative framing
- Reduce rewards for replaying a level below mastery
- Remove access to completed levels
- Pressure a child to move forward before they feel ready

Replay XP is real XP. A child earns through replay, and that XP feeds egg progression and battle stats. Replay is part of the reward loop, not a workaround of it.

---

## Mastery Philosophy

### What mastery is

- **Confidence** — the child answers with assurance, not guessing
- **Consistency** — the child performs well across multiple sessions, not just one lucky run
- **Enjoyment** — the child engages willingly and returns to the subject

### What mastery is not

- **Speed** — response time is never a gate. Children who think slowly are not penalized.
- **Competition** — mastery is personal. No comparison with other children, averages, or "typical" progress.
- **Perfection** — mastery does not require 100%. It requires consistent good-enough performance.

The system observes mastery through session logs and accuracy patterns (see `play-observation-system.md`). It does not announce "you are not yet mastered" to the child. Mastery signals are for the parent Report, not for child-facing UI.

---

## Stretch Philosophy

Each subject level has up to three layers:

| Layer | Requirement | Access |
|-------|-------------|--------|
| Core | Kindergarten baseline | Always available |
| Stretch | Early Grade 1 extension | Unlocked after Core mastery signal |
| Challenge | Early Grade 1 harder | Unlocked after Stretch mastery signal |

Core levels remain playable forever. A child who unlocks Stretch and Challenge can still return to Core at will.

Stretch and Challenge are bonuses. They are optional extensions for children who are ready. They are never requirements for progression, never gated by time, and never removed after unlock.

The mastery signal for Stretch/Challenge unlock requires: accuracy ≥ 90% AND wrong answers ≤ 1 AND ≥ 2 completed runs. This is deliberately harder than the base unlock threshold — Stretch is for children who have clearly internalized the Core material.

---

## Subject Independence

Thai, Math, and English progress independently.

A child does not need equal levels across all three subjects. Different strengths are expected and normal. A child who is ahead in Thai and exploring Math is not behind — they are a Thai-strong learner, and the system should celebrate that.

No subject is more important than another. The weighted stat formula for battle creatures reflects this — every subject contributes to every stat; no subject exclusively owns a stat.

Subject independence means:
- The app never pressures a child to balance subjects artificially
- The Adventure Director (Home 2.0) recommends the weakest subject for balance, but this is a gentle suggestion, not a mandate
- A child who ignores the recommendation and plays their favorite subject anyway is doing nothing wrong

---

## Relationship to Observation and Readiness

The highest unlocked level is not a reliable proxy for readiness.

A child who unlocked Level 5 in Thai but hasn't touched it in three weeks, and is scoring 65% on Level 3 today, is not "Level 5 ready." The unlock reflects where they once were, not where they are now.

Readiness comes from:
- **Session logs** — recent play behavior (last 10 sessions per subject)
- **Replay behavior** — how often they return, what they choose
- **Accuracy trends** — are scores going up, stable, or declining?
- **Engagement** — completion rate, session length

These signals are captured by the Play Observation System and surfaced in the Subject Readiness component in the parent Report. See `docs/research/observation/play-observation-system.md` for the full derivation logic.

Mission content should follow the readiness profile, not the highest unlocked level. A mission that assumes Level 5 skill from a child currently performing at Level 3 confidence will frustrate them.

---

## Explicit Non-Goals

| Non-goal | Reason |
|----------|--------|
| Forced progression | Children must never feel pushed past their comfort level |
| Streak pressure | No "play every day or lose progress" mechanics |
| Time pressure | No timers that cause anxiety or penalize slow thinkers |
| Leaderboards | No comparison with other children — ever |
| Punishment for replaying | Replay is a valid learning behavior |
| Peer comparison | No "typical child your age" framing |
| AI-generated lessons | All content is deterministic and human-authored |
| Grade-skipping | Year 1 scope is Kindergarten + Early Grade 1; do not design for Grade 2+ |

These are permanent non-goals. They apply to all subject progression, all missions, and all future features.

---

## Future Grade Progression

Subject progression may later extend to:

| Scope | Timing |
|-------|--------|
| Kindergarten core | Year 1 — current scope |
| Early Grade 1 stretch | Year 1 — current scope |
| Grade 1 full | Year 2 — after Kindergarten core proven |
| Grade 2+ | Future — not yet planned |

**Year 1 scope is fixed: Kindergarten core + Early Grade 1 stretch only.**

The Golden Rule: build one mastery level ahead. Never six years ahead.

Future grade expansion should be driven by Chopin's actual readiness (observed through session data), not by calendar dates or feature completeness targets. When Chopin is consistently mastering Early Grade 1 content with confidence, that is the signal to design Grade 1 core content — not before.

---

## Implementation Reference

| File | Purpose |
|------|---------|
| `src/games/GameThai.jsx` | Thai level system, `useFinishRound`, `LOG_SESSION` dispatch |
| `src/games/GameMath.jsx` | Math level system, `next()` when done, `LOG_SESSION` dispatch |
| `src/games/GamePhonics.jsx` | English level system, all 4 game components dispatch `LOG_SESSION` |
| `src/config/gameConfig.js` | `LEVELS`, `TEACH_CONTENT`, `maxLevels` — all subject content |
| `src/context/StateContext.jsx` | `ADD_XP`, `LOG_SESSION`, unlock logic |
| `src/components/Report.jsx` | `SubjectReadiness` component — parent-facing readiness display |
| `docs/research/observation/play-observation-system.md` | Full readiness derivation logic |

---

## Open Questions for Future Design

1. **Should Stretch unlock be per-level or per-subject?** Currently the mastery signal is per-level. Should Stretch unlock require mastery across the whole subject, or just the current level?

2. **Should the Adventure Director ever recommend Stretch/Challenge explicitly?** Currently it recommends by subject (weakest subject). Should it ever say "you're ready for the harder version of Thai Level 3"?

3. **How should the system handle a subject with no sessions?** Subject Readiness shows "ยังไม่มีข้อมูลพอ" — but should the Adventure Director prompt the subject more urgently after a long gap?

4. **When Chopin reaches Early Grade 1 mastery, what is the transition signal?** Define the readiness threshold that indicates readiness to design Grade 1 core content (not just stretch).

5. **Should replay at a lower level give reduced XP?** Currently all replay gives full XP. This is intentional — replay should not feel penalized. But if a child replays Level 1 indefinitely, the egg economy may feel too easy. Decide before egg pacing becomes an issue.
