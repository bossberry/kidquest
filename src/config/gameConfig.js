export const ITEMS = {
  food:   { emoji:'🍗', name:'อาหาร',   desc:'ให้กินเพื่อเพิ่มความสุข',  rarity:0.55 },
  star:   { emoji:'⭐', name:'ผงดาว',   desc:'XP x2 เป็นเวลา 5 นาที',    rarity:0.25 },
  ribbon: { emoji:'🎀', name:'ริบบิ้น', desc:'ตกแต่งไข่ เพิ่มความสุข',   rarity:0.12 },
  potion: { emoji:'💧', name:'น้ำมนต์', desc:'ฟักเร็วขึ้น +20 XP',       rarity:0.08 },
}

export const HATCH_CREATURES = {
  thai:  [{e:'🐘',n:'ช้างน้ำเงิน',f:'+ความอดทน',rarity:'common',rarityLabel:'Common'},{e:'🐍',n:'นาคทอง',f:'+พลังน้ำ',rarity:'rare',rarityLabel:'Rare'},{e:'🦅',n:'ครุฑไฟ',f:'+ปีกไฟ',rarity:'epic',rarityLabel:'Epic'}],
  eng:   [{e:'🐉',n:'มังกรน้ำ',f:'+พลังน้ำ',rarity:'common',rarityLabel:'Common'},{e:'🦊',n:'จิ้งจอกน้ำแข็ง',f:'+พลังน้ำแข็ง',rarity:'uncommon',rarityLabel:'Uncommon'},{e:'🦄',n:'ยูนิคอร์นฟ้า',f:'+เขาเวทมนตร์',rarity:'legendary',rarityLabel:'Legendary'}],
  math:  [{e:'🤖',n:'หุ่นโกเลม',f:'+กำปั้นเหล็ก',rarity:'common',rarityLabel:'Common'},{e:'💎',n:'คริสตัลเบิร์ด',f:'+คริสตัลบิน',rarity:'rare',rarityLabel:'Rare'},{e:'⚡',n:'สายฟ้าเสือ',f:'+สายฟ้า',rarity:'epic',rarityLabel:'Epic'}],
  hybrid:[{e:'🌈🦄',n:'ยูนิคอร์นรุ้ง',f:'+รุ้งสวรรค์',rarity:'legendary',rarityLabel:'Legendary'},{e:'🐉',n:'มังกรทอง',f:'+ออร่าทอง',rarity:'legendary',rarityLabel:'Legendary'},{e:'☀️🦁',n:'สิงห์สุริยา',f:'+แสงสุริยา',rarity:'epic',rarityLabel:'Epic'}],
}

export const GRADE_LABELS = ['อนุบาล','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']

export const TH_ALPHA = [
  {char:'ก',word:'ไก่',meaning:'Chicken',emoji:'🐔'},{char:'ข',word:'ไข่',meaning:'Egg',emoji:'🥚'},
  {char:'ค',word:'ควาย',meaning:'Buffalo',emoji:'🐃'},{char:'ง',word:'งู',meaning:'Snake',emoji:'🐍'},
  {char:'จ',word:'จาน',meaning:'Plate',emoji:'🍽️'},{char:'ช',word:'ช้าง',meaning:'Elephant',emoji:'🐘'},
  {char:'ด',word:'เด็ก',meaning:'Child',emoji:'👶'},{char:'ต',word:'เต่า',meaning:'Turtle',emoji:'🐢'},
  {char:'น',word:'หนู',meaning:'Mouse',emoji:'🐭'},{char:'บ',word:'ใบไม้',meaning:'Leaf',emoji:'🍃'},
  {char:'ป',word:'ปลา',meaning:'Fish',emoji:'🐟'},{char:'ม',word:'ม้า',meaning:'Horse',emoji:'🐴'},
  {char:'ย',word:'ยักษ์',meaning:'Giant',emoji:'👹'},{char:'ร',word:'เรือ',meaning:'Boat',emoji:'⛵'},
  {char:'ล',word:'ลิง',meaning:'Monkey',emoji:'🐒'},{char:'ว',word:'แหวน',meaning:'Ring',emoji:'💍'},
  {char:'ส',word:'เสือ',meaning:'Tiger',emoji:'🐯'},{char:'ห',word:'หีบ',meaning:'Chest',emoji:'📦'},
  {char:'อ',word:'อ่าง',meaning:'Basin',emoji:'🪣'},{char:'ฝ',word:'ฝา',meaning:'Lid',emoji:'🔒'},
]

export const SPELL_L1 = [
  // สระ อา
  {word:'ปา', chars:['ป','า'], emoji:'🎣', label:'ปา (ตกปลา)'},
  {word:'มา', chars:['ม','า'], emoji:'🤚', label:'มา (มาที่นี่)'},
  {word:'ขา', chars:['ข','า'], emoji:'🦵', label:'ขา (ขาของเรา)'},
  {word:'นา', chars:['น','า'], emoji:'🌾', label:'นา (ทุ่งนา)'},
  {word:'ตา', chars:['ต','า'], emoji:'👁️', label:'ตา (ดวงตา)'},
  {word:'ยา', chars:['ย','า'], emoji:'💊', label:'ยา (กินยา)'},
  {word:'ดา', chars:['ด','า'], emoji:'⭐', label:'ดาว'},
  {word:'ลา', chars:['ล','า'], emoji:'🫏', label:'ลา (สัตว์)'},
  // สระ อิ
  {word:'ปิ', chars:['ป','ิ'], emoji:'🚪', label:'ปิด'},
  {word:'มิ', chars:['ม','ิ'], emoji:'🙅', label:'มิ (ไม่ใช่)'},
  {word:'ขิ', chars:['ข','ิ'], emoji:'🌿', label:'ขิง'},
  {word:'คิ', chars:['ค','ิ'], emoji:'💭', label:'คิด'},
  // สระ อู
  {word:'ปู', chars:['ป','ู'], emoji:'🦀', label:'ปู (สัตว์)'},
  {word:'มู', chars:['ม','ู'], emoji:'😶', label:'มู'},
  {word:'ขู', chars:['ข','ู'], emoji:'😤', label:'ขู่'},
  {word:'คู', chars:['ค','ู'], emoji:'💑', label:'คู่'},
  // สระ เ
  {word:'เป', chars:['เ','ป'], emoji:'🌟', label:'เป็น'},
  {word:'เม', chars:['เ','ม'], emoji:'🏙️', label:'เมือง'},
  {word:'เข', chars:['เ','ข'], emoji:'🔑', label:'เข้า'},
  {word:'เค', chars:['เ','ค'], emoji:'🍺', label:'เค (ดื่ม)'},
  // สระ โ
  {word:'โป', chars:['โ','ป'], emoji:'🃏', label:'โปกเกอร์'},
  {word:'โม', chars:['โ','ม'], emoji:'🕐', label:'โมง'},
  {word:'โข', chars:['โ','ข'], emoji:'🎭', label:'โขน'},
  {word:'โค', chars:['โ','ค'], emoji:'🐄', label:'โค (วัว)'},
]

export const TH_L2 = [
  {word:'ปลา',  chars:['ป','ล','า'],    emoji:'🐟',label:'ปลา'},
  {word:'แมว',  chars:['แ','ม','ว'],    emoji:'🐱',label:'แมว'},
  {word:'นก',   chars:['น','ก'],        emoji:'🐦',label:'นก'},
  {word:'วัว',  chars:['ว','ั','ว'],   emoji:'🐄',label:'วัว'},
  {word:'ไก่',  chars:['ไ','ก่'],       emoji:'🐔',label:'ไก่'},
  {word:'หมู',  chars:['ห','ม','ู'],    emoji:'🐷',label:'หมู'},
  {word:'ช้าง', chars:['ช้','า','ง'],   emoji:'🐘',label:'ช้าง'},
  {word:'หมา',  chars:['ห','ม','า'],    emoji:'🐕',label:'หมา'},
  {word:'เป็ด', chars:['เ','ป็','ด'],   emoji:'🦆',label:'เป็ด'},
  {word:'ลิง',  chars:['ล','ิ','ง'],    emoji:'🐒',label:'ลิง'},
  {word:'กบ',   chars:['ก','บ'],        emoji:'🐸',label:'กบ'},
  {word:'แมลง', chars:['แ','ม','ล','ง'],emoji:'🐛',label:'แมลง'},
  {word:'ปู',   chars:['ป','ู'],        emoji:'🦀',label:'ปู'},
  {word:'หนู',  chars:['ห','น','ู'],    emoji:'🐭',label:'หนู'},
  {word:'งู',   chars:['ง','ู'],        emoji:'🐍',label:'งู'},
  {word:'หมี',  chars:['ห','ม','ี'],    emoji:'🐻',label:'หมี'},
  {word:'ม้า',  chars:['ม้','า'],       emoji:'🐴',label:'ม้า'},
  {word:'ควาย', chars:['ค','ว','า','ย'],emoji:'🐃',label:'ควาย'},
  {word:'กวาง', chars:['ก','ว','า','ง'],emoji:'🦌',label:'กวาง'},
  {word:'เต่า', chars:['เ','ต่','า'],   emoji:'🐢',label:'เต่า'},
]

export const TH_L3 = [
  {word:'กล้วย',   chars:['ก','ล้','ว','ย'],          emoji:'🍌',label:'กล้วย'},
  {word:'มะม่วง',  chars:['ม','ะ','ม่','ว','ง'],       emoji:'🥭',label:'มะม่วง'},
  {word:'แตงโม',   chars:['แ','ต','ง','โ','ม'],        emoji:'🍉',label:'แตงโม'},
  {word:'ส้มโอ',   chars:['ส้','ม','โ','อ'],           emoji:'🍊',label:'ส้มโอ'},
  {word:'มะละกอ',  chars:['ม','ะ','ล','ะ','ก','อ'],    emoji:'🍈',label:'มะละกอ'},
  {word:'สับปะรด', chars:['ส','ั','บ','ป','ะ','ร','ด'],emoji:'🍍',label:'สับปะรด'},
  {word:'กระต่าย', chars:['ก','ระ','ต่า','ย'],         emoji:'🐰',label:'กระต่าย'},
  {word:'ดอกไม้',  chars:['ด','อ','ก','ไ','ม้'],       emoji:'🌸',label:'ดอกไม้'},
  {word:'มะนาว',   chars:['ม','ะ','น','า','ว'],        emoji:'🍋',label:'มะนาว'},
  {word:'สะพาน',   chars:['ส','ะ','พ','า','น'],        emoji:'🌉',label:'สะพาน'},
  {word:'กระทะ',   chars:['ก','ระ','ท','ะ'],           emoji:'🍳',label:'กระทะ'},
  {word:'ประตู',   chars:['ป','ระ','ต','ู'],           emoji:'🚪',label:'ประตู'},
  {word:'กระดาน',  chars:['ก','ระ','ด','า','น'],       emoji:'🪞',label:'กระดาน'},
  {word:'ตะกร้า',  chars:['ต','ะ','ก','ร้า'],          emoji:'🧺',label:'ตะกร้า'},
]

export const TH_L5 = [
  {words:['แมว','กิน','ปลา'],    emoji:'🐱🐟', sound:'แมวกินปลา'},
  {words:['หมา','วิ่ง','เล่น'], emoji:'🐕🏃', sound:'หมาวิ่งเล่น'},
  {words:['ช้าง','ตัว','ใหญ่'], emoji:'🐘',   sound:'ช้างตัวใหญ่'},
  {words:['นก','บิน','สูง'],     emoji:'🐦✈️', sound:'นกบินสูง'},
  {words:['ปลา','ว่าย','น้ำ'],  emoji:'🐟💧', sound:'ปลาว่ายน้ำ'},
  {words:['เด็ก','อ่าน','หนังสือ'],emoji:'👧📚',sound:'เด็กอ่านหนังสือ'},
  {words:['แม่','ทำ','อาหาร'],  emoji:'👩🍳', sound:'แม่ทำอาหาร'},
  {words:['พ่อ','ขับ','รถ'],    emoji:'👨🚗', sound:'พ่อขับรถ'},
  {words:['หมู','ตัว','อ้วน'],  emoji:'🐷',   sound:'หมูตัวอ้วน'},
]


export const SP_CON = ['ก','ข','ค','ง','จ','ช','ด','ต','น','บ','ป','ม','ย','ร','ล','ว','ส','ห','อ','พ','ท','ฝ','ฟ','ถ','ภ']
export const SP_VOW = ['า','ิ','ี','เ','แ','โ','ว','ม','น','ง','ก','ต','ด']

export const CHAR_SPEAK = {
  'า':'อา','ิ':'อิ','ี':'อี','ึ':'อึ','ื':'อือ','ุ':'อุ','ู':'อู',
  'เ':'เอ','แ':'แอ','โ':'โอ','ไ':'ไ','ใ':'ใ','็':'อ็','่':'ไม้เอก','้':'ไม้โท',
  'ั':'อั','ํ':'นิคหิต',
}

export const EN_ALPHA = [
  {letter:'A',phonics:'/æ/',word:'Ant',emoji:'🐜',thai:'มด'},{letter:'B',phonics:'/b/',word:'Ball',emoji:'⚽',thai:'ลูกบอล'},
  {letter:'C',phonics:'/k/',word:'Cat',emoji:'🐱',thai:'แมว'},{letter:'D',phonics:'/d/',word:'Dog',emoji:'🐶',thai:'สุนัข'},
  {letter:'E',phonics:'/ɛ/',word:'Egg',emoji:'🥚',thai:'ไข่'},{letter:'F',phonics:'/f/',word:'Fish',emoji:'🐟',thai:'ปลา'},
  {letter:'G',phonics:'/g/',word:'Guitar',emoji:'🎸',thai:'กีตาร์'},{letter:'H',phonics:'/h/',word:'Hat',emoji:'🎩',thai:'หมวก'},
  {letter:'I',phonics:'/ɪ/',word:'Igloo',emoji:'🧊',thai:'อิกลู'},{letter:'J',phonics:'/dʒ/',word:'Jelly',emoji:'🍇',thai:'เยลลี่'},
  {letter:'K',phonics:'/k/',word:'Kite',emoji:'🪁',thai:'ว่าว'},{letter:'L',phonics:'/l/',word:'Lion',emoji:'🦁',thai:'สิงโต'},
  {letter:'M',phonics:'/m/',word:'Map',emoji:'🗺️',thai:'แผนที่'},{letter:'N',phonics:'/n/',word:'Net',emoji:'🥅',thai:'ตาข่าย'},
  {letter:'O',phonics:'/ɒ/',word:'Octopus',emoji:'🐙',thai:'ปลาหมึก'},{letter:'P',phonics:'/p/',word:'Penguin',emoji:'🐧',thai:'เพนกวิน'},
  {letter:'Q',phonics:'/kw/',word:'Queen',emoji:'👑',thai:'ราชินี'},{letter:'R',phonics:'/r/',word:'Robot',emoji:'🤖',thai:'หุ่นยนต์'},
  {letter:'S',phonics:'/s/',word:'Sun',emoji:'☀️',thai:'ดวงอาทิตย์'},{letter:'T',phonics:'/t/',word:'Tiger',emoji:'🐯',thai:'เสือ'},
  {letter:'U',phonics:'/ʌ/',word:'Umbrella',emoji:'☂️',thai:'ร่ม'},{letter:'V',phonics:'/v/',word:'Van',emoji:'🚐',thai:'รถตู้'},
  {letter:'W',phonics:'/w/',word:'Whale',emoji:'🐋',thai:'วาฬ'},{letter:'X',phonics:'/ks/',word:'Box',emoji:'📦',thai:'กล่อง'},
  {letter:'Y',phonics:'/j/',word:'Yak',emoji:'🦬',thai:'จามรี'},{letter:'Z',phonics:'/z/',word:'Zebra',emoji:'🦓',thai:'ม้าลาย'},
]

export const CVC_WORDS = [
  {word:'cat',emoji:'🐱',alts:['bat','cut','cap']}, {word:'dog',emoji:'🐕',alts:['dig','dot','log']},
  {word:'pig',emoji:'🐷',alts:['big','pin','pit']}, {word:'sun',emoji:'☀️',alts:['run','fun','bun']},
  {word:'hat',emoji:'🎩',alts:['bat','hot','hit']}, {word:'cup',emoji:'☕',alts:['cut','pup','cap']},
  {word:'bed',emoji:'🛏️',alts:['bad','bid','red']}, {word:'bus',emoji:'🚌',alts:['but','bun','rub']},
  {word:'fan',emoji:'🌀',alts:['fun','fin','fat']}, {word:'map',emoji:'🗺️',alts:['mat','cap','mop']},
  {word:'fox',emoji:'🦊',alts:['box','fix','mix']}, {word:'bug',emoji:'🐛',alts:['bun','bud','dug']},
  {word:'hen',emoji:'🐔',alts:['pen','men','ten']}, {word:'lip',emoji:'💋',alts:['dip','tip','hip']},
  {word:'nut',emoji:'🥜',alts:['cut','but','gut']}, {word:'rat',emoji:'🐀',alts:['bat','mat','fat']},
  {word:'van',emoji:'🚐',alts:['ban','can','man']}, {word:'web',emoji:'🕸️',alts:['wet','wed','jab']},
  {word:'jam',emoji:'🍓',alts:['ham','dam','yam']}, {word:'kid',emoji:'👦',alts:['did','bid','lid']},
  {word:'net',emoji:'🥅',alts:['set','bet','get']}, {word:'rub',emoji:'🧼',alts:['rug','rum','run']},
  {word:'sit',emoji:'🪑',alts:['bit','hit','kit']}, {word:'log',emoji:'🪵',alts:['leg','lag','lot']},
]

export const SIGHT_DATA = [
  {sentence:'___ cat is big.',    blank:'The',   choices:['The','A','Is','I'],      emoji:'🐱'},
  {sentence:'I ___ a dog.',       blank:'see',   choices:['see','the','is','we'],   emoji:'🐕'},
  {sentence:'___ like dogs.',     blank:'I',     choices:['I','a','The','is'],      emoji:'❤️🐕'},
  {sentence:'We ___ happy.',      blank:'are',   choices:['are','is','a','the'],    emoji:'😊'},
  {sentence:'___ is my cat.',     blank:'She',   choices:['She','Is','A','The'],    emoji:'🐱'},
  {sentence:'He ___ a bird.',     blank:'has',   choices:['has','is','a','the'],    emoji:'🐦'},
  {sentence:'I go ___ school.',   blank:'to',    choices:['to','a','is','the'],     emoji:'🏫'},
  {sentence:'___ are friends.',   blank:'We',    choices:['We','I','Is','A'],       emoji:'👫'},
  {sentence:'I ___ a cat.',       blank:'have',  choices:['have','are','is','the'], emoji:'🐱'},
  {sentence:'He ___ run fast.',   blank:'can',   choices:['can','is','the','a'],    emoji:'🏃'},
  {sentence:'They ___ lunch.',    blank:'eat',   choices:['eat','are','is','we'],   emoji:'🍱'},
  {sentence:'___ is hot.',        blank:'It',    choices:['It','I','Is','The'],     emoji:'🌡️'},
  {sentence:'My dog ___ cute.',   blank:'is',    choices:['is','are','the','a'],    emoji:'🐕'},
  {sentence:'___ can fly.',       blank:'Birds', choices:['Birds','Dogs','The','A'],emoji:'🐦'},
  {sentence:'We ___ outside.',    blank:'play',  choices:['play','is','are','the'], emoji:'🌳'},
  {sentence:'___ likes fish.',    blank:'She',   choices:['She','He','I','We'],     emoji:'🐟'},
]

export const ENG_SENTS = [
  {words:['The','cat','is','big'],   emoji:'🐱'},
  {words:['I','like','dogs'],        emoji:'🐕'},
  {words:['She','can','run','fast'], emoji:'🏃'},
  {words:['The','bird','can','fly'], emoji:'🐦'},
  {words:['We','eat','rice'],        emoji:'🍚'},
  {words:['He','has','a','ball'],    emoji:'⚽'},
  {words:['I','see','a','fish'],     emoji:'🐟'},
  {words:['The','sun','is','hot'],   emoji:'☀️'},
  {words:['She','has','a','hat'],    emoji:'🎩'},
  {words:['We','play','outside'],    emoji:'🌳'},
  {words:['My','dog','is','cute'],   emoji:'🐕'},
  {words:['The','fish','can','swim'],emoji:'🐟'},
]

export const MATH_WORDS = [
  // Joining (+)
  {story:'มีแอปเปิ้ล 🍎 3 ลูก ได้เพิ่ม 2 ลูก มีทั้งหมดกี่ลูก?',   a:3,  b:2, op:'+',ans:5},
  {story:'มีแมว 🐱 4 ตัว วิ่งมาเพิ่ม 3 ตัว มีทั้งหมดกี่ตัว?',     a:4,  b:3, op:'+',ans:7},
  {story:'มีนก 🐦 5 ตัว บินมาอีก 6 ตัว มีทั้งหมดกี่ตัว?',         a:5,  b:6, op:'+',ans:11},
  {story:'มีดอกไม้ 🌸 4 ดอก ปลูกเพิ่ม 5 ดอก มีทั้งหมดกี่ดอก?',   a:4,  b:5, op:'+',ans:9},
  {story:'มีรถ 🚗 3 คัน มาเพิ่ม 5 คัน มีทั้งหมดกี่คัน?',          a:3,  b:5, op:'+',ans:8},
  {story:'มีเด็ก 👧 7 คน มาเพิ่ม 4 คน มีทั้งหมดกี่คน?',           a:7,  b:4, op:'+',ans:11},
  {story:'นก 🐦 บิน 4 ตัว บินมาเพิ่ม 3 ตัว มีนกทั้งหมดกี่ตัว?',  a:4,  b:3, op:'+',ans:7},
  {story:'มีไข่ 🥚 6 ฟอง แม่ไก่วางเพิ่ม 3 ฟอง มีทั้งหมดกี่ฟอง?', a:6,  b:3, op:'+',ans:9},
  {story:'มีสมุด 📓 5 เล่ม ซื้อเพิ่ม 4 เล่ม มีทั้งหมดกี่เล่ม?',   a:5,  b:4, op:'+',ans:9},
  {story:'มีปลาในตู้ 🐟 8 ตัว ซื้อเพิ่ม 4 ตัว มีทั้งหมดกี่ตัว?',  a:8,  b:4, op:'+',ans:12},
  // Taking away (-)
  {story:'มีลูกบอล ⚽ 7 ลูก ให้เพื่อนไป 3 ลูก เหลือกี่ลูก?',       a:7,  b:3, op:'-',ans:4},
  {story:'มีคุกกี้ 🍪 9 ชิ้น กิน 4 ชิ้น เหลือกี่ชิ้น?',           a:9,  b:4, op:'-',ans:5},
  {story:'มีดินสอ ✏️ 8 แท่ง หาย 3 แท่ง เหลือกี่แท่ง?',           a:8,  b:3, op:'-',ans:5},
  {story:'มีปลา 🐟 6 ตัว ตายไป 2 ตัว เหลือกี่ตัว?',               a:6,  b:2, op:'-',ans:4},
  {story:'มีลูกโป่ง 🎈 8 ลูก แตกไป 3 ลูก เหลือกี่ลูก?',           a:8,  b:3, op:'-',ans:5},
  {story:'ซื้อขนม 🍬 5 ชิ้น กิน 2 ชิ้น เหลือกี่ชิ้น?',            a:5,  b:2, op:'-',ans:3},
  {story:'มีส้ม 🍊 6 ผล กินไป 4 ผล เหลือกี่ผล?',                  a:6,  b:4, op:'-',ans:2},
  {story:'มีหนังสือ 📚 9 เล่ม ยืมไป 4 เล่ม เหลือกี่เล่ม?',        a:9,  b:4, op:'-',ans:5},
  {story:'มีลูกกวาด 🍭 10 เม็ด แบ่งให้เพื่อน 6 เม็ด เหลือกี่เม็ด?',a:10,b:6, op:'-',ans:4},
  {story:'มีไก่ 🐔 11 ตัว วิ่งหนีไป 4 ตัว เหลือกี่ตัว?',          a:11, b:4, op:'-',ans:7},
  // Comparison (มากกว่า/น้อยกว่า) — used by Level 7 only
  {story:'มีแอปเปิ้ล 🍎 5 ลูก มีส้ม 🍊 3 ลูก แอปเปิ้ลมากกว่าส้มกี่ลูก?',         a:5,  b:3, op:'-',ans:2, comparison:true},
  {story:'แมว 🐱 มี 8 ตัว หมา 🐕 มี 5 ตัว แมวมากกว่าหมากี่ตัว?',                   a:8,  b:5, op:'-',ans:3, comparison:true},
  {story:'มีดินสอ ✏️ 9 แท่ง ยางลบ 🧹 4 ก้อน ดินสอมากกว่ายางลบกี่อัน?',            a:9,  b:4, op:'-',ans:5, comparison:true},
  {story:'นักเรียนชาย 👦 7 คน นักเรียนหญิง 👧 4 คน ชายมากกว่าหญิงกี่คน?',          a:7,  b:4, op:'-',ans:3, comparison:true},
  {story:'มีส้ม 🍊 6 ผล มีกล้วย 🍌 2 ผล ส้มมากกว่ากล้วยกี่ผล?',                    a:6,  b:2, op:'-',ans:4, comparison:true},
  {story:'ปลาทอง 🐟 มี 10 ตัว ปลาสวยงาม 🐠 มี 6 ตัว ต่างกันกี่ตัว?',               a:10, b:6, op:'-',ans:4, comparison:true},
  {story:'มีไข่ 🥚 8 ฟอง นก 🐦 มี 3 ตัว ไข่มากกว่านกกี่อัน?',                       a:8,  b:3, op:'-',ans:5, comparison:true},
  {story:'รถยนต์ 🚗 มี 9 คัน รถบัส 🚌 มี 4 คัน รถยนต์มากกว่ารถบัสกี่คัน?',          a:9,  b:4, op:'-',ans:5, comparison:true},
  {story:'มีลูกบอล ⚽ 11 ลูก มีลูกโป่ง 🎈 7 ลูก ลูกบอลมากกว่าลูกโป่งกี่ลูก?',      a:11, b:7, op:'-',ans:4, comparison:true},
  {story:'แมลงปอ 🪲 มี 12 ตัว ผีเสื้อ 🦋 มี 5 ตัว แมลงปอมากกว่าผีเสื้อกี่ตัว?',    a:12, b:5, op:'-',ans:7, comparison:true},
]

export const PATTERN_SETS = {
  AB: [
    ['🥚','🔵'],
    ['⭐','🍎'],
    ['🟡','🟣'],
    ['🐣','🌟'],
    ['❤️','💙'],
  ],
  ABC: [], // reserved for Level 9
}

export const LEVELS = {
  thai:[
    {id:1,name:'พยัญชนะ ก-ฮ',hint:'จับคู่ตัวอักษรกับรูปภาพ',emoji:'🇹🇭',stars:1,diff:1,type:'match'},
    {id:2,name:'พยัญชนะ+สระอา',hint:'เช่น ปา มา ขา',emoji:'🅰️',stars:2,diff:1.2},
    {id:3,name:'คำสัตว์',hint:'เช่น ปลา แมว ช้าง',emoji:'🐟🐱',stars:3,diff:1.5},
    {id:4,name:'คำ 3 พยางค์',hint:'เช่น กระต่าย มะนาว ประตู',emoji:'🐰🍋',stars:4,diff:2.5},
    {id:5,name:'ประโยคสั้น',hint:'เรียงคำให้เป็นประโยค',emoji:'💬',stars:5,diff:3,type:'wordorder'},
  ],
  math:[
    {id:0,name:'นับของ',      hint:'นับสิ่งของ 1–5',          emoji:'🔢',stars:1,diff:0.5,op:'count',  timer:20,isFoundation:true},
    {id:1,name:'บวก 1–5',     hint:'1+2=?',                   emoji:'1️⃣',stars:1,diff:1,  range:[1,5], op:'add',  timer:20,visualModel:'objects'},
    {id:2,name:'บวก 1–10',    hint:'4+6=?',                   emoji:'🔟',stars:2,diff:1.5,range:[1,10],op:'add',  timer:15,visualModel:'objects'},
    {id:3,name:'บวก 1–20',    hint:'8+12=?',                  emoji:'🔢',stars:3,diff:2,  range:[1,20],op:'add',  timer:12,visualModel:'tenFrame'},
    {id:4,name:'ลบ 1–10',     hint:'7−3=?',                   emoji:'➖',stars:3,diff:2,  range:[1,10],op:'sub',  timer:10,visualModel:'crossOut'},
    {id:5,name:'บวกลบผสม',    hint:'5+3−2=?',                 emoji:'🔀',stars:4,diff:2.5,range:[1,10],op:'mixed',timer:10},
    {id:6,name:'โจทย์คำ',     hint:'มีแอปเปิ้ล 3 ลูก...',    emoji:'💬',stars:5,diff:3,  op:'word',   timer:15},
    {id:7,name:'เปรียบเทียบ', hint:'มากกว่า น้อยกว่ากี่...',  emoji:'⚖️',stars:3,diff:2,  op:'word',subtype:'comparison',timer:15},
    {id:8,name:'รูปแบบ AB',   hint:'อะไรมาถัดไป?',           emoji:'🔁',stars:4,diff:2.5,op:'pattern',timer:15},
  ],
  eng:[
    {id:1,name:'A–Z Phonics',hint:'A is for Apple...',emoji:'🔤',stars:1,diff:1,type:'phonics'},
    {id:2,name:'CVC Words',hint:'cat, dog, pig...',emoji:'🐱🐕',stars:2,diff:1.5,type:'cvc'},
    {id:3,name:'Sight Words',hint:'the, is, a, I...',emoji:'👁️',stars:3,diff:2,type:'sight'},
    {id:4,name:'Sentences',hint:'The cat is big.',emoji:'💬',stars:4,diff:2.5,type:'sentence'},
  ],
}

export const TEACH_CONTENT = {
  thai:{
    1:{mascot:'🦔',text:'ดูตัวอักษรแล้วเลือกรูปที่ถูกต้อง!\nตัวลวงมีหน้าตาคล้ายกัน ดูดีๆ นะ',examples:['ก → 🐔 ไก่','ป → 🐟 ปลา','ม → 🐴 ม้า']},
    2:{mascot:'🌸',text:'ดูรูปแล้วกดตัวอักษรทีละตัว!\nมีสระหลายแบบ: อา อิ อู เ โ',examples:['🎣 ป + า = ปา','🦀 ป + ู = ปู','🔑 เ + ข = เข']},
    3:{mascot:'🐱',text:'สัตว์หลายชนิด กดทีละตัว!\nถ้าผิด 2 ครั้ง → ดูไฮไลท์ช่วย',examples:['🐟 ป + ล + า = ปลา','🐘 ช้ + า + ง = ช้าง']},
    4:{mascot:'🐰',text:'ฟังเสียงแล้วสะกดทีละตัว!\nระวังคำที่มีหลายพยางค์',examples:['🐰 ก + ระ + ต่า + ย = กระต่าย','🍋 ม + ะ + น + า + ว = มะนาว']},
    5:{mascot:'💬',text:'เรียงคำให้เป็นประโยค!\nดูรูปช่วยคิด แล้วกดคำตามลำดับ',examples:['🐱🐟 แมว + กิน + ปลา → แมวกินปลา','🐦 นก + บิน + สูง → นกบินสูง']},
  },
  math:{
    0:{mascot:'🐣',text:'มาฝึกนับด้วยกัน!\nนับสิ่งของที่เห็น แล้วเลือกตัวเลข',examples:['🥚🥚🥚 = 3','⭐⭐⭐⭐⭐ = 5']},
    1:{mascot:'🦔',text:'บวกเลข 1-5 กัน!\nนับจุดสีเหลืองช่วยได้',examples:['2 + 3 = 5 🟡🟡🔵🔵🔵','1 + 4 = 5 🟡🔵🔵🔵🔵']},
    2:{mascot:'🦔',text:'ตอนนี้เลขถึง 10!\nนับจุดให้ครบนะ',examples:['4 + 6 = 10','3 + 7 = 10']},
    3:{mascot:'🦔',text:'บวกเลขใหญ่ขึ้น 1-20\nคิดทีละก้าว ทำได้!',examples:['8 + 12 = 20','15 + 5 = 20']},
    4:{mascot:'🦔',text:'ลบเลขคือ "เอาออก"\nดูนะ: 🟡🟡🟡🟡🟡 มี 5 เอาออก 2 ❌❌ เหลือ 3!',examples:['5 - 2 = 3','7 - 4 = 3']},
    5:{mascot:'🔥',text:'บวกและลบผสมกัน!\nอ่านเครื่องหมายให้ดีนะ + หรือ −',examples:['5 + 3 - 2 = 6','8 - 3 + 1 = 6']},
    6:{mascot:'🦉',text:'โจทย์คำ: อ่านแล้วคำนวณ\nดูรูป emoji ช่วยได้!',examples:['มีแอปเปิ้ล 3 ลูก ได้เพิ่ม 2 ลูก = 5 ลูก']},
    7:{mascot:'⚖️',text:'เปรียบเทียบ "มากกว่า" หรือ "น้อยกว่า"\nลบเพื่อหาผลต่าง!',examples:['🍎🍎🍎 3 ลูก, 🍊🍊 2 ลูก → 3-2=1','แมว 5 ตัว หมา 3 ตัว → 5-3=2']},
    8:{mascot:'🔁',text:'ดูรูปแบบที่ซ้ำกัน\nหาว่าอะไรมาถัดไป!',examples:['🥚🔵🥚🔵🥚❓ → 🔵','⭐🍎⭐🍎⭐❓ → 🍎']},
  },
  eng:{
    1:{mascot:'🦔',text:'A-Z Phonics! Each letter has a sound.\nTap the right picture!',examples:['🍎 A is for Apple','🐝 B is for Bee']},
    2:{mascot:'🐱',text:'CVC = Consonant-Vowel-Consonant\nHear the word, pick the spelling!',examples:['🐱 → c-a-t = cat','🐕 → d-o-g = dog']},
    3:{mascot:'📖',text:'Sight words appear in every sentence!\nFind the missing word.',examples:['___ cat is big → The','I ___ a dog → see']},
    4:{mascot:'💬',text:'Put the words in the right order\nto make a sentence!',examples:['big / The / is / cat → The cat is big.']},
  },
}

export const MG_UNLOCK = { catch:2, memory:4, tower:6, fishing:10 }
export const MG_COLORS = {
  catch:'linear-gradient(135deg,#1D9E75,#085041)',
  memory:'linear-gradient(135deg,#7F77DD,#3C3489)',
  tower:'linear-gradient(135deg,#EF9F27,#633806)',
  fishing:'linear-gradient(135deg,#378ADD,#0C447C)',
}

export const FISH_TYPES = [
  {sym:'🐟',item:'food',rarity:.5,name:'ปลาธรรมดา'},
  {sym:'🐠',item:'ribbon',rarity:.25,name:'ปลาสวยงาม'},
  {sym:'🐡',item:'star',rarity:.15,name:'ปลาปักเป้า'},
  {sym:'🦑',item:'potion',rarity:.08,name:'ปลาหมึก'},
  {sym:'🐙',item:'all',rarity:.02,name:'ปลาหมึกยักษ์'},
]

export const CATCH_ITEMS = [
  {sym:'💛',pts:1,w:.65,danger:false},{sym:'🍎',pts:3,w:.2,danger:false},
  {sym:'💎',pts:10,w:.05,danger:false},{sym:'🪨',pts:0,w:.07,danger:true,dmg:1},
  {sym:'💣',pts:0,w:.03,danger:true,dmg:2},
]

export const TOWER_COLORS = ['#7F77DD','#1D9E75','#EF9F27','#378ADD','#E24B4A','#9C27B0']

export const TIERS = {
  0: { name: 'อนุบาล', baseStat: 100,  maxXP: 350  },
  1: { name: 'ป.1-2',  baseStat: 150,  maxXP: 500  },
  2: { name: 'ป.3-4',  baseStat: 220,  maxXP: 700  },
  3: { name: 'ป.5-6',  baseStat: 300,  maxXP: 900  },
  4: { name: 'ม.ต้น',  baseStat: 400,  maxXP: 1200 },
  5: { name: 'ม.ปลาย', baseStat: 500, maxXP: 1500 },
}

export function calcCreatureStats(egg) {
  const tier = TIERS[egg.tier || 0]
  const base = tier.baseStat
  const total = (egg.xpThai || 0) + (egg.xpEng || 0) + (egg.xpMath || 0) || 1
  const ATK = Math.round(base * (egg.xpThai || 0) / total)
  const DEF = Math.round(base * (egg.xpMath || 0) / total)
  const SPD = Math.round(base * (egg.xpEng  || 0) / total)
  const critRate    = Math.min(0.5, (egg.acc    || 70) / 200)
  const streakBonus = 1 + Math.floor((egg.streak || 0) / 7) * 0.1
  return {
    HP:       Math.round(base * 1.5 * streakBonus),
    ATK:      Math.round(ATK * streakBonus),
    DEF:      Math.round(DEF * streakBonus),
    SPD:      Math.round(SPD * streakBonus),
    CRIT:     critRate,
    tier:     egg.tier || 0,
    tierName: tier.name,
  }
}

export const AI_OPPONENTS = {
  0: {
    normal: [
      { name: 'Motobug',    emoji: '🤖', HP: 80,  ATK: 8,  DEF: 5,  SPD: 6  },
      { name: 'Buzzbomber', emoji: '🦟', HP: 70,  ATK: 10, DEF: 4,  SPD: 9  },
      { name: 'Crabmeat',   emoji: '🦀', HP: 90,  ATK: 7,  DEF: 8,  SPD: 5  },
    ],
    miniBoss: { name: 'Egg Pawn',     emoji: '⚔️🤖', HP: 130, ATK: 14, DEF: 12, SPD: 8  },
    boss:     { name: 'Dr. Eggman I', emoji: '😈',   HP: 200, ATK: 18, DEF: 15, SPD: 10,
                reward: 'unlock_tier_1',
                dialogue: 'ฮ่าฮ่า! เจ็บไหม? กลับไปเรียนให้เก่งกว่านี้ก่อน!' },
  },
  1: {
    normal: [
      { name: 'Caterkiller', emoji: '🐛', HP: 120, ATK: 12, DEF: 8,  SPD: 7  },
      { name: 'Burrobot',    emoji: '🔩', HP: 130, ATK: 11, DEF: 12, SPD: 6  },
      { name: 'Chopper',     emoji: '🐟', HP: 110, ATK: 14, DEF: 7,  SPD: 10 },
    ],
    miniBoss: { name: 'Egg Gunner',    emoji: '🔫🤖', HP: 200, ATK: 20, DEF: 18, SPD: 12 },
    boss:     { name: 'Dr. Eggman II', emoji: '😈🚀', HP: 300, ATK: 25, DEF: 22, SPD: 15,
                reward: 'unlock_tier_2',
                dialogue: 'ไม่เป็นไร! เครื่องจักรรุ่นต่อไปจะทำลายเจ้าแน่!' },
  },
  2: {
    normal: [
      { name: 'Coconuts', emoji: '🥥',   HP: 175, ATK: 18, DEF: 14, SPD: 12 },
      { name: 'Octus',    emoji: '🐙',   HP: 160, ATK: 20, DEF: 10, SPD: 16 },
      { name: 'Rexon',    emoji: '🦕',   HP: 190, ATK: 16, DEF: 18, SPD: 10 },
    ],
    miniBoss: { name: 'Egg Robo',        emoji: '🤖💥', HP: 300, ATK: 28, DEF: 24, SPD: 18 },
    boss:     { name: 'Dr. Eggman III',  emoji: '😈🔥', HP: 450, ATK: 36, DEF: 30, SPD: 22,
                reward: 'unlock_tier_3',
                dialogue: 'เจ้าจะได้รับโทษ! เครื่องยนต์ใหม่ของข้าจะบดขยี้เจ้า!' },
  },
  3: {
    normal: [
      { name: 'Rhino-Bot', emoji: '🦏',  HP: 260, ATK: 28, DEF: 22, SPD: 15 },
      { name: 'Slicer',    emoji: '🦂',  HP: 240, ATK: 32, DEF: 16, SPD: 20 },
      { name: 'Jawz',      emoji: '🦈',  HP: 280, ATK: 25, DEF: 26, SPD: 18 },
    ],
    miniBoss: { name: 'Heavy Gunner',    emoji: '⚙️🔫', HP: 460, ATK: 44, DEF: 38, SPD: 26 },
    boss:     { name: 'Dr. Eggman IV',   emoji: '😈⚙️', HP: 680, ATK: 56, DEF: 48, SPD: 34,
                reward: 'unlock_tier_4',
                dialogue: 'ความฉลาดของเจ้าน่าเกรงขาม แต่ข้าจะชนะเสมอ!' },
  },
  4: {
    normal: [
      { name: 'GUN Mech',   emoji: '🤖⚡', HP: 380, ATK: 40, DEF: 32, SPD: 24 },
      { name: 'E-101 Beta', emoji: '🔮🤖', HP: 360, ATK: 44, DEF: 26, SPD: 30 },
      { name: 'Dark Chao',  emoji: '😈💜', HP: 400, ATK: 36, DEF: 38, SPD: 22 },
    ],
    miniBoss: { name: 'Egg Emperor',     emoji: '👑🤖', HP: 660, ATK: 60, DEF: 54, SPD: 40 },
    boss:     { name: 'Dr. Eggman V',    emoji: '😈💎', HP: 1000, ATK: 80, DEF: 70, SPD: 52,
                reward: 'unlock_tier_5',
                dialogue: 'เจ้าเป็นนักเรียนที่เก่งมาก แต่ Eggman Empire จะพิชิตโลกนี้!' },
  },
  5: {
    normal: [
      { name: 'Metal Sonic',      emoji: '⚡🤖', HP: 560, ATK: 60, DEF: 48, SPD: 36 },
      { name: 'Shadow Android',   emoji: '🖤⚡', HP: 540, ATK: 66, DEF: 40, SPD: 44 },
      { name: 'Silver Gladiator', emoji: '🌟⚔️', HP: 580, ATK: 55, DEF: 56, SPD: 35 },
    ],
    miniBoss: { name: 'Mephiles',        emoji: '🌑😈', HP: 960, ATK:  90, DEF:  80, SPD: 60 },
    boss:     { name: 'PERFECT CHAOS',   emoji: '🌊💀', HP: 1500, ATK: 120, DEF: 110, SPD: 80,
                reward: 'world_champion',
                dialogue: 'เจ้าคือจุดสูงสุดแห่งปัญญา ข้ายอมรับความพ่ายแพ้!' },
  },
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}
