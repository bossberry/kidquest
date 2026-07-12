import { useAppState, ACTIONS, dispatchAddCoins } from '../context/StateContext.jsx'
import { playTone, playSFX, playElementSFX, playBGM } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import { getElementTier } from '../config/elementConfig.js'
import { playElementAttack, playElementBlast } from '../lib/elementAnimations.js'
import { BATTLE_ITEMS, rollBattleItem } from '../config/itemConfig.js'
import { MONSTER_DROPS, ROOM_ITEMS } from '../lib/roomItems.js'
import { COSMETIC_ITEMS } from '../egg/eggCosmeticLayer.js'

/**
 * useBattleCombat — owns the core combat resolution logic: fireHit, fireMiss,
 * showVictory, and useBattleItem. This is the battle "engine" — anything that
 * changes enemy HP, creature HP, combo state, or triggers victory/faint lives here.
 *
 * Takes every piece of state/refs/props it needs as explicit parameters so behavior
 * stays byte-for-byte identical to the original inline implementation.
 */
export function useBattleCombat(params) {
  const {
    // props
    q, cur, total, subject, isWorldBattle, isBoss, isBossBattle,
    enemy, enemyData, creature, creatureStats,
    onCorrect, onWrong, onNext, onComplete, onCreatureTakeDamage, onBattleXP, onFaint,
    showReturnButton, maxHP, dmgBase, battleElement,
    // refs
    mountedRef, lockedRef, battleOverRef, comboRef, ultimateRef, enemyHPRef,
    responseTimeRef, shieldActiveRef, xpBoostActiveRef,
    battleFieldRef, eggDivRef, enemyDivRef,
    // from useBattleEffects
    spawnEffect, overlayCanvasRef,
    // state setters
    setEnemyHP, setLocalCreatureHP, setXpBoost, setSelectedCard, setHitFlash,
    setEnemyHurt, setDmgFloat, setBattleLog, setComboDisplay, setUltimateReady,
    setCritFlash, setEnemyDefeating, setVictoryMode, setVictoryBonus, setVictoryDrop,
    setAttackLabel, setMissCard, setEggHitFlash, setEggAnimClass,
    setItemUsed, setEliminated, setShieldActive,
    setPlayerHP, setEnemyLunge,
    setTimeoutHintActive,
    // SPEC GAME-B §B.4 (2026-07-12) — element charge meter + screen shake
    chargeRef, setChargeMeter, setScreenShake, onHintUsed,
    // values needed for read-only checks
    localCreatureHP, itemUsed, victoryMode,
  } = params

  const { state, dispatch } = useAppState()

  function fireHit(_idx) {
    dispatch({
      type: ACTIONS.LOG_BATTLE_ANSWER,
      payload: {
        subject,
        question: q?.question ?? q?.ttsWord ?? q?.word ?? String(q?.answer ?? ''),
        correct: true,
        responseTimeMs: responseTimeRef.current,
        battleLevel: state.battleLevel,
        timestamp: Date.now(),
        nodeId: q?.nodeId,
        countsForMastery: q?.countsForMastery,
        inputMode: q?.inputMode,
      },
    })
    const { earned, isCrit } = onCorrect()
    if (isWorldBattle && (creature?.bondMeter ?? 0) >= 75) {
      setLocalCreatureHP(h => Math.min(creatureStats?.HP ?? 999, h + 1))
    }
    if (xpBoostActiveRef.current) {
      xpBoostActiveRef.current = false
      if (mountedRef.current) setXpBoost(false)
      dispatch({ type: ACTIONS.ADD_XP, payload: { world: subject, amount: earned } })
    }
    comboRef.current += 1
    const combo = comboRef.current
    const isUlt = ultimateRef.current
    let mult = 1
    if (isUlt) {
      mult = 2; ultimateRef.current = false
      if (mountedRef.current) setUltimateReady(false)
    } else if (combo >= 4 || isCrit) {
      mult = 1.5
    }

    // Spawn canvas effect
    if (isUlt)             spawnEffect('ultimate')
    else if (combo >= 3)   spawnEffect('combo')
    else                   spawnEffect('attack')

    // Element attack animation
    const { tier: elTier, tierIndex: elTierIndex } = getElementTier(battleElement, combo)
    playElementSFX(battleElement, elTierIndex)
    setAttackLabel(elTier.name)
    setTimeout(() => { if (mountedRef.current) setAttackLabel(null) }, 900)
    const field   = battleFieldRef.current
    const eggEl   = eggDivRef.current
    const enemyEl = enemyDivRef.current
    if (field && eggEl && enemyEl && overlayCanvasRef.current) {
      const fr = field.getBoundingClientRect()
      const er = eggEl.getBoundingClientRect()
      const nr = enemyEl.getBoundingClientRect()
      playElementAttack(
        overlayCanvasRef.current,
        battleElement,
        elTierIndex,
        { x: er.left + er.width / 2 - fr.left, y: er.top + er.height / 2 - fr.top },
        { x: nr.left + nr.width / 2 - fr.left, y: nr.top + nr.height / 2 - fr.top },
        null,
      )
    }

    // SPEC GAME-B §B.4 (2026-07-12) — element skills charge meter. Consecutive
    // CORRECT answers charge a 3-segment meter (fireMiss never touches
    // chargeRef at all — a wrong answer PAUSES progress rather than
    // resetting it, "teaches streak value without punishing errors" per the
    // spec, deliberately gentler than the existing comboRef above which DOES
    // reset on a miss). Full meter = this hit lands as a big blast (bonus
    // damage + a reused-A.3-aura particle burst + a <=250ms screen shake),
    // then resets to 0.
    chargeRef.current = Math.min(3, chargeRef.current + 1)
    const chargeFull = chargeRef.current >= 3
    if (mountedRef.current) setChargeMeter(chargeRef.current)

    const baseDmg = isWorldBattle
      ? Math.round(Math.max(1, (creatureStats?.ATK ?? 20) - (enemy?.def ?? 0)) * mult)
      : Math.ceil(dmgBase * mult)
    const dmg   = chargeFull ? baseDmg * 2 : baseDmg
    const newHP = Math.max(0, enemyHPRef.current - dmg)
    enemyHPRef.current = newHP
    if (mountedRef.current) setEnemyHP(newHP)

    if (chargeFull) {
      chargeRef.current = 0
      if (mountedRef.current) {
        setChargeMeter(0)
        setScreenShake(true)
        setTimeout(() => mountedRef.current && setScreenShake(false), 250)
      }
      playSFX('powerup')
      const field2 = battleFieldRef.current
      const enemyEl2 = enemyDivRef.current
      if (field2 && enemyEl2 && overlayCanvasRef.current) {
        const fr2 = field2.getBoundingClientRect()
        const nr2 = enemyEl2.getBoundingClientRect()
        playElementBlast(
          overlayCanvasRef.current, battleElement,
          nr2.left + nr2.width / 2 - fr2.left, nr2.top + nr2.height / 2 - fr2.top,
        )
      }
    }
    if (mountedRef.current) {
      setSelectedCard(-1)
      setHitFlash(true)
      setTimeout(() => mountedRef.current && setHitFlash(false), 300)
      setEnemyHurt(true)
      setTimeout(() => mountedRef.current && setEnemyHurt(false), 400)
      setDmgFloat({ val: dmg, isCrit: mult > 1, isUlt })
      setTimeout(() => mountedRef.current && setDmgFloat(null), 950)
    }
    let log
    if (isUlt) {
      log = '💥 ULTIMATE!! ×2'
      playTone('ultimate'); playSFX('ultra_move')
      if (mountedRef.current) { setCritFlash(true); setTimeout(() => mountedRef.current && setCritFlash(false), 400) }
      spawnConfetti(25)
    } else if (combo >= 4) {
      log = `⚡ CRITICAL! ×1.5  ${combo} Combo`
      playTone('streak')
      if (mountedRef.current) { setCritFlash(true); setTimeout(() => mountedRef.current && setCritFlash(false), 250) }
      spawnConfetti(8)
    } else if (combo === 3) {
      log = '🔥 คอมโบ! 3 ต่อเนื่อง'; playTone('combo'); playSFX('combo')
    } else if (combo === 2) {
      log = '✨ คอมโบ! 2 ต่อเนื่อง'; playTone('combo'); playSFX('combo')
    } else {
      log = `⚔️ โจมตี! +${earned} XP`; playTone('correct'); playSFX('attack_hit')
    }
    if (mountedRef.current) { setBattleLog(log); setComboDisplay(Math.min(combo, 3)) }
    if (!isUlt && !ultimateRef.current && combo >= 3) {
      ultimateRef.current = true
      if (mountedRef.current) {
        setUltimateReady(true)
        setTimeout(() => mountedRef.current && setBattleLog('🌟 ท่าพิเศษพร้อม!'), 1100)
      }
    }
    // Victory from HP=0; in world battle questions loop, no question-count victory
    const isOver = newHP <= 0 || (!isWorldBattle && cur + 1 >= total)
    setTimeout(() => {
      if (!mountedRef.current) return
      if (isOver) {
        enemyHPRef.current = 0; setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 350)
      } else {
        lockedRef.current = false; onNext()
      }
    }, 700)
  }

  function fireMiss(idx) {
    dispatch({
      type: ACTIONS.LOG_BATTLE_ANSWER,
      payload: {
        subject,
        question: q?.question ?? q?.ttsWord ?? q?.word ?? String(q?.answer ?? ''),
        correct: false,
        responseTimeMs: responseTimeRef.current,
        battleLevel: state.battleLevel,
        timestamp: Date.now(),
        nodeId: q?.nodeId,
        countsForMastery: q?.countsForMastery,
        inputMode: q?.inputMode,
      },
    })
    onWrong()
    comboRef.current = 0
    if (ultimateRef.current) { ultimateRef.current = false; if (mountedRef.current) setUltimateReady(false) }
    // Shield absorbs the first miss
    if (shieldActiveRef.current) {
      shieldActiveRef.current = false
      if (mountedRef.current) {
        setShieldActive(false)
        setSelectedCard(-1)
        setMissCard(idx)
        setTimeout(() => mountedRef.current && setMissCard(-1), 550)
        setBattleLog('โล่ป้องกัน! ไม่ได้รับความเสียหาย!')
        setComboDisplay(0)
      }
      playTone('miss')
      setTimeout(() => {
        if (!mountedRef.current) return
        if (!isWorldBattle && cur + 1 >= total) {
          enemyHPRef.current = 0; setEnemyHP(0)
          setTimeout(() => mountedRef.current && showVictory(), 350)
        } else {
          lockedRef.current = false; onNext()
        }
      }, 600)
      return
    }

    // World battle: SPD dodge + creature damage + faint check
    let faintTriggered = false
    let missLog = '💨 โจมตีพลาด!'
    if (isWorldBattle) {
      const dodgeChance = 0.20
      const dodged      = Math.random() < dodgeChance
      if (dodged) {
        missLog = '🌀 หลบได้!'
      } else {
        const rawDmg   = enemyData?.atk ?? enemy.atk ?? 10
        const def      = creatureStats?.DEF ?? 10
        const finalDmg = Math.max(1, Math.round(rawDmg - def * 0.5))
        missLog = `💥 โดนโจมตี -${finalDmg} HP!`
        onCreatureTakeDamage?.(finalDmg)
        const newCreatureHP = localCreatureHP - finalDmg
        setLocalCreatureHP(Math.max(0, newCreatureHP))
        if (newCreatureHP <= 0) {
          faintTriggered = true
          battleOverRef.current = true
          missLog = '😴 ตัวเอกหมดแรง...'
        }
      }
    }

    spawnEffect('miss')
    if (mountedRef.current) {
      setSelectedCard(-1)
      setMissCard(idx)
      setTimeout(() => mountedRef.current && setMissCard(-1), 550)
      setBattleLog(missLog)
      setComboDisplay(0)
      if (!isWorldBattle) setPlayerHP(h => Math.max(8, h - 8))
      setTimeout(() => {
        if (!mountedRef.current) return
        setEnemyLunge(true)
        setTimeout(() => mountedRef.current && setEnemyLunge(false), 300)
      }, 220)
      setTimeout(() => {
        if (!mountedRef.current) return
        setEggHitFlash(true)
        setTimeout(() => mountedRef.current && setEggHitFlash(false), 200)
        setEggAnimClass('shake')
        playSFX('player_hit')
        setTimeout(() => mountedRef.current && setEggAnimClass(''), 400)
      }, 300)
    }
    playTone('miss'); playSFX('attack_miss')

    if (faintTriggered) {
      setTimeout(() => { if (mountedRef.current) onFaint?.() }, 1000)
      return
    }
    setTimeout(() => {
      if (!mountedRef.current) return
      if (!isWorldBattle && cur + 1 >= total) {
        enemyHPRef.current = 0; setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 350)
      } else {
        lockedRef.current = false; onNext()
      }
    }, 600)
  }

  function showVictory() {
    battleOverRef.current = true
    setEnemyDefeating(true)
    setVictoryMode(true)
    setBattleLog(`${enemy.name} หมดแรง!`)
    playTone('fanfare'); playSFX('victory')
    playBGM('victory') // replaces the battle track; WorldBattle's onComplete/onFaint stopBGM() ends it
    spawnConfetti(35)
    // 10% chance to drop a battle item on victory
    if (Math.random() < 0.10) {
      const bonus = rollBattleItem()
      if (bonus) {
        dispatch({ type: ACTIONS.DROP_BATTLE_ITEM, payload: { key: bonus } })
        if (mountedRef.current) setVictoryBonus(bonus)
      }
    }
    // 30% chance a real monster (not a boss) drops a room-furniture item
    // (2026-07-07 — replaces the earlier manual crafting-table system's sole
    // acquisition path with a second, direct one). Already-owned items pay a
    // 15-coin consolation instead of being re-dropped.
    // SPEC GAME-B §B.1 (2026-07-10): 2 of MONSTER_DROPS' candidates
    // (turtle_shell/ninja_suit) are now wearable cosmetics, not furniture —
    // this branches on which catalog the rolled itemId actually belongs to
    // so it lands in ownedItems (equippable via the dressing room) instead
    // of ownedRoomItems. victoryDrop's badge (icon+nameTh) renders either
    // shape identically since both catalogs carry those 2 fields.
    if (isWorldBattle && enemy?.type && !enemy?.isBossBattle) {
      const dropPool = MONSTER_DROPS[enemy.type]
      if (dropPool && Math.random() < 0.30) {
        const itemId = dropPool[Math.floor(Math.random() * dropPool.length)]
        const cosmeticItem = COSMETIC_ITEMS.find(i => i.id === itemId)
        if (cosmeticItem) {
          if ((state.ownedItems || []).includes(itemId)) {
            dispatchAddCoins(dispatch, 15)
          } else {
            dispatch({ type: ACTIONS.ADD_OWNED_ITEM, payload: { itemId } })
            if (mountedRef.current) setVictoryDrop?.(cosmeticItem)
          }
        } else if ((state.ownedRoomItems || []).includes(itemId)) {
          dispatchAddCoins(dispatch, 15)
        } else {
          dispatch({ type: ACTIONS.ADD_OWNED_ROOM_ITEM, payload: { itemId } })
          const item = ROOM_ITEMS.find(i => i.id === itemId)
          if (mountedRef.current && item) setVictoryDrop?.(item)
        }
      }
    }
    // XP orbs fly from enemy to egg
    setTimeout(() => {
      if (!mountedRef.current) return
      spawnEffect('xp')
      setBattleLog('✨ ไข่ได้รับ XP!')
      playTone('item')
      if (isWorldBattle && onBattleXP) {
        onBattleXP(10 + (comboRef.current >= 3 ? 5 : 0))
      }
    }, 750)
    // Auto-advance only when no return button shown
    // Use onComplete if provided (handles early-KO finalization); else fall back to onNext
    if (!showReturnButton) {
      setTimeout(() => { if (mountedRef.current) (onComplete || onNext)() }, 2100)
    }
  }

  function useBattleItemFn(itemKey) {
    if (itemUsed || lockedRef.current || victoryMode || battleOverRef.current) return
    if ((state.battleItems?.[itemKey] || 0) <= 0) return

    dispatch({ type: ACTIONS.USE_BATTLE_ITEM, payload: { key: itemKey } })
    setItemUsed(true)
    playSFX('item_collect')

    const effect = BATTLE_ITEMS[itemKey]?.effect

    if (effect === 'skip') {
      setBattleLog('ม้วนใบ! ข้ามคำถาม')
      lockedRef.current = true
      setTimeout(() => {
        if (!mountedRef.current) return
        // World battles loop infinitely — victory only from enemy HP=0
        if (isWorldBattle) {
          lockedRef.current = false; onNext()
        } else if (cur + 1 >= total) {
          enemyHPRef.current = 0; setEnemyHP(0)
          showVictory()
        } else {
          lockedRef.current = false; onNext()
        }
      }, 500)
    } else if (effect === 'free_attack') {
      const dmg = 15
      const newHP = Math.max(0, enemyHPRef.current - dmg)
      enemyHPRef.current = newHP
      setEnemyHP(newHP)
      setDmgFloat({ val: dmg, isCrit: true, isUlt: false })
      setTimeout(() => mountedRef.current && setDmgFloat(null), 950)
      setHitFlash(true)
      setTimeout(() => mountedRef.current && setHitFlash(false), 300)
      setBattleLog('สายฟ้า! โจมตีอิสระ!')
      spawnEffect('attack')
      if (newHP <= 0) {
        enemyHPRef.current = 0; setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 700)
      }
    } else if (effect === 'hint') {
      // Force the same visible hint UI the time-based system uses
      setTimeoutHintActive?.(true)
      onHintUsed?.() // SPEC GAME-B §B.4 (2026-07-12) — counts toward the boss-rank hint tally

      if (q?.inputMode === 'numpad') {
        setBattleLog(`กระจก! คำตอบเริ่มด้วย ${String(q.answer)[0]}`)
      } else if (q?.inputMode === 'wordbuild' || q?.inputMode === 'sequence') {
        setBattleLog('กระจก! ดูตัวที่กระพริบทองนะ!')
      } else if (q?.inputMode === 'memory') {
        setBattleLog('กระจก! ใบ้ไม่ได้ในโหมดนี้ แต่ได้พลังใจ! 💪')
      } else if (q?.choices) {
        const wrongIdxs = q.choices
          .map((c, i) => ({ c, i }))
          .filter(({ c }) => c !== q.answer)
          .map(({ i }) => i)
        const toElim = wrongIdxs.sort(() => Math.random() - 0.5).slice(0, 2)
        setEliminated(toElim)
        setBattleLog('กระจก! ตัวเลือกผิด 2 ตัว หายไป!')
      } else {
        setBattleLog('กระจก! ไม่สามารถใช้ได้กับโจทย์นี้')
      }
    } else if (effect === 'block') {
      shieldActiveRef.current = true
      setShieldActive(true)
      setBattleLog('โคลเวอร์! ป้องกันการโจมตีครั้งถัดไป!')
    } else if (effect === 'double_xp') {
      xpBoostActiveRef.current = true
      setXpBoost(true)
      setBattleLog('อัญมณี! XP สองเท่าสำหรับคำตอบถัดไป!')
    }
  }

  return { fireHit, fireMiss, showVictory, useBattleItem: useBattleItemFn }
}
