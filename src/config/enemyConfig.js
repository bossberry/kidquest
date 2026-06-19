// Enemy data — HP/ATK/DEF balanced for Tier 0 creature (อนุบาล, average XP).
// Target ~10 correct answers to defeat the easiest enemy at T0.
// Scaled by scaleMonsterStats at higher creature levels.

export const ENEMY_DATA = {
  sleepy_bunny: { nameTH: 'กระต่ายหลับ',  hp: 44, atk: 3, def: 0, level: 1, subject: 'thai' },
  bouncy_slime: { nameTH: 'สไลม์กระโดด', hp: 44, atk: 4, def: 1, level: 1, subject: 'math' },
  leaf_sprite:  { nameTH: 'นางไม้ใบ',     hp: 40, atk: 3, def: 0, level: 2, subject: 'thai' },
  mushroom_imp: { nameTH: 'เห็ดนิสัยซน', hp: 40, atk: 4, def: 1, level: 2, subject: 'eng'  },
  fox_kit:      { nameTH: 'จิ้งจอกน้อย',  hp: 36, atk: 4, def: 0, level: 2, subject: 'eng'  },
  egg_pawn:     { nameTH: 'Egg Pawn',      hp: 44, atk: 4, def: 1, level: 2, subject: 'math' },
  grumpy_mole:  { nameTH: 'ตุ่นบึ้กตึง', hp: 52, atk: 4, def: 1, level: 3, subject: 'math' },
  baby_zombie:  { nameTH: 'เบบี้ซอมบี้',  hp: 32, atk: 4, def: 0, level: 2, subject: null  },
  snake:        { nameTH: 'งูยักษ์',      hp: 50, atk: 5, def: 1, level: 3, subject: null  },
  ghost_wisp:   { nameTH: 'วิญญาณเรืองแสง', hp: 30, atk: 3, def: 0, level: 1, subject: null },
}
