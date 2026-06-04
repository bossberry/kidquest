# Observation Philosophy — Source of Truth

_Created: 2026-06-04_
_Status: Design philosophy locked. Implementation in `sessionLog`, `computeReadiness()`, and `Report.jsx`._

---

## Core Philosophy

**Observe first. Understand second. Design third. Never assume.**

Real play behavior matters more than theory. A curriculum assumption about what a 5-year-old can do is a starting point. What Chopin actually does in the game is the truth.

The purpose of observation is not to validate assumptions — it is to find out what is actually happening and let that shape everything that comes after: content design, mission sequencing, difficulty curves, and reward pacing.

Observation is the discipline of staying close to reality.

---

## Observation Loop

```
Child plays (subject session, mission, minigame)
  → Session logged (accuracy, duration, completion, replay behavior)
    → Patterns emerge across sessions
      → Subject Readiness computed (per subject, last 10 sessions)
        → Report surfaces insights to parent
          → Design improves (content, pacing, recommendations)
            → Child plays again
```

Observation exists to help the game follow the child. Not the other way around.

A game that ignores play behavior and sticks rigidly to a predetermined curriculum plan is not following the child — it is following a theory about the child. Observation is the mechanism that keeps the game honest.

---

## Children Are Not Their Level

The highest unlocked level is not a readiness signal. It is a historical record.

A child who unlocked Thai Level 5 three months ago and has not played Thai since is not "Level 5 ready." They may be Level 3 ready today, based on current performance.

Level is only one signal — and a weak one for current readiness. The stronger signals are:
- What is the child doing *now*?
- What is their accuracy *today*?
- Are they returning to this subject voluntarily?
- Are they completing sessions or abandoning them?

Behavior matters more than history. Readiness is a present-tense question, not a past-tense one.

---

## Positive Interpretation

Observation is not grading. Observation is not judging. Observation is understanding.

Every data point about a child's play should be interpreted charitably:

| Behavior | Negative framing (avoid) | Positive framing (use) |
|----------|--------------------------|------------------------|
| Replaying Level 2 five times | "Not progressing" | "Building confidence" |
| Low accuracy on new content | "Struggling" | "Encountering new material" |
| Short sessions | "Not engaged" | "Preference for shorter bursts" |
| Avoiding one subject | "Weak in this area" | "Exploring other subjects first" |
| High accuracy on easy levels | "Not being challenged" | "Mastering foundational material" |

Children are not weak, behind, or failing. Different learning profiles are expected and normal. A child who is Thai-strong and Math-exploring is not deficient in Math — they are Thai-strong.

The language in parent-facing reports should reflect this. No child should be described as struggling, behind, or failing — even implicitly.

---

## Important Signals

These signals, taken together, form an accurate picture of a child's current readiness and engagement:

| Signal | What it tells us |
|--------|-----------------|
| **Accuracy** | How well the child is performing on current content |
| **Replay behavior** | Whether the child is building confidence or encountering difficulty |
| **Completion rate** | Whether sessions feel manageable or overwhelming |
| **Consistency** | Whether engagement is sustained across multiple sessions |
| **Voluntary repetition** | What the child genuinely enjoys and feels confident in |
| **Favorite activities** | Where intrinsic motivation is strongest |
| **Time spent** | Duration of engagement; longer often signals enjoyment |
| **Enjoyment signals** | Indirect — inferred from replay, completion, return visits |

No single signal is sufficient. A child with high accuracy but low completion rate may be bored. A child with low accuracy but high replay rate may be motivated and building toward mastery. The combination of signals tells the story.

---

## Signals That Should Not Dominate

These signals exist but should never be the primary basis for readiness assessment or design decisions:

| Signal | Why it should not dominate |
|--------|---------------------------|
| **Speed** | Response time penalizes slow thinkers; irrelevant to comprehension |
| **Competition** | No comparison with other children; each child's journey is their own |
| **Leaderboards** | Ranking creates winners and losers; incompatible with encouragement |
| **Peer comparison** | "Children your age typically..." — always avoid this framing |
| **Daily streaks** | Streak pressure turns play into obligation; inappropriate for a 5-year-old |
| **Perfect scores** | Perfection is not the goal; consistent good-enough performance is mastery |

Speed in particular is a risk: a child who thinks carefully and answers correctly is doing something admirable. A child who answers quickly and incorrectly is not. The system must never reward speed over correctness or penalize careful thinkers.

---

## Subject Readiness States

Subject Readiness is computed per subject from the last 10 session logs. Four states:

| State | Thai Label | What it means |
|-------|------------|---------------|
| **Strong** | แข็งแรงมาก | avgScore ≥ 0.85, goodRuns ≥ 3, completionRate ≥ 0.80 |
| **Comfortable** | กำลังมั่นใจ | avgScore ≥ 0.70, goodRuns ≥ 2 |
| **Exploring** | กำลังสำรวจ | Sessions exist but below Comfortable thresholds |
| **Not Ready** | ยังไม่มีข้อมูลพอ | No sessions for this subject |

These are observations. They are not labels. They are not identities. They are not fixed.

A child who is "Exploring" in Math today may be "Comfortable" next week. A child who is "Strong" in Thai may temporarily drop to "Comfortable" after a gap in play. States are expected to fluctuate — that fluctuation is information, not failure.

The parent-facing label should always be read as "based on recent play" — not "this is who your child is."

---

## Parent Report Philosophy

Reports should help parents understand their child's play. Reports should not create anxiety.

**What good reports do:**
- Surface patterns the parent could not see from the outside ("Chopin has been replaying Thai Level 2 a lot — they seem to be building confidence there")
- Celebrate engagement and progress, whatever form it takes
- Provide gentle, actionable context ("It looks like English has fewer recent sessions — maybe try a phonics level together")
- Give parents language to have positive conversations with their child about learning

**What good reports avoid:**

| Avoid | Why |
|-------|-----|
| Grades (A/B/C/D) | Creates pressure and comparison anxiety |
| Rankings ("top 20% of children your age") | Harmful peer comparison |
| Fear-based framing ("falling behind") | Anxiety-inducing; inappropriate for a 5-year-old's parent |
| Pressure ("needs more practice in X") | Should be gentle suggestion, never pressure |
| Comparison with siblings or peers | Each child's journey is individual |

The parent report is a window into the child's play experience — not a performance review. Parents who feel anxious after reading a report will communicate that anxiety to their child. The report design is responsible for the emotional tone of the entire parent-child-game relationship.

---

## Mission Design Philosophy

Mission follows the child. The child does not follow the mission.

A mission that assumes a child is Thai Level 4 ready will frustrate a child who is currently Exploring in Thai. Subject Readiness data — not assumed level gates — should inform when a mission is appropriate, how it is weighted, and how its difficulty is tuned.

Content should adapt slowly through design iteration. Not through AI.

This means:
- GPT reviews Subject Readiness patterns from real play and proposes design adjustments
- Claude Code implements deterministic rule changes (e.g., "show Thai Stretch only when readiness = Strong")
- No adaptive engine makes real-time adjustments without human review

This is slower than an AI adaptive system. It is also more trustworthy. Parents and designers can understand, explain, and verify deterministic rules. They cannot verify a black-box adaptive engine.

---

## Explicit Non-Goals

| Non-goal | Reason |
|----------|--------|
| AI tutoring | Black-box; unverifiable; inappropriate for a child's primary learning experience |
| Adaptive difficulty engines | Real-time AI adjustment without human review creates unpredictable behavior |
| Predictive models ("this child will struggle with X") | Prediction ≠ understanding; predictions can become self-fulfilling labels |
| Ranking systems | Rankings create losers; every child in KidQuest is the only child being measured |
| Behavioral manipulation | The system must never exploit psychological vulnerabilities to increase engagement |
| Optimization for addiction | Retention metrics are not success metrics; joyful voluntary play is the goal |

The most important non-goal: **observation must never become manipulation.** Knowing that a child responds to surprise moments is not permission to over-engineer surprise to maximize session length. Observation is for understanding the child's needs — not for exploiting their psychology.

---

## Relationship to Other Systems

Observation is the feedback mechanism that connects everything else. It is not the primary game — it runs quietly beneath the surface, informing design and surfacing insights without ever being visible to the child.

| System | How observation relates |
|--------|------------------------|
| **Gameplay loop** (`gameplay-loop.md`) | Observation informs Adventure Director recommendations (weakest subject = lowest XP) |
| **Subject progression** (`subject-progression.md`) | Subject Readiness is derived from session logs; readiness informs mission gating |
| **Egg economy** (`egg-economy.md`) | Session completion logs confirm XP sources; play frequency informs pacing review |
| **Battle progression** (`battle-progression.md`) | Battle round logs (`dailyBattleRounds`) feed Challenger trigger; future could inform difficulty |

Observation supports all systems. It does not replace them. A child who has rich observation data still learns through subjects, hatches through eggs, and battles through creatures — observation just helps the game serve them better.

---

## Implementation Reference

| File | Purpose |
|------|---------|
| `src/lib/state.js` | `sessionLog: []` ring buffer (50 entries) in `defaultState()` |
| `src/context/StateContext.jsx` | `LOG_SESSION` reducer — appends session entry; auto-computes `replayedImmediately` |
| `src/components/Report.jsx` | `computeReadiness()` — derived at render time from sessionLog; `SubjectReadiness` component |
| `src/games/GameShop.jsx` | Dispatches `LOG_SESSION` with `phaseStats`, `totalDuration`, `totalHints` |
| `src/games/GameThai.jsx` | Dispatches `LOG_SESSION` via `useFinishRound` |
| `src/games/GameMath.jsx` | Dispatches `LOG_SESSION` in `next()` when done |
| `src/games/GamePhonics.jsx` | All 4 game components dispatch `LOG_SESSION` |

Full observation system spec: `docs/research/observation/play-observation-system.md`

---

## Open Questions for Future Design

1. **Should session logs ever inform the Adventure Director beyond XP totals?** Currently the recommendation uses XP share per subject. Should it also consider Subject Readiness state — e.g., recommend "Exploring" subjects more urgently than "Not Ready" subjects?

2. **Should parents be able to see session-level detail?** Currently the report shows patterns (last 10 sessions, readiness states). Would a per-session timeline be useful, or would it create anxiety?

3. **How long should sessionLog retention be?** Currently 50 sessions. Should older sessions decay in weight (recent sessions matter more than sessions from 3 months ago)?

4. **Should observation data inform mission unlocking?** Currently missions have fixed unlock rules. Could Subject Readiness state gate mission Stretch/Challenge unlock — e.g., Shop Stretch only appears when Math readiness = Comfortable?

5. **When should design iteration happen?** The loop depends on GPT reviewing real play data and proposing adjustments. How often should this review happen — after 10 sessions? 50? After specific milestones (first hatch, first mission complete)?
