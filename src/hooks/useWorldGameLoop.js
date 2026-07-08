import { useEffect } from 'react'
import {
  T, canMove, MAP_COLS, MAP_ROWS,
  PANDORA_TILE, renderMapPandora, renderPlayerPandora,
} from '../lib/tileEngine.js'
import { drawEnemyPandora } from '../lib/drawEnemy.js'
import { drawPandoraChest, drawPandoraPlayerGlow, drawMazePortal, drawPandoraCollectible } from '../lib/worldDrawHelpers.js'
import { playSFX } from '../lib/audio.js'

const DIRS4 = [[0,-1],[0,1],[-1,0],[1,0]]

/**
 * useWorldGameLoop — owns the RAF render/update loop: enemy AI, collision-driven
 * battle pending, chest rendering, player rendering, camera.
 *
 * Everything is read through refs (closure capture) so this effect can stay
 * stable with an empty dependency array, matching the original WorldScreen
 * implementation exactly. Do not refactor this into reading React state directly.
 */
export function useWorldGameLoop({
  canvasRef, gameRef, tileMapRef, enemiesRef, chestsRef, stateRef,
  battlePendingRef, battleDispatchedRef, triggerBattleRef,
  HUD_CONTENT_H, screenIdRef, mazePortalPosRef,
  fogOverlayRef, torchRingRef, mazeExitPosRef,
  collectiblesRef, materialsLeftRef,
}) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let alive = true

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
      const saiyanActive = (stateRef.current.activeBoosts?.rainbow_star?.endsAt ?? 0) > Date.now()
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
            // Chase player when woken — but not while saiyan boost is active
            if (ne.woken && ne.timer >= 60 && gc && !saiyanActive) {
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
            if (ne.timer >= 12 && !saiyanActive) {
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
          case 'ghost_wisp': {
            // Slow random drift — never chases, always passive
            if (ne.timer >= 70) {
              ne.timer = 0
              ne.rngSeed = (ne.rngSeed * 31 + 7) % 97
              const d = DIRS4[ne.rngSeed % 4]
              const nc = ne.col + d[0]; const nr = ne.row + d[1]
              if (canMove(tileMap, nc, nr)) { ne.col = nc; ne.row = nr }
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

            if (ne.isAggro && !saiyanActive) {
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
            } else if (!ne.isAggro) {
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
        if (!pendingBattle && isChaser && !saiyanActive && !battleDispatchedRef.current) {
          const gc = gameRef.current
          if (gc && ne.col === gc.col && ne.row === gc.row) {
            pendingBattle = ne
          }
        }

        return ne
      }).filter(Boolean)

      return pendingBattle
    }

    function loop(now) {
      if (!alive) return
      rafIdRef.current = requestAnimationFrame(loop)

      // Pause all game logic (enemy AI, collision, rendering) while PartySelect is showing
      if (battlePendingRef.current) return

      const g = gameRef.current
      const tileMap = tileMapRef.current
      if (!g || !tileMap) return

      if (g.moving) {
        const speedMult = window.__kq_moveSpeedMult ?? 1.0
        const t = Math.min(1, (now - g.moveStartTime) / (120 / speedMult))
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
      ctx.clearRect(0, 0, vw, vh)

      // Pandora-style pseudo-3D renderer (2026-07-02) — sole world-map
      // renderer as of Stage 6/6. Fully replaces both the original flat
      // top-down renderer and the isometric-diamond experiment that
      // preceded this rewrite (both removed; see docs/CHANGELOG.md and the
      // dated entries in docs/CHATBOT_NOTES.md for the staged history).
      // Camera follows the player, clamped to map bounds; ground draws as
      // one flat pass inside renderMapPandora(), then every standing/moving
      // object (player, enemies, chests, plus signs/NPCs/trees/rocks baked
      // into the per-tile loop in tileEngine.js) is Y-sorted by its
      // ground-contact screen point so nearer things correctly occlude
      // farther ones.
      const mapPixW = MAP_COLS * PANDORA_TILE
      const mapPixH = MAP_ROWS * PANDORA_TILE
      const rawCamX = g.displayX * PANDORA_TILE + PANDORA_TILE / 2 - vw / 2
      const rawCamY = g.displayY * PANDORA_TILE + PANDORA_TILE / 2 - vh / 2
      const camX = mapPixW <= vw ? -(vw - mapPixW) / 2 : Math.max(0, Math.min(rawCamX, mapPixW - vw))
      const camYBase = mapPixH <= vh ? -(vh - mapPixH) / 2 : Math.max(0, Math.min(rawCamY, mapPixH - vh))
      const PANEL_H = 72 // approximate height of MissionPanel
      const camY = camYBase - Math.round((HUD_CONTENT_H + PANEL_H) / 2)

      const inMaze = screenIdRef?.current === 'MAZE'
      const playerGroundX = g.displayX * PANDORA_TILE + PANDORA_TILE / 2 - camX
      const playerGroundY = g.displayY * PANDORA_TILE + PANDORA_TILE * 0.8 - camY
      const saiyanOn = (stateRef.current.activeBoosts?.rainbow_star?.endsAt ?? 0) > Date.now()

      const entities = [{
        y: playerGroundY,
        draw: () => {
          // Ambient glow (non-maze screens only — maze uses the fog/torch
          // DOM overlay instead, positioned below) drawn UNDER the player
          // sprite, same layering as the original flat renderer.
          if (!inMaze) drawPandoraPlayerGlow(ctx, playerGroundX, playerGroundY - 24, g.frame)
          if (saiyanOn) {
            ctx.save()
            // Fast rainbow cycle: full 360° hue rotation every ~60 frames (≈1s @60fps)
            const hue = (g.frame * 6) % 360
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
            ctx.shadowBlur = 18
            renderPlayerPandora(ctx, playerGroundX, playerGroundY)
            ctx.restore()
          } else {
            renderPlayerPandora(ctx, playerGroundX, playerGroundY)
          }
        },
      }]

      for (const e of enemiesRef.current) {
        if (e.defeated || e.dead) continue
        const ex = e.col * PANDORA_TILE + PANDORA_TILE / 2 - camX
        let ey = e.row * PANDORA_TILE + PANDORA_TILE * 0.8 - camY
        if (e.type === 'ghost_wisp') ey += Math.sin((g.frame + e.col * 13) * 0.08) * 3
        const showAlert = e.isWorldBoss || (e.type === 'sleepy_bunny' && e.woken) || (e.type === 'snake' && e.aggroTimer > 0)
        const alertColor = e.isWorldBoss ? '#ff2020' : (e.type === 'snake' ? '#ff4444' : '#ffffff')
        entities.push({
          y: ey,
          draw: () => {
            drawEnemyPandora(ctx, e.type, ex, ey, g.frame)
            if (showAlert) {
              ctx.fillStyle = alertColor
              ctx.font = 'bold 18px monospace'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'bottom'
              ctx.fillText('!', ex, ey - 32)
            }
          },
        })
      }

      for (const chest of chestsRef.current) {
        if (chest.opened) continue
        const cx = chest.col * PANDORA_TILE + PANDORA_TILE / 2 - camX
        const cy = chest.row * PANDORA_TILE + PANDORA_TILE * 0.8 - camY
        entities.push({ y: cy, draw: () => drawPandoraChest(ctx, cx, cy, g.frame) })
      }

      // Collectible resource nodes (2026-07-08) — same Y-sort/ground-anchor
      // pattern as chests above, so they occlude correctly against trees/
      // player/enemies. `locked` (daily cap reached) dims every remaining
      // node and adds a 🔒 badge rather than removing them — they're still
      // visible, just not yielding anything until the cap resets.
      if (collectiblesRef?.current) {
        const capped = (materialsLeftRef?.current ?? 1) <= 0
        for (const node of collectiblesRef.current) {
          if (node.collected) continue
          const nx = node.col * PANDORA_TILE + PANDORA_TILE / 2 - camX
          const ny = node.row * PANDORA_TILE + PANDORA_TILE * 0.8 - camY
          entities.push({ y: ny, draw: () => drawPandoraCollectible(ctx, nx, ny, node, g.frame, capped) })
        }
      }

      // World-map entry portal (shown on NW/NE/SW/SE screens) + maze exit
      // portal (shown only inside MAZE) — reused as-is from the original
      // flat renderer's cosmetic overlay effect, Y-sorted like everything
      // else so the player correctly draws over/under it while walking past.
      if (mazePortalPosRef?.current) {
        const ppx = mazePortalPosRef.current.col * PANDORA_TILE + PANDORA_TILE / 2 - camX
        const ppy = mazePortalPosRef.current.row * PANDORA_TILE + PANDORA_TILE * 0.8 - camY
        entities.push({ y: ppy, draw: () => drawMazePortal(ctx, ppx, ppy, g.frame) })
      }
      if (inMaze && mazeExitPosRef?.current) {
        const epx = mazeExitPosRef.current.col * PANDORA_TILE + PANDORA_TILE / 2 - camX
        const epy = mazeExitPosRef.current.row * PANDORA_TILE + PANDORA_TILE * 0.8 - camY
        entities.push({ y: epy, draw: () => drawMazePortal(ctx, epx, epy, g.frame) })
      }

      renderMapPandora(ctx, tileMap, camX, camY, g.frame, entities, inMaze)

      if (inMaze) {
        // Fog is a DOM overlay div — update its CSS mask + torch ring position
        // every frame, centered roughly on the player sprite's midpoint.
        const fogCx = playerGroundX
        const fogCy = playerGroundY - 24
        if (fogOverlayRef?.current) {
          const flicker = Math.sin(g.frame * 0.15) * 6 + Math.sin(g.frame * 0.37 + 1.3) * 4
          const radius = 78 + flicker
          const mask = `radial-gradient(circle ${radius}px at ${fogCx}px ${fogCy}px, transparent 0%, transparent 60%, rgba(0,0,0,0.6) 88%, black 100%)`
          fogOverlayRef.current.style.WebkitMaskImage = mask
          fogOverlayRef.current.style.maskImage = mask
        }
        if (torchRingRef?.current) {
          const flicker2 = Math.sin(g.frame * 0.15) * 6 + Math.sin(g.frame * 0.37 + 1.3) * 4
          const ringSize = 130 + flicker2 * 1.5
          torchRingRef.current.style.left   = `${fogCx}px`
          torchRingRef.current.style.top    = `${fogCy}px`
          torchRingRef.current.style.width  = `${ringSize}px`
          torchRingRef.current.style.height = `${ringSize}px`
        }
      }
    }

    const rafIdRef = { current: null }
    rafIdRef.current = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(rafIdRef.current); respawnTimerIds.forEach(clearTimeout) }
  }, []) // stable — reads from refs only, matches original exactly
}
