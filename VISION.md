# KidQuest — Vision

## Core Idea

KidQuest is a long-term educational game that grows together with one child over many years.

It does not attempt to build a complete K-6 platform from day one.  
It expands gradually, one mastery level at a time, staying close to where the child actually is.

---

## The Golden Rule

> Build one mastery level ahead. Never six years ahead.

This is the most important principle. It governs what gets built, when, and how much.

---

## Mastery-Based Progression

Progression follows mastery, not age.

Each level supports four paths:

| Path | Purpose |
|------|---------|
| **Core** | Primary learning at current level |
| **Review** | Replay mastered content for confidence |
| **Stretch** | Preview of the next level |
| **Challenge** | Optional harder variants for fast learners |

Fast learners naturally progress into the next level. There is no forcing.  
Children who need more time stay without penalty.

---

## Year 1 Scope

**Primary focus:** Kindergarten / age 5–6  
**Stretch content:** Early Grade 1 only

**Subjects in scope:**
- Math
- English
- Thai language
- General knowledge (naturally integrated)

Science and social concepts appear only when integrated into missions — not as separate subjects.

---

## Long-Term Grade Structure

Only the current grade and one stretch level are actively developed.

```
Preschool
Kindergarten         ← currently building
  └─ Stretch: Early Grade 1

Grade 1              ← when Chopin is ready
  └─ Stretch: Early Grade 2

Grade 2
  └─ Stretch: Early Grade 3
...
```

New grades are only added when the child is actually approaching them.

---

## One World, Many Subjects

Subjects are not isolated apps.

Missions integrate multiple subjects naturally:

**Shop mission:** arithmetic + money + reading + vocabulary + social roles  
**Cooking mission:** measurement + sequencing + vocabulary + basic science  
**Garden mission:** counting + Thai/English plant names + cause-and-effect

Children experience **missions**, not subject switches. The learning is invisible.

---

## Stable Engine Philosophy

Core systems are built once and kept stable:

- Quest system
- Reward system
- Item and inventory system
- Save system (localStorage + Supabase)
- Profile system
- Progress tracking
- Level generator
- Content framework

**Future growth comes from content, not engine rewrites.**

A small number of mechanics should support thousands of levels through data.

---

## Content Strategy

**Prefer:** reusable mechanics + data-driven levels  
**Avoid:** hundreds of unique mini-games

Examples of reusable mechanics:
- Multiple-choice question (works for math, Thai, English, science)
- Word-ordering (works for Thai sentences, English sentences)
- Matching (works for letters, numbers, pictures, words)
- Counting (works for math, Thai, English objects)

New content = new data fed into existing mechanics.  
New mechanics = only when a genuinely new skill cannot be expressed otherwise.

---

## Replay Philosophy

**Never punish replay.**

Children may replay mastered levels because:
- Replay builds confidence
- Replay is enjoyable
- Children learn through repetition

**Three mission types:**

| Type | Purpose |
|------|---------|
| Progression missions | Primary source of rewards and advancement |
| Review missions | Replay mastered content; low pressure |
| Challenge missions | Optional harder variants |

Completed levels always remain accessible.

Children are gently encouraged forward through:
- New rewards and items
- New creatures and characters
- New worlds and cosmetics
- Story progression

Children should **feel safe returning to favorite activities**. Replay is healthy.

---

## Non-Goals

KidQuest is **not** trying to become:

- Khan Academy Kids
- Duolingo for Thai children
- ABCmouse
- A complete K-6 platform from day one
- A collection of isolated subject apps
- An app optimized for feature count

Avoid expanding too far into future grades.  
Avoid rewriting stable systems.  
Avoid adding advanced features prematurely.

---

## Success Metric

> Chopin voluntarily plays KidQuest and learns through it.

Not number of features. Not amount of content. Not grades covered.  
**Joyful learning matters more than scope.**

---

## Scope Guardian Mandate

All AI systems working on KidQuest — GPT, Claude Code, Claude Chat, and future assistants — act as **scope guardians**.

Their responsibility is not only to build, but to protect the project from unnecessary complexity and scope creep.

**When to warn:**
- Building too many grades ahead
- Creating too many unique mini-games
- Rewriting stable systems
- Adding advanced features prematurely
- Splitting KidQuest into isolated subject apps
- Optimizing for feature count instead of joyful learning
- Generating large amounts of far-future content

**How to warn:**
1. Flag the violation explicitly
2. Explain which principle is being violated
3. Suggest a smaller, simpler alternative
4. Proceed **only if the user explicitly decides to override**

The user always has final authority. Warnings are expected and healthy behavior.  
Protecting the long-term vision is a shared responsibility across all AI agents.
