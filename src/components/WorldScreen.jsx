import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { WORLD_LEVELS, DYNAMIC_SCREENS } from '../config/worldConfig.js'
import { playTone, playBGM, stopBGM, playSFX } from '../lib/audio.js'
import { MAP_THEMES, BOSS_XP_THRESHOLD } from '../config/gameConfig.js'
import {
  MAP_ROWS, MAP_COLS, T,
  renderMap, renderPlayer, canMove, getCamera, getExitAt,
  EXIT_OPPOSITE, EXIT_DIR_NAME, getEntryPosition,
} from '../lib/tileEngine.js'
import { generateScreenMap, generateBossMap, generateMazeMap, getScreenEnemies } from '../lib/tileMaps.js'
import { drawEnemy } from '../lib/drawEnemy.js'
import { getBattleSubject, getBattleLevel } from '../lib/battleSubject.js'
import { ENEMY_DATA } from '../config/enemyConfig.js'
import TreasureSlot from './TreasureSlot.jsx'
import PixelItemIcon from './PixelItemIcon.jsx'

const TILE = 16 // px per tile (matches tileEngine TILE constant)

// ── Chest pixel art drawing ──────────────────────────────────────────────────

function drawChest(ctx, x, y, frame) {
  const s = TILE
  // Body
  ctx.fillStyle = '#8b5e3c'
  ctx.fillRect(x + 2, y + 5, s - 4, s - 7)
  // Lid
  ctx.fillStyle = '#a0713a'
  ctx.fillRect(x + 2, y + 2, s - 4, 5)
  // Gold trim on lid
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(x + 2, y + 6, s - 4, 1)
  // Gold lock
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(x + Math.floor(s / 2) - 1, y + 7, 3, 3)
  // Sparkle — alternates every 30 frames
  ctx.fillStyle = frame % 60 < 30 ? 'rgba(255,255,255,0.9)' : 'rgba(255,215,0,0.5)'
  ctx.fillRect(x + Math.floor(s / 2) - 1, y - 2, 2, 2)
}

// ── Chest spawning ────────────────────────────────────────────────────────────

function spawnChests(tileMap, enemyDefs) {
  if (!tileMap) return []
  const enemyPositions = new Set((enemyDefs || []).map(e => `${e.col},${e.row}`))
  const candidates = []
  for (let r = 2; r < tileMap.length - 2; r++) {
    for (let c = 2; c < tileMap[r].length - 2; c++) {
      const raw = tileMap[r][c]
      const tileType = typeof raw === 'object' ? raw.type : raw
      if ((tileType === T.GRASS || tileType === T.FLOWER) && !enemyPositions.has(`${c},${r}`)) {
        candidates.push({ col: c, row: r })
      }
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const count = 2 + Math.floor(Math.random() * 2)
  return candidates.slice(0, count).map((pos, i) => ({
    col: pos.col, row: pos.row,
    id: `chest_${Date.now()}_${i}`,
    opened: false,
  }))
}

const STAGE_COLORS = ['#78c878','#58b878','#38a8c8','#5888e8','#8858e8','#d840d0','#e86040','#f0a830','#ffd040']

// ── Player glow rendering ────────────────────────────────────────────────────

function drawPlayerGlow(ctx, px, py, frame) {
  const cx = px + TILE / 2
  const cy = py + TILE / 2
  const pulse = (Math.sin(frame * 0.06) + 1) / 2

  ctx.strokeStyle = `rgba(255,255,180,${0.15 + pulse * 0.50})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, TILE * 0.85, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = `rgba(255,255,220,${0.30 + pulse * 0.40})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, TILE * 0.58, 0, Math.PI * 2)
  ctx.stroke()
}

const OWL_LINES = [
  'สวัสดี โชแปง! ข้าคือ ศาสตราจารย์นกฮูก',
  'หญ้าสูงนั้น... อาจมีสัตว์ซ่อนอยู่นะ!',
]
const SIGN_LINES = [
  '→ ทาวน์สแควร์',
  '← ทุ่งดอกไม้',
  '↑ ยังไปไม่ได้...',
]

function findSpecials(tileMap) {
  const npcs = [], signs = []
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const raw = tileMap[r]?.[c]
      const type = typeof raw === 'object' ? raw.type : raw
      if (type === T.NPC)  npcs.push({ col: c, row: r, data: raw })
      if (type === T.SIGN) signs.push({ col: c, row: r })
    }
  }
  return { npcs, signs }
}

const DPAD_BTN = (pos) => ({
  position: 'absolute', width: 56, height: 56, borderRadius: 12,
  background: 'rgba(255,255,255,0.13)', border: '2px solid rgba(255,255,255,0.28)',
  color: 'rgba(255,255,255,0.88)', fontSize: 22, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  userSelect: 'none', fontFamily: 'system-ui,sans-serif',
  ...pos,
})

// ── World Map HUD ─────────────────────────────────────────────────────────────

const VALID_DYNAMIC = new Set(['NW', 'NE', 'SW', 'SE', 'BOSS', 'MAZE'])
const BOSS_TILE = { col: 7, row: 3 }

const BATTLE_ITEM_KEYS = ['scroll', 'thunder', 'gem', 'mirror', 'clover']

export const HUD_CONTENT_H = 64

function xpProgress(creature) {
  const level = creature?.battleLevel ?? 1
  const xp = creature?.battleXP ?? 0
  let threshold = 0
  for (let l = 1; l < level; l++) threshold += 10 + l * l * 2
  const inLevel = Math.max(0, xp - threshold)
  const needed = 10 + level * level * 2
  return { level, fraction: Math.min(1, inLevel / needed) }
}

const HUD_SEP = (
  <div style={{ width: 1, background: 'rgba(60,120,60,0.25)', alignSelf: 'stretch' }} />
)

const HOME_ITEM_LABELS = { food: 'อาหาร', star: 'ดาว', ribbon: 'ริบบิ้น', potion: 'ยา' }
const HOME_ITEM_EFFECTS = { food: 'ฟื้นความสุข', star: 'บูสต์ XP', ribbon: '+Bond', potion: 'ฟื้น HP' }
const HOME_ITEM_KEYS = ['food', 'star', 'ribbon', 'potion']

function WorldHUD({ screenId, discoveredScreens, state, onGoHome, onOpenItemBag, bossMapUnlocked }) {
  const discovered = new Set(discoveredScreens ?? [])
  const MINI_TILE = 11
  const MINI_GAP  = 1
  const worldLevel = state.worldLevel ?? 0
  const mazeActive = state.mazeActive ?? false
  const clearedMaps = state.clearedMaps ?? []

  const eggs     = state.hatchedEggs ?? []
  const partyId  = (state.party ?? [])[0]
  const creature = (partyId ? eggs.find(e => e.id === partyId) : null)
    ?? [...eggs].sort((a, b) => (b.hatched_at ?? 0) - (a.hatched_at ?? 0))[0]
    ?? null

  const lvBonus = Math.max(0, (creature?.battleLevel ?? 1) - 1)
  const maxHP   = (creature?.stats?.HP ?? 10) + lvBonus
  const hp      = creature ? Math.min(creature.currentHP ?? maxHP, maxHP) : 0
  const hpFrac  = creature ? Math.max(0, hp / maxHP) : 0
  const hpColor = hpFrac > 0.5 ? '#38c038' : hpFrac > 0.2 ? '#c8c820' : '#c82020'

  const { level: xpLevel, fraction: xpFrac } = xpProgress(creature)
  const items = state.items ?? {}

  // Mini-map: 2×2 regular slots + BOSS row
  const groundColor = WORLD_LEVELS[worldLevel]?.bgColors?.ground ?? '#2a4a2a'
  const swSlot = mazeActive ? 'MAZE' : 'SW'
  const miniRows = [
    ['NW', 'NE'],
    [swSlot, 'SE'],
  ]

  function miniTileColor(id, isDisc) {
    if (!isDisc) return '#080e08'
    if (id === 'BOSS') return bossMapUnlocked ? '#380000' : '#1a1a1a'
    if (id === 'MAZE') return '#180830'
    return groundColor
  }

  const homeItemCount = HOME_ITEM_KEYS.reduce((n, k) => n + (items[k] ?? 0), 0)

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      paddingTop: 'env(safe-area-inset-top, 0px)',
      background: 'rgba(5,10,5,0.86)',
      borderBottom: '1px solid rgba(50,110,50,0.3)',
    }}>
      <div style={{
        height: HUD_CONTENT_H,
        display: 'flex', alignItems: 'stretch',
      }}>

        {/* Mini-map: 2×2 + BOSS */}
        <div style={{
          width: 52, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '4px 2px', gap: 2,
        }}>
          {miniRows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: MINI_GAP }}>
              {row.map(id => {
                const realId = id === 'MAZE' ? 'SW' : id
                const isCurrent = id === screenId
                const isDisc    = discovered.has(id)
                const isCleared = clearedMaps.includes(realId)
                const theme     = MAP_THEMES[realId]
                return (
                  <div key={id} title={theme?.name} style={{
                    width: MINI_TILE, height: MINI_TILE,
                    background: miniTileColor(id, isDisc),
                    outline: isCurrent ? '1px solid #e0e040' : '1px solid #182018',
                    outlineOffset: -1, position: 'relative',
                  }}>
                    {isCurrent && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(255,255,140,0.72)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, color: '#333',
                      }}>•</div>
                    )}
                    {!isCurrent && isCleared && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 7, color: '#80ff80',
                      }}>✓</div>
                    )}
                    {!isCurrent && id === 'MAZE' && mazeActive && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(120,40,200,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 7, color: '#d090ff',
                      }}>?</div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          {/* BOSS tile — single centered */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {(() => {
              const isCurrent = screenId === 'BOSS'
              const isDisc    = discovered.has('BOSS')
              return (
                <div style={{
                  width: MINI_TILE * 2 + MINI_GAP, height: MINI_TILE,
                  background: miniTileColor('BOSS', isDisc),
                  outline: isCurrent ? '1px solid #ff4040' : (bossMapUnlocked ? '1px solid #aa1010' : '1px solid #182018'),
                  outlineOffset: -1, position: 'relative',
                }}>
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(255,80,80,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 7, color: '#fff',
                    }}>★</div>
                  )}
                  {!isCurrent && bossMapUnlocked && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 7, color: '#ff8080',
                    }}>!</div>
                  )}
                </div>
              )
            })()}
          </div>
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: 6,
            color: 'rgba(130,190,130,0.4)', lineHeight: 1, textAlign: 'center',
          }}>
            {clearedMaps.length}/4 {WORLD_LEVELS[worldLevel]?.nameTH?.slice(0, 5) ?? ''}
          </div>
        </div>

        {HUD_SEP}

        {/* Creature + HP */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '0 8px', gap: 3,
        }}>
          <div style={{
            fontFamily: 'var(--font-thai)', fontSize: 10, color: '#c0c8c0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {creature?.creature?.n ?? (creature ? '???' : 'ไม่มีสัตว์')}
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 7, color: '#505080', lineHeight: 1 }}>
            Lv.{creature?.battleLevel ?? 1}
          </div>
          <div style={{ width: '100%', height: 5, background: '#050a05', border: '1px solid #182018' }}>
            <div style={{ width: `${hpFrac * 100}%`, height: '100%', background: hpColor }} />
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 6, color: '#304030' }}>
            {creature ? `${hp}/${maxHP}` : '—'}
          </div>
        </div>

        {HUD_SEP}

        {/* XP bar */}
        <div style={{
          width: 58, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '0 6px', gap: 3,
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 7, color: '#906828', lineHeight: 1 }}>
            Lv.{xpLevel}
          </div>
          <div style={{ width: '100%', height: 4, background: '#050a05', border: '1px solid #182018' }}>
            <div style={{ width: `${xpFrac * 100}%`, height: '100%', background: '#d09820' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 6, color: '#584010', lineHeight: 1 }}>
            XP
          </div>
        </div>

        {HUD_SEP}

        {/* Battle items */}
        <div style={{
          width: 78, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '0 6px', gap: 3,
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 6, color: '#304030', lineHeight: 1 }}>
            ITEMS
          </div>
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {BATTLE_ITEM_KEYS.map(key => {
              const count = items[key] ?? 0
              return (
                <div key={key} style={{ position: 'relative', opacity: count > 0 ? 1 : 0.2 }}>
                  <PixelItemIcon type={key} size={13} />
                  {count > 0 && (
                    <div style={{
                      position: 'absolute', bottom: -1, right: -2,
                      background: '#101a08', color: '#a8d030',
                      fontFamily: 'var(--font-pixel)', fontSize: 6,
                      lineHeight: 1, padding: '0 1px', pointerEvents: 'none',
                    }}>
                      {count > 9 ? '9+' : count}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Item bag button */}
        <button onClick={onOpenItemBag} style={{
          width: 38, flexShrink: 0, alignSelf: 'stretch',
          background: 'transparent',
          border: 'none', borderLeft: '1px solid rgba(50,110,50,0.25)',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 1,
          WebkitTapHighlightColor: 'transparent', padding: 0,
          position: 'relative',
        }}>
          <div style={{ fontFamily: 'Mitr,sans-serif', fontSize: 14, lineHeight: 1, color: 'rgba(200,220,180,0.7)' }}>
            🎒
          </div>
          {homeItemCount > 0 && (
            <div style={{
              position: 'absolute', top: 4, right: 5,
              background: '#e04020', color: '#fff',
              fontFamily: 'var(--font-pixel)', fontSize: 6,
              borderRadius: 4, padding: '0 2px', lineHeight: '10px',
            }}>
              {homeItemCount > 9 ? '9+' : homeItemCount}
            </div>
          )}
        </button>

        {/* Home button */}
        <button onClick={onGoHome} style={{
          width: 42, flexShrink: 0, alignSelf: 'stretch',
          background: 'transparent',
          border: 'none', borderLeft: '1px solid rgba(50,110,50,0.25)',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2,
          WebkitTapHighlightColor: 'transparent', padding: 0,
        }}>
          <div style={{ fontFamily: 'Mitr,sans-serif', fontSize: 16, lineHeight: 1, color: 'rgba(180,230,180,0.6)' }}>
            &#8962;
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 6, color: 'rgba(120,180,120,0.4)', lineHeight: 1 }}>
            HOME
          </div>
        </button>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function WorldScreen({ navigate }) {
  const { state, dispatch, eggStatsData } = useAppState()
  const stateRef = useRef(state)
  // useLayoutEffect runs before the browser paint (unlike useEffect which runs after).
  // This ensures stateRef.current.pendingBattle is set before the next RAF frame fires,
  // preventing triggerBattle from dispatching SET_PENDING_BATTLE multiple times in rapid
  // succession (the "PartySelect infinite loop" bug).
  useLayoutEffect(() => { stateRef.current = state }, [state])
  useLayoutEffect(() => {
    battlePendingRef.current = !!state.pendingBattle
    if (!state.pendingBattle) battleDispatchedRef.current = false
  }, [state.pendingBattle])

  useEffect(() => {
    playBGM('world')
    return () => stopBGM()
  }, [])
  const canvasRef = useRef(null)

  const [viewSize, setViewSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [screenId, setScreenId] = useState(VALID_DYNAMIC.has(state.currentScreen) ? state.currentScreen : 'NW')
  const [transitioning, setTransitioning] = useState(false)
  const [transOverlay, setTransOverlay] = useState(0)
  const [nearNPC, setNearNPC] = useState(null)
  const [nearSign, setNearSign] = useState(null)
  const [dialogue, setDialogue] = useState(null)
  const [encounterFlash, setEncounterFlash] = useState(false)

  // Mutable refs for game loop (avoid stale closures)
  const gameRef      = useRef(null)
  const tileMapRef   = useRef(null)
  const specialsRef  = useRef({ npcs: [], signs: [] })
  const screenIdRef  = useRef(screenId)
  const transRef     = useRef(transitioning)
  const dialogueRef  = useRef(dialogue)
  const rafRef       = useRef(null)
  const transTimer   = useRef(null)
  const enemiesRef        = useRef([]) // dynamic enemy runtime state
  const chestsRef         = useRef([]) // treasure chest runtime state
  const triggerBattleRef     = useRef(null)
  const battleDispatchedRef  = useRef(false) // prevents re-dispatch between RAF tick and React state commit
  const battlePendingRef     = useRef(false) // mirrors state.pendingBattle — pauses RAF game logic
  const [slotMachineOpen, setSlotMachineOpen] = useState(false)
  const [bossConfirm, setBossConfirm] = useState(false)
  const [worldUnlockBanner, setWorldUnlockBanner] = useState(null)
  const [itemBagOpen, setItemBagOpen] = useState(false)
  const [bossCutscene, setBossCutscene] = useState(null) // null | string (world name)
  const [mazeTimerTick, setMazeTimerTick] = useState(0)

  screenIdRef.current   = screenId
  transRef.current      = transitioning
  dialogueRef.current   = dialogue

  const eggColor = STAGE_COLORS[eggStatsData?.stage ?? 0] || STAGE_COLORS[0]
  const eggColorRef = useRef(eggColor)
  eggColorRef.current = eggColor

  const clearedMaps = state.clearedMaps ?? []
  const allMapsCleared = ['NW', 'NE', 'SW', 'SE'].every(s => clearedMaps.includes(s))
  const totalXP = (state.xpThai ?? 0) + (state.xpMath ?? 0) + (state.xpEng ?? 0)
  const bossMapUnlocked = allMapsCleared && totalXP >= BOSS_XP_THRESHOLD

  // ── Viewport resize ──────────────────────────────────────────────────────────

  useEffect(() => {
    const onResize = () => setViewSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  // ── Screen setup ────────────────────────────────────────────────────────────

  const initScreen = useCallback((id, fromExitType, forcedStart) => {
    const wLevel = stateRef.current.worldLevel ?? 0
    let tileMap, startPos

    if (id === 'BOSS') {
      tileMap = generateBossMap(wLevel)
      startPos = forcedStart ?? (fromExitType !== undefined
        ? getEntryPosition(tileMap, fromExitType)
        : { col: 10, row: 13 })
    } else if (id === 'MAZE') {
      tileMap = generateMazeMap()
      startPos = forcedStart ?? { col: 1, row: 13 }
    } else {
      tileMap = generateScreenMap(id, wLevel)
      startPos = forcedStart ?? (fromExitType !== undefined
        ? getEntryPosition(tileMap, fromExitType)
        : { col: 10, row: 7 })
    }

    tileMapRef.current  = tileMap
    specialsRef.current = findSpecials(tileMap)
    gameRef.current = {
      col: startPos.col, row: startPos.row,
      displayX: startPos.col, displayY: startPos.row,
      fromX: startPos.col, fromY: startPos.row,
      dir: 'down', walkFrame: 0,
      moving: false, moveStartTime: 0, frame: 0,
    }
    setNearNPC(null)
    setNearSign(null)
    setDialogue(null)
  }, [])

  useEffect(() => {
    const savedPos = stateRef.current.worldPosition
    if (savedPos && (savedPos.screen === screenId || !savedPos.screen)) {
      initScreen(screenId, undefined, { col: savedPos.tileX, row: savedPos.tileY })
      dispatch({ type: ACTIONS.CLEAR_WORLD_POSITION })
    } else {
      initScreen(screenId, undefined)
    }
  }, []) // eslint-disable-line

  // ── Enemy initialization on screen change ────────────────────────────────────

  useEffect(() => {
    const wLevel = stateRef.current.worldLevel ?? 0
    const worldDef = WORLD_LEVELS[wLevel] ?? WORLD_LEVELS[0]

    if (screenId === 'BOSS') {
      enemiesRef.current = [{
        id: 'world_boss',
        type: worldDef.bossEnemy,
        col: BOSS_TILE.col, row: BOSS_TILE.row,
        dir: 'down', timer: 0, rngSeed: 42,
        woken: false, isAggro: false, aggroTimer: 0,
        defeated: false, respawnTimer: 0, dead: false,
        deathTimer: 0, opacity: 1, isWorldBoss: true,
      }]
      chestsRef.current = []
      return
    }

    const defs = screenId === 'MAZE' ? [] : getScreenEnemies(screenId, wLevel)
    enemiesRef.current = defs.map((def, i) => ({
      id:           `${screenId}_${i}`,
      type:         def.type,
      col:          def.col,
      row:          def.row,
      dir:          def.type === 'bouncy_slime' ? 'up'
                  : def.type === 'egg_pawn'     ? 'down'
                  : def.type === 'fox_kit'      ? 'right'
                  : 'none',
      timer:        i * 17,
      rngSeed:      (i * 37 + 11) % 97,
      woken:        false,
      isAggro:      false,
      aggroTimer:   0,
      defeated:     false,
      respawnTimer: 0,
      dead:         false,
      deathTimer:   0,
      opacity:      1,
    }))
    chestsRef.current = screenId === 'MAZE' ? [] : spawnChests(tileMapRef.current, defs)
    // Apply death animation for the enemy that was just defeated in battle
    try {
      const lb = JSON.parse(sessionStorage.getItem('kq_last_battle') || 'null')
      if (lb && lb.screenId === screenId) {
        sessionStorage.removeItem('kq_last_battle')
        let applied = false
        enemiesRef.current = enemiesRef.current.map(e => {
          if (!applied && e.type === lb.enemyType) {
            applied = true
            return { ...e, dead: true }
          }
          return e
        })
      }
    } catch {}
  }, [screenId]) // eslint-disable-line

  // ── Proximity detection ─────────────────────────────────────────────────────

  const checkProximity = useCallback((col, row) => {
    const { npcs, signs } = specialsRef.current
    const near = (a) => Math.abs(a.col - col) + Math.abs(a.row - row) <= 2
    setNearNPC(npcs.find(near) || null)
    setNearSign(signs.find(near) || null)
  }, [])

  // ── Screen transition ────────────────────────────────────────────────────────

  const handleExit = useCallback((exitType) => {
    if (transRef.current) return
    const sid = screenIdRef.current
    const dirName = EXIT_DIR_NAME[exitType]
    const curState = stateRef.current

    // Maze exit: leaving MAZE via EXIT_N clears the maze and drops 3 items
    if (sid === 'MAZE' && dirName === 'N') {
      dispatch({ type: ACTIONS.CLEAR_MAZE })
      const ITEM_KEYS = ['scroll', 'thunder', 'gem', 'mirror', 'clover']
      for (let i = 0; i < 3; i++) {
        dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)] } })
      }
    }

    // Mark regular map as cleared when exiting for the first time
    if (['NW', 'NE', 'SW', 'SE'].includes(sid)) {
      dispatch({ type: ACTIONS.MAP_CLEARED, payload: sid })
    }

    // Dynamic routing with maze override for NW→S and SE→W
    let connects = { ...(DYNAMIC_SCREENS[sid]?.connects ?? {}) }
    if (curState.mazeActive && sid === 'NW' && dirName === 'S') connects.S = 'MAZE'
    if (curState.mazeActive && sid === 'SE' && dirName === 'W') connects.W = 'MAZE'

    const targetId = connects[dirName]
    if (!targetId) return

    // Block BOSS entry if unlock conditions not met
    if (targetId === 'BOSS') {
      const cleared = curState.clearedMaps ?? []
      const xp = (curState.xpThai ?? 0) + (curState.xpMath ?? 0) + (curState.xpEng ?? 0)
      const allCleared = ['NW', 'NE', 'SW', 'SE'].every(s => cleared.includes(s))
      if (!allCleared || xp < BOSS_XP_THRESHOLD) return
    }

    const forcedStart = targetId === 'MAZE' ? { col: 1, row: 13 } : undefined

    playSFX('screen_enter')
    setTransitioning(true)
    setTransOverlay(1)

    transTimer.current = setTimeout(() => {
      initScreen(targetId, exitType, forcedStart)
      setScreenId(targetId)
      dispatch({ type: ACTIONS.MOVE_SCREEN, payload: targetId })
      dispatch({ type: ACTIONS.DISCOVER_SCREEN, payload: targetId })
      setTransOverlay(0)
      transTimer.current = setTimeout(() => setTransitioning(false), 170)
    }, 160)
  }, [dispatch, initScreen])

  // ── Player movement ──────────────────────────────────────────────────────────

  const triggerBattle = useCallback((enemy) => {
    if (stateRef.current.pendingBattle) return  // already awaiting creature selection
    const subject = getBattleSubject(stateRef.current.sessionLog, stateRef.current)
    const level   = getBattleLevel(subject, stateRef.current)
    // Write info so death animation plays when WorldScreen remounts after victory
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
    const scaleFactor = 1 + (playerLevel - 1) * 0.4
    dispatch({ type: ACTIONS.SET_PENDING_BATTLE, payload: {
      position: { screen: screenIdRef.current, tileX: gameRef.current?.col ?? 0, tileY: gameRef.current?.row ?? 0 },
      enemy: {
        type: enemy.type, subject, level,
        hp:  Math.round((eData.hp  ?? 24) * scaleFactor),
        atk: Math.round((eData.atk ??  4) * scaleFactor),
        def: Math.round((eData.def ??  0) * scaleFactor),
        nameTH: eData.nameTH ?? '?',
      },
    }})
  }, [dispatch]) // eslint-disable-line
  triggerBattleRef.current = triggerBattle

  const enterBossBattle = useCallback(() => {
    setBossConfirm(false)
    const wLevel = stateRef.current.worldLevel ?? 0
    const worldDef = WORLD_LEVELS[wLevel]
    if (!worldDef) return
    const subject = getBattleSubject(stateRef.current.sessionLog, stateRef.current)
    const level = getBattleLevel(subject, stateRef.current)
    dispatch({ type: ACTIONS.SET_PENDING_BATTLE, payload: {
      position: { screen: 'BOSS', tileX: BOSS_TILE.col, tileY: BOSS_TILE.row },
      enemy: {
        type: worldDef.bossEnemy, subject, level,
        hp: worldDef.bossHP, atk: worldDef.bossATK, def: worldDef.bossDEF,
        nameTH: worldDef.bossNameTH, isBossBattle: true,
      },
    }})
  }, [dispatch])

  const tryMove = useCallback((dCol, dRow, dir) => {
    const g = gameRef.current
    if (!g || g.moving || transRef.current || dialogueRef.current) return
    if (stateRef.current.pendingBattle) return

    const tileMap = tileMapRef.current
    if (!tileMap) return

    g.dir = dir
    const newCol = g.col + dCol
    const newRow = g.row + dRow

    // Dynamic enemy collision — also catches chasers already on player's tile
    const hitEnemy = enemiesRef.current.find(e => {
      if (e.defeated || e.dead) return false
      if (e.col === newCol && e.row === newRow) return true
      const isChaser = e.type === 'snake' || e.type === 'baby_zombie' ||
                       (e.type === 'sleepy_bunny' && e.woken)
      if (isChaser && e.col === g.col && e.row === g.row) return true
      return false
    })
    if (hitEnemy) {
      if (hitEnemy.isWorldBoss) {
        setBossConfirm(true)
        return
      }
      if (hitEnemy.type === 'sleepy_bunny' && !hitEnemy.woken) {
        // Wake the bunny — player bumped it, bunny wakes up
        enemiesRef.current = enemiesRef.current.map(e =>
          e.id === hitEnemy.id ? { ...e, woken: true, timer: 0 } : e
        )
        playSFX('enemy_notice')
        return
      }
      triggerBattle(hitEnemy)
      return
    }

    // Treasure chest collision
    const hitChest = chestsRef.current.find(c => !c.opened && c.col === newCol && c.row === newRow)
    if (hitChest) {
      chestsRef.current = chestsRef.current.map(c => c.id === hitChest.id ? { ...c, opened: true } : c)
      playTone('cardOpen')
      setSlotMachineOpen(true)
      return
    }

    if (!canMove(tileMap, newCol, newRow)) return

    g.fromX = g.displayX
    g.fromY = g.displayY
    g.col = newCol
    g.row = newRow
    g.moving = true
    g.moveStartTime = performance.now()
    g.walkFrame = (g.walkFrame + 1) % 2

    playSFX('footstep')

    const exitType = getExitAt(tileMap, newCol, newRow)
    if (exitType !== null) {
      setTimeout(() => handleExit(exitType), 80)
      return
    }

    const raw = tileMap[newRow]?.[newCol]
    const ttype = typeof raw === 'object' ? raw.type : raw
    if (ttype === T.TALL && Math.random() < 0.30) {
      playSFX('tall_grass')
      const GRASS_POOL = ['sleepy_bunny', 'bouncy_slime', 'fox_kit', 'leaf_sprite', 'mushroom_imp']
      const randomType = GRASS_POOL[Math.floor(Math.random() * GRASS_POOL.length)]
      triggerBattle({ id: '_grass_', type: randomType })
      return
    }

    checkProximity(newCol, newRow)
  }, [dispatch, handleExit, checkProximity, navigate, triggerBattle])

  const moveUp    = useCallback(() => tryMove( 0, -1, 'up'),    [tryMove])
  const moveDown  = useCallback(() => tryMove( 0,  1, 'down'),  [tryMove])
  const moveLeft  = useCallback(() => tryMove(-1,  0, 'left'),  [tryMove])
  const moveRight = useCallback(() => tryMove( 1,  0, 'right'), [tryMove])

  // ── Dialogue ─────────────────────────────────────────────────────────────────

  const openNPC  = () => { setDialogue({ lines: OWL_LINES,  index: 0 }); playSFX('npc_talk'); playTone('cardOpen') }
  const openSign = () => { setDialogue({ lines: SIGN_LINES, index: 0 }); playSFX('npc_talk'); playTone('cardOpen') }
  const advance  = () => {
    if (!dialogue) return
    if (dialogue.index < dialogue.lines.length - 1) setDialogue({ ...dialogue, index: dialogue.index + 1 })
    else setDialogue(null)
  }

  // ── rAF render loop ──────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let alive = true

    const DIRS4 = [[0,-1],[0,1],[-1,0],[1,0]]
    const respawnTimerIds = []

    function findRespawnPos(tileMap, player, minDist) {
      const candidates = []
      for (let r = 1; r < tileMap.length - 1; r++) {
        for (let c = 1; c < (tileMap[r]?.length ?? 0) - 1; c++) {
          const raw = tileMap[r][c]
          const t = typeof raw === 'object' ? raw.type : raw
          if (t !== T.GRASS && t !== T.TALL) continue
          const dist = Math.abs(c - player.col) + Math.abs(r - player.row)
          if (dist >= minDist) candidates.push({ col: c, row: r })
        }
      }
      if (!candidates.length) return null
      return candidates[Math.floor(Math.random() * candidates.length)]
    }

    function scheduleRespawn(deadEnemy) {
      const delay = (45 + Math.random() * 45) * 1000
      const tid = setTimeout(() => {
        if (!alive) return
        const tmap  = tileMapRef.current
        const player = gameRef.current
        if (!tmap || !player) return
        const spawnPos = findRespawnPos(tmap, player, 5)
        if (spawnPos) {
          enemiesRef.current = [
            ...enemiesRef.current,
            {
              id:           `${deadEnemy.type}_${Date.now()}`,
              type:         deadEnemy.type,
              col:          spawnPos.col,
              row:          spawnPos.row,
              dir:          'none',
              timer:        0,
              rngSeed:      Math.floor(Math.random() * 97),
              woken:        false,
              isAggro:      false,
              aggroTimer:   0,
              defeated:     false,
              respawnTimer: 0,
              dead:         false,
              deathTimer:   0,
              opacity:      1,
            },
          ]
        }
        const idx = respawnTimerIds.indexOf(tid)
        if (idx !== -1) respawnTimerIds.splice(idx, 1)
      }, delay)
      respawnTimerIds.push(tid)
    }

    // Returns the enemy that ran into the player this tick (or null)
    function updateEnemies(tileMap, frame) {
      let pendingBattle = null
      enemiesRef.current = enemiesRef.current.map(e => {
        // Dead → schedule respawn and remove immediately
        if (e.dead) {
          scheduleRespawn(e)
          return null
        }
        if (e.defeated) {
          const rt = e.respawnTimer - 1
          if (rt <= 0) return { ...e, defeated: false, respawnTimer: 0, timer: 0 }
          return { ...e, respawnTimer: rt }
        }

        let ne = { ...e, timer: e.timer + 1 }

        switch (e.type) {
          case 'sleepy_bunny': {
            // Proximity wake check
            const gc = gameRef.current
            if (gc && !ne.woken) {
              const dist = Math.abs(gc.col - ne.col) + Math.abs(gc.row - ne.row)
              if (dist <= 3) ne.woken = true
            }
            // Chase player when woken
            if (ne.woken && ne.timer >= 60 && gc) {
              ne.timer = 0
              const dc = Math.sign(gc.col - ne.col)
              const dr = Math.sign(gc.row - ne.row)
              const tryC = Math.abs(dc) >= Math.abs(dr)
              const nc1 = ne.col + (tryC ? dc : 0)
              const nr1 = ne.row + (tryC ? 0 : dr)
              const nc2 = ne.col + (tryC ? 0 : dc)
              const nr2 = ne.row + (tryC ? dr : 0)
              if (canMove(tileMap, nc1, nr1)) { ne.col = nc1; ne.row = nr1 }
              else if (canMove(tileMap, nc2, nr2)) { ne.col = nc2; ne.row = nr2 }
            }
            break
          }
          case 'bouncy_slime': {
            if (ne.timer >= 45) {
              ne.timer = 0
              const nr = ne.row + (ne.dir === 'up' ? -1 : 1)
              if (canMove(tileMap, ne.col, nr)) { ne.row = nr }
              else { ne.dir = ne.dir === 'up' ? 'down' : 'up' }
            }
            break
          }
          case 'fox_kit': {
            if (ne.timer >= 60) {
              ne.timer = 0
              const nc = ne.col + (ne.dir === 'right' ? 1 : -1)
              if (canMove(tileMap, nc, ne.row)) { ne.col = nc }
              else { ne.dir = ne.dir === 'right' ? 'left' : 'right' }
            }
            break
          }
          case 'egg_pawn': {
            if (ne.timer >= 60) {
              ne.timer = 0
              const nr = ne.row + (ne.dir === 'down' ? 1 : -1)
              if (canMove(tileMap, ne.col, nr)) { ne.row = nr }
              else { ne.dir = ne.dir === 'down' ? 'up' : 'down' }
            }
            break
          }
          case 'leaf_sprite':
          case 'mushroom_imp': {
            if (ne.timer >= 90) {
              ne.timer = 0
              ne.rngSeed = (ne.rngSeed * 31 + 7) % 97
              const d = DIRS4[ne.rngSeed % 4]
              const nc = ne.col + d[0]; const nr = ne.row + d[1]
              if (canMove(tileMap, nc, nr)) { ne.col = nc; ne.row = nr }
            }
            break
          }
          case 'baby_zombie': {
            if (ne.timer >= 6) {
              ne.timer = 0
              const gc2 = gameRef.current
              if (gc2) {
                const dxZ = gc2.col - ne.col
                const dyZ = gc2.row - ne.row
                if (dxZ === 0 && dyZ === 0) break  // already on player tile — stop moving until battle resolves
                let nc, nr
                if (Math.abs(dxZ) >= Math.abs(dyZ)) {
                  nc = ne.col + Math.sign(dxZ); nr = ne.row
                } else {
                  nc = ne.col; nr = ne.row + Math.sign(dyZ)
                }
                if (canMove(tileMap, nc, nr)) { ne.col = nc; ne.row = nr }
              }
            }
            break
          }
          case 'snake': {
            const gc3 = gameRef.current
            const dist = gc3
              ? Math.abs(gc3.col - ne.col) + Math.abs(gc3.row - ne.row)
              : 999
            const wasAggro = ne.isAggro
            ne.isAggro = dist <= 4
            if (ne.aggroTimer > 0) ne.aggroTimer--

            if (!wasAggro && ne.isAggro) {
              ne.aggroTimer = 10
              playSFX('enemy_notice')
            }

            if (ne.isAggro) {
              if (ne.timer >= 5 && gc3) {
                ne.timer = 0
                const dxS = gc3.col - ne.col
                const dyS = gc3.row - ne.row
                let nc, nr
                if (Math.abs(dxS) >= Math.abs(dyS)) {
                  nc = ne.col + Math.sign(dxS); nr = ne.row
                } else {
                  nc = ne.col; nr = ne.row + Math.sign(dyS)
                }
                if (canMove(tileMap, nc, nr)) { ne.col = nc; ne.row = nr }
              }
            } else {
              if (ne.timer >= 36) {
                ne.timer = 0
                ne.rngSeed = (ne.rngSeed * 31 + 7) % 97
                const d = DIRS4[ne.rngSeed % 4]
                const nc = ne.col + d[0]; const nr = ne.row + d[1]
                if (canMove(tileMap, nc, nr)) { ne.col = nc; ne.row = nr }
              }
            }
            break
          }
          default: break
        }

        // Enemies that ran into the player trigger battle
        const isChaser = ne.type === 'snake' || ne.type === 'baby_zombie' ||
                         (ne.type === 'sleepy_bunny' && ne.woken)
        if (!pendingBattle && isChaser && !battleDispatchedRef.current) {
          const gc = gameRef.current
          if (gc && ne.col === gc.col && ne.row === gc.row) {
            pendingBattle = ne
          }
        }

        return ne
      }).filter(Boolean)

      return pendingBattle
    }

    function renderEnemies(ctx, camX, camY) {
      const spriteSize = TILE * 2
      enemiesRef.current.forEach(e => {
        if (e.defeated) return
        const sz = e.type === 'baby_zombie' ? Math.round(spriteSize * 0.6) : spriteSize
        const cx = Math.round((e.col + 0.5) * TILE - camX)
        const cy = Math.round((e.row + 0.5) * TILE - camY)
        const px = cx - sz / 2
        const py = cy - sz / 2

        drawEnemy(ctx, e.type, sz, px, py)
        // Boss always shows red '!'
        if (e.isWorldBoss) {
          ctx.fillStyle = '#ff2020'
          ctx.font = `bold ${TILE}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText('!', cx, py - 2)
        }
        // Woken bunny alert
        if (e.type === 'sleepy_bunny' && e.woken) {
          ctx.fillStyle = '#ffffff'
          ctx.font = `bold ${TILE}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText('!', cx, py - 2)
        }
        // Snake aggro alert
        if (e.type === 'snake' && e.aggroTimer > 0) {
          ctx.fillStyle = '#ff4444'
          ctx.font = `bold ${TILE}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText('!', cx, py - 2)
        }
      })
    }

    function renderChests(ctx, camX, camY, frame) {
      chestsRef.current.forEach(chest => {
        if (chest.opened) return
        const px = Math.round(chest.col * TILE - camX)
        const py = Math.round(chest.row * TILE - camY)
        drawChest(ctx, px, py, frame)
      })
    }

    function loop(now) {
      if (!alive) return
      rafRef.current = requestAnimationFrame(loop)

      // Pause all game logic (enemy AI, collision, rendering) while PartySelect is showing
      if (battlePendingRef.current) return

      const g = gameRef.current
      const tileMap = tileMapRef.current
      if (!g || !tileMap) return

      if (g.moving) {
        const t = Math.min(1, (now - g.moveStartTime) / 120)
        g.displayX = g.fromX + (g.col - g.fromX) * t
        g.displayY = g.fromY + (g.row - g.fromY) * t
        if (t >= 1) { g.displayX = g.col; g.displayY = g.row; g.moving = false }
      }

      g.frame = (g.frame + 1) % 120
      if (g.frame % 3 === 0) {
        // battleDispatchedRef reset is handled by useLayoutEffect on pendingBattle — not here
        // Never dispatch if guard is already up
        if (!battleDispatchedRef.current) {
          const battleEnemy = updateEnemies(tileMap, g.frame)
          if (battleEnemy && !stateRef.current.pendingBattle) {
            battleDispatchedRef.current = true
            triggerBattleRef.current?.(battleEnemy)
          }
        } else {
          updateEnemies(tileMap, g.frame) // still update positions, just don't trigger battle
        }
      }

      const vw = canvas.width
      const vh = canvas.height
      const { camX, camY: camYBase } = getCamera(g.displayX, g.displayY, vw, vh)
      const camY = camYBase - Math.round(HUD_CONTENT_H / 2)
      ctx.clearRect(0, 0, vw, vh)
      renderMap(ctx, tileMap, null, null, camX, camY, g.frame)
      renderEnemies(ctx, camX, camY)
      renderChests(ctx, camX, camY, g.frame)
      // Player glow drawn behind the sprite
      const playerGlowX = Math.round(g.displayX * TILE - camX)
      const playerGlowY = Math.round(g.displayY * TILE - camY)
      drawPlayerGlow(ctx, playerGlowX, playerGlowY, g.frame)
      renderPlayer(ctx, g.displayX, g.displayY, g.dir, g.walkFrame, eggColorRef.current, camX, camY)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(rafRef.current); respawnTimerIds.forEach(clearTimeout) }
  }, []) // stable — reads from refs only

  // ── Secret maze: countdown expiry ────────────────────────────────────────────

  useEffect(() => {
    if (!state.secretMapExpiry || !state.mazeActive) return
    const remaining = state.secretMapExpiry - Date.now()
    if (remaining <= 0) {
      dispatch({ type: ACTIONS.SECRET_MAP_EXPIRE })
      return
    }
    const t = setTimeout(() => dispatch({ type: ACTIONS.SECRET_MAP_EXPIRE }), remaining)
    return () => clearTimeout(t)
  }, [state.secretMapExpiry, state.mazeActive]) // eslint-disable-line

  // ── Secret maze: countdown display tick ──────────────────────────────────────

  useEffect(() => {
    if (!state.mazeActive || !state.secretMapExpiry) return
    const id = setInterval(() => setMazeTimerTick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [state.mazeActive, state.secretMapExpiry])

  // ── Boss defeat → tier advance ────────────────────────────────────────────────

  useEffect(() => {
    if (!state.bossDefeatedThisTier) return
    const wl = state.worldLevel ?? 0
    const nextLevel = wl + 1
    const nextDef = WORLD_LEVELS[nextLevel]
    const currentName = WORLD_LEVELS[wl]?.nameTH ?? `Tier ${wl}`
    setBossCutscene(currentName)
    const t1 = setTimeout(() => {
      setBossCutscene(null)
      if (nextDef) {
        dispatch({ type: ACTIONS.SET_WORLD_LEVEL, payload: nextLevel })
        setWorldUnlockBanner(nextDef.nameTH)
        setTimeout(() => setWorldUnlockBanner(null), 4000)
      } else {
        dispatch({ type: ACTIONS.SET_WORLD_LEVEL, payload: wl })
      }
    }, 3500)
    return () => clearTimeout(t1)
  }, [state.bossDefeatedThisTier]) // eslint-disable-line

  // ── Go home ──────────────────────────────────────────────────────────────────

  const goHome = () => { dispatch({ type: ACTIONS.EXIT_WORLD }); navigate('home') }

  // ── Treasure reward ──────────────────────────────────────────────────────────

  function handleTreasureReward(reward) {
    for (let i = 0; i < reward.qty; i++) {
      dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: reward.type } })
    }
    if (reward.battleItem) {
      dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: reward.battleItem } })
    }
    playSFX('stage_up')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a1a0a' }}>

      {/* Canvas — fills full viewport */}
      <canvas
        ref={canvasRef}
        width={viewSize.w}
        height={viewSize.h}
        style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
      />

      {/* Fade overlay */}
      <div style={{
        position: 'absolute', inset: 0, background: '#14231a',
        opacity: transOverlay, pointerEvents: 'none',
        transition: 'opacity 160ms ease', zIndex: 20,
      }} />

      {/* Encounter flash */}
      <div style={{
        position: 'absolute', inset: 0, background: '#ffffff',
        opacity: encounterFlash ? 0.85 : 0,
        transition: encounterFlash ? 'none' : 'opacity 300ms ease',
        pointerEvents: 'none', zIndex: 22,
      }} />

      {/* World HUD */}
      <WorldHUD
        screenId={screenId}
        discoveredScreens={state.discoveredScreens}
        state={state}
        onGoHome={goHome}
        onOpenItemBag={() => setItemBagOpen(true)}
        bossMapUnlocked={bossMapUnlocked}
      />

      {/* NPC talk button */}
      {nearNPC && !dialogue && (
        <button onClick={openNPC} style={{
          position: 'absolute', bottom: 8, right: 8, zIndex: 25,
          background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 20,
          padding: '6px 14px', fontFamily: 'Mitr,sans-serif', fontWeight: 700,
          fontSize: 13, color: '#4a2a08', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
          WebkitTapHighlightColor: 'transparent',
        }}>💬 คุย</button>
      )}

      {/* Sign read button */}
      {nearSign && !dialogue && !nearNPC && (
        <button onClick={openSign} style={{
          position: 'absolute', bottom: 8, right: 8, zIndex: 25,
          background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 20,
          padding: '6px 14px', fontFamily: 'Mitr,sans-serif', fontWeight: 700,
          fontSize: 13, color: '#4a2a08', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
          WebkitTapHighlightColor: 'transparent',
        }}>📋 อ่าน</button>
      )}

      {/* D-pad — bottom center, overlays on canvas */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 0.82,
        width: 168,
        height: 168,
        zIndex: 30,
      }}>
        <button onPointerDown={moveUp}    style={DPAD_BTN({ left: 56,  top: 0   })}>▲</button>
        <button onPointerDown={moveLeft}  style={DPAD_BTN({ left: 0,   top: 56  })}>◄</button>
        <div style={{ position: 'absolute', left: 56, top: 56, width: 56, height: 56 }} />
        <button onPointerDown={moveRight} style={DPAD_BTN({ left: 112, top: 56  })}>►</button>
        <button onPointerDown={moveDown}  style={DPAD_BTN({ left: 56,  top: 112 })}>▼</button>
      </div>

      {/* Dialogue overlay */}
      {dialogue && (
        <div onClick={advance} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          display: 'flex', alignItems: 'flex-end',
          padding: '0 12px 20px',
        }}>
          <div style={{
            width: '100%', background: 'rgba(10,25,10,0.95)',
            border: '2px solid #4a8a4a', borderRadius: 12,
            padding: '14px 16px', fontFamily: 'Mitr,sans-serif',
            color: '#e8f8e8', fontSize: 16, lineHeight: 1.7,
            boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
          }}>
            <div>{dialogue.lines[dialogue.index]}</div>
            <div style={{ fontSize: 11, color: '#80c080', textAlign: 'right', marginTop: 6 }}>แตะเพื่อดำเนินต่อ ▶</div>
          </div>
        </div>
      )}

      {/* Treasure slot machine overlay */}
      {slotMachineOpen && (
        <TreasureSlot
          subject={getBattleSubject(stateRef.current.sessionLog, stateRef.current)}
          onReward={handleTreasureReward}
          onClose={() => setSlotMachineOpen(false)}
        />
      )}

      {/* Boss confirm dialog */}
      {bossConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.78)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#1a0a0a', border: '2px solid #aa2020', borderRadius: 14,
            padding: '20px 24px', maxWidth: 280, width: '100%',
            fontFamily: 'Mitr,sans-serif', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚔️</div>
            <div style={{ color: '#ffb0b0', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              พบบอส Final!
            </div>
            <div style={{ color: '#d0a0a0', fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
              {WORLD_LEVELS[state.worldLevel ?? 0]?.bossNameTH} กำลังรออยู่!<br />
              พร้อมสู้หรือยัง?
            </div>
            <div style={{
              background: 'rgba(180,40,20,0.18)', border: '1px solid #aa3020',
              borderRadius: 8, padding: '7px 12px', marginBottom: 18,
              color: '#ffaa80', fontSize: 12, lineHeight: 1.5,
            }}>
              ⚠️ ใช้ไอเทมไม่ได้ในการสู้ครั้งนี้
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setBossConfirm(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  background: '#2a1010', border: '1px solid #553030',
                  color: '#c09090', fontFamily: 'Mitr,sans-serif', fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                หนีก่อน
              </button>
              <button
                onClick={enterBossBattle}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  background: '#8a1010', border: '1px solid #cc2020',
                  color: '#fff', fontFamily: 'Mitr,sans-serif', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                สู้เลย! ⚔️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maze notification */}
      {state.mazeActive && !state.mazeCleared && (() => {
        const expiry = state.secretMapExpiry
        const msLeft = expiry ? Math.max(0, expiry - Date.now() + mazeTimerTick * 0) : 0
        const mins   = Math.floor(msLeft / 60000)
        const secs   = Math.floor((msLeft % 60000) / 1000)
        const countdown = expiry ? ` · ${mins}:${String(secs).padStart(2, '0')}` : ''
        return (
          <div style={{
            position: 'absolute', bottom: 200, left: 0, right: 0, zIndex: 28,
            display: 'flex', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{
              background: 'rgba(24,8,48,0.92)', border: '1px solid #6030a0',
              borderRadius: 10, padding: '8px 16px',
              fontFamily: 'Mitr,sans-serif', color: '#c090ff', fontSize: 13,
            }}>
              🌀 แมพลับปรากฏทางทิศใต้{countdown}
            </div>
          </div>
        )
      })()}

      {/* World unlock banner */}
      {worldUnlockBanner && (
        <div style={{
          position: 'absolute', top: HUD_CONTENT_H + 12, left: 0, right: 0, zIndex: 35,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.88)', border: '2px solid #e0c030',
            borderRadius: 12, padding: '12px 20px',
            fontFamily: 'Mitr,sans-serif', textAlign: 'center',
          }}>
            <div style={{ color: '#ffe060', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              ✨ ปลดล็อคโลกใหม่!
            </div>
            <div style={{ color: '#d0c060', fontSize: 14 }}>{worldUnlockBanner}</div>
          </div>
        </div>
      )}

      {/* Boss cutscene banner */}
      {bossCutscene && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, fontFamily: 'Mitr,sans-serif', textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <div style={{ color: '#ffe060', fontSize: 22, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>
            โชแปงพิชิต
          </div>
          <div style={{ color: '#ffcc00', fontSize: 28, fontWeight: 900, marginBottom: 16 }}>
            {bossCutscene}!
          </div>
          <div style={{ color: '#c0b080', fontSize: 15, lineHeight: 1.7 }}>
            กำลังย้ายไปโลกใหม่...
          </div>
        </div>
      )}

      {/* Item bag popup */}
      {itemBagOpen && (
        <div
          onClick={() => setItemBagOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 55,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0e1a0e', border: '2px solid #3a6a3a',
              borderRadius: 14, padding: '18px 20px', maxWidth: 280, width: '88%',
              fontFamily: 'Mitr,sans-serif',
            }}
          >
            <div style={{ color: '#a0d0a0', fontSize: 15, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>
              🎒 ไอเทมสนาม
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {HOME_ITEM_KEYS.map(key => {
                const count = (state.items ?? {})[key] ?? 0
                return (
                  <button
                    key={key}
                    disabled={count === 0}
                    onClick={() => {
                      if (count === 0) return
                      dispatch({ type: ACTIONS.USE_ITEM, payload: { key } })
                    }}
                    style={{
                      padding: '10px 8px', borderRadius: 10,
                      background: count > 0 ? 'rgba(40,80,40,0.6)' : 'rgba(20,30,20,0.4)',
                      border: count > 0 ? '1px solid #3a6a3a' : '1px solid #1a2a1a',
                      color: count > 0 ? '#c0e0c0' : '#405040',
                      cursor: count > 0 ? 'pointer' : 'default',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{HOME_ITEM_LABELS[key]}</div>
                    <div style={{ fontSize: 11, color: count > 0 ? '#80c080' : '#304030', marginBottom: 4 }}>
                      {HOME_ITEM_EFFECTS[key]}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-pixel)', fontSize: 11,
                      color: count > 0 ? '#a8d060' : '#304030',
                    }}>
                      ×{count}
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setItemBagOpen(false)}
              style={{
                marginTop: 14, width: '100%', padding: '8px 0', borderRadius: 8,
                background: 'rgba(30,50,30,0.5)', border: '1px solid #2a4a2a',
                color: '#608060', fontFamily: 'Mitr,sans-serif', fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Boss unlock hint */}
      {screenId === 'BOSS' && !bossMapUnlocked && (
        <div style={{
          position: 'absolute', top: HUD_CONTENT_H + 12, left: 0, right: 0, zIndex: 28,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(20,10,30,0.92)', border: '1px solid #604060',
            borderRadius: 10, padding: '8px 16px',
            fontFamily: 'Mitr,sans-serif', color: '#c080c0', fontSize: 12, textAlign: 'center',
          }}>
            🔒 เคลียร์ครบ 4 แมพ + XP {BOSS_XP_THRESHOLD} เพื่อต่อสู้บอส<br />
            ({clearedMaps.length}/4 แมพ · {totalXP}/{BOSS_XP_THRESHOLD} XP)
          </div>
        </div>
      )}
    </div>
  )
}
