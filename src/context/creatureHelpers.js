import { HATCH_CREATURES } from '../config/gameConfig.js'

export function getCreatureForHatch(state) {
  const tSum = (state.xpThai || 0) + (state.xpEng || 0) + (state.xpMath || 0) || 1
  const balance = 1 - (Math.abs(state.xpThai - state.xpEng) + Math.abs(state.xpEng - state.xpMath) + Math.abs(state.xpThai - state.xpMath)) / (tSum * 2)
  let cat = 'thai'
  if (balance > 0.75) {
    cat = 'hybrid'
  } else {
    const sa = [{v:state.xpThai,c:'thai'},{v:state.xpEng,c:'eng'},{v:state.xpMath,c:'math'}]
    sa.sort((a,b) => b.v - a.v)
    cat = sa[0].c
  }
  const pool = HATCH_CREATURES[cat] || HATCH_CREATURES.thai
  const idx = Math.floor(Math.random() * pool.length)
  return { ...pool[idx], cat }
}
