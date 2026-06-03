# GPT Notes — KidQuest
_Source of GPT → Claude knowledge. Update this when GPT makes decisions Claude should know._

---

## Research Notes

- **Mission system designed (2026-06-03)**: Year 1 missions use only existing mechanics (multipleChoice, matching, counting, wordOrder, spell, visualModel). No new mini-games needed. Missions are data-driven — a thin `MissionScreen.jsx` wrapper sequences steps defined in `missionConfig.js`.
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
- **MissionScreen navigates from Home** — same pattern as GameScreen. No separate world map.
- **Missions are self-contained** — no persistent in-mission state between sessions (except the daily garden hint, added later).
- **Replay is always accessible** — completed missions never removed from Home. Child can replay at will.
- **New missions gently encourage forward** with cosmetic rewards and story continuity, never lock-outs.

---

## Architecture Suggestions

- **Phase C MVP: prefer `GameShop.jsx` first** — a focused, shop-specific component. Do not build a full generic `MissionScreen.jsx` until the shop pattern is validated through real play.
- **Minimum state for MVP**: one field `shopV1Complete: false` in `defaultState()`. No `completedMissions: {}`, no `currentMissionId`, no `START_MISSION` action needed for first build.
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

## Rejected Ideas

- **Full open-world exploration map** — Too much engine work. Not Year 1. Missions access via Home screen cards instead.
- **Animated shopkeeper/chef/gardener character** — Not MVP. Emoji + text is sufficient. Add later.
- **Real-time cooking timer** (stir before it burns) — Anxiety-inducing. Violates "no punishment mechanics" principle.
- **Plants that die if not watered** — Same issue. Garden has optional daily indicator only.
- **New mini-game mechanics for missions** — Rejected. All mechanics already exist. Content-only expansion.
- **Separate mission save system** — Rejected. Use existing `kq_state` blob.
- **Grade 2+ content in any Year 1 mission** — Rejected by Golden Rule. Fractions, large numbers, multiplication all out.
