// wordPools.js — content pools for curriculum question generation (Phase 1.1)
// Prepared by Claude Chatbot. Reviewed for K2-P6 Thai classroom levels.
// Format notes:
//  - emoji = picture hint for visual/choice questions (kids can't read yet at early nodes)
//  - Thai entries: { w: word, emoji, meaningEn } | consonants: { c, name, emoji, exampleWord }
//  - distractor generation: pull from same pool (near confusion) + adjacent pool (far)

export const TH_CONSONANTS_1 = [ // ก-ณ (node th_consonants_1)
  { c: 'ก', name: 'กอ ไก่',    emoji: '🐔', exampleWord: 'ไก่' },
  { c: 'ข', name: 'ขอ ไข่',    emoji: '🥚', exampleWord: 'ไข่' },
  { c: 'ฃ', name: 'ฃอ ขวด',   emoji: '🍾', exampleWord: 'ขวด', rare: true },
  { c: 'ค', name: 'คอ ควาย',  emoji: '🐃', exampleWord: 'ควาย' },
  { c: 'ฅ', name: 'ฅอ คน',    emoji: '🧍', exampleWord: 'คน', rare: true },
  { c: 'ฆ', name: 'ฆอ ระฆัง', emoji: '🔔', exampleWord: 'ระฆัง' },
  { c: 'ง', name: 'งอ งู',     emoji: '🐍', exampleWord: 'งู' },
  { c: 'จ', name: 'จอ จาน',   emoji: '🍽️', exampleWord: 'จาน' },
  { c: 'ฉ', name: 'ฉอ ฉิ่ง',   emoji: '🥁', exampleWord: 'ฉิ่ง' },
  { c: 'ช', name: 'ชอ ช้าง',  emoji: '🐘', exampleWord: 'ช้าง' },
  { c: 'ซ', name: 'ซอ โซ่',   emoji: '⛓️', exampleWord: 'โซ่' },
  { c: 'ฌ', name: 'ฌอ เฌอ',  emoji: '🌳', exampleWord: 'ต้นเฌอ', rare: true },
  { c: 'ญ', name: 'ญอ หญิง', emoji: '👧', exampleWord: 'ผู้หญิง' },
  { c: 'ฎ', name: 'ฎอ ชฎา',  emoji: '👑', exampleWord: 'ชฎา', rare: true },
  { c: 'ฏ', name: 'ฏอ ปฏัก', emoji: '🔱', exampleWord: 'ปฏัก', rare: true },
  { c: 'ฐ', name: 'ฐอ ฐาน',  emoji: '🏛️', exampleWord: 'ฐาน', rare: true },
  { c: 'ฑ', name: 'ฑอ มณโฑ', emoji: '👸', exampleWord: 'มณโฑ', rare: true },
  { c: 'ฒ', name: 'ฒอ ผู้เฒ่า',emoji: '👴', exampleWord: 'ผู้เฒ่า', rare: true },
  { c: 'ณ', name: 'ณอ เณร',  emoji: '🧑‍🦲', exampleWord: 'เณร' },
]

export const TH_CONSONANTS_2 = [ // ด-ฮ (node th_consonants_2)
  { c: 'ด', name: 'ดอ เด็ก',   emoji: '🧒', exampleWord: 'เด็ก' },
  { c: 'ต', name: 'ตอ เต่า',   emoji: '🐢', exampleWord: 'เต่า' },
  { c: 'ถ', name: 'ถอ ถุง',    emoji: '🛍️', exampleWord: 'ถุง' },
  { c: 'ท', name: 'ทอ ทหาร',  emoji: '💂', exampleWord: 'ทหาร' },
  { c: 'ธ', name: 'ธอ ธง',    emoji: '🚩', exampleWord: 'ธง' },
  { c: 'น', name: 'นอ หนู',    emoji: '🐭', exampleWord: 'หนู' },
  { c: 'บ', name: 'บอ ใบไม้',  emoji: '🍃', exampleWord: 'ใบไม้' },
  { c: 'ป', name: 'ปอ ปลา',   emoji: '🐟', exampleWord: 'ปลา' },
  { c: 'ผ', name: 'ผอ ผึ้ง',    emoji: '🐝', exampleWord: 'ผึ้ง' },
  { c: 'ฝ', name: 'ฝอ ฝา',    emoji: '🫙', exampleWord: 'ฝา' },
  { c: 'พ', name: 'พอ พาน',   emoji: '🏆', exampleWord: 'พาน' },
  { c: 'ฟ', name: 'ฟอ ฟัน',    emoji: '🦷', exampleWord: 'ฟัน' },
  { c: 'ภ', name: 'ภอ สำเภา', emoji: '⛵', exampleWord: 'สำเภา' },
  { c: 'ม', name: 'มอ ม้า',    emoji: '🐴', exampleWord: 'ม้า' },
  { c: 'ย', name: 'ยอ ยักษ์',  emoji: '👹', exampleWord: 'ยักษ์' },
  { c: 'ร', name: 'รอ เรือ',   emoji: '🚣', exampleWord: 'เรือ' },
  { c: 'ล', name: 'ลอ ลิง',    emoji: '🐒', exampleWord: 'ลิง' },
  { c: 'ว', name: 'วอ แหวน',  emoji: '💍', exampleWord: 'แหวน' },
  { c: 'ศ', name: 'ศอ ศาลา',  emoji: '🛖', exampleWord: 'ศาลา' },
  { c: 'ษ', name: 'ษอ ฤๅษี',   emoji: '🧙', exampleWord: 'ฤๅษี' },
  { c: 'ส', name: 'สอ เสือ',   emoji: '🐯', exampleWord: 'เสือ' },
  { c: 'ห', name: 'หอ หีบ',    emoji: '🧰', exampleWord: 'หีบ' },
  { c: 'ฬ', name: 'ฬอ จุฬา',  emoji: '🪁', exampleWord: 'ว่าวจุฬา', rare: true },
  { c: 'อ', name: 'ออ อ่าง',   emoji: '🛁', exampleWord: 'อ่าง' },
  { c: 'ฮ', name: 'ฮอ นกฮูก', emoji: '🦉', exampleWord: 'นกฮูก' },
]

// Confusable consonant pairs — use as smart distractors (visual discrimination node)
export const TH_CONFUSABLE_PAIRS = [
  ['ก','ถ'], ['ข','ช'], ['ค','ด'], ['ผ','พ'], ['ฝ','ฟ'], ['บ','ป'],
  ['ด','ต'], ['ท','ห'], ['ม','น'], ['ภ','ถ'], ['ส','ล'], ['อ','ฮ'],
]

export const TH_VOWELS_SHORT = [ // node th_vowels_short — form: replace ○ with consonant
  { v: '-ะ',  name: 'สระอะ',  example: 'กะ',  emoji: '🥥', exampleWord: 'กะทิ' },
  { v: '-ิ',   name: 'สระอิ',   example: 'มิ',   emoji: '🎀', exampleWord: 'ริบบิ้น' },
  { v: '-ึ',   name: 'สระอึ',   example: 'หนึ',  emoji: '1️⃣', exampleWord: 'หนึ่ง' },
  { v: '-ุ',   name: 'สระอุ',   example: 'กุ',   emoji: '🦐', exampleWord: 'กุ้ง' },
  { v: 'เ-ะ', name: 'สระเอะ', example: 'เตะ', emoji: '⚽', exampleWord: 'เตะบอล' },
  { v: 'แ-ะ', name: 'สระแอะ', example: 'แกะ', emoji: '🐑', exampleWord: 'แกะ' },
  { v: 'โ-ะ', name: 'สระโอะ', example: 'โต๊ะ', emoji: '🪑', exampleWord: 'โต๊ะ' },
  { v: 'เ-าะ',name: 'สระเอาะ',example: 'เกาะ',emoji: '🏝️', exampleWord: 'เกาะ' },
]

export const TH_VOWELS_LONG = [ // node th_vowels_long
  { v: '-า',  name: 'สระอา',  example: 'มา',  emoji: '🐎', exampleWord: 'ม้ามา' },
  { v: '-ี',   name: 'สระอี',   example: 'มี',   emoji: '🤲', exampleWord: 'มี' },
  { v: '-ือ',  name: 'สระอือ',  example: 'มือ',  emoji: '✋', exampleWord: 'มือ' },
  { v: '-ู',   name: 'สระอู',   example: 'ปู',   emoji: '🦀', exampleWord: 'ปู' },
  { v: 'เ-',  name: 'สระเอ',  example: 'เท',  emoji: '🫗', exampleWord: 'เทน้ำ' },
  { v: 'แ-',  name: 'สระแอ',  example: 'แม่',  emoji: '👩', exampleWord: 'แม่' },
  { v: 'โ-',  name: 'สระโอ',  example: 'โบ',  emoji: '🎀', exampleWord: 'โบว์' },
  { v: '-อ',  name: 'สระออ',  example: 'ขอ',  emoji: '🙏', exampleWord: 'ขอ' },
  { v: 'เ-ีย', name: 'สระเอีย', example: 'เสีย', emoji: '😢', exampleWord: 'เสียใจ' },
  { v: 'เ-ือ', name: 'สระเอือ', example: 'เรือ', emoji: '🚣', exampleWord: 'เรือ' },
  { v: '-ัว',  name: 'สระอัว',  example: 'วัว',  emoji: '🐄', exampleWord: 'วัว' },
]

export const TH_CVC_WORDS = [ // node th_cvc_words — แม่ ก กา + สะกดตรง ป.1
  { w: 'กา', emoji: '🐦‍⬛' }, { w: 'ตา', emoji: '👁️' }, { w: 'ปู', emoji: '🦀' },
  { w: 'งู', emoji: '🐍' }, { w: 'มือ', emoji: '✋' }, { w: 'หู', emoji: '👂' },
  { w: 'ขา', emoji: '🦵' }, { w: 'ปลา', emoji: '🐟' }, { w: 'นก', emoji: '🐦' },
  { w: 'รถ', emoji: '🚗' }, { w: 'บ้าน', emoji: '🏠' }, { w: 'แมว', emoji: '🐱' },
  { w: 'หมา', emoji: '🐶' }, { w: 'ไก่', emoji: '🐔' }, { w: 'ไข่', emoji: '🥚' },
  { w: 'ขนม', emoji: '🍬' }, { w: 'นม', emoji: '🥛' }, { w: 'น้ำ', emoji: '💧' },
  { w: 'ดาว', emoji: '⭐' }, { w: 'เรือ', emoji: '🚣' }, { w: 'ม้า', emoji: '🐴' },
  { w: 'เสือ', emoji: '🐯' }, { w: 'มด', emoji: '🐜' }, { w: 'ผีเสื้อ', emoji: '🦋' },
]

export const TH_TONE_SETS = [ // node th_tones — same syllable across tones, pick the one matching audio/picture
  { base: 'มา', set: ['มา','ม่า','ม้า'], answers: { 'ม้า': '🐴' } },
  { base: 'ปา', set: ['ปา','ป่า','ป้า'], answers: { 'ป่า': '🌲', 'ป้า': '👩‍🦳' } },
  { base: 'ขาว', set: ['ขาว','ข่าว','ข้าว'], answers: { 'ขาว': '⬜', 'ข้าว': '🍚' } },
  { base: 'เสือ', set: ['เสือ','เสื่อ','เสื้อ'], answers: { 'เสือ': '🐯', 'เสื้อ': '👕' } },
  { base: 'นา', set: ['นา','น่า','น้า'], answers: { 'นา': '🌾' } },
  { base: 'ไม', set: ['ไม','ไม่','ไม้'], answers: { 'ไม้': '🪵' } },
]

export const TH_COMMON_WORDS = [ // node th_common_words — ป.2 sight vocabulary
  { w: 'โรงเรียน', emoji: '🏫' }, { w: 'ครู', emoji: '👩‍🏫' }, { w: 'เพื่อน', emoji: '🧑‍🤝‍🧑' },
  { w: 'หนังสือ', emoji: '📖' }, { w: 'ดินสอ', emoji: '✏️' }, { w: 'กระเป๋า', emoji: '🎒' },
  { w: 'อาหาร', emoji: '🍛' }, { w: 'ผลไม้', emoji: '🍎' }, { w: 'ต้นไม้', emoji: '🌳' },
  { w: 'ดอกไม้', emoji: '🌸' }, { w: 'ครอบครัว', emoji: '👨‍👩‍👧' }, { w: 'พ่อ', emoji: '👨' },
  { w: 'แม่', emoji: '👩' }, { w: 'พี่', emoji: '🧒' }, { w: 'น้อง', emoji: '👶' },
  { w: 'เล่น', emoji: '⚽' }, { w: 'วิ่ง', emoji: '🏃' }, { w: 'นอน', emoji: '😴' },
  { w: 'กิน', emoji: '😋' }, { w: 'อ่าน', emoji: '👀' }, { w: 'เขียน', emoji: '✍️' },
  { w: 'สนุก', emoji: '😄' }, { w: 'สวย', emoji: '✨' }, { w: 'ใหญ่', emoji: '🐘' }, { w: 'เล็ก', emoji: '🐜' },
]

export const TH_SENTENCES = [ // node th_sentences_read — arrange/complete, ป.2
  { s: 'แมว กิน ปลา', emoji: '🐱🐟' }, { s: 'หนู อ่าน หนังสือ', emoji: '🧒📖' },
  { s: 'พ่อ ขับ รถ', emoji: '👨🚗' }, { s: 'แม่ ทำ อาหาร', emoji: '👩🍳' },
  { s: 'นก บิน บน ฟ้า', emoji: '🐦☁️' }, { s: 'ปลา ว่าย ใน น้ำ', emoji: '🐟💧' },
  { s: 'ฉัน ชอบ ผลไม้', emoji: '😋🍎' }, { s: 'เด็ก เล่น บอล', emoji: '🧒⚽' },
  { s: 'ครู สอน นักเรียน', emoji: '👩‍🏫🏫' }, { s: 'หมา วิ่ง เร็ว', emoji: '🐶💨' },
  { s: 'ดาว อยู่ บน ฟ้า', emoji: '⭐🌙' }, { s: 'น้อง ดื่ม นม', emoji: '👶🥛' },
]

export const TH_PASSAGES = [ // nodes th_reading_comprehension_1-3 (grade field selects)
  { grade: 'P3', text: 'แมวของฉันชื่อสีขาว มันชอบนอนบนเก้าอี้ ทุกเช้ามันจะมาปลุกฉัน',
    q: 'แมวชื่ออะไร', choices: ['สีขาว','สีดำ','เก้าอี้','ตอนเช้า'], a: 'สีขาว' },
  { grade: 'P3', text: 'วันนี้ฝนตกหนัก น้องไม่ได้ไปเล่นที่สนาม น้องจึงวาดรูปอยู่ในบ้าน',
    q: 'ทำไมน้องไม่ได้ไปเล่นที่สนาม', choices: ['ฝนตก','ง่วงนอน','ไม่มีเพื่อน','ทำการบ้าน'], a: 'ฝนตก' },
  { grade: 'P3', text: 'ต้นกล้วยหลังบ้านออกผลแล้ว แม่ตัดมาหนึ่งหวี แจกเพื่อนบ้านสองลูก',
    q: 'แม่แจกเพื่อนบ้านกี่ลูก', choices: ['สองลูก','หนึ่งหวี','สามลูก','ทั้งหมด'], a: 'สองลูก' },
  { grade: 'P4', text: 'ทุกวันเสาร์ ครอบครัวของต้นจะไปตลาดเช้า ต้นชอบไปดูปลาที่แผงของลุงมาก ลุงใจดีมักแถมปลาตัวเล็กให้เสมอ',
    q: 'ต้นชอบไปดูอะไรที่ตลาด', choices: ['ปลา','ผัก','ขนม','ไก่'], a: 'ปลา' },
  { grade: 'P4', text: 'มดทำงานขยันมาก พวกมันช่วยกันขนอาหารกลับรัง ถึงตัวจะเล็กแต่มดยกของหนักกว่าตัวเองได้หลายเท่า',
    q: 'ข้อใดตรงกับเรื่องที่อ่าน', choices: ['มดขยันและแข็งแรง','มดตัวใหญ่','มดชอบนอน','มดอยู่ตัวเดียว'], a: 'มดขยันและแข็งแรง' },
  { grade: 'P5', text: 'การออมเงินเป็นนิสัยที่ดี หากเราหยอดกระปุกวันละบาท หนึ่งปีจะมีเงินสามร้อยหกสิบห้าบาท เงินก้อนนี้นำไปซื้อของที่จำเป็นหรือเก็บไว้ใช้ยามฉุกเฉินได้',
    q: 'ใจความสำคัญของเรื่องคือข้อใด', choices: ['การออมเงินมีประโยชน์','กระปุกมีหลายแบบ','ของเล่นราคาแพง','หนึ่งปีมี 365 วัน'], a: 'การออมเงินมีประโยชน์' },
  { grade: 'P6', text: 'ป่าชายเลนเป็นบ้านของสัตว์น้ำวัยอ่อนมากมาย รากไม้ที่หนาแน่นช่วยกันคลื่นและเป็นที่หลบภัย หากป่าชายเลนถูกทำลาย สัตว์น้ำจะลดลงและชายฝั่งจะพังง่ายขึ้น',
    q: 'หากป่าชายเลนถูกทำลายจะเกิดอะไรขึ้น', choices: ['สัตว์น้ำลดลงและชายฝั่งพัง','มีปลามากขึ้น','น้ำทะเลใสขึ้น','คลื่นเบาลง'], a: 'สัตว์น้ำลดลงและชายฝั่งพัง' },
]

// ===================== ENGLISH =====================

export const ENG_CVC = [ // node eng_phonics_cvc — with emoji for picture-match
  { w: 'cat', emoji: '🐱' }, { w: 'dog', emoji: '🐶' }, { w: 'sun', emoji: '☀️' },
  { w: 'bed', emoji: '🛏️' }, { w: 'cup', emoji: '🥤' }, { w: 'hat', emoji: '🎩' },
  { w: 'pig', emoji: '🐷' }, { w: 'bus', emoji: '🚌' }, { w: 'box', emoji: '📦' },
  { w: 'hen', emoji: '🐔' }, { w: 'pen', emoji: '🖊️' }, { w: 'map', emoji: '🗺️' },
  { w: 'net', emoji: '🥅' }, { w: 'fox', emoji: '🦊' }, { w: 'leg', emoji: '🦵' },
  { w: 'bug', emoji: '🐛' }, { w: 'jam', emoji: '🍓' }, { w: 'web', emoji: '🕸️' },
  { w: 'bat', emoji: '🦇' }, { w: 'rat', emoji: '🐀' }, { w: 'pot', emoji: '🍲' },
  { w: 'log', emoji: '🪵' }, { w: 'mud', emoji: '💩' }, { w: 'zip', emoji: '🤐' },
]

export const ENG_SIGHT_1 = [ // node eng_sight_words_1 — Dolch pre-primer core
  'a','and','the','I','see','go','my','you','it','is','in','can','me','we','to','up','look','red','blue','big'
]
export const ENG_SIGHT_2 = [ // node eng_sight_words_2 — primer/first
  'he','she','they','was','are','have','like','this','what','with','play','said','good','come','went','saw','little','make','here','want'
]

export const ENG_VOCAB = {
  animals: [ // node eng_vocab_animals
    { w: 'cat', th: 'แมว', emoji: '🐱' }, { w: 'dog', th: 'หมา', emoji: '🐶' },
    { w: 'bird', th: 'นก', emoji: '🐦' }, { w: 'fish', th: 'ปลา', emoji: '🐟' },
    { w: 'elephant', th: 'ช้าง', emoji: '🐘' }, { w: 'tiger', th: 'เสือ', emoji: '🐯' },
    { w: 'monkey', th: 'ลิง', emoji: '🐒' }, { w: 'rabbit', th: 'กระต่าย', emoji: '🐰' },
    { w: 'snake', th: 'งู', emoji: '🐍' }, { w: 'horse', th: 'ม้า', emoji: '🐴' },
    { w: 'duck', th: 'เป็ด', emoji: '🦆' }, { w: 'frog', th: 'กบ', emoji: '🐸' },
    { w: 'bear', th: 'หมี', emoji: '🐻' }, { w: 'lion', th: 'สิงโต', emoji: '🦁' },
    { w: 'turtle', th: 'เต่า', emoji: '🐢' }, { w: 'bee', th: 'ผึ้ง', emoji: '🐝' },
  ],
  food: [ // node eng_vocab_food
    { w: 'rice', th: 'ข้าว', emoji: '🍚' }, { w: 'egg', th: 'ไข่', emoji: '🥚' },
    { w: 'milk', th: 'นม', emoji: '🥛' }, { w: 'water', th: 'น้ำ', emoji: '💧' },
    { w: 'apple', th: 'แอปเปิล', emoji: '🍎' }, { w: 'banana', th: 'กล้วย', emoji: '🍌' },
    { w: 'mango', th: 'มะม่วง', emoji: '🥭' }, { w: 'bread', th: 'ขนมปัง', emoji: '🍞' },
    { w: 'chicken', th: 'ไก่', emoji: '🍗' }, { w: 'fish', th: 'ปลา', emoji: '🐟' },
    { w: 'noodles', th: 'ก๋วยเตี๋ยว', emoji: '🍜' }, { w: 'ice cream', th: 'ไอศกรีม', emoji: '🍦' },
    { w: 'cake', th: 'เค้ก', emoji: '🍰' }, { w: 'orange', th: 'ส้ม', emoji: '🍊' },
    { w: 'watermelon', th: 'แตงโม', emoji: '🍉' }, { w: 'cookie', th: 'คุกกี้', emoji: '🍪' },
  ],
  family: [ // node eng_vocab_family
    { w: 'father', th: 'พ่อ', emoji: '👨' }, { w: 'mother', th: 'แม่', emoji: '👩' },
    { w: 'brother', th: 'พี่ชาย/น้องชาย', emoji: '👦' }, { w: 'sister', th: 'พี่สาว/น้องสาว', emoji: '👧' },
    { w: 'baby', th: 'เด็กทารก', emoji: '👶' }, { w: 'grandfather', th: 'ปู่/ตา', emoji: '👴' },
    { w: 'grandmother', th: 'ย่า/ยาย', emoji: '👵' }, { w: 'family', th: 'ครอบครัว', emoji: '👨‍👩‍👧' },
    { w: 'aunt', th: 'ป้า/น้า/อา', emoji: '👩‍🦰' }, { w: 'uncle', th: 'ลุง/น้า/อา', emoji: '👨‍🦱' },
  ],
  school: [ // node eng_vocab_school
    { w: 'school', th: 'โรงเรียน', emoji: '🏫' }, { w: 'teacher', th: 'ครู', emoji: '👩‍🏫' },
    { w: 'friend', th: 'เพื่อน', emoji: '🧑‍🤝‍🧑' }, { w: 'book', th: 'หนังสือ', emoji: '📖' },
    { w: 'pencil', th: 'ดินสอ', emoji: '✏️' }, { w: 'bag', th: 'กระเป๋า', emoji: '🎒' },
    { w: 'desk', th: 'โต๊ะเรียน', emoji: '🪑' }, { w: 'ruler', th: 'ไม้บรรทัด', emoji: '📏' },
    { w: 'eraser', th: 'ยางลบ', emoji: '🩹' }, { w: 'crayon', th: 'สีเทียน', emoji: '🖍️' },
    { w: 'paper', th: 'กระดาษ', emoji: '📄' }, { w: 'scissors', th: 'กรรไกร', emoji: '✂️' },
  ],
}

export const ENG_SENTENCES = [ // node eng_simple_sentences — gap-fill / arrange
  { s: 'I see a cat', emoji: '👀🐱' }, { s: 'The dog is big', emoji: '🐶⬆️' },
  { s: 'I like mango', emoji: '😋🥭' }, { s: 'She can run', emoji: '👧🏃' },
  { s: 'We go to school', emoji: '🚶🏫' }, { s: 'The sun is hot', emoji: '☀️🥵' },
  { s: 'He has a red hat', emoji: '👦🔴🎩' }, { s: 'The fish is in the water', emoji: '🐟💧' },
  { s: 'My mother is kind', emoji: '👩💕' }, { s: 'I eat rice', emoji: '😋🍚' },
]

export const ENG_QA = [ // node eng_questions_answers — match Q to A
  { q: 'What is your name?', a: 'My name is Tom.', wrong: ['I am seven.', 'It is a cat.', 'Yes, I do.'] },
  { q: 'How old are you?', a: 'I am six years old.', wrong: ['My name is Mai.', 'It is red.', 'I like dogs.'] },
  { q: 'What color is it?', a: 'It is blue.', wrong: ['I am fine.', 'She is my mom.', 'Two cats.'] },
  { q: 'Do you like fish?', a: 'Yes, I do.', wrong: ['It is big.', 'I am six.', 'He is tall.'] },
  { q: 'Where is the cat?', a: 'It is under the bed.', wrong: ['It is Monday.', 'I like cake.', 'She is happy.'] },
  { q: 'How are you?', a: 'I am fine, thank you.', wrong: ['It is a dog.', 'Three apples.', 'On the desk.'] },
]

export const ENG_PASSAGES = [ // nodes eng_reading_short_passages / eng_reading_comprehension
  { grade: 'P4', text: 'Tom has a dog. The dog is black. It likes to play with a ball.',
    q: 'What color is the dog?', choices: ['Black','White','Red','Brown'], a: 'Black' },
  { grade: 'P4', text: 'Mai goes to school by bus. The bus is yellow. She sits with her friend.',
    q: 'How does Mai go to school?', choices: ['By bus','By car','On foot','By boat'], a: 'By bus' },
  { grade: 'P5', text: 'Ben likes fruit. He eats a banana every morning. On hot days, he eats watermelon too.',
    q: 'What does Ben eat every morning?', choices: ['A banana','Watermelon','Rice','Bread'], a: 'A banana' },
  { grade: 'P6', text: 'Bees are small but very important. They fly from flower to flower and help plants grow. Without bees, we would have less fruit to eat.',
    q: 'Why are bees important?', choices: ['They help plants grow','They make loud sounds','They live in trees','They sleep all day'], a: 'They help plants grow' },
]

// Math: fully procedural — but Thai number words for word problems:
export const TH_NUMBER_WORDS = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า','สิบ']
export const MATH_STORY_TEMPLATES = [ // node math word problems (P1-P3) — {a},{b} filled procedurally
  { t: 'มีแอปเปิล {a} ลูก ได้มาอีก {b} ลูก รวมมีกี่ลูก', op: 'add', emoji: '🍎' },
  { t: 'มีลูกโป่ง {a} ใบ แตกไป {b} ใบ เหลือกี่ใบ', op: 'sub', emoji: '🎈' },
  { t: 'นก {a} ตัว บินมาเพิ่ม {b} ตัว มีนกทั้งหมดกี่ตัว', op: 'add', emoji: '🐦' },
  { t: 'มีขนม {a} ชิ้น กินไป {b} ชิ้น เหลือกี่ชิ้น', op: 'sub', emoji: '🍪' },
  { t: 'กล่องละ {a} ชิ้น มี {b} กล่อง รวมกี่ชิ้น', op: 'mul', emoji: '📦' },
  { t: 'มีเหรียญ {a} เหรียญ แบ่งให้เพื่อน {b} คนเท่าๆ กัน คนละกี่เหรียญ', op: 'div', emoji: '🪙' },
]
