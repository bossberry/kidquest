# Tasks — KidQuest

## Now

- [ ] **Implement Shop Mission MVP** — smallest safe path, design reviewed and approved
  - Read `docs/research/missions/shop-mission.md` first
  - **4 steps only**: Thai matching → English vocab → counting 1–5 → social phrase
  - **No price/money step** — moved to Early Grade 1 stretch expansion
  - **80% unlock threshold** to unlock next mission (aligns with subject levels)
  - Prefer `GameShop.jsx` over a full generic `MissionScreen.jsx` for first build
  - Minimum state: add `shopV1Complete: false` to `defaultState()` only
  - Reuse existing XP/reward patterns from `GameMath.jsx` / `GameThai.jsx`
  - Add shop card to Home screen between World Cards and EggRun
  - Route via `currentWorld: 'shop'` in `GameScreen.jsx`
  - **Do NOT build `MissionScreen.jsx` or `missionConfig.js` yet**
  - **Do NOT implement cooking or garden yet**

---

## Next

- [ ] Review Shop Mission with Chopin — confirm fun before expanding
- [ ] Cooking Mission MVP (after shop is confirmed working)
- [ ] Garden Mission MVP (after cooking is confirmed working)
- [ ] Thai Levels 6+ (fruits, everyday objects, short sentences — อนุบาล → early ป.1)
- [ ] Math Levels 9+ (place value, counting to 100 — early ป.1 stretch)
- [ ] English Levels 5+ (longer sentences, basic comprehension)

---

## Later

### Content
- [ ] Expand Thai Level 3 animal words (20 → 30+)
- [ ] Add English Level 5+ (longer sentences, paragraph comprehension)
- [ ] Add Math Levels 9+ (ABC patterns, multiplication intro)

### Missions
- [ ] Shop Mission variant 2 (different items: stationery / toy shop)
- [ ] Garden daily-habit loop (gentle "plant grew" indicator on Home)
- [ ] Mission unlock cosmetic rewards (new egg pattern, creature color)

### Features
- [ ] First-run onboarding flow (before ProfileModal is opened manually)
- [ ] Daily learning habit indicators
- [ ] Parent dashboard (protected route, separate from Report tab)
- [ ] PWA manifest + service worker (offline support)

### Infrastructure
- [ ] Per-session logging to Supabase `sessions` table
- [ ] Multi-child profiles (state shape refactor + `children` table)
- [ ] Payment integration (Omise or Stripe, 199 THB/month)
- [ ] Landing / marketing page

---

## Done

- [x] React migration (single-file HTML → React 18 + Vite)
- [x] Supabase auth (email/password) + cloud state sync; guest mode
- [x] LocalStorage always-on fallback
- [x] Procedural egg algorithm + 7-stage evolution (LOCKED)
- [x] Procedural creature drawing (Canvas)
- [x] Hatching animation + creature reveal; Collection page
- [x] Item system (food, star, ribbon, potion); XP boost; happiness decay
- [x] Tier system (6 tiers); calcCreatureStats(); creature battle stats
- [x] Minigames: EggRun, EggCatch, EggMemory, EggTower, EggFishing
- [x] Battle system (Pokémon-style animation + turn log)
- [x] Challenger system (every 15 battle rounds) + ChallengerOverlay
- [x] AI_OPPONENTS tiers 0 and 1 (with normal/mini-boss/boss entries)
- [x] Thai: 5 levels; English: 4 levels
- [x] Math: 9 levels (L0 Foundation, L1–L5 add/sub/mixed, L6 word, L7 comparison, L8 pattern)
- [x] Math visual models: objects (L1/L2), tenFrame (L3), crossOut (L4), dots (L5+)
- [x] Math PATTERN_SETS + pattern question type (emoji sequence + AB completion)
- [x] Math Foundation mode (count emoji, grade-0 only, no timer, foundationComplete flag)
- [x] MATH_WORDS 16 → 30 (joining, taking-away, comparison types)
- [x] Teach overlay, GameHeader, level mastery EMA, hint systems
- [x] Content expansion (Thai 24 words, CVC 24 words)
- [x] Bug fixes: Eng Level 3 unlock, CVCGame confetti, GameMath Play Again
- [x] Fanfare (≥90%) consistent across all subjects
- [x] Migrate hosting Netlify → Vercel; phonics audio → static .m4a files
- [x] Parent Report page (time, accuracy, subject breakdown, AI insights)
- [x] Project docs system (docs/ folder, CLAUDE.md, AI_SYSTEMS.md, GPT_HANDOFF workflow)
- [x] **Phase 1 UX**: replace alert() with showToast(); ProfileModal with name + grade; SET_PROFILE action
- [x] **Phase 2 UX**: sound toggle persists via `kq_sound` localStorage key; XpBoostBadge countdown in Home header
- [x] **Phase 3**: AI_OPPONENTS tiers 2–5 added; grade→tier mapping fixed in StateContext (was hard-capped at tier 1)
- [x] Vision + scope documentation (PROJECT.md, VISION.md, GOALS.md, scope guardian mandate)
- [x] Math research reorganized into topics/curriculum/learning-path/categories structure
- [x] **Mission system designed**: shop, cooking, garden missions documented in docs/research/missions/
