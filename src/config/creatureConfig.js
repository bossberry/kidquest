export const HATCH_CREATURES = {
  thai:  [{e:'🐘',n:'ช้างน้ำเงิน',f:'+ความอดทน',rarity:'common',rarityLabel:'Common'},{e:'🐍',n:'นาคทอง',f:'+พลังน้ำ',rarity:'rare',rarityLabel:'Rare'},{e:'🦅',n:'ครุฑไฟ',f:'+ปีกไฟ',rarity:'epic',rarityLabel:'Epic'}],
  eng:   [{e:'🐉',n:'มังกรน้ำ',f:'+พลังน้ำ',rarity:'common',rarityLabel:'Common'},{e:'🦊',n:'จิ้งจอกน้ำแข็ง',f:'+พลังน้ำแข็ง',rarity:'uncommon',rarityLabel:'Uncommon'},{e:'🦄',n:'ยูนิคอร์นฟ้า',f:'+เขาเวทมนตร์',rarity:'legendary',rarityLabel:'Legendary'}],
  math:  [{e:'🤖',n:'หุ่นโกเลม',f:'+กำปั้นเหล็ก',rarity:'common',rarityLabel:'Common'},{e:'💎',n:'คริสตัลเบิร์ด',f:'+คริสตัลบิน',rarity:'rare',rarityLabel:'Rare'},{e:'⚡',n:'สายฟ้าเสือ',f:'+สายฟ้า',rarity:'epic',rarityLabel:'Epic'}],
  hybrid:[{e:'🌈🦄',n:'ยูนิคอร์นรุ้ง',f:'+รุ้งสวรรค์',rarity:'legendary',rarityLabel:'Legendary'},{e:'🐉',n:'มังกรทอง',f:'+ออร่าทอง',rarity:'legendary',rarityLabel:'Legendary'},{e:'☀️🦁',n:'สิงห์สุริยา',f:'+แสงสุริยา',rarity:'epic',rarityLabel:'Epic'}],
}

export const GRADE_LABELS = ['อนุบาล','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']

export const CREATURE_LEVELS = {
  xpPerLevel: 80,
  maxLevel: 50,
  evoThresholds: {
    teen:  { minLevel: 11, minTier: 2 },
    final: { minLevel: 26, minTier: 5, minBond: 60 },
  },
}

export const TIERS = {
  0: { name: 'อนุบาล', baseStat: 100,  maxXP: 350  },
  1: { name: 'ป.1-2',  baseStat: 150,  maxXP: 500  },
  2: { name: 'ป.3-4',  baseStat: 220,  maxXP: 700  },
  3: { name: 'ป.5-6',  baseStat: 300,  maxXP: 900  },
  4: { name: 'ม.ต้น',  baseStat: 400,  maxXP: 1200 },
  5: { name: 'ม.ปลาย', baseStat: 500, maxXP: 1500 },
}

export function calcCreatureStats(egg) {
  const tier = TIERS[egg.tier || 0]
  const base = tier.baseStat
  const xpT = egg.xpThai || 0
  const xpM = egg.xpMath || 0
  const xpE = egg.xpEng  || 0
  const total = xpT + xpM + xpE || 1

  const tShare = xpT / total
  const mShare = xpM / total
  const eShare = xpE / total

  const streakBonus = 1 + Math.floor((egg.streak || 0) / 7) * 0.1
  const critRate    = Math.min(0.5, (egg.acc || 70) / 200)

  const seed = (xpT * 7 + xpM * 13 + xpE * 17) >>> 0
  const vary = (offset) => 0.95 + ((seed + offset * 97) % 100) / 100 * 0.10

  const HP  = base * (1.50 + 0.30 * tShare + 0.10 * mShare + 0.10 * eShare)
  const ATK = base * (0.40 + 0.30 * mShare + 0.20 * eShare + 0.10 * tShare)
  const DEF = base * (0.40 + 0.30 * tShare + 0.20 * mShare + 0.10 * eShare)
  const SPD = base * (0.40 + 0.30 * eShare + 0.20 * mShare + 0.10 * tShare)

  return {
    HP:      Math.round(HP  * streakBonus * vary(1)),
    ATK:     Math.round(ATK * streakBonus * vary(2)),
    DEF:     Math.round(DEF * streakBonus * vary(3)),
    SPD:     Math.round(SPD * streakBonus * vary(4)),
    CRIT:    critRate,
    tier:    egg.tier || 0,
    tierName: tier.name,
  }
}
