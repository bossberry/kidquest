import { ENEMY_DATA } from '../config/enemyConfig.js'
import { computeReadiness } from './subjectReadiness.js'

const SUBJECTS = ['thai', 'math', 'eng']
// Lower rank = needs more practice → should be selected first
const RANK = { exploring: 0, comfortable: 1, notready: 1, strong: 2 }

export function getBattleSubject(enemyType, sessionLog) {
  const enemyPreferred = ENEMY_DATA[enemyType]?.subject ?? 'thai'

  if (!sessionLog?.length) return enemyPreferred

  const readiness = {}
  for (const s of SUBJECTS) readiness[s] = computeReadiness(sessionLog, s)

  // Layer 1: child is 'exploring' on any subject → use that (needs most practice)
  const exploring = SUBJECTS.find(s => readiness[s] === 'exploring')
  if (exploring) return exploring

  // Layer 2: child is 'comfortable' on enemy's preferred → reinforce that subject
  if (readiness[enemyPreferred] === 'comfortable') return enemyPreferred

  // Layer 3: sort by rank ascending, return weakest subject
  return [...SUBJECTS].sort((a, b) => RANK[readiness[a]] - RANK[readiness[b]])[0]
}
