# Documentation Hierarchy — KidQuest

When documents conflict, higher precedence wins.

## Precedence Order

| # | Source | Notes |
|---|--------|-------|
| 1 | **Actual codebase / repository state** | Ground truth — always wins |
| 2 | **docs/CURRENT_STATE.md** | Must reflect the real repo; update after every session |
| 3 | **docs/GPT_HANDOFF.md** | Preferred entry point for GPT and Claude Chatbot |
| 4 | **docs/GPT_NOTES.md** | GPT research and decisions; Claude Code reads before coding |
| 5 | **SPEC.md** | ⚠️ Deprecated — historical reference only |

## Rules

- If any two documents conflict, the higher-numbered source loses.
- `SPEC.md` describes the old HTML prototype. Never use it to guide implementation.
- Chat history is **never** the source of truth.
- `CURRENT_STATE.md` must stay in sync with the real codebase — update it whenever a feature is added, removed, or changed.
- `GPT_HANDOFF.md` is the single file GPT and Claude Chatbot should read first. It summarises everything.
- `GPT_NOTES.md` carries GPT decisions forward to Claude Code. Claude Code reads it before every session.
