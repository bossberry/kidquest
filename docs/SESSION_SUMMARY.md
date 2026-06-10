# Session Summary — 2026-06-10

**Session type:** Documentation only. No code. No build.

---

## Green Meadow Implementation Plan

`docs/research/world/green-meadow-implementation-plan.md` (NEW) — 9-phase plan for building Green Meadow.

### Philosophy
Build one phase at a time. Each phase is playable and reviewable before the next begins. Chopin playtests are built into the plan as mandatory gates.

### 9 Phases

| Phase | Name | Chopin test? |
|---|---|---|
| 1 | World Foundation | Internal only |
| 2 | Movement | **Required — navigation UX validation** |
| 3 | Visible Enemies | **Required — battle loop validation** |
| 4 | NPC System | Yes |
| 5 | Treasure System | Yes |
| 6 | Minigame Integration | Light |
| 7 | Remaining Enemies | Internal |
| 8 | King Clover Bear | **Required — boss emotional validation** |
| 9 | Polish | Yes |

### Pre-implementation gate (8 GPT questions)

Must be answered before Phase 1:
- GM-Q1: Navigation UX (arrows / tap-edge / auto-walk)
- GM-Q2: Encounter trigger zone size for age 4
- GM-Q3: Screen transition (scroll vs cut)
- GM-Q4: Bag capacity
- GM-Q5: Minigame fullscreen vs in-world
- WB-Q1: World entry UX
- WB-Q3: Subject assignment in encounters
- WB-Q4: XP from exploration vs battles only

### New state fields specified

`currentRegion`, `currentScreen`, `discoveredScreens`, `pickedUpTreasures`, `collectibles`, `clovers`, `bag` — all added to `defaultState()` before Phase 1.

### New actions specified

`ENTER_WORLD`, `EXIT_WORLD`, `MOVE_SCREEN`, `PICKUP_TREASURE`, `COLLECT_CLOVER`, `COLLECT_ITEM`, `DISCOVER_SCREEN`, `TRANSFER_BAG_TO_HOME`, `SAVE_WORLD_POSITION`, `CLAIM_NPC_GIFT`, `DEFEAT_BOSS`, `FORCE_SCREEN`.

### Biggest risks (ranked)

1. Navigation UX for age 4 — must validate in Phase 2 before building Phase 3
2. Subject assignment mapping — wrong level = wrong learning scaffold
3. Boss fail experience causing distress — mandatory Chopin test in Phase 8
4. Performance on iPhone Safari — baseline measurement in Phase 2
5. Routing complexity (world ↔ battle ↔ world ↔ home) — Phase 1 routing must be clean

---

## What's next

- GPT: Answer 8 gate questions → `GPT_NOTES.md` → Green Meadow + World Bible sections.
- After GPT answers: begin Phase 1 (World Foundation).
- After Phase 2: Chopin playtest mandatory before Phase 3.
