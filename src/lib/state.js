import { supabase } from './supabase.js'

export const KEY = 'kq_state'

export function defaultState() {
  return {
    name: 'โชแปง', grade: 0,
    xpThai: 0, xpEng: 0, xpMath: 0,
    streak: 0, rounds: 0, badges: 0,
    eggDow: new Date().getDay(),
    eggMonth: new Date().getMonth() + 1,
    eggDay: new Date().getDate(),
    eggHour: new Date().getHours(),
    firstSubject: -1,
    speed: 50, acc: 70, mins: 0,
    happiness: 80,
    hatched: false,
    hatchedCreature: null,
    items: { food: 2, star: 0, ribbon: 0, potion: 0 },
    xpBoost: 1, xpBoostEnd: 0,
    thaiMastery: {}, thSpellLevel: 1,
    dailyRounds: 0, lastPlayDate: '',
    eggRunLives: 3, lastRunDate: '',
    subjectLevels: { thai: 1, math: 1, eng: 1 },
    levelMastery: { thai: {}, math: {}, eng: {} },
    seenTeach: [],
    sessionXP: 0,
    currentWorld: 'thai',
  }
}

export async function loadState() {
  console.log('[KQ:load] start')
  try {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('[KQ:load] user =', user.email)
        const { data, error } = await supabase
          .from('eggs')
          .select('state_json')
          .eq('user_id', user.id)
          .single()
        if (data?.state_json) {
          console.log('[KQ:load] cloud has data → using cloud')
          localStorage.setItem(KEY, JSON.stringify(data.state_json))
          return data.state_json
        }
        console.log('[KQ:load] cloud empty (error:', error?.code, ') → using localStorage')
      } else {
        console.log('[KQ:load] no user → using localStorage')
      }
    }
  } catch (e) {
    console.log('[KQ:load] failed:', e.message)
  }
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || defaultState()
    console.log('[KQ:load] localStorage xpThai =', s.xpThai)
    return s
  } catch (e) {
    return defaultState()
  }
}

// Push any state object to Supabase (used by StateContext on SIGNED_IN)
export async function syncToSupabase(s) {
  try {
    if (!supabase) { console.log('[KQ:sync] no client'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.log('[KQ:sync] no user'); return }
    console.log('[KQ:sync] pushing state for', user.email, '— xpThai:', s.xpThai, 'rounds:', s.rounds)
    const { error } = await supabase.from('eggs').upsert({
      user_id: user.id,
      child_name: s.name || 'โชแปง',
      state_json: s,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) console.log('[KQ:sync] upsert error:', error.message)
    else console.log('[KQ:sync] ✓ done')
  } catch (e) {
    console.log('[KQ:sync] failed:', e.message)
  }
}

export function saveState(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
  syncToSupabase(s)
}
