# GPT Notes — KidQuest
_Source of GPT → Claude knowledge. Update this when GPT makes decisions Claude should know._

---

## Research Notes

- **Mission system designed (2026-06-03)**: Year 1 missions use only existing mechanics (multipleChoice, matching, counting, wordOrder, spell, visualModel). No new mini-games needed. Missions are data-driven — a thin `MissionScreen.jsx` wrapper sequences steps defined in `missionConfig.js`.
- **Three starter missions designed**: Shop (🏪) → Cooking (🍳) → Garden (🌱). Each unlocks the next. Each builds on vocabulary from the previous.
- **Shop mission is MVP**: 6 steps, ~3–5 minutes, Kindergarten content with one Grade 1 stretch step. Familiar context (ร้านของชำ). Integrates Thai, Math, English, and general knowledge naturally.
- **Garden daily-habit loop noted**: Garden has potential for a gentle "your plant grew" daily indicator. Design this AFTER the static mission MVP is proven. Do not add obligation/anxiety mechanics.

---

## Curriculum Decisions

- **Mission unlock threshold is 70%** (lower than subject level 80%) — integration is harder than isolated practice.
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

- **New file: `src/config/missionConfig.js`** — all mission data (steps, rewards, unlock conditions). Keeps mission content out of React components.
- **New component: `src/games/MissionScreen.jsx`** — thin wrapper that reads mission data, sequences step components, tracks progress, shows ResultScreen.
- **Reuse existing step components**: ThaiMatchGame pattern, genQ multipleChoice, counting type, wordOrder pattern. Pass mission step data as props.
- **New ACTIONS for missions**: `START_MISSION`, `COMPLETE_MISSION_STEP`, `FINISH_MISSION`. Track in state: `completedMissions: {}`, `missionMastery: {}`.
- **State field additions needed**: `completedMissions: {}` (id → best score), `currentMissionId: null`.
- Do NOT create a separate save system for missions — store in the existing `kq_state` blob.

---

## Open Questions for Claude

1. **How does MissionScreen.jsx reuse existing question components?** Does it import ThaiMatchGame, genQ etc. directly, or does it define a shared `QuestionStep` component? The answer affects how much new code is needed.
2. **Does the mission result screen differ from the existing ResultScreen?** Probably the same component with different copy — confirm before creating a new one.
3. **What is the correct `currentWorld` value when a mission is active?** Missions blend subjects — `SET_CURRENT_WORLD` may not map cleanly. Suggest using `'mission'` as the world value and routing in GameScreen.jsx.
4. **How many missions can `kq_state` blob hold before Supabase sync becomes a concern?** Missions are small (id + score) — probably fine for 10–20 missions, but worth checking.

---

## Rejected Ideas

- **Full open-world exploration map** — Too much engine work. Not Year 1. Missions access via Home screen cards instead.
- **Animated shopkeeper/chef/gardener character** — Not MVP. Emoji + text is sufficient. Add later.
- **Real-time cooking timer** (stir before it burns) — Anxiety-inducing. Violates "no punishment mechanics" principle.
- **Plants that die if not watered** — Same issue. Garden has optional daily indicator only.
- **New mini-game mechanics for missions** — Rejected. All mechanics already exist. Content-only expansion.
- **Separate mission save system** — Rejected. Use existing `kq_state` blob.
- **Grade 2+ content in any Year 1 mission** — Rejected by Golden Rule. Fractions, large numbers, multiplication all out.
