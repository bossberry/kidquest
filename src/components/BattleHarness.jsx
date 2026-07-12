import React, { useState, useEffect, useCallback } from 'react'
import MoveSelectBattleMode from '../games/MoveSelectBattleMode.jsx'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { selectBattleQuestion } from '../lib/questionBank.js'

/**
 * Dev-only battle-screen test harness (2026-07-13 urgent bugfix session),
 * opened directly via ?battleharness=1. Same pattern as ?eggharness=1/
 * ?roomharness=1 — never linked from the normal UI, needs no login (the
 * StateContext/CompanionContext providers already wrap <App/> from outside,
 * same reason RoomHarness.jsx can render DecoratedRoom.jsx standalone).
 *
 * Renders the REAL MoveSelectBattleMode with a scripted fixture question
 * instead of going through WorldScreen -> PartySelect -> WorldBattle, so the
 * exact reported overlap scenario (numpad question + item bar + the
 * auto-timeout hint) can be reproduced on demand at any viewport size via
 * Chrome device emulation, without needing a real logged-in session or
 * waiting for a real world encounter.
 */

const FIXTURE_ENEMY = {
  bouncy_slime: { type: 'bouncy_slime', subject: 'math', hp: 60, atk: 6, def: 2, nameTH: 'สไลม์กระโดด', isBoss: false },
  fox_kit:      { type: 'fox_kit',      subject: 'thai', hp: 60, atk: 6, def: 2, nameTH: 'จิ้งจอกน้อย', isBoss: false },
  boss:         { type: 'grumpy_mole',  subject: 'eng',  hp: 120, atk: 8, def: 4, nameTH: 'โมลราชา', isBoss: true },
}

const FIXTURE_CREATURE_STATS = { HP: 80, ATK: 20, DEF: 8, SPD: 40 }
const FIXTURE_CREATURE = { id: 'fixture_creature', bondMeter: 50, stats: FIXTURE_CREATURE_STATS, creature: { n: 'ทดสอบ' } }

// Force a specific inputMode by re-rolling until questionBank hands one back
// (subjects are weighted toward their own natural modes — thai for choice,
// math for numpad — so this converges fast in practice).
function forceQuestion(subject, state, wantMode, maxTries = 60) {
  for (let i = 0; i < maxTries; i++) {
    const q = selectBattleQuestion(subject, state, {})
    if (!wantMode || q.inputMode === wantMode) return q
  }
  return selectBattleQuestion(subject, state, {})
}

const SCENARIOS = [
  { key: 'numpad_items', label: '🔢 Numpad + item bar (the reported bug)', subject: 'math', mode: 'numpad', enemy: 'bouncy_slime', withItems: true },
  { key: 'choice',       label: '✅ Choice mode',                          subject: 'thai', mode: 'choice', enemy: 'fox_kit',      withItems: true },
  { key: 'boss',         label: '👑 Boss (no item bar by design)',          subject: 'eng',  mode: null,     enemy: 'boss',         withItems: true },
  { key: 'short_field',  label: '📏 Numpad, no items (tightest question/input gap)', subject: 'math', mode: 'numpad', enemy: 'bouncy_slime', withItems: false },
]

export default function BattleHarness() {
  const { state, dispatch, eggStatsData, eggProgressData } = useAppState()
  const [scenarioKey, setScenarioKey] = useState('numpad_items')
  const scenario = SCENARIOS.find(s => s.key === scenarioKey) ?? SCENARIOS[0]
  const [q, setQ] = useState(() => forceQuestion(scenario.subject, state, scenario.mode))
  const [mountKey, setMountKey] = useState(0) // remounting resets MoveSelectBattleMode's internal hint timers

  const applyScenario = useCallback((s) => {
    setQ(forceQuestion(s.subject, state, s.mode))
    if (s.withItems) {
      ;['scroll', 'thunder', 'gem', 'mirror', 'clover'].forEach(key => {
        if ((state.battleItems?.[key] || 0) <= 0) dispatch({ type: ACTIONS.DROP_BATTLE_ITEM, payload: { key } })
      })
    }
    setMountKey(k => k + 1)
  }, [state, dispatch]) // eslint-disable-line

  useEffect(() => { applyScenario(scenario) }, []) // eslint-disable-line

  const enemy = FIXTURE_ENEMY[scenario.enemy]

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Control strip — small, top of screen, out of the way of the battle
          UI itself so it doesn't interfere with overlap verification below it. */}
      <div style={{
        flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 6, padding: 6,
        background: '#111', borderBottom: '1px solid #333', zIndex: 200, position: 'relative',
      }}>
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            onClick={() => { setScenarioKey(s.key); applyScenario(s) }}
            style={{
              fontSize: 10, fontFamily: 'monospace', padding: '4px 8px',
              background: scenarioKey === s.key ? '#4a4' : '#333',
              color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => applyScenario(scenario)}
          style={{ fontSize: 10, fontFamily: 'monospace', padding: '4px 8px', background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          🔄 re-roll question
        </button>
        <span style={{ fontSize: 9, color: '#888', alignSelf: 'center' }}>
          numpad's auto-hint fires ~5s after mount with no input — wait to see the reported overlap.
        </span>
      </div>

      <MoveSelectBattleMode
        key={mountKey}
        q={q}
        cur={0}
        total={8}
        subject={scenario.subject}
        onCorrect={() => ({ earned: 8, isCrit: false })}
        onWrong={() => {}}
        onNext={() => setQ(forceQuestion(scenario.subject, state, scenario.mode))}
        onComplete={() => {}}
        onFaint={() => {}}
        onSpeak={() => {}}
        eggStats={eggStatsData}
        eggProgress={eggProgressData}
        readyToHatch={state.readyToHatch}
        isFirstLevel={false}
        enemyData={enemy}
        showReturnButton={true}
        isWorldBattle={true}
        isBossBattle={!!enemy.isBoss}
        creature={FIXTURE_CREATURE}
        creatureStats={FIXTURE_CREATURE_STATS}
        creatureCurrentHP={60}
        creatureName={FIXTURE_CREATURE.creature.n}
        onCreatureTakeDamage={() => {}}
        onCreatureHeal={() => {}}
        onBattleXP={() => {}}
        onHintUsed={() => {}}
        onBossPhase2={() => {}}
      />
    </div>
  )
}
