export const ELEMENTS = {
  lightning: {
    name: 'สายฟ้า',
    color: '#ffe040',
    tiers: [
      { name: 'ฟ้าแลบ',        minCombo: 1 },
      { name: 'สายฟ้า',        minCombo: 3 },
      { name: 'พายุฟ้าผ่า',    minCombo: 5 },
      { name: 'ฟ้าผ่ามหาศาล', minCombo: 8 },
    ],
  },
  fire: {
    name: 'ไฟ',
    color: '#ff6020',
    tiers: [
      { name: 'ประกายไฟ',   minCombo: 1 },
      { name: 'ลูกไฟ',      minCombo: 3 },
      { name: 'คลื่นเพลิง', minCombo: 5 },
      { name: 'อุกกาบาต',   minCombo: 8 },
    ],
  },
  ice: {
    name: 'น้ำแข็ง',
    color: '#80e8ff',
    tiers: [
      { name: 'เกล็ดน้ำแข็ง', minCombo: 1 },
      { name: 'หอกน้ำแข็ง',   minCombo: 3 },
      { name: 'พายุหิมะ',     minCombo: 5 },
      { name: 'แช่แข็ง',      minCombo: 8 },
    ],
  },
  wind: {
    name: 'ลม',
    color: '#a0e880',
    tiers: [
      { name: 'สายลม',      minCombo: 1 },
      { name: 'ลมแรง',      minCombo: 3 },
      { name: 'ลมพายุ',     minCombo: 5 },
      { name: 'ลมพายุหมุน', minCombo: 8 },
    ],
  },
  laser: {
    name: 'เลเซอร์',
    color: '#ff40ff',
    tiers: [
      { name: 'แสงเลเซอร์',    minCombo: 1 },
      { name: 'ลำแสง',         minCombo: 3 },
      { name: 'เลเซอร์ระเบิด', minCombo: 5 },
      { name: 'ปรมาณู',        minCombo: 8 },
    ],
  },
  water: {
    name: 'น้ำ',
    color: '#4088ff',
    tiers: [
      { name: 'ฟองน้ำ',   minCombo: 1 },
      { name: 'คลื่นน้ำ', minCombo: 3 },
      { name: 'น้ำท่วม',  minCombo: 5 },
      { name: 'คลื่นยักษ์', minCombo: 8 },
    ],
  },
}

export function getElementTier(element, combo) {
  const tiers = ELEMENTS[element].tiers
  let tier = tiers[0]
  for (const t of tiers) {
    if (combo >= t.minCombo) tier = t
  }
  const tierIndex = tiers.indexOf(tier)
  return { tier, tierIndex, isMax: tierIndex === tiers.length - 1 }
}
