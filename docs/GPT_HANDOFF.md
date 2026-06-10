# GPT Handoff — KidQuest
_Regenerated after every Claude Code session. Single file for GPT to read._
_Last updated: 2026-06-10 (Feat: Green Meadow Phase 1 — World Foundation)_

**AI System:** GPT (research/curriculum/product) → `GPT_NOTES.md` → Claude Code (implementation) → `GPT_HANDOFF.md` → GPT. Claude Chatbot reads both sides for review. Chat history is NOT source of truth. See `docs/AI_SYSTEMS.md`.

---

## Project Vision (read this first)

**KidQuest grows with Chopin over many years.** It does not attempt to build a complete K-6 platform from day one.

**Golden Rule:** Build one mastery level ahead. Never six years ahead.

**Year 1 scope:** Kindergarten core + Early Grade 1 stretch only.

**Success metric:** Chopin voluntarily plays KidQuest and learns through it. Not feature count. Not grades covered. Joyful learning.

**All AI systems are scope guardians.** Warn before implementing anything that violates the Golden Rule, Year 1 scope, or stable engine philosophy. See `VISION.md` for full mandate.

---

## Latest Session Summary

**What changed this session: Green Meadow Phase 1 — World Foundation**

### Code changes

**7 files modified/created. Build: ✅ zero errors.**

| File | Change |
|------|--------|
| `src/config/worldConfig.js` | **NEW** — world config |
| `src/components/WorldScreen.jsx` | **NEW** — world screen component |
| `src/lib/state.js` | +3 world fields to defaultState() |
| `src/context/StateContext.jsx` | +4 actions + reducer cases |
| `src/App.jsx` | World route + BottomNav hidden for world |
| `src/components/Home.jsx` | Explore button → world navigation |
| `src/styles.css` | `.world-arrow-btn:active` CSS |

**`worldConfig.js`:** 9-screen Green Meadow grid (Pokémon FireRed model). BM=Starting Path (entry, connects N→MC, E→BR, W→BL). MC=Town Square (hub, N/S/E/W connections). TM/TL/TR/ML/MR/BL/BR = surrounding screens. Each screen: `label` (Thai), `region`, `connects {N/S/E/W}` (null = no exit), `theme` data for placeholder art.

**`WorldScreen.jsx`:** Full-screen overlay (`position:fixed;inset:0;zIndex:50`). Starting Path (BM) gets a full CSS art scene: sky gradient (day/night), sun with glow rings (day), moon+6 stars with twinkle animation (night), 2 animated CSS clouds (reuses `hbg-cloud-1/2`), distant hills (2 overlapping rounded divs at horizon), ground gradient, perspective trapezoid path (clip-path polygon — wide at bottom, narrow at top for depth), left+right bushes (2 per side), 5+5 flowers with `egg-home-float` animation, pollen particles (day only). Non-BM screens: unique sky/ground gradient + screen icon centered, no text. AC-style transition: 160ms fade to dark green overlay, screen snap, 160ms fade back. Direction arrows (N/S/E/W) only rendered where `connects[dir]` is non-null (BM shows North, East, West arrows — no South). Home button (🏠 กลับบ้าน) top-left always visible. Screen name (Thai) top-right. Egg avatar: child's current `EggCanvas` 80×95px, floats with `egg-home-float`, drop-shadow.

**State additions:** `currentRegion: null`, `currentScreen: null`, `discoveredScreens: []` in `defaultState()`.

**New ACTIONS:** `ENTER_WORLD` (sets region+screen, discovers), `EXIT_WORLD` (clears region+screen), `MOVE_SCREEN` (updates currentScreen), `DISCOVER_SCREEN` (appends to discoveredScreens, deduped).

**Home.jsx:** Explore button was `SET_CURRENT_WORLD('adventure-thai') + SET_SESSION_XP(0) + navigate('game')`. Now: `ENTER_WORLD({region:'green-meadow', screen:'BM'}) + navigate('world')`.

---

## Current Project State

KidQuest is a React 18 SPA (Vite, Vercel) — educational RPG for Thai children aged ~5+.

**Primary user:** Chopin (~5 years old). Likes Sonic + Pokémon. Game-first; learning should be invisible.

### What's fully working

**Green Meadow World (Phase 1 — World Foundation) — new this session:**
- Home → "ออกสำรวจ" → Green Meadow Starting Path
- Starting Path: full CSS art scene (see above)
- All 9 screens reachable via navigation arrows
- AC-style screen transition (160ms fade)
- Home button always visible
- Child's egg avatar floats in center of each screen
- State tracks currentRegion, currentScreen, discoveredScreens

**Learning system:**
- Thai: 5 levels (match, spell×3, word-order)
- Math: 9 levels (L0 Foundation, L1–L5 add/sub/mixed, L6 word, L7 comparison, L8 pattern)
- English: 4 levels (phonics, CVC, sight words, sentence ordering)
- Pokémon-Style Learning Battle (MoveSelectBattleMode): answer choices ARE attack moves. No player HP. Combo/ultimate system. Boss encounters.
- Subject Adventure Engine: 3 modes (Battle/Chase/Defense), rotates daily per subject
- Learning special move in classic BattleScreen (mid-battle emoji question + TTS)

**Egg + creature system:**
- Procedural egg: 9 stages, adaptive XP (120–800 per egg)
- Hatching → procedural creature with DNA (30+ genes, motif-based family)
- Creature canvas renderer with blink animation + personality body animation
- Legacy creature preview for old eggs
- Collection page, creature detail popup
- Item system (food/ribbon/star/potion)
- Egg interaction state machine: idle/pet/happy/excited/eating/sleep/relax/reunion

**Egg Home:**
- Large egg (190×225px) center, idle float / stage 7+ excited pulse
- Pet (chirp+sparkle), item tray, creature companion, action row
- Dramatic stage progression: per-stage aura glow, stage-up celebration
- Day/night HomeBackground scene (sky/sun/moon/clouds/hills/path/flowers)

**Battle system:**
- Turn-based battle (BattleScreen) + challenger system (every 15 rounds)
- AI_OPPONENTS all 6 tiers (Sonic villain theme)

**Minigames:** EggRun, EggCatch, EggMemory, EggTower, EggFishing

**Shop Mission:** 4 phases / 6 Qs. Analytics (sessionLog, shopV1, phaseStats).

**Persistence:** localStorage always-on + Supabase cloud sync + full guest mode.

**Parent Report:** Overview, subject time, strengths, Mission Analytics, Subject Readiness (from sessionLog), play history.

### Not done
- Green Meadow Phase 2–9 (movement, enemies, NPCs, treasure, minigame integration, boss)
- Payment / subscription (199 THB/month)
- Landing page, PWA, multi-child profiles

---

## Green Meadow: Where We Are

**Phase 1 (World Foundation) — DONE this session.**

```
Phase 1 ✅ — World Foundation (this session)
Phase 2 — Movement (egg walk animation, all screens feel alive)
Phase 3 — Visible Enemies (3 enemies, 80px trigger, battle entry/return)
Phase 4 — NPC System (5 NPCs, dialogue, gifts) [needs GM-Q10 answered]
Phase 5 — Treasure System (fixed/random/clovers) [needs GM-Q8 answered]
Phase 6 — Minigame Integration (fullscreen, return to position)
Phase 7 — Remaining Enemies (Leaf Sprite, Grumpy Mole, Mushroom Imp)
Phase 8 — King Clover Bear (boss arena, full boss flow) [needs GM-Q6 answered]
Phase 9 — Polish (ambient life, weather, secrets, music)
```

**Gate between Phase 2 and Phase 3:** Chopin must play and confirm navigation UX (edge arrows) feels comfortable for a 5-year-old.

**Frozen decisions (do not re-ask):**
| Question | Decision |
|---|---|
| GM-Q1: Navigation UX | Large edge arrows. Tap → egg walks. No joystick/D-pad. |
| GM-Q2: Encounter trigger | 80px enemy radius, 120px NPC radius. |
| GM-Q3: Transition | AC-style fade+scroll ~300ms. (Phase 1 uses 160ms dark overlay.) |
| GM-Q4: Bag | Unlimited. No inventory management. |
| GM-Q5: Minigame launch | Fullscreen. Return to same world position. |
| WB-Q1: World entry | Home → "ออกสำรวจ" → Green Meadow direct. No map screen. |
| WB-Q3: Subject assignment | Region+readiness. Green Meadow = Kindergarten level only. |
| WB-Q4: XP sources | Battles + treasure + NPC + collectibles + minigames + exploration. |

**Questions needed before specific phases:**
- GM-Q6 (boss rebattle curriculum) → before Phase 8
- GM-Q8 (collectible display location) → before Phase 5
- GM-Q10 (Post Bird quest chain scope) → before Phase 4

---

## Important Decisions (locked)

| Decision | Rule |
|----------|------|
| Egg algorithm | **LOCKED** — `eggAlgorithm.js` must never be modified |
| LocalStorage | Mandatory fallback — Supabase must never throw to user |
| Guest mode | Always works — full app without login |
| Child errors | Silent or friendly only — no stack traces |
| State blob | Full `state_json` in one Supabase row |
| Subject Readiness | Computed at render time from `sessionLog`. No new state. No AI. |
| Home screen | Egg Home (egg-centric). "ออกสำรวจ" button → Green Meadow. |
| World entry | Direct: Home → BM (Starting Path). No map selection screen. |
| World navigation | Large edge arrows (N/S/E/W). Only shown where connection exists. |
| World scope Year 1 | Green Meadow (Kindergarten) only. No other regions. |

---

## Recommended Next Work

**GPT — needed before Phase 2–8 code:**

1. **Phase 2: Watch Chopin play Phase 1** — Does the navigation (arrows) feel natural? Does Chopin understand to tap the arrows to move? Does the egg floating in each scene feel like "his character"? Write to `GPT_NOTES.md`. This gates Phase 3.
2. **GM-Q6: Boss rebattle curriculum** — After first defeat of King Clover Bear, should the boss come back in a new form? New questions? New subject focus? Write to `GPT_NOTES.md` before Phase 8.
3. **GM-Q8: Collectible display location** — Where do discovered clovers/treasures show up? On a screen? In the bag? Home screen badge? Write to `GPT_NOTES.md` before Phase 5.
4. **GM-Q10: Post Bird quest scope** — Is Post Bird a traveling NPC with simple gift-giving? Or a quest chain? Scope for Phase 4. Write to `GPT_NOTES.md`.
5. **Green Meadow enemy design confirmation** — Sleepy Bunny and Bouncy Slime are Phase 3 first batch. Any curriculum/behavior adjustments before Claude Code implements?
6. **Answer Egg Home open questions** (from `GPT_NOTES.md`) — still unanswered: egg naming, mood indicator, notifications, creature dialogue, desire indicator, hatch moment, ambient sound. These gate future Home polish.
7. **Answer 10 Procedural Character System open questions** — see `GPT_NOTES.md`. Key: creature evolution, name selection, family labels in UI, accessories. Gate Phase 4 (voice) + Phase 5 (birth sequence).

**Claude Code — next:**

1. **Phase 2: Movement** — egg walk animation when arrow tapped, all 9 screens have basic ambient elements (at minimum: sky/ground with correct theme). Gate: Chopin playtest before Phase 3.
2. **ECA-MVP-3: Relationship data fields** — `adventuresWith`, `questionsAnswered`, `eggStartDate` to `defaultState()` and `ADD_XP` reducer. Non-breaking.
3. **BattleMode.jsx cleanup** — `BattleMode.jsx` is dead code (replaced by `MoveSelectBattleMode`). Safe to delete after confirming no imports remain.

---

## Codebase Map (key files)

```
src/config/worldConfig.js       — Green Meadow screens, connections, themes (NEW)
src/components/WorldScreen.jsx  — World exploration screen (NEW)
src/config/gameConfig.js        — ALL game content (~380 lines)
src/context/StateContext.jsx    — Global state + ACTIONS (includes world actions)
src/lib/state.js                — defaultState() — includes currentRegion/currentScreen/discoveredScreens
src/components/Home.jsx         — Egg Home: egg-centric, "ออกสำรวจ" → world
src/components/HomeBackground.jsx — CSS art background for Egg Home (day/night)
src/games/GameSubjectAdventure.jsx — Subject Adventure: battle/chase/defense modes
src/games/MoveSelectBattleMode.jsx — Pokémon-style battle (replaces BattleMode)
src/lib/eggAlgorithm.js         — LOCKED procedural egg drawing
src/lib/creatureGenerator.js    — Procedural creature DNA + buildLegacyPreviewDNA
src/lib/drawCreature.js         — Creature canvas renderer
src/components/Collection.jsx   — Hatched eggs + creatures gallery
src/components/Report.jsx       — Parent report: Subject Readiness, play history
```

---

## Risks / Notes

- **Phase 2 playtest is the critical gate** — navigation UX for a 5-year-old is the highest risk. Edge arrows may not be intuitive without the egg actually walking toward the arrow.
- **Starting Path is fully implemented; other screens are placeholders** — they have correct navigation arrows but no content yet. This is intentional for Phase 1.
- **`discoveredScreens` accumulates but is not yet displayed** — Phase 5 (treasure) will use this for collectible display.
- **Home explore button no longer dispatches `SET_SESSION_XP`** — if this breaks any session-XP logic, check whether `SET_SESSION_XP(0)` was needed elsewhere.
- Single-child assumption baked into `defaultState()` — multi-child needs state refactor
- No session audit trail in Supabase — all progress in one blob per user
