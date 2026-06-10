# Documentation Hierarchy — KidQuest

When documents conflict, higher precedence wins.

## AI Workflow (2-AI system as of 2026-06-10)

Claude Chatbot → design decisions, open questions, curriculum → writes to `docs/CHATBOT_NOTES.md`
Claude Code → implementation → reads `docs/CHATBOT_NOTES.md`, writes Handoff section after each session

GPT removed from workflow 2026-06-10.

---

## Precedence Order

| # | Source | Notes |
|---|--------|-------|
| 1 | **Actual codebase / repository state** | Ground truth — always wins |
| 2 | **docs/CURRENT_STATE.md** | Must reflect the real repo; update after every session |
| 3 | **docs/CHATBOT_NOTES.md** | Active decisions from Claude Chatbot; Claude Code reads before coding |
| 4 | **docs/TASKS.md** | Backlog — Now / Next / Later |
| 5 | **docs/DECISIONS.md** | Locked rules that never change |

## Rules

- If any two documents conflict, the higher-numbered source loses.
- Chat history is **never** the source of truth.
- `CURRENT_STATE.md` must stay in sync with the real codebase — update it whenever a feature is added, removed, or changed.
- `CHATBOT_NOTES.md` is the single file Claude Chatbot and Claude Code use to pass decisions and handoffs. Claude Code reads it before every session and appends a Handoff section after.
