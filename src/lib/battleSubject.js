import { computeReadiness } from './subjectReadiness.js'
import { LEVELS } from '../config/gameConfig.js'

const SUBJECTS = ['thai', 'math', 'eng']
// Priority order: weakest first
const PRIORITY = ['exploring', 'comfortable', 'notready', 'strong']

export function getBattleSubject(sessionLog, state) {
  const dailyCount = state?.dailyBattleRounds ?? 0

  if (!sessionLog?.length) {
    // No session data yet — rotate evenly so all subjects get practice
    return SUBJECTS[dailyCount % SUBJECTS.length]
  }

  const readiness = {}
  for (const s of SUBJECTS) readiness[s] = computeReadiness(sessionLog, s)

  // Sort by readiness priority (exploring first = most needs practice)
  const sorted = [...SUBJECTS].sort(
    (a, b) => PRIORITY.indexOf(readiness[a]) - PRIORITY.indexOf(readiness[b])
  )

  // Rotate among subjects tied at the same (weakest) readiness level
  const weakestLevel = readiness[sorted[0]]
  const tied = sorted.filter(s => readiness[s] === weakestLevel)
  return tied[dailyCount % tied.length]
}

export function getBattleLevel(subject, state) {
  const XP_KEY = { thai: 'xpThai', math: 'xpMath', eng: 'xpEng' }
  const xp = state[XP_KEY[subject]] ?? 0
  const levels = LEVELS[subject]
  if (!levels?.length) return 1
  // Use last entry's id as the ceiling so getLevelConfig always finds a valid level
  const maxId = levels[levels.length - 1].id
  return Math.min(Math.floor(xp / 120) + 1, maxId)
}
