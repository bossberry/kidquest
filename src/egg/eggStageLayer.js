/**
 * KidQuest — Egg Stage Overlay Layer (pixel art)  [Layer 5 of the stack]
 * --------------------------------------------------------------------------
 * Element-flavored "energy" that grows with the egg's stage (1..9). Drawn
 * UNDER the eyes/expression so it never covers the face. Color comes from the
 * element tint; SHAPE and behavior differ per element. Intensity scales by tier:
 *   tier 0 = stages 1-3 (faint) | tier 1 = 4-6 (medium) | tier 2 = 7-9 (strong)
 *
 * Per-element treatment (approved):
 *   fire    - flames spawn at RANDOM spots on the egg, each a randomized
 *             narrow-based tapering tongue; born small -> peak -> die.
 *   water   - bubbles spawn at random spots/sizes, rise & pop, + gentle waves.
 *   thunder - randomized jagged bolt, brief flash, then vanish; higher stages
 *             BRANCH into more forks (violence via branching, not thickness).
 *   nature  - one big Chikorita-style leaf from the crown; grows with stage.
 *   shadow  - SPECIAL: the egg itself becomes a dark-flame mass (no solid body)
 *             with a wavering flame edge + small wisps. See drawShadowMass().
 *   light   - twinkling sparkles at random spots + rotating radiant beams.
 *
 * Randomness uses a seeded RNG keyed to each particle's "generation" so spawns
 * are varied but deterministic (no jitter). Animation clock = seconds.
 *
 * NOTE on shadow: because it replaces the body, the compositor should call
 * isBodyReplacedBy(element) and, if true, render drawShadowMass() INSTEAD of the
 * normal Base Egg body (still draw eyes/expression on top).
 */

import { EGG_TINTS, EGG_GRAYSCALE } from "./eggBaseLayer.js";

// Reference silhouette (baby). For grown, pass its sprite/size via opts.sprite/w/h.
const BABY = [
  "......DDDDDD......", "....DHHHMMMMSD....", "...DHHHMMMMMSSD...", "..DHHHMMMMMMSSSD..",
  "..DHHMMMMMMMSSSD..", ".DHHMMMMMMMMSSSSD.", ".DHMMMMMMMMSSSSsD.", ".DHMMMMMMMSSSSssD.",
  ".DMMMMMMMSSSSsssD.", ".DMMMMMMSSSSssssD.", ".DMMMMMSSSSsssssD.", ".DMMMMSSSSssssssD.",
  ".DMMMSSSSsssssssD.", "..DMMSSSsssssssD..", "...DMSSSssssssD...", "....DSSssssssD....",
  ".....DSsssssD.....", ".......DDDD.......",
];

export function stageToTier(stage) { return stage <= 3 ? 0 : stage <= 6 ? 1 : 2; }
export function isBodyReplacedBy(element) { return element === "shadow" || element === "fire" || element === "water" || element === "light"; }

function rand(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function buildGrid(sprite) {
  const H = sprite.length, W = sprite[0].length;
  const isBody = (c, r) => r >= 0 && r < H && c >= 0 && c < W && sprite[r][c] !== ".";
  const spanAt = (fy) => {
    const r = Math.max(0, Math.min(H - 1, Math.round(fy))); const row = sprite[r];
    let lo = -1, hi = -1; for (let c = 0; c < W; c++) if (row[c] !== ".") { if (lo < 0) lo = c; hi = c; }
    return [lo + 1, hi - 1];
  };
  const randPointOnEgg = (seed) => {
    const fy = 2 + rand(seed) * (H - 5); const sp = spanAt(fy);
    if (sp[0] > sp[1]) return null;
    return [sp[0] + rand(seed + 9.3) * (sp[1] - sp[0]), fy];
  };
  const edges = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++)
    if (isBody(c, r) && (!isBody(c-1,r)||!isBody(c+1,r)||!isBody(c,r-1)||!isBody(c,r+1))) edges.push([c, r]);
  // depth = manhattan distance to nearest non-body cell (for shadow core/edge)
  const depth = [];
  for (let r = 0; r < H; r++) { depth[r] = []; for (let c = 0; c < W; c++) {
    if (!isBody(c, r)) { depth[r][c] = 0; continue; }
    let d = 99; for (let rr = 0; rr < H; rr++) for (let cc = 0; cc < W; cc++)
      if (!isBody(cc, rr)) { const dd = Math.abs(cc-c)+Math.abs(rr-r); if (dd < d) d = dd; }
    depth[r][c] = d;
  } }
  return { W, H, isBody, spanAt, randPointOnEgg, edges, depth, sprite };
}
let GRID = buildGrid(BABY); // default; rebuilt if a different sprite is passed

// === Element effects ======================================================
function fxFire(ctx, g, tier, t, px, ox, oy) {
  const n = [3, 6, 10][tier], life = 1.4, big = [0.85, 1.1, 1.4][tier];
  for (let i = 0; i < n; i++) {
    const gen = Math.floor((t + i*0.61)/life), seed = gen*31.7 + i*7.13;
    const age = ((t + i*0.61)%life)/life, pt = g.randPointOnEgg(seed); if (!pt) continue;
    const grow = Math.sin(age*Math.PI);
    const h = (2.2 + rand(seed+2.1)*2.4)*big*grow, wBase = (0.55 + rand(seed+5.5)*0.5)*big;
    const rows = Math.max(2, Math.round(h));
    ctx.globalAlpha = grow*0.95;
    for (let k = 0; k < rows; k++) {
      const f = k/rows, w = wBase*(1-f)*(1-f); if (w < 0.12) continue;
      const lean = (rand(seed+k*2.3)-0.5)*1.6*f + Math.sin(t*9+i+k*0.6)*0.25*f;
      const col = f<0.33?"#ff7a1c": f<0.6?"#ffae3c": f<0.82?"#ffe27a":"#fff4c4";
      ctx.fillStyle = col;
      ctx.fillRect(ox+(pt[0]+lean-w)*px, oy+(pt[1]-k)*px, px*w*2, px*1.05);
    }
    ctx.globalAlpha = 1;
  }
}

function fxWater(ctx, g, tier, t, px, ox, oy) {
  const n = [4,7,11][tier], life = 2.0;
  for (let i = 0; i < n; i++) {
    const gen = Math.floor((t+i*0.37)/life), seed = gen*53.1 + i*9.7;
    const age = ((t+i*0.37)%life)/life, pt = g.randPointOnEgg(seed); if (!pt) continue;
    const bx = pt[0] + Math.sin(t*2+i)*0.4, by = pt[1] - age*(3 + rand(seed+1.1)*4);
    const sz = 0.5 + rand(seed+4.4)*0.9;
    const a = (age<0.85 ? 1-age*0.3 : (1-age)/0.15)*0.85;
    ctx.globalAlpha = Math.max(0, a);
    ctx.strokeStyle = "#cdeeff"; ctx.lineWidth = Math.max(1, px*0.22);
    ctx.beginPath(); ctx.arc(ox+bx*px, oy+by*px, px*sz, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = Math.max(0, a)*0.6; ctx.fillStyle = "#eafaff";
    ctx.fillRect(ox+(bx-sz*0.4)*px, oy+(by-sz*0.4)*px, px*sz*0.45, px*sz*0.45);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#eafaff"; ctx.lineWidth = Math.max(1.2, px*0.28);
  const nW = [1,1,2][tier];
  for (let w = 0; w < nW; w++) {
    const yy = 8 + w*4; ctx.globalAlpha = 0.55; ctx.beginPath();
    for (let x = 4; x <= 14; x += 0.5) {
      const py = yy + Math.sin(x*0.6 + t*2 + w)*0.9;
      if (x === 4) ctx.moveTo(ox+x*px, oy+py*px); else ctx.lineTo(ox+x*px, oy+py*px);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function boltPath(seed, sx, sy, steps) {
  const pts = [[sx, sy]]; let x = sx, y = sy;
  for (let k = 0; k < steps; k++) { x += (rand(seed+k*3.1)-0.5)*4.2; y += 1.5 + rand(seed+k*1.7)*0.8; x = Math.max(3, Math.min(15, x)); pts.push([x, y]); }
  return pts;
}
function drawBolt(ctx, px, ox, oy, pts, vis, thin) {
  for (let p = 0; p < pts.length-1; p++) {
    const [ax, ay] = pts[p], [bx, by] = pts[p+1];
    const seg = Math.ceil(Math.hypot(bx-ax, by-ay)*2);
    for (let i = 0; i <= seg; i++) {
      const ix = ax+(bx-ax)*i/seg, iy = ay+(by-ay)*i/seg;
      if (!thin) { ctx.globalAlpha = vis*0.3; ctx.fillStyle = "#f4c81a"; ctx.fillRect(ox+(ix-0.4)*px, oy+iy*px, px*1.3, px*0.85); }
      ctx.globalAlpha = vis; ctx.fillStyle = "#fff3a0"; ctx.fillRect(ox+ix*px, oy+iy*px, px*(thin?0.6:0.85), px*0.85);
    }
  }
}
// Short jagged electric arc between two edge points (pixel style, bright core + glow).
function drawEdgeArc(ctx, px, ox, oy, a, b, seed) {
  const steps = 3, pts = [[a[0]+0.5, a[1]+0.5]];
  for (let k = 1; k < steps; k++) { const f = k/steps;
    pts.push([a[0]+0.5 + (b[0]-a[0])*f + (rand(seed+k*2.1)-0.5)*1.7,
              a[1]+0.5 + (b[1]-a[1])*f + (rand(seed+k*3.3)-0.5)*1.7]); }
  pts.push([b[0]+0.5, b[1]+0.5]);
  for (let layer = 0; layer < 2; layer++) {
    const glow = layer === 0;
    ctx.globalAlpha = glow ? 0.4 : 1;
    ctx.fillStyle = glow ? "#9ec2ff" : "#ffffff";
    const s = glow ? px*1.2 : px*0.7;
    for (let p = 0; p < pts.length-1; p++) {
      const [ax, ay] = pts[p], [bx, by] = pts[p+1], seg = Math.ceil(Math.hypot(bx-ax, by-ay)*2);
      for (let i = 0; i <= seg; i++) { const ix = ax+(bx-ax)*i/seg, iy = ay+(by-ay)*i/seg;
        ctx.fillRect(ox+ix*px-(s-px)/2, oy+iy*px-(s-px)/2, s, s); }
    }
  }
  ctx.globalAlpha = 1;
}

// THUNDER: the egg's edge looks electrically SHORTING all the time — a buzzing
// flickering rim + electric arcs jumping along the outline + sparks flying off.
// (Replaces the old periodic bolt; that read too similar to light's sparkle.)
function fxThunder(ctx, g, tier, t, px, ox, oy) {
  const edges = g.edges; if (!edges || !edges.length) return;
  // 1) buzzing electrified rim: random edge cells flare, very fast flicker
  const lit = [7, 11, 17][tier], fseed = Math.floor(t*24);
  for (let i = 0; i < lit; i++) {
    const e = edges[Math.floor(rand(fseed + i*3.7)*edges.length)]; if (!e) continue;
    const fl = rand(fseed*1.3 + i*1.7); if (fl < 0.45) continue;
    ctx.globalAlpha = 0.45 + fl*0.55;
    ctx.fillStyle = fl > 0.82 ? "#ffffff" : (fl > 0.62 ? "#fff3a0" : "#bcd2ff");
    ctx.fillRect(ox+e[0]*px, oy+e[1]*px, px, px);
  }
  ctx.globalAlpha = 1;
  // 2) electric arcs shorting along the edge (jump between nearby edge points)
  const arcs = [2, 3, 5][tier];
  for (let a = 0; a < arcs; a++) {
    const seed = Math.floor(t*16 + a*2.7); if (rand(seed+5) < 0.4) continue;
    const i0 = Math.floor(rand(seed)*edges.length), e0 = edges[i0]; if (!e0) continue;
    const i1 = (i0 + 2 + Math.floor(rand(seed+1)*6)) % edges.length, e1 = edges[i1]; if (!e1) continue;
    drawEdgeArc(ctx, px, ox, oy, e0, e1, seed);
  }
  // 3) tiny sparks flying off the edge
  const sparks = [2, 3, 5][tier];
  for (let s = 0; s < sparks; s++) {
    const seed = Math.floor(t*18 + s*4.1); if (rand(seed+2) < 0.5) continue;
    const e = edges[Math.floor(rand(seed)*edges.length)]; if (!e) continue;
    const dir = e[0] < g.W/2 ? -1 : 1, dx = dir*(0.4 + rand(seed+3)*1.2), dy = -(rand(seed+4)*1.4);
    ctx.globalAlpha = 0.85; ctx.fillStyle = "#fff3a0";
    ctx.fillRect(ox+(e[0]+dx)*px, oy+(e[1]+dy)*px, px*0.6, px*0.6);
  }
  ctx.globalAlpha = 1;
  // 4) rare full bolt across as a power accent (tier 2 only)
  if (tier >= 2) {
    const period = 1.4, phase = (t%period)/period;
    const vis = phase < 0.08 ? 1 : (phase < 0.16 ? (0.16-phase)/0.08 : 0);
    if (vis > 0) { const gen = Math.floor(t/period), seed = gen*71.3;
      drawBolt(ctx, px, ox, oy, boltPath(seed, 4 + rand(seed)*10, 2.5, 5), vis, false); }
  }
}

function fxNature(ctx, g, tier, t, px, ox, oy) {
  const size = [1.15, 1.55, 2.0][tier], sway = Math.sin(t*1.4)*0.6;
  const dk = "#3a6638", md = "#5d9c55", lt = "#7cb84a", hl = "#a5d488";
  const baseX = g.W/2, crownY = 0.5;
  const stemH = 2.0*Math.min(1.4, size);
  ctx.fillStyle = md;
  for (let k = 0; k < stemH; k++) ctx.fillRect(ox+(baseX-0.3+sway*0.1*k)*px, oy+(crownY-k)*px, px*0.8, px);
  const sx0 = baseX+sway*0.4, sy0 = crownY-stemH;
  const tipX = baseX + (4.2+sway)*size*0.9, tipY = crownY - stemH - 7.0*size;
  const ctrlX = baseX + (1.0+sway*0.7)*size, ctrlY = crownY - stemH - 3.4*size;
  const segs = Math.round(10*size)+6;
  const curve = (f) => [
    (1-f)*(1-f)*sx0 + 2*(1-f)*f*ctrlX + f*f*tipX,
    (1-f)*(1-f)*sy0 + 2*(1-f)*f*ctrlY + f*f*tipY,
  ];
  const ang = Math.atan2(tipY-sy0, tipX-sx0), perpX = Math.cos(ang+Math.PI/2), perpY = Math.sin(ang+Math.PI/2);
  for (let i = 0; i <= segs; i++) {
    const f = i/segs, p = curve(f);
    const wd = f < 0.12 ? (f/0.12)*1.8*size
      : Math.pow(Math.sin(((f-0.12)/0.88)*Math.PI*0.92+0.18), 0.8)*3.0*size;
    for (let j = -Math.ceil(wd); j <= Math.ceil(wd); j++) {
      const rr = j*0.6, x = p[0]+perpX*rr, y = p[1]+perpY*rr;
      const edge = Math.abs(j) >= wd-0.7;
      ctx.fillStyle = edge ? dk : (j < -wd*0.2 ? hl : (j > wd*0.3 ? md : lt));
      ctx.fillRect(ox+x*px, oy+y*px, px*0.95, px*0.95);
    }
  }
  ctx.fillStyle = dk;
  for (let v = 0; v <= segs; v++) { const p = curve(v/segs); ctx.fillRect(ox+p[0]*px, oy+p[1]*px, px*0.55, px*0.55); }
}

function fxLight(ctx, g, tier, t, px, ox, oy) {
  const n = [3,6,10][tier], life = 1.4;
  for (let i = 0; i < n; i++) {
    const gen = Math.floor((t+i*0.4)/life), seed = gen*29.7 + i*5.9;
    const age = ((t+i*0.4)%life)/life, pt = g.randPointOnEgg(seed); if (!pt) continue;
    const tw = Math.sin(age*Math.PI), sz = (0.6 + rand(seed+2.2)*0.8)*tw;
    ctx.globalAlpha = tw; ctx.fillStyle = "#fff8e0";
    ctx.fillRect(ox+(pt[0]-sz)*px, oy+pt[1]*px, px*sz*2, px*0.5);
    ctx.fillRect(ox+pt[0]*px, oy+(pt[1]-sz)*px, px*0.5, px*sz*2);
    ctx.globalAlpha = tw*0.6; ctx.fillStyle = "#ffe9a8";
    ctx.fillRect(ox+(pt[0]-sz*0.5)*px, oy+(pt[1]-sz*0.5)*px, px*sz, px*sz);
  }
  ctx.globalAlpha = 1;
  if (tier >= 1) {
    const rays = [0,4,7][tier];
    ctx.save(); ctx.translate(ox+(g.W/2)*px, oy+(g.H/2)*px);
    for (let r = 0; r < rays; r++) {
      ctx.globalAlpha = 0.12 + Math.sin(t*2+r)*0.06; ctx.fillStyle = "#fff4c4";
      ctx.save(); ctx.rotate(t*0.5 + r*(Math.PI*2/rays)); ctx.fillRect(0, -px*0.4, px*9, px*0.8); ctx.restore();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
}

const ELEMENT_FX = { fire: fxFire, water: fxWater, thunder: fxThunder, nature: fxNature, light: fxLight };

/**
 * Draw the stage overlay for a non-shadow element (effects only; body drawn elsewhere).
 */
export function drawStageLayer(ctx, o) {
  const { element, px, ox = 0, oy = 0, t = 0 } = o;
  const tier = o.tier != null ? o.tier : stageToTier(o.stage || 1);
  if (o.sprite) GRID = buildGrid(o.sprite);
  const fx = ELEMENT_FX[element];
  if (fx) fx(ctx, GRID, tier, t, px, ox, oy);
}

/**
 * SHADOW special case: render the egg AS a dark-flame mass (replaces Base Egg body).
 * Draw this instead of drawEggBody when element === "shadow", then eyes/expression on top.
 */
export function drawShadowMass(ctx, o) {
  const { px, ox = 0, oy = 0, t = 0 } = o;
  const tier = o.tier != null ? o.tier : stageToTier(o.stage || 1);
  if (o.sprite) GRID = buildGrid(o.sprite);
  const g = GRID;

  // wisps (back), then flame-mass body, then wisps (front)
  drawShadowWisps(ctx, g, tier, t + 0.5, px, ox, oy);
  // flame mass body
  const wave = [0.9, 1.2, 1.6][tier];
  for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) {
    if (g.sprite[r][c] === ".") continue;
    const dep = g.depth[r][c];
    if (dep <= 1) {
      const nse = Math.sin(t*4 + c*1.4 + r*1.1)*0.5 + Math.sin(t*2.5 + c*0.7 - r*0.9)*0.5;
      if (nse < wave - 1.0) continue;
      ctx.globalAlpha = 0.45 + ((nse+1)/2)*0.4;
    } else if (dep === 2) ctx.globalAlpha = 0.9; else ctx.globalAlpha = 1;
    const col = dep >= 4 ? "#0a0810" : dep === 3 ? "#140f20" : dep === 2 ? "#221a32" : "#322545";
    ctx.fillStyle = col; ctx.fillRect(ox+c*px, oy+r*px, px, px);
  }
  ctx.globalAlpha = 1;
  // upward flame tongues off the top so it reads as flame
  const nTip = [3, 5, 6][tier];
  for (let i = 0; i < nTip; i++) {
    const seedp = Math.floor(t*1.5 + i*1.3)*7 + i, tx = 4 + rand(seedp)*10;
    let topR = 0; for (let rr = 0; rr < g.H; rr++) if (g.isBody(Math.round(tx), rr)) { topR = rr; break; }
    const hgt = (2 + rand(seedp+1)*3)*[0.8,1.1,1.4][tier];
    for (let k = 0; k < hgt; k++) {
      const f = k/hgt, w = (0.8*(1-f))*(1+rand(seedp+k)*0.5); if (w < 0.12) continue;
      const lean = (rand(seedp+k*2)-0.5)*2*f + Math.sin(t*2+k+i)*0.5*f;
      ctx.globalAlpha = (1-f*0.7)*0.6; ctx.fillStyle = f < 0.6 ? "#140f20" : "#2a2040";
      ctx.fillRect(ox+(tx+lean-w)*px, oy+(topR-k)*px, px*w*2, px*1.1);
    }
  }
  ctx.globalAlpha = 1;
  drawShadowWisps(ctx, g, tier, t, px, ox, oy);
}
function drawShadowWisps(ctx, g, tier, t, px, ox, oy) {
  const n = [5, 8, 12][tier];
  for (let i = 0; i < n; i++) {
    const e = g.edges[(i*5+2) % g.edges.length], life = 2.0;
    const gen = Math.floor((t+i*0.4)/life), seed = gen*33.1 + i*9.1;
    const age = ((t+i*0.4)%life)/life, grow = Math.sin(age*Math.PI);
    const dir = e[0] < g.W/2 ? -1 : 1;
    const fx = e[0]+0.5 + dir*(0.5+age*2.5) + (rand(seed)-0.5)*1.5, fy = e[1]+0.5 - age*2.0;
    const hgt = (1.8 + rand(seed+2)*2.4)*[0.9,1.15,1.45][tier]*grow;
    for (let k = 0; k < hgt; k++) {
      const f = k/hgt, w = (0.7*(1-f*0.6))*(1+rand(seed+k)*0.5); if (w < 0.1) continue;
      const lean = (rand(seed+k*2.3)-0.5)*2.4*f + Math.sin(t*1.8+k+i)*0.6*f;
      ctx.globalAlpha = grow*(1-f*0.6)*0.45; ctx.fillStyle = f < 0.5 ? "#0d0a16" : "#241c36";
      ctx.fillRect(ox+(fx+lean-w)*px, oy+(fy-k)*px, px*w*2, px*1.1);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * FIRE special case: render the egg AS a living flame mass (replaces Base Egg
 * body), warm twin of drawShadowMass. Brightness is INVERTED vs shadow: the
 * deeper/core cells are hottest (pale yellow), edges are red-orange and flicker.
 * Tongues rise taller than shadow's. Draw instead of drawEggBody when
 * element === "fire", then eyes/expression on top (eyes are NOT inverted —
 * dark eyes read fine on the bright body).
 */
export function drawFireMass(ctx, o) {
  const { px, ox = 0, oy = 0, t = 0 } = o;
  const tier = o.tier != null ? o.tier : stageToTier(o.stage || 1);
  if (o.sprite) GRID = buildGrid(o.sprite);
  const g = GRID;

  drawFireWisps(ctx, g, tier, t + 0.5, px, ox, oy); // embers behind
  const wave = [0.9, 1.2, 1.6][tier];
  for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) {
    if (g.sprite[r][c] === ".") continue;
    const dep = g.depth[r][c];
    if (dep <= 1) {
      const nse = Math.sin(t*4 + c*1.4 + r*1.1)*0.5 + Math.sin(t*2.5 + c*0.7 - r*0.9)*0.5;
      if (nse < wave - 1.0) continue;
      ctx.globalAlpha = 0.5 + ((nse+1)/2)*0.45;
    } else if (dep === 2) ctx.globalAlpha = 0.92; else ctx.globalAlpha = 1;
    const col = dep >= 4 ? "#ffe39a" : dep === 3 ? "#ffc245" : dep === 2 ? "#ff8f28" : "#ef5420";
    ctx.fillStyle = col; ctx.fillRect(ox+c*px, oy+r*px, px, px);
  }
  ctx.globalAlpha = 1;
  // tall upward flame tongues off the top (fire rises strongly)
  const nTip = [4, 6, 8][tier];
  for (let i = 0; i < nTip; i++) {
    const seedp = Math.floor(t*1.7 + i*1.3)*7 + i, tx = 3 + rand(seedp)*12;
    let topR = 0; for (let rr = 0; rr < g.H; rr++) if (g.isBody(Math.round(tx), rr)) { topR = rr; break; }
    const hgt = (3 + rand(seedp+1)*4)*[1.0,1.3,1.7][tier];
    for (let k = 0; k < hgt; k++) {
      const f = k/hgt, w = (0.85*(1-f))*(1+rand(seedp+k)*0.5); if (w < 0.12) continue;
      const lean = (rand(seedp+k*2)-0.5)*1.6*f + Math.sin(t*2.4+k+i)*0.5*f;
      ctx.globalAlpha = (1-f*0.65)*0.8;
      ctx.fillStyle = f < 0.35 ? "#ffd24d" : f < 0.7 ? "#ff8f28" : "#ef5420";
      ctx.fillRect(ox+(tx+lean-w)*px, oy+(topR-k)*px, px*w*2, px*1.1);
    }
  }
  ctx.globalAlpha = 1;
  drawFireWisps(ctx, g, tier, t, px, ox, oy); // embers front
}
function drawFireWisps(ctx, g, tier, t, px, ox, oy) {
  const n = [4, 7, 10][tier];
  for (let i = 0; i < n; i++) {
    const e = g.edges[(i*5+2) % g.edges.length], life = 1.7;
    const gen = Math.floor((t+i*0.4)/life), seed = gen*33.1 + i*9.1;
    const age = ((t+i*0.4)%life)/life, grow = Math.sin(age*Math.PI);
    const dir = e[0] < g.W/2 ? -1 : 1;
    const fx = e[0]+0.5 + dir*(0.4+age*2.2) + (rand(seed)-0.5)*1.4, fy = e[1]+0.5 - age*2.6;
    const hgt = (1.6 + rand(seed+2)*2.2)*[0.9,1.15,1.45][tier]*grow;
    for (let k = 0; k < hgt; k++) {
      const f = k/hgt, w = (0.6*(1-f*0.6))*(1+rand(seed+k)*0.5); if (w < 0.1) continue;
      const lean = (rand(seed+k*2.3)-0.5)*2.0*f + Math.sin(t*2.0+k+i)*0.6*f;
      ctx.globalAlpha = grow*(1-f*0.6)*0.5; ctx.fillStyle = f < 0.5 ? "#ffb02a" : "#ef5420";
      ctx.fillRect(ox+(fx+lean-w)*px, oy+(fy-k)*px, px*w*2, px*1.1);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * WATER special case: render the egg AS a living "boiling" water blob (replaces
 * Base Egg body). Sibling of fire/shadow mass, but everything is ROUNDED — no
 * pointed tongues. Reads as bubbling/boiling water: soft wavering rim, rounded
 * blobs bulging off the edges, internal bubbles rising & popping, and rounded
 * bubbles swelling at the top surface. Eyes are NOT inverted (light body).
 */
export function drawWaterMass(ctx, o) {
  const { px, ox = 0, oy = 0, t = 0 } = o;
  const tier = o.tier != null ? o.tier : stageToTier(o.stage || 1);
  if (o.sprite) GRID = buildGrid(o.sprite);
  const g = GRID;
  // Side-on swirling-storm look: a water sphere (depth-shaded) crossed by rolling
  // wave bands — curved horizontal crests/troughs that scroll SIDEWAYS, like
  // looking at a storm/whirlpool from the side (not an axial pinwheel). The
  // turbulence speeds up and tightens with tier (= stronger).
  const cx = g.W/2, cy = g.H/2 - 0.3, maxR = g.W/2;
  const flow = t * (1.6 + tier*0.6), amp = 1.5 + tier*0.45, wob = [0.55, 0.8, 1.05][tier];
  drawWaterFoam(ctx, g, tier, t + 0.5, px, ox, oy); // foam wisps behind
  for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) {
    if (g.sprite[r][c] === ".") continue;
    const dep = g.depth[r][c];
    const base = dep >= 5 ? "#cdeeff" : dep >= 4 ? "#a9ddf5" : dep >= 3 ? "#7cbfe0"
               : dep >= 2 ? "#5f9ec9" : "#3a6f95";
    const nx = (c-cx)/maxR, ny = (r-cy)/maxR;
    // rolling wave bands + a finer ripple so crests break into thin wispy lines
    const mainW = Math.sin(ny*5.4 + Math.sin(nx*2.2 - flow)*amp + nx*0.8);
    const fineW = Math.sin(ny*9.5 + nx*4.0 - flow*1.7);
    const band = (mainW*0.78 + fineW*0.22 + 1) / 2;
    let col = band > 0.9 ? "#ffffff" : band > 0.74 ? "#dff2ff" : band < 0.16 ? "#2f6f95" : base;
    if (dep <= 1) {                              // wispy, foamy, broken rim (like fire's edge)
      const nse = Math.sin(t*3.2 + c*1.2 + r*0.9)*0.5 + Math.sin(t*2.0 + c*0.6 - r*0.8)*0.5;
      if (nse < wob - 1.15) continue;            // gaps in the rim
      ctx.globalAlpha = 0.6 + ((nse+1)/2)*0.4;
      col = band > 0.6 ? "#ffffff" : "#bfe6fb";  // foam fleck at the rim
    } else ctx.globalAlpha = 1;
    ctx.fillStyle = col; ctx.fillRect(ox+c*px, oy+r*px, px, px);
  }
  ctx.globalAlpha = 1;
  // rising boiling bubbles (kept from the original water look) + pop ring
  const nBub = [4, 7, 11][tier], life = 1.6;
  ctx.lineWidth = Math.max(1, px*0.2);
  for (let i = 0; i < nBub; i++) {
    const gen = Math.floor((t+i*0.3)/life), seed = gen*47.3 + i*8.1;
    const age = ((t+i*0.3)%life)/life, pt = g.randPointOnEgg(seed); if (!pt) continue;
    const bx = pt[0] + Math.sin(age*Math.PI*2 + i*1.1)*0.35, yb = pt[1] - age*4.5;
    const sz = (0.3 + rand(seed+2)*0.5)*(0.55 + age*0.7), a = Math.sin(age*Math.PI);
    ctx.globalAlpha = a*0.85; ctx.strokeStyle = "#e6f6ff";
    ctx.beginPath(); ctx.arc(ox+bx*px, oy+yb*px, px*sz, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = a*0.5; ctx.fillStyle = "#ffffff";
    ctx.fillRect(ox+(bx-sz*0.35)*px, oy+(yb-sz*0.35)*px, px*sz*0.4, px*sz*0.4);
    if (age > 0.82) { const pr = (age-0.82)/0.18; ctx.globalAlpha = (1-pr)*0.55;
      ctx.beginPath(); ctx.arc(ox+bx*px, oy+yb*px, px*sz*(1+pr*1.8), 0, Math.PI*2); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  drawWaterFoam(ctx, g, tier, t, px, ox, oy); // foam wisps front
}
/** Rounded foam bubbles that waver and pop along the egg rim (water's analog of
 *  the fire wisp edge — gives the base egg a soft foamy, living outline). */
function drawWaterFoam(ctx, g, tier, t, px, ox, oy) {
  const n = [6, 9, 13][tier], life = 1.8;
  for (let i = 0; i < n; i++) {
    const e = g.edges[(i*5+2) % g.edges.length];
    const gen = Math.floor((t+i*0.4)/life), seed = gen*33.1 + i*9.1;
    const age = ((t+i*0.4)%life)/life, grow = Math.sin(age*Math.PI);
    const dir = e[0] < g.W/2 ? -1 : 1;
    const fx = e[0]+0.5 + dir*(0.3+age*1.7) + (rand(seed)-0.5)*1.3;
    const fy = e[1]+0.5 + (rand(seed+5)-0.5)*1.6 - age*0.8;
    const rad = (0.4 + rand(seed+2)*0.65)*[0.9,1.15,1.45][tier]*grow; if (rad < 0.12) continue;
    ctx.globalAlpha = grow*0.6; ctx.fillStyle = "#bfe6fb";
    ctx.beginPath(); ctx.arc(ox+fx*px, oy+fy*px, px*rad, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = grow*0.55; ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(ox+(fx-rad*0.3)*px, oy+(fy-rad*0.3)*px, px*rad*0.4, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * LIGHT special case: render the egg AS a glowing orb of light (replaces Base
 * Egg body). White-hot core fading to warm gold, soft blooming halo, drifting
 * inner shimmer, a glossy specular highlight, twinkles, and faint radiant rays.
 * Reads as a luminous ball of light rather than a flat yellow egg. Eyes are NOT
 * inverted (bright body, dark eyes read well).
 */
export function drawLightMass(ctx, o) {
  const { px, ox = 0, oy = 0, t = 0 } = o;
  const tier = o.tier != null ? o.tier : stageToTier(o.stage || 1);
  if (o.sprite) GRID = buildGrid(o.sprite);
  const g = GRID;
  const cx = ox + (g.W/2)*px, cy = oy + (g.H/2)*px, eggR = (g.W/2)*px, pulse = (Math.sin(t*2)+1)/2;

  // 1) outer bloom halo (soft glow)
  ctx.save(); ctx.imageSmoothingEnabled = true;
  const bloomR = eggR*(1.45 + pulse*0.15);
  let gr = ctx.createRadialGradient(cx, cy, eggR*0.3, cx, cy, bloomR);
  gr.addColorStop(0, "rgba(255,250,222," + (0.45 + pulse*0.12) + ")");
  gr.addColorStop(0.5, "rgba(255,226,140,0.20)");
  gr.addColorStop(1, "rgba(255,210,90,0)");
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, bloomR, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // 2) body fill — radial brightness via depth, soft shimmering edge
  for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) {
    if (g.sprite[r][c] === ".") continue;
    const dep = g.depth[r][c]; let col, a = 1;
    if (dep >= 5) col = "#fffef7";
    else if (dep === 4) col = "#fff7d6";
    else if (dep === 3) col = "#ffeda2";
    else if (dep === 2) col = "#ffe07a";
    else { col = "#ffd24d"; const sh = Math.sin(t*3 + c*0.8 + r*0.6); a = 0.55 + ((sh+1)/2)*0.4; }
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(ox+c*px, oy+r*px, px, px);
  }
  ctx.globalAlpha = 1;

  // 3) drifting inner shimmer + 4) glossy specular highlight
  ctx.save(); ctx.imageSmoothingEnabled = true;
  for (let i = 0; i < 2; i++) {
    const ang = t*0.6 + i*Math.PI, sx = cx + Math.cos(ang)*eggR*0.35, sy = cy + Math.sin(ang*1.3)*eggR*0.3, rr = eggR*0.5;
    let sgr = ctx.createRadialGradient(sx, sy, 0, sx, sy, rr);
    sgr.addColorStop(0, "rgba(255,255,250,0.5)"); sgr.addColorStop(1, "rgba(255,255,250,0)");
    ctx.fillStyle = sgr; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI*2); ctx.fill();
  }
  const hx = cx - eggR*0.32, hy = cy - eggR*0.42, hr = eggR*0.34;
  let hgr = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
  hgr.addColorStop(0, "rgba(255,255,255,0.85)"); hgr.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hgr; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // 5) twinkles + faint radiant rays
  const nSp = [3, 5, 8][tier];
  for (let i = 0; i < nSp; i++) {
    const life = 1.5, gen = Math.floor((t+i*0.45)/life), seed = gen*29.7 + i*5.9;
    const age = ((t+i*0.45)%life)/life, pt = g.randPointOnEgg(seed); if (!pt) continue;
    const tw = Math.sin(age*Math.PI), sz = (0.5 + rand(seed+2)*0.7)*tw;
    ctx.globalAlpha = tw*0.9; ctx.fillStyle = "#fffdf0";
    ctx.fillRect(ox+(pt[0]-sz)*px, oy+pt[1]*px, px*sz*2, px*0.45);
    ctx.fillRect(ox+pt[0]*px, oy+(pt[1]-sz)*px, px*0.45, px*sz*2);
  }
  ctx.globalAlpha = 1;
  if (tier >= 1) {
    const rays = [0, 5, 8][tier]; ctx.save(); ctx.translate(cx, cy);
    for (let r = 0; r < rays; r++) {
      ctx.globalAlpha = 0.05 + Math.sin(t*1.5 + r)*0.03; ctx.fillStyle = "#fff4c4";
      ctx.save(); ctx.rotate(t*0.35 + r*(Math.PI*2/rays)); ctx.fillRect(0, -px*0.35, eggR*1.3, px*0.7); ctx.restore();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
}

/**
 * Dispatcher: when isBodyReplacedBy(element) is true, the compositor calls this
 * INSTEAD of drawEggBody, then draws eyes/expression on top.
 */
export function drawBodyMass(ctx, o) {
  if (o.element === "fire") return drawFireMass(ctx, o);
  if (o.element === "water") return drawWaterMass(ctx, o);
  if (o.element === "light") return drawLightMass(ctx, o);
  return drawShadowMass(ctx, o);
}

export const EGG_STAGE_LAYER = {
  stageToTier, isBodyReplacedBy, draw: drawStageLayer,
  drawShadowMass, drawFireMass, drawWaterMass, drawLightMass, drawBodyMass,
};
