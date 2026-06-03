# Architecture — KidQuest

## User Flow

```
Open app
  ↓
StateProvider initializes
  ├── Load localStorage (sync, immediate render)
  ├── Trigger: happiness decay, daily reset checks
  └── Async: loadState() → if logged in → Supabase overrides local

Home Screen
  ├── Tap egg → EggPopup (stats + feed items)
  ├── Tap world card → navigate('game') with currentWorld set
  ├── Tap EggRun button → if dailyRounds ≥ 10 → EggRun minigame
  ├── Tap minigame → if eggs hatched ≥ threshold → minigame
  └── Tap Login → LoginModal

Game Screen
  └── GameScreen routes by currentWorld:
      ├── thai → GameThai
      ├── math → GameMath
      ├── eng → GamePhonics
      └── eggrun/catch/memory/tower/fishing → Minigame

Bottom Nav (hidden during game)
  └── Home | Collection | Report
```

---

## Game Flow (per subject)

```
LevelSelector (shows unlocked + nearby locked levels)
  ↓ player taps a level
Check seenTeach[]
  ├── Not seen → TeachOverlay (mascot + examples) → mark seen
  └── Seen → skip directly to game

Game Mode (depends on level type):
  ├── match (Thai L1): multiple choice, tap correct picture
  ├── spell (Thai L2-L4): tap tile-by-tile to spell word; hint after 1 miss
  ├── wordorder (Thai L5, Eng L4): tap words in order to build sentence
  ├── phonics (Eng L1): hear letter → tap correct picture
  ├── cvc (Eng L2): hear word → tap correct spelling
  ├── sight (Eng L3): fill-in-blank from choices
  └── math (all 6): choose correct answer; timer; 3-attempt hint reveal

On each correct answer:
  → ADD_XP (world, amount) → egg stage may advance
  → optional: item drop → ItemToast

On round complete (all questions done):
  → ROUND_COMPLETE → dailyRounds++
  → UPDATE_LEVEL_MASTERY (EMA)
  → if accuracy ≥ 80%: UNLOCK_LEVEL
  → if accuracy ≥ 90%: fanfare + confetti
  → ResultScreen (replay / back to levels)
```

---

## XP / Egg / Creature Flow

```
Correct answer in any game
  → ADD_XP dispatched
  → xpThai/xpEng/xpMath increases
  → totalXP = xpThai + xpEng + xpMath
  → stage = floor(min(totalXP, 350) / 50)   [0-6]
  → readyToHatch = stage >= 6

When readyToHatch:
  → Home shows "แตะเพื่อฟัก!" button
  → Tap → SET_HATCHING(true) → HatchOverlay appears

HatchOverlay:
  → Plays hatch animation (tap mechanic)
  → getCreatureForHatch(state) → determines creature name, emoji, rarity
  → HATCH_COMPLETE dispatched:
      ├── Saves creature to hatchedEggs[]
      ├── Resets xpThai/xpEng/xpMath to 0
      ├── New egg starts immediately (new seed from current time)
      └── firstSubject reset to -1

Creature stats:
  → calcCreatureStats(eggSnap) uses tier, streak, acc, xpThai/xpEng/xpMath proportions
  → Stats: HP, ATK, DEF, SPD, CRIT, LUCK

Battle:
  → BattleScreen: player creature vs AI opponent from AI_OPPONENTS config
  → simulateBattle() pre-computes full turn log
  → Animation plays turn by turn with sounds
  → Win: item reward, RECORD_BATTLE, possible boss defeat
  → Every 15 dailyBattleRounds: SET_CHALLENGER → ChallengerOverlay
```

---

## Persistence Flow

```
Every state change (useEffect in StateProvider):
  → saveState(state)
      ├── localStorage.setItem('kq_state', JSON.stringify(state))  ← synchronous
      └── syncToSupabase(state)  ← fire-and-forget, silent fail

App load:
  → StateProvider initializer reads localStorage synchronously (for immediate render)
  → loadState() async:
      ├── If Supabase user: fetch eggs table
      │     ├── Cloud data exists: overwrite local + dispatch INIT
      │     └── Cloud empty: use localStorage
      └── No user: use localStorage
      → _migrateEggs() runs on loaded data

On SIGNED_IN auth event (LoginModal success):
  → If cloud has data: dispatch INIT with cloud state
  → If cloud empty: syncToSupabase(stateRef.current) ← pushes local up
```

---

## Parent Report Flow

```
Report tab:
  ← reads from global state (no separate API call)
  ← all data derived from: xpThai/xpEng/xpMath, mins, rounds, acc, streak

Displays:
  ├── Total minutes, total rounds, accuracy %, streak
  ├── Time per subject (bar chart derived from XP proportions)
  ├── Dominant subject, weak subject
  ├── Speed label (derived from state.speed EMA)
  └── AI insights text (hard-coded conditional sentences based on stats)

Note: Report data is approximate — `mins` increments by 0.25 per correct answer,
not wall-clock time. Speed/accuracy are EMAs, not exact per-session values.
```

---

## Battle Flow

```
Home → tap a world card → game → complete rounds
  → dailyBattleRounds increments via ROUND_COMPLETE
  → StateContext watches dailyBattleRounds:
      If >= 15 and no pendingChallenger:
        → pick random AI_OPPONENTS[tier] opponent
        → dispatch SET_CHALLENGER

ChallengerOverlay detects pendingChallenger in state
  → shows challenger announcement
  → player accepts → BattleScreen renders

BattleScreen:
  → builds player stats from current hatchedEggs[0] (or current egg if no hatched)
  → simulateBattle(player, opponent) → log[]
  → animates log with delay between turns
  → on finish: RECORD_BATTLE → CLEAR_CHALLENGER
```

---

## Stable Engine Note

The core systems (state, persistence, egg algorithm, battle, minigames) are stable and should not be rewritten without explicit justification. Future growth comes primarily from **content** (new levels, new words, new missions) fed into existing mechanics, not from engine rewrites.

`SPEC.md` describes the old HTML prototype — it is deprecated. The React migration is complete.

See `VISION.md` → Stable Engine Philosophy for the full design rationale.
