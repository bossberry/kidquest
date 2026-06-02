# KidQuest — Project SPEC

## Vision
Educational RPG web app สำหรับเด็กไทย อนุบาล → มัธยมปลาย
- เด็กเล่นเหมือนเกม RPG — มีไข่ สัตว์เลี้ยง XP items
- พ่อแม่ดู dashboard รายงานพัฒนาการลูก
- ขายเป็น subscription ให้พ่อแม่

## Primary User: โชแปง
- อายุ 5 ขวบ (เกิด 18 กรกฎาคม 2020)
- ชอบ Sonic, Minecraft, Pokémon
- เรียนรู้ผ่านเกม ไม่ชอบ passive learning
- เล่น 67 นาที/วัน, ผ่าน ~50 ด่านต่อวัน

## Target Market
- พ่อแม่เด็ก อนุบาล → มัธยมปลาย ในไทย
- เด็กในระบบการศึกษาไทย ~9.5 ล้านคน
- Addressable market ~2.4 ล้านครอบครัว
- ราคาตั้งใจ 199 บาท/เดือน

## Tech Stack
- **Frontend**: HTML/CSS/JS (single file prototype → React ในอนาคต)
- **Backend**: Supabase (PostgreSQL + Auth) — `https://dgpsnlkedergkbhqnjpu.supabase.co`
- **Hosting**: Netlify (kidquest-chopin.netlify.app)
- **Version Control**: GitHub (bossberry/kidquest)
- **Development**: Claude Code + Claude Pro subscription

## Supabase Integration
- CDN: `@supabase/supabase-js@2` via jsdelivr
- Auth: Email/Password (modal ใน home screen, ปุ่ม Login มุมขวาบน)
- Table: `eggs` — user_id (PK), child_name, state_json (jsonb), updated_at
- `saveState(s)`: sync localStorage, fire-and-forget Supabase upsert
- `loadState()`: async — ดึง Supabase ก่อน, fallback localStorage
- `_appInit()`: async wrapper ที่ load state → init → render
- Error handling: silently fallback localStorage ทุกกรณี (ไม่ popup เด็ก)
- Guest mode: เล่นได้เต็มรูปแบบโดยไม่ต้อง login

## Current State (Prototype)
ไฟล์เดียว: `index.html` (~600KB รวม phonics audio base64)

### 3 Games (each with Level System)

**ภาษาไทย** — 2 โหมด:
- จับคู่ตัวอักษร ก-ฮ (ไม่มี level)
- สะกดคำ 4 Levels: L1 พยัญชนะ+สระอา · L2 คำสัตว์ · L3 คำผลไม้ · L4 ประโยคสั้น (fill-in-blank)

**Math** — 6 Levels: L1 บวก1-5 · L2 บวก1-10 · L3 บวก1-20 · L4 ลบ1-10 · L5 บวกลบผสม · L6 โจทย์คำ
- timer ปรับตาม level (20s→10s), hint system 3-attempt, mastery XP

**English** — 4 Levels: L1 A-Z Phonics · L2 CVC Words · L3 Sight Words · L4 Sentences (ordering)

### Level System
- unlock เมื่อ session accuracy ≥ 80% (EMA: prev×0.6 + new×0.4)
- Level selector UI: unlocked cards / nearby locked (preview+🔒) / distant locked (???)
- Teach phase: first time entering each level, mascot อธิบาย + 2 examples
- seenTeach[] tracks which levels have been introduced
- STATE.subjectLevels: {thai, math, eng} — highest unlocked (1-indexed)
- STATE.levelMastery: {thai:{}, math:{}, eng:{}} — mastery per level

### Hint System (Math)
- ผิดครั้งที่ 1: ลองอีกครั้ง (question stays active)
- ผิดครั้งที่ 2: highlight dots visualization
- ผิดครั้งที่ 3: show correct answer + advance

### RPG Egg System
- ผ่านด่าน → ได้ XP → ไข่ evolve 7 stages
- XP threshold: 50 XP ต่อ stage (demo mode)
- ฟักไข่: กด 5 ครั้ง tap counter → สัตว์โผล่
- 60 creatures: 4 สาย (ไทย/EN/Math/Hybrid) × 5 rarity × 3 ตัว

### Procedural Egg Algorithm (LOCKED — อย่าเปลี่ยน)
```
baseSeed = hash(name + grade) XOR hash(dow + month + day + hour)
สีหลัก = dominant stat (ไทย=เขียว, EN=น้ำเงิน, Math=ม่วง)
รูปร่าง = firstSubject (ป้อม/รี/แหลม)
ลวดลาย = progress stage
สีพื้น = วันในสัปดาห์
Pattern = เดือนที่ได้ไข่
โทน = ชั่วโมง (กลางวัน=สว่าง, กลางคืน=dark galaxy)
Streak = ประกายและ accent band
```

### Item System
- 🍗 อาหาร (55% drop) — +25 happiness + feeding animation
- ⭐ ผงดาว (25%) — XP x2 เป็น 5 นาที
- 🎀 ริบบิ้น (12%) — +15 happiness
- 💧 น้ำมนต์ (8%) — +20 XP ทันที
- Drop rate: 40% per correct answer

### Egg Run (Daily Reward Mini-Game)
- ปุ่มอยู่ใต้ 3 world cards บน home screen
- **Unlock**: ต้องเรียนให้ครบ 10 ด่าน/วัน (`dailyRounds >= 10`)
  - ปุ่มสีเทา + lock icon เมื่อยังไม่ครบ, แสดง progress bar X/10
  - ปุ่มสีทอง + pulse animation เมื่อ unlock แล้ว
- **Lives**: 3 ชีวิต/วัน (`eggRunLives`) reset ทุกเที่ยงคืน
  - เล่นแต่ละครั้งใช้ 1 life
  - หมด lives → "มาเรียนพรุ่งนี้เพื่อเล่นอีกครั้ง! 🌙"
- **Gameplay**: endless runner, ไข่วิ่งอัตโนมัติ, แตะ/space กระโดด
  - ความเร็ว = 3 + totalXP/200 (เพิ่มตาม XP สะสม)
  - jump force = -(8 + stage×1.5) (ไข่ stage สูง = กระโดดสูงกว่า)
  - ring magnet radius = 10 + happiness×0.4
- **Rewards**: item drop ตาม ring ที่เก็บ (0-5→20%, 6-15→50%, 16+→80%+โบนัส food)

### State Management
- `localStorage` key: `kq_state`
- Fields: xpThai, xpEng, xpMath, streak, rounds, badges, happiness, items, hatchedEggs, eggDow/Month/Day/Hour, firstSubject, readyToHatch, hatching
- Daily fields: `dailyRounds` (reset ทุกวัน), `lastPlayDate`, `eggRunLives` (reset=3/วัน), `lastRunDate`
- Spell fields: `thaiMastery` (mastery per word), `thSpellLevel` (1 or 2)
- EggRun fields: `erBestDist`, `erBestRings`

### Navigation
- Bottom Nav 3 ปุ่ม: หน้าหลัก / คอลเลกชัน / รีพอร์ต
- ซ่อน nav ระหว่างเล่นเกม

### Pages
1. **Home** — ไข่ + XP bar + 3 world cards + stats
2. **Collection** — tab ฟักแล้ว / กำลังฟัก + egg detail popup
3. **Report** — นาที, ด่าน, accuracy, เวลาต่อวิชา, AI insights, คำแนะนำ

## Creature System
```javascript
// สาย ← dominant stat
thai:  ช้างน้ำเงิน, เต่าหยก, ปลาทอง (common) / ครุฑไฟ (rare) / สิงห์เทพ (epic)
eng:   มังกรน้ำ, นกฟีนิกซ์ (common) / ยูนิคอร์นฟ้า (epic) / มังกร Galaxy (legendary)
math:  หุ่นโกเลม (common) / สายฟ้าเสือ (rare) / God Golem (legendary)
hybrid: มังกรทอง (epic) / ยูนิคอร์นรุ้ง (legendary)
```

## Known Issues (resolved)
- [x] startManualHatch() ฟักได้ทั้งที่ stage ต่ำ → เพิ่ม XP guard
- [x] Egg Run hitbox ไม่ตรง → เปลี่ยนเป็น circle-circle collision (35% radius)
- [x] Collection egg ลวดลายไม่ตรง → save fullEggStats ครบทุก field ตอน hatch
- [x] rounds ใน report อาจสูงเกิน (migration จาก old localStorage)

## Procedural Creature System
- `drawCreature(canvas, seed, stats)` วาดสัตว์ procedural บน Canvas
- seed = hash(name+grade) XOR hash(dow+month+day+hour) — เหมือน egg seed
- Body: 5 shapes (circle, tall ellipse, wide ellipse, hexagon, blob)
- Eyes: 1-3 ดวง, สีจาก seed, เรืองแสงถ้า accuracy > 85%
- Features: horn/tail/wing/spike/tentacle/scale/flame (2-4 อย่างตาม rarity)
- Colors: xpThai→green, xpEng→blue, xpMath→purple, balanced→random hue
- Rarity effects: aura glow (rare+), flame particles (streak>5), legendary particles
- Collection cards ใช้ drawCreature() แทน emoji

## Mini-Games (5 total)
1. **Egg Run** 🏃 — daily reward (10 rounds/day), endless runner
2. **Egg Catch** 🧺 — unlock 2 eggs, catch falling items dodge rocks/bombs
3. **Egg Memory** 🃏 — unlock 4 eggs, match pairs of hatched creatures
4. **Egg Tower** 🏗️ — unlock 6 eggs, stack blocks (stage affects starting width)
5. **Egg Fishing** 🎣 — unlock 10 eggs, timing game, fish → items

## Thai Language Levels (5 levels)
- L1 ⭐: พยัญชนะ ก-ฮ จับคู่รูป (match game)
- L2 ⭐⭐: พยัญชนะ+สระอา (ปา มา ขา)
- L3 ⭐⭐⭐: คำสัตว์ (ปลา แมว ช้าง)
- L4 ⭐⭐⭐⭐: คำผลไม้ (กล้วย มะม่วง)
- L5 ⭐⭐⭐⭐⭐: ประโยคสั้น fill-in-blank

## Roadmap

### Phase 1 — Foundation (ตอนนี้)
- [x] 3 เกมพื้นฐาน (ภาษาไทย จับคู่ + สะกดคำ / Math / English Phonics)
- [x] Egg RPG system
- [x] Collection + Report
- [x] Egg Run daily reward mini-game
- [x] Deploy บน Netlify (kidquest-chopin.netlify.app)
- [ ] **Supabase integration** (Auth + DB)

### Phase 2 — Polish
- [ ] Refactor เป็น React/Next.js
- [ ] Parent account → multi-child profiles
- [ ] Payment system (Omise หรือ Stripe)
- [ ] Landing page
- [ ] เพิ่มหลักสูตร ป.1-ป.6

### Phase 3 — Scale
- [ ] หลักสูตร ม.ต้น-ม.ปลาย
- [ ] AI tutor / personalized questions
- [ ] Classroom mode (B2B → โรงเรียน)
- [ ] Mobile app (PWA หรือ Capacitor)

## Design Principles
- เด็กต้องรู้สึกเหมือนเล่นเกม ไม่ใช่เรียน
- พ่อแม่ต้องเห็น progress ลูกได้ทันที
- Gamification loop: เรียน → XP → ไข่โต → ได้ item → ฟัก → สัตว์ใหม่ → วนซ้ำ
- ไม่มีบทลงโทษหนัก — happiness ลดเบาๆ เท่านั้น

## Audio
- Thai TTS: Web Speech API (lang: th-TH)
- English Phonics: buzzphonics MIT license, base64 embedded (26 ตัว + digraphs)
- Sound effects: Web Audio API (playTone function)
- GainNode boost 2.5x สำหรับ phonics

## Key Functions Reference
```javascript
addXP(world, amount, accDelta, speedDelta) // เพิ่ม XP และ trigger effects
drawEgg(canvas, stats)                       // วาดไข่ procedural
getCreatureForHatch()                        // determine creature จาก stats
triggerHatch()                              // เริ่ม hatch sequence
startManualHatch()                          // กดฟักจาก UI (clears stale state)
buildReport()                               // สร้าง parent dashboard
buildCollection()                           // สร้าง collection page
```

## File Structure (ตอนนี้)
```
kidquest/
└── kidquest_home.html  (~556KB, รวม phonics audio)
```

## Future Structure (เมื่อ migrate to React)
```
kidquest/
├── src/
│   ├── components/
│   │   ├── EggCanvas.jsx
│   │   ├── GameThai.jsx
│   │   ├── GameMath.jsx
│   │   ├── GamePhonics.jsx
│   │   ├── Collection.jsx
│   │   └── Report.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── eggAlgorithm.js
│   │   └── gameLogic.js
│   └── App.jsx
├── public/
│   └── sounds/ (phonics audio files)
└── SPEC.md
```

## Supabase Schema (planned)
```sql
-- users (parents)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- children profiles
CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  grade int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- game sessions
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  world text NOT NULL, -- 'thai' | 'eng' | 'math'
  xp_earned int DEFAULT 0,
  correct int DEFAULT 0,
  total int DEFAULT 0,
  duration_seconds int DEFAULT 0,
  played_at timestamptz DEFAULT now()
);

-- egg state (1 active egg per child)
CREATE TABLE eggs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) UNIQUE,
  xp_thai int DEFAULT 0,
  xp_eng int DEFAULT 0,
  xp_math int DEFAULT 0,
  egg_dow int,
  egg_month int,
  egg_day int,
  egg_hour int,
  first_subject int DEFAULT -1,
  happiness int DEFAULT 80,
  ready_to_hatch boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- hatched creatures
CREATE TABLE hatched_creatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  creature_name text,
  creature_emoji text,
  creature_rarity text,
  egg_stats jsonb, -- snapshot of egg visual params
  hatched_at timestamptz DEFAULT now()
);

-- items inventory
CREATE TABLE items (
  child_id uuid REFERENCES children(id) PRIMARY KEY,
  food int DEFAULT 2,
  star int DEFAULT 0,
  ribbon int DEFAULT 0,
  potion int DEFAULT 0
);
```
