# Decisions — KidQuest

## Locked Decisions

- **Procedural Egg Algorithm is locked.** The seed formula `hash(name+grade) XOR hash(dow+month+day+hour)` and all visual mapping rules must not change. Changing it would break egg visual consistency for existing players.
- **LocalStorage fallback is mandatory.** All Supabase operations must fail silently and fall back to localStorage. The app must work completely offline and without auth.
- **Guest mode must always work.** Full game functionality must be available without login. Auth is optional cloud sync only.
- **Child-facing errors must be silent or friendly.** No technical error messages shown to the child. Supabase failures: silent. Game errors: friendly emoji messages only.
- **Do not break the existing React app structure** unless a full migration is explicitly requested. The prototype-to-React migration is complete; no rollback.

---

## Architecture Decisions

- **Single state blob in Supabase** (`state_json jsonb` in `eggs` table) rather than normalized per-session rows. Simpler to implement; acceptable for single-child prototype. Will need to change for multi-child or analytics.
- **useReducer + Context** (not Zustand/Redux) for global state. Keeps dependencies minimal. If complexity grows significantly, migration to Zustand is the recommended path.
- **Canvas-based drawing** for eggs and creatures. No SVG or image assets. Keeps bundle small and makes each egg/creature unique.
- **Web Speech API for Thai TTS**, not a paid TTS service. Free, works on all modern browsers, sufficient quality for a child's learning app.
- **Static .m4a files for English phonics** (moved from base64 in JS bundle). Reduces initial bundle size significantly and allows browser caching.
- **React lazy imports** for all game screens (`GameScreen.jsx`). Game code is code-split from the main bundle.
- **Vite** as build tool. Fast dev server, simple config. No need for Next.js since this is a pure client-side app.
- **SPEC.md is deprecated** — exists only as historical reference for the old HTML prototype. New sessions must rely on `docs/CURRENT_STATE.md` and `docs/GPT_HANDOFF.md`, not SPEC.md.

---

## Product Decisions

- **Primary user is the child**, not the parent. UI/UX, language, and feedback are optimized for the child. Parents access data via the Report tab.
- **No punishment mechanics.** Happiness decreases slowly with idle time but never goes to 0. No "lives lost" in core learning games. Replay is always accessible.
- **Mastery-based progression, not age-based.** Levels unlock when the child demonstrates ≥80% mastery. Grade is a starting hint, not a ceiling.
- **Golden Rule: build one mastery level ahead.** Year 1 = Kindergarten core + Early Grade 1 stretch. Do not build Grade 2+ content until Chopin is approaching Grade 1.
- **Single child per account** in the current prototype. Multi-child support is a future feature.
- **Subscription model**: 199 THB/month (not yet implemented; not needed until app is ready to share).
- **Thai language first**. All UI text is Thai where possible. English subject uses English content but UI labels stay Thai.
- **Replay is healthy.** Completed levels always remain accessible. Children are encouraged forward through rewards and story, never forced.
- **Mission integration over subject isolation.** Future missions should naturally blend Math, Thai, English, and general knowledge. Subjects are not isolated apps.
- **Stable engine over new mechanics.** Prefer data-driven content in existing mechanics over new unique mini-games. A small number of mechanics should support thousands of levels.

---

## Child Safety / UX Decisions

- **No external links** shown to children within the app.
- **No social features** (leaderboards, friend codes) in current implementation.
- **Streak mechanics are positive only** — shown as 🔥 counter, never used to shame or penalize.
- **Egg "death" does not exist.** Eggs never die or reset due to inactivity. Happiness can drop but the egg persists.
- **Level lock UI**: nearby locked levels show a preview + 🔒; distant locked levels show `???`. Children can see what's coming but can't skip ahead.
- **All audio is on by default.** Sound toggle is available on Home screen and persists for the session.
- **`alert()` calls should be replaced** (known issue in `Home.jsx` for EggRun/minigame lock messages) with in-app friendly UI — but do not break existing behavior while fixing.

---

## AI Sync Decisions

Full system definition: `docs/AI_SYSTEMS.md`.

- **Chat history is NOT source of truth.** Documentation files are shared memory.
- `docs/GPT_NOTES.md` — GPT writes decisions here; Claude Code reads before every session.
- `docs/GPT_HANDOFF.md` — Claude Code writes here after every session; GPT reads next.
- Claude Chatbot reads `GPT_HANDOFF.md` + `GPT_NOTES.md` + state docs for review/discussion.
- GPT reads only `GPT_HANDOFF.md` unless deeper review is needed.

## Scope Guardian Decisions

- **All AI systems act as scope guardians.** Their responsibility includes protecting KidQuest from unnecessary complexity and scope creep.
- **Warn before proceeding** when a request violates the Golden Rule, Year 1 scope, stable engine philosophy, or non-goals. Explain the violation, suggest a smaller alternative, then proceed only if the user explicitly overrides.
- **The user always has final authority.** Warnings are expected behavior, not obstruction.
- See `VISION.md` → Scope Guardian Mandate for the full list of warning triggers.
