# Session Summary — 2026-06-04 (Home 2.0 Adventure Director)

**Files changed:** `src/components/Home.jsx`, `src/components/Report.jsx`, `docs/`×5

## Bug Fixes (Priority 1)

**Report.jsx — MissionAnalytics NaN:**
- Root cause: pre-Phase-D state has `shopV1` without `totalDuration`, `totalHints`, `phaseStats`. Destructuring without defaults → `undefined` in math → NaN.
- Fix: `totalHints = 0`, `totalDuration = 0` destructuring defaults.
- Fix: `avgScore` returns `null` when `totalQs === 0` (no phaseStats data) → renders `—` not `0%`.
- Fix: `avgDur` returns `null` when `totalDuration === 0` → renders `—` not `NaN`.
- No state migration needed — pure display fix.

## Home 2.0 (Priority 2)

**Adventure Director philosophy:** Home answers "What should I do next?" not "What do you want to choose?"

**`⭐ ผจญภัยต่อ`** — single large recommendation card (top of page, below egg):
- Priority: hatch → shop first run → weakest-subject-by-XP
- Deterministic, no AI, no new state

**`🎁 เซอร์ไพรส์วันนี้`** — replaces 2×2 minigame grid:
- One minigame per day via `dateHash % unlockedMinigames.length`
- Played-today check: reads `sessionLog` (no new state)
- If no minigames unlocked: teaser "ฟักไข่เพื่อปลดล็อกเซอร์ไพรส์!"
- If played today: "เล่นแล้ว! มาพรุ่งนี้นะ 🌙"

**Preserved:** Egg, Shop Mission card, Egg Run, subject grid (relabeled "หรือเลือกเรียน"), stats strip.

## Known Risks
- Recommendation always picks lowest-XP subject; intentional for balance, but may feel repetitive early on.
- Surprise rotation is date-based only — if only one minigame is unlocked it repeats daily. Acceptable.
