# Gameplay Loop — Source of Truth

_Created: 2026-06-04_
_Status: Highest-level philosophy document. All other system docs are subordinate to this._

---

## Core Philosophy

Children like playing. Children do not like making many decisions.

A 5-year-old who opens KidQuest should not be confronted with a menu of choices. They should be met with a clear, welcoming answer to the question every child has the moment they pick up a game:

> **"What should I do next?"**

The game's job is to answer that question — not to ask the child to figure it out themselves.

Home is not a menu. Home is an Adventure Director. It observes what the child has done, what they're ready for, and what would feel exciting right now — and it presents that as a confident recommendation, not a list of options.

Reducing choice overload is a feature, not a limitation. A single large recommended action is better than six equal options the child must evaluate and choose between.

---

## Main Loop

```
Learn (subject levels)
  → Earn XP
    → Egg grows (7 stages, visible progress)
      → Hatch (celebration moment)
        → Creature (unique, earned)
          → Battle (payoff for learning)
            → Learn again
```

Learning is always upstream. Everything else — eggs, creatures, battle, missions, minigames — exists to support learning and make the child want to return to it.

The loop should never invert. Battle should not become the primary activity. Minigames should not replace subject sessions. Missions should not feel like obstacles. Each element should create motivation to return to the learning loop, not to bypass it.

---

## Home Philosophy

Home should guide. Not overwhelm.

**Preferred:** One large recommended action ("⭐ ผจญภัยต่อ") that clearly answers "what next?" — with supporting context (a surprise event, a hatch reminder) that adds variety without adding complexity.

**Avoid:** A 2×2 grid of equal options that requires the child to make a decision before they can play. Equal options create paralysis for young children. They want to be led, not consulted.

The Adventure Director logic:
1. If the egg is ready to hatch → recommend hatching (highest drama)
2. If the Shop Mission has never been played → recommend Shop (new experience)
3. Otherwise → recommend the subject with the lowest XP (gentle balance, feels natural)

The Surprise Event adds variety without adding decision weight. It is a secondary element — a gift the child can take or leave. It does not compete with the main recommendation.

---

## Replay Philosophy

Children naturally replay their favorite activities. This is not a failure to progress — it is how children build confidence and enjoyment.

Replay is healthy. A child who plays Thai Level 2 five times before moving to Level 3 is doing exactly the right thing for their development. They are building fluency, not stalling.

Replay is not wasted time. XP earned through replay is real XP. Egg progress from replay is real progress. The game treats replay identically to first-time play because from a learning perspective, it is.

The game should support replay rather than push constant novelty. Novelty-pressure ("have you tried this NEW thing?") creates anxiety for young children. Familiarity and repetition are developmentally appropriate at age 5.

---

## Surprise Philosophy

Special moments should feel delightful — precisely because they are unexpected.

Examples of good surprise moments:
- **Hatch** — the egg finally cracks open; the creature is revealed
- **Battle** — the child's creature fights for the first time
- **Minigame** — a Surprise Event appears on Home; something different today
- **Rare drops** — (future) a cosmetic or item the child didn't expect

Surprises should interrupt routine occasionally — enough to feel special, not so often they become routine themselves.

Surprises should not dominate the loop. If every session has a surprise, nothing feels surprising. The value of a surprise is proportional to its rarity.

The Surprise Event on Home uses a deterministic daily rotation (date-hash from unlocked minigames). This ensures the child sees something new each day without randomness that could feel unfair or arbitrary.

---

## Minigame Philosophy

Minigames are rewards. They are not the primary game.

Minigames (EggRun, EggCatch, EggMemory, EggTower, EggFishing) exist to create delight and variety — to give the child a different kind of engagement that refreshes their energy for returning to subject learning.

Minigames should not be presented as a menu. The old 2×2 minigame grid on Home was replaced with a single daily Surprise Event precisely because presenting all minigames equally created choice overload and made minigames feel like homework ("which one do I pick?") rather than a delight.

Avoid presenting too many minigames simultaneously. The daily Surprise Event shows one minigame — the one for today. This is intentional.

Learning remains primary. A session that is entirely minigames is not a learning session. Minigame XP should be modest relative to subject XP, ensuring the child is motivated to return to subject levels rather than minigame-farming.

---

## Motivation Philosophy

Intrinsic motivation first. The game should motivate the child through:

- **Curiosity** — what will my egg look like? what creature will I get?
- **Collection** — how many creatures do I have? can I get a different one?
- **Surprise** — something new and delightful appears unexpectedly
- **Progress** — the egg visibly grows; the XP bar fills; a new level unlocks
- **Mastery** — I can do this now; I remember this; I'm getting better

These motivators are durable. They work across sessions, across days, across months.

Avoid extrinsic pressure mechanisms:

| Mechanism | Why it fails for KidQuest |
|-----------|--------------------------|
| FOMO ("play today or miss this!") | Creates anxiety; inappropriate for a 5-year-old |
| Streak pressure ("don't break your streak!") | Punishes absence; turns play into obligation |
| Time pressure ("hurry up!") | Penalizes slow thinkers; creates stress |
| Punishment for skipping | Play should always feel safe to stop |
| Login rewards | Implies the child is missing something by not logging in daily |

Intrinsic motivation is sustainable. Extrinsic pressure burns out quickly in young children and turns a beloved game into a chore.

---

## Child Autonomy

Children should feel free. Not trapped. Not rushed.

The game should suggest. Not force.

A child who ignores the Adventure Director's recommendation and chooses to replay their favorite level is exercising autonomy. This is good. The recommendation is a friendly guide, not a mandate.

A child who stops mid-session and closes the app has done nothing wrong. No penalty accrues. The state is saved exactly where they left it. When they return, the Adventure Director will orient them again.

A child who wants to try a minigame instead of studying should be able to do so without friction. The Surprise Event is one tap away. It does not require justification.

The game should never make a child feel guilty for playing the way they want to play.

---

## Explicit Non-Goals

| Non-goal | Reason |
|----------|--------|
| Daily chores ("complete 3 lessons today") | Turns voluntary play into mandatory homework |
| Energy systems ("you have 5 battles left today") | Artificial scarcity; creates frustration |
| Paid acceleration | Progress is earned through learning, not purchased |
| FOMO mechanics | Inappropriate for a 5-year-old; creates anxiety |
| Login reward pressure | Implies failure for not logging in |
| Battle grinding | Battle frequency is self-directed, not required |
| Competition with other children | No leaderboards, no comparisons, no peer pressure |
| Constant novelty pressure | Familiarity and replay are developmentally healthy |

These are permanent non-goals. They apply to all features, all screens, and all future development.

---

## Relationship to Other System Documents

This document sits above all other system documents. It is the highest-level philosophy statement for KidQuest.

When a system design conflicts with the principles in this document, this document takes precedence.

| System | Document |
|--------|---------|
| What subjects children learn and how they progress | `docs/research/progression/subject-progression.md` |
| How play behavior is observed and surfaced to parents | `docs/research/observation/play-observation-system.md` |
| How XP converts to egg growth and hatching | `docs/research/rewards/egg-economy.md` |
| How learning shapes creature battle stats | `docs/research/battle/creature-stats.md` |
| How battle works and what rewards it gives | `docs/research/battle/battle-progression.md` |

Every system document describes a part of the loop. This document describes the loop itself — and why it exists.

---

## Open Questions for Future Design

1. **Should the Adventure Director recommendation ever include battle?** Currently it only recommends learning and hatching. Should it ever say "you have a creature — want to battle?" after a long gap with no battles?

2. **How should Home handle the moment right after a hatch?** The creature is revealed — does Home immediately recommend battling with it? Or does the child choose? Designing this transition moment carefully matters for the first-battle experience.

3. **Should minigame XP be reduced relative to subject XP?** If a child discovers that EggCatch gives significant XP, they may prefer it over studying. Is the current XP balance correct? Review after real-play data.

4. **How should the Surprise Event scale as more minigames unlock?** Currently the pool is small (1–4 games). As more unlock, the rotation becomes richer — but will it still feel like a daily "gift" or will it feel like the game is just showing random games?

5. **Should the loop ever explicitly close itself?** Is there a natural "session end" signal the game should recognize — e.g., after a hatch + battle + 10 minutes of play — and gently say "great session today!"? Or does all session management belong to the child?
