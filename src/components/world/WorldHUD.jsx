import React, { useState } from 'react'
import { MAP_THEMES, todayStr } from '../../config/gameConfig.js'
import { WORLD_LEVELS, WORLD_THEME_ICON } from '../../config/worldConfig.js'
import { MATERIALS } from '../../lib/roomItems.js'
import PixelItemIcon from '../PixelItemIcon.jsx'

const DAILY_MATERIAL_CAP = 15 // mirrors WorldScreen.jsx's DAILY_MATERIAL_CAP

export const BATTLE_ITEM_KEYS = ['scroll', 'thunder', 'gem', 'mirror', 'clover']
export const HOME_ITEM_KEYS = ['food', 'ribbon', 'shoes', 'rainbow_star']
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

// eslint-disable-next-line no-unused-vars
const HOME_ITEM_LABELS = { food: 'อาหาร', ribbon: 'ริบบิ้น', shoes: 'รองเท้า', rainbow_star: 'ดาวสีรุ้ง' }
// eslint-disable-next-line no-unused-vars
const HOME_ITEM_EFFECTS = { food: 'ฟื้น HP', ribbon: 'SPD+10', shoes: 'วิ่ง×4', rainbow_star: 'หลบศัตรูตาม!' }

export default function WorldHUD({ screenId, discoveredScreens, state, onGoHome, onOpenItemBag, bossMapActive }) {
  const [matOpen, setMatOpen] = useState(true)
  const ownedMats = MATERIALS.filter(m => (state.materials?.[m.id] ?? 0) > 0)
  const materialsUsedToday = (state.lastMaterialDate === todayStr()) ? (state.dailyMaterialsCollected || 0) : 0
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
  const homeItems   = state.homeItems   ?? {}
  const battleItems = state.battleItems ?? {}

  // Mini-map: 2×2 regular slots + BOSS row
  const groundColor = WORLD_LEVELS[worldLevel]?.bgColors?.ground ?? '#2a4a2a'
  const swSlot = mazeActive ? 'MAZE' : 'SW'
  const miniRows = [
    ['NW', 'NE'],
    [swSlot, 'SE'],
  ]

  function miniTileColor(id, isDisc) {
    if (!isDisc) return '#080e08'
    if (id === 'BOSS') return bossMapActive ? '#380000' : '#1a1a1a'
    if (id === 'MAZE') return '#180830'
    return groundColor
  }

  const homeItemCount = HOME_ITEM_KEYS.reduce((n, k) => n + (homeItems[k] ?? 0), 0)

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      paddingTop: 'env(safe-area-inset-top, 0px)',
      // Fix 5 (2026-07-02, Pandora-style visual polish): translucent + blurred
      // instead of a near-opaque bar, so the map is visible through it and it
      // reads as floating over the scene rather than covering it.
      background: 'rgba(5,10,5,0.4)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(50,110,50,0.25)',
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
                  outline: isCurrent ? '1px solid #ff4040' : (bossMapActive ? '1px solid #aa1010' : '1px solid #182018'),
                  outlineOffset: -1, position: 'relative',
                }}>
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(255,80,80,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 7, color: '#fff',
                    }}>★</div>
                  )}
                  {!isCurrent && bossMapActive && (
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
          {/* World badge — theme emoji (icon-first: a pre-reader IDs the
              current world by icon) + cleared-map count + short name. */}
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: 6,
            color: 'rgba(130,190,130,0.55)', lineHeight: 1, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 11, lineHeight: 1 }}>
              {WORLD_THEME_ICON[WORLD_LEVELS[worldLevel]?.theme] ?? '🗺️'}
            </span>
            <span>{clearedMaps.length}/4</span>
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
              const count = battleItems[key] ?? 0
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

      {/* Collected materials — tiny, only shown once the child owns any, tap
          to collapse/expand so it never crowds the main bar above. Includes a
          small daily-gather-progress line (2026-07-08) once any materials
          have been collected today, alongside the map-collectible nodes. */}
      {ownedMats.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px',
          background: 'rgba(5,10,5,0.4)', backdropFilter: 'blur(6px)',
          borderBottom: matOpen ? '1px solid rgba(50,110,50,0.2)' : 'none',
        }}>
          <button onClick={() => setMatOpen(o => !o)} aria-label="วัตถุดิบ" style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 9, color: 'rgba(150,200,150,0.6)', WebkitTapHighlightColor: 'transparent',
          }}>
            🎒{matOpen ? '▾' : '▸'}
          </button>
          {matOpen && ownedMats.map(m => (
            <span key={m.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              fontFamily: 'var(--font-pixel)', fontSize: 8, color: '#c0c8c0',
            }}>
              <span style={{ fontSize: 11 }}>{m.icon}</span>{state.materials[m.id]}
            </span>
          ))}
          {matOpen && materialsUsedToday > 0 && (
            <span style={{
              fontFamily: 'var(--font-thai)', fontSize: 9, color: 'rgba(150,200,150,0.55)',
              marginLeft: 2,
            }}>
              เก็บแล้ว {materialsUsedToday}/{DAILY_MATERIAL_CAP} วันนี้
            </span>
          )}
        </div>
      )}
    </div>
  )
}
