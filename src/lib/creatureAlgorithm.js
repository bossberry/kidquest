import { hash, prng } from './eggAlgorithm.js'

function shuffle(arr) { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a }

export function getCreatureSeed(egg) {
  const s = egg.eggStats || {}
  return hash((s.name||'') + (s.grade||0)) ^ hash('' + (s.dow||0) + (s.month||1) + (s.day||1) + (s.hour||12))
}

export function drawCreature(canvas, seed, stats) {
  const W=canvas.width,H=canvas.height,ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,W,H)
  const rng=prng(seed>>>0)
  const st=stats||{}
  const tSum=(st.xpThai||st.thai||0)+(st.xpEng||st.eng||0)+(st.xpMath||st.math||0)||1
  const thP=(st.xpThai||st.thai||0)/tSum, enP=(st.xpEng||st.eng||0)/tSum, maP=(st.xpMath||st.math||0)/tSum
  const maxP=Math.max(thP,enP,maP)
  const balanced=maxP<0.45
  let bH=balanced?(rng()*360|0):(thP===maxP?130+rng()*40:enP===maxP?200+rng()*30:260+rng()*30)
  const streak=st.streak||0; const acc=st.acc||70
  const rarN=streak>20?4:streak>10?3:streak>5?2:streak>2?1:0
  const cx=W/2,cy=H*0.52
  const bs=Math.min(W,H)*(0.26+rng()*.1)
  if(rarN>=2){const aR=bs*2,ag=ctx.createRadialGradient(cx,cy,bs*.2,cx,cy,aR);ag.addColorStop(0,`hsla(${bH},85%,65%,${.12+rarN*.04})`);ag.addColorStop(1,'transparent');ctx.fillStyle=ag;ctx.beginPath();ctx.ellipse(cx,cy,aR,aR*.9,0,0,Math.PI*2);ctx.fill()}
  if(streak>5){for(let fi=0;fi<6;fi++){const fa=rng()*Math.PI*2,fr=bs*(1.1+rng()*.4),fh=bs*(.15+rng()*.2);const fx=cx+Math.cos(fa)*fr,fy=cy+Math.sin(fa)*fr;const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,fh);fg.addColorStop(0,'hsla(30,100%,65%,.7)');fg.addColorStop(1,'transparent');ctx.fillStyle=fg;ctx.beginPath();ctx.ellipse(fx,fy,fh,fh*1.4,fa,0,Math.PI*2);ctx.fill()}}
  const bt=Math.floor(rng()*5)
  const bg=ctx.createRadialGradient(cx-bs*.2,cy-bs*.25,0,cx+bs*.1,cy+bs*.1,bs*1.3)
  bg.addColorStop(0,`hsl(${bH+15},${55+rarN*7}%,${74-rarN*3}%)`);bg.addColorStop(.5,`hsl(${bH},${62+rarN*5}%,${60-rarN*4}%)`);bg.addColorStop(1,`hsl(${bH-15},${65+rarN*4}%,${44-rarN*3}%)`)
  ctx.fillStyle=bg;ctx.beginPath()
  if(bt===0){ctx.ellipse(cx,cy,bs,bs,0,0,Math.PI*2)}
  else if(bt===1){ctx.ellipse(cx,cy,bs*.78,bs*1.18,0,0,Math.PI*2)}
  else if(bt===2){ctx.ellipse(cx,cy,bs*1.22,bs*.82,0,0,Math.PI*2)}
  else if(bt===3){for(let i=0;i<6;i++){const a=i/6*Math.PI*2-Math.PI/6;i===0?ctx.moveTo(cx+Math.cos(a)*bs,cy+Math.sin(a)*bs):ctx.lineTo(cx+Math.cos(a)*bs,cy+Math.sin(a)*bs)}ctx.closePath()}
  else{ctx.moveTo(cx,cy-bs);for(let i=1;i<=8;i++){const a=i/8*Math.PI*2,r=bs*(.82+rng()*.32);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}ctx.closePath()}
  ctx.fill();ctx.strokeStyle=`hsl(${bH},45%,28%)`;ctx.lineWidth=1.5;ctx.stroke()
  if(maP>0.4){ctx.save();ctx.clip();ctx.strokeStyle=`hsla(${bH+100},70%,40%,.3)`;ctx.lineWidth=1;for(let pi=0;pi<4;pi++){const px=cx+(rng()-.5)*bs*1.4,py=cy+(rng()-.5)*bs*1.2,ps=bs*(.2+rng()*.2);const sides=[3,4,6][Math.floor(rng()*3)];ctx.beginPath();for(let s=0;s<sides;s++){const a=s/sides*Math.PI*2;s===0?ctx.moveTo(px+Math.cos(a)*ps,py+Math.sin(a)*ps):ctx.lineTo(px+Math.cos(a)*ps,py+Math.sin(a)*ps)}ctx.closePath();ctx.stroke()}ctx.restore()}
  const ne=1+Math.floor(rng()*3);const eS=bs*(0.12+rng()*.07);const eHue=(bH+180)%360
  for(let i=0;i<ne;i++){const ea=(ne===1?0:(i/(ne-1)-.5)*1.1),ex=cx+Math.sin(ea)*bs*.42,ey=cy-bs*.2+Math.cos(ea)*bs*.05;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(ex,ey,eS,eS*.9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=`hsl(${eHue},70%,${acc>85?55:40}%)`;ctx.beginPath();ctx.ellipse(ex,ey,eS*.6,eS*.72,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(ex,ey,eS*.3,eS*.38,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(ex-eS*.15,ey-eS*.15,eS*.12,0,Math.PI*2);ctx.fill();if(acc>85){ctx.save();ctx.shadowColor=`hsl(${eHue},90%,65%)`;ctx.shadowBlur=5;ctx.strokeStyle=`hsl(${eHue},80%,65%)`;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(ex,ey,eS*.65,eS*.78,0,0,Math.PI*2);ctx.stroke();ctx.restore()}}
  const feats=[];if(enP>0.35)feats.push('wing');if(streak>5)feats.push('flame_feat');feats.push(...['horn','tail','spike','tentacle','scale'])
  const nFeat=Math.min(4,1+rarN+Math.floor(rng()));const chosen=shuffle([...feats]).slice(0,nFeat)
  for(const f of chosen){
    ctx.save()
    if(f==='horn'){const hn=1+Math.floor(rng()*3);for(let h=0;h<hn;h++){const ha=((h/(hn)-0.5)*0.8);const hx=cx+Math.sin(ha)*bs*.5,hy=cy-bs*.85;ctx.fillStyle=`hsl(${bH+30},60%,45%)`;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx-bs*.08,hy+bs*(.4+rng()*.4)*.8);ctx.lineTo(hx+bs*.08,hy+bs*(.4+rng()*.4)*.8);ctx.closePath();ctx.fill()}}
    else if(f==='tail'){ctx.strokeStyle=`hsl(${bH},55%,45%)`;ctx.lineWidth=bs*.18;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx+bs*.55,cy+bs*.3);ctx.bezierCurveTo(cx+bs*1.0,cy+bs*.5,cx+bs*1.2,cy-bs*.1,cx+bs*.8,cy-bs*.4);ctx.stroke()}
    else if(f==='wing'){const wy=cy-bs*.2;[[1],[-1]].forEach(([sx])=>{const wg=ctx.createLinearGradient(cx,wy,cx+sx*bs*1.8,wy-bs*.8);wg.addColorStop(0,`hsla(${bH+20},70%,65%,.8)`);wg.addColorStop(1,`hsla(${bH+40},60%,75%,.2)`);ctx.fillStyle=wg;ctx.beginPath();ctx.moveTo(cx+sx*bs*.6,wy);ctx.bezierCurveTo(cx+sx*bs*1.2,wy-bs*.9,cx+sx*bs*1.8,wy-bs*.5,cx+sx*bs*.5,wy+bs*.1);ctx.fill()})}
    else if(f==='spike'){const ns=4+Math.floor(rng()*4);for(let s=0;s<ns;s++){const sa=s/ns*Math.PI*2;ctx.fillStyle=`hsl(${bH-10},55%,38%)`;ctx.beginPath();ctx.moveTo(cx+Math.cos(sa)*bs*.9,cy+Math.sin(sa)*bs*.85);ctx.lineTo(cx+Math.cos(sa+.25)*bs*.75,cy+Math.sin(sa+.25)*bs*.75);ctx.lineTo(cx+Math.cos(sa-.25)*bs*.75,cy+Math.sin(sa-.25)*bs*.75);ctx.closePath();ctx.fill()}}
    else if(f==='tentacle'){const nt=2+Math.floor(rng()*3);for(let t=0;t<nt;t++){const ta=-Math.PI/2+((t/(nt-1||1))-.5)*Math.PI*.6;ctx.strokeStyle=`hsl(${bH+10},58%,42%)`;ctx.lineWidth=bs*.1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx+Math.cos(ta)*bs*.6,cy+Math.sin(ta)*bs*.6);ctx.bezierCurveTo(cx+Math.cos(ta)*bs*1.1+Math.cos(ta+.8)*bs*.3,cy+Math.sin(ta)*bs*1.1,cx+Math.cos(ta)*bs*1.4,cy+Math.sin(ta)*bs*1.4,cx+Math.cos(ta)*bs*1.2,cy+Math.sin(ta)*bs*1.6);ctx.stroke()}}
    else if(f==='scale'){ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,bs*.95,bs*.95,0,0,Math.PI*2);ctx.clip();ctx.strokeStyle=`hsla(${bH+15},50%,35%,.4)`;ctx.lineWidth=1;for(let row=0;row<8;row++)for(let col=0;col<8;col++){const sx=cx-bs*.9+col*bs*.25+(row%2?.12:0),sy=cy-bs*.9+row*bs*.22;ctx.beginPath();ctx.arc(sx,sy,bs*.1,0,Math.PI);ctx.stroke()}ctx.restore()}
    else if(f==='flame_feat'){ctx.globalAlpha=.5;for(let fl=0;fl<5;fl++){const fa2=rng()*Math.PI*2,fr2=bs*(1.05+rng()*.25);ctx.fillStyle=`hsla(${20+rng()*30},100%,60%,.6)`;ctx.beginPath();ctx.ellipse(cx+Math.cos(fa2)*fr2,cy+Math.sin(fa2)*fr2,bs*.1,bs*.2,fa2,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
    ctx.restore()
  }
  const shine=ctx.createRadialGradient(cx-bs*.22,cy-bs*.28,0,cx-bs*.1,cy-bs*.15,bs*.5);shine.addColorStop(0,'rgba(255,255,255,.35)');shine.addColorStop(1,'transparent');ctx.fillStyle=shine;ctx.beginPath();ctx.ellipse(cx,cy,bs,bs,0,0,Math.PI*2);ctx.fill()
  if(rarN>=4){for(let p=0;p<8;p++){const pa=rng()*Math.PI*2,pr=bs*(1.2+rng()*.6);ctx.fillStyle=`hsla(${rng()*360|0},90%,70%,.7)`;ctx.beginPath();ctx.arc(cx+Math.cos(pa)*pr,cy+Math.sin(pa)*pr,bs*.06,0,Math.PI*2);ctx.fill()}}
}
