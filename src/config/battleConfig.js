export const BOSS_XP_THRESHOLD = 300

export const AI_OPPONENTS = {
  0: {
    normal: [
      { name: 'Motobug',    emoji: '🤖', HP: 320, ATK: 20, DEF: 5,  SPD: 6  },
      { name: 'Buzzbomber', emoji: '🦟', HP: 280, ATK: 25, DEF: 4,  SPD: 9  },
      { name: 'Crabmeat',   emoji: '🦀', HP: 360, ATK: 18, DEF: 8,  SPD: 5  },
    ],
    miniBoss: { name: 'Egg Pawn',     emoji: '⚔️🤖', HP: 460, ATK: 35, DEF: 12, SPD: 8  },
    boss:     { name: 'Dr. Eggman I', emoji: '😈',   HP: 700, ATK: 45, DEF: 15, SPD: 10,
                reward: 'unlock_tier_1',
                dialogue: 'ฮ่าฮ่า! เจ็บไหม? กลับไปเรียนให้เก่งกว่านี้ก่อน!' },
  },
  1: {
    normal: [
      { name: 'Caterkiller', emoji: '🐛', HP: 480, ATK: 30, DEF: 8,  SPD: 7  },
      { name: 'Burrobot',    emoji: '🔩', HP: 520, ATK: 28, DEF: 12, SPD: 6  },
      { name: 'Chopper',     emoji: '🐟', HP: 440, ATK: 35, DEF: 7,  SPD: 10 },
    ],
    miniBoss: { name: 'Egg Gunner',    emoji: '🔫🤖', HP: 700, ATK: 50, DEF: 18, SPD: 12 },
    boss:     { name: 'Dr. Eggman II', emoji: '😈🚀', HP: 1050, ATK: 63, DEF: 22, SPD: 15,
                reward: 'unlock_tier_2',
                dialogue: 'ไม่เป็นไร! เครื่องจักรรุ่นต่อไปจะทำลายเจ้าแน่!' },
  },
  2: {
    normal: [
      { name: 'Coconuts', emoji: '🥥',   HP: 700,  ATK: 45, DEF: 14, SPD: 12 },
      { name: 'Octus',    emoji: '🐙',   HP: 640,  ATK: 50, DEF: 10, SPD: 16 },
      { name: 'Rexon',    emoji: '🦕',   HP: 760,  ATK: 40, DEF: 18, SPD: 10 },
    ],
    miniBoss: { name: 'Egg Robo',        emoji: '🤖💥', HP: 1050, ATK: 70, DEF: 24, SPD: 18 },
    boss:     { name: 'Dr. Eggman III',  emoji: '😈🔥', HP: 1600, ATK: 90, DEF: 30, SPD: 22,
                reward: 'unlock_tier_3',
                dialogue: 'เจ้าจะได้รับโทษ! เครื่องยนต์ใหม่ของข้าจะบดขยี้เจ้า!' },
  },
  3: {
    normal: [
      { name: 'Rhino-Bot', emoji: '🦏',  HP: 1040, ATK: 70,  DEF: 22, SPD: 15 },
      { name: 'Slicer',    emoji: '🦂',  HP: 960,  ATK: 80,  DEF: 16, SPD: 20 },
      { name: 'Jawz',      emoji: '🦈',  HP: 1120, ATK: 63,  DEF: 26, SPD: 18 },
    ],
    miniBoss: { name: 'Heavy Gunner',    emoji: '⚙️🔫', HP: 1600, ATK: 110, DEF: 38, SPD: 26 },
    boss:     { name: 'Dr. Eggman IV',   emoji: '😈⚙️', HP: 2400, ATK: 140, DEF: 48, SPD: 34,
                reward: 'unlock_tier_4',
                dialogue: 'ความฉลาดของเจ้าน่าเกรงขาม แต่ข้าจะชนะเสมอ!' },
  },
  4: {
    normal: [
      { name: 'GUN Mech',   emoji: '🤖⚡', HP: 1520, ATK: 100, DEF: 32, SPD: 24 },
      { name: 'E-101 Beta', emoji: '🔮🤖', HP: 1440, ATK: 110, DEF: 26, SPD: 30 },
      { name: 'Dark Chao',  emoji: '😈💜', HP: 1600, ATK: 90,  DEF: 38, SPD: 22 },
    ],
    miniBoss: { name: 'Egg Emperor',     emoji: '👑🤖', HP: 2300, ATK: 150, DEF: 54, SPD: 40 },
    boss:     { name: 'Dr. Eggman V',    emoji: '😈💎', HP: 3500, ATK: 200, DEF: 70, SPD: 52,
                reward: 'unlock_tier_5',
                dialogue: 'เจ้าเป็นนักเรียนที่เก่งมาก แต่ Eggman Empire จะพิชิตโลกนี้!' },
  },
  5: {
    normal: [
      { name: 'Metal Sonic',      emoji: '⚡🤖', HP: 2240, ATK: 150, DEF: 48, SPD: 36 },
      { name: 'Shadow Android',   emoji: '🖤⚡', HP: 2160, ATK: 165, DEF: 40, SPD: 44 },
      { name: 'Silver Gladiator', emoji: '🌟⚔️', HP: 2320, ATK: 140, DEF: 56, SPD: 35 },
    ],
    miniBoss: { name: 'Mephiles',        emoji: '🌑😈', HP: 3400, ATK: 225, DEF:  80, SPD: 60 },
    boss:     { name: 'PERFECT CHAOS',   emoji: '🌊💀', HP: 5250, ATK: 300, DEF: 110, SPD: 80,
                reward: 'world_champion',
                dialogue: 'เจ้าคือจุดสูงสุดแห่งปัญญา ข้ายอมรับความพ่ายแพ้!' },
  },
}
