let audioCtx = null
let _soundOn = true
let _phonicsAudio = null
let currentPhonicsAudio = null

export function setSoundOn(v) {
  _soundOn = v
  if (!v && window.speechSynthesis) window.speechSynthesis.cancel()
}
export function getSoundOn() { return _soundOn }

export function getACtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function toggleSound(btn) {
  _soundOn = !_soundOn
  if (btn) { btn.textContent = _soundOn ? '🔊' : '🔇'; btn.style.opacity = _soundOn ? '1' : '.5' }
  if (!_soundOn && window.speechSynthesis) window.speechSynthesis.cancel()
  return _soundOn
}

export function playTone(type) {
  if (!_soundOn) return
  try {
    const ctx = getACtx()
    const t = (f,d,v,dur,tp='sine') => {
      const o=ctx.createOscillator(),g=ctx.createGain()
      o.connect(g);g.connect(ctx.destination)
      o.type=tp;o.frequency.value=f
      const st=ctx.currentTime+d
      g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(v,st+.02);g.gain.exponentialRampToValueAtTime(.001,st+dur)
      o.start(st);o.stop(st+dur+.02)
    }
    if(type==='correct'){t(523,0,.28,.28);t(659,.12,.28,.28);t(784,.24,.28,.28)}
    else if(type==='wrong'){t(220,0,.2,.22,'sawtooth');t(180,.15,.2,.22,'sawtooth')}
    else if(type==='streak'){t(523,0,.3,.32,'triangle');t(659,.1,.3,.32,'triangle');t(784,.2,.3,.32,'triangle');t(1047,.32,.3,.32,'triangle')}
    else if(type==='fanfare'){[523,659,784,1047,784,1047].forEach((f,i)=>t(f,i*.09,.25,.45))}
    else if(type==='click'){t(660,0,.14,.08)}
    else if(type==='next'){t(440,0,.11,.09)}
    // Interaction tones
    else if(type==='tap'){t(523,0,.12,.09,'sine');t(660,.05,.09,.07,'sine')}
    else if(type==='open'){t(440,0,.12,.1,'triangle');t(660,.09,.12,.12,'triangle')}
    else if(type==='unlock'){[523,659,784,1047].forEach((f,i)=>t(f,i*.1,.22,.28,'triangle'))}
    else if(type==='item'){[659,784,988,1175].forEach((f,i)=>t(f,i*.06,.14,.12,'triangle'))}
    else if(type==='eggReady'){t(523,0,.2,.35,'sine');t(659,.22,.2,.3,'sine');t(784,.44,.22,.28,'sine')}
    else if(type==='reveal'){[523,659,784,1047,1319].forEach((f,i)=>t(f,i*.08,.18,.28,'triangle'));t(1568,.5,.16,.35,'sine')}
    else if(type==='start'){t(440,0,.16,.1,'square');t(659,.08,.16,.12,'square');t(880,.16,.18,.14,'sine')}
    else if(type==='complete'){[523,784,659,1047].forEach((f,i)=>t(f,i*.1,.2,.35,'triangle'))}
    else if(type==='cardOpen'){t(880,0,.12,.07,'sine');t(1047,.05,.1,.08,'sine')}
    // Adventure modes
    else if(type==='dash'){t(400,0,.1,.14,'sawtooth');t(600,.05,.08,.12,'sawtooth');t(900,.1,.1,.1,'sine')}
    else if(type==='block'){t(150,0,.08,.28,'square');t(220,.05,.08,.22,'square');t(330,.1,.1,.16,'sine')}
    // Battle move sounds
    else if(type==='miss'){t(320,0,.18,.22,'sawtooth');t(250,.1,.14,.20,'sawtooth');t(180,.2,.1,.18,'sawtooth')}
    else if(type==='combo'){t(659,0,.18,.18,'triangle');t(784,.08,.18,.18,'triangle');t(1047,.16,.2,.22,'triangle')}
    else if(type==='ultimate'){[523,659,784,1047,1319,1568,2093].forEach((f,i)=>t(f,i*.07,.28,.45,'triangle'));t(2093,.6,.3,.5,'sine')}
    // Egg Home sounds
    else if(type==='chirp'){t(880,0,.14,.07,'sine');t(1100,.06,.12,.06,'sine');t(1320,.12,.1,.05,'sine')}
    else if(type==='sparkle'){[1047,1319,1568,2093].forEach((f,i)=>t(f,i*.05,.12,.1,'triangle'))}
    else if(type==='jingle'){t(880,0,.1,.1,'triangle');t(1175,.08,.1,.1,'triangle');t(1397,.16,.1,.1,'triangle');t(880,.24,.08,.08,'triangle')}
    else if(type==='feed'){t(440,0,.1,.1,'sine');t(587,.08,.14,.12,'sine');t(659,.16,.1,.1,'sine')}
    // Egg Home emotional sounds
    else if(type==='chew'){[0,.1,.21].forEach((d,i)=>{t(420+i*35,d,.16,.06,'square');t(290+i*15,d+.03,.1,.04,'sine')});t(270,.38,.07,.12,'sine')}
    else if(type==='slurp'){const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';const st=ctx.currentTime;o.frequency.setValueAtTime(180,st);o.frequency.exponentialRampToValueAtTime(760,st+.42);g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.13,st+.06);g.gain.exponentialRampToValueAtTime(.001,st+.44);o.start(st);o.stop(st+.46);t(520,.34,.07,.12,'triangle')}
    else if(type==='giggle'){[0,.13,.27,.41].forEach((d,i)=>{t(660+i*28,d,.13,.08,'triangle');t(880+i*18,d+.05,.09,.06,'triangle')})}
    else if(type==='sigh'){const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';const st=ctx.currentTime;o.frequency.setValueAtTime(440,st);o.frequency.exponentialRampToValueAtTime(280,st+.55);g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.09,st+.1);g.gain.exponentialRampToValueAtTime(.001,st+.58);o.start(st);o.stop(st+.6)}
    else if(type==='celebrate'){[523,659,784,880,1047,1319].forEach((f,i)=>t(f,i*.06,.2,.14,'triangle'));t(1047,.44,.16,.3,'sine')}
    else if(type==='begging'){const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';const st=ctx.currentTime;o.frequency.setValueAtTime(360,st);o.frequency.linearRampToValueAtTime(520,st+.18);o.frequency.linearRampToValueAtTime(390,st+.34);g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.11,st+.05);g.gain.exponentialRampToValueAtTime(.001,st+.38);o.start(st);o.stop(st+.4)}
    else if(type==='yawn'){const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';const st=ctx.currentTime;o.frequency.setValueAtTime(290,st);o.frequency.linearRampToValueAtTime(220,st+.3);o.frequency.exponentialRampToValueAtTime(165,st+.88);g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.07,st+.18);g.gain.exponentialRampToValueAtTime(.001,st+.92);o.start(st);o.stop(st+.94)}
    else if(type==='stageUp'){[523,659,784,1047,1319].forEach((f,i)=>t(f,i*.08,.22,.28,'triangle'));t(1568,.46,.28,.5,'sine');t(2093,.6,.18,.38,'triangle')}
    else if(type==='heartbeat'){const st=ctx.currentTime;[0,.22].forEach(d=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.connect(g);g.connect(ctx.destination);o.frequency.setValueAtTime(90,st+d);o.frequency.exponentialRampToValueAtTime(38,st+d+.18);g.gain.setValueAtTime(0,st+d);g.gain.linearRampToValueAtTime(.32,st+d+.025);g.gain.exponentialRampToValueAtTime(.001,st+d+.2);o.start(st+d);o.stop(st+d+.22)})}

  } catch(e) {}
}

export function speakTh(text) {
  if (!_soundOn || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang='th-TH';u.rate=.85;u.pitch=1.1
  const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('th'))
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

export function speakEn(text, rate=.82) {
  if (!_soundOn || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang='en-US';u.rate=rate;u.pitch=1.1
  const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('en'))
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

export async function playPhonicsSound(q, onEnd) {
  if (!_soundOn) return
  if (!_phonicsAudio) {
    try {
      const mod = await import('../assets/phonicsAudio.js')
      _phonicsAudio = mod.PHONICS_AUDIO
    } catch(e) { if (onEnd) speakEn(q.word, .78); return }
  }
  if (currentPhonicsAudio) { currentPhonicsAudio.pause(); currentPhonicsAudio = null }
  const key = q.letter?.toLowerCase()
  const dataUri = _phonicsAudio?.[key]
  if (!dataUri) { if (onEnd) speakEn(q.word, .78); return }
  const audio = new Audio(dataUri)
  currentPhonicsAudio = audio
  try {
    const ctx = getACtx()
    const src = ctx.createMediaElementSource(audio)
    const gain = ctx.createGain(); gain.gain.value = 4.0
    src.connect(gain); gain.connect(ctx.destination)
  } catch(e) { audio.volume = 1.0 }
  audio.onended = () => { if (onEnd) setTimeout(() => speakEn(q.word, .82), 50) }
  audio.onerror = () => { speakEn(q.word, .78) }
  audio.play().catch(() => speakEn(q.word, .78))
}

export function playEatSound() {
  if (!_soundOn) return
  try {
    const ctx = getACtx()
    for(let i=0;i<3;i++){
      setTimeout(()=>{
        const buf=ctx.createBuffer(1,ctx.sampleRate*.06,ctx.sampleRate)
        const data=buf.getChannelData(0)
        for(let j=0;j<data.length;j++) data[j]=(Math.random()*2-1)*Math.exp(-j/(data.length*.4))
        const src=ctx.createBufferSource()
        const gain=ctx.createGain(); gain.gain.value=.18
        const filter=ctx.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=800+i*200
        src.buffer=buf; src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
        src.start(ctx.currentTime)
      }, i*120)
    }
    setTimeout(()=>{
      const o=ctx.createOscillator(),g=ctx.createGain()
      o.connect(g);g.connect(ctx.destination)
      o.type='sine';o.frequency.value=880
      g.gain.setValueAtTime(0,ctx.currentTime);g.gain.linearRampToValueAtTime(.2,ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.3)
      o.start(ctx.currentTime);o.stop(ctx.currentTime+.32)
    }, 400)
  } catch(e) {}
}

// Egg Run SFX
export function erSfxJump(){if(!_soundOn)return;try{const ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.setValueAtTime(200,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(600,ctx.currentTime+.12);g.gain.setValueAtTime(.22,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.18);o.start(ctx.currentTime);o.stop(ctx.currentTime+.2)}catch(e){}}
export function erSfxRing(){if(!_soundOn)return;try{const ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=1047;g.gain.setValueAtTime(.18,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);o.start(ctx.currentTime);o.stop(ctx.currentTime+.13)}catch(e){}}
export function erSfxHit(){if(!_soundOn)return;try{const ctx=getACtx();[80,60,40].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sawtooth';o.frequency.value=f;const t=ctx.currentTime+i*.06;g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.start(t);o.stop(t+.2)})}catch(e){}}
export function erSfxSpeedUp(){if(!_soundOn)return;try{const ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sawtooth';o.frequency.setValueAtTime(150,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(400,ctx.currentTime+.25);g.gain.setValueAtTime(.14,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.3);o.start(ctx.currentTime);o.stop(ctx.currentTime+.32)}catch(e){}}
export function erSfxMilestone(){if(!_soundOn)return;try{const ctx=getACtx();[523,659,784,1047].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='triangle';o.frequency.value=f;const t=ctx.currentTime+i*.08;g.gain.setValueAtTime(.22,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.start(t);o.stop(t+.27)})}catch(e){}}
export function erSfxGameOver(){if(!_soundOn)return;try{const ctx=getACtx();[600,400,250,150].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=f;const t=ctx.currentTime+i*.14;g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.start(t);o.stop(t+.22)})}catch(e){}}
export function erSfxRecord(){if(!_soundOn)return;try{const ctx=getACtx();[523,659,784,1047,1319,1568].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='triangle';o.frequency.value=f;const t=ctx.currentTime+i*.07;g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.start(t);o.stop(t+.24)})}catch(e){}}
export function erSfxCountdown(n){if(!_soundOn)return;try{const ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=n===0?880:440+n*80;g.gain.setValueAtTime(.25,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+(n===0?.4:.2));o.start(ctx.currentTime);o.stop(ctx.currentTime+(n===0?.45:.25))}catch(e){}}
export function playTapCrackSound(tapNum){if(!_soundOn)return;try{const ctx=getACtx(),buf=ctx.createBuffer(1,ctx.sampleRate*.06,ctx.sampleRate),data=buf.getChannelData(0);for(let j=0;j<data.length;j++)data[j]=(Math.random()*2-1)*Math.exp(-j/(data.length*.35));const src=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.1+tapNum*.06;const filt=ctx.createBiquadFilter();filt.type='bandpass';filt.frequency.value=500+tapNum*120;src.buffer=buf;src.connect(filt);filt.connect(gain);gain.connect(ctx.destination);src.start(ctx.currentTime);const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=300+tapNum*80;g.gain.setValueAtTime(0,ctx.currentTime+.05);g.gain.linearRampToValueAtTime(.15,ctx.currentTime+.07);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.25);o.start(ctx.currentTime+.05);o.stop(ctx.currentTime+.27)}catch(e){}}
export function playHatchSound(){if(!_soundOn)return;try{const ctx=getACtx();const t=(f,d,v,dur,tp='sine')=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=tp;o.frequency.value=f;const st=ctx.currentTime+d;g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(v,st+.02);g.gain.exponentialRampToValueAtTime(.001,st+dur);o.start(st);o.stop(st+dur+.02)};[0,.15,.3,.5,.7,.9].forEach((d,i)=>{const buf=ctx.createBuffer(1,ctx.sampleRate*.05,ctx.sampleRate),data=buf.getChannelData(0);for(let j=0;j<data.length;j++)data[j]=(Math.random()*2-1)*Math.exp(-j/(data.length*.3));const src=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.12+i*.03;const filt=ctx.createBiquadFilter();filt.type='bandpass';filt.frequency.value=600+i*150;src.buffer=buf;src.connect(filt);filt.connect(gain);gain.connect(ctx.destination);src.start(ctx.currentTime+d)});t(80,1.2,.4,.6,'sawtooth');t(120,1.2,.3,.5,'sawtooth');[523,587,659,698,784,880,988,1047].forEach((f,i)=>t(f,1.5+i*.1,.25,.4));[523,659,784,1047,1319,1568].forEach((f,i)=>t(f,2.5+i*.08,.3,.5))}catch(e){}}

// ── BGM + SFX ────────────────────────────────────────────────────────────────────

let bgmNodes  = []   // sustained oscillators { osc, gain }
let bgmTimers = []   // loop scheduling timers for cleanup

// Low-level primitive helpers ──────────────────────────────────────────────────
function _t(ctx, f, vol, ms, type = 'sine', delayMs = 0) {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = type; o.frequency.value = f
  const st = ctx.currentTime + delayMs / 1000
  g.gain.setValueAtTime(0, st)
  g.gain.linearRampToValueAtTime(vol, st + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, st + ms / 1000)
  o.start(st); o.stop(st + ms / 1000 + 0.05)
}
function _sweep(ctx, f0, f1, vol, type, ms = 180) {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = type
  o.frequency.setValueAtTime(f0, ctx.currentTime)
  o.frequency.exponentialRampToValueAtTime(f1, ctx.currentTime + ms / 1000)
  g.gain.setValueAtTime(vol, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000)
  o.start(ctx.currentTime); o.stop(ctx.currentTime + ms / 1000 + 0.05)
}
function _noise(ctx, vol, ms) {
  const len = Math.ceil(ctx.sampleRate * ms / 1000)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource(), g = ctx.createGain()
  g.gain.setValueAtTime(vol, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000)
  src.buffer = buf; src.connect(g); g.connect(ctx.destination)
  src.start(ctx.currentTime); src.stop(ctx.currentTime + ms / 1000 + 0.01)
}
function _arp(ctx, freqs, msEach, type) {
  freqs.forEach((f, i) => {
    if (!f) return
    const st = ctx.currentTime + i * msEach / 1000
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = type; o.frequency.value = f
    g.gain.setValueAtTime(0, st)
    g.gain.linearRampToValueAtTime(0.09, st + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, st + msEach / 1000 * 0.8)
    o.start(st); o.stop(st + msEach / 1000)
  })
}
function _vibrato(ctx, f, vol, type, rate) {
  const o = ctx.createOscillator(), g = ctx.createGain()
  const lfo = ctx.createOscillator(), lg = ctx.createGain()
  lfo.frequency.value = rate; lg.gain.value = f * 0.04
  lfo.connect(lg); lg.connect(o.frequency)
  o.connect(g); g.connect(ctx.destination)
  o.type = type; o.frequency.value = f
  g.gain.setValueAtTime(vol, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  lfo.start(ctx.currentTime); o.start(ctx.currentTime)
  lfo.stop(ctx.currentTime + 0.35); o.stop(ctx.currentTime + 0.35)
}

// BGM tracks — each returns array of sustained { osc, gain } for graceful fade ─

function _bgmHome(ctx) {
  const nodes = []
  const pad = ctx.createOscillator(), padG = ctx.createGain()
  pad.type = 'sine'; pad.frequency.value = 261; padG.gain.value = 0.035
  pad.connect(padG); padG.connect(ctx.destination); pad.start()
  nodes.push({ osc: pad, gain: padG })
  const mel = [261, 329, 392, 329]
  let idx = 0
  const tick = () => {
    if (bgmNodes !== nodes) return
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'triangle'; o.frequency.value = mel[idx++ % mel.length]
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.04)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42)
    o.connect(g); g.connect(ctx.destination)
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.48)
    bgmTimers.push(setTimeout(tick, 400))
  }
  bgmTimers.push(setTimeout(tick, 300))
  return nodes
}

function _bgmWorld(ctx) {
  const nodes = []
  const pad = ctx.createOscillator(), padG = ctx.createGain()
  pad.type = 'sine'; pad.frequency.value = 130; padG.gain.value = 0.020
  pad.connect(padG); padG.connect(ctx.destination); pad.start()
  nodes.push({ osc: pad, gain: padG })
  const bass = [130, 196, 130, 196], mel = [261, 293, 329, 392, 329, 293, 261, 0]
  let bi = 0, mi = 0
  const bassTick = () => {
    if (bgmNodes !== nodes) return
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'square'; o.frequency.value = bass[bi++ % bass.length]
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.36)
    o.connect(g); g.connect(ctx.destination)
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.40)
    bgmTimers.push(setTimeout(bassTick, 400))
  }
  const melTick = () => {
    if (bgmNodes !== nodes) return
    const f = mel[mi++ % mel.length]
    if (f) {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.028, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
      o.connect(g); g.connect(ctx.destination)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.50)
    }
    bgmTimers.push(setTimeout(melTick, 250))
  }
  bgmTimers.push(setTimeout(bassTick, 100))
  bgmTimers.push(setTimeout(melTick, 200))
  return nodes
}

function _bgmBattle(ctx) {
  const nodes = []
  const sub = ctx.createOscillator(), subG = ctx.createGain()
  sub.type = 'sawtooth'; sub.frequency.value = 65; subG.gain.value = 0.014
  sub.connect(subG); subG.connect(ctx.destination); sub.start()
  nodes.push({ osc: sub, gain: subG })
  const bass = [130, 130, 196, 130], riff = [261, 329, 392, 523, 392, 329]
  let bi = 0, ri = 0
  const bassTick = () => {
    if (bgmNodes !== nodes) return
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'sawtooth'; o.frequency.value = bass[bi++ % bass.length]
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.016, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    o.connect(g); g.connect(ctx.destination)
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.21)
    bgmTimers.push(setTimeout(bassTick, 210))
  }
  const riffTick = () => {
    if (bgmNodes !== nodes) return
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'square'; o.frequency.value = riff[ri++ % riff.length]
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.026, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.20)
    o.connect(g); g.connect(ctx.destination)
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.22)
    bgmTimers.push(setTimeout(riffTick, 170))
  }
  bgmTimers.push(setTimeout(bassTick, 50))
  bgmTimers.push(setTimeout(riffTick, 90))
  return nodes
}

function _bgmVictory(ctx) {
  const freqs = [261, 329, 392, 523]
  freqs.forEach((f, i) => {
    const st = ctx.currentTime + i * 0.12
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'square'; o.frequency.value = f
    g.gain.setValueAtTime(0, st)
    g.gain.linearRampToValueAtTime(0.06, st + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.48)
    o.connect(g); g.connect(ctx.destination)
    o.start(st); o.stop(st + 0.52)
  })
  const st2 = ctx.currentTime + freqs.length * 0.12
  const o2 = ctx.createOscillator(), g2 = ctx.createGain()
  o2.type = 'sine'; o2.frequency.value = 523
  g2.gain.setValueAtTime(0, st2)
  g2.gain.linearRampToValueAtTime(0.055, st2 + 0.05)
  g2.gain.linearRampToValueAtTime(0, st2 + 0.8)
  o2.connect(g2); g2.connect(ctx.destination)
  o2.start(st2); o2.stop(st2 + 0.85)
  return [] // one-shot, no sustained nodes
}

const BGM_TRACKS = { home: _bgmHome, world: _bgmWorld, battle: _bgmBattle, victory: _bgmVictory }

export function playBGM(track) {
  stopBGM(0)
  if (!_soundOn) return
  const fn = BGM_TRACKS[track]
  if (!fn) return
  try { bgmNodes = fn(getACtx()) || [] } catch(e) {}
}

export function stopBGM(fadeMs = 200) {
  bgmTimers.forEach(t => clearTimeout(t))
  bgmTimers = []
  if (bgmNodes.length > 0 && audioCtx) {
    bgmNodes.forEach(({ osc, gain }) => {
      try {
        if (fadeMs > 0 && gain) {
          gain.gain.cancelScheduledValues(audioCtx.currentTime)
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeMs / 1000)
          setTimeout(() => { try { osc.stop() } catch(e) {} }, fadeMs + 100)
        } else {
          try { osc.stop() } catch(e) {}
        }
      } catch(e) {}
    })
  }
  bgmNodes = []
}

// SFX dictionary ───────────────────────────────────────────────────────────────
const SFX = {
  // Battle
  attack_launch: ctx => _sweep(ctx, 200, 600, 0.09, 'sawtooth', 140),
  attack_hit:    ctx => { _noise(ctx, 0.07, 70); _t(ctx, 100, 0.07, 90, 'sine') },
  attack_miss:   ctx => _sweep(ctx, 400, 160, 0.10, 'sine', 200),
  enemy_attack:  ctx => _sweep(ctx, 500, 180, 0.09, 'square', 170),
  player_hit:    ctx => { _t(ctx, 75, 0.07, 110, 'sine'); _noise(ctx, 0.045, 55) },
  combo:         ctx => _vibrato(ctx, 800, 0.11, 'sawtooth', 18),
  ultra_move:    ctx => { _t(ctx, 80, 0.10, 280, 'sawtooth'); _sweep(ctx, 200, 1200, 0.09, 'sine', 380) },
  victory:       ctx => _arp(ctx, [523, 659, 784, 1047], 115, 'square'),
  battle_start:  ctx => _arp(ctx, [196, 261, 392], 58, 'square'),
  level_up:      ctx => _arp(ctx, [523, 659, 784, 1047], 50, 'sine'),
  // World
  footstep:     ctx => _noise(ctx, 0.016, 16),
  tall_grass:   ctx => _noise(ctx, 0.026, 60),
  npc_talk:     ctx => _t(ctx, 600, 0.045, 65, 'sine'),
  screen_enter: ctx => _sweep(ctx, 150, 400, 0.055, 'sine', 280),
  item_collect: ctx => _arp(ctx, [523, 784], 75, 'sine'),
  enemy_notice: ctx => _arp(ctx, [294, 440], 95, 'square'),
  // Home
  egg_pet:     ctx => _t(ctx, 440, 0.065, 95, 'sine'),
  egg_excited: ctx => _arp(ctx, [523, 659, 784], 52, 'sine'),
  egg_hatch:   ctx => { _noise(ctx, 0.10, 190); _sweep(ctx, 300, 800, 0.09, 'sine', 280) },
  stage_up:    ctx => _arp(ctx, [261, 329, 392], 115, 'triangle'),
}

export function playSFX(name) {
  if (!_soundOn) return
  try { const fn = SFX[name]; if (fn) fn(getACtx()) } catch(e) {}
}

// Element attack SFX — 6 elements × 4 tiers
const SFX_ELEMENTS = {
  lightning: [
    ctx => { _noise(ctx, 0.08, 60); _t(ctx, 800, 0.08, 60, 'square') },
    ctx => { _noise(ctx, 0.07, 80); _sweep(ctx, 600, 400, 0.07, 'sawtooth', 150) },
    ctx => { _t(ctx, 80, 0.09, 300, 'sine'); _noise(ctx, 0.06, 200) },
    ctx => { _t(ctx, 60, 0.10, 400, 'sine'); _noise(ctx, 0.09, 300); _t(ctx, 1200, 0.07, 100, 'sine', 300) },
  ],
  fire: [
    ctx => _sweep(ctx, 200, 600, 0.07, 'sawtooth', 150),
    ctx => _sweep(ctx, 150, 500, 0.09, 'sawtooth', 250),
    ctx => { _t(ctx, 100, 0.08, 300, 'sawtooth'); _noise(ctx, 0.06, 250) },
    ctx => { _t(ctx, 60, 0.10, 400, 'sawtooth'); _noise(ctx, 0.09, 300); _t(ctx, 900, 0.05, 80, 'sine', 350) },
  ],
  ice: [
    ctx => _t(ctx, 1200, 0.09, 100, 'sine'),
    ctx => { _noise(ctx, 0.06, 80); _t(ctx, 800, 0.07, 150, 'sine') },
    ctx => _sweep(ctx, 1600, 2400, 0.06, 'sine', 400),
    ctx => { _t(ctx, 200, 0.09, 300, 'sine'); _t(ctx, 1400, 0.07, 300, 'sine') },
  ],
  wind: [
    ctx => _noise(ctx, 0.05, 200),
    ctx => _noise(ctx, 0.07, 300),
    ctx => _sweep(ctx, 400, 1200, 0.07, 'sine', 500),
    ctx => { _sweep(ctx, 300, 1400, 0.08, 'sine', 600); _t(ctx, 100, 0.05, 400, 'sine') },
  ],
  laser: [
    ctx => _sweep(ctx, 800, 400, 0.08, 'sawtooth', 150),
    ctx => _t(ctx, 600, 0.09, 250, 'square'),
    ctx => { _t(ctx, 400, 0.08, 200, 'sawtooth'); _noise(ctx, 0.06, 150) },
    ctx => { _t(ctx, 200, 0.09, 400, 'sine'); _t(ctx, 1600, 0.07, 400, 'sine'); _noise(ctx, 0.06, 200) },
  ],
  water: [
    ctx => _t(ctx, 400, 0.08, 100, 'sine'),
    ctx => { _noise(ctx, 0.06, 200); _t(ctx, 300, 0.06, 120, 'sine') },
    ctx => _sweep(ctx, 200, 800, 0.07, 'sine', 400),
    ctx => { _t(ctx, 80, 0.09, 500, 'sine'); _sweep(ctx, 300, 900, 0.07, 'sine', 400) },
  ],
}

export function playElementSFX(element, tierIndex) {
  if (!_soundOn) return
  try {
    const fns = SFX_ELEMENTS[element]
    if (!fns) return
    fns[Math.min(tierIndex, fns.length - 1)](getACtx())
  } catch(e) {}
}

// iOS: resume AudioContext on first touch ──────────────────────────────────────
if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', () => {
    if (audioCtx?.state === 'suspended') audioCtx.resume()
  }, { once: true })
}

export function initVoices() {
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
  }
}
