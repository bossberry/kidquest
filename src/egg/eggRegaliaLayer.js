/**
 * KidQuest — Egg Regalia Layer (pixel art)  [composited around the Base Egg]
 * --------------------------------------------------------------------------
 * Shows a monster getting STRONGER per stage WITHOUT making the body tall/oval.
 * The body stays round and only grows a little (capped — see eggBaseLayer
 * stageSizeMul); the "power" reads through element-themed regalia that grows:
 *
 *   element  | regalia (material = same as the element's base egg)  | pass
 *   ---------|------------------------------------------------------|--------
 *   fire     | demon FLAME horns (S-curve, fuzzy flame tongues)     | front
 *   shadow   | same horns, DARK flame (shadow colors)               | front
 *   light    | angel HALO (fuzzy glowing ring + twinkles)           | front
 *   water    | (none) — the whole base egg spins (rasengan body)   | —
 *   thunder  | lightning horns (Pikachu-tail shape, both sides)     | front
 *   nature   | leaf WINGS                                           | behind
 *
 * Regalia appears at tier 1 (stage 4) small and grows at tier 2 (stage 7+).
 * Tier 0 (stage 1-3) has none. "behind" parts draw before the body, "front"
 * parts after. Eyes/expression draw last (on top).
 *
 * Coords are in the same egg cell-space as the body (faceX≈9, 18-wide sprite),
 * using the same px/ox/oy the body was drawn with, so regalia tracks size/pose.
 * Animated via the `t` (seconds) param to match each element's base motion.
 */

const R_FACEX = 9;
function rrand(s){ const x = Math.sin(s*127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export function regaliaTier(stage){ return stage <= 3 ? 0 : stage <= 6 ? 1 : 2; }
export function regaliaScale(stage){
  const t = regaliaTier(stage);
  if (t < 1) return 0;
  return t === 1 ? (0.5 + (stage-4)*0.1) : (0.9 + (stage-7)*0.12);
}

// flame-horn material palettes (c0 deep base → c4 bright tip)
export const FLAME_HORN_PAL = {
  fire:   { c0:"#7a1c0c", c1:"#d2321a", c2:"#ff7a1c", c3:"#ffd23c", c4:"#fff4c4" },
  shadow: { c0:"#0a0810", c1:"#140f20", c2:"#2a2240", c3:"#3c2e5c", c4:"#6a5f86" },
};
const THU = ["#ffffff","#fff3a0","#9ec2ff"], NAT = ["#b6e89a","#6fbf4a","#3a7a34"],
      WAT = ["#eafaff","#9fd6f0","#4a86ab","#2f6f95"];

const SPEC = {
  fire:    { pass:"front", draw:(c,o,dir)=>flameHorn(c,o,dir,FLAME_HORN_PAL.fire) },
  shadow:  { pass:"front", draw:(c,o,dir)=>flameHorn(c,o,dir,FLAME_HORN_PAL.shadow) },
  light:   { pass:"front", draw:(c,o)=>angelHalo(c,o) },
  // water: NO appendage — the whole base egg spins (see drawWaterMass in eggStageLayer.js)
  thunder: { pass:"front", draw:(c,o,dir)=>thunderBolt(c,o,dir) },
  nature:  { pass:"behind", draw:(c,o,dir)=>leafWing(c,o,dir) },
};

// ---- FLAME HORN (fire + shadow): built from many rising flame tongues ----
function flameHorn(ctx, o, dir, P) {
  const { px, ox=0, oy=0, t=0, sc, faceX=R_FACEX } = o;
  const N = Math.round(16*sc)+6, bx = faceX + dir*2.0, by = 2.7; let tipx=bx, tipy=by;
  for (let i=0;i<N;i++){ const f=i/N;
    const cx = bx + dir*(Math.sin(f*2.2)*3.4*sc), cy = by - f*7.4*sc, w = ((1-f)*1.4+0.3)*sc;
    const half = Math.max(1, Math.ceil(w/0.8));
    for (let s=-half;s<=half;s++){ const dxi=s*0.8, edge=Math.abs(dxi)/(w+0.001); if (edge>1.1) continue;
      const noise = Math.sin(t*7+i*0.8+s*1.7)*0.5 + Math.sin(t*4.3-i*0.6+s*0.9)*0.5;
      if (edge>0.62 && noise<-0.12) continue;
      let th = (0.9+(1-edge)*1.6)*(0.6+(noise+1)/2*0.7)*(1-f*0.22)*sc*1.4; if (th<0.3) continue;
      for (let k=0;k<th;k++){ const ff=k/th, ww=((1-ff)*0.55+0.1)*sc, hot=f*0.55+ff*0.6;
        const col = hot<0.3?P.c1:hot<0.55?P.c2:hot<0.8?P.c3:P.c4;
        const x=cx+dxi+dir*ff*0.4, y=cy-k;
        ctx.globalAlpha = edge>0.6 ? (0.5+(noise+1)/2*0.45) : (ff>0.8?0.9:1);
        ctx.fillStyle=col; ctx.fillRect(ox+(x-ww)*px, oy+y*px, px*ww*2, px*1.05); } }
    tipx=cx; tipy=cy; }
  ctx.globalAlpha=1;
  for (let j=0;j<4;j++){ const h=(2.6+j*0.5)*sc*(0.72+Math.sin(t*9+j*1.7+dir)*0.28), o2=(j-1.5)*0.7;
    for (let k=0;k<h;k++){ const ff=k/h, ww=(1-ff)*0.5*sc+0.08, x=tipx+dir*(o2+ff*0.5)+Math.sin(t*7+j+k*0.5)*0.3, y=tipy-k*0.9;
      ctx.globalAlpha=(1-ff*0.5); ctx.fillStyle=ff<0.45?P.c2:ff<0.8?P.c3:P.c4; ctx.fillRect(ox+(x-ww)*px, oy+y*px, px*ww*2, px*1.0); } }
  for (let e=0;e<3;e++){ const ph=(t*0.8+e*0.37)%1, ey=tipy-ph*3.2*sc, ex=tipx+dir*(0.3+ph)+Math.sin(t*5+e)*0.5;
    ctx.globalAlpha=(1-ph)*0.6; ctx.fillStyle=P.c4; ctx.fillRect(ox+ex*px, oy+ey*px, px*0.5, px*0.5); }
  ctx.globalAlpha=1;
}

// ---- LIGHT: fuzzy glowing halo + soft twinkles (count scales with stage) ----
function angelHalo(ctx, o) {
  const { px, ox=0, oy=0, t=0, sc, stage=7, faceX=R_FACEX } = o;
  const cx = ox + faceX*px, bob = Math.sin(t*1.6)*0.4, cy = oy + (-2.1-bob)*px;
  const rx = px*(3.2*sc+1.3), ry = px*(1.0*sc+0.55), pulse=(Math.sin(t*2)+1)/2;
  ctx.save(); ctx.imageSmoothingEnabled=true;
  let g = ctx.createRadialGradient(cx,cy,0,cx,cy,rx*1.8);
  g.addColorStop(0,"rgba(255,245,205,"+(0.26+pulse*0.16)+")"); g.addColorStop(1,"rgba(255,225,140,0)");
  ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(cx,cy,rx*1.8,ry*2.3,0,0,Math.PI*2); ctx.fill();
  ctx.filter = "blur("+(px*0.55)+"px)";
  ctx.strokeStyle="rgba(255,236,172,0.95)"; ctx.lineWidth=px*0.95; ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle="rgba(255,255,246,0.9)"; ctx.lineWidth=px*0.42; ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.stroke();
  const nSpark = Math.round(stage/9*9);
  for (let i=0;i<nSpark;i++){ const an=t*0.9+i*Math.PI*2/Math.max(1,nSpark), rr=rx*(0.5+0.65*rrand(i+Math.floor(t*1.3)));
    const sx2=cx+Math.cos(an)*rr, sy2=cy+Math.sin(an)*ry*1.25, tw=0.35+0.65*Math.sin(t*4+i*1.3); if (tw<0.12) continue;
    const s=px*(0.8+tw*0.7); let sg=ctx.createRadialGradient(sx2,sy2,0,sx2,sy2,s);
    sg.addColorStop(0,"rgba(255,253,242,"+tw+")"); sg.addColorStop(0.5,"rgba(255,246,205,"+(tw*0.5)+")"); sg.addColorStop(1,"rgba(255,240,180,0)");
    ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(sx2,sy2,s,0,Math.PI*2); ctx.fill(); }
  ctx.filter="none"; ctx.restore();
}

// ---- THUNDER / NATURE wings (drawn behind body) ----
const WRX = { l:4.5, r:13.5 }, WRY = 6.0;
function thunderBolt(ctx, o, dir) {
  // Pikachu-tail style lightning bolt: a thick zigzag bolt (thin stalk → wide
  // angular flag → point), electric yellow with a blue glow and white core.
  const { px, ox=0, oy=0, t=0, sc, faceX=R_FACEX } = o;
  const bx = faceX + dir*2.2, by = 2.8;          // rooted on top of the head (horn)
  const P = [
    [bx,              by],
    [bx + dir*1.5*sc, by - 1.9*sc],
    [bx + dir*0.2*sc, by - 3.3*sc],
    [bx + dir*1.9*sc, by - 5.2*sc],
    [bx + dir*0.7*sc, by - 6.6*sc],
  ];
  const Wh = [0.45, 0.95, 0.8, 1.15, 0.0].map(w => w*sc);
  const flick = 0.8 + Math.sin(t*16 + dir*1.3)*0.2;
  function quad(a, b, wa, wb, col, alpha) {
    const dx=b[0]-a[0], dy=b[1]-a[1], len=Math.hypot(dx,dy)||1, nx=-dy/len, ny=dx/len;
    ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(ox+(a[0]+nx*wa)*px, oy+(a[1]+ny*wa)*px);
    ctx.lineTo(ox+(a[0]-nx*wa)*px, oy+(a[1]-ny*wa)*px);
    ctx.lineTo(ox+(b[0]-nx*wb)*px, oy+(b[1]-ny*wb)*px);
    ctx.lineTo(ox+(b[0]+nx*wb)*px, oy+(b[1]+ny*wb)*px);
    ctx.closePath(); ctx.fill();
  }
  for (let i=0;i<P.length-1;i++) quad(P[i],P[i+1], Wh[i]*1.8+0.2, Wh[i+1]*1.8+0.1, "#6f9bff", 0.35*flick); // glow
  for (let i=0;i<P.length-1;i++) quad(P[i],P[i+1], Wh[i], Wh[i+1], i<2?"#ffe24a":"#fff6b0", flick);          // core
  for (let i=0;i<P.length-1;i++) quad(P[i],P[i+1], Wh[i]*0.45, Wh[i+1]*0.45, "#ffffff", flick*0.9);          // hot center
  ctx.globalAlpha = 1;
}
function leafWing(ctx, o, dir) {
  const { px, ox=0, oy=0, t=0, sc } = o; const n=4, sway=Math.sin(t*1.6)*0.5;
  for (let i=0;i<n;i++){ const along=i/(n-1), lx=WRX[dir<0?'l':'r']+dir*(0.6+along*3.4*sc+sway*along), ly=WRY-along*2.4*sc, lw=(1.4-along*0.5)*sc;
    ctx.fillStyle=NAT[2]; ctx.fillRect(ox+(lx-lw)*px, oy+ly*px, px*lw*2, px*1.6);
    ctx.fillStyle=NAT[1]; ctx.fillRect(ox+(lx-lw*0.7)*px, oy+(ly+0.2)*px, px*lw*1.2, px*1.1);
    ctx.fillStyle=NAT[0]; ctx.fillRect(ox+(lx-lw*0.2)*px, oy+(ly+0.1)*px, px*0.5, px*1.0); }
}

/**
 * Draw regalia for the current pass. Call TWICE per frame:
 *   drawRegalia(ctx, {..., pass:"behind"})  // before the body
 *   draw body...
 *   drawRegalia(ctx, {..., pass:"front"})    // after the body, before eyes
 *
 * @param o.element  element key
 * @param o.stage    1..9
 * @param o.pass     "behind" | "front"
 * @param o.px,ox,oy same as the body draw
 * @param o.faceX    egg face center (default 9)
 * @param o.t        seconds (animation)
 */
export function drawRegalia(ctx, o) {
  const spec = SPEC[o.element]; if (!spec) return;
  if ((o.pass || "front") !== spec.pass) return;
  const sc = regaliaScale(o.stage); if (sc <= 0) return;
  const oo = { ...o, sc };
  if (spec.draw.length >= 3) { spec.draw(ctx, oo, -1); spec.draw(ctx, oo, 1); } // mirrored pair (horns/wings)
  else spec.draw(ctx, oo);                                                       // single (halo/tail)
}

export const EGG_REGALIA_LAYER = {
  tier: regaliaTier, scale: regaliaScale, SPEC, draw: drawRegalia,
};
