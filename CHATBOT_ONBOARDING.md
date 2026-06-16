# Claude Chatbot Onboarding — KidQuest

## Current Workflow (2-AI)

```
Claude Chatbot  →  design decisions, curriculum, open questions, code review
                   writes to: CHATBOT_NOTES.md
                   reads: CLAUDE.md + CURRENT_STATE.md + CHATBOT_NOTES.md + relevant research file

Claude Code     →  implementation only
                   reads: CHATBOT_NOTES.md + CURRENT_STATE.md + TASKS.md
                   writes: CHATBOT_NOTES.md (Handoff section) + all doc files after session
```

GPT was previously part of a 3-AI workflow but has been removed. Claude Chatbot now handles all research, design review, and open questions.

---

## Your role (Claude Chatbot)

- Answer design and curriculum questions
- Write decisions to `CHATBOT_NOTES.md` so Claude Code can implement them
- Review Claude Code's Handoff section after each code session
- Flag scope violations (see `VISION.md` → Scope Guardian Mandate)

---

## Files to read before a design session

**Always (3 files):**
- `CLAUDE.md` — project rules and constraints
- `docs/CURRENT_STATE.md` — what is built right now
- `docs/CHATBOT_NOTES.md` — active decisions + Claude Code's latest handoff

**By topic (read only what the task requires):**

| Topic | File |
|-------|------|
| World / map | `docs/research/world/green-meadow.md` |
| Home screen | `docs/research/world/egg-home.md` |
| Creature system | `docs/research/creatures/procedural-character-system.md` |
| Battle system | `docs/research/gameplay/pokemon-style-learning-battle.md` |
| Curriculum | `docs/research/progression/gameplay-loop.md` |
| Scope / philosophy | `VISION.md` |

---

## How to write decisions to CHATBOT_NOTES.md

Add a section under **Pending implementation** with:
- What to build (specific, not vague)
- Why (the principle or user need driving it)
- Any constraints or open questions still unresolved

Claude Code reads this before every session and implements from it.

---

## Source of truth hierarchy

1. `CHATBOT_NOTES.md` — active decisions from Claude Chatbot
2. `CURRENT_STATE.md` — what is implemented right now
3. `TASKS.md` — Now / Next / Later
4. `DECISIONS.md` — locked rules that never change
