# GPT Notes — KidQuest
_Source of GPT → Claude knowledge. Update this when GPT makes decisions Claude should know._

---

## Procedural Character System (2026-06-09, revised 2026-06-09)

Source-of-truth: `docs/research/creatures/procedural-character-system.md`

**Design goal:** Every hatched creature should feel like "this is MY creature" — the natural result of the egg the child grew, not a fixed pool pick.

**Beauty standard:** Every creature must pass the Sticker Test — premium, plush-toy-worthy, Pokémon/Disney quality, warm, cute, memorable for ages 4–6. No combination should look ugly, scary, random, overcrowded, too dark, too sharp, or too realistic.

### Architecture (decided, revised)

```
Egg Stats → Base Seed → [egg algorithm LOCKED]
  → Creature DNA Extractor (family first, then 40+ genes, signature feature)
  → Art Direction Layer (hard rules: cheeks always, color range, feature density)
  → Beauty Layer (NEW: sticker test, eye gloss, body gradient, outline, harmony check)
  → Animation Layer → Voice Layer → Creature
```

The creature DNA extractor re-uses `hash()` + `prng()` imported from `eggAlgorithm.js`. It mixes the base seed with `hash('creature')` to get a separate deterministic stream. `eggAlgorithm.js` is never touched.

### Key Design Decisions

- **Family Archetypes first (NEW)**: 16 visual families (Puff/Fluff/Bear/Cat/Fox/Bunny/Bird/Dragon/Leaf/Star/Moon/Cloud/Crystal/Ocean/Flower/Dream). NOT species lists. Visual themes. Determined before all other genes. Two creatures from same family feel like siblings, not identical.
- **Signature Feature (NEW)**: Every creature has exactly one visually prominent memorable trait (mega-ears, star tail, heart cheek, two-color eyes, curly tail, body-glow-spot, etc.). The child can name it. The signature feature is amplified by the Beauty Layer.
- **Beauty Layer (NEW)**: Layer between Art Direction and Animation. Responsible for: tinted outline (never pure black), eye gloss highlight, body radial gradient (3D roundness), cheek radial gradient, signature feature amplification, harmony check (saturation gap, glow-body relationship), breathing room (no overlapping features), collection background aura.
- **~340 million valid combinations** after family + art direction constraints (was ~42M with fewer family constraints)
- **Same hue values as egg** (`h1`, `h2`, `ha`, `h3`) drive creature colors — the creature is visually continuous with the egg
- **7 personalities** derived from learning profile at hatch time: Happy / Curious / Brave / Playful / Gentle / Sleepy / Shy
- **Feature richness by hatch stage**: stage 2 = 3–4 features; stage 7–8 = 9–10 features with glow + particles
- **Battle mark**: creatures hatched at stage 7–8 have a small line near eye matching the egg's crack color
- **Emoji composite removed**: No Phase 2 emoji-composite MVP. Canvas renderer is the target from Phase 2 onward.

### Implementation Path (5 phases — emoji composite REMOVED)

1. **Phase 1**: `creatureGenerator.js` — DNA extraction (family, 40+ genes, signature feature), `dna` field stored in hatched egg record. No visual change.
2. **Phase 2**: `drawCreature.js` + `CreatureCanvas.jsx` — full canvas renderer with Art Direction + Beauty Layer
3. **Phase 3**: Animation layer — personality idle pool, signature feature micro-animations, birth sequence begins
4. **Phase 4**: Voice layer — `buildVoiceProfile(dna)`, `playCreatureSound(dna, moment)`
5. **Phase 5**: Birth sequence — HatchOverlay full reveal, egg glow → creature aura transition, first blink/look/chirp

### Egg-to-Creature Identity (new — v3)

**Core rule:** Family is derived from the egg's visual identity (motif) first. Stats modify creature shape within that family. Do not select family from stats alone.

**Egg motif detection** (first match wins):
- `isNight` → Moon
- `ha` 30–60° + `streak ≥ 14` + `stage ≥ 5` → Star
- `h1` 80–160° → Leaf
- `h1` 160–220° → Ocean
- `h1` 220–270° → Cloud
- `h1` 270–320° → Crystal
- `h1` ≥ 340° or < 30° → Ember (no Ember family — Fox/Dragon/Bear with warm palette, stat-picked)
- No match → stat-based selection

**Within-family body shaping by stats:**
- Thai dominant → solid/round silhouette (Moon Bear, Leaf Bear)
- Eng dominant → light/elegant silhouette (Moon Bunny, Star Bird, Ocean Cat)
- Math dominant → structured silhouette (Moon Dragon, Crystal Dragon)
- Balanced → pillowy/soft (Moon Puff, Dream Puff)

**Named creature examples:** Moon Fox / Moon Bunny / Moon Puff / Moon Dragon / Star Puff / Star Bird / Star Cat / Leaf Bear / Leaf Bunny / Ocean Puff / Ember Fox / Ember Dragon / Ember Bear / Cloud Bunny / Cloud Bird

**Future note:** Egg algorithm may need a Visual Identity Pass (CSS overlay or planned `drawEgg()` modification) so eggs themselves look more clearly moon-like / star-like / etc. before the creature system ships. See Q9.

### Migration (existing hatched creatures)

- Old creatures (emoji `e` field, no `dna` field) → legacy emoji render path, no change, no data loss
- New creatures (after system ships) → `dna` field saved at hatch time → `drawCreature()` canvas path
- `renderCreature(creature)` checks `creature.dna` first → new path. Absent → emoji fallback.
- Same seed = same character forever. Once DNA is saved, it never changes.

### Open Questions for GPT to Answer

1. Does creature evolution exist? (Recommendation: born complete for Year 1; evolution is Year 2)
2. Procedural name vs child picks from 5 suggestions vs child types name? (Recommendation: 5 suggestions as large tap targets)
3. How prominent are family labels in the UI? (Recommendation: subtle badge in Collection detail, not a category system)
4. Should "Moonborn" be a named rarity label? (Recommendation: yes, one extra label)
5. Collection page layout for procedural canvas creatures — card size? Cards per row?
6. Accessories born-with vs equippable from shop? (Recommendation: born-with Year 1)
7. Creature companion zone in Home.jsx — should it be enlarged for canvas? (Min 60–80px zone to show signature feature)
8. Collection "feel" — friendship focus (days together, favorite subject) vs gallery focus (beautiful grid)?
9. **(NEW)** Should the egg's visual motif be made more legible before the creature system ships? Options: (a) accept ambiguity, (b) CSS overlay on locked canvas to amplify motif, (c) planned `drawEgg()` modification. Key question: does the current egg look "moon-like" to a child? "leaf-like"?
10. **(NEW)** Should "Ember" be formalized as a 17th family (flame-tip tail locked, ember glow mandatory), or remain a warm-palette variant of Fox/Dragon/Bear?

### What Claude Code Must NOT Do Until GPT Answers

- Do not implement Phase 2 (Canvas) until Q1, Q2 are answered
- Do not change `HATCH_CREATURES` pool in `gameConfig.js` until Phase 1 DNA extractor is ready
- Phase 1 (DNA extraction, no visual change) can proceed independently

---

## Egg Home Design (2026-06-09)

Source-of-truth: `docs/research/world/egg-home.md`

**Egg Home is the first screen the child sees. It is a place, not a menu.**

### Core principles decided
- **The egg is alive and reactive.** It breathes, bobs, reacts to every interaction. Never static.
- **Every visit is rewarding.** Not dramatically — just warmth, a small response, something slightly new.
- **No punishment for absence.** If the child was away 3 days, the egg shows a Reunion burst when they return. Message: "I'm so happy you're back." Never: "You forgot about me."
- **No learning here.** No questions, no quizzes, no scores, no subject labels, no mastery bars. This screen is a learning-free zone.
- **Mood is visual only.** Happy/content/quiet/excited/reunion states expressed through egg animation and color — never through a stat bar or number.

### Interactions defined
- **Pet egg** — tap egg → bounce + sparkle + chirp sound. After ~3 pets: big spin. After ~6 fast: sleepy-happy settle.
- **Feed (🍗)** — food floats to egg → egg absorbs it → warm orange glow + bounce.
- **Ribbon (🎀)** — ribbon wraps egg → decoration persists visually → proud puff animation.
- **Potion (💧)** — XP progress moves slightly → blue glow (no number shown).
- **Star (⭐)** — golden pulse + orbiting particles for 5-minute boost duration. Timer shown as fading ring, not countdown number.
- **Creature companion** — walks left-right in lower screen. Tap it → happy jump → resumes walking.

### Return loop motivators (intrinsic only)
- Egg appears slightly different every visit (stage progression, idle variations)
- Reunion animation on return after >4 hours
- Near-hatch excitement at stages 5–7 (egg cracks, shakes, wants to hatch)
- Items in tray waiting to be used ("I found this for you")
- Creature does something rare occasionally (not scheduled, organic)

### What is explicitly excluded
- Streak counters, "don't break your streak" messaging
- "Your egg is hungry!" anxiety notifications
- Time-gated rewards that expire
- Any "come back or else" mechanic
- Home decoration (Year 1 deferred)
- Learning content of any kind

### Open questions for GPT (10 — must answer before Egg Home code begins)
1. **Egg naming?** Name at creation (Tamagotchi-style)? Typed name or preset selection? Does a 5-year-old benefit from naming?
2. **Mood indicator?** (a) animation only — no UI; (b) tiny emoji above egg (😊/😴/✨); (c) ambient background warmth shift. Which is right for age 5?
3. **Return frequency and notifications?** Push notifications? Purely intrinsic? What is right when a parent controls app access?
4. **Creature companion dialogue?** Should the creature occasionally "say" a Thai/English word (speech bubble)? Hidden soft learning moment?
5. **"What does the egg want?"** Should the egg show a small desire indicator (like Tamagotchi hunger icon)? Creates return motivation without punishment.
6. **Hatch moment in Egg Home?** Tap egg to hatch? "Hatch now!" button? Egg tries to hatch on its own until child helps?
7. **Egg in battle vs. staying home?** Egg is currently the player avatar in battle. How is this framed when Egg Home is the "home"? "Your egg went on an adventure and came back stronger"?
8. **Ambient sound?** Soft home theme (Animal Crossing-style)? Year 1 MVP or deferred?
9. **Do creatures ever leave?** Permanent residents? Or Animal Crossing-style "want to move away"?
10. **Multiple creatures in Home?** One at a time? All walking around together? Does having more make Home feel more alive?

---

## Green Meadow Detailed Design (2026-06-10)

Source-of-truth: `docs/research/world/green-meadow.md`

**Read this before implementing WorldMap.jsx or any exploration system.**

### Map layout (3×3 grid)

```
[TL] Flower Field   | [TM] Grandma Turtle's House | [TR] Forest Entrance
[ML] River Crossing | [MC] Town Square             | [MR] Clover Hill
[BL] Pond & Willow  | [BM] Starting Path ← ENTER  | [BR] King Clover Bear Meadow
```

All screens fully authored. No procedural generation.

### Key design decisions

- **Visible enemies always** — all 6 enemy types are visible on screen before battle. Walk into them to trigger. No invisible random encounters. Ever.
- **Natural session length** — 10–15 min. 3–5 battles. Child chooses when to return home.
- **Minigames are world-embedded** — EggFishing at river/pond, EggRun via Bunny race, EggTower via tree climb, EggCatch via butterfly field, EggMemory via Grandma's quest. No separate menu entry.
- **Boss failure = bear hugs + gift** — never "you lost" framing. Child bounced gently to Starting Path with consolation item. Professor Owl encourages.
- **Home return is always voluntary** — home button always visible. Several natural "go home?" suggestions after natural end conditions, never forced.

### Enemy roster (all cute/funny/warm)
Sleepy Bunny, Bouncy Slime, Tiny Fox (25% flee chance), Leaf Sprite, Grumpy Mole, Mushroom Imp.

### NPC placement
- Starting Path (BM): Professor Clover Owl (tutorial), Post Bird (mailbox)
- Town Square (MC): Young Bunny Farmer (trader + EggRun), Traveling Bee Merchant (60% sessions)
- Grandma Turtle's House (TM): Grandma Turtle (always home)
- Clover Hill (MR): Traveling Bee Merchant (40% sessions)
- Traveling: Post Bird appears on 1–2 random screens per session

### King Clover Bear (boss)

Approach: Walk near throne → dialogue → player chooses fight or not yet. King never forces battle.

Win: Bear claps, laughs warmly, gives Clover Crown + Rare Token + Food. Sparkle storm + confetti.

Loss: Bear gives consolation gift (Clover or Pebble). Dialogue: "ไม่เป็นไรเลย ลองใหม่ได้เสมอ". Player bounced to BM, never empty-handed.

Rebattle: Always available. Different dialogue on repeat visits.

### Treasure system
- 11 fixed treasure spots (mix of one-time permanent, daily, weekly)
- Random sparkle system (1–2 per screen, 30% session chance)
- 27 hidden clovers across all 9 screens (Lucky Day bonus if all found)
- 5 Old Letters (lore chain — location: BM chest, TR log, TM garden path, ML river bank, Post Bird delivery)

### Future hooks reserved in design
- Sunny Beach entrance: eastern edge of Clover Hill (MR)
- Seasonal events: Flower Field (TL), River (ML), Pond (BL)
- Gardening: Grandma's garden (TM) — empty plot placeholder
- Photo spots: hilltop (MR), river (ML), pond (BL)

### Open questions for GPT (must answer before WorldMap.jsx)

1. **Screen navigation UX** — How does child move between screens? Options: (A) directional arrows at screen edge, (B) tap screen edge, (C) minimap, (D) egg sprite moves autonomously, child taps encounter triggers. For ages 4–5, D may be most accessible.
2. **Encounter trigger distance** — How large is the enemy "trigger zone" for a 4-year-old's finger? Estimate: 80–100px on 390px screen. Need GPT call.
3. **Screen transition style** — Scroll (Animal Crossing) or cut (Pokémon)? Scroll = more spatial, heavier. Cut = simpler. Year 1 scope call.
4. **Item bag capacity** — Unlimited (no return incentive) or capped at ~5–10 items (creates natural loop to go home)? Which matches our philosophy?
5. **Minigame launch style** — When EggFishing/EggCatch triggers from the world, does it launch fullscreen (current behavior) or run inside the world screen?
6. **Boss rebattle curriculum** — Does the question set in rematches change? Harder over time? Based on Subject Readiness?
7. **Egg sprite in world** — Does the walking egg look like the current egg stage? (Yes seems right — child's actual egg.)
8. **Collectible display location** — Green Meadow collectibles → Collection tab in Egg Home, or a separate "backpack" in the world?
9. **Day/night clock sync** — Confirm Green Meadow day/night uses same real-clock logic as Egg Home (6am–7pm = day).
10. **Post Bird quest chain** — Letter delivery between NPCs: MVP scope, or deferred post-launch?

### Implementation gate
Do NOT implement WorldMap.jsx until GPT answers questions 1–5.

---

## KidQuest World Bible (2026-06-10)

Source-of-truth: `docs/research/world/kidquest-world.md` (full World Bible, all 8 regions)

**This section records the complete world design. Read before any world map, exploration, or region implementation.**

### World summary
8 regions + Egg Home. Screen-based navigation (Pokémon FireRed model). Year 1 = Green Meadow only.

| # | Region | Age / Grade | Learning focus |
|---|---|---|---|
| 1 | Green Meadow 🌿 | Kindergarten | Counting 1-10, shapes, Thai กขค, English ABC |
| 2 | Sunny Beach 🏖️ | Year 1 S2 | Addition 5-10, subtraction 5, Thai vowels |
| 3 | Crystal Cave 💎 | Grade 1 S1 | Numbers 10-20, subtraction 10, Thai syllables |
| 4 | Cloud Kingdom ☁️ | Grade 1 S2 | Add/subtract 20, skip counting, Thai nouns |
| 5 | Moon Forest 🌙 | Grade 2 S1 | Multiplication intro, Thai sentences |
| 6 | Volcano Mountain 🌋 | Grade 2 S2 | Multiplication 3-6×, division intro |
| 7 | Ancient Ruins 🏛️ | Grade 3 | All four operations, Thai composition |
| 8 | Dream Sky ✨ | Year-end | Mastery consolidation, all subjects |

### Boss roster (friendly, not evil)
King Clover Bear → Sleepy Whale → Crystal Deer → Cloud King → Moon Rabbit → Volcano Dragon → Ancient Turtle → Dream Lion

### Enemy design principle
All enemies: cute / funny / warm. No scary designs. A 4-year-old should see an enemy and think "That's silly!" — never "That's scary."

### NPC core cast
Grandma Turtle, Post Bird, Cloud Sheep, Professor Owl, Fox Merchant, Traveling Bear (+ region-specific NPCs)

### Collectibles system
6 categories: Nature (leaves/seeds), Water (shells/pearls), Minerals (crystals/stones), Magic (moon crystals/dream feathers), Ancient (coins/tablets), Rare (dragon scales/galaxy dust)

### Future systems designed (not yet built)
Walking exploration, random encounters, treasure chests, fishing, cooking, gardening, NPC friendships, seasonal events, weather, mini festivals, day/night, photo mode, home decoration.

### Open questions still unanswered (for GPT)
1. World entry UX — navigable map or simpler choose-region screen?
2. Encounter trigger on mobile — step-based, or "explore" button?
3. Subject assignment in encounters — random, region-based, or readiness-based?
4. XP source — battles only or also exploration?
5. Session length — natural endpoint or open-ended?
6. Minigame integration — become encounter events or stay separate?
7. Creature companion — which creature shows in Egg Home? Latest or player choice?
8. Boss loss consequences — retry only, or pushed back to previous screen?
9. Egg naming — should Chopin name each egg at creation?
10. Background adaptation — should Egg Home background change based on last region visited?

### Implementation gate
Do NOT implement any world map or exploration code until GPT answers questions 1–5.

---

## KidQuest World — Philosophy Shift (2026-06-09)

Source-of-truth: `docs/research/world/kidquest-world.md`

**This section records the most important product pivot in the project so far. Read before any future Home, navigation, or exploration work.**

### Chopin's direct feedback (real playtesting)
- Says: "The game is boring." and "Not like a game."
- Enjoys: collecting eggs, caring for eggs, feeding eggs, giving items, watching eggs hatch, taking eggs into battle.
- Does NOT engage with: subject selector, Adventure Director, level cards.

### Philosophy decision: Game first. Learning hidden inside.
- **Before:** Learning first, game wrapper second. Home = subject selector.
- **After:** Game first, learning hidden. Home = Egg Home. World = what you play.

### Emotional center decision: The egg is the hero.
- Not subjects. Not levels. Not scores.
- Every screen should reinforce: "This is my egg's journey."
- Subjects are invisible support systems, not the main game.

### High-level loop (new)
Egg Home → Enter World → Walk/Explore → Random encounter → Battle (learning enters here) → Reward → Return home → Care for egg → Egg grows → Hatch → New egg → (repeat)

### What this means for previous systems
- **Adventure Director model is superseded.** "Continue Adventure" as main CTA is replaced by "Enter the World."
- **Subject grid navigation is removed from child view.** Subjects are invisible.
- **Battle remains.** Battle is the mechanism where learning questions appear. Battle feel philosophy unchanged.
- **Egg companion reactions unchanged.** Carry forward exactly.
- **sessionLog + parent Report unchanged.** Parents still see subject readiness and accuracy. The child never does.

### Inspirations confirmed
Tamagotchi (egg home feel), Pokémon FireRed (screen-based world, encounters), Animal Crossing (exploration is reward), Mario Party (variety, surprise), WarioWare (fast micro-bursts).

### Map structure decision: screen-based (Pokémon FireRed model)
NOT open-world scrolling. Each location = one screen. Moving to edge = adjacent screen. A region = small grid of screens (3×3 or 5×5). Reason: mobile-friendly, easy to expand, easy to implement.

### Year 1 world scope: Green Meadow only
One region. 3×3 screens. Enemy encounters use existing MoveSelectBattleMode. Treasure chests drop existing items. Full loop: explore → battle → reward → grow egg → hatch.

### Open questions for GPT (all must be answered before code begins)
1. **Egg Home layout** — What does the Egg Home screen look like? What is the primary visual? What are the interactive elements?
2. **World entry** — Is the Year 1 MVP a full navigable screen-based map, or a simpler "choose region" screen? With only Green Meadow in Year 1, do we need a world map at all yet?
3. **Encounter trigger** — How does a battle start? Is the child tapping to move? Tap-and-random-triggers? Auto-step? What is touch-friendly on a 390px screen?
4. **Subject assignment in encounters** — When an enemy appears, which subject's questions appear? Random? Region-dependent? Readiness-based?
5. **XP source** — Does XP still only come from battles? Or also from exploration (finding treasure, walking, collecting)?
6. **Minigame repurposing** — EggRun/EggCatch/etc. — become exploration events, or remain standalone?
7. **Creature companion in Home** — Which creature shows in Egg Home? Always latest? Player's choice? What does it look like on mobile?
8. **Boss battle consequences** — In the world model, should boss losses have any consequence? Push back to previous screen? Or still no consequence (current policy)?
9. **Egg naming** — Should Chopin name each new egg at creation? (Increases attachment, adds a UI step)
10. **Session length** — In the world model, is there a natural exploration session endpoint? Or is it open-ended?

### What Claude Code should NOT touch until GPT answers the above
- Do not redesign Home.jsx
- Do not create new world map components
- Do not change the navigation/routing model
- Do not change currentWorld state semantics
- Do not add a new exploration loop

---

## Battle Feel Philosophy (2026-06-04)

Source-of-truth: `docs/research/gameplay/battle-feel-philosophy.md`

**Required reading before implementing any Subject Battle.**

- **Battle is the experience — not a quiz with animation.** Fun comes from anticipation, animation, sound, impact, HP drain, enemy reactions, combos, crits, and victory. Not from text or move names.
- **Visual hierarchy:** Enemy → Enemy HP → Battle log → Move panel. The question disappears into move selection. Child feels "I choose attacks," not "I answer quizzes."
- **Player HP removed.** The egg never loses HP. No game over. No losing. Wrong answers cause misses and slow progress, but the egg is never in danger. Emotional message: mistakes are safe, the egg is always with you.
- **Wrong answer = miss, not punishment.** Soft fizzle effect. Enemy laughs or reacts. "โจมตีพลาด!" in battle log. No harsh buzzer. No "❌ ผิด!" banner. No HP loss.
- **10-step anticipation sequence:** tap move → card pulse → charge effect → egg lunge → elemental burst → enemy flash → camera shake → HP drain (animated) → damage float → combo/victory check. Total: ≤ 1000ms. CSS-driven.
- **Combo system:** streak 2 = gold glow, streak 3 = screen flash, streak 4+ = crit ×1.5 + ascending fanfare + large damage number. Reset gracefully on miss.
- **Sound:** cute, positive, Pokémon-like. Move select / charge / attack fire / hit / enemy reaction / combo chimes / crit fanfare / miss fizzle / victory fanfare. No harsh sounds. Always respect sound toggle.
- **Victory:** enemy fades → stars → confetti → fanfare → egg celebrates → XP progress appears. Must feel amazing.
- **Battle log:** single line, Thai-first, short. "🥚 ไข่ใช้ [ท่า]!", "โจมตีพลาด!", "Critical hit!", "มอนสเตอร์พ่ายแพ้!", "ชนะแล้ว! 🎉"
- **Animation:** fast, responsive, juicy. Prefer CSS over JS. Reuse existing keyframes. New needed: `move-card-pulse`, `egg-charge`, `egg-lunge`, `elemental-burst`, `hit-flash`, `miss-fizzle`, `damage-float`, `enemy-defeat-fade`.
- **Implementation priority:** feel baseline BEFORE Math Battle MVP content. Getting the grammar right first means content layers in cleanly.
- **Open questions before implementation:** (1) 2×2 or row move layout? (2) Damage number above enemy or center screen? (3) Enemy counter every-3-misses vs every-N-turns? (4) Combo reset rules between sessions? (5) New `playTone()` names for battle sounds?

---

## Pokémon-Style Learning Battle — Updated (2026-06-04, Battle Feel Polish Pass)

Source-of-truth: `docs/research/gameplay/pokemon-style-learning-battle.md`
Authority: `docs/research/gameplay/battle-feel-philosophy.md` governs all sensory/emotional decisions.

- **This is battle-first design, not a quiz with battle decoration.** The child feels "I choose attacks" — not "I answer quizzes."
- **Answer choices ARE attack moves.** Each move button: large icon + large answer content + tiny optional flavor name. **Icons and answers are primary. Move names are tiny flavor text or hidden entirely.**
- **Player HP removed. DECIDED.** The egg never loses HP. No defeat screen. No losing state. Wrong answers = attack misses → soft fizzle → enemy laughs/taunts → battle continues. Emotional message: mistakes are safe, the egg is always with you.
- **Wrong answer = miss, not punishment.** No "❌ผิด!" banner. No harsh buzzer. No strike count. No accumulating consequence. "โจมตีพลาด!" in battle log + enemy reacts + next turn.
- **Same battle shell for all subjects.** Math encodes numbers as answer content. Thai and English encode emoji picture options + TTS. Battle mechanics (HP, enemy, animations) identical across subjects.
- **Egg is the hero.** The child's current egg is the player character. All Egg Companion Adventure reactions apply (jump, glow, near-hatch pulse). Egg never takes damage.
- **MVP is Math first.** Numbers map directly to move answers — no TTS dependency. After Math playtest with Chopin, add Thai then English.
- **Battle log: short only.** Examples: "⚡ Thunder!", "โจมตีพลาด!", "คอมโบ!", "CRITICAL!", "ชนะแล้ว!". Never full sentences.
- **Open questions remaining:** (1) Correct move = consistent damage vs. most damage? (2) Enemy taunt every wrong or every N wrongs? (3) Move names visible (tiny) or hidden entirely? (4) Replace BattleMode in Subject Adventure entirely, or keep both?

---

## Egg Companion Adventure Philosophy (2026-06-04)

Source-of-truth: `docs/research/gameplay/egg-companion-adventure.md`

- **The egg is the companion, not a progress bar.** The egg should appear in every learning session reacting to correct/wrong answers. The child is not answering questions — they are taking their egg on adventures.
- **The egg is the hero before it hatches.** Every activity is an adventure with the current egg. DefenseMode is the strongest example: the child literally shields their egg from attackers.
- **Egg reactions must never create pressure.** Wrong answers make the egg look worried, not hurt. The egg is never in danger from the child's mistakes. No egg HP, no egg health depletion.
- **MVP is DefenseMode first.** Replace the generic 🥚 placeholder in DefenseMode with the child's actual current egg canvas. Highest emotional impact, lowest risk — one prop change.
- **Relationship data is biography, not score.** Track `adventuresWith`, `questionsAnswered`, `daysTogetherCount`, `favoriteSubject` per egg. Show as flavor biography after hatch. Never show during journey. Never gate anything on these counts.
- **Hatching is relationship payoff.** Summary should include "ผจญภัยด้วยกัน N ครั้ง" before or during creature reveal. Makes hatching feel like a graduation, not a gacha pull.
- **New egg = new journey begins.** After hatch, the companion framing resets with the new egg. "เพื่อนใหม่กำลังรอการผจญภัย!"
- **Open questions for GPT:** (1) Should the egg react differently by subject (color/tone)? (2) Should the child name the egg at creation? (3) Should hatch biography appear before or after creature reveal? (4) Should companion framing be explicit in text or implicit in visuals? (5) Should `adventuresWith` count sessions or rounds?

---

## Observation Philosophy (2026-06-04)

Source-of-truth: `docs/research/observation/observation-philosophy.md`

- **Observe first, understand second, design third. Never assume.** Real play behavior overrides curriculum theory.
- **Children are not their level.** Highest unlock is a historical record, not current readiness. Behavior (accuracy, replay, completion) matters more.
- **Positive interpretation always.** Replaying = building confidence. Low accuracy on new content = encountering new material. No child is "weak", "behind", or "failing."
- **Important signals:** accuracy, replay behavior, completion rate, consistency, voluntary repetition, favorite activities, time spent. No single signal is sufficient — the combination tells the story.
- **Signals that must not dominate:** speed, competition, leaderboards, peer comparison, daily streaks, perfect scores.
- **Subject Readiness is an observation, not a label.** States change. "Exploring" today can be "Comfortable" next week. Always framed as "based on recent play."
- **Parent reports must not create anxiety.** No grades, no rankings, no fear framing, no "falling behind." The report sets the emotional tone of the parent-child-game relationship.
- **Mission follows the child.** Subject Readiness informs mission gating. Content adapts through design iteration (GPT → deterministic rules), not AI.
- **Observation must never become manipulation.** Understanding a child's psychology is not permission to exploit it for retention.
- **Open questions for GPT:** (1) Should Adventure Director use Readiness state (not just XP share)? (2) Should sessionLog decay by recency? (3) Should Readiness gate mission Stretch/Challenge unlock? (4) How often should design iteration reviews happen?

---

## Learning Feedback Principles (2026-06-04)

Documented in `docs/research/progression/gameplay-loop.md` → "Learning Feedback Principles" section.

- **Every correct answer should speak the vocabulary item.** Thai → `speakTh(answer)`, English → `speakEn(answer)`, Math counting → `speakTh(THAI_NUMS[n])`. Delay ~380ms to let tone finish first.
- **Speech before the child answers gives away the answer.** Only speak AFTER correct. (Exception: GameThai speaks on load because the character/word IS the learning item being presented, not the answer to a question.)
- **Sound toggle is always respected.** `speakTh` and `speakEn` both check `_soundOn` internally. No extra guard needed at call site.
- **Implementation status:** GameShop ✅ (added 2026-06-04). GameThai ✅. GamePhonics ✅. GameMath — numeric, no vocab TTS needed.
- **Pattern for future missions:** correct answer → tone → speech (~380ms) → feedback message. Follow this consistently.

---

## Gameplay Loop Philosophy (2026-06-04)

Source-of-truth: `docs/research/progression/gameplay-loop.md` — **This is the highest-level philosophy document.**

- **Home answers "what next?" — not "what do you choose?"** Home is an Adventure Director, not a menu. Single large recommendation > many equal options. Choice overload is harmful for a 5-year-old.
- **Core loop:** Learn → XP → Egg → Hatch → Creature → Battle → Learn again. Learning is always upstream. The loop must never invert.
- **Replay is healthy.** Replay gives full XP. Familiarity and repetition are developmentally appropriate at age 5. The game supports replay; it does not pressure novelty.
- **Surprises should be rare enough to feel special.** Daily Surprise Event uses date-hash deterministic rotation — one minigame per day, not a menu of all minigames.
- **Minigames are rewards, not the primary game.** The old 2×2 grid was replaced intentionally. One daily Surprise Event > four equal options.
- **Intrinsic motivation only.** Curiosity, collection, surprise, progress, mastery. No FOMO, no streak pressure, no time pressure, no login rewards, no punishment.
- **Child autonomy.** The game suggests; it never forces. Ignoring the recommendation is fine. Stopping mid-session is fine. No guilt mechanics.
- **Open questions for GPT:** (1) Should Adventure Director ever recommend battle (not just learning/hatching)? (2) How should Home behave right after a hatch — auto-suggest battle? (3) Should minigame XP be reduced vs. subject XP to prevent farming? (4) Should the loop ever signal a natural session end?

---

## Battle Progression Philosophy (2026-06-04)

Source-of-truth: `docs/research/battle/battle-progression.md`

- **Battle is downstream from learning.** The core loop is Learn → XP → Egg → Hatch → Creature → Battle → Learn again. Battle is the payoff, not the game.
- **Battle should feel exciting and low-pressure.** Children should want to battle, not fear losing. Loss changes nothing permanently — no lost creatures, no lost progress.
- **Enemy scaling is gentle.** Children should usually win. Challenger every 15 `dailyBattleRounds` provides occasional challenge. No sudden difficulty spikes.
- **Battle frequency is self-directed.** No mechanism forces battling. Adventure Director recommends learning, not battling. Battle is a child-chosen reward.
- **Battle rewards support learning loop.** XP, cosmetics, egg progress — rewards flow back into learning motivation. Battle must not replace subject progression.
- **No permanent penalties.** A loss leaves all state identical to before. No creature loss, no XP deduction, no item loss.
- **Known text bug:** `BattleScreen.jsx` advice still says "เรียนภาษาไทยเพิ่มเพื่อเพิ่ม ATK!" but ATK is now Math-weighted. Fix when next touching that file.
- **Open questions for GPT:** (1) Should battle contribute XP to the next egg? (2) Should Challenger trigger adjust as creatures get stronger? (3) Should loss provide a learning prompt, or does that feel punishing?

---

## Subject Progression Philosophy (2026-06-04)

Source-of-truth: `docs/research/progression/subject-progression.md`

- **Subjects are the primary progression axis.** Thai / Math / English are the core. Missions are secondary contexts that apply subject skills.
- **Unlock thresholds locked:** < 70% → try again; 70–79% → soft pass (encouragement, partial reward, no unlock); ≥ 80% → unlock; ≥ 90% → mastery fanfare. These thresholds apply across all subjects and align with mission rules.
- **Replay is never punished.** Replay gives full XP. Replay at any level is a valid learning behavior. The system never frames replay negatively.
- **Mastery = confidence + consistency + enjoyment.** Not speed. Not perfection. Not competition. Response time is never a gate.
- **Subject independence:** Thai, Math, English progress independently. Children do not need balanced levels. No subject is more important.
- **Highest unlock level ≠ readiness.** Readiness comes from session logs, accuracy trends, and replay behavior. See `play-observation-system.md`.
- **Stretch/Challenge are optional bonuses.** Core always playable. Stretch unlocks at ≥ 90% + ≤ 1 wrong + ≥ 2 runs. Challenge unlocks after Stretch mastery. Neither is ever required.
- **Year 1 scope is fixed:** Kindergarten core + Early Grade 1 stretch. Grade 2+ is not planned.
- **Open questions for GPT:** (1) Should Stretch unlock be per-level or per-subject? (2) Should Adventure Director ever recommend Stretch explicitly? (3) What readiness threshold signals it's time to design Grade 1 core content?

---

## Creature Stat Design Philosophy (2026-06-04)

Source-of-truth: `docs/research/battle/creature-stats.md`

- **One-subject-one-stat mapping is rejected.** Old formula (Thai=DEF, Math=ATK, Eng=SPD exclusively) punishes children who prefer one subject. A Thai-only learner would have ATK=0. This is a design failure.
- **Weighted formula with 40% base floor.** Every stat has a guaranteed 40% floor from basePower (total XP). The remaining 60% is distributed across subject shares. No stat can ever be 0.
- **Subject-to-stat style (not ownership):** Math biases ATK; Thai biases DEF; English biases SPD; CRIT balanced between Math/English. These are influences, not exclusive links.
- **Personality variation ±10% max, deterministic.** Derived from egg's XP seed at hatch. Same inputs → same creature always. No random rerolls.
- **Migration rule:** Recalculate stats if ATK/DEF/SPD is 0 or NaN. Never delete eggs.
- **Learning profile = foundation.** Future additions (rarity, equipment, evolution) may modify stats but never replace the learning-derived base.
- **Open question for implementation:** Should HP be purely basePower-derived? Should accuracy/mastery be explicit inputs rather than flowing through XP? Should AI opponent stats use the same formula?

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
