# Procedural Character System
_KidQuest — Design Document_
_Created: 2026-06-09 — Revised: 2026-06-09_

---

## Why This Exists

The current creature system is a pool of 15 fixed emojis (🐘 🐍 🦅 🐉 🦊 🦄 🤖 💎 ⚡ and a few hybrids). Every child who dominates Thai gets one of three creatures. Every child who dominates Math gets one of three different ones.

This is the "Creature #137" problem. The creature has no relationship to the egg it came from, no connection to how the child played, and no reason for a five-year-old to feel "this is mine."

**The goal of this system:** Every creature should feel like *this is MY friend*. Not a reward. Not a database entry. A friend — with a face the child recognizes, a name they give it, and a personality that reflects how they played together.

**Design test:** Show a child their egg. Then show their creature. They should say "yes, that's right" — not "where did that come from?"

**Beauty standard:** Every rendered creature should pass the Sticker Test — would this look good as a 3cm sticker on a child's notebook? If yes, render. If any detail makes it feel cheap, random, or off, fix it before rendering.

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
[Creature DNA Extractor]        ← NEW: creatureGenerator.js
  Re-uses hash() + prng() from eggAlgorithm.js
  Determines Family Archetype first
  Maps to 40+ independent gene bits
  Designates one Signature Feature
          ↓
[Art Direction Layer]
  Enforces cute/warm/huggable hard rules
  Resolves impossible gene combinations
  Scales feature density by hatch stage
          ↓
[Beauty Layer]                  ← NEW
  Sticker Test — premium finish
  Color harmony final pass
  Outline quality
  Eye gloss
  Cheek gradient
  Signature feature amplification
          ↓
[Animation Layer]
  Personality idle pool
  Reaction animations
  Signature feature animation
          ↓
[Voice Layer]
  Pitch · sound family · variance
          ↓
[Rendered Creature]
  Canvas-drawn via drawCreature()
```

**Key architectural rule:** `creatureGenerator.js` IMPORTS `hash` and `prng` from `eggAlgorithm.js`. It never duplicates or modifies them. `eggAlgorithm.js` remains untouched.

**The creature seed:**
```js
// In creatureGenerator.js
import { hash, prng } from './eggAlgorithm.js'

function buildCreatureSeed(stats) {
  const baseSeed = hash(stats.name + stats.grade) ^ hash('' + stats.dow + stats.month + stats.day + stats.hour)
  return prng(baseSeed ^ hash('creature'))
  // Separate stream from egg, same identity root
}
```

Every creature is deterministic — same egg stats always produce the same creature. No randomness at hatch time. The creature was always inside the egg.

---

## The Existing DNA

These values drive both the egg's appearance AND the creature's — they are the bridge.

| Egg Value | Creature Influence |
|-----------|-------------------|
| `h1` = dominant subject hue | Body primary color |
| `h2` = secondary subject hue | Pattern / accent color |
| `ha` = streak accent hue | Glow / aura color |
| `h3` = tertiary hue | Eye color |
| `stats.firstSubject` | Body shape bias |
| `stats.streak` | Aura intensity, personality energy |
| `stats.acc` | Eye clarity, expression warmth |
| `stats.speed` | Body proportion (compact vs. lean) |
| `stats.thai` | HP-derived roundness / solidity |
| `stats.eng` | SPD-derived lightness / wing probability |
| `stats.math` | ATK-derived pattern sharpness |
| `stage` | Feature richness (see Stage → Features table) |
| `isNight` | Muted palette, star-heavy features |

**Hue values must be mirrored from the egg algorithm — not recalculated:**
```js
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

## Egg-to-Creature Identity

**The rule:** The creature is the evolution of the egg. Not a random reward that happens after the egg breaks. The same thing that made the egg look the way it did — the colors, the glow, the patterns, the mood — is what made the creature inside.

**The design test:** The child watches their egg grow for days or weeks. They see it glowing blue at night. They see stars appearing at stage 5. They see green lines at stage 2. When the creature emerges, they should feel: *yes, that's right. That's what was inside.* Not: *where did that come from?*

**The implementation principle:** Family is derived from the egg's visual identity first. Stats modify the creature's proportions and personality within that family. Do not select family from stats alone.

---

### What the Creature Inherits from the Egg

| Egg Property | Creature Inheritance | Strength |
|---|---|---|
| `h1` dominant hue | Body primary color | Hard — always |
| `h2` secondary hue | Pattern / accent color | Hard — always |
| `ha` streak accent | Glow / aura color | Hard — always |
| `h3` tertiary hue | Eye color | Hard — always |
| Egg motif (see below) | Family archetype | Hard — always |
| `stage` at hatch | Feature richness | Hard — always |
| `isNight` | Cool palette, star/moon features heavy | Hard — always |
| Dots on egg (stage ≥ 1) | Spots or freckles pattern | 70% |
| Lines on egg (high eng XP) | Stripe pattern | 60% |
| Outer glow visible (stage ≥ 2) | Creature has visible aura | 75% |
| Stars on egg (stage ≥ 5) | Sparkle eye type | 65% |
| Shadow creature on egg (stage ≥ 4) | Compact or chubby body silhouette | 60% |
| Crack lines (stage 7–8) | Birth mark on face — thin curved line in crack color | 100% |
| Body shape feeling (round vs. tall) | Body roundness (chubby vs. lean) | Via stats |

---

### Egg Motif Detection

The egg has a **visual motif** — a dominant element that defines what it looks like to the child. This motif is read from the same stats that drive the egg's color and feature generation. It is the primary driver of family selection.

The motif is detected in order. First match wins.

```
function detectEggMotif(h1, ha, isNight, streak, stage) {

  // Night — the most powerful single signal
  if (isNight)
    → 'moon'

  // Star — golden glow + visible stars + sustained streak
  if (ha >= 30 && ha <= 60 && streak >= 14 && stage >= 5)
    → 'star'

  // Leaf / Nature — green dominant
  if (h1 >= 80 && h1 < 160)
    → 'leaf'

  // Ocean — teal/aqua dominant
  if (h1 >= 160 && h1 < 220)
    → 'ocean'

  // Cloud — cool sky blue
  if (h1 >= 220 && h1 < 270)
    → 'cloud'

  // Crystal / Moon adjacent — indigo/violet
  if (h1 >= 270 && h1 < 320)
    → 'crystal'

  // Ember / Fire — warm red and deep amber
  if (h1 >= 340 || h1 < 30)
    → 'ember'

  // No strong motif — use stat-based family selection
  → null
}
```

**What "ember" means:** There is no Ember family among the 16 archetypes. A warm red/orange h1 produces a Fox, Dragon, or Bear with a fire-colored palette — the child would naturally call this creature an "Ember Fox" or "Ember Dragon." The ember motif is a color treatment, not a new shape family. Stats determine which shape family applies.

---

### Egg Motif Catalog

| Motif | Egg Appearance | Signal | → Family |
|---|---|---|---|
| **Moon** | Cool blue-purple glow, night-born, crescent aura | `isNight` | Moon |
| **Star** | Golden shimmer, visible star particles at stage 5+, high streak | `ha` gold + `streak ≥ 14` + `stage ≥ 5` | Star |
| **Leaf** | Green dominant color, organic lines, earthy tones | `h1` in 80–160° | Leaf |
| **Ocean** | Teal/aqua color, horizontal stripe feel, shimmer | `h1` in 160–220° | Ocean |
| **Cloud** | Soft sky blue, light and diffuse, gentle glow | `h1` in 220–270° | Cloud |
| **Crystal** | Indigo/violet, sharp glow, geometric feel | `h1` in 270–320° | Crystal |
| **Ember** | Warm red/orange/amber, fire-like intensity | `h1` ≥ 340° or < 30° | Fox / Dragon / Bear (stat-picked) |
| *(none)* | Balanced/mixed, no single dominant visual | fallback | Stat-based selection |

---

### Family Mapping from Egg Motif

Each motif maps to a family. Within that family, the creature's specific body shape and proportions are determined by stats. This is where named variants like "Moon Bunny" or "Star Cat" come from — they are the same Moon or Star family but shaped differently by the child's learning profile.

**Moon Egg** → Moon family
- Thai dominant → compact round body → _Moon Bear feeling_
- Eng dominant → light elegant body → _Moon Bunny or Moon Cat feeling_
- Math dominant → structured → _Moon Dragon feeling_
- Balanced → pillowy → _Moon Puff feeling_

**Star Egg** → Star family
- High speed / Eng dominant → light, fast → _Star Bird or Star Cat feeling_
- Compact / Thai dominant → round, grounded → _Star Puff feeling_
- Math dominant → structured, precise → _Star Dragon feeling_

**Leaf Egg** → Leaf family
- Thai dominant → solid, patient → _Leaf Bear feeling_
- Eng dominant → light → _Leaf Bunny or Leaf Bird feeling_
- Balanced → soft → _Leaf Puff feeling_

**Ocean Egg** → Ocean family
- Compact / round → _Ocean Puff or Shell-feeling_
- Fast / Eng dominant → lean → _Fish Cat or Ocean Fox feeling_
- Math dominant → structured → _Shell Dragon feeling_

**Cloud Egg** → Cloud family
- Gentle / Bunny-stat profile → _Cloud Bunny feeling_
- Small / Bird-stat profile → _Cloud Bird feeling_
- Round / balanced → _Dream Puff feeling_

**Crystal Egg** → Crystal family
- Math dominant → geometric, precise → _Crystal standard_
- Eng dominant → light crystal → _Crystal Bird or Ice Cat feeling_

**Ember Egg** → Fox, Dragon, or Bear (warm palette variant)
- Eng dominant / high speed → _Ember Fox_ (pointed ears, orange/amber palette)
- Math dominant / high streak → _Ember Dragon_ (bumpy horns, deep red-amber)
- Thai dominant → _Ember Bear_ (round warm bear in rust/amber)

**No motif** → stat-based family selection (see updated logic below)

---

### Concrete Inheritance Examples

| This egg... | ...produces this creature |
|---|---|
| Spotted egg (many dots, stage 3+) | Creature has spots or freckles pattern |
| Starry egg (stage 5+, golden glow) | Creature has sparkle eyes, star-tipped tail |
| Glowing egg (strong outer glow, high streak) | Creature has visible aura, glow tier ≥ uncommon |
| Cracked egg (stage 7–8) | Creature has small birth mark — thin curved line near eye, in crack color |
| Round, soft egg (low speed, chubby feel) | Creature has chubby or fluffy body type |
| Tall, narrow egg (high speed, lean silhouette) | Creature has lean or compact body |
| Moon egg (cool glow, night-born) | Moon family — crescent horn, cool palette, dewy eyes |
| Leaf egg (green dominant) | Leaf family — leaf ears, organic pattern, nature palette |
| Ocean egg (teal dominant) | Ocean family — fin ears, wave stripes, blue-green palette |
| Fire egg (deep amber/red) | Ember Fox / Ember Dragon / Ember Bear — warm palette, intense glow |

---

### Updated Family Determination Logic

Family is now **egg-motif-first**, with stats as a secondary modifier.

```
// Step 1: Detect egg motif
const motif = detectEggMotif(h1, ha, isNight, streak, stage)

// Step 2: Motif → family (hard assignment)
if (motif === 'moon')    → Moon family
if (motif === 'star')    → Star family
if (motif === 'leaf')    → Leaf family
if (motif === 'ocean')   → Ocean family
if (motif === 'cloud')   → Cloud family
if (motif === 'crystal') → Crystal family

if (motif === 'ember') {
  // Ember: warm palette applied to stat-driven shape family
  if (engDominant || highSpeed)  → Fox (warm)
  if (mathDominant || streak>10) → Dragon (warm)
  else                           → Bear (warm)
}

// Step 3: No strong motif → stat-based selection
if (motif === null) {
  if (streak >= 20)        → Dragon 50%, Star 30%, Crystal 20%
  if (thaiDominant)        → Bear 30%, Bunny 25%, Fluff 20%, Flower 15%, other 10%
  if (engDominant)         → Bird 30%, Fox 25%, Cat 20%, Fluff 15%, other 10%
  if (mathDominant)        → Crystal 30%, Dragon 25%, Cat 20%, other 25%
  if (balanced)            → Dream 30%, Puff 20%, Fluff 20%, Flower 20%, other 10%
  fallback                 → prng selects from non-motif families equally
}
```

The prng stream advances a fixed amount in step 1–2 regardless of which branch is taken, so family selection does not disrupt downstream gene generation.

---

### Future Note: Egg Visual Identity Pass

The egg algorithm is LOCKED — `drawEgg()`, `hash()`, `prng()` do not change.

However, a future design consideration: currently the egg's visual motif is derived mathematically from hue values and may not always look obviously "moon-like" or "leaf-like" to a child. A future **Egg Visual Identity Pass** would add motif-specific visual layers to the egg canvas — making Star eggs clearly sparkly, Moon eggs clearly lunar, Leaf eggs clearly green and organic.

This would require explicitly planning a controlled modification to `drawEgg()` — an intentional, documented unlock of the currently locked system. It is not a Year 1 task.

**Questions this raises (for GPT):**
- Should the egg's visual identity be made more legible to the child before the creature system ships?
- If so, can it be done as a CSS/overlay layer on top of the existing canvas (no drawEgg change), or does it require a drawEgg modification?

---

## Family Archetypes

Families are **visual themes, not species lists.** They are selected first, before any other gene. A family locks 2–3 features as mandatory or heavily biased, and guides the color palette — then the prng stream fills in the remaining details. Two creatures from the same family should feel like siblings: visually related, not identical.

**Family is the creature's dominant identity.** The child looks at their creature and thinks "cat" or "star" or "cloud" — not because the creature is literally that animal, but because the visual vocabulary draws from that theme. Real-world parallels: Pikachu is in the Mouse family but is unmistakably its own character. Togepi is in the Puff family.

### The 16 Families

---

**PUFF** ☁️
> Round, cloud-like, pillowy. Maximum safe cute.
- Locked: `bodyType = chubby`, `cheekSize = huge`, `patternType = solid`
- Biased: no horns, no wings, `earType = round or none`
- Palette: white, lavender, soft peach, light mint
- Signature tendency: oversized cheeks, tiny mouth, button or crescent eyes
- Stat driver: low `speed`, high acc — the careful gentle learner
- Siblings feel: all Puffs are round and quiet, but differently shaped — some taller, some tiny, different colors

**FLUFF** 🐑
> Implied fur, fluffy tail mandatory, soft mound body.
- Locked: `tailType = fluffy-pom`, `bodyType = fluffy`
- Biased: `earType = round or floppy`, warm color palette
- Palette: cream, warm white, soft amber, dusty rose
- Signature tendency: tail is always prominent, body implies texture
- Stat driver: balanced stats, gentle personality
- Siblings feel: all Fluffs have that big round tail, but vary in ear shape, pattern, and face type

**BEAR** 🐻
> Compact and sturdy, round bear ears are always present.
- Locked: `earType = round`, `bodyType = chubby or compact`
- Biased: warm browns and ambers, `bellyPatch = true`, `mouthType = smile`
- Palette: honey, rust, caramel, dark amber — adjusted via h1 (a Thai-dominant bear might be golden-green)
- Signature tendency: warm face, reliable look, huggable silhouette
- Stat driver: Thai dominant — patient, solid, dependable
- Siblings feel: all Bears have round ears and a warm face, but some are tiny bears, some chunky, different fur colors

**CAT** 🐱
> Cat ears are always present. The universally beloved form.
- Locked: `earType = cat`
- Biased: `tailType = long-swish or wiggly`, varied body shapes
- Palette: wide — cat family takes any h1 well (tabby orange, silver, cream, midnight blue cat)
- Signature tendency: slightly proud expression, tail prominent
- Stat driver: any — Cat family is the most flexible, appears across all stat profiles
- Siblings feel: all have cat ears, but could be chubby or lean, patterned or solid, tiny or round

**FOX** 🦊
> Pointed ears, large fluffy tail, slightly longer body.
- Locked: `earType = pointed`, `tailType = fluffy-pom` (oversized variant)
- Biased: `bodyType = lean or compact`, warm earth tones
- Palette: rust, golden orange, cream, h1-shifted fox tones
- Signature tendency: alert expression, distinctive bicolor markings (body h1, cheek/belly h2)
- Stat driver: high `speed`, Eng dominant — quick and sharp
- Siblings feel: all have the pointed ears and big tail, but different sizes, patterns, colors

**BUNNY** 🐰
> Floppy ears are always present, large blush signature.
- Locked: `earType = floppy`, `cheekSize = puffy or huge`
- Biased: soft colors, `mouthType = smile or tiny`, no horns
- Palette: white, soft lavender, pink, pale blue, h1-shifted pastels
- Signature tendency: ears are the dominant feature, very gentle expression
- Stat driver: Shy or Gentle personality — careful, soft
- Siblings feel: all have big floppy ears and visible cheeks, but differ in size, tail shape, body roundness

**BIRD** 🐣
> Always has wings. Round compact body. Beak-less but bird-inspired.
- Locked: `wingType = bird or fairy (not none)`
- Biased: `bodyType = chubby or tiny`, round cheeks, bright eye colors
- Palette: warm yellows, coral, sky blue, bright tropical — h1 drives the specific color
- Signature tendency: wings are central to the design, body is spherical
- Stat driver: high `speed`, Eng dominant — light and fast
- Siblings feel: all have visible wings, but vary in wing style, body color, eye type, accessories

**DRAGON** 🐲
> Small bumpy horns, scale-like patterns, fin or cat ears.
- Locked: `hornType = bumps`, `patternType = stripes` (scale variant)
- Biased: `earType = fin or cat`, `wingType = fairy or none`, rich saturated colors
- Palette: deep teal, forest green, warm purple, dark amber — h1 shifted richer
- Signature tendency: slightly more color-saturated than other families, still clearly cute
- Stat driver: high streak, Math dominant — methodical, persistent
- Siblings feel: all have those small bumpy horns and the scale stripes, but in very different colors and sizes

**LEAF** 🌿
> Leaf ears, green palette bias, nature accessories.
- Locked: `earType = leaf`
- Biased: `wingType = leaf or none`, `accessory = flower-crown`, green h1 palette
- Palette: forest green, sage, mint, warm moss — heavily h1-influenced in the green range
- Signature tendency: nature pattern types (spots like dappled leaves), organic shapes
- Stat driver: Thai dominant — roots, earth, patience
- Siblings feel: all have leaf ears and feel nature-adjacent, but differ wildly in body type, pattern, and shade of green

**STAR** ⭐
> Star-tipped tail mandatory, sparkle eyes, golden palette.
- Locked: `tailType = star-tipped`, `eyeType = sparkle`
- Biased: `hornType = star`, `rarity ≥ uncommon`, yellow/gold palette
- Palette: gold, warm yellow, bright amber, pearl — h1 shifted toward yellow
- Signature tendency: high-contrast bright details against warm body, sparkle-forward
- Stat driver: high streak (≥ 14), celebratory energy
- Siblings feel: all have that star tail and sparkle eyes, but some are compact star-dragons, some are round puff-stars, some have horns

**MOON** 🌙
> Crescent horn, night palette, aura always visible.
- Locked: `hornType = spiral (crescent variant)`, glow tier ≥ common
- Biased: `isNight` creatures have 80% Moon probability, cool palette, `eyeType = dewy or sparkle`
- Palette: deep indigo, navy, soft lavender, silver — h1 shifted toward cool blues
- Signature tendency: moody but warm, the contrast between cool colors and dewy warm eyes
- Stat driver: night-hatched creatures, high acc
- Siblings feel: all have the crescent/spiral horn and glow aura, but some are tiny Moon-bunnies, some round Moon-bears

**CLOUD** ☁️
> Flutter wings always present, white-lavender palette, round.
- Locked: `wingType = flutter`, `bodyType = chubby or fluffy`
- Biased: soft pattern types, white/lavender/light grey palette, `mouthType = smile`
- Palette: white, cloud grey, pale lavender, soft sky blue
- Signature tendency: feeling of lightness and softness even on a compact body
- Stat driver: low streak, high acc — the careful quiet learner who doesn't rush
- Siblings feel: all have those wispy flutter wings and soft palette, but differ in face, ear type, accessories

**CRYSTAL** 💎
> Spiral horn, blue/purple palette, pattern reflects geometry.
- Locked: `hornType = spiral`, `patternType = stripes or solid` (geometric variant)
- Biased: cool colors, `eyeType = sparkle or wide`, glow tier ≥ uncommon
- Palette: ice blue, crystal purple, bright violet, silver — h1 in the Math purple range
- Signature tendency: feels slightly more "otherworldly" but never scary — sharp details only in the horn, everything else is soft
- Stat driver: Math dominant — precise, structured
- Siblings feel: all have that spiral horn and cool palette, but some are squat crystal-bears, some lean crystal-cats

**OCEAN** 🌊
> Fin ears, blue/teal palette, subtle wave pattern.
- Locked: `earType = fin`, `patternType = stripes (wave variant)`
- Biased: blue/teal h1, `tailType = long-swish`, no wing (fins instead)
- Palette: ocean teal, deep sea blue, seafoam, coral accent — h1 shifted toward blue
- Signature tendency: slight sheen on surface (Beauty Layer adds faint iridescent overlay), horizontal movement
- Stat driver: Eng dominant, high `speed` — fluid and fast
- Siblings feel: all have fin ears and wave stripes, but vary in shade (tropical vs. deep sea), body size, tail length

**FLOWER** 🌸
> Flower crown is nearly always present, soft rounded, warm pink/yellow.
- Locked: `accessory = flower-crown` (90% probability)
- Biased: `bodyType = chubby`, round soft everything, warm pink/yellow palette
- Palette: petal pink, golden yellow, soft coral, blush — h1 biased warm
- Signature tendency: the most straightforwardly sweet family, very young-skewing design
- Stat driver: Gentle personality, balanced stats
- Siblings feel: all have the flower crown, but some are pink round flowers, some yellow bird-flowers, some with spotted petals

**DREAM** ✨
> Stars scatter on body, pastel prismatic, softly glowing.
- Locked: `patternType = stars-scatter`, glow tier ≥ uncommon
- Biased: pastel palette (any hue but desaturated), `eyeType = dewy`, `hornType = star or none`
- Palette: any pastel — the most hue-diverse family. The scatter pattern unifies them.
- Signature tendency: looks slightly unreal, like something from a half-remembered dream
- Stat driver: hybrid/balanced subjects — all roads, no single direction
- Siblings feel: all have those little stars on their body and a soft glow, but color wildly — a Dream creature can be any pastel shade

---

### Family Determination Logic

**See "Egg-to-Creature Identity → Updated Family Determination Logic" above for the authoritative implementation.**

In summary: egg motif is detected first (isNight → Moon, golden+streak+stage → Star, h1 hue range → Leaf/Ocean/Cloud/Crystal/Ember). Motif hard-assigns the family. Only when no strong motif is detected does stat-based selection apply. This ensures the creature feels like it came from that specific egg — not from a stat table.

---

## Signature Feature System

Every creature must have exactly **one visually prominent, personally memorable trait.** This is the thing the child will describe when talking about their creature.

> "My creature has HUGE ears."
> "Mine has a star on its tail!"
> "It has heart marks on its cheeks."

Without signature features, creatures from the same family would feel too similar at a glance. The signature feature breaks the visual "sameness" even between siblings.

### The Signature Feature Library

**Body signature features:**
- `mega-cheeks` — cheeks amplified to 1.8× normal size. Round, soft, immediately adorable.
- `tiny-body` — body miniaturized to 70% normal, head stays full size. Extreme chibi.
- `extra-round` — body rendered as near-perfect circle. Maximally soft silhouette.

**Head / Face signature features:**
- `two-color-eyes` — left eye uses `h1` hue, right eye uses `h3` hue. Always warm + complementary.
- `heart-cheek` — blush type is forced to `heart`, larger than normal. Reads as natural birthmark.
- `star-freckle` — small 3-point star cluster on one cheek or under one eye.
- `big-shine` — eye highlight enlarged to 40% of eye area. The creature looks perpetually delighted.
- `sleepy-droop` — one eye (the left) is permanently 80% closed. Not sad — endearing.

**Ear / Head feature signatures:**
- `mega-ears` — ears scaled to 1.6× family-default size. Cat ears become large cat ears. Bunny ears become enormous.
- `twitch-ears` — ears have a subtle notch/curl at tip. Different from base family ear shape.
- `moon-mark` — small crescent shape above the brow. Not a horn — a marking.

**Tail signature features:**
- `curly-tail` — tail curves into a tight spiral (regardless of base tailType). Distinctive profile silhouette.
- `mega-tail` — tail scaled to 1.8× normal. Fluffy pom becomes very fluffy. Star tip becomes prominent.
- `twin-tails` — two separate tails instead of one. Rare variant (~10% of creatures).

**Accessory / Pattern signatures:**
- `large-bow` — bow scaled to 2× normal. Becomes a defining feature not a minor detail.
- `stripe-face` — one horizontal stripe across the face in h2 color. Marking, not paint.
- `body-glow-spot` — single round glowing spot on chest or forehead (matches `ha` hue). Looks like a power source.

### Signature Feature Selection

The signature feature is selected AFTER the family, and it must not conflict with the family's locked features.

```
1. Draw one gene from prng stream (0–15)
2. Map to signature category (body / face / ears / tail / accessory)
3. Check: does it conflict with family's locked features?
   - If conflict: draw again (max 2 retries)
   - If still conflict: fall back to `heart-cheek` (always safe)
4. Record signature in DNA as `signatureFeature` field
```

**Examples of conflicts prevented:**
- Dragon family has `hornType = bumps` locked → `moon-mark` (head feature) skipped, try again
- Bunny family has `earType = floppy` locked → `mega-ears` allowed (amplifies the bunny ear)
- Puff family has `patternType = solid` locked → `stripe-face` skipped (adds pattern), try again

### Signature Feature in the Beauty Layer

The signature feature is amplified in the Beauty Layer to ensure it reads clearly at 120px:
- Scale modifiers applied (mega variants at 1.5–1.8×)
- Color of the signature feature pulled from `ha` (the most contrasting hue available)
- A subtle drop-shadow added behind the signature feature to lift it from the body
- In animation: the signature feature has its own subtle idle motion (mega-ears twitch gently; twin-tails wave independently)

---

## Creature DNA — Full Gene Set

Every gene is derived deterministically from the creature prng stream, constrained by family archetype first, then art direction rules. Genes are computed in order — later genes may reference earlier ones.

### Group A: Body Architecture

**`family`** — Computed first. Locks/biases subsequent genes (see Family Archetypes).

**`bodyType`** — (5 types) Partially constrained by family.
- `chubby` — Round, short, heavy cheeks.
- `fluffy` — Soft mound with implied texture.
- `compact` — Alert, square-ish, sturdy.
- `lean` — Taller, lighter proportions.
- `tiny` — Proportionally very small body, full head.

**`headRatio`** — (3 levels) `normal` (45%) / `large` (55%) / `oversized` (65%).
Art direction constraint: `lean` body forces `large` or `oversized` head.

**`cheekSize`** — Always present. (4 levels) `dot` / `normal` / `puffy` / `huge`.
Art direction constraint: Never `none`. Cheeks are mandatory.

**`bellyPatch`** — Boolean. ~60% of creatures. Lighter color patch on belly.

**`signatureFeature`** — From Signature Feature library. Applied after family selection.

---

### Group B: Face

**`eyeType`** — (6 types)
- `round` — large circles with highlight spot. Default cute.
- `sparkle` — round with 4-point star highlight.
- `crescent` — happy-squint U-shape. Very friendly.
- `wide` — large oval, slightly surprised. Curious.
- `button` — tiny dots. Shy / small creatures.
- `dewy` — extra large highlight + soft gradient. Extremely warm.

**`eyeSize`** — `small` / `normal` / `large`. Stat: `acc` — higher = larger, clearer eyes.

**`eyeColor`** — Derived from `h3`. Minimum lightness 55%. Always readable, always warm.

**`blushType`** — `dot` / `heart` / `star` / `none`.
Art direction constraint: `none` only for `compact` body + `brave` personality.

**`mouthType`** — `smile` / `open-happy` / `grin` / `tiny`.

---

### Group C: External Features (constrained by family)

**`earType`** — (7 types) `none` / `round` / `cat` / `floppy` / `fin` / `pointed` / `leaf`.
Art direction constraint: `pointed` ears must match body color ± 20° hue.

**`hornType`** — (5 types) `none` (~45%) / `stubby` / `spiral` / `star` / `bumps`.
Art direction constraint: non-`none` horn requires `sparkle`, `wide`, or `dewy` eye type.

**`wingType`** — (6 types) `none` (~50%) / `fairy` / `bird` / `leaf` / `heart` / `flutter`.
Stat: high `speed` / Eng dominant increases wing probability.

**`tailType`** — (6 types) `none` (~30%) / `wiggly` / `fluffy-pom` / `star-tipped` / `long-swish` / `leaf-tipped`.

**`patternType`** — (6 types) `solid` / `spots` / `stripes` / `belly` / `stars-scatter` / `freckles`.
Pattern color = `h2`. Must be ≥ 30° or ≤ 15° from h1 (ugly zone 16–29° shifted out).

---

### Group D: Accessories (at most one)

- `none` (~40%) / `bow` / `flower-crown` / `scarf` / `glasses` / `heart-mark` / `bandana` / `tiny-hat`

Probability increases with rarity tier. Flower family has 90% flower-crown probability.

---

### Group E: Glow and Particles

| Tier | Distribution | Glow | Particles |
|------|-------------|------|-----------|
| Common | ~50% | Faint warmth | None |
| Uncommon | ~25% | Soft pulse (`ha` hue) | Occasional ✦ sparkle |
| Rare | ~15% | Visible color aura | Slow ⭐ orbit (2–3) |
| Epic | ~8% | Bright animated aura | Active orbit (4–6) |
| Legendary | ~2% | Prismatic shifting aura | Dense orbit + trail |

Rarity derived from `streak` at hatch. High streak = higher tier.

---

## Art Direction Layer

These rules are enforced in code. No gene combination is allowed to reach the renderer in violation of them.

### The Five Hard Rules

1. **Eyes dominate the face.** Eye area ≥ 25% of head area. If a combination produces small eyes, `eyeSize` is forced up.

2. **Cheeks are always visible.** `cheekSize = 'none'` is not allowed. Cheek color: `h1` at +20% lightness, -10% saturation — soft, never neon.

3. **No dark structural features on light bodies.** Pointed ears, horns, and tail tips must match body hue ± 20°. Dark fills forbidden on large shapes. Dark colors allowed only as small accent marks.

4. **ATK creatures are spirited, not aggressive.** Math dominant → deeper/richer colors, compact body, alert expression. Never: spikes, sharp teeth, dark shapes. Red = passion. Not blood.

5. **All body colors in the playful range.** Saturation: 45–85%. Lightness: 48–82%. Glow effects may exceed — they are non-solid.

### Color Harmony Rules

**Body primary:** `h1` hue, saturation `55 + min(stage/8 * 25, 25)%`, lightness `72 - stage/8 * 18%`. Earlier-hatched creatures are paler; later-hatched are richer.

**Pattern accent:** `h2` hue. Ugly zone (16–29° from h1) is shifted by +30° before rendering.

**Glow/aura:** `ha` hue. Minimum lightness 65% (prevents muddy aura).

**Eye color:** `h3` hue. Lightness ≥ 55%. Large eyes kept below 70% saturation to avoid alarming.

**Night creatures** (hour < 6 or ≥ 20): all hues shift -15° toward blue, saturation -10%. Stars and glow more prominent. These creatures feel like they come from a softer world.

### Feature Density by Hatch Stage

| Stage at Hatch | Feature Budget | Effect |
|---------------|---------------|--------|
| 0–2 (Baby) | 3–4 features | Ears + eyes + body color. No accessories, no particles, solid pattern. |
| 3–4 (Developing) | 5–6 features | Tail added, horn stub possible, pattern begins. |
| 5–6 (Mature) | 7–8 features | Wings possible, accessory possible, blush type more elaborate. |
| 7–8 (Pre-hatch) | 9–10 features | Full feature set. Glow visible. Particles possible. Heart-mark unlocks. |

**The battle mark (Stage 7–8 only):** If the egg reached stage 7 (cracks visible in drawEgg), the creature has a small marking — a thin soft line near one eye or cheek, in the color the cracks were. The creature remembers breaking out. Children recognize it subconsciously as a birthmark.

---

## Beauty Layer

The Art Direction Layer prevents ugly. The Beauty Layer makes beautiful. Every creature coming out of Art Direction passes through this layer before rendering. The Beauty Layer does not change genes — it determines how those genes are drawn.

**The north star: the Sticker Test.** Before any detail is rendered, ask: would this look good as a 3cm sticker on a 5-year-old's notebook? Not just "acceptable" — *good*. Premium. Plush-toy-worthy. If any element fails this, the Beauty Layer corrects it.

### Rule 1: The Outline

All shapes have a consistent, clean outline. Outline color = body's primary hue at -30% lightness. Never pure black (`#000`) on pastel creatures. Never white. Always a darkened tint of the creature's own color — this is what makes Pokémon look cohesive.

Outline weight: 2.5px for body/head, 1.5px for ears/tail, 1px for small details.

### Rule 2: Eye Gloss

Every eye gets a small white highlight dot in the upper-left quadrant. Two dots for `dewy` and `sparkle` eye types (one large, one tiny). This is the single most impactful detail for making a character look alive. Cost: 4 lines of Canvas code. Effect: transforms the face from flat to expressive.

Eye highlight: position at 30% from left, 25% from top of eye circle. Color: rgba(255, 255, 255, 0.9).

### Rule 3: Body Gradient

No creature has a flat solid body fill. All bodies use a radial gradient:
- Center (front/top): `h1` hue, +12% lightness, -8% saturation — the lighter face of the creature
- Edge (back/bottom): `h1` hue, base values — the deeper side

This creates the illusion of a rounded 3D form on a 2D canvas. Like a Pokémon card illustration. Cost: one extra canvas gradient. Effect: creature feels soft and dimensional.

### Rule 4: Cheek Gradient

Cheeks are never solid circles. They are radial gradients:
- Center: `h1` at +20% lightness, -10% saturation, opacity 0.7
- Edge: transparent

This makes cheeks feel like a blush rather than painted dots. Natural and warm.

### Rule 5: Signature Feature Premium

The signature feature receives special render treatment:
- Color: pulled from `ha` (the most distinct hue available) rather than body color
- Drop-shadow: 2px offset, 0.2 opacity, softened — lifts the feature from the body
- Scale: applied at exactly the documented amplification (see Signature Feature library)

This ensures the signature feature always reads clearly at 120px, the minimum meaningful display size.

### Rule 6: Harmony Check (Final Pass)

After all genes are resolved and the Beauty Layer has applied its treatments, a harmony check runs:

1. **Saturation gap:** If body saturation and pattern saturation differ by > 25%, reduce the more saturated one.
2. **Lightness contrast:** Body and belly patch should differ by 15–25% lightness. Less = hard to see. More = jarring.
3. **Glow-body relationship:** If glow color (`ha`) is within 20° of body color (`h1`), shift glow hue by +35° to ensure it reads as separate.
4. **Feature count check:** Count visible non-body features. If > 10 (stage 7–8), hide the least important one (lowest-impact gene). Prevent visual noise.

### Rule 7: Background Aura (Collection View)

In the Collection page, every creature is shown with its signature soft radial background:
- Center: creature's `ha` at 15% opacity, lightness boosted to 90%
- Edge: transparent

This gives every creature card its own personality without cluttering the card design. A Star family creature has a golden warm background. A Moon family has a cool lavender. A Dragon family has a slightly richer green or purple. The backgrounds don't match each other — they match their creatures.

### Rule 8: No Overcrowding

The Beauty Layer enforces a "breathing room" principle:
- No two external features (ears, horn, wings) may overlap each other in the rendered composition
- The signature feature must not overlap with an eye
- Accessories position above or below eyes — never across them
- If a layout would create overlap: the accessory is removed (lowest priority feature)

---

## Personality System

Personality is the creature's behavioral character. It derives from the learning profile at hatch — not assigned, but earned.

### The Seven Personalities

**Happy** — The successful learner
- Stat driver: `acc ≥ 80`, `streak ≥ 5`
- Expression: big smile, round eyes, large warm cheeks, bright colors
- Idle: side-to-side bounce every 3–5s, occasional look at player
- Voice: medium-high pitch (1.3×), bright ascending chirps
- Special: spontaneous spin when pet; extra hearts on reunion

**Curious** — The persistent explorer
- Stat driver: `streak ≥ 10`, diverse subject engagement
- Expression: wide eyes, head-forward, slight lean
- Idle: head-tilt, leaning forward, sniff
- Voice: varied pitch (±20%), questioning upswing
- Special: reacts to ambient events (turns to look at butterfly)

**Brave** — The determined challenger
- Stat driver: Thai dominant, `streak > 5`, above-average `mins`
- Expression: slightly narrowed eyes (determined, not mean), forward stance
- Idle: confident small stomp, stands tall, chin-up
- Voice: lower pitch (0.85×), steady rhythm
- Special: first to move toward the egg when pet

**Playful** — The quick responder
- Stat driver: high `speed`, Eng dominant
- Expression: grin, big ears, quick-blinking
- Idle: hop side to side, spin, flick tail, chase own tail
- Voice: high pitch (1.5×), rapid short sounds
- Special: jumps highest on pet; extra spin on level-up

**Gentle** — The balanced learner
- Stat driver: no subject > 50% of total XP
- Expression: soft smile, pastel colors, calm features
- Idle: slow sway, long blinks, sits by egg
- Voice: medium pitch (1.0×), smooth round tones
- Special: sits beside egg after 60s idle; offers "gift" most often

**Sleepy** — The infrequent adventurer
- Stat driver: `mins < 20` at hatch, low play frequency
- Expression: half-closed eyes, soft drooping, rounded shape
- Idle: yawns every 20–35s, sits often, slow movements
- Voice: lower pitch (0.8×), drawn-out syllables
- Special: falls asleep after 30s no interaction; wakes with a stretch

**Shy** — The careful first-timer
- Stat driver: low `streak`, above-average `acc`
- Expression: button or downcast eyes, large blush, small frame
- Idle: looks around nervously, peeks from behind egg, small sudden jumps
- Voice: very soft (0.6× volume), quiet brief chirps
- Special: hides behind egg when tapped; gradually opens up over many interactions

### Personality Determination

```
if (acc >= 0.80 && streak >= 5)        → Happy
else if (streak >= 10)                  → Curious
else if (thaiDominant && streak > 5)   → Brave
else if (engDominant && speed > 65)    → Playful
else if (balanced)                      → Gentle
else if (mins < 20)                     → Sleepy
else                                    → Shy
```

### Personality Evolution (Long-term)

As the child interacts more, personality softens slightly. A Shy creature pet 50 times borrows 1–2 Gentle behaviors. A Brave creature gains 1 Happy behavior at 100 adventures. This is visual, not mechanical. No UI shows the shift. The child just notices.

---

## Animation Layer

Builds on the existing creature companion animation set (walk / wave / sit / celebrate / gift / look / sleep). The procedural system adds personality-weighted idle behaviors.

### Universal Animations

| Animation | Trigger | Duration |
|-----------|---------|----------|
| `blink` | Every 3–8s (personality-weighted) | 0.25s |
| `look-left` / `look-right` | Every 8–15s | 0.6s |
| `breathe` | Always on (subtle 3s loop) | continuous |
| `react-pet` | On tap/pet | 0.6s jump + hearts |
| `react-food` | On food given | 0.8s lean + eat |
| `celebrate` | On level-up | 1.2s jump + spin |
| `sleep-settle` | After 30s idle (Sleepy only) | 1.5s |
| `wake-stretch` | From sleep | 1.0s |

**Signature feature idle animation:** Every signature feature has a micro-animation:
- `mega-ears`: twitches gently every 4–8s
- `curly-tail`: uncurls slightly then re-curls every 6s
- `twin-tails`: waves independently every 5s
- `big-shine`: pulses slightly every 3s
- `body-glow-spot`: gentle pulse every 4s
All others: very subtle idle bob once every 10–15s

### Personality Idle Pool

| Personality | Weighted pool |
|-------------|--------------|
| Happy | bounce×3 · look×2 · wave×2 · tiny-spin · chirp-happy |
| Curious | look×4 · lean-forward×2 · sniff · head-tilt×2 |
| Brave | stand-tall×3 · stomp · look×2 · chin-up |
| Playful | hop-hop×3 · spin×2 · tail-chase · quick-look |
| Gentle | sway×3 · blink-long×2 · sit-settle · look-soft |
| Sleepy | yawn×3 · eye-droop×2 · slow-sway · sit-settle |
| Shy | peek×3 · shrink×2 · look-away · small-jump |

---

## Voice Layer

All voices generated from `playTone()` — no audio files.

**`pitchBase`**: `tiny` = 1.6× / `chubby` = 1.1× / `lean` = 0.95× / `compact` = 0.90× / `fluffy` = 1.0×

**`pitchVariance`**: `playful` = ±20% / `curious` = ±15% / `shy` = ±5% / `brave` = ±8% / others = ±10%

**`soundFamily`**: `chirp` (default) / `peep` (shy/small) / `trill` (playful/curious) / `hum` (brave/gentle) / `squeak` (compact/math)

**`soundSpeed`**: faster for high `speed` stat creatures

| Moment | Sound |
|--------|-------|
| Pet received | `chirp` or `peep` (pitch from profile) |
| Food received | `hum` + `chirp` |
| Reunion (>4h) | Multiple `chirp` notes in sequence |
| Celebrating | Rapid ascending notes from `soundFamily` |
| Sleeping | Low, slow `hum` |
| Ambient event | Single soft `chirp` |

---

## Egg-to-Creature Visual Continuity

_For the design philosophy and family mapping rules, see "Egg-to-Creature Identity" above. This section covers the implementation-level continuity rules for `creatureGenerator.js`._

### Hard Continuity (always applied — zero exceptions)

| Egg Value | Creature Output |
|-----------|----------------|
| `h1` hue | Body primary color |
| `h2` hue | Pattern / accent color |
| `ha` hue | Glow / aura color |
| `h3` hue | Eye color |
| `isNight` | Cool palette shift, star/moon features weighted up |
| Egg motif | Family archetype (see Egg-to-Creature Identity) |
| `stage` at hatch | Feature density tier |

### Soft Continuity (probability-based — applied in `buildCreatureDNA`)

| Egg Visual Signal | Creature Bias | Probability |
|---|---|---|
| Dense dots (progress ≥ 0.4) | `patternType = spots or freckles` | 70% |
| Many lines (high eng XP) | `patternType = stripes` | 60% |
| Outer glow (progress ≥ 0.2) | Glow tier ≥ uncommon | 75% |
| Stars on egg (progress ≥ 0.78) | `eyeType = sparkle` | 65% |
| Stage 7–8 hatched | Battle mark on face (100% hard) | 100% |
| `firstSubject = eng` | `wingType ≠ none` | 55% |
| Shadow creature on egg (progress ≥ 0.55) | `bodyType = compact or chubby` | 60% |

**Implementation note:** `progress = stage / (EGG_STAGES - 1)`. These thresholds map to specific stages: 0.4 ≈ stage 3–4, 0.78 ≈ stage 7, 0.55 ≈ stage 5.

### The Birth Moment

1. Hatch animation plays (existing HatchOverlay.jsx)
2. Egg bursts → creature emerges already colored to match the broken egg pieces
3. Creature pauses — big eyes blinking, taking in the world
4. First reaction: looks directly at the player
5. First sound: voice profile chirp
6. The egg's glow color (`ha`) becomes the creature's aura briefly — the two are the same light for one moment

---

## Existing Collection Migration

This section defines how old creatures (hatched before the procedural system ships) are handled.

### The Problem

Existing hatched creatures are stored as `{ e: '🐉', n: 'มังกรน้ำ', rarity: 'common', ... }`. No DNA. No egg stats snapshot. The original egg stats at hatch time were not saved.

### The Principle

**Same seed = same character forever.** But old creatures don't have a seed — they have a fixed emoji. The migration must respect this.

**No deletion. No reroll. No data loss.** Every old creature keeps its visual identity.

### Migration Strategy

**Two render paths in `renderCreature(creature)`:**

```
if (creature.dna) {
  → Use drawCreature() with DNA genes
  → Full procedural canvas rendering
} else {
  → Legacy render: show emoji + name + rarity as before
  → No procedural canvas generated
}
```

**New hatches** (after the system ships): `buildCreatureDNA(stats)` runs at hatch time. The full DNA object is stored in the hatched egg record as `creature.dna = { ...genes }`. The creature canvas is generated from this stored DNA.

**Old hatches**: No `dna` field. Continue to render as emoji. No migration happens automatically. The child's existing creatures look exactly as they did before — they don't degrade.

**Optional upgrade path (future, not Year 1):** If the child wants, they can "rediscover" an old creature — a one-time animation where the emoji creature gets a soft Beauty Layer treatment (gloss, gradient background, gentle glow) without full DNA generation. This is cosmetic only.

### State Schema for New Creatures

The hatched egg record in state gains a `dna` field:

```js
{
  // Existing fields (unchanged):
  e: null,          // unused for new creatures (kept for migration compatibility)
  n: 'ลูมิ',       // name (procedural or child-chosen)
  cat: 'star',      // family archetype
  rarity: 'rare',
  rarityLabel: 'Rare',
  f: '+...',        // flavor text (derived from family + signature)

  // New fields:
  dna: {
    family: 'star',
    bodyType: 'compact',
    headRatio: 'large',
    cheekSize: 'normal',
    eyeType: 'sparkle',
    eyeSize: 'large',
    earType: 'cat',
    hornType: 'star',
    wingType: 'none',
    tailType: 'star-tipped',
    patternType: 'stars-scatter',
    accessory: 'none',
    blushType: 'dot',
    mouthType: 'grin',
    bellyPatch: true,
    signatureFeature: 'mega-tail',
    personality: 'playful',
    h1: 44, h2: 210, h3: 270, ha: 45,
    isNight: false,
    stage: 7,
    rarityTier: 2,
    voicePitch: 1.4,
    voiceFamily: 'trill',
  }
}
```

### Migration Guarantee

Once a creature's DNA is written at hatch, it never changes. A creature hatched on day 1 of the new system will look identical on day 1000. The DNA is stored in localStorage (and Supabase when synced) as a permanent record.

---

## Implementation Phases

Phase 2 (emoji composite) is removed. Canvas renderer is the target from Phase 2 onward.

### Phase 1: DNA Extraction (no visual change)

- Create `src/lib/creatureGenerator.js`
- Export `buildCreatureDNA(stats)` → full gene object (see schema above)
- `buildVoiceProfile(dna)` → `{ pitchBase, pitchVariance, soundFamily, soundSpeed }`
- Family determination logic
- Signature feature selection with conflict resolution
- All genes deterministic — same stats always return same DNA
- `dna` field stored in hatched egg record in state
- No rendering changes yet — existing emoji display unchanged
- No code path modification in `getCreatureForHatch()` yet

### Phase 2: Canvas Renderer

- Create `src/lib/drawCreature.js`
- `drawCreature(canvas, dna)` — Canvas renderer, mirrors `drawEgg()` structure
- Art Direction Layer enforced in renderer
- Beauty Layer applied in renderer (outline, eye gloss, body gradient, cheek gradient)
- Signature feature drawn at documented amplification
- `CreatureCanvas.jsx` component (mirrors `EggCanvas.jsx`)
- Wire `renderCreature(creature)` logic in Collection.jsx — DNA path vs legacy emoji path
- Creature companion in Home.jsx shows Canvas creature for new hatches

### Phase 3: Animation Layer

- Personality idle pool wired to Home.jsx creature scheduler
- Signature feature idle micro-animations
- `CreatureCanvas.jsx` receives animation class from Home.jsx
- Birth moment visual sequence in HatchOverlay.jsx (creature emerges colored as egg)

### Phase 4: Voice Layer

- `playCreatureSound(dna, moment)` in audio.js
- Voice pitch/family/variance applied to existing `playTone()` primitives
- Wired to all creature interaction moments in Home.jsx

### Phase 5: Birth Sequence

- Full HatchOverlay.jsx birth moment:
  1. Crack sequence (existing)
  2. Egg glow matches creature aura (transition)
  3. Creature canvas appears at 40% scale, pulses to 100%
  4. First blink animation
  5. Creature looks at player
  6. Voice profile first chirp
  7. Name reveal (procedural or selection)
- This phase is visual polish — the system works without it

---

## Combination Mathematics

| Gene Category | Options |
|---------------|---------|
| family | 16 |
| bodyType | 5 (family-constrained) |
| eyeType | 6 |
| earType | 7 (family-constrained) |
| hornType | 5 (family-constrained) |
| wingType | 6 (family-constrained) |
| tailType | 6 (family-constrained) |
| patternType | 6 (family-constrained) |
| accessory | 8 (family-constrained) |
| signatureFeature | 17 |
| personality | 7 |
| rarity tier | 5 |

**Raw combinations:** 16 × 5 × 6 × 7 × 5 × 6 × 6 × 6 × 8 × 17 × 7 × 5 = **~1.7 billion**

After art direction + family constraints eliminate ~80% of raw combinations: **~340 million valid creatures.**

The continuous variables (exact hues, cheek sizes, body scales) add infinite variation within each category. The 340M figure is a lower bound.

A child with 10 hatched creatures will have 10 visually distinct friends. A child with 100 will still see variety. A child who plays for 5 years will never see the same creature twice.

---

## Open Questions

Phase 3 (Canvas renderer) should not begin until Q1–Q3 are answered. Q4–Q10 can be decided during or after Phase 2.

**Q1 — Does creature evolution exist?**
Does the creature look different after 100 battles? After a year of play? Options: (a) born complete, never changes (Tamagotchi model — strong identity), (b) colors deepen slightly with use (subtle maturation), (c) new features unlock at milestone counts (battle companion growing up). Year 1 recommendation: born complete. Evolution is Year 2.

**Q2 — Procedural vs child-chosen names?**
Options: (a) Procedurally generated Thai-syllable names (ลูมิ / สปริ / ชิโน / ทาลุ) — unique per creature, always pronounceable; (b) child picks from 5 procedural suggestions at birth; (c) child types a name (high friction for 5-year-olds); (d) no name. Recommendation: (b) — 5 suggestions shown as large tap targets, child picks one, no typing needed.

**Q3 — How prominent are family labels in the UI?**
Does the Collection page say "Star Family" or "ตระกูลดาว"? Does the creature have a visible family label? Or is the family an invisible system the child never reads? Options: (a) hidden entirely — the family only influences appearance; (b) shown in Collection detail view as a subtle badge; (c) shown at birth as part of the reveal. Recommendation: (b) subtle badge — children notice it without it being a category system.

**Q4 — Night creatures ("Moonborn") as named subtype?**
~15% of eggs are set during night hours. The Moon family already captures most of this. Should "Moonborn" be a named, distinct rarity label shown in the UI? Low cost, high emotional meaning. Recommendation: yes — one extra label in the rarity system.

**Q5 — Collection page layout for procedural creatures?**
Currently Collection.jsx shows emoji + name + rarity as a card. With Canvas creatures, the card must accommodate a rendered canvas. What's the target card size? 120px canvas vs 80px? How many per row? This is a UX decision needed before Phase 2 begins.

**Q6 — Do accessories need to be earnable/equippable separately?**
Born-with accessories (current design) = personal, permanent. Equippable accessories from shop = economy, replayability. Born-with is more "this is my friend." Equippable is more "I'm decorating my friend." Year 1 recommendation: born-with only. Equippable is Year 2.

**Q7 — Creature companion zone in Home.jsx needs to be larger.**
Currently the creature walks in a 52px-high zone at 26px emoji scale. At 26px, the Canvas creature's signature feature is invisible. Minimum meaningful display: 60–80px creature zone, 48px canvas. This requires a layout change. Is this in scope for Phase 2 or a future pass?

**Q8 — What does the Collection "feel like" when a child has many creatures?**
The current design is a list. With procedural creatures, the collection becomes something more like Animal Crossing's resident board — a gallery of friends. Should the Collection page have a "friendship focus" (each creature's story: days together, adventures, favorite subject) or a "gallery focus" (beautiful grid of canvases)? Both are possible. This decision shapes the Phase 2 Collection.jsx implementation significantly.

**Q9 — Should the egg's visual motif be made more legible before the creature system ships?**
Currently eggs look unique but their motif (Moon / Star / Leaf / etc.) may not be visually obvious to a child. If the creature emerges as a Moon creature from an egg that didn't look particularly moon-like, the "inevitable" feeling breaks. Options: (a) accept some ambiguity — the creature reveals what the egg was; (b) add a CSS/overlay layer on top of the locked canvas that amplifies the motif visually (no `drawEgg()` change); (c) document a planned `drawEgg()` modification to make egg motifs clearer (unlocks the locked system for a specific purpose). This is the highest-impact question for the "creature feels inevitable" goal.

**Q10 — Should the "Ember" color treatment be formalized as a 17th family, or left as a warm-palette variant of Fox/Dragon/Bear?**
Currently "Fire Egg → Ember Fox / Ember Dragon / Ember Bear" is handled by warm h1 values naturally producing warm-colored versions of existing families. A formal Ember family would have its own locked features (flame-tip tail, ember glow mandatory). Low priority for Year 1, but worth deciding before Phase 2 so Collection cards display consistently.

---

## Summary: The One-Sentence Design Principle

Every creature is the natural result of the specific egg the child grew — a being that crystallized from everything the child did during those weeks of learning, rendered with the same care and warmth as a Pokémon card illustration.

---

_See also: `docs/research/battle/creature-stats.md` for stat derivation, `docs/research/gameplay/egg-companion-adventure.md` for companion relationship data_
