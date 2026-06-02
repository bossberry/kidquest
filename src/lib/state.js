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
  try {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('eggs')
          .select('state_json')
          .eq('user_id', user.id)
          .single()
        if (data?.state_json) {
          localStorage.setItem(KEY, JSON.stringify(data.state_json))
          return data.state_json
        }
      }
    }
  } catch (e) {
    console.log('Supabase load failed, using localStorage')
  }
  try {
    return JSON.parse(localStorage.getItem(KEY)) || defaultState()
  } catch (e) {
    return defaultState()
  }
}

export function saveState(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
  _sbSave(s)
}

async function _sbSave(s) {
  try {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('eggs').upsert({
        user_id: user.id,
        child_name: s.name || 'โชแปง',
        state_json: s,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
    }
  } catch (e) {
    console.log('Supabase save failed, using localStorage only')
  }
}
