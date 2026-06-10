# CLAUDE.md — KidQuest Project Rules

This is Claude Code. Role: implementation only.
See `docs/AI_SYSTEMS.md` for the 2-AI collaboration model (Claude Chatbot · Claude Code).

**GPT has been removed from this workflow. Claude Chatbot now handles all research, design review, and open questions.**

---

## AI System (2-AI)

```
Claude Chatbot  →  design decisions, open questions, curriculum, review
                   writes to: CHATBOT_NOTES.md
                   reads: CURRENT_STATE.md + CHATBOT_NOTES.md + relevant research file

Claude Code     →  implementation only
                   reads: CHATBOT_NOTES.md + CURRENT_STATE.md + TASKS.md
                   writes: CHATBOT_NOTES.md (handoff section) + all doc files after session
```

**Source of truth hierarchy:**
1. `CHATBOT_NOTES.md` — active decisions and tasks from Claude Chatbot
2. `CURRENT_STATE.md` — what is implemented right now
3. `TASKS.md` — Now / Next / Later
4. `docs/DECISIONS.md` — locked rules that never change

---

## Scope Guardian Responsibility

Before implementing anything, check:
- Violates **Golden Rule** (building more than one mastery level ahead)?
- Falls outside **Year 1 scope** (Kindergarten core + Early Grade 1 stretch)?
- Rewrites a **stable engine** without justification?
- Creates **new mini-games** when existing mechanics could serve?
- Expands to **future grades** not yet needed?

If yes: warn first, explain the violation, suggest smaller alternative, proceed only if user explicitly overrides.

---

## Before Coding

**Always read (mandatory — every session):**
1. `CHATBOT_NOTES.md` — decisions to act on, open questions answered
2. `CURRENT_STATE.md` — what exists, what doesn't, known risks
3. `TASKS.md` — Now / Next / Later

**Read only if the task touches that area:**
- `docs/research/world/green-meadow.md` → world/map work
- `docs/research/world/egg-home.md` → Home screen work
- `docs/research/creatures/procedural-character-system.md` → creature work
- `docs/research/progression/gameplay-loop.md` → progression/loop work
- `docs/CODEBASE_SUMMARY.md` → architecture questions
- `docs/PROJECT_MAP.md` → file location questions
- `VISION.md` → scope / philosophy questions

**Never read the entire research folder.** Read only what the current task requires.

---

## During Coding

### Never Do
- Modify `src/lib/eggAlgorithm.js` (`drawEgg()`, `hash()`, `prng()`). **LOCKED forever.**
- Change `defaultState()` without handling localStorage migration.
- Remove the localStorage fallback. Supabase is optional; localStorage is always-on.
- Break guest mode. Full app must work without login.
- Show technical errors to the child. All errors: silent or friendly only.
- Recreate features that already exist. Read `CURRENT_STATE.md` first.

### Always Do
- Preserve guest mode and localStorage fallback.
- Keep child-facing UX friendly — no stack traces, no technical terms.
- Prefer small, targeted changes. No refactors beyond task scope.
- New game content → `src/config/gameConfig.js` only.
- New state field → `defaultState()` in `state.js` + reducer in `StateContext.jsx`.
- New level → `LEVELS[world]` + `TEACH_CONTENT` + update `maxLevels` in `useFinishRound`.
- New SFX → `playTone()` in `src/lib/audio.js`.

---

## After Coding (MANDATORY — every session that changes app code)

### Always update
| File | What to write |
|------|---------------|
| `docs/CHATBOT_NOTES.md` — Handoff section | Date, session name, what was built, what was NOT finished, blockers found, next task ready to start, next task that needs Chatbot decision first |
| `docs/CURRENT_STATE.md` | Reflect all new/removed/changed features |
| `docs/TASKS.md` | Move completed tasks to Done; add new tasks found |
| `docs/CHANGELOG.md` | Append dated entry with bullet list of changes |

### Update if files/architecture changed
| File | When |
|------|------|
| `docs/PROJECT_MAP.md` | Files or folders added/removed |
| `docs/CODEBASE_SUMMARY.md` | Architecture changed |

### Update if research area was touched
| File | When |
|------|------|
| `docs/research/world/green-meadow-implementation-plan.md` | Any world/map phase completed — mark phase ✅, add date, update playtest log |
| `docs/research/world/green-meadow.md` | Implementation Status table |
| Relevant research file | Any other research area touched — add Implementation Status section if missing |

### Handoff section format (in `docs/CHATBOT_NOTES.md`)
Append to bottom of Handoff section:
```
**YYYY-MM-DD — [Session name]:**
- Built: (bullet list, specific)
- Not finished: (if any)
- Blockers/risks found: (if any)
- Ready to start next: (task name, no decisions needed)
- Needs Chatbot decision first: (task name + what question, if any)
```

All doc updates must be in the same commit as the code changes. Never skip.

---

## Key Facts

- Primary user: Chopin (~5 years old), likes Sonic / Pokémon / Minecraft
- Business model: 199 THB/month subscription (not yet implemented)
- Hosting: Vercel; Supabase: `https://dgpsnlkedergkbhqnjpu.supabase.co`
- localStorage key: `kq_state`
- Level unlock: ≥80% accuracy; fanfare: ≥90%
- Challenger: every 15 `dailyBattleRounds`
- Egg algorithm: LOCKED — `eggAlgorithm.js` must never be modified
