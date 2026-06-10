# Green Meadow — Implementation Plan
_Created: 2026-06-10._
_Status: Ready to implement after GPT answers gate questions._
_Design source: `docs/research/world/green-meadow.md` (frozen)._
_World Bible: `docs/research/world/kidquest-world.md`._

---

## Guiding Principles

**Build one phase. Play it. Review it. Then build the next.**

No phase depends on the next. Each phase produces a playable, shippable slice of Green Meadow. If a phase reveals a design problem, it should be caught before the following phase is built.

Green Meadow is not a level. It is a place. It must feel like a place at every phase — not a placeholder with stubs. If Phase 1 doesn't feel warm and real, fix it before moving to Phase 2.

---

## Pre-Implementation Gate

**✅ ALL GATE QUESTIONS RESOLVED (2026-06-10). Phases 1 and 2 complete.**

| # | Question | Status | Answer |
|---|---|---|---|
| GM-Q1 | Screen navigation UX | ✅ RESOLVED | Virtual D-pad (4 buttons, 56×56px, bottom-left). Tile-based movement. |
| GM-Q2 | Encounter trigger zone size | ✅ RESOLVED | 80px enemy trigger radius, 120px NPC radius. |
| GM-Q3 | Screen transition style | ✅ RESOLVED | AC-style 160ms fade-to-dark → screen snap → 160ms fade-in. |
| GM-Q4 | Item bag capacity | ✅ RESOLVED | Unlimited. No inventory management. |
| GM-Q5 | Minigame launch style | ✅ RESOLVED | Fullscreen. Return to same world position. |
| WB-Q1 | World entry UX | ✅ RESOLVED | Home → "ออกสำรวจ" → Green Meadow direct. No map screen. |
| WB-Q3 | Subject assignment | ✅ RESOLVED | Region + readiness. Green Meadow = Kindergarten content only. |
| WB-Q4 | XP sources | ✅ RESOLVED | Battles + treasure + NPC + collectibles + minigames + exploration. |

---

## New State Fields Required

Before Phase 1, add to `defaultState()` in `state.js`:

```js
// World exploration — added before Phase 1
currentRegion: null,           // 'green-meadow' | null (null = not in world)
currentScreen: null,           // 'BM' | 'MC' | etc. (null = not in world)
discoveredScreens: [],         // ['BM', 'MC', ...] — screens visited this save
pickedUpTreasures: [],         // ['gm-bm-chest', 'gm-tr-fossil', ...] — permanent one-time treasures
collectibles: {},              // { 'butterfly-wing': 3, 'smooth-pebble': 5, ... }
clovers: 0,                    // Clover currency count
bag: [],                       // Items carried from world (max capacity TBD by GPT GM-Q4)
```

Add reducer actions in `StateContext.jsx`:
- `ENTER_WORLD` — sets currentRegion + currentScreen
- `EXIT_WORLD` — clears currentRegion + currentScreen
- `MOVE_SCREEN` — updates currentScreen
- `PICKUP_TREASURE` — adds to pickedUpTreasures, adds item to bag or collectibles
- `COLLECT_CLOVER` — increments clovers
- `COLLECT_ITEM` — adds to collectibles map
- `DISCOVER_SCREEN` — adds to discoveredScreens
- `TRANSFER_BAG_TO_HOME` — moves bag items to item tray on home return

---

## New Config File Required

`src/config/worldConfig.js` — single source of truth for all world data.

Structure:
```js
export const SCREENS = {
  'BM': { label: 'Starting Path', connects: { N: 'MC', E: 'BR', W: 'BL', S: null } },
  'MC': { label: 'Town Square',   connects: { N: 'TM', E: 'MR', W: 'ML', S: 'BM' } },
  // ... all 9 screens
}

export const SCREEN_ENEMIES = {
  'BM': [{ type: 'sleepy-bunny', count: 1 }],
  'MC': [{ type: 'bouncy-slime', count: 2 }, { type: 'mushroom-imp', count: 1 }],
  // ...
}

export const SCREEN_NPCS = {
  'BM': [{ id: 'professor-owl', position: 'oak-tree' }, { id: 'post-bird', position: 'mailbox' }],
  // ...
}

export const SCREEN_TREASURES = {
  'BM': [{ id: 'gm-bm-chest', type: 'chest', contents: [...], refill: 'never', position: {...} }],
  // ...
}

export const SCREEN_MINIGAMES = {
  'ML': [{ game: 'EggFishing', trigger: 'sparkle-spot', position: {...} }],
  // ...
}
```

---

## Phase Overview

| Phase | Name | Playable state after |
|---|---|---|
| 1 | World Foundation | Can enter/exit Green Meadow. One screen. Day/night. |
| 2 | Movement | Egg walks. Screens connect. World feels alive. |
| 3 | Visible Enemies | See creatures. Walk into them. Battle. Return to position. |
| 4 | NPC System | 5 NPCs talk, give gifts, trigger quests. |
| 5 | Treasure System | Explore to find rewards. Bag fills. Return home matters. |
| 6 | Minigame Integration | World-native minigame entry and return. |
| 7 | Remaining Enemies | Full enemy roster. Weather behaviors. |
| 8 | King Clover Bear | Boss arena, full boss flow, win/fail, rewards. |
| 9 | Polish | Green Meadow feels magical. Ambient life, weather, secrets. |

---

## Phase 1 — World Foundation

_STATUS: COMPLETE (2026-06-10)_

### Goal
A child can leave Egg Home, enter Green Meadow (Starting Path only), look around, and return home. No enemies. No NPCs. No treasure. But the screen must feel **warm and real** — not a placeholder box.

### What was actually built
- `WorldScreen.jsx` — full CSS art scene for BM (Starting Path): sky/sun/moon/stars/animated clouds/distant hills/ground/path/flowers/bushes/pollen particles, day/night support. Placeholder themed scenes for all 8 other screens (unique gradient + icon per screen).
- `worldConfig.js` — all 9 screens defined with connections, themes.
- `state.js` — `currentRegion`, `currentScreen`, `discoveredScreens` added to `defaultState()`.
- `StateContext.jsx` — `ENTER_WORLD`, `EXIT_WORLD`, `MOVE_SCREEN`, `DISCOVER_SCREEN` actions.
- `App.jsx` — `world` route added. BottomNav hidden for world.
- `Home.jsx` — "ออกสำรวจ" → `ENTER_WORLD` + navigate to world screen.
- `styles.css` — world layout + arrow button styles.

### What is NOT built in Phase 1
- No movement (egg is static — centered in screen).
- No transitions between screens.
- No enemies, NPCs, treasure.
- Only BM (Starting Path) rendered. Other 8 screens: not yet.

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldScreen.jsx` | NEW |
| `src/config/worldConfig.js` | NEW (BM only) |
| `src/lib/state.js` | Add 2 fields to defaultState() |
| `src/context/StateContext.jsx` | 3 new actions |
| `src/App.jsx` | Add world route |
| `src/components/Home.jsx` | "ออกสำรวจ" → ENTER_WORLD |
| `src/styles.css` | World layout styles |

### Dependencies
- GM-Q1 answered (navigation UX)
- GM-Q3 answered (transition style)
- WB-Q1 answered (world entry UX)
- Phase 1 is the only phase that must wait for all gate questions.

### Risks
| Risk | Mitigation |
|---|---|
| WorldScreen viewport on iOS Safari | Use `position:fixed; inset:0` (same solution as GameScreen — already proven) |
| State migration for new fields | `defaultState()` change is non-breaking — new fields initialize with null/empty |
| "ออกสำรวจ" currently routes to GameSubjectAdventure | Carefully update only the routing for this button — do not break the existing adventure modes |

### Review checklist
- [x] Can navigate from Egg Home → Green Meadow Starting Path → back to Egg Home?
- [x] Does the screen fill the full iPhone viewport?
- [x] Does day/night display correctly (try both times)?
- [x] Does the world route not break any existing navigation?
- [x] Does guest mode still work end-to-end?
- [x] Does localStorage state migration not wipe old data?

### Success criteria
**A child should be able to open the app, tap "ออกสำรวจ", see a different screen, and tap back home. The screen should look like a real place — not a white box.**

✅ DONE — Build passes. Phase 1 shipped 2026-06-10.

---

## Phase 2 — Movement

_STATUS: COMPLETE (2026-06-10)_

### Goal
The egg walks. Screens connect. The world feels alive even with no enemies or NPCs.

### What was actually built (Canvas Tile Engine)
- `src/lib/tileEngine.js` (NEW) — T tile constants, GB-palette Canvas 2D renderers for all tile types, `renderMap()` / `renderPlayer()` (8-frame directional sprite, egg-stage color body), `canMove()` collision, `getCamera()` clamp, `getExitAt()`, `getEntryPosition()`.
- `src/lib/tileMaps.js` (NEW) — BM full 20×15 tile map (Owl NPC row 3, sign row 4, tall-grass rows 5–6, stone path rows 8–9, bunny enemy row 11, EXIT_N bottom, EXIT_E/W sides). Minimal walkable maps for all 8 other screens. `SCREEN_MAPS` registry.
- `src/components/WorldScreen.jsx` (REPLACED) — CSS art fully removed. Canvas tile engine: rAF game loop, 120ms player tween, virtual D-pad (4-button cross, 56×56px, bottom-left), 25% tall-grass encounter flash → `ENCOUNTER_TRIGGERED`, EXIT tile → 160ms fade transition → new screen from opposite edge, NPC proximity → 💬 dialogue overlay, sign proximity → 📋 sign text.
- `StateContext.jsx` — `ENCOUNTER_TRIGGERED` action added (no-op placeholder for Phase 3).

### What is NOT built in Phase 2
- No battle entry from encounters yet (ENCOUNTER_TRIGGERED is a no-op).
- No NPC interaction in non-BM screens.
- No treasure, no collectibles.

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldScreen.jsx` | Add movement handling, screen edge detection |
| `src/components/WorldEgg.jsx` | NEW — walking egg sprite for world (wraps EggCanvas, adds walk animation) |
| `src/config/worldConfig.js` | All 9 screens defined (backgrounds, connections) |
| `src/styles.css` | World ambient animations, walk keyframes |

### Dependencies
- Phase 1 complete.
- GM-Q1 answered (navigation UX style).
- GM-Q3 answered (scroll vs cut for transitions).

### Risks
| Risk | Mitigation |
|---|---|
| Navigation UX for 4-year-old fingers | Follow GPT recommendation exactly. If arrows: large tap targets (≥56px). If tap-edge: 40px invisible strip at each edge. If auto-walk: no directional input needed — simplest. |
| Screen transition animation cost on low-end devices | Keep transition under 300ms. CSS opacity fade is safest. Avoid JS-driven scroll if performance is a concern. |
| WorldEgg.jsx duplicates Home.jsx egg logic | WorldEgg should import EggCanvas and add only walk CSS class. Do not copy-paste Home.jsx egg logic. |
| All 9 screens need backgrounds | Phase 2 can use simplified placeholder backgrounds (e.g., color gradients per screen) with full art added in Phase 9 Polish. Label each screen clearly so reviewer can test navigation. |

### Review checklist
- [x] Can navigate all 9 screens (BM ↔ MC ↔ TM ↔ TL ↔ TR ↔ ML ↔ MR ↔ BL ↔ BR)?
- [x] Do screen edges that should be locked (TR east, map boundaries) correctly block movement?
- [x] Does each screen transition feel smooth and not jarring?
- [x] Does the ambient layer (clouds/grass) not hurt performance on iPhone (test with Safari devtools)?
- [x] Does the egg sprite look like the child's current egg (correct stage and colors)?
- [x] Does day/night variation look correct across screens?

### Success criteria
**A child should be able to wander all 9 screens freely, feel the world has space, and return home. The ambient layer should make the world feel like it breathes.**

✅ DONE — Canvas tile engine shipped 2026-06-10. Chopin played Phase 2 — map navigation works well. Phase 3 gate cleared.

---

## Phase 3 — Visible Enemies

_STATUS: COMPLETE (2026-06-11)_

**Gate: Chopin Phase 2 playtest ✅ CLEARED — tile D-pad feels natural. Phase 3 is unblocked.**

### Goal
The child sees creatures in the world. They can walk into them to start a battle. After the battle they return to the same screen at the same position.

### What's built
- `WorldEnemy.jsx` (NEW) — renders enemy sprite, drives movement pattern, detects collision with egg.
- Enemy data for first 3 types in worldConfig.js: Sleepy Bunny, Bouncy Slime, Tiny Fox.
- Movement patterns: Sleepy Bunny (slow wander + yawn pause), Bouncy Slime (random bounce), Tiny Fox (edge-sneaking, 25% flee).
- Collision detection: when egg sprite and enemy sprite overlap by GM-Q2 threshold → trigger battle.
- Sleepy Bunny double-tap rule: first contact = wake animation, second contact = battle.
- Battle transition: save `worldPosition` to state before entering battle. On battle return: restore position.
- Subject assignment: implement whatever GPT answers in WB-Q3.
- XP handling: implement whatever GPT answers in WB-Q4.
- Enemy respawn: enemy returns to original screen position after a short delay (30s) or when player leaves and returns to screen.

### What is NOT built in Phase 3
- No NPC interaction.
- No treasure pickup.
- No Leaf Sprite, Grumpy Mole, Mushroom Imp (Phase 7).

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldEnemy.jsx` | NEW |
| `src/components/WorldScreen.jsx` | Add enemy rendering, collision detection |
| `src/config/worldConfig.js` | Enemy data per screen (first 3 types) |
| `src/lib/state.js` | Add `worldPosition` field (for battle return) |
| `src/context/StateContext.jsx` | `SAVE_WORLD_POSITION`, `CLEAR_WORLD_POSITION` |
| `src/App.jsx` | World → battle transition and return |
| `src/styles.css` | Enemy movement keyframes |

### Dependencies
- Phase 2 complete.
- GM-Q2 answered (trigger zone size in px).
- WB-Q3 answered (subject assignment).
- WB-Q4 answered (XP from exploration).
- MoveSelectBattleMode already exists — no new battle code needed. Only the entry/exit wiring.

### Risks
| Risk | Mitigation |
|---|---|
| Collision detection on mobile (touch position vs sprite position) | Use absolute-positioned sprites. Collision = center-point distance < radius threshold. Test on real iPhone. |
| Player position restoration after battle | Store `{ screen: 'ML', x: 0.4, y: 0.6 }` as percentage — survives layout changes. Restore on world re-entry. |
| Tiny Fox flee mechanic | Implement as: on collision check, roll Math.random() once. < 0.25 → fox runs off-screen and drops a Clover. ≥ 0.25 → battle. |
| Bouncy Slime hitting egg unexpectedly | Intentional by design — the slime runs into the player, not the reverse. May need a brief battle-lockout period (1s) after returning from battle so the child doesn't immediately re-enter another battle. |

### What was actually built (2026-06-11)
- `src/lib/drawEnemy.js` (NEW) — Canvas sprite renderer, 4 types (bunny/slime/fox/egg_pawn), 48-unit design space.
- `src/games/MoveSelectBattleMode.jsx` (FULL REWRITE) — GB-style layout, HP bars, typewriter dialogue, entry flash, counterattack animations, `showReturnButton` prop.
- `src/components/WorldBattle.jsx` (NEW) — world battle wrapper, generates questions, dispatches session completion, navigates back to world.
- `src/lib/state.js` — `worldPosition` + `worldBattleEnemy` added to `defaultState()`.
- `src/context/StateContext.jsx` — `ENTER_BATTLE_FROM_WORLD`, `RETURN_FROM_WORLD_BATTLE`, `CLEAR_WORLD_POSITION` actions.
- `src/components/WorldScreen.jsx` — ENEMY tile collision in `tryMove`, stateRef for closure safety, position restore on mount.
- `src/App.jsx` — `world-battle` route, BottomNav hidden for world-battle.

### What was NOT built in Phase 3
- Sleepy Bunny double-tap wake rule (single-contact for MVP — deferred to Phase 4 polish).
- Enemy respawn timer (enemy stays gone after battle — deferred).
- Tiny Fox flee mechanic (not yet implemented).
- Per-enemy movement patterns (enemies are static tiles, not animated world sprites).

### Review checklist
- [x] After battle, does child return to the exact screen they left?
- [x] Does the battle use the correct subject (weakest from sessionLog)?
- [x] Does XP flow correctly to the egg?
- [ ] Sleepy Bunny double-tap (deferred)
- [ ] Enemy respawn (deferred)

### Success criteria
**A child should be able to see an enemy, choose to approach or avoid it, enter a battle, and return to the world at the same place. The loop from Phase 1 (Home → World → Home) should now include Home → World → Battle → World → Home.**

✅ DONE — Build passes. Phase 3 shipped 2026-06-11.

---

## Phase 4 — NPC System

### Goal
The world contains friends. NPCs stand in their spots, react when approached, and give gifts or say kind things.

### What's built
- `WorldNPC.jsx` (NEW) — renders NPC sprite, idle animation, proximity detection.
- `WorldDialogue.jsx` (NEW) — dialogue bubble component. Shows name, lines, and a tap-to-advance mechanism. Child-friendly: large text, simple Thai, short sentences.
- 5 NPCs implemented:
  - Professor Clover Owl (BM oak tree) — tutorial and tips.
  - Grandma Turtle (TM garden) — welcome gift, daily garden items.
  - Post Bird (BM mailbox + traveling) — delivers items.
  - Young Bunny Farmer (MC stall) — trade dialogue, EggRun setup.
  - Traveling Bee Merchant (MC or MR) — item shop dialogue.
- NPC gift system: NPCs can give items once per session (or per day for refillable gifts). Gifts flow into bag.
- Stage-aware dialogue: Grandma Turtle has different lines for egg stages 1–3, 4–6, 7–9.
- No quest chains in Phase 4. Only "talk → maybe get item → end dialogue."

### What is NOT built in Phase 4
- No quest chains or multi-step NPC interactions.
- No trade system UI (Bunny Farmer dialogue sets it up but no actual exchange yet).
- Post Bird quest chain deferred (pending GPT answer GM-Q10).
- EggRun trigger deferred to Phase 6.

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldNPC.jsx` | NEW |
| `src/components/WorldDialogue.jsx` | NEW |
| `src/config/worldConfig.js` | NPC data: location, dialogue lines, gift logic |
| `src/components/WorldScreen.jsx` | Add NPC rendering |
| `src/lib/state.js` | Add `npcGiftsClaimed` (per-session tracker) |
| `src/context/StateContext.jsx` | `CLAIM_NPC_GIFT` action |
| `src/styles.css` | NPC idle animations, dialogue bubble styles |

### Dependencies
- Phase 3 complete.
- No new GPT questions required — NPC system design is fully defined in green-meadow.md.
- Grandma Turtle gift logic uses existing item tray system — must understand item state shape before implementing.

### Risks
| Risk | Mitigation |
|---|---|
| Dialogue text size for 4-year-old reading level | All dialogue: max 12 words per bubble. Large font (≥20px). Parent reads aloud. No dependency on child reading. |
| NPC proximity trigger vs enemy trigger | Use a larger proximity radius for NPCs (≥ 120px) vs enemies (GM-Q2, likely 80–100px). NPCs should be easy to accidentally trigger — the child should feel like the world notices them. |
| Post Bird traveling NPC logic | Keep it simple: Post Bird appears on 1–2 pre-determined screens per session (randomized at session start, not at runtime). No actual pathfinding. |
| Gift once-per-session state | Use a simple `Set` stored in session state (not persisted to localStorage). Grandma Turtle's daily garden gift uses the same `lastHomeVisit` date logic already in state. |

### Review checklist
- [ ] Can child approach and receive dialogue from all 5 NPCs?
- [ ] Does dialogue text fit comfortably on mobile (check on 390px iPhone)?
- [ ] Does Grandma Turtle's dialogue change based on egg stage?
- [ ] Does Grandma Turtle give the welcome food gift exactly once (first visit)?
- [ ] Does Post Bird appear on 1–2 screens per session?
- [ ] Do NPCs react to approach (turn to face player)?
- [ ] Do NPC gift items correctly flow to the bag?

### Success criteria
**A child should be able to find Professor Owl, hear a helpful tip, find Grandma Turtle, and receive a food gift. The world should feel inhabited by friends who care about the child and the egg.**

---

## Phase 5 — Treasure System

### Goal
Exploration becomes its own reward. The child discovers that wandering the world finds things.

### What's built
- `WorldTreasure.jsx` (NEW) — renders fixed treasure spots, random sparkles, and hidden clover patches.
- Fixed treasures: 11 spots from worldConfig. One-time permanents tracked in `pickedUpTreasures` state. Daily/weekly refills tracked against last-pickup timestamp.
- Random sparkle system: 1–2 per screen per session, random position, drops Clover/Pebble/Berry. Generated at session start. Resets each session.
- Hidden clovers: 3 per screen. Auto-collected on walk-over. Shimmer visual until collected. Reset each session.
- Lucky Day bonus: if 27/27 clovers collected in one session, apply Lucky Day status (visual indicator).
- Collectibles state: items go to either `collectibles` map (decorative) or `bag` (usable items — Food, Potion, Star, Ribbon).
- Bag capacity: implement per GPT GM-Q4 answer.
- Visual feedback: sparkle burst + chime on any pickup.

### What is NOT built in Phase 5
- No Clover currency exchange (UI only) — trade system deferred.
- No collectible display in Collection tab yet — deferred to post-Phase 5.
- No lore display for Old Letters — deferred to Phase 9 Polish.

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldTreasure.jsx` | NEW |
| `src/components/WorldScreen.jsx` | Add treasure rendering |
| `src/config/worldConfig.js` | All 11 fixed treasure spots defined |
| `src/lib/state.js` | Add `pickedUpTreasures`, `collectibles`, `clovers`, `bag` fields |
| `src/context/StateContext.jsx` | `PICKUP_TREASURE`, `COLLECT_CLOVER`, `COLLECT_ITEM`, `TRANSFER_BAG_TO_HOME` |
| `src/components/Home.jsx` | Show bag items in item tray on world return |
| `src/styles.css` | Sparkle pickup animation |
| `src/lib/audio.js` | Pickup chime (reuse `item` tone if suitable) |

### Dependencies
- Phase 4 complete.
- GM-Q4 answered (bag capacity).
- GM-Q8 answered (collectible display location).
- WB-Q4 answered (XP from exploration — if exploration gives XP, add XP dispatch in PICKUP_TREASURE).
- Item tray in Home.jsx must accept bag transfers.

### Risks
| Risk | Mitigation |
|---|---|
| State migration for new fields | All new fields initialize safely (empty arrays/objects, zero counts). No migration logic needed. |
| Bag overflow if unlimited | If GPT recommends capped bag, implement a gentle "กระเป๋าเต็มแล้ว!" visual when cap reached. No harsh stop — just a visual. |
| Permanent one-time treasures syncing with Supabase | `pickedUpTreasures` is persisted in state blob. Supabase sync already handles this via existing state-sync mechanism. No special case needed. |
| Lucky Day session tracking | Track `cloversCollected` as a session counter in React state (not persisted). If 27 reached, set `luckyDay` session flag. Do not persist between sessions. |

### Review checklist
- [ ] Do fixed treasure chests appear at the correct positions on each screen?
- [ ] Is the one-time chest (Ancient Fossil, Egg Nest) only claimable once per save file?
- [ ] Do random sparkles appear differently each session?
- [ ] Do hidden clovers require walking over (not tapping)?
- [ ] Does Lucky Day activate at 27/27 and show a clear visual?
- [ ] Do Food/Potion/Star/Ribbon items from bag appear in Egg Home item tray after returning?
- [ ] Do collectibles (Butterfly Wing, Smooth Pebble etc.) appear in the Collection?

### Success criteria
**A child should be able to explore one session and return home with items to use on their egg. The act of wandering should feel consistently rewarding — something new found every visit.**

---

## Phase 6 — Minigame Integration

### Goal
All 5 existing minigames feel like natural discoveries in the world — not items in a menu.

### What's built
- Minigame trigger points added to worldConfig (per screen, per minigame).
- `WorldMinigameTrigger.jsx` (NEW or inline in WorldScreen) — renders the visual trigger (sparkle fishing spot, butterfly cluster, etc.) and shows the prompt bubble on approach.
- Each trigger shows a two-button prompt: "เล่นไหม?" (YES / ไว้ก่อน NO).
- YES: save world position → launch minigame → return to world position after minigame ends.
- World-to-minigame transition: implement per GPT GM-Q5 (fullscreen vs in-world). If fullscreen (existing behavior): reuse existing App.jsx routing. If in-world: TBD.
- Minigame return: on minigame result screen "Back" → return to world, not home.

### Minigames and triggers

| Minigame | World trigger | Screen |
|---|---|---|
| EggFishing | Sparkle spot at water edge | ML, BL |
| EggRun | Young Bunny Farmer dialogue YES | MC |
| EggTower | Tap ancient tree at forest entrance | TR |
| EggCatch | Butterfly cluster in upper field | TL |
| EggMemory | Grandma Turtle "flower pot" dialogue YES | TM |

### What is NOT built in Phase 6
- No new minigame mechanics — use existing code exactly.
- No minigame-specific reward differences yet (Phase 9 can tune rewards).

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldScreen.jsx` | Add minigame trigger detection |
| `src/config/worldConfig.js` | Minigame trigger positions per screen |
| `src/App.jsx` | World → minigame → world routing (add return-to-world path) |
| `src/components/WorldNPC.jsx` | Bunny Farmer and Grandma Turtle dialogue YES → minigame trigger |
| All minigame result screens | Add "กลับโลก" (Back to World) button when launched from world |
| `src/lib/state.js` | `worldPosition` field (if not already added in Phase 3) |

### Dependencies
- Phase 5 complete.
- GM-Q5 answered (fullscreen vs in-world minigame launch).
- All 5 minigames (EggFishing, EggRun, EggCatch, EggTower, EggMemory) already exist and work.
- App.jsx routing must support world → minigame → world without breaking existing home → minigame → home path.

### Risks
| Risk | Mitigation |
|---|---|
| Minigame result screen routing | Add a `launchSource` field to game state (values: 'home' or 'world'). Result screen back button checks this and routes accordingly. |
| EggRun "race" framing difference from menu EggRun | Same minigame code, different entry framing. Do not modify EggRun game logic — just change the dialogue wrapper. |
| EggMemory currently has no world framing | Grandma Turtle's "flower pots" framing is purely cosmetic — same game mechanics, different prompt text. |
| Position restoration for minigame-launched-from-NPC | Bunny Farmer and Grandma are stationary NPCs. Save position when dialogue starts (same as battle position save). |

### Review checklist
- [ ] All 5 minigame trigger spots visible in the world?
- [ ] Does each trigger show a YES/NO prompt on approach?
- [ ] Does choosing NO leave player in world with no consequence?
- [ ] After completing any minigame (win or lose), does child return to the correct world screen?
- [ ] Are minigame rewards (items, collectibles) added to bag on completion?
- [ ] Does minigame result screen have a "Back to World" option?
- [ ] Does home → minigame → home path still work for existing menu minigame entry?

### Success criteria
**A child should discover the fishing spot, trigger EggFishing, catch something, and return to the world with an item — all without seeing a menu or button outside of the world context.**

---

## Phase 7 — Remaining Enemies

### Goal
All 6 enemy types are present in Green Meadow. Weather events change enemy behavior. Day/night affects which enemies appear.

### What's built
- 3 additional enemy types in WorldEnemy.jsx:
  - Leaf Sprite (TL, TM, BL) — floating, gentle, leaf trail.
  - Grumpy Mole (TR, ML, BL) — pop-from-ground mechanic.
  - Mushroom Imp (MC, TR) — camouflage + startle mechanic.
- Grumpy Mole implementation: not a walking sprite. Instead, an underground sprite that pops up at timed intervals at fixed positions on the screen. Collision check only when above ground.
- Mushroom Imp camouflage: spawn near real mushroom decorations. When still, slightly transparent. When player approaches within range, "discovers" animation triggers, then normal collision.
- Weather behavior additions:
  - Soft rain: Leaf Sprite retreats to edge of screen. Rare Mushroom Imp variant (Wet Mushroom Imp) spawns.
  - Sunny: Tiny Fox more active (more visible, less hiding).
- Day/night enemy variations:
  - Night: Tiny Fox absent. Sleepy Bunny is asleep (requires triple-contact to wake). Grumpy Mole is also sleeping. Bouncy Slime glows faintly.
  - Firefly clusters visible at night on BM, TL, BL screens (decorative, not enemies).

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldEnemy.jsx` | Add 3 new movement patterns |
| `src/config/worldConfig.js` | Enemy data for all 9 screens, weather variants |
| `src/components/WorldScreen.jsx` | Weather system, day/night enemy behavior switch |
| `src/styles.css` | Leaf trail, mole pop, mushroom camouflage CSS |

### Dependencies
- Phase 6 complete.
- No new GPT questions required.
- Weather system: use `hour` from real clock already. Add a simple `weatherState` (sunny / cloudy / rain) derived randomly at session start (e.g., hour % 3: 0=sunny, 1=cloudy, 2=rain). Not a complex system — just a session seed.

### Risks
| Risk | Mitigation |
|---|---|
| Grumpy Mole pop-up timing colliding with player position | Pop-up should happen at fixed positions away from the initial player spawn point. Delay first pop-up by 3s after screen entry. |
| Mushroom Imp camouflage on mobile (sprite small, hard to see) | Increase Mushroom Imp sprite size so it's findable. The "hard to see" feel comes from opacity, not size reduction. |
| Weather system complexity | Keep it a single `weatherState` enum. No transitions mid-session. No animation for rain — just visual palette shift (screen overlay) and changed enemy behavior. |

### Review checklist
- [ ] All 6 enemy types appear in their designated screens?
- [ ] Does Grumpy Mole only trigger battle when above ground?
- [ ] Does Mushroom Imp have a distinct "discovered" animation before battle?
- [ ] Does Leaf Sprite's scatter-and-reassemble defeat animation play correctly?
- [ ] Do enemies behave differently at night vs. day?
- [ ] Does rain change Leaf Sprite behavior?

### Success criteria
**All 9 screens of Green Meadow are populated. A child who has explored the full map should have encountered at least 4 different enemy types and noticed they each behave differently.**

---

## Phase 8 — King Clover Bear

### Goal
The first boss experience. Warm, exciting, and emotionally satisfying whether the child wins or loses.

### What's built
- `WorldBoss.jsx` (NEW) — boss approach sequence, boss dialogue, win/fail sequences.
- BR screen (King Clover Bear Meadow) fully implemented in worldConfig.
- Boss approach sequence:
  - On entering BR: King Clover Bear large sprite visible on throne.
  - Walking within range: bear stands, stretches, approaches, dialogue begins.
  - Dialogue: multi-line bubble sequence, tap to advance. Two choices at end: fight or not yet.
  - "Not yet": bear waves, child exits freely.
  - "Fight": boss battle launches using MoveSelectBattleMode with `bossVariant: true` prop.
- Boss battle variant:
  - `bossVariant` prop on MoveSelectBattleMode changes: enemy HP ×2.5, unique boss music, mid-battle comments after every 3 correct answers, boss sprite larger.
  - No new battle mechanics — same move-select system. Just config changes.
- Win sequence: bear claps + laughs → warm dialogue (3 lines) → sparkle storm + confetti → 3 arena treasure spots activate → Clover Crown delivered to bag.
- Fail sequence: bear gives small gift → gentle dialogue → player bounced to BM (Starting Path) → Professor Owl encouragement line.
- Post-win arena: bear on throne, waves when approached. Different dialogue on revisit. No rebattle same session ("ข้าต้องพักก่อนนะ").
- Rebattle on next session: available. Reduced rewards (Rare Token + Food, no Clover Crown repeat).

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldBoss.jsx` | NEW |
| `src/components/WorldScreen.jsx` | BR screen special handling, boss trigger zone |
| `src/config/worldConfig.js` | BR screen boss data, arena treasure spots |
| `src/games/MoveSelectBattleMode.jsx` | Add `bossVariant` prop (HP multiplier, mid-battle comment system) |
| `src/lib/state.js` | Add `bossesDefeated: []` field |
| `src/context/StateContext.jsx` | `DEFEAT_BOSS` action |
| `src/styles.css` | Boss approach animations, arena sparkle effects |
| `src/lib/audio.js` | Boss music (or unique boss theme approach) |

### Dependencies
- Phase 7 complete.
- MoveSelectBattleMode exists — only adding a `bossVariant` prop pathway.
- Clover Crown accessory item: needs an item type in gameConfig.js or worldConfig.js.
- Fail sequence must bounce to BM — requires a "return to screen" mechanism beyond the existing "return to same screen" pattern from Phase 3.

### Risks
| Risk | Mitigation |
|---|---|
| Boss music complexity | Simplest path: use existing fanfare/battle tones differently (slower tempo, extra notes via existing `playTone` system). Avoid needing a full new audio file. |
| Clover Crown as a new item type | Crown is cosmetic (egg wears it). Year 1 MVP: add to collectibles map. Visual: small crown overlay on egg sprite in Home. Implementation deferred to Phase 9 Polish if needed — in Phase 8, Crown is an item in the bag and bag-to-home transfer works. Actual egg cosmetic is post-Phase-8. |
| Failure bounce to BM | Add `FORCE_SCREEN` action to StateContext. Fail sequence dispatches this after the fail dialogue completes. |
| Child hitting loss repeatedly | After 3 losses to the same boss in one session, King Bear says "ลองมาวันพรุ่งนี้นะ" (warm deferral). No lock — just a gentle suggestion. Rebattle still available. |

### Review checklist
- [ ] Does King Clover Bear appear large and friendly on BR screen entry?
- [ ] Does the approach sequence trigger at the right distance?
- [ ] Does the "not yet" option let the child explore freely?
- [ ] Does the boss battle have noticeably more HP than regular enemies?
- [ ] Do mid-battle comments appear after every 3 correct answers?
- [ ] Does the win sequence play fully (dialogue → sparkle → treasure activate)?
- [ ] Does the fail sequence give a consolation gift and bounce to Starting Path?
- [ ] Does Professor Owl say an encouraging line after the child returns from a loss?
- [ ] Does the arena show post-win treasure spots?
- [ ] Does the boss NOT rebattle within the same session?

### Success criteria
**A child should be able to approach King Clover Bear, choose to fight, experience either a win or a loss, and feel good afterward in both cases. The boss should feel like an event — something memorable — not just another battle.**

---

## Phase 9 — Polish

### Goal
Green Meadow feels magical. The world has ambient life, seasonal personality, and tiny secrets that reward curious children.

### What's built
- `WorldAmbient.jsx` (NEW) — renders non-interactive ambient creatures and effects.
- Ambient creatures:
  - Butterflies in Flower Field (TL) — visible before EggCatch trigger. CSS-animated float.
  - Fireflies at night on BM, TL, BL — gentle glow particles.
  - Frog on lily pad in ML — tap causes jump + splash. No battle.
  - Sleeping cat in MC behind stall — tap causes stretch yawn.
- Weather events:
  - Soft rain: screen darkens slightly, rain particle layer (CSS), puddles on path (BM).
  - Rainbow: appears briefly after rain clears in TL. Walking under it triggers sparkle shower.
  - Sunny: visible sun glow on screens, slightly warmer palette.
- Screen-specific secrets:
  - Fountain coin (MC): tap → chime + sparkle. No item.
  - Tree leaves (TR): tap → leaf shower + Leaf Sprite cameo.
  - Lily pad music (BL, night only): step on each pad → musical note. Right sequence = Moon Crystal collectible.
  - Hill viewpoint (MR, northeast edge): walking to edge → brief pan-out of full meadow.
  - Clover Hill night glow (MR, night): luminescent clover patterns.
- Clover Crown cosmetic: egg in Home.jsx shows small crown overlay if Clover Crown is in collectibles. CSS overlay on EggCanvas.
- Old Letter reading: tapping Old Letters in Collection shows a simple styled card with the letter text.
- Music transitions: soft fade when moving between screens with different music moods (TM = warmer, BL = most ambient, BR = boss music). Uses existing audio system + volume fade technique.
- Screen backgrounds: replace Phase 2 placeholder gradients with full HomeBackground-style CSS art for all 9 screens.

### Files likely affected
| File | Change type |
|---|---|
| `src/components/WorldAmbient.jsx` | NEW |
| `src/components/WorldScreen.jsx` | Integrate ambient layer, weather system, secret interactions |
| `src/components/Home.jsx` | Clover Crown cosmetic overlay on EggCanvas |
| `src/components/Collection.jsx` | Old Letter display card |
| `src/styles.css` | Per-screen background art, ambient animations, weather overlays |
| `src/lib/audio.js` | Music fade logic, lily pad notes |

### Dependencies
- Phase 8 complete.
- No new GPT questions required.
- Phase 9 is purely additive and cosmetic. It cannot break core loop.

### Risks
| Risk | Mitigation |
|---|---|
| Full CSS background art for 9 screens is a lot of work | Prioritize: BM (entrance), TM (Grandma), BR (boss arena). Other screens can use pleasing color gradients in MVP and art added iteratively. |
| Music transitions may feel jarring or cause audio overlap | Keep transitions subtle: 1s fade-out → 0.5s silence → fade-in. Only change music when entering TM, BL, and BR — main theme everywhere else. |
| Lily pad musical puzzle complexity | Simple sequence: 3 lily pads, notes do-re-mi. Store tap order. If correct → reward. Wrong → reset (pads flash, gentle sound). No timer. |
| Weather affecting performance | Rain particle layer: use CSS `::before` on the screen container with a repeating-linear-gradient and animation. Not canvas-based. Limit to 20–30 "drops" via gradient repetition. |

### Review checklist
- [ ] Do butterflies appear before EggCatch trigger in TL?
- [ ] Do fireflies appear at night in BM, TL, BL?
- [ ] Does the frog in ML react to taps?
- [ ] Does the sleeping cat in MC react to taps?
- [ ] Does soft rain change the visual feeling of the world?
- [ ] Does the rainbow appear after rain in TL?
- [ ] Does the hill viewpoint pan-out work in MR?
- [ ] Does the lily pad puzzle work in BL at night?
- [ ] Does Clover Crown appear on egg in Home if collected?
- [ ] Do Old Letters display correctly in Collection?
- [ ] Do music transitions feel smooth when entering/leaving TM, BL, BR?
- [ ] Do all 9 screens have distinctive visual personalities (not just color swaps)?

### Success criteria
**A child who has completed all 8 prior phases should notice something new in Phase 9 that they didn't see before. The world should feel like it has more secrets than they've found. The ambition: Chopin should spontaneously say "Let's go back to the meadow."**

---

## Dependency Tree

```
Gate Questions
    │
    ▼
Phase 1: World Foundation
    │
    ▼
Phase 2: Movement
    │
    ▼
Phase 3: Visible Enemies ─────────── Gate: GM-Q2, WB-Q3, WB-Q4
    │
    ▼
Phase 4: NPC System
    │
    ▼
Phase 5: Treasure System ─────────── Gate: GM-Q4, GM-Q8
    │
    ▼
Phase 6: Minigame Integration ─────── Gate: GM-Q5
    │
    ▼
Phase 7: Remaining Enemies
    │
    ▼
Phase 8: King Clover Bear
    │
    ▼
Phase 9: Polish
```

No phase can be reordered. Each depends on all prior phases being stable and reviewed.

---

## Review Checkpoints

| After Phase | Who reviews | What to check |
|---|---|---|
| Phase 1 | Claude Code (build + smoke test) | Navigation BM ↔ Home. No state corruption. |
| Phase 2 | Claude Code (build + test) + **play with Chopin** | Does he want to walk around? Does the world feel real? |
| Phase 3 | Claude Code + **play with Chopin** | Does he understand to walk into enemies? Does the battle feel connected to the world? |
| Phase 4 | **Play with Chopin** | Does he seek out NPCs? Does Grandma Turtle feel warm? |
| Phase 5 | **Play with Chopin** | Does he notice and collect items? Does he want to bring them home to the egg? |
| Phase 6 | **Play with Chopin** | Does EggFishing feel discovered, not selected? |
| Phase 7 | Claude Code + brief Chopin test | All enemies present and behaving. No movement glitches. |
| Phase 8 | **Play with Chopin full session** | Does the boss feel like an event? Does the fail sequence feel OK (no distress)? |
| Phase 9 | **Play with Chopin full session** | Does he say "Let's go back"? Does he notice secrets? |

---

## Biggest Risks (Ranked)

### Risk 1 — Navigation UX for age 4 hands (Critical — affects all phases)
If the navigation UX (GM-Q1) is wrong for Chopin's fine motor skills, the entire world is frustrating. This must be validated in Phase 2 (first playtest with Chopin) before enemy placement in Phase 3. If Phase 2 playtest shows navigation is wrong, fix it before Phase 3.

**Mitigation:** Build Phase 2 with two navigation modes toggle-able. Test both with Chopin. Pick one. Lock it.

### Risk 2 — Subject assignment in battles (affects learning value)
If the wrong subject appears in Green Meadow battles (WB-Q3), the learning scaffolding fails. Green Meadow is Kindergarten-level — Math Level 0, Thai กขค, English ABC. Battles must not assign Grade 3 content to a 5-year-old in Green Meadow.

**Mitigation:** GPT must specify a region-to-subject-level mapping, not just "random." Wait for WB-Q3 before Phase 3.

### Risk 3 — Boss fail experience causing distress (Phase 8)
If the failure sequence is too harsh, Chopin may not want to try again. The consolation gift + warm dialogue + no "แพ้" framing must be carefully implemented and tested.

**Mitigation:** Phase 8 review is a mandatory Chopin play session. If he looks sad or frustrated after a loss, revise the fail dialogue before Phase 9.

### Risk 4 — Performance on iPhone Safari
Each phase adds more sprites, animations, and CSS. Phase 2 establishes the performance baseline. If Phase 2 already stutters on older iPhones, all subsequent phases will be worse.

**Mitigation:** Measure Safari frame rate in Phase 2. Use CSS animations (not JS RAF) for ambient elements. Keep concurrent animated sprites below 10 at a time.

### Risk 5 — Routing complexity (world ↔ battle ↔ world ↔ home)
The app currently routes: home → game → result → home. Green Meadow adds: world → battle → world → home. If routing is not cleanly separated, one path will break the other.

**Mitigation:** Phase 1 must establish a clean `world` screen route that is independent of the existing `game` route. Review routing architecture before Phase 3 adds battle transitions.

---

## Estimated Implementation Order

This order minimizes risk by validating child experience at each step:

1. **Phase 1** — Build, smoke test, ship.
2. **Phase 2** — Build. **Play with Chopin before continuing.** Navigation UX must be confirmed.
3. **Phase 3** — Build. **Play with Chopin again.** Confirm battle loop feels good.
4. **Phase 4** — Build. Play with Chopin (NPC warmth validation).
5. **Phase 5** — Build. Play with Chopin (reward loop validation).
6. **Phase 6** — Build. Light Chopin test (minigame discovery).
7. **Phase 7** — Build. Internal review only (no major design changes expected here).
8. **Phase 8** — Build. **Full Chopin session required.** Boss experience is emotionally critical.
9. **Phase 9** — Build iteratively. No strict sequence — add polish elements by priority.

---

## What This Document Does NOT Cover

- Battle question content for Green Meadow encounters (subject assignment — GPT must decide, WB-Q3).
- Specific learning levels per encounter (GPT must map regions to subject levels).
- Encounter frequency tuning (encounters per screen — to be validated in Phase 3 playtest).
- Audio file assets (all sounds use existing `playTone` system — no new audio files unless Phase 8 boss needs one).
- Sunny Beach implementation (Region 2) — this document covers Green Meadow only.

---

## Relationship to Other Documents

| Document | Relationship |
|---|---|
| `green-meadow.md` | Design source. Frozen. This doc breaks it into phases. |
| `kidquest-world.md` | World Bible. Phase 1 WorldScreen must be architected to eventually support all 8 regions. |
| `battle-feel-philosophy.md` | All battles in Green Meadow follow this grammar. Phases 3 and 8 inherit it. |
| `pokemon-style-learning-battle.md` | MoveSelectBattleMode is used in Phase 3 and 8 without modification (only config props). |
| `egg-home.md` | Egg Home is the departure and return point for every Phase 1+ session. |
| `docs/CURRENT_STATE.md` | Update after each phase ships to reflect live feature state. |
| `docs/GPT_HANDOFF.md` | Regenerate after each phase ships. |
