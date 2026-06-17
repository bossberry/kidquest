import { useCallback, useLayoutEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { getBattleSubject } from '../lib/battleSubject.js'
import { ENEMY_DATA } from '../config/enemyConfig.js'
import { WORLD_LEVELS } from '../config/worldConfig.js'
import { playSFX } from '../lib/audio.js'

export default function useBattleTrigger({
  stateRef, screenIdRef, gameRef, setEncounterFlash, setBossConfirm, BOSS_TILE,
}) {
  const { dispatch } = useAppState()
  const triggerBattleRef    = useRef(null)
  const battleDispatchedRef = useRef(false)
  const battlePendingRef    = useRef(false)

  const triggerBattle = useCallback((enemy) => {
    if (stateRef.current.pendingBattle) return
    const subject = getBattleSubject(stateRef.current.sessionLog, stateRef.current)
    const level   = stateRef.current.subjectLevels?.[subject] ?? 1
    if (enemy.id !== '_grass_') {
      try {
        sessionStorage.setItem('kq_last_battle', JSON.stringify({
          screenId: screenIdRef.current, enemyType: enemy.type,
        }))
      } catch {}
    }
    setEncounterFlash(true)
    setTimeout(() => setEncounterFlash(false), 80)
    const eData = ENEMY_DATA[enemy.type] || { hp: 24, atk: 4, nameTH: 'ศัตรู' }
    const activeEgg = (stateRef.current.hatchedEggs || []).find(e => e.id === stateRef.current.party?.[0]) || (stateRef.current.hatchedEggs || [])[0]
    const playerLevel = activeEgg?.battleLevel ?? 1
    const scaleFactor = 1.0 + (playerLevel - 1) * 0.15
    const cappedScale = Math.min(scaleFactor, 4.0)
    dispatch({ type: ACTIONS.SET_PENDING_BATTLE, payload: {
      position: { screen: screenIdRef.current, tileX: gameRef.current?.col ?? 0, tileY: gameRef.current?.row ?? 0 },
      enemy: {
        type: enemy.type, subject, level,
        hp:  Math.max(30, Math.round((eData.hp  ?? 24) * cappedScale)),
        atk: Math.max(4,  Math.round((eData.atk ??  4) * cappedScale)),
        def: Math.max(0,  Math.round((eData.def ??  0) * cappedScale * 0.5)),
        nameTH: eData.nameTH ?? '?',
      },
    }})
  }, [dispatch, stateRef, screenIdRef, gameRef, setEncounterFlash]) // eslint-disable-line

  triggerBattleRef.current = triggerBattle

  // Sync pending flag after every commit — keeps RAF loop in sync with React state.
  useLayoutEffect(() => {
    battlePendingRef.current = !!stateRef.current.pendingBattle
    if (!stateRef.current.pendingBattle) battleDispatchedRef.current = false
  })

  const enterBossBattle = useCallback(() => {
    playSFX('battle_start')
    setBossConfirm(false)
    const wLevel = stateRef.current.worldLevel ?? 0
    const worldDef = WORLD_LEVELS[wLevel]
    if (!worldDef) return
    const subject = getBattleSubject(stateRef.current.sessionLog, stateRef.current)
    const level   = stateRef.current.subjectLevels?.[subject] ?? 1
    dispatch({ type: ACTIONS.SET_PENDING_BATTLE, payload: {
      position: { screen: 'BOSS', tileX: BOSS_TILE.col, tileY: BOSS_TILE.row },
      enemy: {
        type: worldDef.bossEnemy, subject, level,
        hp: worldDef.bossHP, atk: worldDef.bossATK, def: worldDef.bossDEF,
        nameTH: worldDef.bossNameTH, isBossBattle: true,
      },
    }})
  }, [dispatch, stateRef, setBossConfirm, BOSS_TILE]) // eslint-disable-line

  return { triggerBattle, triggerBattleRef, battleDispatchedRef, battlePendingRef, enterBossBattle }
}
