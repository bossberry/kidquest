# Tasks — KidQuest

## Now

- [ ] Replace `alert()` in `Home.jsx` with child-friendly in-app lock messages (EggRun + minigames)
- [ ] Add UI to change child name and grade (currently hardcoded `name:'โชแปง', grade:0`)

---

## Next

- [ ] Add `AI_OPPONENTS` tiers 2–5 (only tier 0+1 defined; older grades silently fall back)
- [ ] Sound toggle that persists across sessions (currently resets on reload)
- [ ] XP boost timer display on Home (star item active indicator)
- [ ] Update `SPEC.md` to reflect current React codebase

---

## Later

### Content
- [ ] Expand Thai Level 3 animal words (20 → 30+)
- [ ] Add Thai Levels 6+ (fruits, everyday objects, ป.1 curriculum)

### Features
- [ ] Profile / onboarding screen (name + grade selection)
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
- [x] Item system (food, star, ribbon, potion)
- [x] Minigames: EggRun, EggCatch, EggMemory, EggTower, EggFishing
- [x] Battle system (Pokémon-style) + Challenger system + Tier system
- [x] Thai: 5 levels; Math: 6 levels; English: 4 levels
- [x] Teach overlay, GameHeader, level mastery EMA, hint systems
- [x] Content expansion (Thai 24 words, CVC 24 words, Math 16 → 30 problems)
- [x] Bug fixes: Eng Level 3 unlock, CVCGame confetti, GameMath Play Again
- [x] Fanfare (≥90%) consistent across all subjects
- [x] Vercel migration; phonics audio → static .m4a files
- [x] Parent Report page
- [x] Project docs system (docs/ folder, CLAUDE.md, verification pass)
- [x] Auto sync upgrade (GPT_NOTES, GPT_HANDOFF, CLAUDE.md, TASKS.md restructure)
- [x] Math Level 0 (Foundation — count emoji, grade-0 only, no timer)
- [x] Math Level 7 (เปรียบเทียบ — comparison word problems)
- [x] Math Level 8 (รูปแบบ AB — pattern completion with emoji)
- [x] MATH_WORDS 16 → 30 (joining, taking-away, comparison types)
- [x] PATTERN_SETS added to gameConfig for AB pattern questions
- [x] foundationComplete state field + FOUNDATION_COMPLETE action
