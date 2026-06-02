export const EGG_STAGES = 7
export const STAGE_XP_NEEDED = 50
export const EGG_STAGE_NAMES = ['ไข่ลึกลับ','ไข่แวววาว','ไข่มีลาย','ไข่เปล่งแสง','เห็นเงาข้างใน...','เห็นดวงตาแล้ว! 👁️','ใกล้ฟักแล้ว!!!']

export function hash(s) { let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h)^s.charCodeAt(i); return Math.abs(h)>>>0 }
export function prng(seed) { let s=seed>>>0; return()=>{ s^=s<<13; s^=s>>17; s^=s<<5; return(s>>>0)/4294967296 } }
function drawStar(ctx,x,y,pts,out,inn,col){ctx.beginPath();for(let i=0;i<pts*2;i++){const r=i%2===0?out:inn,a=(i/(pts*2))*Math.PI*2-Math.PI/2;i===0?ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath();ctx.fillStyle=col;ctx.fill()}
function eggPath(ctx,cx,cy,rx,ryT,ryB){ctx.moveTo(cx,cy-ryT);ctx.bezierCurveTo(cx+rx,cy-ryT,cx+rx,cy,cx+rx,cy+ryB*0.3);ctx.bezierCurveTo(cx+rx,cy+ryB,cx+rx*0.5,cy+ryB*1.1,cx,cy+ryB*1.1);ctx.bezierCurveTo(cx-rx*0.5,cy+ryB*1.1,cx-rx,cy+ryB,cx-rx,cy+ryB*0.3);ctx.bezierCurveTo(cx-rx,cy,cx-rx,cy-ryT,cx,cy-ryT)}

export function totalXP(state) { return (state.xpThai||0) + (state.xpEng||0) + (state.xpMath||0) }

export function eggProgress(state) {
  const total = totalXP(state)
  const maxXP = EGG_STAGES * STAGE_XP_NEEDED
  const capped = Math.min(total, maxXP)
  const stage = Math.min(EGG_STAGES - 1, Math.floor(capped / STAGE_XP_NEEDED))
  const stageXP = stage >= EGG_STAGES - 1 ? STAGE_XP_NEEDED : capped % STAGE_XP_NEEDED
  const pct = stage >= EGG_STAGES - 1 ? 100 : (stageXP / STAGE_XP_NEEDED * 100)
  return { stage, stageXP, pct }
}

export function buildEggStats(state) {
  const tSum = (state.xpThai||0) + (state.xpEng||0) + (state.xpMath||0) || 1
  const maxStat = 100
  const { stage } = eggProgress(state)
  return {
    name: state.name,
    grade: state.grade,
    dow: state.eggDow,
    month: state.eggMonth,
    day: state.eggDay,
    hour: state.eggHour,
    firstSubject: Math.max(0, state.firstSubject),
    thai: Math.min(maxStat, Math.round((state.xpThai||0) / tSum * 100)),
    eng: Math.min(maxStat, Math.round((state.xpEng||0) / tSum * 100)),
    math: Math.min(maxStat, Math.round((state.xpMath||0) / tSum * 100)),
    streak: Math.min(100, (state.streak||0) * 5),
    acc: state.acc || 70,
    mins: Math.min(60, state.mins || 0),
    speed: state.speed || 50,
    stage,
  }
}

export function drawEgg(canvas, stats) {
  const W=canvas.width, H=canvas.height, ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,W,H)
  const stage = stats.stage !== undefined ? stats.stage : 0
  const total = EGG_STAGES
  const progress = stage / (total - 1)
  const isNight = stats.hour >= 20 || stats.hour < 6
  const rng = prng(hash(stats.name + stats.grade) ^ hash('' + stats.dow + stats.month + stats.day + stats.hour))
  const dowHue = [210,0,120,30,270,45,60][stats.dow % 7]
  const monthOff = (stats.month - 1) * 30
  const hourTone = stats.hour < 6 ? 280 : stats.hour < 12 ? 30 : stats.hour < 17 ? 45 : stats.hour < 20 ? 20 : 260
  const sa = [{v:stats.thai,h:140},{v:stats.eng,h:210},{v:stats.math,h:270}]
  sa.sort((a,b) => b.v - a.v)
  const h1 = (sa[0].h + dowHue * .3 + monthOff * .15) % 360
  const h2 = (sa[1].h + dowHue * .2 + monthOff * .2) % 360
  const h3 = (sa[2].h + hourTone * .1) % 360
  const ha = (stats.streak > 30 ? 45 : stats.streak > 14 ? 38 : hourTone + stats.speed * .3) % 360
  const litB = isNight ? 30 + progress * 18 : 72 - progress * 22
  const satB = isNight ? 60 + progress * 25 : 55 + progress * 30
  const cx = W/2, cy = H * .47
  const rxB = W * .305, ryTB = H * .375, ryBB = H * .335
  const shRx = rxB * ([1,.92,.88][stats.firstSubject] || 1)
  const shRyT = ryTB * ([1,1.08,1.15][stats.firstSubject] || 1)
  const shRyB = ryBB * ([1,1.02,.95][stats.firstSubject] || 1)
  if(progress>.2){const gR=shRx*(1.3+progress*.5);const g=ctx.createRadialGradient(cx,cy,shRx*.3,cx,cy,gR);g.addColorStop(0,`hsla(${ha},90%,${isNight?40:80}%,${progress*.22})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(cx,cy,gR,gR*1.05,0,0,Math.PI*2);ctx.fill()}
  const bg=ctx.createRadialGradient(cx-shRx*.15,cy-shRyT*.3,shRx*.05,cx+shRx*.1,cy+shRyB*.2,Math.max(shRx,shRyT)*1.35)
  bg.addColorStop(0,`hsl(${h1+20},40%,${isNight?55:96}%)`);bg.addColorStop(.15,`hsl(${h1},${satB}%,${litB+8}%)`);bg.addColorStop(.4,`hsl(${h1+dowHue*.1},${satB+5}%,${litB}%)`);bg.addColorStop(.65,`hsl(${h2+monthOff*.05},${satB-8}%,${litB+4}%)`);bg.addColorStop(.85,`hsl(${h3},${satB-12}%,${litB+8}%)`);bg.addColorStop(1,`hsl(${h1+15},${satB+10}%,${litB-14}%)`)
  ctx.save();ctx.beginPath();eggPath(ctx,cx,cy,shRx,shRyT,shRyB);ctx.closePath();ctx.fillStyle=bg;ctx.fill()
  const dw=ctx.createLinearGradient(cx-shRx,cy-shRyT,cx+shRx,cy+shRyB);dw.addColorStop(0,`hsla(${dowHue},75%,${isNight?35:60}%,.14)`);dw.addColorStop(1,`hsla(${dowHue+60},70%,${isNight?40:65}%,.08)`);ctx.fillStyle=dw;ctx.beginPath();eggPath(ctx,cx,cy,shRx,shRyT,shRyB);ctx.fill()
  if(stats.streak>14){const sb=ctx.createLinearGradient(cx-shRx,cy+shRyB,cx+shRx,cy-shRyT);sb.addColorStop(0,'transparent');sb.addColorStop(.42,'transparent');sb.addColorStop(.5,`hsla(${ha},90%,65%,${Math.min(.28,stats.streak/200)})`);sb.addColorStop(.58,'transparent');sb.addColorStop(1,'transparent');ctx.fillStyle=sb;ctx.beginPath();eggPath(ctx,cx,cy,shRx,shRyT,shRyB);ctx.fill()}
  ctx.strokeStyle=`hsl(${h1},60%,${litB-20}%)`;ctx.lineWidth=2;ctx.stroke();ctx.restore()
  ctx.save();ctx.beginPath();eggPath(ctx,cx,cy,shRx-1,shRyT-1,shRyB-1);ctx.closePath();ctx.clip()
  if(progress>=.08){const n=Math.floor(8+progress*35+stats.streak*.25);const pal=[[h1,75,55],[h2,72,57],[h3,68,56],[ha,85,65],[h1+25,70,60]];for(let i=0;i<n;i++){const a=rng()*Math.PI*2,r=rng()*.84;const x=cx+Math.cos(a)*shRx*r,y=cy+Math.sin(a)*shRyT*r*.88;const sz=1.5+rng()*(3+progress*4);const[hh,sat,l]=pal[Math.floor(rng()*pal.length)];ctx.beginPath();ctx.arc(x,y,sz,0,Math.PI*2);ctx.fillStyle=`hsla(${hh},${sat}%,${isNight?l-15:l}%,${.35+progress*.4})`;ctx.fill()}}
  if(progress>=.25){const lines=Math.floor(3+stats.eng/22+progress*3);for(let i=0;i<lines;i++){const y0=cy-shRyT*.7+rng()*shRyT*1.4,cp1x=cx-shRx*.9+rng()*shRx*1.8,cp1y=y0-shRyT*.35+rng()*shRyT*.7;const hh=[h1,h2,ha,h1+40,h2-30][i%5];ctx.beginPath();ctx.moveTo(cx-shRx*.95,y0);ctx.quadraticCurveTo(cp1x,cp1y,cx+shRx*.95,y0+(rng()-.5)*shRyT*.5);ctx.strokeStyle=`hsla(${hh},72%,${isNight?42:52}%,${.2+progress*.25})`;ctx.lineWidth=1+progress*2;ctx.stroke()}}
  if(progress>=.45){const shapes=Math.floor(2+stats.math/20+progress*2);for(let i=0;i<shapes;i++){const x=cx+(rng()-.5)*shRx*1.2,y=cy+(rng()-.5)*shRyT*1.1,sz=4+rng()*14*progress;const sides=[3,4,6][Math.floor(rng()*3)];const hh=[h1,h2,h3][i%3];ctx.save();ctx.translate(x,y);ctx.rotate(rng()*Math.PI*2);ctx.beginPath();for(let s=0;s<sides;s++){const a=(s/sides)*Math.PI*2-Math.PI/2;s===0?ctx.moveTo(Math.cos(a)*sz,Math.sin(a)*sz):ctx.lineTo(Math.cos(a)*sz,Math.sin(a)*sz)}ctx.closePath();ctx.strokeStyle=`hsla(${hh},70%,42%,${.25+progress*.28})`;ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=`hsla(${hh},70%,68%,${.08+progress*.1})`;ctx.fill();ctx.restore()}}
  if(progress>=.65){const gl=['✦','◈','⬡','✧','◇','✴','❋'];const n=Math.floor(3+progress*6);for(let i=0;i<n;i++){const a=rng()*Math.PI*2,r=.25+rng()*.55;const x=cx+Math.cos(a)*shRx*r,y=cy+Math.sin(a)*shRyT*r*.85;const g=gl[Math.floor(rng()*gl.length)],sz=8+rng()*8*progress;ctx.font=`${Math.round(sz)}px serif`;ctx.fillStyle=`hsla(${[h1,ha,h2][i%3]},85%,${isNight?60:38}%,${.35+progress*.35})`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(g,x,y)}}
  if(progress>=.78){const n=Math.floor(6+progress*12);for(let i=0;i<n;i++){const a=rng()*Math.PI*2,r=.15+rng()*.75;const x=cx+Math.cos(a)*shRx*r,y=cy+Math.sin(a)*shRyT*r,sz=2+rng()*5;drawStar(ctx,x,y,4,sz,sz*.38,`hsla(${ha+(rng()-.5)*60},92%,${isNight?55:68}%,${.55+rng()*.35})`)}}
  if(progress>=.55){ctx.save();ctx.globalAlpha=(progress-.55)/.3*.25;ctx.font=`${Math.round(shRx*.6)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.filter='blur(4px)';ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillText('🐾',cx,cy+shRyT*.05);ctx.restore()}
  if(progress>=.78){ctx.save();ctx.globalAlpha=(progress-.78)/.22;ctx.font=`${Math.round(shRx*.28)}px serif`;ctx.textAlign='center';ctx.fillText('👁️',cx,cy+shRyT*.25);ctx.restore()}
  const sh=ctx.createRadialGradient(cx-shRx*.3,cy-shRyT*.42,0,cx-shRx*.2,cy-shRyT*.3,shRx*.48);sh.addColorStop(0,'rgba(255,255,255,.6)');sh.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sh;ctx.beginPath();eggPath(ctx,cx,cy,shRx-1,shRyT-1,shRyB-1);ctx.fill()
  ctx.restore()
  if(progress>=.86){const crng=prng(hash(stats.name+'crack'));ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1.5;for(let i=0;i<3+Math.floor(crng()*3);i++){const sx=cx+(crng()-.5)*shRx*.75,sy=cy+(crng()-.5)*shRyT*.75;ctx.beginPath();ctx.moveTo(sx,sy);let x=sx,y=sy;for(let j=0;j<3;j++){x+=(crng()-.5)*18;y+=(crng()-.5)*18;ctx.lineTo(x,y)}ctx.stroke()}}
}
