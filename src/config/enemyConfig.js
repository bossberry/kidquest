// Enemy data — HP/ATK balanced for Tier 0 creature (อนุบาล, average XP).
// Battles should last 6–10 correct answers at T0. Scaled by scaleMonsterStats at higher creature levels.

export const ENEMY_DATA = {
  sleepy_bunny: { nameTH: 'กระต่ายหลับ',  hp: 24, atk: 4, level: 1, subject: 'thai' },
  bouncy_slime: { nameTH: 'สไลม์กระโดด', hp: 28, atk: 5, level: 1, subject: 'math' },
  leaf_sprite:  { nameTH: 'นางไม้ใบ',     hp: 20, atk: 5, level: 1, subject: 'thai' },
  mushroom_imp: { nameTH: 'เห็ดนิสัยซน', hp: 20, atk: 6, level: 1, subject: 'eng'  },
  fox_kit:      { nameTH: 'จิ้งจอกน้อย',  hp: 22, atk: 6, level: 2, subject: 'eng'  },
  egg_pawn:     { nameTH: 'Egg Pawn',      hp: 30, atk: 7, level: 2, subject: 'math' },
  grumpy_mole:  { nameTH: 'ตุ่นบึ้กตึง', hp: 36, atk: 7, level: 2, subject: 'math' },
  baby_zombie:  { nameTH: 'เบบี้ซอมบี้',  hp: 18, atk: 8, level: 2, subject: null  },
  snake:        { nameTH: 'งูยักษ์',      hp: 32, atk: 9, level: 3, subject: null  },
}
