// 16×16 pixel art for game items. Scale = canvas.width / 16.

function f(ctx, x, y, w, h, c, s) {
  ctx.fillStyle = c
  ctx.fillRect(x * s | 0, y * s | 0, w * s | 0, h * s | 0)
}

const DRAWERS = {

  chicken_leg(ctx, s) {
    const M='#8B4513', HL='#C68642', SC='#CC2222', D='#3D1A00', W='#F5F5F5', WS='#BBBBBB'
    // Dark outline
    f(ctx,4,1,8,1,D,s); f(ctx,2,2,2,1,D,s); f(ctx,12,2,2,1,D,s)
    f(ctx,1,3,1,6,D,s); f(ctx,14,3,1,6,D,s)
    f(ctx,2,9,2,1,D,s); f(ctx,12,9,2,1,D,s); f(ctx,4,10,8,1,D,s)
    // Meat body
    f(ctx,3,2,10,1,M,s); f(ctx,2,3,12,6,M,s); f(ctx,3,9,10,1,M,s)
    // Highlight
    f(ctx,3,3,4,3,HL,s)
    // Sauce dots
    f(ctx,9,3,2,1,SC,s); f(ctx,8,5,1,2,SC,s); f(ctx,11,6,1,1,SC,s)
    // Bone neck connector
    f(ctx,7,10,2,1,D,s)
    // Bone stick
    f(ctx,6,11,4,3,W,s)
    // Bottom knob (wider)
    f(ctx,4,13,8,2,W,s); f(ctx,4,14,8,1,WS,s)
    // Bone outline
    f(ctx,5,10,6,1,D,s); f(ctx,4,11,1,4,D,s); f(ctx,11,11,1,4,D,s)
    f(ctx,4,15,1,1,D,s); f(ctx,11,15,1,1,D,s); f(ctx,5,15,6,1,D,s)
  },

  ribbon(ctx, s) {
    const P='#FF1493', L='#FF69B4', D='#AA0066'
    // Left wing (staircase triangle pointing right)
    f(ctx,1,7,1,2,P,s); f(ctx,2,5,1,6,P,s); f(ctx,3,4,1,8,P,s); f(ctx,4,3,2,10,P,s)
    f(ctx,2,6,2,4,L,s)  // highlight
    // Right wing (mirror)
    f(ctx,14,7,1,2,P,s); f(ctx,13,5,1,6,P,s); f(ctx,12,4,1,8,P,s); f(ctx,10,3,2,10,P,s)
    f(ctx,12,6,2,4,L,s)
    // Center knot
    f(ctx,6,5,4,6,D,s); f(ctx,7,6,2,4,L,s)
    // Bottom tails
    f(ctx,3,13,4,1,P,s); f(ctx,9,13,4,1,P,s)
    f(ctx,3,14,3,1,P,s); f(ctx,10,14,3,1,P,s)
    // Outline darkening
    f(ctx,1,6,1,1,D,s); f(ctx,1,9,1,1,D,s)
    f(ctx,14,6,1,1,D,s); f(ctx,14,9,1,1,D,s)
  },

  apple(ctx, s) {
    const R='#EE4422', HL='#FF8866', DK='#AA2200', G='#33BB22', GD='#116600', ST='#5C3A1A'
    // Outline ring
    f(ctx,4,3,8,1,DK,s); f(ctx,2,4,1,1,DK,s); f(ctx,13,4,1,1,DK,s)
    f(ctx,1,5,1,6,DK,s); f(ctx,14,5,1,6,DK,s)
    f(ctx,2,11,1,1,DK,s); f(ctx,13,11,1,1,DK,s)
    f(ctx,3,12,1,1,DK,s); f(ctx,12,12,1,1,DK,s); f(ctx,4,13,8,1,DK,s)
    // Body
    f(ctx,4,4,8,1,R,s); f(ctx,3,5,10,6,R,s); f(ctx,4,11,8,1,R,s)
    // Highlight
    f(ctx,3,5,3,3,HL,s)
    // Shadow right
    f(ctx,11,5,2,6,DK,s)
    // Top dip
    f(ctx,7,3,2,1,'#0a0a12',s)
    // Stem
    f(ctx,7,1,2,3,ST,s)
    // Leaf
    f(ctx,9,1,4,1,G,s); f(ctx,9,2,3,1,G,s); f(ctx,9,3,2,1,GD,s)
  },

  shield(ctx, s) {
    const B='#4169E1', L='#7A9FFF', D='#1A3A99', E='#2B52C0'
    // Body
    f(ctx,2,1,12,8,B,s)
    f(ctx,3,9,10,1,B,s); f(ctx,4,10,8,1,B,s)
    f(ctx,5,11,6,1,B,s); f(ctx,6,12,4,1,B,s); f(ctx,7,13,2,1,B,s)
    // Highlight
    f(ctx,3,2,5,4,L,s)
    // Cross emblem
    f(ctx,5,5,6,2,E,s); f(ctx,7,3,2,6,E,s); f(ctx,7,5,2,2,L,s)
    // Border
    f(ctx,2,0,12,1,D,s); f(ctx,1,1,1,8,D,s); f(ctx,14,1,1,8,D,s)
    f(ctx,2,9,1,1,D,s);  f(ctx,13,9,1,1,D,s)
    f(ctx,3,10,1,1,D,s); f(ctx,12,10,1,1,D,s)
    f(ctx,4,11,1,1,D,s); f(ctx,11,11,1,1,D,s)
    f(ctx,5,12,1,1,D,s); f(ctx,10,12,1,1,D,s)
    f(ctx,6,13,1,1,D,s); f(ctx,9,13,1,1,D,s)
    f(ctx,7,14,2,1,D,s)
  },

  star(ctx, s) {
    const G='#FFD700', D='#B8860B', W='#FFFFFF'
    // Horizontal bar
    f(ctx,0,7,16,2,G,s)
    // Vertical bar
    f(ctx,7,0,2,16,G,s)
    // NW diagonal wing
    f(ctx,2,2,2,2,G,s); f(ctx,3,3,2,2,G,s); f(ctx,4,4,2,2,G,s)
    // NE diagonal wing
    f(ctx,12,2,2,2,G,s); f(ctx,11,3,2,2,G,s); f(ctx,10,4,2,2,G,s)
    // SW diagonal wing
    f(ctx,2,12,2,2,G,s); f(ctx,3,11,2,2,G,s); f(ctx,4,10,2,2,G,s)
    // SE diagonal wing
    f(ctx,12,12,2,2,G,s); f(ctx,11,11,2,2,G,s); f(ctx,10,10,2,2,G,s)
    // White center
    f(ctx,6,6,4,4,W,s)
    f(ctx,7,7,2,2,G,s)
    // Tip outlines
    f(ctx,7,0,2,1,D,s); f(ctx,7,15,2,1,D,s)
    f(ctx,0,7,1,2,D,s); f(ctx,15,7,1,2,D,s)
    f(ctx,2,1,1,1,D,s); f(ctx,1,2,1,1,D,s)
    f(ctx,13,1,1,1,D,s); f(ctx,14,2,1,1,D,s)
    f(ctx,2,14,1,1,D,s); f(ctx,1,13,1,1,D,s)
    f(ctx,13,14,1,1,D,s); f(ctx,14,13,1,1,D,s)
  },

  potion(ctx, s) {
    const G='#1D9E75', GL='#55CC99', GD='#0A6A4A', C='#8B6914', CS='#5C3A00', SH='#BBFFDD'
    // Cork
    f(ctx,5,1,6,1,CS,s); f(ctx,5,2,6,3,C,s); f(ctx,5,4,6,1,CS,s)
    // Neck
    f(ctx,6,5,4,2,G,s); f(ctx,5,5,1,2,GD,s); f(ctx,10,5,1,2,GD,s)
    // Bottle body outline
    f(ctx,3,6,1,1,GD,s); f(ctx,12,6,1,1,GD,s)
    f(ctx,2,7,1,6,GD,s); f(ctx,13,7,1,6,GD,s)
    f(ctx,3,13,1,1,GD,s); f(ctx,12,13,1,1,GD,s)
    f(ctx,4,14,8,1,GD,s)
    // Body fill
    f(ctx,3,7,10,6,G,s)
    // Liquid
    f(ctx,4,8,8,4,GL,s)
    // Shine
    f(ctx,4,8,2,4,SH,s); f(ctx,6,7,1,1,SH,s)
    // Bubble
    f(ctx,9,9,2,2,SH,s); f(ctx,10,9,1,1,GL,s)
    // Bottom shading
    f(ctx,3,12,10,1,GD,s); f(ctx,4,13,8,1,GD,s)
    // Cork outline
    f(ctx,5,1,6,1,CS,s); f(ctx,5,2,1,3,CS,s); f(ctx,10,2,1,3,CS,s)
  },

  thunder_gem(ctx, s) {
    const Y='#EF9F27', L='#FAC775', D='#7A5200', W='#FFFFFF'
    // Bolt outline (traced clockwise)
    // Top arm going down-left
    f(ctx,7,0,6,1,D,s); f(ctx,6,1,1,1,D,s); f(ctx,12,1,1,1,D,s)
    f(ctx,5,2,1,1,D,s); f(ctx,11,2,1,1,D,s)
    f(ctx,4,3,1,1,D,s); f(ctx,10,3,1,1,D,s)
    f(ctx,3,4,1,1,D,s); f(ctx,9,4,1,1,D,s)
    f(ctx,2,5,1,1,D,s); f(ctx,13,5,1,2,D,s)
    f(ctx,3,7,4,1,D,s); f(ctx,12,7,1,1,D,s)
    // Bottom arm going down-right
    f(ctx,6,7,1,1,D,s); f(ctx,12,8,1,1,D,s)
    f(ctx,7,8,1,1,D,s); f(ctx,13,9,1,1,D,s)
    f(ctx,8,9,1,1,D,s); f(ctx,14,10,1,1,D,s)
    f(ctx,9,10,1,1,D,s); f(ctx,14,11,1,1,D,s)
    f(ctx,3,11,7,1,D,s); f(ctx,10,12,1,1,D,s)
    f(ctx,3,12,1,1,D,s); f(ctx,4,13,9,1,D,s)
    // Bolt fill
    f(ctx,7,1,5,1,Y,s); f(ctx,6,2,5,1,Y,s); f(ctx,5,3,5,1,Y,s)
    f(ctx,4,4,5,1,Y,s); f(ctx,3,5,10,2,Y,s)
    f(ctx,7,7,5,1,Y,s); f(ctx,8,8,5,1,Y,s); f(ctx,9,9,5,1,Y,s)
    f(ctx,10,10,4,1,Y,s); f(ctx,11,11,2,1,Y,s)
    // Highlights
    f(ctx,9,1,2,1,L,s); f(ctx,6,3,2,1,L,s); f(ctx,4,5,2,1,L,s); f(ctx,9,8,2,1,L,s)
    // White center flash
    f(ctx,5,6,3,1,W,s)
  },

  bone(ctx, s) {
    const W='#F5F5F5', G='#CCCCCC', D='#888888'
    // Left knob outline
    f(ctx,0,4,1,8,D,s); f(ctx,1,3,1,1,D,s); f(ctx,2,2,2,1,D,s); f(ctx,4,3,1,1,D,s)
    f(ctx,4,12,1,1,D,s); f(ctx,2,13,2,1,D,s); f(ctx,1,12,1,1,D,s)
    // Right knob outline
    f(ctx,15,4,1,8,D,s); f(ctx,14,3,1,1,D,s); f(ctx,12,2,2,1,D,s); f(ctx,11,3,1,1,D,s)
    f(ctx,11,12,1,1,D,s); f(ctx,12,13,2,1,D,s); f(ctx,14,12,1,1,D,s)
    // Shaft outline
    f(ctx,4,5,8,1,D,s); f(ctx,4,10,8,1,D,s)
    // Left knob fill
    f(ctx,1,4,3,8,W,s); f(ctx,2,3,2,10,W,s)
    f(ctx,1,8,3,4,G,s); f(ctx,2,11,2,2,G,s)
    // Right knob fill
    f(ctx,12,4,3,8,W,s); f(ctx,12,3,2,10,W,s)
    f(ctx,12,8,3,4,G,s); f(ctx,12,11,2,2,G,s)
    // Shaft fill
    f(ctx,4,6,8,4,W,s)
    f(ctx,4,8,8,2,G,s)
  },

  shoes(ctx, s) {
    const S='#EF9F27', T='#FAC775', L='#BA7517', D='#333333', W='#FFFFFF'
    // Sole
    f(ctx,1,12,14,1,D,s); f(ctx,1,13,14,1,D,s); f(ctx,2,14,12,1,D,s)
    f(ctx,1,12,13,2,L,s)
    // Body
    f(ctx,2,7,10,5,S,s); f(ctx,1,9,2,3,S,s); f(ctx,3,6,8,2,S,s)
    // Toe cap (wider left)
    f(ctx,1,6,4,4,T,s); f(ctx,2,5,3,2,T,s)
    // Tongue
    f(ctx,5,3,4,5,W,s); f(ctx,6,3,2,1,T,s)
    // Laces (3 dots)
    f(ctx,5,7,2,1,W,s); f(ctx,8,7,2,1,W,s); f(ctx,11,7,2,1,W,s)
    // Diagonal stripe
    f(ctx,4,8,1,1,L,s); f(ctx,5,9,1,1,L,s); f(ctx,6,10,1,1,L,s)
    f(ctx,7,10,1,1,L,s); f(ctx,8,11,1,1,L,s)
    // Outline
    f(ctx,1,5,1,1,D,s); f(ctx,2,4,3,1,D,s); f(ctx,5,2,4,1,D,s)
    f(ctx,9,3,1,1,D,s); f(ctx,10,4,3,1,D,s); f(ctx,13,5,1,1,D,s)
    f(ctx,13,6,1,6,D,s); f(ctx,11,11,1,1,D,s); f(ctx,1,11,1,1,D,s)
  },

  rainbow_star(ctx, s) {
    const C=['#FF4444','#FF8800','#FFEE00','#44CC44','#4488FF','#CC44FF']
    const W='#FFFFFF', CY='#00FFFF', MG='#FF00FF', YL='#FFFF00'
    // Horizontal bar
    f(ctx,0,7,16,2,C[2],s)
    // Vertical bar
    f(ctx,7,0,2,16,C[4],s)
    // NW diagonal
    f(ctx,1,1,2,2,C[5],s); f(ctx,3,3,2,2,C[4],s); f(ctx,4,4,2,2,C[3],s)
    // NE diagonal
    f(ctx,13,1,2,2,C[0],s); f(ctx,11,3,2,2,C[1],s); f(ctx,10,4,2,2,C[2],s)
    // SW diagonal
    f(ctx,1,13,2,2,C[3],s); f(ctx,3,11,2,2,C[2],s); f(ctx,4,10,2,2,C[1],s)
    // SE diagonal
    f(ctx,13,13,2,2,C[5],s); f(ctx,11,11,2,2,C[4],s); f(ctx,10,10,2,2,C[3],s)
    // White center
    f(ctx,6,6,4,4,W,s); f(ctx,7,7,2,2,C[2],s)
    // Sparkle dots around
    f(ctx,0,4,1,1,CY,s); f(ctx,15,4,1,1,MG,s)
    f(ctx,0,11,1,1,MG,s); f(ctx,15,11,1,1,YL,s)
    f(ctx,4,0,1,1,YL,s); f(ctx,11,0,1,1,CY,s)
    f(ctx,4,15,1,1,CY,s); f(ctx,11,15,1,1,MG,s)
  },

  coin(ctx, s) {
    const G='#DAA520', GL='#FFD700', GD='#8B6914', W='#FFFDD0'
    // Outline ring
    f(ctx,4,0,8,1,GD,s); f(ctx,2,1,2,1,GD,s); f(ctx,12,1,2,1,GD,s)
    f(ctx,1,2,1,1,GD,s); f(ctx,14,2,1,1,GD,s)
    f(ctx,0,3,1,10,GD,s); f(ctx,15,3,1,10,GD,s)
    f(ctx,1,13,1,1,GD,s); f(ctx,14,13,1,1,GD,s)
    f(ctx,2,14,2,1,GD,s); f(ctx,12,14,2,1,GD,s)
    f(ctx,4,15,8,1,GD,s)
    // Fill
    f(ctx,2,2,12,1,G,s); f(ctx,1,3,14,10,G,s); f(ctx,2,13,12,1,G,s)
    // Highlight
    f(ctx,2,3,4,3,W,s)
    // Star emblem (+ shape)
    f(ctx,7,3,2,10,GD,s)
    f(ctx,3,7,10,2,GD,s)
    // Corner star points
    f(ctx,4,4,2,2,GD,s); f(ctx,10,4,2,2,GD,s)
    f(ctx,4,10,2,2,GD,s); f(ctx,10,10,2,2,GD,s)
    // Center shine
    f(ctx,7,7,2,2,GL,s)
  },

}

// Map state item keys → art function names
const ALIASES = {
  food:         'chicken_leg',
  thunder:      'thunder_gem',
  gem:          'coin',
  rainbow_star: 'rainbow_star',
}

export function drawItem(canvas, key) {
  if (!canvas) return
  const fn = DRAWERS[ALIASES[key] ?? key]
  if (!fn) return
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  fn(ctx, canvas.width / 16)
}
