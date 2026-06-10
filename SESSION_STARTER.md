# KidQuest Session Starter Guide
_Read before every session — upload only the files you need_

---

## 🟢 Claude Chatbot Session (Design / Review)

**Upload every time (3 files):**
```
CLAUDE.md
CURRENT_STATE.md
CHATBOT_NOTES.md
```

**Upload additionally if working on that topic:**
```
World/Map work      → docs/research/world/green-meadow.md
Egg Home work       → docs/research/world/egg-home.md
Creatures work      → docs/research/creatures/procedural-character-system.md
Curriculum work     → docs/research/progression/gameplay-loop.md
Battle work         → (not needed — already in CURRENT_STATE)
Missions work       → docs/research/missions/ (if applicable)
```

**Start the session with this prompt:**
> "Read the uploaded files first, then help with [desired task]"

---

## 🔵 Claude Code Session (Implementation)

**Upload every time (3 files):**
```
CLAUDE.md
CURRENT_STATE.md
CHATBOT_NOTES.md
```

**Upload additionally if working on that topic:**
```
World/Map work      → TASKS.md + docs/research/world/green-meadow.md
Large tasks         → TASKS.md + CHANGELOG.md
Need context        → GPT_HANDOFF.md (last session summary)
```

**Start the session with this prompt:**
> "Read the uploaded CLAUDE.md, CURRENT_STATE.md, CHATBOT_NOTES.md and implement [task]"

**Token efficiency tips:**
- Use `/compact` after finishing a large task
- No longer need to upload GPT_NOTES.md (deprecated)
- If the session runs long → start a new session instead of continuing

---

## 📋 Current Workflow Summary

```
Claude Chatbot                    Claude Code
──────────────                    ───────────
Receives brief from Boss  →       Reads CHATBOT_NOTES.md
Designs / answers questions →     Implements from spec
Writes to CHATBOT_NOTES.md →      Updates docs after session
                           ←      Writes Handoff in CHATBOT_NOTES.md
```

---

## 🚦 Next Tasks (see details in CHATBOT_NOTES.md)

1. **Phase 2: Canvas Tile Engine** — WorldScreen rebuild (Claude Code, ~1 large session)
2. **Phase 2 Playtest gate** — Chopin must play and confirm navigation before Phase 3
3. **Phase 3: Enemies on map** — Sleepy Bunny + Bouncy Slime visible (after playtest)
4. **ECA-MVP-3** — Add relationship fields (small, can do now)

---

## ⚠️ Deprecated files (no longer need to upload)
```
GPT_NOTES.md     → replaced by CHATBOT_NOTES.md
GPT_HANDOFF.md   → replaced by Handoff section in CHATBOT_NOTES.md
SPEC.md          → deprecated long ago (old HTML prototype)
```
