# AI Systems — KidQuest

## Current workflow (2-AI, as of 2026-06-10)

### Claude Chatbot
- Role: design decisions, open questions, curriculum design, code review
- Reads: `docs/CURRENT_STATE.md` + `docs/CHATBOT_NOTES.md` + relevant research file
- Writes: `docs/CHATBOT_NOTES.md` (decisions + answers)
- Session start: upload `CLAUDE.md` + `docs/CURRENT_STATE.md` + `docs/CHATBOT_NOTES.md` + research file if needed

### Claude Code
- Role: implementation only
- Reads: `docs/CHATBOT_NOTES.md` + `docs/CURRENT_STATE.md` + `docs/TASKS.md` + research file if task requires
- Writes: Handoff section in `docs/CHATBOT_NOTES.md` + all standard doc updates
- Session start: upload `CLAUDE.md` + `docs/CURRENT_STATE.md` + `docs/CHATBOT_NOTES.md`

## What to upload each session

See `SESSION_STARTER.md` (root) for the full per-task upload guide.

## Removed
GPT removed from workflow 2026-06-10. `GPT_NOTES.md` and `GPT_HANDOFF.md` deleted.
