// Green Meadow world config — screens, connections, themes (Phase 1)
// 3×3 grid (Pokémon FireRed model):  TL TM TR / ML MC MR / BL BM BR

export const WORLD_REGIONS = {
  'green-meadow': { label: 'ทุ่งโคลเวอร์', entryScreen: 'BM' },
}

// connects: N/S/E/W → screen id, or null (no exit in that direction)
export const SCREENS = {
  BM: { label: 'ทางเดินเริ่มต้น', region: 'green-meadow', connects: { N: 'MC', E: 'BR', W: 'BL', S: null } },
  MC: { label: 'จัตุรัสเมือง',    region: 'green-meadow', connects: { N: 'TM', E: 'MR', W: 'ML', S: 'BM' } },
  TM: { label: 'บ้านคุณยายเต่า',  region: 'green-meadow', connects: { N: null, E: 'TR', W: 'TL', S: 'MC' } },
  TL: { label: 'ทุ่งดอกไม้',      region: 'green-meadow', connects: { N: null, E: 'TM', W: null, S: 'ML' } },
  TR: { label: 'ทางเข้าป่า',      region: 'green-meadow', connects: { N: null, E: null, W: 'TM', S: 'MR' } },
  ML: { label: 'ข้ามแม่น้ำ',      region: 'green-meadow', connects: { N: 'TL', E: 'MC', W: null, S: 'BL' } },
  MR: { label: 'เนินโคลเวอร์',    region: 'green-meadow', connects: { N: 'TR', E: null, W: 'MC', S: 'BR' } },
  BL: { label: 'สระน้ำต้นหลิว',   region: 'green-meadow', connects: { N: 'ML', E: 'BM', W: null, S: null } },
  BR: { label: 'ทุ่งกษัตริย์แบร์', region: 'green-meadow', connects: { N: 'MR', E: null, W: 'BM', S: null } },
}

// Visual palette per screen for placeholder backgrounds (Phase 1)
export const SCREEN_THEMES = {
  BM: { skyA: '#7EC8E3', skyB: '#C0E8FF', grdA: '#82C47A', grdB: '#5E9E56', icon: '🌿' },
  MC: { skyA: '#89C4E1', skyB: '#BED8EE', grdA: '#6CAF6A', grdB: '#4A8A48', icon: '🏘️' },
  TM: { skyA: '#FFD070', skyB: '#FFE8A0', grdA: '#7CB87A', grdB: '#5A9A5A', icon: '🏡' },
  TL: { skyA: '#87CEEB', skyB: '#D0EAFF', grdA: '#98D088', grdB: '#70B060', icon: '🌸' },
  TR: { skyA: '#5A9A5A', skyB: '#3A7A3A', grdA: '#3A6A3A', grdB: '#284A28', icon: '🌲' },
  ML: { skyA: '#7ABCD4', skyB: '#A8D4E8', grdA: '#4E8A6E', grdB: '#3A6A52', icon: '🌊' },
  MR: { skyA: '#A0D890', skyB: '#C8EAB8', grdA: '#78BC68', grdB: '#58A048', icon: '🍀' },
  BL: { skyA: '#6890C0', skyB: '#90B8D8', grdA: '#3A7A5A', grdB: '#284A3A', icon: '🌿' },
  BR: { skyA: '#F0C840', skyB: '#FFE070', grdA: '#90CC80', grdB: '#68AA58', icon: '👑' },
}
