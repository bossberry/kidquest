# KidQuest — Project Brief

## What It Is

KidQuest is a bilingual educational RPG that grows with one child over many years.

**Primary user:** Chopin — born July 18, 2020. Loves Sonic, Minecraft, Pokémon.  
**The Golden Rule:** Build one mastery level ahead. Never six years ahead.

Play first. Learning happens naturally through exploration, battles, and a creature they care for.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, plain CSS |
| State | useReducer + Context + localStorage (`kq_state`) |
| Backend | Supabase (PostgreSQL + email/password auth) |
| Hosting | Vercel (auto-deploy from `main` branch) |
| Notifications | ntfy.sh/kidquest-boss |
| Audio | Web Speech API (TTS), Web Audio API (SFX), static `.m4a` phonics |
| Canvas | HTML Canvas 2D — procedural egg (LOCKED) + pixel art creature sprites |

---

## Systems (Live)

**Egg System** — Procedural canvas egg (eggAlgorithm.js, LOCKED). 9 stages, adaptive XP. Pet/feed/item interactions with formal state machine (idle/pet/happy/excited/eating/sleep/relax/reunion).

**Creature System** — 6 elements × 3 evo stages. Pixel art rendering via `creatureAlgorithm.js` (single source of truth for all screens). DNA-based organic look via `drawCreature.js` (HatchOverlay only). Bond meter 0–100 with combat bonuses. Auto-generated Thai names. Up to 6 lifetime creatures.

**Battle System** — Pokémon-style via `MoveSelectBattleMode.jsx`. Answer choices = attack moves. Real HP combat. 6 elements × 4 tiers of canvas animations. Battle items (scroll/thunder/gem/mirror/clover). Party system (up to 4 slots). Enemy scaling by player level (Math.pow formula).

**Map System** — Canvas tile engine (`tileEngine.js` + `tileMaps.js`). 4 maps per world tier + secret maze + boss map. 3 world tiers (Green Meadow → Dark Forest → Crystal Cave). D-pad navigation, 9 enemy types, treasure chests, screen transitions. World HUD with mini-map, party status, XP bar, items.

**Learning System** — 3 subjects, mastery-based unlock (≥80% accuracy EMA):
- Thai: 5 levels (match → spell → word-order)
- Math: 9 levels (count → add/sub → word problems → patterns)
- English: 4 levels (phonics → CVC → sight words → sentence ordering)

**Collection Screen** — Party / vault / all-creatures / current-egg tabs. Creature detail popup with pixel art canvas, ATK/DEF/SPD/HP, bond meter, born-stats XP bars.

**Report Screen** — Subject readiness (4 states), response time analytics, session history.

**Home Screen** — Canvas background (walking creatures, day/night cycle). Egg interaction zone + creature zone. Item tray, party portrait bar.

**Minigames (5)** — EggRun, EggCatch, EggMemory, EggTower, EggFishing. All lazy-loaded.

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Rules for Claude Code (read every session) |
| `docs/CURRENT_STATE.md` | What is implemented right now |
| `docs/TASKS.md` | Now / Next / Later |
| `docs/CHATBOT_NOTES.md` | Active decisions from Claude Chatbot |
| `docs/DECISIONS.md` | Locked rules that never change |
| `src/lib/eggAlgorithm.js` | LOCKED — never modify |

---

## Constraints

- Guest mode always works — no login required
- `eggAlgorithm.js` is LOCKED forever — `drawEgg()`, `hash()`, `prng()` must never change
- localStorage is always-on; Supabase is optional cloud sync
- Child-facing errors: silent or friendly only, never technical
- Business model: 199 THB/month subscription (not yet implemented)
- Hosting: Vercel; Supabase: `https://dgpsnlkedergkbhqnjpu.supabase.co`
