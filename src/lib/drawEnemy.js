// Enemy sprite renderer — Canvas 2D pixel art (design space: 48×48 units)

export function drawEnemy(ctx, enemyType, size) {
  ctx.clearRect(0, 0, size, size)
  const p = (v) => Math.round(v * size / 48)
  switch (enemyType) {
    case 'bunny':    return _bunny(ctx, p)
    case 'slime':    return _slime(ctx, p)
    case 'fox':      return _fox(ctx, p)
    case 'egg_pawn': return _eggPawn(ctx, p)
    default:         return _bunny(ctx, p)
  }
}

function _bunny(ctx, p) {
  // Floppy ears
  ctx.fillStyle = '#e8d8d0'
  ctx.beginPath(); ctx.ellipse(p(16), p(13), p(4), p(10), -0.3, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(p(32), p(13), p(4), p(10),  0.3, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = '#ffb0b0'
  ctx.beginPath(); ctx.ellipse(p(16), p(14), p(2.2), p(7), -0.3, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(p(32), p(14), p(2.2), p(7),  0.3, 0, Math.PI*2); ctx.fill()

  // Body
  ctx.fillStyle = '#f0ece8'
  ctx.beginPath(); ctx.ellipse(p(24), p(32), p(12), p(10), 0, 0, Math.PI*2); ctx.fill()

  // Head
  ctx.fillStyle = '#f0ece8'
  ctx.beginPath(); ctx.arc(p(24), p(20), p(10), 0, Math.PI*2); ctx.fill()

  // Blush
  ctx.fillStyle = 'rgba(255,150,150,0.38)'
  ctx.beginPath(); ctx.ellipse(p(17), p(23), p(4), p(2.5), 0, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(p(31), p(23), p(4), p(2.5), 0, 0, Math.PI*2); ctx.fill()

  // Closed droopy eyes
  ctx.strokeStyle = '#555'; ctx.lineWidth = Math.max(1, p(1.8)); ctx.lineCap = 'round'
  ctx.beginPath(); ctx.ellipse(p(20), p(20), p(3.5), p(1.5), 0, 0, Math.PI); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(p(28), p(20), p(3.5), p(1.5), 0, 0, Math.PI); ctx.stroke()

  // Nose
  ctx.fillStyle = '#c09090'
  ctx.beginPath(); ctx.arc(p(24), p(25), p(1.5), 0, Math.PI*2); ctx.fill()

  // Flower crown
  const petals = ['#ff9090','#ffcc66','#99ccff','#cc99ff','#99ff99']
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    ctx.fillStyle = petals[i]
    ctx.beginPath(); ctx.arc(p(24) + p(3.5)*Math.cos(a), p(9) + p(3.5)*Math.sin(a), p(2.5), 0, Math.PI*2); ctx.fill()
  }
  ctx.fillStyle = '#ffe0a0'
  ctx.beginPath(); ctx.arc(p(24), p(9), p(2), 0, Math.PI*2); ctx.fill()

  // ZZZ
  ctx.fillStyle = '#aaaaff'
  ctx.font = `bold ${p(9)}px monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText('z', p(35), p(11))
  ctx.font = `bold ${p(7)}px monospace`
  ctx.fillText('z', p(39), p(7))
}

function _slime(ctx, p) {
  // Body shadow
  ctx.fillStyle = 'rgba(0,120,0,0.18)'
  ctx.beginPath(); ctx.ellipse(p(24), p(36), p(13), p(4), 0, 0, Math.PI*2); ctx.fill()

  // Main body
  ctx.fillStyle = '#5acd5a'
  ctx.beginPath(); ctx.arc(p(24), p(26), p(16), 0, Math.PI*2); ctx.fill()
  // Flat bottom clip
  ctx.fillStyle = '#5acd5a'
  ctx.fillRect(p(8), p(33), p(32), p(8))

  // Highlight blob
  ctx.fillStyle = '#8aff8a'
  ctx.beginPath(); ctx.ellipse(p(16), p(18), p(6), p(4), -0.4, 0, Math.PI*2); ctx.fill()

  // Eyes (white)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(p(17), p(24), p(6), 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(p(31), p(24), p(6), 0, Math.PI*2); ctx.fill()
  // Pupils
  ctx.fillStyle = '#222'
  ctx.beginPath(); ctx.arc(p(18), p(24), p(3), 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(p(32), p(24), p(3), 0, Math.PI*2); ctx.fill()
  // Eye shine
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(p(19), p(22), p(1.2), 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(p(33), p(22), p(1.2), 0, Math.PI*2); ctx.fill()

  // Smile
  ctx.strokeStyle = '#2a7a2a'; ctx.lineWidth = Math.max(1, p(2)); ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(p(24), p(28), p(7), 0.1, Math.PI - 0.1); ctx.stroke()

  // Tiny hat (flower pot)
  ctx.fillStyle = '#a05020'
  ctx.fillRect(p(19), p(7), p(10), p(5))
  ctx.fillStyle = '#c06030'
  ctx.fillRect(p(17), p(9), p(14), p(3))
  ctx.fillStyle = '#5acd5a'
  ctx.beginPath(); ctx.arc(p(24), p(7), p(3), 0, Math.PI*2); ctx.fill()
}

function _fox(ctx, p) {
  // Tail (big, behind body)
  ctx.fillStyle = '#e87030'
  ctx.beginPath()
  ctx.moveTo(p(10), p(38)); ctx.bezierCurveTo(p(2), p(22), p(14), p(16), p(20), p(28))
  ctx.bezierCurveTo(p(22), p(34), p(14), p(40), p(10), p(38))
  ctx.fill()
  // Tail tip
  ctx.fillStyle = '#f8f8f8'
  ctx.beginPath(); ctx.ellipse(p(6), p(22), p(5), p(7), -0.3, 0, Math.PI*2); ctx.fill()

  // Body
  ctx.fillStyle = '#e87030'
  ctx.beginPath(); ctx.ellipse(p(26), p(32), p(10), p(11), 0, 0, Math.PI*2); ctx.fill()
  // Belly patch
  ctx.fillStyle = '#f0c080'
  ctx.beginPath(); ctx.ellipse(p(26), p(34), p(6), p(7), 0, 0, Math.PI*2); ctx.fill()

  // Ears (triangles)
  ctx.fillStyle = '#e87030'
  ctx.beginPath(); ctx.moveTo(p(17), p(14)); ctx.lineTo(p(13), p(4)); ctx.lineTo(p(23), p(10)); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(p(31), p(14)); ctx.lineTo(p(35), p(4)); ctx.lineTo(p(25), p(10)); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#ffb0a0'
  ctx.beginPath(); ctx.moveTo(p(17), p(13)); ctx.lineTo(p(15), p(7)); ctx.lineTo(p(21), p(11)); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(p(31), p(13)); ctx.lineTo(p(33), p(7)); ctx.lineTo(p(27), p(11)); ctx.closePath(); ctx.fill()

  // Head
  ctx.fillStyle = '#e87030'
  ctx.beginPath(); ctx.arc(p(24), p(18), p(10), 0, Math.PI*2); ctx.fill()
  // Face belly
  ctx.fillStyle = '#f0c080'
  ctx.beginPath(); ctx.ellipse(p(24), p(20), p(6), p(5), 0, 0, Math.PI*2); ctx.fill()

  // Eyes
  ctx.fillStyle = '#333'
  ctx.beginPath(); ctx.arc(p(20), p(17), p(2.5), 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(p(28), p(17), p(2.5), 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(p(21), p(16), p(1), 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(p(29), p(16), p(1), 0, Math.PI*2); ctx.fill()

  // Nose
  ctx.fillStyle = '#553030'
  ctx.beginPath(); ctx.ellipse(p(24), p(21), p(2), p(1.5), 0, 0, Math.PI*2); ctx.fill()

  // Scarf (blue)
  ctx.fillStyle = '#4488cc'
  ctx.fillRect(p(16), p(27), p(16), p(4))
  ctx.fillStyle = '#6699dd'
  ctx.fillRect(p(16), p(27), p(16), p(1.5))
}

function _eggPawn(ctx, p) {
  // Arms (stubby)
  ctx.fillStyle = '#cc2020'
  ctx.beginPath(); ctx.ellipse(p(10), p(30), p(5), p(4), -0.3, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(p(38), p(30), p(5), p(4),  0.3, 0, Math.PI*2); ctx.fill()

  // Body
  ctx.fillStyle = '#cc2020'
  ctx.beginPath(); ctx.ellipse(p(24), p(30), p(14), p(13), 0, 0, Math.PI*2); ctx.fill()

  // Chest plate
  ctx.fillStyle = '#f0f0f0'
  ctx.beginPath(); ctx.ellipse(p(24), p(31), p(9), p(8), 0, 0, Math.PI*2); ctx.fill()

  // Yellow buttons
  const btnY = [p(26), p(32)]
  ctx.fillStyle = '#ffcc00'
  for (const by of btnY) {
    ctx.beginPath(); ctx.arc(p(24), by, p(2.5), 0, Math.PI*2); ctx.fill()
  }

  // Head
  ctx.fillStyle = '#cc2020'
  ctx.beginPath(); ctx.arc(p(24), p(14), p(9), 0, Math.PI*2); ctx.fill()

  // Visor
  ctx.fillStyle = '#4444cc'
  ctx.beginPath(); ctx.ellipse(p(24), p(14), p(8), p(3.5), 0, 0, Math.PI*2); ctx.fill()
  // Visor shine
  ctx.fillStyle = 'rgba(180,220,255,0.45)'
  ctx.beginPath(); ctx.ellipse(p(22), p(13), p(4), p(1.5), 0, 0, Math.PI*2); ctx.fill()

  // Antennae
  ctx.strokeStyle = '#cc2020'; ctx.lineWidth = Math.max(1, p(1.5)); ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(p(18), p(5)); ctx.lineTo(p(20), p(10)); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(p(30), p(5)); ctx.lineTo(p(28), p(10)); ctx.stroke()
  ctx.fillStyle = '#ffcc00'
  ctx.beginPath(); ctx.arc(p(18), p(4), p(2), 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(p(30), p(4), p(2), 0, Math.PI*2); ctx.fill()

  // Legs
  ctx.fillStyle = '#881818'
  ctx.fillRect(p(16), p(42), p(5), p(5))
  ctx.fillRect(p(27), p(42), p(5), p(5))
}
