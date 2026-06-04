# GPT Notes — KidQuest
_Source of GPT → Claude knowledge. Update this when GPT makes decisions Claude should know._

---

## Egg Economy Decisions (2026-06-04)

- **Egg pacing formula decided and implemented:** `requiredXP = min(800, 120 + hatchedEggs.length × 60)`. First egg 120 XP (fast onboarding), cap at 800 for egg 13+. See `docs/research/rewards/egg-economy.md` for full rationale.
- **First egg must hatch within one session.** At 8–13 XP per correct answer, 120 XP ≈ 10–15 correct answers. This is the onboarding target.
- **Slower pacing is not punishment** — the egg visual still grows proportionally. The bar always moves. XP is never deducted.
- **No FOMO, no streak pressure, no paid acceleration.** These are non-goals permanently.
- **Creature stats now use weighted formula** — every stat has a 40% base floor. ATK is Math-weighted; DEF is Thai-weighted; SPD is English-weighted. Creature personality varies ±5% deterministically from XP seed. See `calcCreatureStats()` in `src/config/gameConfig.js`.
- **Open question for GPT:** Should egg 1 have a separate "onboarding" rule (e.g., always 80 XP regardless of formula)? Or is 120 XP sufficient? Decide based on real-play observation with Chopin.

---

## Research Notes

- **Mission system designed (2026-06-03)**: Year 1 missions use only existing mechanics (multipleChoice, matching, counting, wordOrder, spell, visualModel). No new mini-games needed. Each mission is currently its own component (`GameShop.jsx`). `MissionScreen.jsx` + `missionConfig.js` are the *future* target architecture — do not build until 2+ missions confirm the pattern.
- **Three starter missions designed**: Shop (🏪) → Cooking (🍳) → Garden (🌱). Each unlocks the next. Each builds on vocabulary from the previous.
- **Shop mission MVP (Phase B revised)**: 4 steps, ~2–3 minutes. Thai matching → English vocabulary → counting 1–5 → social phrase. Price/quantity-difference steps moved to Early Grade 1 stretch expansion.
- **Garden daily-habit loop noted**: Garden has potential for a gentle "your plant grew" daily indicator. Design this AFTER the static mission MVP is proven. Do not add obligation/anxiety mechanics.

---

## Curriculum Decisions

- **Mission unlock threshold is 80%** — aligned with existing subject-level rules. 70% gives a "soft pass" with partial rewards and encouragement but does not unlock the next mission. A 4-step MVP with 4 questions makes 70% too achievable by guessing.
- **Review missions give 60% XP** — enough to make replay worthwhile, not enough to make farming optimal.
- **Grade 1 stretch steps are optional for grade 0 (foundationComplete)** — shown for grade 1+ only.
- **Missions target Kindergarten core + Early Grade 1 stretch only.** Do not add Grade 2 content (fractions, multiplication, division) to any mission in Year 1.

---

## Product Decisions

- **Missions appear as cards on the Home screen** — between World Cards and EggRun banner. Locked missions show ??? preview.
- **Missions navigate from Home via GameScreen** — current routing: Home card → `GameScreen.jsx` → `GameShop.jsx` (world `'shop'`). Future target: → `MissionScreen.jsx`. No separate world map.
- **Missions are self-contained** — no persistent in-mission state between sessions (except the daily garden hint, added later).
- **Replay is always accessible** — completed missions never removed from Home. Child can replay at will.
- **New missions gently encourage forward** with cosmetic rewards and story continuity, never lock-outs.
- **Mastery-Gated Stretch Unlock** — missions have 3 layers: Core (Kindergarten, required) → Stretch (Early Grade 1, optional) → Challenge (Early Grade 1 harder, optional, bonus reward only). Deterministic rule, not AI.
- **Mastery signal (3 hard criteria):** accuracy ≥ 90% AND wrong answers ≤ 1 AND ≥ 2 completed runs. Speed is tracked as optional context only — never gates any unlock.
- **Core/Stretch/Challenge layers** — Core always available. Stretch unlocks when mastery signal met. Challenge unlocks after Stretch mastery. All layers remain replayable forever.
- **Shop Core MVP is exactly 4 steps:** Thai matching → English vocabulary → Counting 1–5 → Social phrase. Quantity difference and price concept are Shop Stretch, not Core.

---

## Architecture Suggestions

- **Phase C MVP: prefer `GameShop.jsx` first** — a focused, shop-specific component. Do not build a full generic `MissionScreen.jsx` until the shop pattern is validated through real play.
- **Minimum state for Phase C**: a small `shopV1` object in `defaultState()` to track mastery data: `{ bestScore, runs, mastered, stretchUnlocked }`. Not a full `completedMissions` map yet.
- **Suggested future shape** (after multiple missions exist): `completedMissions: { [missionId]: { bestScore, runs, mastered, stretchUnlocked, challengeUnlocked } }`. Do not implement this map until at least 2 missions exist.
- **Reuse existing patterns** from `GameMath.jsx` / `GameThai.jsx` / `GamePhonics.jsx` for XP, rewards, and result screen.
- **Staged refactor path**: Shop works → Cooking adds similar structure → if pattern holds, extract into `MissionScreen.jsx` + `missionConfig.js`. Not before.
- Do NOT create a separate save system for missions — store in the existing `kq_state` blob.

---

## Open Questions for Claude

1. **For `GameShop.jsx` MVP**: how should the 4-step sequence be wired? Inline `useState` step counter, or borrow the `cur/total` pattern from `GameMath.jsx`? Lean toward borrowing — it already handles progress bar, feedback, next button.
2. **Does the shop result screen need to differ from existing `ResultScreen`?** Probably reuse the same with different copy and emoji — verify before creating a new one.
3. **What `currentWorld` value during a shop mission?** `'shop'` is cleanest. Add a route in `GameScreen.jsx` and lazy-load `GameShop.jsx` like the other game screens.
4. **When to extract to `MissionScreen.jsx`?** After 2+ missions (shop + cooking) share the same step-sequence pattern. Not before.

---

## Play Observation System Decisions (2026-06-03)

- **Observation, not evaluation.** Data is for parents only. Children see nothing from this system.
- **Replay framing is always positive.** High replay count = engagement, never failure. No nudge ever says "still trying" or "struggling."
- **No AI-generated nudges.** All parent-facing recommendations are deterministic rules (e.g. `mastered === true` → "Shop Stretch is waiting"). Maximum one nudge shown at a time.
- **No speed tracking as gate.** Response time may be recorded in future but will never gate any unlock or trigger any nudge.
- **No peer comparison.** Existing Report.jsx peer-comparison card should be replaced with a play-history timeline in Phase D.
- **Session log is a ring buffer: last 50 sessions.** Written silently on existing result screens; no new child UI.
- **Per-mission state extended (not replaced):** `shopV1` gets `totalHints`, `totalDuration`, `phaseStats` alongside existing `bestScore / runs / mastered / stretchUnlocked`.
- **New action: `LOG_SESSION`.** One entry appended per completed session. Entries are small (~150 bytes each); total budget ~7.5 KB for 50 entries.
- **Phase D scope confirmed:** D0 Shop card UX audit, D1 state/reducer additions, D2 dispatch from all result screens, D3 Mission Analytics card in Report.jsx, D4 (optional) replace peer-comparison card.
- **Terminology (final):** use `completed` not `passed/failed`; use `challengePhase` not `hardestPhase`; use "current challenge area" not "most difficult phase". Observation uses game language, not exam language.
- **Engagement signals are more important than scores.** Session entry includes `replayedImmediately` and `nextAction` ('shop'|'math'|'thai'|'english'|'eggRun'|'battle'|'quit'). The child's voluntary next action is one of the strongest engagement signals.
- **Full design:** `docs/research/observation/play-observation-system.md`

---

## Subject Readiness Decisions (2026-06-03)

- **Subject Readiness is a derived layer inside Play Observation, not a separate system.** Computed from `sessionLog` at render time. No new state fields required. No AI.
- **Highest unlocked level is not a readiness proxy.** Children can unlock levels accidentally (one lucky run, random tapping). Voluntary replay and sustained accuracy are more meaningful signals.
- **Four states per subject (Thai, Math, English): Strong / Comfortable / Exploring / Not Ready.** Derived from last 10 sessions: avgScore, count of sessions with ≥80%, completion rate. Thresholds: Strong = avgScore ≥ 0.85 + goodRuns ≥ 3 + completionRate ≥ 0.80. Comfortable = avgScore ≥ 0.70 + goodRuns ≥ 2. Otherwise Exploring.
- **Mission content weighting should follow readiness, not level gates.** If Thai is Strong and English is Exploring, a mission should lean Thai-heavy and keep English light — not foreground the struggling subject. "Mission should follow the child. The child should not follow the mission."
- **Shop Core is already readiness-aligned.** Thai-heavy weighting reflects Kindergarten reality intuitively. No change needed.
- **Shop Stretch does not depend on Subject Readiness.** Stretch gates on the mastery signal (score ≥ 90% + wrong ≤ 1 + runs ≥ 2). Readiness is irrelevant for Shop Stretch. Proceed with Phase E independently.
- **Cooking Mission design depends on Subject Readiness.** Do not finalize Cooking Mission step sequence before consulting real readiness data from Phase D sessions. Readiness needs ~10 sessions per subject to stabilize. Let data accumulate during Phase E play before designing Cooking.
- **Subject Readiness Report display deferred.** No new code needed to collect the data (Phase D already does this). Report.jsx display can be added once sessions accumulate (~10+ per subject). Not a priority before Cooking Mission design.
- **Engagement signals are the readiness foundation.** `replayedImmediately` (strongest signal: child chose to return immediately) + replay count + completion rate + avgScore. High replay at lower accuracy > low replay at higher accuracy, as a readiness signal.
- **Full design:** `docs/research/observation/play-observation-system.md` (Subject Readiness section)

---

## Rejected Ideas

- **Full open-world exploration map** — Too much engine work. Not Year 1. Missions access via Home screen cards instead.
- **Animated shopkeeper/chef/gardener character** — Not MVP. Emoji + text is sufficient. Add later.
- **Real-time cooking timer** (stir before it burns) — Anxiety-inducing. Violates "no punishment mechanics" principle.
- **Plants that die if not watered** — Same issue. Garden has optional daily indicator only.
- **New mini-game mechanics for missions** — Rejected. All mechanics already exist. Content-only expansion.
- **Separate mission save system** — Rejected. Use existing `kq_state` blob.
- **Grade 2+ content in any Year 1 mission** — Rejected by Golden Rule. Fractions, large numbers, multiplication all out.
- **AI-generated adaptive questions** — Rejected for Year 1. Mastery-gated stretch is deterministic (simple rules), not AI.
- **Speed-required mastery** — Rejected. Speed may be tracked optionally but must never gate any unlock. Slow thinkers must not be penalised.
- **Forced progression to Stretch** — Rejected. Core must remain fully satisfying. Stretch is a reward, not a requirement.
