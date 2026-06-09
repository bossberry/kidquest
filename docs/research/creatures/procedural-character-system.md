# Procedural Character System
_KidQuest — Design Document_
_Created: 2026-06-09_

---

## Why This Exists

The current creature system is a pool of 15 fixed emojis (🐘 🐍 🦅 🐉 🦊 🦄 🤖 💎 ⚡ and a few hybrids). Every child who dominates Thai gets one of three creatures. Every child who dominates Math gets one of three different ones.

This is exactly the "Creature #137" problem. The creature has no relationship to the egg it came from, no connection to how the child played, and no reason for a five-year-old to feel "this is mine."

**The goal of this system:** When a creature hatches, the child should recognize it as the inevitable result of the egg they cared for — as if the creature was always inside it, waiting. The colors match. The shape echoes the egg's patterns. The personality reflects how the child played. Everything feels earned.

**Design test:** Show a child their egg. Then show their creature. They should say "yes, that's right" — not "where did that come from?"

---

## Architecture

```
[Child plays + hatches egg]
          ↓
[Egg Stats]
  name · grade · dow · month · day · hour
  xpThai · xpEng · xpMath
  streak · acc · speed · mins
  firstSubject · stage
          ↓
[Base Seed — already computed by egg algorithm]
  hash(name + grade) ^ hash(dow + month + day + hour)
          ↓ (LOCKED — eggAlgorithm.js does not change)
[Egg Algorithm → drawEgg()]
  Generates unique egg canvas visuals
          ↓
[Creature DNA Extractor]  ← NEW (creatureGenerator.js)
  Re-uses same hash() + prng() from eggAlgorithm.js
  Mixes base seed with 'creature' constant to get new stream
  Maps to 40+ independent gene bits
          ↓
[Art Direction Layer]
  Enforces cute/warm/huggable constraints
  Resolves conflicts (no ugly combinations)
  Scales feature density by hatch stage
          ↓
[Animation Profile]
  Idle behavior weights per personality
  Reaction animation set
          ↓
[Voice Profile]
  Pitch · family · variance
          ↓
[Rendered Creature]
  Canvas-drawn (target) or emoji-composite (MVP)
```

**Key architectural rule:** The creature DNA extractor IMPORTS `hash` and `prng` from `eggAlgorithm.js`. It never duplicates or modifies them. `eggAlgorithm.js` remains untouched.

**The creature seed:**
```js
// In creatureGenerator.js — imports from eggAlgorithm.js
import { hash, prng } from './eggAlgorithm.js'

function buildCreatureSeed(stats) {
  const baseSeed = hash(stats.name + stats.grade) ^ hash('' + stats.dow + stats.month + stats.day + stats.hour)
  return prng(baseSeed ^ hash('creature'))
  // Different stream from egg, same identity root
}
```

This means every creature is deterministic — same egg stats always produce the same creature. No randomness at hatch time. The creature was always there.

---

## The Existing DNA

Before generating new creature genes, we read what the egg already knows. These values drive both the egg's appearance AND the creature's appearance — they are the bridge.

| Egg Value | Creature Influence |
|-----------|-------------------|
| `h1` = dominant subject hue | Body primary color |
| `h2` = secondary subject hue | Pattern / accent color |
| `ha` = streak accent hue | Glow / aura color |
| `h3` = tertiary hue | Eye color |
| `stats.firstSubject` | Body shape archetype |
| `stats.streak` | Aura intensity, personality energy |
| `stats.acc` | Eye clarity, expression warmth |
| `stats.speed` | Body proportion (compact vs. lean) |
| `stats.thai` | HP-derived roundness / solidity |
| `stats.eng` | SPD-derived lightness / wing probability |
| `stats.math` | ATK-derived pattern sharpness |
| `stage` | Feature richness (see Stage → Features table) |
| `isNight` (hour ≥ 20 or < 6) | Muted palette, star-heavy features |

**The hue values come directly from the egg algorithm and must be copied, not recalculated:**
```js
// Mirror the egg algorithm's color computation
const sa = [{v:stats.thai,h:140},{v:stats.eng,h:210},{v:stats.math,h:270}]
sa.sort((a,b) => b.v - a.v)
const dowHue = [210,0,120,30,270,45,60][stats.dow % 7]
const monthOff = (stats.month - 1) * 30
const hourTone = stats.hour < 6 ? 280 : stats.hour < 12 ? 30 : stats.hour < 17 ? 45 : stats.hour < 20 ? 20 : 260
const h1 = (sa[0].h + dowHue * .3 + monthOff * .15) % 360
const h2 = (sa[1].h + dowHue * .2 + monthOff * .2) % 360
const h3 = (sa[2].h + hourTone * .1) % 360
const ha = (stats.streak > 30 ? 45 : stats.streak > 14 ? 38 : hourTone + stats.speed * .3) % 360
```

---

## Creature DNA — Full Gene Set

Every gene is derived deterministically from the creature prng stream, constrained by art direction rules. Genes are computed in order — later genes can reference earlier ones to maintain harmony.

### Group A: Body Architecture

**`bodyType`** — Overall silhouette archetype (5 types)
- `chubby` — Round, short, heavy cheeks. Max cute. Stat driver: Thai dominant (HP).
- `fluffy` — Soft mound shape with implied fur texture. Stat driver: balanced stats.
- `compact` — Alert, slightly square-ish, sturdy. Stat driver: Math dominant (ATK).
- `lean` — Taller, light proportions. Stat driver: Eng dominant (SPD).
- `tiny` — Very small relative to head. Stat driver: hybrid (all balanced).

**`headRatio`** — Head size relative to body (3 levels)
- `normal` — 45% of total height
- `large` — 55% — classic cute proportion
- `oversized` — 65% — maximum chibi

**Art direction constraint:** If bodyType is `lean`, headRatio is forced to `large` or `oversized` to prevent a "normal adult proportions" look.

**`cheekSize`** — Always present. (4 levels)
- `dot` — tiny round blush dots
- `normal` — visible round cheeks
- `puffy` — pronounced, pillow-like
- `huge` — dominant feature (Jigglypuff style)

**Art direction constraint:** `cheekSize` is never less than `dot`. Cheeks are mandatory. They are the primary warmth signal.

**`bellyPatch`** — Boolean. Round patch of lighter color on belly. True for ~60% of creatures. Classic cute animal trope (think Pikachu's belly, bear cubs).

---

### Group B: Face

**`eyeType`** — (6 types)
- `round` — large circles with highlight spot. The default cute eye.
- `sparkle` — round with 4-point star highlight. Magic-feeling creatures.
- `crescent` — happy-squint U-shape. Very friendly, safe, always smiling.
- `wide` — large oval, slightly surprised. Curious creatures.
- `button` — tiny dots. Shy or very small creatures.
- `dewy` — round with extra large highlight + subtle gradient. Extremely warm.

**`eyeSize`** — (3 levels) small / normal / large. Stat driver: `acc` — higher accuracy = larger, clearer eyes. Eyes are confidence.

**`eyeColor`** — Derived from `h3` (tertiary hue). Adjusted to always be warm/readable: no dark desaturated colors. Minimum lightness 55%.

**`blushType`** — (4 types)
- `dot` — tiny round blush circles
- `heart` — small hearts under eyes (rare, ~15%)
- `star` — tiny stars under eyes (rarer, ~8%)
- `none` — only for `compact` body type with `brave` personality

**`mouthType`** — (4 types)
- `smile` — simple upward curve. Safe, warm.
- `open-happy` — O-shape with teeth. Never scary — think Kirby's mouth.
- `grin` — wider smile. Playful creatures.
- `tiny` — small dot mouth. Shy or `button`-eyed creatures.

---

### Group C: External Features

**`earType`** — (7 types)
- `none` — creature has no distinct ears. Works for blob/round shapes.
- `round` — round bear ears. Maximum safety. Always cute.
- `cat` — triangular but soft. Common, beloved.
- `floppy` — large droopy bunny ears. Gentle, sleepy creatures.
- `fin` — small side fins. Water/magic creatures.
- `pointed` — elf-like but with rounded tips. Slightly magical.
- `leaf` — leaf-shaped ears. Nature creatures.

**Art direction constraint:** If earType is `pointed`, the color must match body primary (never black or dark). Points ≠ aggression when soft-colored.

**`hornType`** — (5 types)
- `none` — ~45% of creatures
- `stubby` — small rounded bump horn. Cute, not threatening.
- `spiral` — unicorn-style spiral. Magical creatures. Implies rarity.
- `star` — small star shape on forehead. Magic/sparkle creatures.
- `bumps` — two small rounded horns. Dragon-adjacent, very cute.

**Art direction constraint:** If `hornType` is not `none`, at least one of `eyeType` must be `sparkle`, `wide`, or `dewy` — horned creatures should look magical, not aggressive.

**`wingType`** — (6 types)
- `none` — ~50% of creatures
- `fairy` — translucent dragonfly wings. Light creatures.
- `bird` — small feathered wings on back. Flying-type.
- `leaf` — leaf-shaped wing buds. Nature creatures.
- `heart` — tiny heart-shaped wings. Love/gentle creatures.
- `flutter` — barely-there translucent wisps. Accent more than wing.

Stat driver: Eng XP (speed → lightness → wings). High SPD increases wing probability.

**`tailType`** — (6 types)
- `none` — ~30% of creatures
- `wiggly` — simple curved tail. Universal cute.
- `fluffy-pom` — round ball at end. Classic cute animal tail.
- `star-tipped` — pointed tail with star at end. Magic.
- `long-swish` — elegant trailing tail. Lean body type.
- `leaf-tipped` — tail ending in leaf shape. Nature.

**`patternType`** — Markings on body surface (6 types)
- `solid` — clean single color
- `spots` — polka dots (gentle, like a fawn)
- `stripes` — 2-3 horizontal soft stripes (gentle, not aggressive)
- `belly` — bellyPatch color extends to simple chest markings
- `stars-scatter` — tiny stars across body (sparkle/magic creatures)
- `freckles` — small dot cluster on face area

Pattern color = `h2` (secondary subject hue).

---

### Group D: Accessories

At most one accessory per creature. Probability of having an accessory increases with rarity tier.

- `none` — ~40% of creatures
- `bow` — small bow tie or hair bow
- `flower-crown` — small flowers on head. Nature/gentle.
- `scarf` — tiny cozy scarf. Winter/Brave creatures.
- `glasses` — tiny round glasses. Math-dominant creatures (+8% probability).
- `heart-mark` — natural marking on forehead or cheek (not accessory, feels born with it)
- `bandana` — around neck. Adventure/Brave personality.
- `tiny-hat` — whimsical small hat. Playful/Curious personality.

Stat driver: Thai XP (social/cultural weight) increases accessory probability slightly.

---

### Group E: Glow and Particles (Rarity-Driven)

The existing `rarity` system (common/uncommon/rare/epic/legendary) already exists in HATCH_CREATURES. The new system uses tier to determine effect richness.

| Tier | Creature Count | Glow | Particles |
|------|---------------|------|-----------|
| Common | ~50% | Faint warmth only | None |
| Uncommon | ~25% | Soft pulse (matches `ha`) | Occasional sparkle |
| Rare | ~15% | Visible color aura | Slow orbit (2-3 particles) |
| Epic | ~8% | Bright, animated aura | Active orbit (4-6 particles) |
| Legendary | ~2% | Prismatic / shifting aura | Dense orbit + trail |

Rarity is derived from `streak` at hatch time — the same source as the current rarity signal. High streak at hatch = higher tier.

**Particle types** (by tier):
- Uncommon: ✦ sparkle flickers
- Rare: ⭐ star orbit
- Epic: ✦⭐ mixed orbit + occasional burst
- Legendary: 🌟 + rainbow glow + constant gentle particle rain

---

## Art Direction Layer

Every rendered creature must pass through these constraints. No gene combination is allowed to produce a result that violates them. These rules are enforced in code, not in design documents.

### The Five Rules of Cute

1. **Eyes dominate the face.** Eye area must be at least 25% of head area. If a gene combination produces small eyes, `eyeSize` is forced up.

2. **Cheeks are always visible.** `cheekSize = 'none'` is not an allowed value. Cheeks are the warmth anchor. Their color is always `h1` at +20% lightness and -10% saturation (soft, not neon).

3. **No sharp color contrast on structural features.** If earType is `pointed`, it must match body color ± 20° hue. Black ears on a pastel body are forbidden. Dark features are allowed only as small accent marks (freckles, stripes), never as large solid fills.

4. **ATK-heavy creatures are "spirited", not aggressive.** High ATK (from Math XP) produces: deeper/richer colors, compact body, alert eyes — not spikes, teeth, or dark shapes. Red = energetic passion. Not blood.

5. **All colors stay in the playful range.** Saturation: 45–85%. Lightness: 48–82%. No color outside this range on the primary body. (Accent glows may go brighter, but only as non-solid overlay effects.)

### Color Harmony Rules

**Primary body color:** `h1` hue, saturation `55 + min(progress * 25, 25)%`, lightness `72 - progress * 18%`. Younger eggs hatch paler creatures; older eggs produce richer, more vivid ones.

**Pattern/accent:** `h2` hue. Must be ≥ 30° different from body, OR ≤ 15° different (analogous). The "ugly zone" is 16–29° — those two hues fight. Enforced: if h2 falls in the ugly zone relative to h1, shift h2 by +30° before rendering.

**Glow / aura:** `ha` hue. Can go bright — it's a non-solid effect. Minimum lightness 65% for glow colors (prevents muddy aura).

**Eye color:** `h3` hue, always lightness ≥ 55%. Small eyes can tolerate higher saturation; large eyes must be gentler (< 70% sat) to avoid looking alarming.

**Night creatures** (hour < 6 or ≥ 20): All hues shift -15° toward blue. Saturation -10%. Stars and glow become more prominent. These creatures feel like they come from a different, softer world.

### Feature Density by Hatch Stage

A creature hatched early (stage 2) should look simpler than one hatched at stage 8. This makes the hatching timing meaningful.

| Stage at Hatch | Feature Budget | Effect |
|---------------|---------------|--------|
| 0–2 (Baby) | 3–4 features | Simple: ears + eyes + body color. No accessories, no particles, solid pattern. |
| 3–4 (Developing) | 5–6 features | Adds tail, maybe horn stub, pattern begins. |
| 5–6 (Mature) | 7–8 features | Wings possible, accessory possible, blush type more elaborate. |
| 7–8 (Pre-hatch) | 9–10 features | Full feature set. Glow visible. Particles possible. `heart-mark` birthmark unlocks. |

**The battle mark (Stage 7–8 only):** If the egg reached stage 7 (cracks visible in drawEgg), the creature has a small mark — a thin curved line near one eye or on the cheek, the same color as the cracks were on the egg. This is a continuity signal: the creature remembers breaking out. It reads as a natural facial marking, not a scar. Children recognize it subconsciously.

---

## Personality System

Personality is the creature's behavioral character — what it feels like to interact with. It is derived from the learning profile at hatch time, so it genuinely reflects how the child played.

### The Seven Personalities

**Happy** — The successful learner
- Stat driver: `acc ≥ 80`, `streak ≥ 5`
- Expression: big smile, round eyes, bright warm colors, large cheeks
- Idle: gentle side-to-side bounce every 3–5 seconds, occasional look at player
- Voice: medium-high pitch (1.3×), bright ascending chirps
- Special behaviors: spontaneous small spin when pet; extra hearts on reunion

**Curious** — The persistent explorer
- Stat driver: `streak ≥ 10`, diverse subject engagement
- Expression: wide eyes, head-forward posture, slight lean
- Idle: frequent head-tilt left/right, leaning forward, sniffing
- Voice: varied pitch (±20% variance), questioning upswing at end
- Special behaviors: follows the creature companion around in the Home zone; reacts to ambient events (turns to look at butterfly)

**Brave** — The determined challenger
- Stat driver: Thai XP dominant, `streak > 5`, above-average `mins`
- Expression: slightly narrowed eyes (not mean — determined), forward stance
- Idle: occasional confident small stomp, rubs front paws together, stands tall
- Voice: lower pitch (0.85×), steady even rhythm
- Special behaviors: protects from ambient threats (turns to face them); first to run toward the egg when pet

**Playful** — The quick responder
- Stat driver: high `speed`, Eng XP dominant
- Expression: grin mouth, light body, big ears, quick-blinking
- Idle: hops side to side, spins, flicks tail, chases its own tail
- Voice: high pitch (1.5×), rapid short sounds
- Special behaviors: jumps highest on pet; does extra celebration spin on level-up

**Gentle** — The balanced learner
- Stat driver: no single dominant subject (all within 20% of each other)
- Expression: soft smile, medium features, pastel colors
- Idle: slow sway, long blinks, sits quietly by the egg
- Voice: medium pitch (1.0×), smooth round tones
- Special behaviors: sits beside the egg when idle for > 60 seconds; offers "gift" behavior most frequently

**Sleepy** — The infrequent adventurer
- Stat driver: `mins < 20` at hatch, low play frequency
- Expression: half-closed eyes, droopy ears (if floppy), soft rounded shape
- Idle: slow movements, yawns every 20–35 seconds, sits down often
- Voice: lower pitch (0.8×), drawn-out syllables
- Special behaviors: falls asleep if no interaction in 30 seconds; wakes with a stretch animation

**Shy** — The careful first-timer
- Stat driver: low `streak`, high `acc` (careful, gets things right but doesn't go long)
- Expression: button eyes or slightly-downcast eyes, large blush, tiny frame
- Idle: looks around nervously, makes itself smaller, peeks from behind egg
- Voice: very soft (0.6× volume), quiet short chirps
- Special behaviors: hides behind the egg when tapped; gradually comes out over time; becomes brave after many pets (personality animation evolves)

### Personality Determination

```
if (acc >= 0.80 && streak >= 5)      → Happy
else if (streak >= 10)                → Curious
else if (thaiDominant && streak > 5) → Brave
else if (engDominant && speed > 65)  → Playful
else if (balanced)                    → Gentle
else if (mins < 20)                   → Sleepy
else                                  → Shy
```

Where `balanced = max(xpThai, xpEng, xpMath) / totalXP < 0.50`.
Where `thaiDominant = xpThai / totalXP > 0.50`.
Where `engDominant = xpEng / totalXP > 0.50`.

---

## Animation Layer

The animation system builds on the existing creature companion animation set in Home.jsx (walk / wave / sit / celebrate / gift / look / sleep). The procedural system adds personality-weighted idle behaviors.

### Universal Animations (all creatures)

These are the same regardless of personality. They form the baseline the creature always knows.

| Animation | Trigger | Duration |
|-----------|---------|----------|
| `blink` | Every 3–8s (personality-weighted) | 0.25s |
| `look-left` / `look-right` | Every 8–15s | 0.6s |
| `breathe` | Always on (subtle) | 3s loop |
| `react-pet` | On tap/pet | 0.6s jump + hearts |
| `react-food` | On food given | 0.8s lean + eat |
| `celebrate` | On level-up | 1.2s jump + spin |
| `sleep-settle` | After 30s idle (sleepy personality only) | 1.5s |
| `wake-stretch` | From sleep | 1.0s |

### Personality Idle Pool

Each personality has a weighted pool of idle micro-animations. The idle scheduler (existing 5–12s interval in Home.jsx) draws from this pool.

| Personality | Pool (weight distribution) |
|-------------|---------------------------|
| Happy | bounce×3 · look×2 · wave×2 · tiny-spin · chirp-happy |
| Curious | look×4 · lean-forward×2 · sniff · head-tilt×2 |
| Brave | stand-tall×3 · stomp · look×2 · chin-up |
| Playful | hop-hop×3 · spin×2 · tail-chase · quick-look |
| Gentle | sway×3 · blink-long×2 · sit-settle · look-soft |
| Sleepy | yawn×3 · eye-droop×2 · slow-sway · sit-settle |
| Shy | peek×3 · shrink×2 · look-away · small-jump |

### Personality Evolution (Long-term)

As the child interacts more with their creature, the personality can shift slightly. This is not a stat change — it's a behavioral softening. A Shy creature that has been pet 50 times starts borrowing 1-2 behaviors from Gentle. A Brave creature gains 1 Happy behavior at 100 adventures together.

This happens visually, not mechanically. No UI shows the shift. The child just notices their creature feels "more like them" over time.

---

## Voice Layer

Each creature has a unique voice profile. All voices are generated from `playTone()` parameters — no audio files needed.

### Voice Profile Genes

**`pitchBase`** — Base frequency multiplier
- Derived from `bodyType`: tiny = 1.6×, chubby = 1.1×, lean = 0.95×, compact = 0.90×, fluffy = 1.0×

**`pitchVariance`** — How much pitch varies per sound
- Derived from personality: playful = ±20%, curious = ±15%, shy = ±5%, brave = ±8%

**`soundFamily`** — The tonal character (5 families)
- `chirp` — Short, high, bird-like. The default cute sound.
- `peep` — Tiny and soft. Shy/small creatures.
- `trill` — Rapid multiple notes. Playful/curious creatures.
- `hum` — Sustained, lower tone. Brave/gentle creatures.
- `squeak` — Short burst with subtle overtone. Compact/math creatures.

**`soundSpeed`** — How quickly the voice sounds play
- Derived from `speed` stat: fast learners = quicker sounds

### Voice Moments (when the creature speaks)

| Moment | Sound Type |
|--------|-----------|
| Pet received | `chirp` or `peep` — pitch from profile |
| Food received | `hum` followed by `chirp` |
| Food eating | `chew` + voice overlay |
| Reunion (>4h) | Multiple `chirp` notes in sequence |
| Item received | `trill` or `peep` |
| Celebrating | Rapid ascending notes from `soundFamily` |
| Sleeping | Low, slow `hum` |
| Ambient event | Single soft `chirp` (curious reaction) |

---

## Egg-to-Creature Visual Continuity

This is the heart of the system. Every visual bridge reinforces: "this creature lived inside that egg."

### Hard Continuity (always applied)

| Egg Feature | Creature Feature |
|-------------|-----------------|
| `h1` hue | Body primary color (same hue family) |
| `h2` hue | Pattern / accent color |
| `ha` hue | Glow / aura color |
| `isNight` | Creature has cooler palette, more stars |

### Soft Continuity (probability-based, ~70% of cases)

| Egg Feature | Creature Feature | Probability |
|-------------|-----------------|-------------|
| Dense dots (progress ≥ 0.4) | `spots` or `freckles` pattern | 70% |
| Many lines (eng XP high) | `stripes` pattern | 60% |
| Outer glow visible (progress ≥ 0.2) | Creature has visible aura | 75% |
| Stars on egg (progress ≥ 0.78) | `sparkle` eye type | 65% |
| Stage 7–8 hatched | Battle mark on face | 100% |
| `firstSubject = eng` | Wing type not `none` | 55% |
| Creature shadow visible on egg | `compact` or `chubby` body | 60% |

### The Birth Moment

When the creature first appears after hatching, it should feel like emergence, not assignment. Visual recommendation:

1. Hatch animation plays (existing HatchOverlay.jsx tap-to-crack sequence)
2. Egg bursts → **creature emerges already colored to match the broken egg pieces**
3. The creature pauses — big eyes blinking, taking in the world
4. First reaction: looks directly at the player (center screen)
5. First sound: voice profile chirp
6. A brief moment where the egg's glow color becomes the creature's aura — the two are the same light, briefly

This "birth moment" is implemented as a CSS transition sequence in HatchOverlay.jsx. It does not require the procedural Canvas system to be complete first — it can be done with an emoji composite in the MVP.

---

## Combination Mathematics

A rough diversity estimate to validate the system produces genuine infinite variety:

| Gene | Options |
|------|---------|
| bodyType | 5 |
| eyeType | 6 |
| earType | 7 |
| hornType | 5 |
| wingType | 6 |
| tailType | 6 |
| patternType | 6 |
| accessory | 8 |
| personality | 7 |
| rarity tier | 5 |

**Raw combinations:** 5×6×7×5×6×6×6×8×7×5 = **105,840,000**

After art direction constraints eliminate ~60% of awkward combinations: **~42 million valid creatures**.

Plus continuous variables (exact hues, cheek sizes, body scales, eye sizes) — practically infinite visible variety.

A child with 10 hatched creatures will have 10 visually distinct friends. A child with 100 hatched creatures will still see variety. This holds.

---

## Implementation Path

This document is architecture only. No code changes are made in this session. The implementation is a future phase.

### Phase 1: DNA Extraction (no visual change)
- Create `src/lib/creatureGenerator.js`
- Export `buildCreatureDNA(stats)` — returns full gene object
- All genes computed, no rendering yet
- Add gene object to hatched egg data in state
- Write unit tests for gene determinism

### Phase 2: Emoji-Composite MVP
- Create `src/components/CreatureDisplay.jsx`
- Renders creature using 2–4 layered emoji (head + body + accessory + effect)
- Personality drives animation class (existing creature-wave/celebrate/etc.)
- Replace emoji in Home.jsx creature companion, Collection.jsx
- This is the playtest version — can ship before Phase 3

### Phase 3: Canvas Creature (Target)
- Create `src/lib/drawCreature.js`
- Canvas-drawn creature using same approach as `drawEgg()`
- All gene attributes translate to canvas paths
- `CreatureCanvas.jsx` component (mirrors `EggCanvas.jsx`)
- Replaces emoji-composite version

### Phase 4: Animation Integration
- Voice profile plays creature-specific sounds
- Personality idle pool wired to Home.jsx creature scheduler
- Birth moment sequence in HatchOverlay.jsx

### Files NOT to create during Phase 1-2:
Any file that requires modifying `eggAlgorithm.js`. The gene computation reads from stats — it never touches the egg rendering.

---

## Open Questions

These must be answered before Phase 3 (Canvas Creature) begins. Some can be decided by playtesting Phase 2.

**Q1 — Canvas vs emoji-composite for the long term?**
Canvas gives full art direction control and egg-style consistency. Emoji-composite is ~4 weeks faster and leverages platform font rendering. The question is whether children can tell the difference on a 26px emoji in the creature companion zone vs. a 120px canvas in the collection. Recommendation: Phase 2 emoji-composite for emotional validation, Phase 3 canvas only if Chopin cares about the details.

**Q2 — How many visible features at once?**
The system generates up to 10 features for a stage 7-8 creature. On a 26px companion emoji, most features are invisible. On a 120px collection canvas, 10 features may feel cluttered. The right density depends on the primary viewing size. This requires a visual prototype to test.

**Q3 — Does creature evolution exist?**
Should a creature look different at battle level 5 vs. level 1? The current system has no creature XP/leveling. If evolution exists: what changes? Colors deepen? New features unlock? Or does the creature stay exactly as hatched forever (Tamagotchi model)? This is a major scope decision. Year 1 MVP recommendation: no evolution — every creature is born complete.

**Q4 — Procedural name generation or child-named?**
The user brief says "children should say this is my friend, not monster #84." Naming is the most powerful personalization tool. Options:
- (a) Procedurally generated Thai-syllable names (ลูมิ / สปริ / ชิโน / ทาลุ) — infinite combinations, always unique, always pronounceable
- (b) Child chooses from 5 suggested names at birth
- (c) Child types a name (keyboard input — high friction for 5-year-olds)
- (d) No name — creature has a class name only (ไข่พิเศษ #1, ไข่พิเศษ #2)
Recommendation: (a) procedural names + (b) show 5 suggestions, let child pick or skip.

**Q5 — How strong should egg-to-creature continuity be?**
The current design has both hard continuity (same hue family always) and soft continuity (probabilistic feature echoes). A strong version shows obvious visual rhyming — same spot patterns, same glow color, obviously from the same source. A subtle version only rhymes in color. Strong continuity = more "this is my creature." Subtle = more variety surprise. The right balance depends on how much Chopin notices visual connections at age 5. Recommendation: start strong (70%+ feature continuity), pull back if it feels repetitive.

**Q6 — How many creatures can a child have before diversity breaks?**
At 42 million combinations, combinatorial diversity is not the problem. Perceptual diversity is. Two creatures both derived from Thai-dominant stats will share h1 ≈ 140 and similar body roundness. From a distance, they may look like siblings. Is that a problem or a feature? (DragonVale players love families of related dragons.) Needs playtesting with at least 5 hatched eggs to evaluate.

**Q7 — Shy personality: does peeking from behind the egg work in the current UI?**
The current creature companion is a 26px emoji patrolling left-right in a 52px zone. "Peeking from behind the egg" requires the creature to be near the egg visually and have a different animation state. This may require a layout change or a larger creature zone. Scope question for implementation phase.

**Q8 — What is the Collection page's role in creature identity?**
Currently Collection.jsx shows hatched creatures as cards with emoji + name + rarity. In the procedural system, the creature canvas IS the creature. The Collection page becomes the place where the full-size creature is shown and named — the relationship biography (adventuresWith, questionsAnswered, daysTogetherCount, favoriteSubject from the ECA design doc) appears here. Is this the right moment for identity? Or does the creature companion in Home need to be larger?

**Q9 — Do accessories need to be earnable/equippable separately?**
Current design: accessories are born-with (part of DNA). Alternative: accessories are items that can be applied after hatching (bow, hat, scarf sold in shop). Born-with = more personal. Equippable = more economy/engagement. Year 1 recommendation: born-with only. Equippable accessories are a Year 2 feature.

**Q10 — Night creatures: special status?**
Currently ~15% of eggs are set during night hours (hour < 6 or ≥ 20). The egg algorithm already makes them different (cooler hues, lower lit). The creature system could make night-hatched creatures a named rarity subtype — "Moonborn" — with a different visual signature (stars more prominent, cool palette, crescent features). This adds meaning to late-night hatching without requiring extra mechanics. Low implementation cost, high emotional value. Recommendation: implement in Phase 3.

---

## Summary: The One-Sentence Design Principle

Every creature is the natural result of the specific egg the child grew — not a random reward, not a fixed pool pick, but a being that crystallized from everything the child did during those weeks of learning.

---

_See also: `docs/research/battle/creature-stats.md` for stat derivation, `docs/research/gameplay/egg-companion-adventure.md` for companion relationship data_
