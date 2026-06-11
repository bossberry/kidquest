// Shared subject readiness computation — used by Report.jsx and battleSubject.js

export function computeReadiness(sessionLog, world) {
  const sessions = (sessionLog || []).filter(s => s.world === world).slice(-10)
  if (sessions.length === 0) return 'notready'
  const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length
  const goodRuns = sessions.filter(s => (s.score || 0) >= 0.80).length
  const completionRate = sessions.filter(s => s.completed).length / sessions.length
  if (avgScore >= 0.85 && goodRuns >= 3 && completionRate >= 0.80) return 'strong'
  if (avgScore >= 0.70 && goodRuns >= 2) return 'comfortable'
  return 'exploring'
}
