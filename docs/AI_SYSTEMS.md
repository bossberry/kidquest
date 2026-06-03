# AI Systems — KidQuest

Three AI systems collaborate on this project. Chat history is NOT the source of truth. Documentation files are the shared memory.

**SPEC.md is historical reference only.** It describes the old HTML prototype. GPT and Claude systems must prefer `docs/GPT_HANDOFF.md` and `docs/CURRENT_STATE.md` over SPEC.md.

See `docs/DOCUMENTATION_HIERARCHY.md` for the full precedence order and conflict rules.

---

## GPT

**Role:** Research · Curriculum Design · Product Architecture

**Writes to:**
- `docs/GPT_NOTES.md` — concise decisions, findings, open questions (points to research/ for detail)
- `docs/research/**` — long-form research documents by subject

**Reads:**
- `docs/GPT_HANDOFF.md` — primary; full context from Claude Code
- `docs/RESEARCH_INDEX.md` — to navigate research documents
- Deeper files only when needed: `CURRENT_STATE.md`, `CODEBASE_SUMMARY.md`, `TASKS.md`

---

## Claude Chatbot

**Role:** Architecture Review · Post-Implementation Review · Design Discussion

**Reads:**
- `docs/GPT_NOTES.md`
- `docs/GPT_HANDOFF.md`
- `docs/CURRENT_STATE.md`
- `docs/TASKS.md`
- `docs/DECISIONS.md`

**Writes to:**
- `docs/POST_REVIEW.md` — post-implementation review after significant coding sessions

---

## Claude Code

**Role:** Implementation

**Reads before every session:**
- `docs/GPT_NOTES.md` — to pick up GPT decisions
- `docs/CURRENT_STATE.md`, `docs/TASKS.md`, `docs/DECISIONS.md`

**Writes after every session:**
- `docs/GPT_HANDOFF.md` — always, every session
- `docs/SESSION_SUMMARY.md`
- `docs/CURRENT_STATE.md`
- `docs/TASKS.md`
- `docs/CHANGELOG.md`
- `docs/POST_REVIEW.md` — if risks or technical debt are discovered
- `docs/CODEBASE_SUMMARY.md` — if architecture changed
- `docs/PROJECT_MAP.md` — if files changed

---

## Information Flow

```
GPT research/decisions
    ↓ writes
docs/GPT_NOTES.md + docs/research/**
    ↓ Claude Code reads before coding
[implementation]
    ↓ Claude Code writes after coding
docs/GPT_HANDOFF.md
    ↓
Claude Chatbot post-review
    ↓ writes
docs/POST_REVIEW.md
    ↓
GPT reads GPT_HANDOFF.md + POST_REVIEW.md
    ↓
[next GPT work]
```
