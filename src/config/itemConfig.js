export const BATTLE_ITEMS = {
  scroll:  { key: 'scroll',  name_th: 'ม้วนใบ',   color: '#e8c040', effect: 'skip'        },
  thunder: { key: 'thunder', name_th: 'สายฟ้า',   color: '#66aaff', effect: 'free_attack' },
  gem:     { key: 'gem',     name_th: 'อัญมณี',   color: '#cc44cc', effect: 'double_xp'   },
  mirror:  { key: 'mirror',  name_th: 'กระจก',    color: '#44cccc', effect: 'hint'         },
  clover:  { key: 'clover',  name_th: 'โคลเวอร์', color: '#44cc44', effect: 'block'        },
}

const DROP_TABLE = [
  { key: 'scroll',  weight: 30 },
  { key: 'thunder', weight: 20 },
  { key: 'gem',     weight: 15 },
  { key: 'mirror',  weight: 20 },
  { key: 'clover',  weight: 15 },
]

// 55% chance of a battle item drop; returns item key or null
export function rollBattleItem() {
  if (Math.random() > 0.55) return null
  const total = DROP_TABLE.reduce((s, d) => s + d.weight, 0)
  let r = Math.random() * total
  for (const d of DROP_TABLE) {
    r -= d.weight
    if (r <= 0) return d.key
  }
  return DROP_TABLE[DROP_TABLE.length - 1].key
}
