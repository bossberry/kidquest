# Session Summary — 2026-06-04 (Shop Mission speech feedback)

**Session type:** Code change. Build ✅ zero errors.

**Files changed:**
- `src/games/GameShop.jsx` — speech added after correct answers
- `docs/research/progression/gameplay-loop.md` — Learning Feedback Principles section added
- `docs/GPT_NOTES.md` — Learning Feedback Principles section added
- `docs/TASKS.md` — task marked done
- `docs/SESSION_SUMMARY.md`, `docs/CHANGELOG.md`, `docs/GPT_HANDOFF.md` — updated

## What changed in GameShop.jsx

Three additions:
1. `speakTh, speakEn` added to import from `'../lib/audio.js'`
2. `THAI_NUMS` array added (หนึ่ง through สิบ) for math/counting speech
3. After each correct answer, in the `check()` function:
   - Thai questions → `setTimeout(() => speakTh(val), 380)` — speaks the Thai word/phrase the child just matched
   - English questions → `setTimeout(() => speakEn(val), 380)` — speaks the English word
   - Math/counting → `setTimeout(() => speakTh(THAI_NUMS[val] || String(val)), 380)` — speaks Thai number word

## Why 380ms delay
The `playTone('correct')` tone plays for ~280ms. The `playTone('streak')` plays for ~320ms. 380ms gives the tone time to finish before speech starts, avoiding audio collision. Speech uses `speechSynthesis`, which is separate from Web Audio API, so they technically don't block each other — but the delay makes the feedback feel sequential and clean rather than simultaneous.

## Sound toggle
`speakTh` and `speakEn` both check `_soundOn` internally before doing anything. If the user has muted, no speech plays. No extra guard needed at the call site.

## What was NOT changed
- All tone calls preserved (correct, wrong, streak, fanfare, next)
- All game logic unchanged
- No new audio assets
- No new audio engine

## Learning goal
After tapping the correct answer:
1. Visual: green highlight + feedback message
2. Sound: correct/streak tone
3. Speech: spoken word (380ms after)

Child hears the word they just learned to recognize → written word + spoken sound + meaning all fire together. This is especially important for Thai and English vocabulary acquisition.

## Known risks
- **Browser TTS voice availability varies.** If no Thai voice is installed (common on some Android/Windows), `speakTh` falls back to the default voice with `lang='th-TH'`. The speech may sound wrong but won't crash.
- **iOS requires user interaction to initiate audio.** First tap on a choice should satisfy this requirement. `getACtx()` is already called on first `playTone`, which primes the audio context.
- **Speech may feel slow on low-end devices.** If TTS is slow to initialize, the 380ms delay might feel tight. Acceptable risk — the feedback is still correct if delayed.
