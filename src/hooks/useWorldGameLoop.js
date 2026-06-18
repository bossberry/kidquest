import { useEffect } from 'react'
import { T, canMove, getCamera, renderMap, renderPlayer } from '../lib/tileEngine.js'
import { drawEnemy } from '../lib/drawEnemy.js'
import { drawChest, drawPlayerGlow } from '../lib/worldDrawHelpers.js'
import { playSFX } from '../lib/audio.js'

const TILE = 16
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
  eggColorRef, HUD_CONTENT_H,
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
            if (ne.timer >= 6 && !saiyanActive) {
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
      const { camX, camY: camYBase } = getCamera(g.displayX, g.displayY, vw, vh)
      const PANEL_H = 72  // approximate height of MissionPanel
      const camY = camYBase - Math.round((HUD_CONTENT_H + PANEL_H) / 2)
      ctx.clearRect(0, 0, vw, vh)
      renderMap(ctx, tileMap, null, null, camX, camY, g.frame)
      renderEnemies(ctx, camX, camY)
      renderChests(ctx, camX, camY, g.frame)
      // Player glow drawn behind the sprite
      const playerGlowX = Math.round(g.displayX * TILE - camX)
      const playerGlowY = Math.round(g.displayY * TILE - camY)
      drawPlayerGlow(ctx, playerGlowX, playerGlowY, g.frame)
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
