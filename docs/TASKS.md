# Tasks — KidQuest

## Now

- [ ] **[CRITICAL] Commit + push Phase C app code** — `GameShop.jsx`, `Home.jsx`, `StateContext.jsx`, `GameScreen.jsx`, `state.js`, `GamePhonics.jsx` are all uncommitted. Run `npm run build` first, then commit and push to trigger Vercel deploy. Production is currently on Phase 3 (no Shop Mission visible). See workflow below.
- [ ] **Play Shop Mission with Chopin** — validate fun and timing before expanding. Target: 2–3 min, 80% pass on first or second run. (Requires Phase C to be deployed first.)

---

## Next

### Phase D — Play Observation System (can start independently of play validation)

- [ ] **D0: Shop card UX audit** — review Home screen before implementing observation. Questions: Can Chopin easily find the Shop card? Is it visually prominent? Does it look exciting? Is it above the fold? Would a first-time child notice it? Document ideas only — do not implement UI yet.
- [ ] **D1: State + reducer** — add `sessionLog: []` to `defaultState()`; add `totalHints`, `totalDuration`, `phaseStats` to `shopV1`; add `LOG_SESSION` reducer; extend `UPDATE_SHOP_V1` to accept hints/dur/phaseStats payload
- [ ] **D2: Dispatch from result screens** — add `LOG_SESSION` dispatch to `GameShop.jsx` done screen + `useFinishRound` in GameThai/GameMath/GamePhonics
- [ ] **D3: Mission Analytics card in Report.jsx** — show runs, avg score, avg duration, hints, phase difficulty breakdown, replay framing, deterministic nudge
- [ ] **D4 (optional, same PR): Replace peer-comparison card** — replace "เทียบกับเด็กวัยเดียวกัน" card in Report.jsx with a play-history timeline (no peer reference)
- [ ] Full design spec: `docs/research/observation/play-observation-system.md`

### Phase E — Shop Stretch (after play validation with Chopin)

- [ ] Review Shop Core with Chopin — confirm fun before expanding
- [ ] Add Shop Stretch (quantity difference + price concept) — only after Core mastery signal observed in play data
- [ ] Add mastery-gated stretch unlock UI ("เก่งมาก! มีภารกิจท้าทายเล็ก ๆ")

### Content expansion (after Phase D + E)

- [ ] Cooking Mission MVP (after Shop Core + Stretch are confirmed working)
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
- [ ] Shop Challenge layer (counting 6–10, more/less, simple change concept) — after Stretch validated
- [ ] Shop Mission variant 2 (different items: stationery / toy shop)
- [ ] Garden Mission MVP (after Cooking confirmed working)
- [ ] Garden daily-habit loop (gentle "plant grew" indicator on Home)
- [ ] Mission unlock cosmetic rewards (new egg pattern, creature color)
- [ ] Refactor to generic `MissionScreen.jsx` + `missionConfig.js` (after 2+ missions share same pattern)

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

## Development Workflow (required every session that changes app code)

```
1. npm run build          → confirm zero errors before committing
2. git add <files>        → stage specific files (never git add -A blindly)
3. git commit             → meaningful message
4. git push origin main   → triggers Vercel auto-deploy
5. Open production URL    → verify the change is live and working
6. Update docs            → CURRENT_STATE, TASKS, CHANGELOG, GPT_HANDOFF (same commit or next commit)
```

Vercel auto-deploys from every push to `main`. There is no manual deploy step.
Production URL: check `vercel.json` or Vercel dashboard for the live URL.

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
- [x] **Phase C: Shop Mission MVP** — `GameShop.jsx` (4 phases / 6 Qs), `shopV1` state, `UPDATE_SHOP_V1` reducer, shop card in Home, `world === 'shop'` routing. Build passes.
