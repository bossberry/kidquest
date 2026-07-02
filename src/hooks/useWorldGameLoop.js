import { useEffect } from 'react'
import {
  T, canMove, getCamera, renderMap, renderPlayer,
  MAP_COLS, MAP_ROWS, isoProject, renderMapIso, renderPlayerIso,
  PANDORA_TILE, renderMapPandora,
} from '../lib/tileEngine.js'
import { drawEnemy } from '../lib/drawEnemy.js'
import { drawChest, drawPlayerGlow, drawMazePortal } from '../lib/worldDrawHelpers.js'
import { playSFX } from '../lib/audio.js'

const TILE = 16
const DIRS4 = [[0,-1],[0,1],[-1,0],[1,0]]

// Stage 1/6 iso-world-map debug toggle. Defaults to on for in-progress iso
// work; flip `window.__kq_isoDebug = false` in the console to compare against
// the original flat top-down renderer (zero behavior change when off).
// Only sets the default once — won't clobber a value already toggled at runtime.
if (typeof window !== 'undefined' && window.__kq_isoDebug === undefined) {
  window.__kq_isoDebug = true
}

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
  eggColorRef, HUD_CONTENT_H, screenIdRef, mazePortalPosRef,
  fogOverlayRef, torchRingRef, mazeExitPosRef,
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

    function renderEnemies(ctx, camX, camY, frame) {
      const spriteSize = TILE * 2
      enemiesRef.current.forEach(e => {
        if (e.defeated) return
        const sz = e.type === 'baby_zombie' ? Math.round(spriteSize * 0.6) : spriteSize
        const cx = Math.round((e.col + 0.5) * TILE - camX)
        let cy = Math.round((e.row + 0.5) * TILE - camY)

        // Ghosts bob up and down gently
        if (e.type === 'ghost_wisp') {
          cy += Math.round(Math.sin((frame + e.col * 13) * 0.08) * 3)
        }

        const px = cx - sz / 2
        const py = cy - sz / 2

        if (e.type === 'ghost_wisp') {
          ctx.save()
          ctx.shadowColor = 'rgba(180,140,255,0.8)'
          ctx.shadowBlur = 10
          drawEnemy(ctx, e.type, sz, px, py)
          ctx.restore()
        } else {
          drawEnemy(ctx, e.type, sz, px, py)
        }
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

      if (window.__kq_pandoraDebug) {
        // Stage 1/6 of the Pandora-style pseudo-3D world-map rewrite (this
        // supersedes the isometric track above — different, non-isometric
        // technique, kept behind its own flag so the two experiments never
        // collide). Ground tiles only this stage (grass/path/water/tall
        // grass) — no trees/objects/entities/Y-sort yet, and still a STATIC
        // map-centered camera since there's no player drawn yet to follow.
        const pandoraCamX = (MAP_COLS / 2) * PANDORA_TILE - vw / 2
        const pandoraCamY = (MAP_ROWS / 2) * PANDORA_TILE - vh / 2
        renderMapPandora(ctx, tileMap, pandoraCamX, pandoraCamY, g.frame)
        return
      }

      if (window.__kq_isoDebug) {
        // Stage 3/6: player egg drawn in iso space with the existing
        // tile-space walk tween (g.displayX/displayY, unchanged) reprojected
        // through isoProject() every frame — still a STATIC map-centered
        // camera (camera-follow lands in Stage 5 alongside D-pad/collision
        // remapping), so the player can walk toward/away from a fixed view
        // this stage. Enemies/chests/portals still not drawn iso (Stage 4).
        const center = isoProject(MAP_COLS / 2, MAP_ROWS / 2, 0, 0)
        const isoCamX = center.px - vw / 2
        const isoCamY = center.py - vh / 2
        renderMapIso(ctx, tileMap, isoCamX, isoCamY, g.frame)
        renderPlayerIso(ctx, g.displayX, g.displayY, g.dir, g.walkFrame, eggColorRef.current, isoCamX, isoCamY)
        return
      }

      const { camX, camY: camYBase } = getCamera(g.displayX, g.displayY, vw, vh)
      const PANEL_H = 72  // approximate height of MissionPanel
      const camY = camYBase - Math.round((HUD_CONTENT_H + PANEL_H) / 2)
      renderMap(ctx, tileMap, null, null, camX, camY, g.frame)
      renderEnemies(ctx, camX, camY, g.frame)
      renderChests(ctx, camX, camY, g.frame)
      // World-map entry portal (shown on NW/NE/SW/SE screens)
      if (mazePortalPosRef?.current) {
        const ppx = Math.round(mazePortalPosRef.current.col * TILE - camX)
        const ppy = Math.round(mazePortalPosRef.current.row * TILE - camY)
        drawMazePortal(ctx, ppx, ppy, g.frame)
      }
      // Maze exit portal (shown only inside MAZE, at the opposite corner from entry)
      if (screenIdRef?.current === 'MAZE' && mazeExitPosRef?.current) {
        const epx = Math.round(mazeExitPosRef.current.col * TILE - camX)
        const epy = Math.round(mazeExitPosRef.current.row * TILE - camY)
        drawMazePortal(ctx, epx, epy, g.frame)
      }

      const playerGlowX = Math.round(g.displayX * TILE - camX)
      const playerGlowY = Math.round(g.displayY * TILE - camY)
      if (screenIdRef?.current === 'MAZE') {
        // Fog is a DOM overlay div — update its CSS mask + torch ring position every frame
        if (fogOverlayRef?.current) {
          const flicker = Math.sin(g.frame * 0.15) * 6 + Math.sin(g.frame * 0.37 + 1.3) * 4
          const radius = 78 + flicker
          const mask = `radial-gradient(circle ${radius}px at ${playerGlowX}px ${playerGlowY}px, transparent 0%, transparent 60%, rgba(0,0,0,0.6) 88%, black 100%)`
          fogOverlayRef.current.style.WebkitMaskImage = mask
          fogOverlayRef.current.style.maskImage = mask
        }
        if (torchRingRef?.current) {
          const flicker2 = Math.sin(g.frame * 0.15) * 6 + Math.sin(g.frame * 0.37 + 1.3) * 4
          const ringSize = 130 + flicker2 * 1.5
          torchRingRef.current.style.left   = `${playerGlowX}px`
          torchRingRef.current.style.top    = `${playerGlowY}px`
          torchRingRef.current.style.width  = `${ringSize}px`
          torchRingRef.current.style.height = `${ringSize}px`
        }
      } else {
        drawPlayerGlow(ctx, playerGlowX, playerGlowY, g.frame)
      }
      const saiyanOn = (stateRef.current.activeBoosts?.rainbow_star?.endsAt ?? 0) > Date.now()
      if (saiyanOn) {
        ctx.save()
        // Fast rainbow cycle: full 360° hue rotation every ~60 frames (≈1 second at 60fps)
        const hue = (g.frame * 6) % 360
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
        ctx.shadowBlur = 18
        renderPlayer(ctx, g.displayX, g.displayY, g.dir, g.walkFrame, eggColorRef.current, camX, camY)
        ctx.restore()
      } else {
        renderPlayer(ctx, g.displayX, g.displayY, g.dir, g.walkFrame, eggColorRef.current, camX, camY)
      }
    }

    const rafIdRef = { current: null }
    rafIdRef.current = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(rafIdRef.current); respawnTimerIds.forEach(clearTimeout) }
  }, []) // stable — reads from refs only, matches original exactly
}
