# Green Meadow — Detailed Design
_Created: 2026-06-10. First playable world of KidQuest._
_Status: Design phase. Must be reviewed by GPT before any code begins._
_Parent document: `kidquest-world.md` — World Bible._

---

## Purpose of This Document

This document takes the high-level Green Meadow entry from the World Bible and expands it into a complete, implementable design.

**Every screen is hand-authored.** Every NPC has dialogue style, gifts, and personality. Every enemy has movement, animations, and behavior. Every treasure has a fixed location. Every minigame has a natural in-world entry point.

After reading this document, a developer should be able to build Green Meadow without asking design questions.

---

## Emotional Goal

**The child should feel: "We went on an adventure."**

Not: "I completed a level."
Not: "I got a high score."
Not: "I answered questions correctly."

The session ends with the child wanting to come back — not because of a streak, not because of a daily challenge, but because **something interesting is waiting on the other side of the river** and they haven't been there yet.

---

## Session Target

| Metric | Target |
|---|---|
| Session length | 10–15 minutes |
| Number of battles | 3–5 per session |
| Screens visited | 3–5 of the 9 |
| Natural end trigger | After boss win OR after returning to Egg Home with items |
| Age target | 4–7 years old |

---

## Map Overview

Green Meadow is a 3×3 grid of screens.

```
┌─────────────────┬─────────────────┬─────────────────┐
│  [TL]           │  [TM]           │  [TR]           │
│  Flower Field   │  Grandma        │  Forest         │
│                 │  Turtle's House │  Entrance       │
├─────────────────┼─────────────────┼─────────────────┤
│  [ML]           │  [MC]           │  [MR]           │
│  River          │  Town           │  Clover         │
│  Crossing       │  Square         │  Hill           │
├─────────────────┼─────────────────┼─────────────────┤
│  [BL]           │  [BM]           │  [BR]           │
│  Pond &         │  Starting Path  │  King Clover    │
│  Willow Tree    │  ← ENTER HERE   │  Bear Meadow    │
└─────────────────┴─────────────────┴─────────────────┘
```

### Navigation Rules

- Adjacent screens connect (up/down/left/right only — no diagonal).
- Entering from Egg Home: always lands on **Starting Path (BM)**.
- Exiting to Egg Home: available from any screen via the home button, or naturally from Starting Path (BM) when walking south.
- Forest Entrance (TR): eastern edge is **locked** in Year 1. Shows a sign: "ป่าใหญ่ยังไม่พร้อมเปิด... แต่จะเปิดเร็ว ๆ นี้!" (The great forest isn't ready yet... but opening soon!)
- King Clover Bear Meadow (BR): accessible from BM or MR. No lock — boss is always available.

### Screen connection map

```
TL ↔ TM ↔ TR
↕       ↕       ↕
ML ↔ MC ↔ MR
↕       ↕       ↕
BL ↔ BM ↔ BR
```

---

## Encounter System

### Visible enemies — no invisible encounters

All enemies are **visible on screen before battle begins.**

Walking into an enemy sprite starts the battle. There is no invisible random encounter trigger.

**Why:** A 5-year-old must be able to see what they're walking toward. Surprise invisible encounters create frustration, not excitement. Visible enemies create anticipation.

### Enemy placement per screen

- Enemies roam within their screen boundaries.
- They follow a simple behavior loop (see Enemy Roster section).
- Child can observe, approach cautiously, or engage.
- Sleeping enemies (Sleepy Bunny) must be physically bumped twice before battle triggers — the first bump wakes them, second engages.

### Battle exit

After every battle, child returns to the same screen, same position. The defeated enemy respawns after moving to another screen and returning (or after a short timer).

---

## Screen-by-Screen Design

---

### BM — Starting Path
_The entrance. Where every adventure begins._

**Theme:** Wide, sunny path lined with wildflowers. The familiar entry point. Comfortable and safe.

**Visual mood:**
- Day: Warm golden light. Grassy path leading north. Old oak tree on the left. Welcoming.
- Night: Path lit by glowing fireflies. Stars visible. The oak tree has a soft warm glow in its trunk hollow.

**NPCs present:**
- **Professor Clover Owl** — sits on a branch of the oak tree. Gives tutorial hints on first visit. Always available for "how does this work?" dialogue.
- **Post Bird** — small mailbox by the path entrance. Check mailbox to see messages from Grandma Turtle or collect items sent from Egg Home.

**Enemies:**
- 1 × Sleepy Bunny — sitting under the oak tree, half-asleep. Very slow movement. First enemy the child will ever see.
- No other enemies on this screen — intentionally gentle.

**Treasure spots:**
- Fixed: Old wooden chest behind the oak tree. Contains: 1× Smooth Pebble + 1× Old Letter. Opens once per session.
- Hidden clover: In the grass to the right of the path (subtle shimmer).

**Secrets:**
- The hollow in the oak tree: if tapped, Post Bird appears from inside and hands over a mystery letter (triggers letter-reading tutorial).
- Fireflies at night: walking through the firefly cluster causes them to swirl around the egg sprite briefly.

**Weather effects:**
- Gentle breeze: long grass sways, flower petals drift.
- Rare soft rain: puddles form on the path. Splashing through them plays a soft plop sound.

**Day/night differences:**
- Day: Professor Owl visible and active. Bright open feeling.
- Night: Owl is asleep on his branch. Post Bird has a small lantern. Fireflies everywhere. Slightly mysterious but still safe.

**Music variation:**
- Day: Main Green Meadow theme. Bright xylophone + flute.
- Night: Same melody, slower. Soft bells replace xylophone.

**Special interactions:**
- Tapping Professor Owl: "สวัสดี! พร้อมออกผจญภัยไหม?" (Hello! Ready for an adventure?) → Tutorial or tips.
- Checking mailbox: Random kind message from Grandma Turtle ("คุณยายรอดูไข่ของเธออยู่นะ!").

**Connections:**
- North → Town Square (MC)
- East → King Clover Bear Meadow (BR)
- West → Pond & Willow (BL)
- South → Exit to Egg Home

---

### MC — Town Square
_The hub. The busiest place in Green Meadow._

**Theme:** A small, cheerful village square. Stalls, a fountain, a notice board. Where everyone gathers.

**Visual mood:**
- Day: Market stalls with colorful awnings. Round stone fountain in center. Warm, busy, lively.
- Night: Lanterns on every stall. Fountain glows softly. Quieter — most vendors have gone home. Night Merchant appears.

**NPCs present:**
- **Young Bunny Farmer** — sells food items in exchange for Clovers. Offers a "Running Race" challenge (EggRun entry).
- **Traveling Bee Merchant** — rotates daily. Sells rare items for 5× Clovers. Not always here.
- **Night: Fox Merchant** (special) — appears after 7pm only. Sells moon-themed items not available by day.

**Enemies:**
- 2 × Bouncy Slime — bounce around the square, occasionally bump into the fountain.
- 1 × Mushroom Imp — hiding behind the stall at the left edge of the screen.

**Treasure spots:**
- Fixed: Notice board — tapping reveals a hint: "ข่าว: มีสมบัติซ่อนอยู่ในนาดอกไม้ทางซ้าย" (Rumor: Treasure hidden in the flower field to the left). Also drops 1× Clover.
- Random sparkle: Appears near fountain 30% of sessions. Contains 1× Wild Berry or 1× Pebble.

**Secrets:**
- Behind the left market stall: a small gap leads to a tiny hidden area with a sleeping cat (decorative NPC, not interactive — but children will notice and try to tap it). Tapping the cat causes it to stretch and yawn.
- The fountain: tapping the fountain coin in the center plays a soft jingle and produces a small sparkle. No item reward — just delight.

**Weather effects:**
- Rain: Market stalls put up umbrellas. Vendors comment on weather.
- Sunny: Sun shines directly into fountain, creating rainbow refraction.

**Day/night differences:**
- Day: Young Bunny Farmer + Traveling Bee Merchant both active. Stalls open.
- Night: Stalls closed with "ปิดแล้ว" signs. Fox Merchant appears near fountain with lantern. Slimes glow faintly.

**Music variation:**
- Day: Upbeat town theme. Adds light percussion to main melody.
- Night: Quieter. Softer arrangement, fewer instruments.

**Special interactions:**
- Young Bunny Farmer: "แลกได้เลย! 3 ใบโคลเวอร์ = 1 อาหาร" → Trade interface (future feature, MVP just shows items available).
- EggRun entry: Young Bunny says "แข่งวิ่งกันไหม?" → Tap YES → EggRun launches with "Race the Bunny" theme.

**Connections:**
- North → Grandma Turtle's House (TM)
- East → Clover Hill (MR)
- West → River Crossing (ML)
- South → Starting Path (BM)

---

### TM — Grandma Turtle's House
_Warmth and safety. The heart of the village._

**Theme:** A cozy cottage with a large garden. Smells like fresh bread. The safest place in Green Meadow.

**Visual mood:**
- Day: Warm stone cottage. Smoke from chimney. Vegetable garden to the left. Flower beds everywhere. Warm amber light from windows.
- Night: Window glows golden. Grandma visible inside (silhouette). Garden has bioluminescent flowers.

**NPCs present:**
- **Grandma Turtle** — always home. Sits in a garden chair during the day. At the door at night. Never leaves.

**Enemies:**
- 1 × Leaf Sprite — dances gently in the garden. Not threatening. Almost a friendly figure.
- No other enemies — this screen is the safest in the world.

**Treasure spots:**
- Fixed: Garden vegetable patch → 2× Wild Berry (refills every real-world day).
- Hidden: Flower pot behind the house → Recipe Card (future cooking item). Does not refill.

**Secrets:**
- EggMemory entry: Grandma says "ช่วยหาดอกไม้สีแดงในกระถางให้หน่อยได้ไหม? คุณยายลืมว่าอยู่กระถางไหน..." → tapping YES launches EggMemory with flower-pot-matching theme. Reward: 1× Recipe Card + 1× Wild Berry.
- Hidden garden path: A gap in the hedge at the back of the garden leads to a tiny clearing. A rare rainbow flower grows here (1 per save file — permanent collectible once found).

**Weather effects:**
- Rain: Grandma invites player inside (screen transitions to cottage interior — simple background with fireplace, immediate warmth).
- Sunny: Grandma waters her plants. Comment: "อากาศดีจัง! ดอกไม้ชอบแดดนะ!"

**Day/night differences:**
- Day: Grandma in garden. Active and chatty.
- Night: Light in window. Grandma at door with lantern. "กลับบ้านเร็ว ๆ นะ เดี๋ยวค่ำ!"

**Music variation:**
- Day: Gentle, warm version of main theme. Adds soft acoustic guitar.
- Night: Lullaby-like version. Very soft, slightly slower.

**Special interactions:**
- Grandma Turtle first visit: Gives 1× Food item as a welcome gift. "เอาอาหารไปฝากไข่ด้วยนะ!"
- Grandma after boss win: "เก่งมากเลย! คุณยายภูมิใจมากเลยนะ!" + gives Flower Seed.
- Grandma comments on egg stage: Changes dialogue based on egg stage 1–9.

**Connections:**
- North → (map edge — northern border of Green Meadow. A sign: "ทุ่งหญ้าลึกกว่านี้ยังไม่ปลอดภัยนะ!")
- East → Forest Entrance (TR)
- West → Flower Field (TL)
- South → Town Square (MC)

---

### TL — Flower Field
_The most peaceful place in Green Meadow. Butterflies everywhere._

**Theme:** A wide open field of wildflowers. Tall grass, colorful blooms, drifting butterfly wings.

**Visual mood:**
- Day: Maximum color saturation. Every flower a different color. Butterflies visible as gentle floating sprites. Golden light.
- Night: Flowers glow softly. Fireflies mix with the flower glow. Deep blue-violet sky. Magical.

**NPCs present:**
- No resident NPC. Post Bird occasionally stops here between deliveries.

**Enemies:**
- 2 × Leaf Sprite — dancing slowly through the flower rows.
- 1 × Tiny Fox — hiding in tall grass, peeking out. Runs away 25% of the time instead of battling.

**Treasure spots:**
- Fixed: Hidden clearing deep in the field (northeast corner) → 2× Flower Seeds + 1× Butterfly Wing.
- Post-rain secret: After a rain event, a rainbow arch forms in the northwest. Walking under it → rainbow-colored Clover Token (very rare).

**Secrets:**
- EggCatch entry: Large butterfly cluster visible in the upper half. Walking into it triggers: "🦋 จับผีเสื้อเล่นไหม?" → EggCatch launches with butterfly-catching theme. Reward: Butterfly Wing collectible.
- Night-only: In the southwest corner, a cluster of fireflies forms a heart shape. Tapping it triggers a short sparkle burst + soft chime. No item — just delight.

**Weather effects:**
- Gentle breeze: Flowers sway, petals drift left.
- Rain: All butterflies disappear (shelter). Flowers shine brighter after rain. Rainbow event triggers.
- Sunny: Butterflies more active, more visible.

**Day/night differences:**
- Day: Bright colors, butterflies active.
- Night: Bioluminescent flowers, fireflies. Tiny Fox is asleep (not encountered). More peaceful.

**Music variation:**
- Day: Lightest, most cheerful version of main theme.
- Night: Slower, dreamy version with soft chime melody.

**Special interactions:**
- First visit: Petal burst visual when entering. No dialogue — just beauty.
- Catching a Tiny Fox instead of battling: Fox has 25% flee chance. If it flees, it drops a Clover behind it.

**Connections:**
- North → (map edge)
- East → Grandma Turtle's House (TM)
- West → (map edge)
- South → River Crossing (ML)

---

### TR — Forest Entrance
_The edge of the known world. Exciting but not yet accessible._

**Theme:** Where the meadow meets the ancient forest. Dappled light. Old roots. The sense that something much bigger is beyond.

**Visual mood:**
- Day: Dappled sunlight through old trees. Stone path disappears into forest shadow. Mysterious but beautiful.
- Night: Dark. Entrance is visually blocked. Glowing mushrooms near the entry. A "CLOSED" lantern hangs on the gate.

**NPCs present:**
- No resident NPC.
- Post Bird rests on a signpost here once per session.

**Enemies:**
- 1 × Grumpy Mole — pops from ground, looks annoyed.
- 1 × Mushroom Imp — hiding near the mushroom cluster.

**Treasure spots:**
- Fixed: Hollow log at the base of the oldest tree → 1× Ancient Fossil (rare collectible, permanent).
- Hidden: Behind the Forest Gate sign → Old Letter fragment (lore collectible — part of a story told across all 9 screens).

**Secrets:**
- Forest Gate (eastern edge): "ป่าใหญ่ยังไม่พร้อมเปิด..." sign. Behind the gate: a brief glimmer hint of Crystal Cave's crystals visible. Not accessible. Preview only.
- Old tree tap: Tapping the tallest tree causes leaves to rain down. Leaf Sprite appears briefly from the canopy, waves, disappears. No battle.
- Night: Gate is visually locked with vines. Owl NPC (Professor Owl) visits at night and says "อย่าเข้าป่าตอนมืดนะ ซ่อนอะไรแปลก ๆ ไว้เยอะ..."

**Weather effects:**
- Rain: Forest sounds louder. Water drips dramatically from tree leaves. Mushroom Imp hides deeper.
- Sunny: Light beams visible through canopy.

**Day/night differences:**
- Day: Mysterious but accessible. Enemies active.
- Night: Gate locked visually. No enemies spawn — area too dark. Short dialogue from any NPC: "กลับไปก่อนนะ ค่ำแล้ว!"

**Music variation:**
- Day: Slightly deeper, more mysterious variant. Same key but adds low strings.
- Night: Forest ambient sounds only. Music fades here — intentional.

**Special interactions:**
- Forest Gate: "พร้อมสำรวจป่าใหญ่ในเร็ว ๆ นี้!" — future Crystal Cave unlock.

**Future hook:** This is the entrance to Crystal Cave (Region 3). In future updates, Forest Gate opens after Sunny Beach is cleared.

**Connections:**
- North → (map edge)
- East → (Forest Gate — locked)
- West → Grandma Turtle's House (TM)
- South → Clover Hill (MR)

---

### ML — River Crossing
_Peaceful water. Stepping stones. The first puzzle-like interaction._

**Theme:** A clear stream crossing the meadow from north to south. Stone stepping stones. Dragonflies above the water.

**Visual mood:**
- Day: Crystal-clear blue-green water. Smooth round stepping stones. Dragonflies visible. Fish visible beneath water surface.
- Night: Moonlight on water. Fish glow faintly. Fireflies above the stream. More magical than eerie.

**NPCs present:**
- Post Bird — rests here between deliveries. Not always here (50% of sessions).

**Enemies:**
- 1 × Tiny Fox — sneaks along the riverbank.
- 1 × Grumpy Mole — pops from the muddy riverbank.

**Treasure spots:**
- Puzzle treasure: Correctly navigating the stepping stones (tap the stones in order — they're marked 1, 2, 3 subtly) reveals a shimmer under stone 3 → 1× Rare Smooth Pebble. Wrong order: stones wobble, child falls off, tries again. No penalty — unlimited tries.
- Fishing spot treasure: After EggFishing session here, chance of finding a River Pearl (water collectible).

**Secrets:**
- EggFishing entry (primary): Glowing fishing spot marked by sparkles in the water. Walking up to it: "🎣 ตกปลาไหม?" → EggFishing launches. Reward: River Pearl or Wild Berry.
- Frog NPC: A small frog sits on a lily pad in the middle of the river. Tapping it makes it jump and splash. No dialogue. Pure delight.
- Deep pool: Behind the tall reeds in the north corner, a deeper pool with a subtle glow. Future secret area (locked Year 1). Sign: "สระน้ำลึก — ต้องมีเพื่อน!"

**Weather effects:**
- Rain: River level rises slightly. Stepping stones are slippery (wobble more dramatically). Frog jumps in excitement.
- Sunny: More fish visible under water surface. Post Bird bathes at river edge.

**Day/night differences:**
- Day: Active. All NPCs present. Stepping stones puzzle available.
- Night: Moonlit. Glowing fish add extra magic. Post Bird not here. Tiny Fox not present — only Grumpy Mole (wants to sleep).

**Music variation:**
- Day: Water ambient sounds layer over main theme.
- Night: Gentle ripple sounds + soft night melody.

**Special interactions:**
- Stepping stones: Numbered 1–3 subtly. Wrong order = playful "splosh" + child ends up on shore. Correct order = sparkle + Rare Pebble.

**Connections:**
- North → Flower Field (TL)
- East → Town Square (MC)
- West → (map edge — stream source, locked)
- South → Pond & Willow (BL)

---

### MR — Clover Hill
_Rolling hills covered in clovers. King Bear's territory begins here._

**Theme:** The hill the King watches from his meadow. Clovers as far as the eye can see. The first hint of the boss.

**Visual mood:**
- Day: Rolling green hills thick with clovers. White clover flowers dotted everywhere. A distant view of the Boss Meadow visible at the eastern edge. Warm, expansive.
- Night: Clovers glow with soft luminescence. The boss meadow visible in the distance has an even warmer glow. Fireflies weave between the clover.

**NPCs present:**
- **Traveling Bee Merchant** — appears here (instead of Town Square) 40% of sessions. Sells rare items for Clovers.

**Enemies:**
- 2 × Sleepy Bunny — scattered across the hill, napping in the clover.
- 1 × Bouncy Slime — bounces down the hill slope, harder to predict due to hill physics.

**Treasure spots:**
- Fixed: Top of the hill (northeast corner) → Lucky Four-Leaf Clover. Very rare — appears once per save file. Finding it gives "Lucky Day" status: double item drops for the current session.
- Clover patches: Walking through dense clover patches drops 1–3 regular Clovers (currency).

**Secrets:**
- Four-leaf clover hunt: 3 rare four-leaf clovers hidden in different clover patches. Finding all 3 in one session triggers a sparkle shower + bonus rare collectible.
- Hill viewpoint: The northeast cliff edge — walking to the edge triggers a short zoom-out showing Green Meadow from above. Child can briefly see the full 3×3 map layout. Tapping anywhere returns to normal view.
- Night: Clovers glow in patterns that spell "クローバー" (Clover in Japanese — an easter egg for curious parents).

**Weather effects:**
- Breeze: Hill grass ripples in waves. Clovers sway rhythmically.
- Rain: Clover field shines after rain. All clovers produce sparkles briefly. Rare clover spawn rate slightly higher.

**Day/night differences:**
- Day: Bright and active. Good for clover hunting.
- Night: Luminous clovers give everything a fairy-tale quality. Fewer enemies (Bouncy Slime sleeping).

**Music variation:**
- Day: Open, wide version of theme. Slightly grander, befitting the King's territory.
- Night: Softer version. Wind ambient sounds stronger.

**Special interactions:**
- Viewing the Boss Meadow: Walking to eastern edge shows King Clover Bear visible in the distance. Traveling Bee Merchant says: "กษัตริย์แกรมมี่แบร์อยู่โน่นนะ! เก่งพอจะไปท้ายเขาแล้วหรือเปล่า?"

**Connections:**
- North → Forest Entrance (TR)
- East → King Clover Bear Meadow (BR)
- West → Town Square (MC)
- South → King Clover Bear Meadow (BR) ← (both east and south of MR connect to BR)

_Note: BR is accessible from both BM (south approach) and MR (west approach). Two paths to the boss._

---

### BL — Pond & Willow Tree
_The quietest place. Old willow, still water, rare secrets._

**Theme:** An ancient willow tree beside a deep pond. Dragonflies. A small island in the center of the pond accessible only by stepping stones.

**Visual mood:**
- Day: Trailing willow branches touch the water. Lily pads. Quiet. Feels ancient and peaceful.
- Night: Pond reflects stars perfectly. Willow branches glow faintly at the tips. A warm magic feeling.

**NPCs present:**
- No resident NPC. Occasional Post Bird.

**Enemies:**
- 1 × Leaf Sprite — drifting among the willow branches.
- 1 × Grumpy Mole — pops from the muddy pond bank.

**Treasure spots:**
- Island treasure: Three stepping stones lead to a tiny island in the center of the pond. On the island: a rare Egg Nest collectible (permanent — appears once per save file). The stepping stones require correct color-order navigation (not numbered — color hints instead, simpler than River Crossing).
- Willow hollow: The old willow tree has a hollow filled with soft moss. Hidden inside: 1× Dream Seed (future gardening item).

**Secrets:**
- EggFishing entry (secondary): Different spot from River Crossing. Sparkle at the pond surface near the island. EggFishing here has a rare "Deep Water" variant — higher chance of rare fish collectible.
- Night-only: The pond surface shows a perfect star reflection. Walking onto the lily pads makes them glow in sequence (musical — each lily pad plays a note). Playing the right sequence (do-re-mi) triggers a sparkle shower + rare Moon Crystal collectible.
- Turtle stone: A stone in the center of the pond looks exactly like a turtle shell. Cannot be interacted with in Year 1. Sign of future Ancient Turtle lore.

**Weather effects:**
- Rain: Pond water ripples dramatically. Willow branches sway and drip. Leaf Sprite takes shelter under willow.
- Sunny: Dragonflies appear above the pond. More fish visible.

**Day/night differences:**
- Day: Peaceful. Good for treasure hunting.
- Night: Star reflection + lily pad music puzzle only available at night.

**Music variation:**
- Day: Slowest, most ambient version. Water sounds dominate.
- Night: Near silence — only water sounds and soft melody. The most atmospheric screen in Green Meadow.

**Special interactions:**
- Willow tree tap: Leaves flutter down. Soft rustling sound. Leaf Sprite spins in the falling leaves.

**Connections:**
- North → River Crossing (ML)
- East → Starting Path (BM)
- West → (map edge — pond source)
- South → (map edge)

---

### BR — King Clover Bear Meadow
_The final area. The boss arena. Grand and warm._

**Theme:** An open circular meadow at the edge of the world. The King lives here. Ancient honey oaks ring the perimeter. Clover patches everywhere.

**Visual mood:**
- Day: Grand open sky. Wide perfect circle of short-cropped clover. Large ancient oak trees at the edges, creating a natural arena. A stone throne of piled rocks sits at the center, covered in clovers. King Clover Bear visible from the moment of entry.
- Night: The arena glows softly with luminescent clovers. The King sleeps on his throne. A special approach sound wakes him gently.

**NPCs present:**
- **King Clover Bear** — always present. Sitting on his throne eating honey from a jar. Reacts to approach.

**Enemies:**
- None. This screen has no random enemy encounters.
- The King is the only encounter.

**Treasure spots:**
- Post-boss only: After winning, three treasure spots activate around the arena (sparkle markers). Each contains: Clover Crown accessory + Rare Clover Token + 1× Food item.
- Loss consolation: One small treasure spot activates even after a loss. Contains: 1× Clover or 1× Smooth Pebble. Always.

**Secrets:**
- Hidden behind the throne: a old beehive (decorative). Tapping it produces a soft buzzing sound and 3 bees fly out and circle. No battle. No item. Just a reaction.
- North of the arena: A gap in the honey oak trees leads to a viewpoint of all of Green Meadow. Accessible after boss win only. Triggers a short pan-out cutscene.

**Weather effects:**
- The arena weather matches whatever Green Meadow's current weather is, but always feels calm — even during rain, the arena has only gentle drizzle and the King has an umbrella.

**Day/night differences:**
- Day: King fully active. Eating honey, looking out at his meadow.
- Night: King is asleep on throne. Walking up gently wakes him. He has a funny "startled from sleep" animation before regaining composure. Same battle available.

**Music variation:**
- Approach: Main theme fades, replaced by soft ambient for 3 seconds as the arena is entered.
- Boss active: Unique boss theme begins. Same key as main theme but grander — adds light brass and deeper bass.
- Post-win: Victory fanfare → then warm, triumphant version of main theme.

**Boss approach sequence:**
1. Child enters BR screen.
2. King Clover Bear visible on throne immediately (large sprite, friendly face).
3. Walking within 60% of the screen distance triggers boss dialogue.
4. King stands up slowly, stretches, smiles broadly.
5. Dialogue bubble: "สวัสดีนักผจญภัยน้อย! ข้าคือราชาแห่งทุ่งโคลเวอร์ พร้อมทดสอบไหม?" (Hello little adventurer! I am the Clover King. Ready for a challenge?)
6. Two choices: **"พร้อมแล้ว!"** (I'm ready!) → Boss battle. **"ยังไม่พร้อมครับ/ค่ะ"** (Not yet!) → King waves goodbye, child can return to explore more.

**Connections:**
- North → Clover Hill (MR)
- West → Starting Path (BM)
- Other edges → open meadow (map boundary — soft invisible barrier, no sign needed)

---

## Enemy Roster — Green Meadow

All enemies must be: **cute, funny, warm. Never scary.**

---

### Sleepy Bunny

**Appearance:**
Chubby round bunny. Soft pastel purple or cream color. Half-closed droopy eyes always. Tiny flower crown on head. Slight blush on cheeks. Always looks like it just woke up — or is about to fall back asleep.

**Size:** Small (roughly 60% of egg sprite height).

**Movement:**
Slow, drowsy waddle. Takes 3 steps forward, stops, yawns (animation), continues. Sometimes sits down mid-path for a short nap. Wanders in lazy circles. Never moves quickly.

**Personality:**
Zero aggression. The Sleepy Bunny doesn't want to fight — it just exists in a sleepy haze. When battle starts, it looks confused about what happened.

**Animations:**
- Idle: Slow sway. Eyelids droop further every few seconds.
- Yawn: Mouth opens wide, tiny arms stretch up, eyes scrunch shut for 1 second.
- Walking: Slow waddle with slight stumble every 4th step.
- Encounter startle: Eyes snap open (big and round briefly), jumps slightly, then immediately looks confused.
- During battle: Nods off between moves. Woken by each attack with startled blink.
- Defeat: Curls into a ball, eyes close, floating zzz's above. Stays sleeping.

**Battle trigger:**
Walk into it. First contact: bunny is startled awake (animation), not yet battle. Second contact (or after 2-second delay): battle starts.

**Retreat behavior:**
Does not retreat — too sleepy to run. If given a "retreat" mechanic in future, it would just sit down and go back to sleep.

**Battle notes:**
Slow attacker. Does minimal damage. Good first battle for very young children. Sometimes "misses" its own turn (falls asleep mid-battle — funny, not threatening).

---

### Bouncy Slime

**Appearance:**
Perfectly round, slightly squashed sphere. Bright lime green. Two large googly eyes on front. Tiny stub arms. Sometimes wears a tiny hat (flower pot, thimble, or leaf cap — randomized). Always looks surprised by its own bouncing.

**Size:** Medium-small.

**Movement:**
Rapid random bouncing. Moves in one direction 3-5 bounces, then suddenly changes direction. Bounces off screen edges. Leaves tiny splash rings where it lands. Very unpredictable — but never moves toward the player aggressively.

**Personality:**
Purely chaotic and playful. Has no idea where it's going. Not aggressive — it literally can't stop bouncing. When it runs into the player, it looks genuinely surprised.

**Animations:**
- Idle: Constant bouncing. Body squishes flat when landing, stretches tall when airborne.
- Direction change: Hits imaginary wall, squishes dramatically, bounces the other way.
- Encounter: Bounces directly into player, ricochets off, lands, looks dazed (spinning eyes), battle begins.
- During battle: Bounces in place between turns. Very fast attack animation.
- Defeat: Squishes completely flat, then very slowly inflates back up... and just sits there.

**Battle trigger:**
Runs into player during erratic bouncing path. Neither party was aiming for the other.

**Retreat behavior:**
N/A — cannot stop bouncing.

---

### Tiny Fox

**Appearance:**
Small, delicate orange fox with oversized ears relative to its body. Large curious eyes. Fluffy tail with white tip. Sometimes wears a tiny knitted scarf (yellow or blue, randomized). Alert and watchful expression.

**Size:** Small-medium.

**Movement:**
Sneaks along edges and behind cover. Frequently pauses to sniff the air, look around. Follows the player from a distance (10-20% of sessions) — watches curiously. Sometimes peeks from behind a bush or tree.

**Personality:**
Curious but shy. Explores and investigates. Not dangerous — just wants to know what's going on. More interested in the player's egg than in fighting.

**Animations:**
- Idle: Sniffs air. Looks left, right. Tucks tail close.
- Following: Moves in short dashes, freezes when player turns.
- Startle (battle trigger): Puffs up dramatically (tail doubles in size), eyes go wide, quickly returns to normal embarrassed fox expression.
- Retreat (25% chance): Turns and flees. Leaves a single Clover behind. Tail bobs as it runs.
- During battle: Tilts head curiously at each move. Scratches ear between turns.
- Defeat: Looks embarrassed. Sits down, wraps tail around itself, looks away.

**Battle trigger:**
Getting within 1.5 egg-lengths of the fox. 25% chance it flees instead — drops a Clover behind.

**Retreat behavior:**
Exits the current screen. Reappears next session on a random screen.

---

### Leaf Sprite

**Appearance:**
Tiny creature made entirely of leaves. Green-gold color that shifts slightly. Maple-seed wings on its back (spin to hover). Oversized kind eyes. Tiny leaf arms. A crown of smaller leaves on its head.

**Size:** Small (slightly taller and thinner than Sleepy Bunny).

**Movement:**
Floats gently, 1-2 feet off the ground. Drifts in soft lazy circles. Leaves a trail of slowly-falling leaf fragments. Spirals upward occasionally then drifts back down. Movement is smooth and flowing — no sudden stops.

**Personality:**
Peaceful, gentle, ethereal. The Leaf Sprite is not really thinking about anything. It's just dancing with the air. When it encounters the player, it's mildly surprised but not hostile — it just begins a "dance battle."

**Animations:**
- Idle: Constant slow spin. Leaves drift off and regrow.
- Wind reaction: Tilts strongly in wind direction during weather events.
- Encounter: Stops spinning, hovers in place, tilts head, extends a tiny leaf arm toward player (invitation to dance-battle).
- During battle: Spins faster when attacking. Swirls of leaves surround it.
- Defeat: All leaves scatter outward in a burst (dramatic!). 2 seconds pause. Then leaves slowly fly back together from different directions and reassemble. Leaf Sprite bows slightly and floats away.

**Battle trigger:**
Walking into its floating path. Contact feels gentle — Leaf Sprite bumps into player softly.

**Retreat behavior:**
Does not retreat. After defeat, reassembles and drifts to another screen.

---

### Grumpy Mole

**Appearance:**
Round, stubby, dark gray mole. Round black nose. Tiny round glasses (always slightly crooked). Deep frown that looks permanent but isn't angry — just grumpy. Tiny pickaxe in one hand. Dirt smudge on nose.

**Size:** Medium (slightly wider than tall).

**Movement:**
Pops up from the ground (dirt explosion animation). Looks around with grumpy expression. Adjusts glasses. Digs back down. Pops up somewhere else. Repeat. Pattern is semi-predictable: pops up every 3-4 seconds.

**Personality:**
Perpetually grumpy about being disturbed. Does not want to fight. Just wants to dig in peace. When forced into battle, sighs dramatically before each attack.

**Animations:**
- Emerge: Dirt clod shoots up, Mole appears mid-air looking surprised, lands with a thud.
- Grumpy idle: Adjusts glasses. Mutters to itself (speech bubble with "..!"). Foot-tap.
- Dig return: Waves dismissively, sinks straight into ground with a "pop."
- Battle trigger: Pops up right in front of player, startles, throws tiny dirt clod (purely theatrical, not damage), battle begins.
- During battle: Sighs dramatically before each attack. After being hit: adjusts glasses that went crooked.
- Defeat: Glasses fly off (arc through air, land nearby). Mole looks at them. Slowly puts them back on. Digs underground with exaggerated dignity.

**Battle trigger:**
Mole pops up within 1 egg-length of player position. Automatic startle trigger.

**Retreat behavior:**
Digs away immediately after battle ends — regardless of outcome.

---

### Mushroom Imp

**Appearance:**
Tiny round body, slightly transparent. Pale skin. A mushroom serves as its hat — bright red cap with white spots (if a Fly Agaric style), or brown and friendly-looking (randomized). The mushroom cap is too big for the body. Large innocent round eyes. Tiny stumpy arms.

**Size:** Very small — the smallest enemy in Green Meadow.

**Movement:**
Waddles. Very slow. Hides by standing perfectly still next to real mushrooms (can be mistaken for a mushroom from a distance). When approached, tries to hide behind other mushrooms. Slowly discovers this doesn't work.

**Personality:**
Timid and easily startled. The Mushroom Imp is hiding — it does not want to be found. When the battle starts, it looks embarrassed about being caught. More scared of the player than the player should be of it.

**Animations:**
- Idle camouflage: Stands still. Eyes slowly look left and right. Almost indistinguishable from nearby mushrooms.
- Discovered: Eyes go wide, mushroom hat vibrates. Jumps in place twice. Cannot escape in time.
- Hide attempt: Crouches behind a mushroom (but clearly visible). Slowly peeks out.
- During battle: Mushroom hat wobbles when nervous. Sometimes hides under the hat entirely (curls into a ball under the cap). Reappears when it's their turn.
- Defeat: Mushroom hat pops off. Rolls away. Mushroom Imp watches it go. Slowly pulls hat back on. Sighs. Sits down.

**Battle trigger:**
Approaching within 1 egg-length. Mushroom Imp fails to hide, startles, battle begins.

**Retreat behavior:**
After battle ends, hides behind the nearest large object and doesn't move for 10 seconds. Then resumes normal wandering.

---

## NPC Profiles — Green Meadow

---

### Professor Clover Owl

**Location:** Starting Path (BM) — on the old oak tree branch. Never moves.

**Appearance:**
Round, plump owl with large round glasses. Brown feathers with subtle clover-green accents. Tiny graduation cap always slightly tilted. Holds a scroll. Kind, attentive eyes.

**Dialogue style:**
Formal but warm. Slightly long-winded. Speaks in complete Thai sentences. Always excited to explain something. Ends with "เข้าใจไหม?" (Do you understand?).

**Role:**
Tutorial NPC. Explains how mechanics work. Available for help at any time.

**Dialogue examples:**
- First visit: "สวัสดี! ฉันคือศาสตราจารย์นกฮูก ผู้เชี่ยวชาญทุ่งโคลเวอร์! ให้ฉันแนะนำสถานที่นี้ให้ฟังนะ!"
- Battle tip: "เวลาเจอศัตรู แค่เดินชนมันก็เริ่มต่อสู้ได้เลยนะ! ไม่ต้องกลัว มันน่ารักมาก"
- Clover tip: "สามใบโคลเวอร์ = ซื้อของได้ที่จัตุรัส! ลองเก็บดูนะ!"
- Treasure tip: "ฉันได้ยินว่ามีสมบัติซ่อนอยู่ใต้กล่องไม้เก่าข้างต้นโอ๊ก..."
- Repeated visit: "กลับมาแล้ว! วันนี้สำรวจที่ไหนดี?"

**Gifts:**
- First visit: Nothing — tutorial only.
- After boss win: "เก่งมากเลย! เอากล้องส่องทางนี้ไปด้วย!" → Butterfly Wing (symbolic telescope gift).

**Mini quests:**
- "หาใบโคลเวอร์ให้ฉัน 3 ใบได้ไหม?" → Bring 3 Clovers → Reward: 1× Smooth Pebble.
- (Future) "ช่วยส่งจดหมายนี้ไปให้คุณยายเต่าหน่อยได้ไหม?" → Mail delivery quest.

**Special interactions:**
- Tap during battle transition: Brief tip bubble appears over owl at screen edge.
- Tap at night when owl is asleep: Owl stirs slightly, one eye opens, says "zz...ไปเล่นก็ได้...zz" before going back to sleep.

---

### Grandma Turtle

**Location:** Grandma Turtle's House (TM) — always home. Garden during the day. Doorway at night.

**Appearance:**
Elderly turtle with a warm, large shell decorated with tiny flower patterns. Soft wrinkled face. Reading glasses on a chain. Floral apron always on. Slightly hunched but energetic. Always smiling.

**Dialogue style:**
Warm and grandmotherly. Short sentences. Calls everyone "หลาน" (grandchild). Always mentions cooking or her garden. Never hurried.

**Role:**
Emotional warmth anchor. The most safe NPC. Source of gifts, seeds, and encouragement.

**Dialogue examples:**
- First visit: "โอ้ หลาน! มาหาคุณยายแล้ว! เอาอาหารนี้ไปฝากไข่ด้วยนะ!" → Gives 1× Food.
- After a battle: "คุณยายเห็นหลานสู้เก่งมากเลยนะ! ไม่กลัวเลยสักนิด!"
- Stage-aware: Stage 1-3: "ไข่ยังเล็กอยู่นะ ดูแลมันดี ๆ ด้วยนะหลาน!" Stage 7-9: "อีกนิดเดียวไข่จะฟักแล้ว! ตื่นเต้นจัง!"
- Rainy day: "วันนี้ฝนตก มาหลบฝนในบ้านก่อนนะ!"
- After boss win: "เก่งจริง ๆ นะหลาน! คุณยายภูมิใจมากเลย! เอาเมล็ดพันธุ์นี้ไปปลูกด้วยนะ!" → Gives Flower Seed.

**Gifts:**
- First visit: 1× Food item (always).
- Daily (real-world): 2× Wild Berry from garden.
- Special: After finding the rare rainbow flower → "หลานหาเจอแล้ว! นั่นคือดอกไม้แห่งโชค! คุณยายเก็บเอาไว้นะ!" (She remembers it).
- After EggMemory: 1× Recipe Card + 1× Wild Berry.

**Mini quests:**
- EggMemory: "ช่วยหาดอกไม้ในกระถางให้หน่อยนะ" → Flower pot memory game.
- (Future) Cooking quest chain: Grandma teaches recipes requiring collected ingredients.

**Special interactions:**
- Rain: Interior house version of screen. Fireplace. Grandma offers tea (hot chocolate animation). Egg gains warmth buff (visual only).
- Night: "กลับบ้านเร็ว ๆ นะ เดี๋ยวค่ำ!" — gentle reminder, not scolding.
- Egg stage at max: Grandma tears up slightly (happy tears). "ไข่ใกล้ฟักแล้ว! คุณยายดีใจมากเลยนะ!"

---

### Post Bird

**Location:** Travels between screens. Appears in BM (mailbox), TL, ML, TR — different each session.

**Appearance:**
A bright blue bird slightly smaller than a crow. Orange beak. Red postman's hat (tiny cap). A large leather mail bag that seems too heavy for its size. Always in a hurry but always friendly.

**Dialogue style:**
Very fast. Short sentences. Always mentions being busy but always has time to say one kind thing. Onomatopoeic.

**Role:**
Delivery character. Connects world to Egg Home. Sometimes delivers special event items.

**Dialogue examples:**
- Passing by: "วุ้ย ยุ่งมาก! แต่มีของฝากนะ!" → Drops 1× Clover and flies away.
- At mailbox: "มีจดหมายจากคุณยายเต่า!" → Delivers message.
- Resting: "พักสักครู่นะ... บินทั้งวันเลย!"
- After boss win: "โอ้! ชนะกษัตริย์แล้วเหรอ! ต้องส่งข่าวนี้ทันที!" (flies away quickly — implies world knows about the win).

**Gifts:**
- Random delivery: 1× Clover (40% of screens it appears on).
- Special delivery: Old Letter or Recipe Card (20% of sessions).

**Mini quests:**
- (Future) Mail delivery chain: Post Bird asks player to deliver letters between NPCs.

**Special interactions:**
- Chasing Post Bird: If child taps the bird rapidly (3 taps) while it's flying away, it stops, turns around surprised, then drops an extra item.

---

### Young Bunny Farmer

**Location:** Town Square (MC) — stall on the right side. Always present during day.

**Appearance:**
Teenage bunny (slightly taller than Sleepy Bunny enemies). Farmer overalls. Straw hat. Flour dusted on cheeks. Cheerful and slightly boastful.

**Dialogue style:**
Energetic. Informal Thai. Uses "เฮ้!" a lot. Competitive but friendly. Loves racing.

**Role:**
Trader. EggRun trigger NPC. Provides social energy to the Town Square.

**Dialogue examples:**
- First meeting: "เฮ้! หลังบ้านมีแครอท มาแลกกันเถอะ! 3 โคลเวอร์ = 1 อาหาร!"
- EggRun challenge: "แข่งวิ่งกันไหม? ถ้าชนะข้า เอาของดีไปได้เลย!"
- After EggRun win: "เก่งมากเลย! เร็วกว่าข้าจริง ๆ นะ!" (slightly reluctant but genuine).
- After EggRun loss: "ลองใหม่ได้นะ! ข้ารออยู่!"
- Night: "ปิดแล้วนะ! พรุ่งนี้ค่อยมาใหม่ได้!"

**Gifts:**
- Trade: 3× Clover → 1× Food.
- After EggRun win: 2× Wild Berry + 1× Clover.

**Mini quests:**
- Race challenge (EggRun trigger): Always available during day. Rematchable unlimited times.
- (Future) "ช่วยเก็บแครอทให้ข้า 5 ลูกได้ไหม?" — item collection mini-quest.

---

### Traveling Bee Merchant

**Location:** Town Square (MC) 60% of sessions, Clover Hill (MR) 40% of sessions. Never both on same session.

**Appearance:**
A round, fuzzy yellow-and-black bee. Merchant vest with many pockets. Round spectacles (fashionable, not academic). Large saddlebag of goods. Speaks with excessive enthusiasm about merchandise.

**Dialogue style:**
Merchant-speak. Slightly theatrical. Everything is "rare!" and "special today only!" but still sincere.

**Role:**
Rare item access. Currency sink for Clovers. World feels larger when he mentions other regions.

**Dialogue examples:**
- Standard pitch: "ของดีหายากจากทั่วโลก! วันนี้มีพิเศษ!"
- Not enough Clovers: "โคลเวอร์ยังไม่พอนะ สะสมเพิ่มก่อนนะจ๊ะ!"
- Absent day: Post Bird delivers note: "วันนี้พ่อค้าผึ้งไม่มา บินไปซื้อของจากหาดทรายอยู่"
- After boss win: "ได้ยินว่าชนะกษัตริย์แล้ว! เพิ่งได้ของใหม่มาพอดี!" → Unlocks one extra rare item slot.

**Gifts:**
- Rare items for 5× Clover: Rare Pebble, Butterfly Wing, Old Letter.
- Night (Fox Merchant takes his spot): Different item set (Moon Crystal if available, etc.).

**Inventory (Year 1):**
| Item | Cost |
|---|---|
| Wild Berry ×2 | 2 Clovers |
| Butterfly Wing | 4 Clovers |
| Rare Smooth Pebble | 5 Clovers |
| Old Letter (lore) | 3 Clovers |

---

## Treasure System

### Design Philosophy

Treasure in Green Meadow should feel like:
- **Discovery**, not a reward for completing a task.
- **Consistent**: fixed treasures are always there, rewarding thorough exploration.
- **Surprising**: random treasures feel like the world is full of little gifts.

No treasure should require combat to unlock. Treasure is for explorers, not fighters.

---

### Fixed Treasure — Permanent Locations

These are in the same place every session. Child can find them again once they know where they are.

| # | Location | Screen | Contents | Refill |
|---|---|---|---|---|
| 1 | Old chest behind oak tree | BM | Smooth Pebble + Old Letter | Never (one-time per save) |
| 2 | Notice board | MC | Clover + quest hint | Daily |
| 3 | Garden vegetable patch | TM | Wild Berry ×2 | Daily (real-world day) |
| 4 | Garden rare flower clearing | TM | Rainbow Flower (permanent collectible) | Never |
| 5 | Flower Field hidden clearing | TL | Flower Seeds ×2 + Butterfly Wing | Weekly |
| 6 | River stepping stone #3 | ML | Rare Smooth Pebble | Session (once per session) |
| 7 | Hollow log by Forest Gate | TR | Ancient Fossil | Never (one-time per save) |
| 8 | Clover Hill top | MR | Lucky Four-Leaf Clover | Never (one-time per save) |
| 9 | Willow hollow | BL | Dream Seed | Never (future use) |
| 10 | Island in Pond | BL | Egg Nest collectible | Never (one-time per save) |
| 11 | Post-boss arena | BR | Clover Crown + Rare Token + Food | Every boss win |

---

### Random Sparkle Treasure

Random sparkle spots appear on screens each session.

| Rule | Detail |
|---|---|
| Spawn rate | 1–2 per screen visited, 30% chance per screen |
| Visual | Small golden sparkle particle cluster at ground level |
| Contents | 1× Clover (50%), 1× Smooth Pebble (30%), 1× Wild Berry (20%) |
| Refill | New random positions each session |
| Interaction | Walk over = auto-collect. Short sparkle burst + chime. |

---

### Hidden Clovers

Scattered across every screen. 3 hidden per screen = 27 total in Green Meadow.

| Rule | Detail |
|---|---|
| Visual | A subtle shimmer in the grass. Only visible if player walks nearby. |
| Reveal | Walking within 1 tile-length causes clover to pop up |
| Collection | Auto-collect on contact |
| Reset | Resets each session (new positions) |
| Bonus | Finding all 27 in one session → "Lucky Day" status: +50% item drop rate for rest of session |

---

### Lore Collectibles — Old Letters

Old Letters are lore fragments that together tell a story.

| Letter | Location | Story fragment |
|---|---|---|
| 1 | BM chest | "ถึงใครก็ตามที่หาเจอจดหมายนี้..." |
| 2 | TR hollow log | "ป่าแห่งนี้เคยมีมังกรอาศัยอยู่..." |
| 3 | TM garden path | "คุณยายเต่าเคยอายุ 5 ขวบเหมือนกัน..." |
| 4 | ML river bank | "สายน้ำนี้ไหลมาจากถ้ำคริสตัล..." |
| 5 | Via Post Bird | "กษัตริย์แกรมมี่แบร์ไม่ได้เป็นกษัตริย์มาตลอด..." |

Collecting all 5 → Unlock a short illustrated storybook panel in Collection (future feature).

---

## Minigame Integration

Each minigame has a natural, in-world trigger that makes it feel like an organic part of exploration — not a menu button.

---

### EggFishing → River Crossing (ML) + Pond & Willow (BL)

**Trigger:** A visible sparkle fishing spot at the water's edge. Walk up to it → prompt: "🎣 ตกปลาไหม?"

**Framing:** The child's egg is fishing with a tiny handmade rod. Fish are visible under the water surface before the minigame starts — anticipation is built.

**Rewards:**
- Common: Wild Berry, Smooth Pebble
- Uncommon: River Pearl (ML), Deep Water Pearl (BL)
- Rare: Bubble Fish collectible (only from fishing — not found elsewhere)

**Difference between spots:**
- River (ML): Shallower water. Easier fish. Common-uncommon loot.
- Pond (BL): Deeper. Less common fish. Uncommon-rare loot. Special "night variant" with different fish.

---

### EggRun → Town Square (MC)

**Trigger:** Young Bunny Farmer dialogue: "แข่งวิ่งกันไหม?" → Accept → EggRun launches.

**Framing:** It's a race against the bunny. Same EggRun mechanics, but wrapped as a race challenge from a named character.

**Rewards:**
- Win: 2× Wild Berry + 1× Clover
- Participation (lose): 1× Clover (participation reward — no empty-handed outcome)

**Rematch:** Available unlimited times per session.

---

### EggTower → Forest Entrance (TR)

**Trigger:** A tall ancient tree at the northern edge of the Forest Entrance screen. Tap the tree → "🌳 ปีนต้นไม้ขึ้นไปไหม?" → Accept → EggTower launches with "climbing the ancient tree" visual framing.

**Framing:** The egg is climbing toward the tree canopy to peek into the forest. Each "floor" in EggTower = a branch.

**Rewards:**
- Reaching height 3: Old Letter (lore fragment #2)
- Reaching height 6: Ancient Fossil hint (reveals chest location in TR)
- Top (height 10): Canopy viewpoint — brief shot of Crystal Cave visible in the distance. No item — pure preview delight.

---

### EggCatch → Flower Field (TL)

**Trigger:** A visible butterfly cluster in the upper half of Flower Field. Walk into cluster → "🦋 จับผีเสื้อเล่นไหม?" → Accept → EggCatch launches with butterfly-catching visual theme.

**Framing:** EggCatch mechanics, but the items being "caught" are butterflies drifting across the screen.

**Rewards:**
- Butterfly Wing collectible (per catch)
- Rare: Rainbow Butterfly (very rare variant only catchable during sunny weather)

---

### EggMemory → Grandma Turtle's House (TM)

**Trigger:** Grandma Turtle dialogue: "ช่วยหาดอกไม้ในกระถางให้หน่อยนะ คุณยายลืมว่าอยู่กระถางไหน..." → Accept → EggMemory launches with flower-pot matching theme.

**Framing:** EggMemory mechanics, but pairs are flower pots with different flowers. The theme fits the cozy garden setting completely.

**Rewards:**
- Completion: Recipe Card + Wild Berry (from Grandma)
- Perfect match: Extra Wild Berry ×2

---

## Session Loop

This describes the natural arc of a complete 10–15 minute session.

```
Child opens app
↓
Egg Home (feed egg, check items)
↓
Tap "ออกสำรวจ" (Go Explore)
↓
Starting Path (BM) — Professor Owl says hello
↓
First enemy: Sleepy Bunny
↓
Battle (MoveSelectBattleMode)
↓
Reward: XP → egg glows, Clover drop
↓
Explore → discover Fishing Spot (ML)
↓
Optional: EggFishing minigame
↓
Reward: River Pearl collectible
↓
Visit Town Square (MC) — Young Bunny race offer
↓
Optional: EggRun
↓
Continue north → Grandma Turtle (TM)
↓
Grandma gives food gift
↓
Optional: EggMemory
↓
Collect Wild Berry from garden
↓
Head to Clover Hill (MR) — spot King Bear in distance
↓
Battle 2–3 enemies en route
↓
Enter King Clover Bear Meadow (BR)
↓
Boss dialogue → Player chooses: Fight or Not Yet
↓
[Path A: Fight] → Boss battle → Win → Celebration + rewards
↓
[Path B: Not Yet] → More exploration, return later
↓
Natural end point: After boss win or after inventory full
↓
Home button → return to Egg Home
↓
Use food items on egg → egg reacts happily
↓
Check collection (new collectibles)
↓
Session ends with child having DONE something memorable
```

---

### Natural Session End Triggers

The game never kicks the child out. But the world provides gentle signals:

| Signal | Trigger |
|---|---|
| "ไข่ของเราน่าจะหิวแล้วนะ!" | After 3 battles have been fought |
| "ของในกระเป๋าเต็มแล้ว!" (bag full indicator) | When carrying 10+ items |
| Post Bird: "ค่ำแล้ว กลับบ้านก่อนนะ!" | After 7pm real time |
| Post-boss celebration: "กลับไปโชว์ไข่ดูไหม?" | After boss win |
| Grandma: "กลับไปพักก่อนนะหลาน วันนี้เก่งมากแล้ว!" | 15 minutes after first battle |

The child controls return. Home button is always visible. The signals feel like the world caring, not the game forcing.

---

## Boss — King Clover Bear Meadow

---

### Arena Design

**Shape:** Open circular meadow, roughly 3× wider than a standard screen.
**Perimeter:** Ancient honey oak trees, 8 trees evenly spaced, forming a soft natural arena border.
**Ground:** Short-cropped clover grass, soft and even.
**Center-back:** Stone throne of stacked boulders, cushioned with thick green moss. Three large honey jars visible beside the throne.
**Decoration:** Clover patches in circular rings around the throne. Small wildflowers at the arena perimeter.
**Sky:** Always clear above the arena, regardless of surrounding weather.

---

### King Clover Bear — Character Design

**Appearance:**
Enormous, round, brown bear. Much larger than the player egg sprite — about 4× the height. Soft round face, warm kind eyes, wide easy smile. A crown of fresh clovers sits on his head (slightly crooked — he doesn't care). Fluffy, well-maintained fur. Round honey jar clutched in one paw at all times. Never frowning — even when challenging.

**Voice:**
Deep but warm. Speaks slowly. Uses "จ๊ะ" at end of sentences (gentle, grandfatherly Thai particle). Never sounds threatening.

---

### Approach Sequence

1. Child enters BR screen.
2. King Clover Bear visible immediately — large sprite on distant throne.
3. Walking within range (approximately 60% of screen): Bear notices, sets down honey jar with a small animation.
4. Bear stands slowly (slow rising animation — big bears move slowly).
5. Stretches arms wide (big yawn-stretch).
6. Smiles broadly.
7. Approaches halfway to meet player.
8. Stops. Bows slightly (head nod).
9. Dialogue balloon appears:

**Dialogue (full):**
> "สวัสดีนักผจญภัยน้อย! ข้าคือกษัตริย์แกรมมี่แบร์ แห่งทุ่งโคลเวอร์อันกว้างใหญ่นี้"
> "ข้าได้ยินว่าเจ้าออกผจญภัยกับไข่ของตัวเอง... น่าชื่นชมมาก!"
> "ข้าอยากทดสอบความกล้าหาญของเจ้าสักครั้งนะ จ๊ะ"
> "พร้อมท้ายข้าแล้วหรือยัง?"

10. Two choices appear:
    - **"พร้อมแล้วครับ/ค่ะ!"** → King nods approvingly → Boss battle begins
    - **"ยังไม่พร้อมครับ/ค่ะ"** → King laughs warmly: "ไม่เป็นไร สำรวจให้ทั่วก่อน แล้วค่อยมาใหม่นะจ๊ะ!" → Steps back, bows again, returns to throne

---

### Battle Flow

**Battle type:** MoveSelectBattleMode with boss variant.

**Differences from regular battle:**
| Setting | Regular Battle | King Clover Bear |
|---|---|---|
| Enemy HP | Standard | 2.5× normal |
| Music | Regular battle theme | Unique boss theme (grander) |
| Enemy sprite | Small/medium | Large (fills more of enemy zone) |
| Battle intro | None | Short 2-second camera zoom to boss face |
| Midpoint comment | None | After every 3 correct answers: Bear makes a comment |
| Defeat text | Default | Custom (see below) |
| Win text | Default | Custom (see below) |

**Mid-battle comments from King Bear (after correct answer streaks):**
- After 3 correct: "โอ้! เก่งกว่าที่ข้าคิดนะ จ๊ะ!"
- After 6 correct: "น่าประทับใจมาก! ข้าต้องพยายามมากกว่านี้แล้ว!"
- After the winning move: "...เจ้าชนะข้าแล้ว! ข้าภูมิใจในตัวเจ้ามากเลยจ๊ะ!"

---

### Win Sequence

1. King Bear's HP reaches zero.
2. King Bear staggers back (gentle exaggerated stumble animation, not painful).
3. Big pause.
4. Bear bursts into genuine laughter (HA HA HA in large speech bubbles).
5. Claps both paws together — big fluffy clap animation.
6. Dialogue:
   > "เก่งมากเลยจ๊ะ! ข้าแพ้แล้ว!"
   > "เจ้าเป็นนักผจญภัยที่แท้จริง!"
   > "ข้าภูมิใจในตัวเจ้าและไข่ของเจ้ามากนะจ๊ะ"
   > "เอาของรางวัลนี้ไปด้วยนะ!"
7. Bear holds out Clover Crown on both paws.
8. Sparkle storm — full-screen golden sparkle.
9. Confetti in green, yellow, white.
10. Victory fanfare plays.
11. Egg sprite does a celebration animation (spin + jump).
12. Three treasure spots activate around arena (sparkle markers).
13. Short pan-up to show arena from above — a moment of triumph before returning to ground level.

**Post-win arena state:**
- King Bear returns to throne.
- King sits down, waves, goes back to honey jar.
- New dialogue (if child returns after win):
  > "เจ้ากลับมาเยี่ยมข้าอีกแล้ว! ข้ายินดีมาก!"
  > (Will not rebattle same session — "ข้าต้องพักก่อนนะจ๊ะ สู้กันใหม่ครั้งหน้า!")

---

### Failure Experience

**Philosophy:** The child cannot truly "lose." They experience a temporary setback that feels gentle and leaves them with something.

**Failure sequence:**
1. King Bear's attack depletes the battle outcome (battle ends — not via HP loss in the traditional sense, but via "out of moves" or turn limit).
2. Battle ends. King Bear does not look triumphant — he looks concerned.
3. Bear gently waves paw side to side.
4. Dialogue:
   > "ไม่เป็นไรเลยนะจ๊ะ ลองใหม่ได้เสมอ"
   > "ข้าเห็นว่าเจ้าพยายามมากแล้ว!"
   > "เอาของนี้ไปก่อนนะ ระหว่างที่ยังฝึก"
5. Bear extends one paw with consolation gift (1× Clover or 1× Smooth Pebble).
6. Child is gently bounced back to Starting Path (BM) — short transition animation.
7. Professor Owl at BM: "ไม่เป็นไรนะ! แกรมมี่แบร์ไม่ได้โกรธหรอก! ลองอีกครั้งได้เสมอ!"

**Failure rules:**
- Never uses the word "แพ้" (defeated/lost) toward the child.
- Always uses "ลองอีกครั้ง" (try again) framing.
- Always ends with a small gift.
- Never locks the child out of rebattling.
- The defeat animation is funny, not painful.
- No red screen. No harsh sound. No sad music.

---

### Replay

The boss is rebattlable. Each win gives:
- First win: Clover Crown + Rare Token + Food item
- Subsequent wins: 1× Rare Token + 1× Food item (reduced but never empty)

King Bear reacts to repeat challengers:
- 2nd visit: "เจ้ากลับมาอีกแล้ว! ข้ายินดีรับมือตลอดนะจ๊ะ!"
- 3rd+: "เจ้าเก่งขึ้นทุกครั้งเลย! ข้าต้องระวังตัวแล้ว!"

---

## Home Return

### How the player leaves Green Meadow

| Method | How |
|---|---|
| Home button | Always visible — bottom corner. Tap → confirm "กลับบ้านเลยไหม?" → YES → transition back to Egg Home |
| Walk south from Starting Path | Walk off the southern edge of BM → short path animation → Egg Home |
| Natural end triggers | "Home" suggestion appears (not forced) when session end conditions are met |
| After boss win | "กลับไปโชว์ไข่ดูไหม?" option appears after celebration sequence |

### Transition animation

- Screen fades to warm white.
- Brief travel animation: egg sprite walking down the path.
- Fade into Egg Home background scene.
- Egg Home has a warm "return" reaction: egg does reunion animation.

### How rewards flow to Egg Home

| Item type | Effect in Egg Home |
|---|---|
| Food items | Appears in item tray immediately. Child feeds egg normally. |
| Collectibles | Appear in Collection tab. No specific effect on Egg Home UI (Year 1). |
| Clover Crown (accessory) | Appears as accessory option. Egg wears it when equipped (visual only). |
| Clovers | Stored as currency. Used in Town Square trades next visit. |
| XP from battles | Already added during battle — egg stage may have grown since leaving. |

---

## Future Hooks

Areas reserved for future content. Implemented as visual placeholders in Year 1 — child can see them but cannot interact yet.

| Future content | Location | Year 1 placeholder |
|---|---|---|
| Sunny Beach entrance | Eastern edge of MR (Clover Hill) | Distant ocean shimmer visible. Sign: "หาดทรายสวยรออยู่!" |
| Seasonal events | TL (Flower Field) | Easter: extra eggs in field. Songkran: water element at ML river. Loy Krathong: lanterns at BL pond. |
| Gardening system | TM (Grandma's garden) | Empty garden plot. Grandma says "เดี๋ยวเราจะปลูกอะไรที่นี่ด้วย!" |
| Photo spots | 3 scenic locations (hilltop MR, river ML, pond BL) | "📷" icon at location. Tap = portrait of egg in that environment. Shareable with parent. |
| NPC friendship level | All NPCs | Friendship hearts track internally. Not shown to child. Future: NPCs remember child's history. |

---

## Open Questions

### Must be answered before Green Meadow code begins

1. **Screen navigation UX for mobile**: How does the child move between screens? Options: (A) Directional arrows at screen edge, (B) Tap the edge of screen to move, (C) Minimap with tap-to-navigate, (D) Egg sprite runs autonomously and child taps encounter triggers. For ages 4–5, option (D) may be most accessible.

2. **Encounter distance on mobile**: How large does the enemy sprite's "trigger zone" need to be for a 4-year-old's finger accuracy? Current estimate: 80–100px radius on a 390px screen. Too large = accidental battles; too small = missed touches.

3. **Screen transition animation**: When moving between screens, does the world scroll (like Animal Crossing) or cut (like Pokémon)? Scroll feels more spatial but is technically heavier. Cut is simpler. Which fits Year 1 scope?

4. **Items bag capacity**: How many items can the child carry? If unlimited, there's no incentive to return home. If capped (e.g. 5 items), it creates a natural "go home and deposit" loop. Which feel matches our philosophy?

5. **Minigame within-world or fullscreen**: When EggFishing or EggCatch triggers from the world, does it launch fullscreen (same as current minigame behavior) and return to world, or does it run inside the world screen? Fullscreen is simpler technically; in-screen is more immersive.

6. **Boss rebattle curriculum**: When the child rebattles King Clover Bear, does the question set change? Harder questions over time? Same range? Based on subject readiness? This affects long-term learning value of the boss.

7. **Egg carries into world**: Does the egg sprite shown in Green Meadow look the same as the current egg stage at Egg Home? Yes seems right — the egg should look like "my egg."

8. **Collectible display**: Where does the child see their collectibles? Current plan: Collection tab in Egg Home. Should Green Meadow have its own "backpack" or does it all flow to the same Collection?

9. **Day/night sync with real clock**: Green Meadow's day/night matches the real-world clock (already implemented for Egg Home). Confirm: yes, same behavior for the world. Night sessions (after 7pm) should feel magical, not scary.

10. **Post Bird quest chain**: The mail delivery concept (Post Bird delivers letters between NPCs) is a compelling Year 1 feature. Is this in scope for the MVP, or deferred to post-launch?

---

## Relationship to Other Documents

| Document | How it relates |
|---|---|
| `kidquest-world.md` | Parent document. Green Meadow is Region 1. All world philosophy applies here. |
| `egg-home.md` | Egg Home is the base that feeds into and receives from Green Meadow. Items + XP flow between them. |
| `battle-feel-philosophy.md` | All battles inside Green Meadow use the same battle-feel grammar. No change to battle UX. |
| `pokemon-style-learning-battle.md` | MoveSelectBattleMode is the battle system used in all Green Meadow encounters. |
| `egg-companion-adventure.md` | The egg sprite in the world is the same emotional companion from battle. Reacts the same way. |
| `CURRENT_STATE.md` | EggFishing/EggRun/EggCatch/EggTower/EggMemory are all built. Integration hooks described here. |
