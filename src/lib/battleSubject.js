import { computeReadiness } from './subjectReadiness.js'
import { LEVELS } from '../config/gameConfig.js'

const SUBJECTS = ['thai', 'math', 'eng']
// Priority: notready (never played) beats comfortable — child must see every subject
const PRIORITY = ['exploring', 'notready', 'comfortable', 'strong']

export function getBattleSubject(sessionLog, state) {
  const dailyCount = state?.dailyBattleRounds ?? 0

  if (!sessionLog?.length) {
    return SUBJECTS[dailyCount % SUBJECTS.length]
  }

  const readiness = {}
  for (const s of SUBJECTS) readiness[s] = computeReadiness(sessionLog, s)

  // Variety safeguard: if last 3 sessions were same subject, rotate away
  const recent = (sessionLog || []).slice(-3).map(s => s.world)
  const stuck = recent.length === 3 && recent.every(w => w === recent[0])
  if (stuck) {
    const other = SUBJECTS.filter(s => s !== recent[0])
    return other[dailyCount % other.length]
  }

  const sorted = [...SUBJECTS].sort(
    (a, b) => PRIORITY.indexOf(readiness[a]) - PRIORITY.indexOf(readiness[b])
  )

  const weakestLevel = readiness[sorted[0]]
  const tied = sorted.filter(s => readiness[s] === weakestLevel)
  return tied[dailyCount % tied.length]
}

export function getBattleLevel(subject, state) {
  const XP_KEY = { thai: 'xpThai', math: 'xpMath', eng: 'xpEng' }
  const xp = state[XP_KEY[subject]] ?? 0
  const levels = LEVELS[subject]
  if (!levels?.length) return 1
  const maxId = levels[levels.length - 1].id
  const maxUnlocked = Math.min(Math.floor(xp / 120) + 1, maxId)
  // Adaptive rotation: easy → hard → medium every 3 battles
  const rotation = [1, maxUnlocked, Math.ceil(maxUnlocked / 2)]
  const idx = (state?.dailyBattleRounds ?? 0) % 3
  return Math.max(1, rotation[idx])
}
