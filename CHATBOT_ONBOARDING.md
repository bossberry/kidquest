# Claude Chatbot Onboarding Guide
_อ่านไฟล์นี้ก่อน session แรก เพื่อเข้าใจ repo structure โดยไม่ต้องอัปโหลดทุกไฟล์_

---

## Research files ที่มีใน repo (ไม่ต้องอ่านทั้งหมด)

### docs/research/world/
| File | สรุปย่อ | อ่านเมื่อ |
|------|---------|----------|
| `green-meadow.md` | 9 screens, 6 enemies, 5 NPCs, treasure system, boss flow ละเอียดมาก | ทำ Phase 3+ (enemies/NPCs) |
| `egg-home.md` | Egg Home interaction spec, mood states, return loop | ทำ Home screen ต่อ |
| `kidquest-world.md` | World Bible: 8 regions, boss roster, enemy design guide | ทำ region ใหม่หลัง Green Meadow |

### docs/research/creatures/
| File | สรุปย่อ | อ่านเมื่อ |
|------|---------|----------|
| `procedural-character-system.md` | DNA 40+ genes, 16 families, beauty layer, 5 phases | ทำ Phase 4 (voice) หรือ Phase 5 (birth) |

### docs/research/gameplay/
| File | สรุปย่อ | อ่านเมื่อ |
|------|---------|----------|
| `pokemon-style-learning-battle.md` | Move-panel battle spec (implemented แล้ว) | debug หรือ extend battle |
| `egg-companion-adventure.md` | ECA relationship fields spec | ทำ ECA-MVP-3+ |
| `battle-feel-philosophy.md` | Battle feel principles (implemented แล้ว) | เปลี่ยน battle mechanic |

### docs/research/progression/
| File | สรุปย่อ | อ่านเมื่อ |
|------|---------|----------|
| `gameplay-loop.md` | Core loop philosophy (highest level) | เปลี่ยน loop structure |
| `subject-progression.md` | Unlock thresholds, replay, mastery | เปลี่ยน level/unlock logic |

### docs/research/battle/
| File | สรุปย่อ | อ่านเมื่อ |
|------|---------|----------|
| `battle-progression.md` | Battle as reward, no permanent penalty | เปลี่ยน battle flow |
| `creature-stats.md` | Weighted stat formula (implemented แล้ว) | rebalance creatures |

### docs/research/observation/
| File | สรุปย่อ | อ่านเมื่อ |
|------|---------|----------|
| `observation-philosophy.md` | Observe-first, no evaluation, parent report | ทำ Report / analytics |
| `play-observation-system.md` | sessionLog spec, Subject Readiness states | ทำ observation features |

### docs/research/missions/
| File | สรุปย่อ | อ่านเมื่อ |
|------|---------|----------|
| (หลายไฟล์) | Shop/Cooking/Garden mission specs | ออกแบบ mission ใหม่ |

### docs/research/rewards/
| File | สรุปย่อ | อ่านเมื่อ |
|------|---------|----------|
| `egg-economy.md` | XP formula, pacing rationale | เปลี่ยน egg XP |

---

## Key code files (ไม่ต้องอ่าน ถ้าไม่แก้)

```
src/config/gameConfig.js        — ALL game content (~380 lines) — อ่านถ้าเพิ่ม content
src/context/StateContext.jsx    — Global state + ACTIONS — อ่านถ้าเพิ่ม state
src/lib/state.js                — defaultState() — อ่านถ้าเพิ่ม field ใหม่
src/components/WorldScreen.jsx  — World exploration (Phase 2 กำลังทำ)
src/config/worldConfig.js       — 9 screens, connections
src/games/MoveSelectBattleMode.jsx — Pokémon battle (implemented)
src/lib/eggAlgorithm.js         — LOCKED ห้ามแตะ
```

---

## สิ่งที่ CHATBOT_NOTES.md ครอบคลุมแล้ว (ไม่ต้องอ่าน research files)

✅ Creature system open questions (Q1–Q10) — answered  
✅ Egg Home open questions (Q1–Q10) — answered  
✅ Green Meadow GM-Q6, Q8, Q10 — answered  
✅ Gameplay loop open questions — answered  
✅ Battle open questions — answered  
✅ Subject progression open questions — answered  
✅ Phase 2 Canvas Tile Engine full spec — ready for Claude Code  

---

## สิ่งที่ยังไม่มีใน CHATBOT_NOTES (ต้องอ่าน research file ถ้าจะทำ)

❌ Phase 3 enemy behavior details → ต้องอ่าน `green-meadow.md`  
❌ Phase 4 NPC dialogue full scripts → ต้องอ่าน `green-meadow.md`  
❌ Creature Phase 4 voice layer → ต้องอ่าน `procedural-character-system.md`  
❌ Cooking/Garden mission design → ต้องอ่าน research/missions/  
❌ Encounter system design → ยังไม่มีไฟล์ (TODO: เขียนก่อน Phase 3)  

