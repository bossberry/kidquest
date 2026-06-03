# Tasks — KidQuest

## Now

- [ ] **Play Shop Mission with Chopin** — validate fun and timing before expanding. Target: 2–3 min, 80% pass on first or second run.
- [ ] **D0: Shop card UX audit** — review Home screen before next iteration. Questions: Can Chopin easily find the Shop card? Is it prominent? Above the fold? Exciting? Document ideas only — no implementation yet.

---

## Next

### Phase D — Play Observation System ✅ DONE

- [x] **D1: State + reducer** — `sessionLog: []` in `defaultState()`; `totalHints`, `totalDuration`, `phaseStats` added to `shopV1`; `LOG_SESSION` reducer; `UPDATE_SHOP_V1` extended
- [x] **D2: Dispatch from result screens** — `LOG_SESSION` dispatch: `GameShop.jsx` (with phaseStats + dur), `GameThai.jsx` (via extended `useFinishRound`), `GameMath.jsx` (`next()` when done), `GamePhonics.jsx` (all 4 game components)
- [x] **D3: Mission Analytics card in Report.jsx** — runs, avg score, avg duration, hints, per-phase difficulty (✅/⚠️), replay behavior text, deterministic nudge
- [x] **D4: Replace peer-comparison card** — "เทียบกับเด็กวัยเดียวกัน" replaced with play-history timeline (last 10 sessions, no peer reference)

### Phase D+ — Subject Readiness Documentation ✅ DONE

- [x] **Subject Readiness spec** — added to `play-observation-system.md`: 4 readiness states (Strong / Comfortable / Exploring / Not Ready), derivation logic (last 10 sessions, avgScore + goodRuns + completionRate), explicit non-goals. No new code.
- [x] **Mission system updated** — `mission-system.md` now includes "Subject Readiness and Mission Design" section: explains why unlock level is unreliable, how mission weighting should follow readiness profile, when to apply.
- [x] **GPT_NOTES.md updated** — Subject Readiness decisions recorded.

### Phase E — Shop Stretch (after play validation with Chopin)

- [ ] Review Shop Core with Chopin — confirm fun before expanding
- [ ] Add Shop Stretch (quantity difference + price concept) — only after Core mastery signal observed in play data
- [ ] Add mastery-gated stretch unlock UI ("เก่งมาก! มีภารกิจท้าทายเล็ก ๆ")

### Content expansion (after Phase D + E)

- [ ] **Subject Readiness Report display** — add readiness indicator to Report.jsx once ~10+ sessions per subject exist. Small addition to existing report card. No new state needed (derived from sessionLog). Deferred until data accumulates.
- [ ] Cooking Mission MVP (after Shop Core + Stretch confirmed + Subject Readiness data available)
  - ⚠️ **Do not design Cooking Mission step sequence before consulting readiness data from real play.**
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
- [x] **Phase D: Play Observation System** — `sessionLog` ring buffer (50 entries), `shopV1` extended (totalHints/totalDuration/phaseStats), `LOG_SESSION` reducer, dispatched from all 8 game result points, Mission Analytics card in Report, play history timeline replaces peer-comparison card.
