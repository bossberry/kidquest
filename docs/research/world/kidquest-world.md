# KidQuest World Bible
_Created: 2026-06-09. Expanded to full World Bible: 2026-06-10._
_Status: Design phase. All decisions here need GPT review before implementation._
_Supersedes the earlier high-level design draft._

---

## Why This Document Exists

Real playtesting with Chopin (~5 years old) produced direct feedback:

> "The game is boring."  
> "Not like a game."

Chopin enjoys: collecting eggs, caring for eggs, feeding eggs, giving items to eggs, watching eggs hatch, taking eggs into battle.

Chopin does **not** feel engaged by: subjects, levels, scores, the Adventure Director.

**This document defines the new game model.** All design decisions here need GPT and team review before any code begins.

---

## Philosophy Shift

### Before (current model)
Learning first. Game wrapper second.
- Home = Adventure Director (pushes you to a subject)
- Battle = mechanism to deliver learning questions
- Egg = progress bar for learning XP

### After (new model)
Game first. Learning hidden inside.
- Home = Egg Home (care, feed, watch your egg)
- World = the thing you play
- Battle = where knowledge helps your egg fight
- Learning = invisible support system, not the center

**Learning remains. It just stops being the front door.**

---

## Emotional Center

**The current egg is the hero.**

Not subjects. Not levels. Not scores. Not subject readiness. Not the Adventure Director.

Everything in the game should reinforce:
- The egg is alive.
- The child and egg are on a journey together.
- The egg grows because of the journey, not because of test scores.

The child should feel: _"My egg and my friends are going on adventures."_

---

## Inspirations

| Game | What KidQuest borrows |
|---|---|
| **Tamagotchi** | Egg Home — feed, play, watch, care. The egg feels alive. |
| **Pokémon FireRed** | Screen-based world map, encounter system, egg → creature → battle progression |
| **Animal Crossing** | Exploration is reward by itself. No pressure. Discovery is joyful. |
| **Storybook** | Every region has a story. NPCs have personalities. The world has lore. |

These are emotional references, not mechanical blueprints.

---

## World Philosophy

### The world should feel safe, warm, magical, and exciting.

- **Safe**: No horror. No permanent loss. No punishment for failure. Failure is gentle and temporary.
- **Warm**: Every NPC is friendly. Every enemy is cute or funny. No truly evil characters.
- **Magical**: Impossible things exist here. Crystals glow. Clouds are walkable. Moons are close.
- **Exciting**: Every region has a secret. Every step might trigger something new. The child never knows what's coming.

### Adventure drives learning. Learning should not feel like school.

- Maps should feel like **places**, not levels.
- Creatures should feel like **friends**, not rewards.
- Learning content is embedded in battle moves — the child chooses their attack, not answers a question.
- Progress feels like **exploration and growth**, not a curriculum checklist.

### Day and night matter.

Some things only exist at night. Some NPCs sleep during the day. Seasonal events change what's available. The world feels like it exists whether or not the child is playing.

### No maps feel scary.

Every region, including the Volcano and the Ancient Ruins, should feel like an exciting adventure — not a frightening ordeal. The enemies are cute. The bosses are friendly. The music is warm. The darkness is magical, not threatening.

---

## High-Level Loop

```
Egg Home
  ↓ feed / play with / check on egg
Enter World
  ↓ walk through a region
  Random event triggers:
    → Enemy encounter  → Battle  → Reward
    → Treasure chest   → Item
    → NPC              → Dialogue + gift
    → Boss             → Hard battle + big reward
    → Secret           → Hidden area / surprise
  ↓
Return to Egg Home
  ↓ use rewards to care for egg
  ↓ egg grows → stages 1–9 → ready to hatch
  ↓ hatch → creature revealed
  ↓ new egg begins
(Loop forever — new regions unlock over time)
```

---

## World Progression — All 8 Regions

### Overview

```
Egg Home (base)
     ↓
[1] Green Meadow        ← Phase 1 World (Kindergarten)
     ↓
[2] Sunny Beach         ← Year 1 / Semester 2
     ↓
[3] Crystal Cave        ← Grade 1 / Semester 1
     ↓
[4] Cloud Kingdom       ← Grade 1 / Semester 2
     ↓
[5] Moon Forest         ← Grade 2 / Semester 1
     ↓
[6] Volcano Mountain    ← Grade 2 / Semester 2
     ↓
[7] Ancient Ruins       ← Grade 3
     ↓
[8] Dream Sky           ← Year-end mastery / gateway to Year 2
```

---

### Region 1 — Green Meadow 🌿
**[PHASE 1 WORLD — IMPLEMENT FIRST]**

| Field | Design |
|---|---|
| **Theme** | Bright, safe, first adventure. The child's home region. |
| **Visual style** | Soft greens, warm sunlight, rolling hills, wildflowers, golden-hour light. Pokémon Viridian Forest tone but cheerful and welcoming. |
| **Music mood** | Light xylophone, gentle flute, soft marimba. Happy, bouncy, no drums. |
| **Weather** | Clear (default). Occasional gentle breeze. Rare rainbow after soft rain. Fireflies at night. |
| **NPC types** | Grandma Turtle (advice + seed trades), Post Bird (delivers items between regions), Professor Clover Owl (teaches counting + patterns), Young Bunny Farmer (trades food), Traveling Bee Merchant (rare items) |
| **Enemy families** | Sleepy Bunny (yawns before attacking, slow), Bouncy Slime (small green, erratic), Grumpy Mole (pops from ground, surprised face), Tiny Fox (curious, sometimes runs away), Leaf Sprite (dances with leaves, gentle throws), Mushroom Imp (tiny mushroom hat, hides behind shield) |
| **Rare creatures** | Golden Clover Bunny, Rainbow Butterfly Faerie, Lucky Frog Prince |
| **Collectibles** | Clovers, Flower Seeds, Smooth Pebbles, Wild Berries, Old Letters, Butterfly Wings |
| **Treasure** | Food 🍗, Ribbon 🎀, Potion 💧, Rare Clover Token |
| **Learning focus** | Counting 1–10, Addition to 5, Shapes (circle/square/triangle/star), Patterns (AB/ABC), Simple Thai (กขค sounds), Simple English (ABC, colors) |
| **Boss** | **King Clover Bear** — Giant gentle bear wearing a crown of clovers, loves honey jars. Tests counting knowledge ("how many jars?"). Friendly, losing is a gift. Rewards: Clover Crown accessory + rare items. |
| **Unlock requirements** | Starting region — no requirements. |
| **Special mechanics** | Flower Picking (plant in Egg Home garden — future feature). Day/night firefly events. Rainy day spawns rare mushroom enemies. |

---

### Region 2 — Sunny Beach 🏖️

| Field | Design |
|---|---|
| **Theme** | Cheerful, warm, sandy. Discovery through digging and diving. |
| **Visual style** | Golden sand, bright blue water, palm trees, half-buried treasure, colorful beach umbrellas. High saturation, tropical. |
| **Music mood** | Steel drums, ukulele, gentle ocean ambient. Upbeat tropical. |
| **Weather** | Sunny (default). Passing clouds (create fish patterns in water). Rare storm (wave enemies appear). |
| **NPC types** | Fisherman Crab (teaches fishing, gives rod), Shell Collector Grandma (trades shells for items), Lifeguard Dog (warns of dangers, gives potions), Merchant Seal (rare beach items), Lighthouse Keeper Owl (mystery quests, sends signals) |
| **Enemy families** | Pinch Crab (sidewalk walk, snapping claws), Bubble Fish (jumps from water), Grumpy Starfish (rolls slowly), Sand Puff (hides in sand, pops up), Wave Ghost (transparent, rides waves), Coconut Roller (round, surprised eyes) |
| **Rare creatures** | Pearl Turtle, Sunset Crab King, Blue Dolphin Sprite |
| **Collectibles** | Shells, Pearls, Sand Dollars, Beach Glass, Coconuts, Treasure Maps |
| **Treasure** | Food 🍗, Star ⭐, Beach Gem, Rare Seashell |
| **Learning focus** | Addition 5–10, Subtraction to 5, Colors + mixing, Thai vowels (อ า เ โ), English CVC words (cat/dog/sit/run) |
| **Boss** | **Sleepy Whale** — Enormous but gentle blue whale sleeping on the shore. Snores create small waves. Must answer questions to gently wake it up and ask it to move. Win: whale smiles + offers deep-sea treasure. |
| **Unlock requirements** | Clear 3 Green Meadow battles + find 5 different Green Meadow collectibles. |
| **Special mechanics** | Tide system (high tide covers areas, low tide reveals hidden chests). EggFishing spots (trigger minigame). Hidden tidal pool area only accessible at low tide. |

---

### Region 3 — Crystal Cave 💎

| Field | Design |
|---|---|
| **Theme** | Mysterious, beautiful, geometric. Underground wonder. |
| **Visual style** | Dark cave walls lit by glowing crystals (purple/blue/teal). Reflective surfaces. Bioluminescent mushrooms. Hidden paths. Everything glows softly. |
| **Music mood** | Soft echo ambient, gentle chimes, mysterious piano. Slower, sense of wonder. |
| **Weather** | Crystal "rain" (ambient shimmer, no damage). Crystal storm event (enemies gain defense boost). Mushroom spore clouds (rare, obscures vision slightly). |
| **NPC types** | Miner Badger (digs tunnels, needs counting help), Crystal Scholar Mole (studies gems, teaches patterns), Echo Bat Elder (speaks in riddles, very wise), Glowworm Guide (lights dark paths, companion NPC), Gem Trader Raccoon (crystals → powerful items) |
| **Enemy families** | Gem Mite (hard shell, slow, high defense), Crystal Turtle (rolls into crystal ball form), Mushroom Trooper (mushroom hat, spore attacks), Echo Bat (comes in pairs, mirrors the other's moves), Rock Roller (round rock face, rolls toward you), Stone Lizard (camouflages on cave walls) |
| **Rare creatures** | Crystal Fox, Diamond Slime (prismatic rainbow), Cave Dragon Hatchling |
| **Collectibles** | Crystals (Red/Blue/Green/Purple), Glowing Mushrooms, Cave Pearls, Ancient Fossils, Echo Stones |
| **Treasure** | Potion 💧, Rare Crystal Shard, Gem Fragment, Ancient Map Piece |
| **Learning focus** | Numbers 10–20, Subtraction to 10, Growing patterns (2/4/6/8), Thai syllables (consonant + vowel combos), English sight words (the/a/is/are/it/in) |
| **Boss** | **Crystal Deer** — Elegant white deer with glowing crystal antlers. Tests pattern completion. Serene, beautiful, not threatening. Win: breaks off one crystal antler as a gift (rare accessory for egg). |
| **Unlock requirements** | Clear Sunny Beach boss + collect 10 different shell varieties. |
| **Special mechanics** | Crystal refraction puzzles (match colored crystals to open paths). Hidden rooms unlock when answer streaks activate stone mechanisms. Darkness zones require Glowworm companion. |

---

### Region 4 — Cloud Kingdom ☁️

| Field | Design |
|---|---|
| **Theme** | Magical, high altitude, impossibly fluffy. A whole civilization lives above the clouds. |
| **Visual style** | Cloud platforms as ground. Rainbow bridges. Floating islands. Purple-pink sky. Soft, round, puffy architecture. Everything feels light. |
| **Music mood** | Gentle bells, harp, wind chimes ensemble. Dreamy, floating, light. |
| **Weather** | Always cloudy (the world). Cloud rain (makes platforms bouncy). Rainbow events (special encounter chance). |
| **NPC types** | Cloud Sheep Farmer (very calm, sells soft items), Wind Fox Postman (delivers inter-region mail), Sky Captain Bird (patrol leader, gives quests), Cloud Baker Panda (makes cloud cakes, restores egg HP), Star Gazer Rabbit (constellation guide, teaches sky lore) |
| **Enemy families** | Cloud Puff (pillowy, harmless-looking, surprising bouncy attacks), Wind Imp (fast, hard to hit), Thunder Sheep (electric wool, shock on contact), Sky Jellyfish (floats, hypnotic), Rain Cloud (tantrum cloud, drizzle attacks), Fog Bunny (creates visibility fog) |
| **Rare creatures** | Rainbow Phoenix Jr, Cloud Dragon, Sky Cat (walks on clouds like ground) |
| **Collectibles** | Star Fragments, Cloud Wool, Rainbow Threads, Wind Chimes, Sky Flowers, Cloud Pearls |
| **Treasure** | Star ⭐, Cloud Wool (crafting), Rainbow Thread, Sky Pearl |
| **Learning focus** | Addition/Subtraction to 20, Multiplication intro (skip counting 2s and 5s), Thai common nouns, English sentences (I am / I have / I like) |
| **Boss** | **Cloud King** — Enormous fluffy cloud-shaped king sitting on a cloud throne, lightning bolt crown. Round, soft, absolutely not threatening. Loves riddles. Tests Thai and English word knowledge. Win: gives Cloud Crown + clears skies to reveal the next region. |
| **Unlock requirements** | Clear Crystal Cave boss + reach height 10 in EggTower minigame. |
| **Special mechanics** | Cloud platform puzzle (correct answers manifest cloud steps). Sky Draft (wind speeds up encounters). Cloud Napping (rest mechanic, future HP recovery). |

---

### Region 5 — Moon Forest 🌙

| Field | Design |
|---|---|
| **Theme** | Mysterious, gentle, magical night world. Ancient forest under permanent moonlight. |
| **Visual style** | Deep blue-purple sky, silver moonlight, glowing blue/purple mushrooms, firefly swarms, ancient trees with luminous bark. Magical, peaceful, NOT scary. |
| **Music mood** | Soft lullaby melody, gentle cello, forest ambient (crickets, soft owl hoots). Slow, peaceful, wonder-inducing. |
| **Weather** | Always night (moonlit). Moon rain (glowing healing drops). Moon eclipse (rare — stronger enemies, rarer loot). |
| **NPC types** | Moon Rabbit (legendary NPC, shares moon secrets), Firefly Guide (lights dark paths), Old Forest Bear (wisest NPC, knows all forest secrets), Night Market Fox (night-only rare item trades), Dream Weaver Spider (crafts thread of dreams, powerful material) |
| **Enemy families** | Moon Fox (silver fur, fast, graceful), Firefly Spirit (moves in light patterns), Sleepy Bear Cub (yawns constantly, very powerful if woken), Shadow Bunny (copies egg's moves), Night Moth (large wings, wind gusts), Glowing Mushroom Sprite (defensive, healing spores) |
| **Rare creatures** | Moonborn Cat, Silver Wolf Pup, Aurora Dragon |
| **Collectibles** | Moon Crystals, Dream Feathers, Forest Seeds, Moonlit Flowers, Star Moss, Ancient Bark |
| **Treasure** | Potion 💧, Moon Crystal, Dream Feather, Rare Night Bloom |
| **Learning focus** | Multiplication (2× / 5× / 10× tables), Thai sentences (simple 3-word stories), English reading (3-5 word sentences), Time concepts (day/night, morning/evening, seasons) |
| **Boss** | **Moon Rabbit** — Legendary white rabbit who lives on the moon. Long ears, mochi-pounding mallet. Speaks through stories and riddles. Tests Thai sentence reading. Win: shares moon secrets + rare Moon Crystal gift (egg gets moon glow aura temporarily). |
| **Unlock requirements** | Clear Cloud Kingdom boss + answer 5 consecutive Thai questions correctly OR play after 7pm real time. |
| **Special mechanics** | In-game moon cycle (affects NPC dialogue and enemy behavior). Night-only treasures (only appear during late real-time sessions). Dream paths (ethereal paths visible only under the full moon). |

---

### Region 6 — Volcano Mountain 🌋

| Field | Design |
|---|---|
| **Theme** | Hot, powerful, dramatic. The first region that feels genuinely challenging. Fire, earth, and ancient power. |
| **Visual style** | Dark volcanic rock. Rivers of gently glowing lava (warm orange-red). Steam vents. Heat haze. Dramatic red sky at sunset. Bright fire lilies grow in volcanic soil — a surprising burst of color. |
| **Music mood** | Taiko drums, brass instruments, intense but adventurous. Higher tempo, urgent, exciting. |
| **Weather** | Eruption events (falling ash, temporary debuff). Lava surge (opens new temporary paths). Clear air after eruption (reveals hidden areas briefly). |
| **NPC types** | Forge Master Armadillo (makes powerful items from volcanic materials), Rock Collector Lizard (obsessed with rare stones), Fire Sage Salamander (teaches fire safety + gives powerful tips), Volcano Watch Owl (monitors eruptions, gives early warnings), Heroic Mole Knight (brave but tiny, has side quests) |
| **Enemy families** | Lava Lizard (fast, fire breath, retreats to lava), Ember Puff (cute smoke puff, explodes dramatically on defeat), Rock Golem Jr (slow but very tough, needs strategy), Fire Slime (leaves burning trail), Magma Crab (rock-hard shell, fire core), Ash Bat (emerges from volcanic steam vents) |
| **Rare creatures** | Volcano Dragon (not the boss, a smaller relative), Magma Fox, Ember Phoenix |
| **Collectibles** | Volcanic Stones, Fire Opals, Lava Crystals, Fire Lilies, Dragon Scales (shed), Forge Coal |
| **Treasure** | Star ⭐, Fire Opal, Forge Coal, Volcano Dragon Scale |
| **Learning focus** | Multiplication tables (3× / 4× / 6×), Division introduction, Thai short stories (2-3 sentences), English comprehension (answer 1-2 questions about a short passage) |
| **Boss** | **Volcano Dragon** — Ancient dragon who has lived in the volcano for 1,000 years. Enormous, but old, a bit tired, warm grandpa energy. Tests multiplication and division. Win: Dragon teaches egg dragon magic (fire aura effect temporarily applied). |
| **Unlock requirements** | Clear Moon Forest boss + have 3 different creature families in collection. |
| **Special mechanics** | Forge system (collect volcanic materials → craft items with Forge Master). Lava crossing (correct answers create stepping stones). Heat zones (prolonged stay costs HP — creates urgency). |

---

### Region 7 — Ancient Ruins 🏛️

| Field | Design |
|---|---|
| **Theme** | Archaeological, mysterious, historical. The oldest place in the KidQuest world. |
| **Visual style** | Crumbling stone temples covered in vines and moss. Ancient murals still glowing with magic. Sacred pools reflecting starlight. Floating stone platforms (old magic still active). Mix of gold and grey tones. Grand but not menacing. |
| **Music mood** | Ancient flute, string ensemble, soft ambient chanting. Contemplative, grand. |
| **Weather** | Magic storms (wind with glowing particles). Misty mornings. Rare golden rain (healing event). |
| **NPC types** | Historian Elephant (has read every ancient text, loves sharing), Ruin Guide Cat (knows every secret path), Ancient Spirit Turtle (ghost NPC, remembers old history), Treasure Hunter Raccoon (competitive but friendly, gives hints), Magic Librarian Panda (guards the ancient library, gives reading quests) |
| **Enemy families** | Stone Sprite (animated ancient statue), Dusty Golem (made of ancient dust, powerful sneezes), Ruin Cat (agile, uses ancient traps), Magic Torch (fire + inscription attacks), Vine Serpent (overgrown plant snake, very old), Ancient Gear Construct (mechanical puzzle enemy) |
| **Rare creatures** | Ancient Golem Hatchling, Golden Phoenix, Ruin Fox (wears ancient jewelry) |
| **Collectibles** | Ancient Coins, Stone Tablets, Jade Pieces, Ancient Blueprints, Magic Torch Pieces, Ruin Flowers |
| **Treasure** | Ribbon 🎀, Ancient Coin, Jade Fragment, Ancient Blueprint |
| **Learning focus** | Mixed operations (all four), Thai creative composition (3-4 sentence story), English story reading, Introduction to fractions (half, quarter, whole) |
| **Boss** | **Ancient Turtle** — Enormous stone turtle sleeping for centuries. Speaks slowly and wisely, as if choosing every word with care. Tests all four math operations in order. Win: turtle awakens fully, opens the ancient treasury gate, gives legendary ancient egg as reward. |
| **Unlock requirements** | Clear Volcano Mountain boss + answer 20 consecutive correct questions across any subject. |
| **Special mechanics** | Puzzle rooms (ancient mechanisms require correct answers to activate). Map discovery (ruins slowly reveal new sections as knowledge grows). Ancient text (rare items have Thai text clues that lead to hidden treasures). |

---

### Region 8 — Dream Sky ✨

| Field | Design |
|---|---|
| **Theme** | The ultimate destination. Surreal, beautiful, impossible. The edge of the world and the beginning of everything. |
| **Visual style** | Infinite starfield sky. Galaxies visible. Floating dream islands with impossible physics — waterfalls flow upward, trees are made of light, colors shift continuously. Breathtaking. Everything glows warmly. |
| **Music mood** | Full orchestral, majestic, wonder-filled. Emotional. Builds to something grand. |
| **Weather** | Dream phenomena — star showers, color waves, dream clouds that briefly show memories from earlier regions. |
| **NPC types** | Dream Weaver (creates the dreams themselves, very powerful and kind), Star Keeper (maintains the stars, ancient), Memory Keeper (holds records of every adventure), Final Sage (year-end NPC who reflects on the whole journey), Dream Egg (mysterious egg NPC that knows everything about your egg's future) |
| **Enemy families** | Dream Puff (translucent, beautiful, surprisingly powerful), Star Whale Jr (gentle giant, does not want to fight), Rainbow Bird (reflects the color of the last attack), Void Kitten (tiny shadow cat, very hard to hit), Memory Ghost (looks like old enemies from earlier regions), Crystal Phoenix |
| **Rare creatures** | Dream Dragon (ultimate creature), Void Fox, Galaxy Turtle |
| **Collectibles** | Star Shards, Dream Crystals, Galaxy Dust, Cosmic Flowers, Memory Fragments, Wish Stones |
| **Treasure** | All item types, Legendary Egg Fragment, Wish Stone, Dream Crystal |
| **Learning focus** | Year-end mastery consolidation — all subjects mixed, creative problem-solving, storytelling with Thai + English, multi-step math |
| **Boss** | **Dream Lion (Sun Lion)** — The guardian of all adventure. White-gold lion made of starlight. Majestic, warm, powerful. Tests wisdom from all subjects in a final challenge. Win: Dream Lion bestows a Legendary Egg — the starting egg for Year 2. |
| **Unlock requirements** | Clear Ancient Ruins boss + complete Year 1 learning progression. |
| **Special mechanics** | Memory Mirror (relive key moments from earlier regions). Wish system (Dream Sky NPCs grant wishes based on collection completion). Year-End Ceremony (special cutscene + Year 1 summary + Year 2 preview). |

---

## Enemy Design Guide

### Philosophy
Enemies should be: **cute, funny, warm.** Not scary. Not violent. Not dark.

A 4-year-old should see an enemy and think: "That's silly!" or "That's cute!" — not "That's scary."

### Enemy archetypes

| Type | Feel | Examples |
|---|---|---|
| **Sleepy** | Yawns before attacking. Slow. Sympathetic. | Sleepy Bunny, Sleepy Bear Cub, Ancient Turtle |
| **Grumpy** | Frustrated face. Puffs cheeks. Stomps. | Grumpy Mole, Grumpy Starfish, Grumpy Cloud |
| **Bouncy** | Erratic movement. Surprising. Funny. | Bouncy Slime, Coconut Roller, Rock Roller |
| **Sneaky** | Hides and pops out. Surprise attacks. | Tiny Fox, Sand Puff, Stone Lizard |
| **Puffed up** | Round, inflated, dramatic. | Cloud Puff, Ember Puff, Mushroom Imp |
| **Protective** | Has a hard shell or shield. Defensive. | Gem Mite, Crystal Turtle, Magma Crab |
| **Magical** | Made of light or energy. | Firefly Spirit, Magic Torch, Dream Puff |

### What enemies must never be
- Weapons with intent to harm
- Humanoid enemies that look threatening to children
- Blood, injury, or pain references
- Jump scares
- Dark or disturbing designs

---

## NPC Design Guide

### Core NPC cast (cross-region)

| NPC | Personality | Location |
|---|---|---|
| **Grandma Turtle** | Warm, patient, always cooking something. Gives advice and sometimes seeds or old recipes. | Green Meadow |
| **Post Bird** | Cheerful, always busy, carries a big mail bag. Delivers items between regions. | Every region |
| **Cloud Sheep** | Extremely fluffy. Speaks very softly. Slightly forgetful. | Cloud Kingdom |
| **Professor Owl** | Knowledgeable, loves to explain things. A bit long-winded but always helpful. | Green Meadow / Ruins |
| **Fox Merchant** | Friendly but slightly mysterious. Loves rare items. Best deals in the world. | Night Market / Moon Forest |
| **Traveling Bear** | Happy wanderer. Has been everywhere. Full of stories. Meets the child in every region. | Wandering (all regions) |

### NPC interaction rules

- All NPCs give, never take. No punishment or negative consequence from NPCs.
- NPCs speak in simple Thai (child-friendly vocabulary).
- NPCs can trigger short mini-quests that reward exploration.
- NPCs comment on the child's egg + creatures (builds attachment).
- Boss NPCs are friendly. They are guardians, not villains.

---

## Boss Design Guide

### Philosophy
Bosses should feel like: **a friendly challenge from a powerful friend**.

Not evil. Not angry. Not a villain.

The emotion should be: "This is hard, but I know they want me to succeed."

### Boss roster

| Boss | Region | Personality | Win condition |
|---|---|---|---|
| **King Clover Bear** | Green Meadow | Gentle giant, loves honey, very proud of his flowers | Counting + addition challenge |
| **Sleepy Whale** | Sunny Beach | Ancient, enormous, very tired, just wants to nap | Gently wake it up with correct answers |
| **Crystal Deer** | Crystal Cave | Elegant, serene, tests worthy adventurers | Pattern completion sequence |
| **Cloud King** | Cloud Kingdom | Fluffy, round, loves riddles, laughs easily | Thai + English word knowledge |
| **Moon Rabbit** | Moon Forest | Legendary, playful, shares moon secrets | Thai sentence reading |
| **Volcano Dragon** | Volcano Mountain | Old, tired, grandpa energy, has seen everything | Multiplication + division challenge |
| **Ancient Turtle** | Ancient Ruins | Incredibly wise, speaks slowly, 1000 years old | All four operations in sequence |
| **Dream Lion** | Dream Sky | Majestic, warm, the guardian of all adventure | Year-end mastery challenge (all subjects) |

---

## Collectibles System

Collectibles are found during exploration. They are not spent — they are kept.

**Why collectibles?**
- Animals Crossing feeling: exploration IS the reward.
- Children build attachment to things they found themselves.
- Collectibles drive replay: "I want to find all the crystals."
- Collectibles trigger NPC dialogue and trades.

### Collectible categories

| Category | Examples | Source regions |
|---|---|---|
| **Nature** | Leaves, Seeds, Wild Berries, Forest Seeds, Star Moss | Green Meadow, Moon Forest |
| **Water** | Shells, Pearls, Sand Dollars, Beach Glass | Sunny Beach |
| **Minerals** | Crystals, Volcanic Stones, Fire Opals, Ancient Coins | Crystal Cave, Volcano, Ruins |
| **Magic** | Moon Crystals, Dream Feathers, Star Fragments, Wish Stones | Moon Forest, Cloud Kingdom, Dream Sky |
| **Ancient** | Stone Tablets, Jade Pieces, Fossils, Ancient Blueprints | Crystal Cave, Ruins |
| **Rare** | Dragon Scales, Golden Phoenix Feathers, Galaxy Dust | Boss rewards, rare encounters |

---

## Future Systems

These systems are envisioned for Year 2+ implementation. They are designed here so the architecture can accommodate them.

### Walking Exploration
- Screen-based map navigation (Pokémon FireRed model).
- Egg avatar walks the map. Steps trigger encounter checks.
- Mobile: D-pad arrows or tap-to-navigate.

### Random Encounters
- Each step: probability check (varies by region difficulty).
- Types: enemy battle, treasure chest, NPC event, rare egg spot.

### Treasure Chests
- Placed at fixed map positions. One-time per session or permanent.
- Drop items, collectibles, or rare eggs.
- Some chests locked — require answer streak to open.

### Fishing
- Fishing spots trigger EggFishing minigame (already built).
- Catching fish = items + rare collectibles.
- Specific fish only available in specific regions.

### Cooking
- Combine food items + collectibles → special meals.
- Meals give temporary buffs to egg (stronger attacks, faster XP gain).
- Grandma Turtle teaches recipes.

### Gardening
- Plant flower seeds found in exploration → grow over real time.
- Harvested flowers become items.
- Garden lives in Egg Home (background scene).

### NPC Friendships
- NPCs have friendship levels (hidden, like Animal Crossing).
- More visits → more dialogue, better trades, surprise gifts.
- NPCs remember the child's creatures and comment on them.

### Seasonal Events
- Real-world calendar drives seasonal content.
- Thai New Year (April): cherry blossoms in Green Meadow, special festival.
- Songkran: water splash event in Sunny Beach.
- Loy Krathong: moon lanterns in Moon Forest.
- Christmas: snow in Cloud Kingdom.

### Weather System
- Real-time-inspired weather in each region.
- Weather affects enemies, encounter rates, and available collectibles.
- Some rare items only appear during specific weather.

### Mini Festivals
- Monthly in-game festival events.
- NPCs gather, special items available, festival music.
- Child-friendly mini-games during festivals.

### Day and Night
- Real-clock-based day/night already partially implemented in Egg Home.
- In the World: night version of regions has different enemies, NPCs, and secrets.
- Some regions transform dramatically at night (Moon Forest is always night, Green Meadow at night has fireflies).

### Photo Mode
- Child can take a "photo" of their egg or creature.
- Photo is displayed in collection or can be shared with parent.
- Special photo spots in each region (scenic viewpoints).

### Home Decoration
- Items found in exploration can decorate the Egg Home background.
- Found a flower → it appears in the grass behind the egg.
- Found a wind chime → it hangs in the background.
- Makes the home feel personal and built-up over time.

---

## Egg Home Design

The main screen. The emotional anchor.

### What the child does here
| Action | Description |
|---|---|
| Feed egg | Use food items. Egg reacts with happy animation. |
| Play with egg | Tap — egg bounces, spins, makes sounds. |
| Give items | Star, ribbon, potion. Each has unique reaction. |
| View collection | All hatched creatures. Tap to inspect. |
| See creature walking | One hatched creature walks/patrols the home area. |
| Enter the World | The main call to action. Big, clear. |

### What is NOT here
- No subject selector
- No "Continue Adventure" recommendation card
- No level stats, readiness scores, or learning metrics
- No pressure to go anywhere specific

---

## MVP Scope (Year 1)

Keep scope minimal. One working loop, done well.

**Year 1 world MVP:**
1. Egg Home (already implemented — see CURRENT_STATE.md)
2. Green Meadow region — 1 region, 3×3 screen grid
3. Random encounters — enemy battles (uses existing MoveSelectBattleMode)
4. Treasure chests — drop existing items
5. Hatch loop — egg grows from exploration XP, hatches, creature revealed

**Green Meadow boss (King Clover Bear)** is the Year 1 final challenge.

**Everything else is expansion:**
- Regions 2–8 — add one at a time
- NPC friendship system — after Green Meadow stable
- Boss system — after Green Meadow battle confirmed working
- Seasonal events — after all Year 1 systems stable
- Home decoration, cooking, gardening — Year 2+

---

## Open Questions (for GPT before implementation)

### Priority (must answer before world map code)

1. **World entry UX**: What is the MVP of world entry? A "choose region" screen, or a navigable map screen? For Year 1 with one region, does a world map screen even exist yet?

2. **Encounter trigger on mobile**: How does a battle start? Step-based probability (requires movement mechanic), or explicit "explore" button that triggers an encounter randomly?

3. **Subject assignment in encounters**: Which subject's questions appear in a battle triggered by Green Meadow exploration? Random? Based on readiness? Based on what was played recently?

4. **XP source**: In the world model, does XP still come only from correct answers? Or also from exploration (finding treasure, reaching new areas)?

5. **Session length**: How long should one exploration session be? Is there a natural end point, or open-ended?

### Secondary (design clarification)

6. **Minigame integration**: EggRun/EggCatch/EggFishing/EggTower/EggMemory are built. In Green Meadow, do they become encounter types ("you found a fishing spot!") or stay separate?

7. **Creature companion in Home**: After hatching, which creature shows — always the latest, or player's choice? Is it the procedural canvas creature or the emoji?

8. **Boss battle consequences**: In world model, should losing a boss fight have a consequence beyond "try again"? Or still no consequence?

9. **Egg naming**: Should Chopin name each new egg at creation? Increases attachment but adds a UI step.

10. **Background adaptation**: Should the Egg Home background scene (now implemented) change based on the last region visited? (Green Meadow tones when returning from meadow, volcanic tones after volcano, etc.)

---

## Non-Goals (Year 1 World)

- No multiplayer
- No PvP
- No real-time collaborative exploration
- No procedurally generated maps (hand-authored regions only)
- No physics-based movement
- No paid DLC regions
- No in-app purchases for map content (all Year 1 content is free)
- No horror-adjacent design in any region
- No enemy that could frighten a 4-year-old

---

## Relationship to Other Documents

| Document | How it relates |
|---|---|
| `VISION.md` | World must not violate the Golden Rule. Green Meadow = Kindergarten only. |
| `battle-feel-philosophy.md` | Battle inside the world uses the same feel grammar. No change to battle UX. |
| `egg-companion-adventure.md` | Egg companion reactions carry forward exactly into the world model. |
| `gameplay-loop.md` | This World Bible supersedes the Home 2.0 philosophy. |
| `play-observation-system.md` | Parent Report unchanged. sessionLog still works. Subject Readiness still computed. |
| `egg-home.md` | Egg Home detail spec — sub-document of this World Bible. |
