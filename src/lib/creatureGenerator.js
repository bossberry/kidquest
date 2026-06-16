import { hash, prng } from './eggAlgorithm.js'

// ---------------------------------------------------------------------------
// Hue computation — must mirror drawEgg exactly, never diverge
// ---------------------------------------------------------------------------
function computeHues(stats) {
  const sa = [
    { v: stats.thai || 0, h: 140 },
    { v: stats.eng  || 0, h: 210 },
    { v: stats.math || 0, h: 270 },
  ]
  sa.sort((a, b) => b.v - a.v)
  const dowHue   = [210, 0, 120, 30, 270, 45, 60][(stats.dow ?? 1) % 7]
  const monthOff = ((stats.month ?? 1) - 1) * 30
  const hr       = stats.hour ?? 12
  const hourTone = hr < 6  ? 280
                 : hr < 12 ? 30
                 : hr < 17 ? 45
                 : hr < 20 ? 20 : 260
  const sk       = stats.streak ?? 0
  const sp       = stats.speed  ?? 50
  return {
    h1: (sa[0].h + dowHue * 0.3 + monthOff * 0.15) % 360,
    h2: (sa[1].h + dowHue * 0.2 + monthOff * 0.2)  % 360,
    h3: (sa[2].h + hourTone * 0.1) % 360,
    ha: (sk > 30 ? 45 : sk > 14 ? 38 : hourTone + sp * 0.3) % 360,
  }
}

// ---------------------------------------------------------------------------
// Egg motif detection — first match wins
// ---------------------------------------------------------------------------
export function detectEggMotif(h1, ha, isNight, streak, stage) {
  if (isNight)                                               return 'moon'
  if (ha >= 30 && ha <= 60 && streak >= 14 && stage >= 5)   return 'star'
  if (h1 >= 80  && h1 < 160)                                return 'leaf'
  if (h1 >= 160 && h1 < 220)                                return 'ocean'
  if (h1 >= 220 && h1 < 270)                                return 'cloud'
  if (h1 >= 270 && h1 < 320)                                return 'crystal'
  if (h1 >= 340 || h1 < 30)                                 return 'ember'
  return null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pickFrom(r, arr) {
  return arr[Math.floor(r * arr.length)]
}

function pickWeighted(r, items, weights) {
  let cursor = r * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    cursor -= weights[i]
    if (cursor <= 0) return items[i]
  }
  return items[items.length - 1]
}

// ---------------------------------------------------------------------------
// Family determination — motif first, stats fallback
// Uses exactly 3 pre-drawn values (r0, r1, r2) regardless of which path
// ---------------------------------------------------------------------------
function determineFamily(motif, stats, r0, r1, r2) {
  const thaiDom = stats.thai > 50
  const engDom  = stats.eng  > 50
  const mathDom = stats.math > 50

  if (motif === 'moon')    return 'moon'
  if (motif === 'star')    return 'star'
  if (motif === 'leaf')    return 'leaf'
  if (motif === 'ocean')   return 'ocean'
  if (motif === 'cloud')   return 'cloud'
  if (motif === 'crystal') return 'crystal'

  // Ember = warm-palette Fox / Dragon / Bear (no separate Ember family)
  if (motif === 'ember') {
    if (engDom || stats.speed > 65)    return 'fox'
    if (mathDom || stats.streak > 50)  return 'dragon'
    return 'bear'
  }

  // Stat-based fallback — streak >= 20 on the 0-100 scale = 4 real days
  if (stats.streak >= 20) return pickWeighted(r0, ['dragon','star','crystal'],  [50,30,20])
  if (thaiDom)             return pickWeighted(r1, ['bear','bunny','fluff','flower','puff'], [30,25,20,15,10])
  if (engDom)              return pickWeighted(r1, ['bird','fox','cat','fluff','bunny'],     [30,25,20,15,10])
  if (mathDom)             return pickWeighted(r1, ['crystal','dragon','cat','puff'],        [30,25,25,20])
  // balanced
  return pickWeighted(r2, ['dream','puff','fluff','flower','cat'], [30,20,20,20,10])
}

// ---------------------------------------------------------------------------
// Rarity tier — streak-weighted (0 = Common … 4 = Legendary)
// ---------------------------------------------------------------------------
function computeRarityTier(streak, rand) {
  const s = Math.min(streak, 100) / 100
  if (rand < 0.50 - s * 0.40) return 0  // Common
  if (rand < 0.75 - s * 0.40) return 1  // Uncommon
  if (rand < 0.90 - s * 0.15) return 2  // Rare
  if (rand < 0.98 - s * 0.05) return 3  // Epic
  return 4                               // Legendary
}

// ---------------------------------------------------------------------------
// Signature feature — one memorable trait per creature
// ---------------------------------------------------------------------------
const ALL_SIG_FEATURES = [
  // body (3)
  'mega-cheeks', 'tiny-body', 'extra-round',
  // face (5)
  'two-color-eyes', 'heart-cheek', 'star-freckle', 'big-shine', 'sleepy-droop',
  // ears/head (3)
  'mega-ears', 'twitch-ears', 'moon-mark',
  // tail (3)
  'curly-tail', 'mega-tail', 'twin-tails',
  // accessory/pattern (3)
  'large-bow', 'stripe-face', 'body-glow-spot',
]

// Features that conflict with specific family locked genes
const SIG_CONFLICTS = {
  dragon: ['moon-mark', 'star-freckle'],  // bumpy horns on head; scale pattern
  puff:   ['stripe-face'],                // solid pattern locked
  dream:  ['stripe-face'],                // stars-scatter pattern locked
}

function selectSignatureFeature(r0, r1, r2, family) {
  const conflicts = SIG_CONFLICTS[family] || []
  for (const r of [r0, r1, r2]) {
    const feat = ALL_SIG_FEATURES[Math.floor(r * ALL_SIG_FEATURES.length)]
    if (!conflicts.includes(feat)) return feat
  }
  return 'heart-cheek'  // always safe fallback
}

// ---------------------------------------------------------------------------
// Personality determination
// Stats come from buildEggStats: acc 0-100, streak 0-100 (raw×5)
// ---------------------------------------------------------------------------
function determinePersonality(stats) {
  const thaiDom = stats.thai > 50
  const engDom  = stats.eng  > 50
  const balanced = !thaiDom && !engDom && !(stats.math > 50)
  if (stats.acc >= 80 && stats.streak >= 25)  return 'happy'    // 80% acc + 5-day streak
  if (stats.streak >= 50)                     return 'curious'  // 10-day streak
  if (thaiDom && stats.streak > 25)           return 'brave'
  if (engDom  && stats.speed > 65)            return 'playful'
  if (balanced)                               return 'gentle'
  if ((stats.mins || 0) < 20)                 return 'sleepy'
  return 'shy'
}

// ---------------------------------------------------------------------------
// Voice profile — derived from DNA, no audio playback here
// ---------------------------------------------------------------------------
export function buildVoiceProfile(dna) {
  const PITCH = { tiny: 1.6, chubby: 1.1, lean: 0.95, compact: 0.90, fluffy: 1.0 }
  const VARIANCE = {
    playful: 0.20, curious: 0.15, shy: 0.05, brave: 0.08,
    happy: 0.12, gentle: 0.10, sleepy: 0.10,
  }
  const SOUND = {
    shy: 'peep', playful: 'trill', curious: 'trill',
    brave: 'hum', gentle: 'hum', happy: 'chirp', sleepy: 'chirp',
  }
  const pitchBase     = PITCH[dna.bodyType]     ?? 1.0
  const pitchVariance = VARIANCE[dna.personality] ?? 0.10
  const soundFamily   = (dna.family === 'crystal' || dna.family === 'dragon')
    ? 'squeak'
    : (SOUND[dna.personality] ?? 'chirp')
  const soundSpeed    = 0.7 + (dna.voicePitch ?? 1.0) * 0.3
  return { pitchBase, pitchVariance, soundFamily, soundSpeed }
}

// ---------------------------------------------------------------------------
// Auto-generate creature name from DNA — deterministic (same DNA = same name)
// ---------------------------------------------------------------------------
const FAMILY_NAMES = {
  puff:    ['พัฟฟี่','โมจิ','บับเบิล','นุ่ม','โกลน'],
  bunny:   ['บันนี่','ฮอป','มิมิ','โคโตะ','ขนฟู'],
  cat:     ['มีมี่','นยัน','ซากุระ','ฮานะ','ลูน่า'],
  fox:     ['คิตสึ','ฟ็อกซี่','ออโรร่า','ทาโร่','ซีน่า'],
  bird:    ['ทวีต','สกาย','เฟเธอร์','ซันนี่','ลม'],
  bear:    ['คุมะ','กัมมี่','บรูโน่','โพล่า','มาโล'],
  moon:    ['ลูน่า','เซเลน่า','ไนท์','สตาร์','มิสทิค'],
  star:    ['ทวิงเกิล','โนวา','คอสโม','เซเลสต์','ออโรร่า'],
  leaf:    ['ไอวี่','เฟิร์น','มอส','ซาคุ','กรีน'],
  ocean:   ['มารีน','คอรัล','ไทด์','เวฟ','เพิร์ล'],
  cloud:   ['คัมมูลัส','มิสต์','นิมบัส','เฟลค','ดิว'],
  crystal: ['คริสตัล','เจม','พริซึม','ชาร์ด','ควอทซ์'],
  dragon:  ['เดรค','ไรยู','ซินเดอร์','สเตอร์ม','ฟลาร์'],
  tiger:   ['ไทกะ','สตรีค','แรมเพจ','ซาเบอร์','บลาซ'],
  dream:   ['ดรีมี่','ลูลลา','ซอมนัส','วิชน์','แฟนทาซี'],
  ghost:   ['ไวสเปอร์','ชาด','มิสต์','ฟาดิง','อีเธอร์'],
  ember:   ['เอมเบอร์','ซินเดอร์','แฟลร์','สคอร์ช','อิกนิส'],
}
const STAT_MODIFIERS = {
  hp:  ['แกร่ง','ทน','แข็ง','อึด'],
  atk: ['แรง','เฮี้ยว','ดุ','โหด'],
  spd: ['เร็ว','คล่อง','ว่อง','ไว'],
  def: ['มั่น','โล่','ป้อง','แน่น'],
}

export function generateCreatureName(dna) {
  const family   = dna?.family ?? 'puff'
  const namePool = FAMILY_NAMES[family] ?? FAMILY_NAMES['puff']
  const h        = Math.abs(((dna?.seed ?? 0) + ((dna?.h1 ?? 0) | 0) * 31) | 0)
  const baseName = namePool[h % namePool.length]
  if (h % 10 < 3) {
    const statKey = ['hp','atk','spd','def'][h % 4]
    const mod     = STAT_MODIFIERS[statKey]
    return baseName + mod[(h >> 4) % mod.length]
  }
  return baseName
}

// ---------------------------------------------------------------------------
// Main export — build full Creature DNA from egg stats
// Deterministic: same stats always return the same DNA object.
// ---------------------------------------------------------------------------
export function buildCreatureDNA(stats) {
  // ── 1. Mirror egg hues ──────────────────────────────────────────────────
  const { h1, h2, h3, ha } = computeHues(stats)
  const isNight = (stats.hour ?? 12) >= 20 || (stats.hour ?? 12) < 6
  const stage   = stats.stage ?? 0

  // ── 2. Egg motif ─────────────────────────────────────────────────────────
  const motif = detectEggMotif(h1, ha, isNight, stats.streak ?? 0, stage)

  // ── 3. Creature prng stream (separate from egg stream, same identity root)
  const baseSeed = hash((stats.name ?? '') + (stats.grade ?? 'K'))
    ^ hash('' + (stats.dow ?? 1) + (stats.month ?? 1) + (stats.day ?? 1) + (stats.hour ?? 12))
  const _rng = prng(baseSeed ^ hash('creature'))

  // Pre-draw 64 values — all branching indexes into this pool.
  // Guarantees: same stats → same pool → same DNA.
  const R = Array.from({ length: 64 }, () => _rng())
  let ri = 0
  const next = () => R[ri++]

  // ── 4. Family (always consumes slots 0-2) ─────────────────────────────
  const family = determineFamily(motif, stats, next(), next(), next())

  // ── 5. Rarity tier ───────────────────────────────────────────────────────
  const rarityTier = computeRarityTier(stats.streak ?? 0, next())

  // ── 6. Convenience flags ─────────────────────────────────────────────────
  const thaiDom = (stats.thai ?? 0) > 50
  const engDom  = (stats.eng  ?? 0) > 50

  // ── 7. Body ───────────────────────────────────────────────────────────────
  const btR = next()
  let bodyType
  switch (family) {
    case 'puff':   bodyType = 'chubby'; break
    case 'fluff':  bodyType = 'fluffy'; break
    case 'bear':   bodyType = btR < 0.60 ? 'chubby' : 'compact'; break
    case 'cloud':  bodyType = btR < 0.50 ? 'chubby' : 'fluffy';  break
    case 'bird':   bodyType = btR < 0.60 ? 'chubby' : 'tiny';    break
    case 'dragon': bodyType = btR < 0.50 ? 'compact' : 'chubby'; break
    case 'fox':    bodyType = btR < 0.60 ? 'lean' : 'compact';   break
    case 'bunny':  bodyType = pickFrom(btR, ['chubby','fluffy','tiny']); break
    default:       bodyType = pickFrom(btR, ['chubby','fluffy','compact','lean','tiny'])
  }

  // headRatio
  const hrR = next()
  let headRatio
  if (bodyType === 'tiny')       headRatio = 'oversized'
  else if (bodyType === 'lean')  headRatio = hrR < 0.50 ? 'large' : 'oversized'
  else if (hrR < 0.45)           headRatio = 'normal'
  else if (hrR < 0.72)           headRatio = 'large'
  else                           headRatio = 'oversized'

  // cheekSize — mandatory, never absent
  const ckR = next()
  let cheekSize
  if      (family === 'puff')   cheekSize = 'huge'
  else if (family === 'bunny')  cheekSize = ckR < 0.60 ? 'puffy' : 'huge'
  else if (ckR < 0.15)          cheekSize = 'dot'
  else if (ckR < 0.55)          cheekSize = 'normal'
  else if (ckR < 0.82)          cheekSize = 'puffy'
  else                          cheekSize = 'huge'

  // bellyPatch
  const bellyPatch = next() < 0.60

  // ── 8. Face ───────────────────────────────────────────────────────────────
  // eyeType: two draws so all paths consume same count
  const eyR1 = next(), eyR2 = next()
  let eyeType
  if      (family === 'star')                     eyeType = 'sparkle'
  else if (family === 'moon')                     eyeType = eyR1 < 0.60 ? 'dewy' : 'sparkle'
  else if (family === 'dream')                    eyeType = eyR1 < 0.50 ? 'dewy' : pickFrom(eyR2, ['round','wide','sparkle'])
  else if (family === 'crystal')                  eyeType = eyR1 < 0.50 ? 'sparkle' : 'wide'
  else if (family === 'bunny')                    eyeType = eyR1 < 0.40 ? 'button' : 'round'
  else if (stage >= 5 && eyR1 < 0.65)            eyeType = 'sparkle'  // soft: stars on egg
  else                                            eyeType = pickFrom(eyR2, ['round','crescent','wide','button','dewy'])

  // eyeSize — stat-driven (acc 0-100)
  const esR = next()
  let eyeSize
  if      (stats.acc >= 85)  eyeSize = 'large'
  else if (stats.acc <= 55)  eyeSize = 'small'
  else                       eyeSize = esR < 0.50 ? 'normal' : 'large'

  // blushType
  const blR = next()
  let blushType
  if (['bunny','fluff'].includes(family))  blushType = blR < 0.70 ? 'dot' : 'heart'
  else if (blR < 0.50)                    blushType = 'dot'
  else if (blR < 0.70)                    blushType = 'heart'
  else if (blR < 0.85)                    blushType = 'star'
  else                                    blushType = 'none'  // finalized after personality below

  // mouthType
  const mtR = next()
  let mouthType
  if      (['bear','bunny','flower'].includes(family))  mouthType = mtR < 0.70 ? 'smile' : 'open-happy'
  else if (['fox','dragon'].includes(family))           mouthType = mtR < 0.60 ? 'grin'  : 'smile'
  else if (bodyType === 'tiny')                         mouthType = mtR < 0.60 ? 'tiny'  : 'smile'
  else                                                  mouthType = pickFrom(mtR, ['smile','open-happy','grin','tiny'])

  // ── 9. External features ─────────────────────────────────────────────────
  // earType
  const earR = next()
  let earType
  switch (family) {
    case 'bear':   earType = 'round';   break
    case 'cat':    earType = 'cat';     break
    case 'fox':    earType = 'pointed'; break
    case 'bunny':  earType = 'floppy';  break
    case 'leaf':   earType = 'leaf';    break
    case 'ocean':  earType = 'fin';     break
    case 'dragon': earType = earR < 0.60 ? 'fin' : 'cat'; break
    default:       earType = pickFrom(earR, ['none','round','cat','floppy','pointed','fin','leaf'])
  }

  // hornType
  const hoR = next()
  let hornType
  if      (['moon','crystal'].includes(family))              hornType = 'spiral'
  else if (family === 'dragon')                              hornType = 'bumps'
  else if (family === 'star')                                hornType = hoR < 0.60 ? 'star' : 'none'
  else if (['bunny','bear','puff','cloud'].includes(family)) hornType = 'none'
  else if (hoR < 0.45)                                       hornType = 'none'
  else if (hoR < 0.65)                                       hornType = 'stubby'
  else if (hoR < 0.80)                                       hornType = 'spiral'
  else if (hoR < 0.92)                                       hornType = 'star'
  else                                                       hornType = 'bumps'

  // wingType — 2 draws always
  const wt1 = next(), wt2 = next()
  let wingType
  if      (family === 'cloud')   wingType = 'flutter'
  else if (family === 'bird')    wingType = wt1 < 0.70 ? 'bird' : 'fairy'
  else if (family === 'ocean')   wingType = 'none'
  else {
    const prob = (engDom || (stats.speed ?? 50) > 70) ? 0.50 : 0.30
    wingType = wt1 < prob
      ? pickFrom(wt2, ['fairy','bird','leaf','heart','flutter'])
      : 'none'
  }

  // tailType
  const tlR = next()
  let tailType
  if      (family === 'star')                    tailType = 'star-tipped'
  else if (['fox','fluff'].includes(family))     tailType = 'fluffy-pom'
  else if (family === 'ocean')                   tailType = tlR < 0.70 ? 'long-swish' : 'wiggly'
  else if (family === 'leaf')                    tailType = tlR < 0.40 ? 'leaf-tipped' : (tlR < 0.70 ? 'wiggly' : 'long-swish')
  else if (tlR < 0.25)                           tailType = 'none'
  else if (tlR < 0.45)                           tailType = 'wiggly'
  else if (tlR < 0.62)                           tailType = 'fluffy-pom'
  else if (tlR < 0.76)                           tailType = 'star-tipped'
  else if (tlR < 0.90)                           tailType = 'long-swish'
  else                                           tailType = 'leaf-tipped'

  // patternType + h2 ugly-zone correction — 2 draws always
  const pt1 = next(), pt2 = next()
  let patternType
  if      (family === 'puff')                              patternType = 'solid'
  else if (['dragon','ocean','crystal'].includes(family))  patternType = 'stripes'
  else if (family === 'dream')                             patternType = 'stars-scatter'
  else {
    // Soft continuity: dots on egg (stage≥1) → spots/freckles 70%
    //                  high eng XP → stripes 60%
    const hasDots  = stage >= 1
    const hasLines = (stats.eng ?? 0) > 40
    if      (hasDots  && pt1 < 0.70) patternType = pt2 < 0.50 ? 'spots' : 'freckles'
    else if (hasLines && pt2 < 0.60) patternType = 'stripes'
    else                             patternType = pickFrom(pt1, ['solid','spots','belly','freckles'])
  }

  // h2 ugly-zone: shift if 16-29° away from h1
  const rawDiff = ((h2 - h1) % 360 + 360) % 360
  const hDiff   = Math.min(rawDiff, 360 - rawDiff)
  const h2final = (hDiff >= 16 && hDiff <= 29) ? (h2 + 30) % 360 : h2

  // ── 10. Accessory — 2 draws always ──────────────────────────────────────
  const ac1 = next(), ac2 = next()
  let accessory
  if (stage < 5) {
    accessory = 'none'
  } else if (family === 'flower') {
    accessory = ac1 < 0.90 ? 'flower-crown' : 'none'
  } else if (ac1 < 0.40) {
    accessory = 'none'
  } else {
    accessory = pickFrom(ac2, ['bow','flower-crown','scarf','glasses','heart-mark','bandana','tiny-hat'])
  }

  // ── 11. Glow tier ────────────────────────────────────────────────────────
  // Family minimums: moon/dream/star/crystal always ≥ uncommon
  const glR = next()
  let glowTier = rarityTier
  if (['moon','dream','star','crystal'].includes(family)) glowTier = Math.max(1, glowTier)
  // Soft: outer glow visible on egg (stage≥2) → glow ≥ 1 with 75% probability
  if (stage >= 2 && glowTier === 0 && glR < 0.75) glowTier = 1

  // ── 12. Art direction constraints ────────────────────────────────────────
  const adR = next()
  // Horn requires readable eyes (sparkle / wide / dewy)
  if (hornType !== 'none' && !['sparkle','wide','dewy'].includes(eyeType)) {
    eyeType = adR < 0.50 ? 'sparkle' : 'wide'
  }
  // Tiny body needs at least normal-sized eyes
  if (bodyType === 'tiny' && eyeSize === 'small') eyeSize = 'normal'

  // ── 13. Signature feature — 3 draws ──────────────────────────────────────
  const signatureFeature = selectSignatureFeature(next(), next(), next(), family)

  // ── 14. Personality ───────────────────────────────────────────────────────
  const personality = determinePersonality(stats)

  // Finalize blush: 'none' only valid for compact+brave
  if (blushType === 'none' && !(bodyType === 'compact' && personality === 'brave')) {
    blushType = 'dot'
  }

  // ── 15. Voice metadata ───────────────────────────────────────────────────
  const PITCH = { tiny: 1.6, chubby: 1.1, lean: 0.95, compact: 0.90, fluffy: 1.0 }
  const SOUND_MAP = {
    shy: 'peep', playful: 'trill', curious: 'trill',
    brave: 'hum', gentle: 'hum', happy: 'chirp', sleepy: 'chirp',
  }
  const voicePitch  = PITCH[bodyType] ?? 1.0
  const voiceFamily = (['crystal','dragon'].includes(family))
    ? 'squeak'
    : (SOUND_MAP[personality] ?? 'chirp')

  // ── Return full DNA ───────────────────────────────────────────────────────
  return {
    // Identity
    family,
    motif:    motif ?? 'none',
    // Body architecture
    bodyType,
    headRatio,
    cheekSize,
    bellyPatch,
    // Face
    eyeType,
    eyeSize,
    eyeColor:  h3,      // hue value; renderer applies saturation/lightness
    blushType,
    mouthType,
    // External features
    earType,
    hornType,
    wingType,
    tailType,
    patternType,
    // Accessory
    accessory,
    // Effects
    glowTier,
    rarityTier,
    // Signature
    signatureFeature,
    // Personality
    personality,
    // Hues — mirrored from egg for visual continuity
    h1, h2: h2final, h3, ha,
    isNight,
    stage,
    // Voice
    voicePitch,
    voiceFamily,
    // Beauty layer metadata — used by drawCreature (Phase 2)
    birthMark:    stage >= 7,
    birthMarkHue: ha,
    beautyProfile: {
      outlineWeight:    2.0 + Math.min(glowTier * 0.25, 0.5),
      gradientStrength: 0.3 + (stage / 8) * 0.5,
      eyeGloss:         ['dewy','sparkle'].includes(eyeType) ? 2 : 1,
      cheekGlow:        cheekSize === 'huge' ? 0.8 : cheekSize === 'puffy' ? 0.6 : cheekSize === 'normal' ? 0.45 : 0.3,
      featureDensity:   stage <= 2 ? 0 : stage <= 4 ? 1 : stage <= 6 ? 2 : 3,
    },
  }
}

// ---------------------------------------------------------------------------
// Legacy preview DNA — deterministic canvas rendering for pre-Phase-2 creatures.
// NEVER persisted. NEVER mutates egg data. Read-only UI preview only.
// Same (egg, index) pair always returns the same DNA object.
// ---------------------------------------------------------------------------
export function buildLegacyPreviewDNA(egg, index) {
  // Primary path: eggStats is stored on virtually every legacy egg at hatch time.
  // This gives the exact DNA that would have been generated if Phase 2 had existed then.
  if (egg.eggStats && typeof egg.eggStats === 'object') {
    try { return buildCreatureDNA(egg.eggStats) } catch (_) {}
  }

  // Fallback: synthesise from legacy creature fields (covers very old eggs without eggStats)
  const c      = egg.creature || {}
  const emoji  = c.e  || ''
  const rarity = c.rarity || 'common'
  const cat    = c.cat    || 'thai'

  const seedVal = hash((c.n || '') + emoji + rarity + String(index))
  const _r      = prng(seedVal)
  const r       = [_r(), _r(), _r(), _r()]

  // Subject dominance → drives family selection inside buildCreatureDNA
  const sub = { thai: 22, eng: 22, math: 22 }
  if      (cat === 'thai')   sub.thai = 68
  else if (cat === 'eng')    sub.eng  = 68
  else if (cat === 'math')   sub.math = 68
  else /* hybrid */        { sub.thai = 48; sub.eng = 48; sub.math = 48 }

  // Emoji nudges — push toward thematically correct family
  const NUDGE = {
    '🐉':   { math: 70, streak: 82 },   // dragon → streak path → dragon family
    '🦊':   { eng: 72, speed: 78 },      // fox → eng+speed → fox family
    '🦄':   { math: 72 },                // unicorn → crystal/star
    '🤖':   { math: 74 },                // robot → crystal
    '💎':   { math: 74 },                // gem → crystal
    '⚡':  { math: 70, streak: 82 },    // lightning → star (streak)
    '🦅':   { eng: 72, speed: 72 },      // garuda/eagle → bird
    '🌈🦄':{ streak: 90 },               // rainbow unicorn → legendary star
    '☀️🦁':{ thai: 72, streak: 70 },     // sun lion → brave dragon/bear
  }
  const nudge = NUDGE[emoji] || {}

  const RARITY_STREAK = { common: 5, uncommon: 18, rare: 35, epic: 55, legendary: 85 }

  return buildCreatureDNA({
    name:   c.n || 'Legacy',
    grade:  egg.grade  || 'K',
    dow:    1  + Math.floor(r[0] * 7),
    month:  1  + Math.floor(r[1] * 12),
    day:    1  + Math.floor(r[2] * 28),
    hour:   8  + Math.floor(r[3] * 10),   // 8–18 (daytime)
    thai:   nudge.thai   ?? sub.thai,
    eng:    nudge.eng    ?? sub.eng,
    math:   nudge.math   ?? sub.math,
    streak: nudge.streak ?? (RARITY_STREAK[rarity] ?? 5),
    acc:    70 + Math.floor(r[0] * 25),
    mins:   20 + Math.floor(r[1] * 30),
    speed:  nudge.speed  ?? (40 + Math.floor(r[2] * 40)),
    stage:  4  + Math.floor(r[3] * 4),    // stage 4–7 (mature-looking)
  })
}

// ---------------------------------------------------------------------------
// Dev verification — call from browser console: import then verifyCreatureGen()
// or paste the body into DevTools after the module loads.
// ---------------------------------------------------------------------------
export function verifyCreatureGen() {
  // Same stats → same DNA
  const base = {
    name:'TestChild', grade:'K', dow:2, month:6, day:10, hour:14,
    thai:40, eng:35, math:25, streak:35, acc:75, speed:60, mins:30, stage:6,
  }
  const a = buildCreatureDNA(base)
  const b = buildCreatureDNA({ ...base })
  const deterministic = JSON.stringify(a) === JSON.stringify(b)

  // Night egg → moon family
  const night = buildCreatureDNA({ ...base, hour: 2 })

  // Star conditions (golden ha + streak≥14 + stage≥5)
  const starStats = { ...base, hour:15, streak:80, stage:7, math:70, thai:15, eng:15, dow:5 }
  // ha = (hourTone + speed*0.3) % 360 where hourTone=45, speed=60 → ha=63 (not in star range)
  // Force by using dow=5 (dowHue=45), math dominant for purple h1, not star motif by design
  const star = buildCreatureDNA(starStats)

  // Leaf: h1 in 80-160 → thai dominant day egg
  const leaf = buildCreatureDNA({ ...base, hour:10, thai:70, eng:15, math:15, dow:1 })

  const required = ['family','bodyType','headRatio','cheekSize','bellyPatch',
    'eyeType','eyeSize','eyeColor','blushType','mouthType',
    'earType','hornType','wingType','tailType','patternType',
    'accessory','glowTier','rarityTier','signatureFeature','personality',
    'h1','h2','h3','ha','isNight','stage','voicePitch','voiceFamily',
    'birthMark','birthMarkHue','beautyProfile']
  const missingFields = required.filter(f => !(f in a))

  // Spot-check constraints
  const noNullCheeks   = a.cheekSize !== 'none'
  const hornEyeOk      = a.hornType === 'none' || ['sparkle','wide','dewy'].includes(a.eyeType)
  const blushOk        = a.blushType !== 'none' || (a.bodyType === 'compact' && a.personality === 'brave')
  const nightIsMoon    = night.family === 'moon'

  console.group('[CreatureGen] Verification')
  console.log('Deterministic:         ', deterministic ? '✓ PASS' : '✗ FAIL')
  console.log('Missing fields:        ', missingFields.length === 0 ? '✓ none' : '✗ ' + missingFields.join(','))
  console.log('Cheeks mandatory:      ', noNullCheeks ? '✓' : '✗')
  console.log('Horn→eye constraint:   ', hornEyeOk ? '✓' : '✗')
  console.log('Blush constraint:      ', blushOk ? '✓' : '✗')
  console.log('Night → moon family:   ', nightIsMoon ? '✓' : '✗ got ' + night.family)
  console.log('Sample DNA:            ', a)
  console.log('Night DNA:             ', { family: night.family, motif: night.motif, bodyType: night.bodyType })
  console.log('Leaf DNA:              ', { family: leaf.family, motif: leaf.motif, h1: leaf.h1.toFixed(1) })
  console.log('Star candidate:        ', { family: star.family, motif: star.motif })
  console.groupEnd()

  return { deterministic, missingFields, base: a, night, leaf }
}
