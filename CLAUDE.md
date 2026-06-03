# CLAUDE.md — KidQuest Project Rules

This is Claude Code. Role: implementation only.
See `docs/AI_SYSTEMS.md` for the full 3-AI collaboration model (GPT · Claude Chatbot · Claude Code).

## Before Coding

Always read:
1. `docs/GPT_NOTES.md` — research and decisions from GPT to act on
2. `docs/CURRENT_STATE.md` — what exists, what doesn't, known risks
3. `docs/TASKS.md` — Now / Next / Later
4. `docs/DECISIONS.md` — locked rules and constraints

Read only if needed:
- `docs/CODEBASE_SUMMARY.md` — architecture, key functions, state shape
- `docs/PROJECT_MAP.md` — file locations and line counts
- `docs/ARCHITECTURE.md` — user/game/egg/persistence flows
- `docs/research/**` — long-form curriculum research (via RESEARCH_INDEX.md)

Do NOT use `SPEC.md` — deprecated, describes old HTML prototype.
See `docs/DOCUMENTATION_HIERARCHY.md` for full precedence rules.

---

## During Coding

### Never Do
- Modify `src/lib/eggAlgorithm.js` (`drawEgg()`, `hash()`, `prng()`). Egg algorithm is LOCKED.
- Change `defaultState()` in `state.js` without also handling localStorage migration.
- Remove the LocalStorage fallback. Supabase is optional; localStorage is always-on.
- Break guest mode. Full app must work without login.
- Show technical errors to the child. All errors: silent or friendly only.
- Recreate features that already exist. Read `CURRENT_STATE.md` first.

### Always Do
- Preserve guest mode and LocalStorage fallback.
- Keep child-facing UX friendly — no stack traces, no technical terms.
- Prefer small, targeted changes. No refactors beyond task scope.
- New game content → `src/config/gameConfig.js` only.
- New state field → `defaultState()` in `state.js` + reducer in `StateContext.jsx`.
- New level → `LEVELS[world]` + `TEACH_CONTENT` + update `maxLevels` in `useFinishRound`.
- New SFX → `playTone()` in `src/lib/audio.js`.

---

## After Coding

| File | When |
|------|------|
| `docs/GPT_HANDOFF.md` | **Always — every session** |
| `docs/SESSION_SUMMARY.md` | **Always — every session** (max 30 lines) |
| `docs/CURRENT_STATE.md` | If feature status changed |
| `docs/TASKS.md` | Move done tasks; add new ones found |
| `docs/CHANGELOG.md` | Append dated entry |
| `docs/POST_REVIEW.md` | If risks or technical debt discovered |
| `docs/CODEBASE_SUMMARY.md` | If architecture changed |
| `docs/PROJECT_MAP.md` | If files/folders added or removed |

---

## Post-Session Rule (MANDATORY)

After EVERY session that changes app code, Claude Code MUST:

1. **Update `docs/CURRENT_STATE.md`** — reflect all new features, removed features, changed files.

2. **Update `docs/TASKS.md`** — move completed tasks to Done; add new tasks discovered during session.

3. **Append to `docs/CHANGELOG.md`** — date, session name, bullet list of changes.

4. **Regenerate `docs/GPT_HANDOFF.md`** — full context snapshot for GPT and Claude Chatbot. Include: what changed, current state, risks, recommended next work.

5. **Update `docs/PROJECT_MAP.md`** if files were added or removed.

6. **Update `docs/CODEBASE_SUMMARY.md`** if architecture changed.

These doc updates must be in the **same commit** as the code changes.
Never skip this step even if the session was small.

---

## Key Facts

- Primary user: child ~5 years old (โชแปง), likes Sonic / Pokémon
- Business model: 199 THB/month subscription (not yet implemented)
- Hosting: Vercel; Supabase URL: `https://dgpsnlkedergkbhqnjpu.supabase.co`
- localStorage key: `kq_state`; egg: 7 stages × 50 XP = 350 XP total
- Level unlock: ≥80% accuracy; fanfare: ≥90%
- Challenger: every 15 `dailyBattleRounds`
- Known issue: `alert()` in `Home.jsx` for EggRun/minigame locks — fix when touching that file
