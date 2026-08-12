(() => {
const alphabetLetters = [
  { letter: "ئا", latin: "a", type: "元音" },
  { letter: "ئە", latin: "e", type: "元音" },
  { letter: "ب", latin: "b", type: "辅音" },
  { letter: "پ", latin: "p", type: "辅音" },
  { letter: "ت", latin: "t", type: "辅音" },
  { letter: "ج", latin: "j", type: "辅音" },
  { letter: "چ", latin: "ch", type: "辅音" },
  { letter: "خ", latin: "x", type: "辅音" },
  { letter: "د", latin: "d", type: "辅音" },
  { letter: "ر", latin: "r", type: "辅音" },
  { letter: "ز", latin: "z", type: "辅音" },
  { letter: "ژ", latin: "zh", type: "辅音" },
  { letter: "س", latin: "s", type: "辅音" },
  { letter: "ش", latin: "sh", type: "辅音" },
  { letter: "غ", latin: "gh", type: "辅音" },
  { letter: "ف", latin: "f", type: "辅音" },
  { letter: "ق", latin: "q", type: "辅音" },
  { letter: "ك", latin: "k", type: "辅音" },
  { letter: "گ", latin: "g", type: "辅音" },
  { letter: "ڭ", latin: "ng", type: "辅音" },
  { letter: "ل", latin: "l", type: "辅音" },
  { letter: "م", latin: "m", type: "辅音" },
  { letter: "ن", latin: "n", type: "辅音" },
  { letter: "ھ", latin: "h", type: "辅音" },
  { letter: "ئو", latin: "o", type: "元音" },
  { letter: "ئۇ", latin: "u", type: "元音" },
  { letter: "ئۆ", latin: "ö", type: "元音" },
  { letter: "ئۈ", latin: "ü", type: "元音" },
  { letter: "ۋ", latin: "w / v", type: "辅音" },
  { letter: "ئې", latin: "ë", type: "元音" },
  { letter: "ئى", latin: "i", type: "元音" },
  { letter: "ي", latin: "y", type: "辅音" }
];

const letterDetails = {
  be: {
    id: "be",
    letter: "ب",
    latin: "b",
    type: "辅音",
    cue: "下方一个点",
    forms: [
      { label: "独立", value: "ب" },
      { label: "词首", value: "بـ" },
      { label: "词中", value: "ـبـ" },
      { label: "词尾", value: "ـب" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 b；正式版以真人音频为准。",
    writingHint: "主体像平稳的弧线，点在下方。",
    example: "和 پ、ت、ن 放在一起看时，ب 的关键是下方一个点。"
  },
  pe: {
    id: "pe",
    letter: "پ",
    latin: "p",
    type: "辅音",
    cue: "下方三个点",
    forms: [
      { label: "独立", value: "پ" },
      { label: "词首", value: "پـ" },
      { label: "词中", value: "ـپـ" },
      { label: "词尾", value: "ـپ" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 p；正式版以真人音频为准。",
    writingHint: "主体和 ب 很像，关键是下方三个点。",
    example: "和 ب 对比时，پ 的不同点是下方三个点。"
  },
  te: {
    id: "te",
    letter: "ت",
    latin: "t",
    type: "辅音",
    cue: "上方两个点",
    forms: [
      { label: "独立", value: "ت" },
      { label: "词首", value: "تـ" },
      { label: "词中", value: "ـتـ" },
      { label: "词尾", value: "ـت" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 t；正式版以真人音频为准。",
    writingHint: "主体相似，关键是上方两个点。",
    example: "和 ن 对比时，ت 是上方两个点。"
  },
  nun: {
    id: "nun",
    letter: "ن",
    latin: "n",
    type: "辅音",
    cue: "上方一个点",
    forms: [
      { label: "独立", value: "ن" },
      { label: "词首", value: "نـ" },
      { label: "词中", value: "ـنـ" },
      { label: "词尾", value: "ـن" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 n；正式版以真人音频为准。",
    writingHint: "主体相似，关键是上方一个点。",
    example: "和 ت 对比时，ن 是上方一个点。"
  },
  jim: {
    id: "jim",
    letter: "ج",
    latin: "j",
    type: "辅音",
    cue: "弯形，下方一个点",
    forms: [
      { label: "独立", value: "ج" },
      { label: "词首", value: "جـ" },
      { label: "词中", value: "ـجـ" },
      { label: "词尾", value: "ـج" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 j；正式版以真人音频为准。",
    writingHint: "先看弯形主体，再确认下方一个点。",
    example: "ج、چ、خ 的主体很像，先靠点的位置和数量区分。"
  },
  che: {
    id: "che",
    letter: "چ",
    latin: "ch",
    type: "辅音",
    cue: "弯形，下方三个点",
    forms: [
      { label: "独立", value: "چ" },
      { label: "词首", value: "چـ" },
      { label: "词中", value: "ـچـ" },
      { label: "词尾", value: "ـچ" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 ch；正式版以真人音频为准。",
    writingHint: "弯形主体和 ج 相近，关键是下方三个点。",
    example: "چ 和 ج 的主要区别是下方点的数量。"
  },
  khe: {
    id: "khe",
    letter: "خ",
    latin: "x",
    type: "辅音",
    cue: "弯形，上方一个点",
    forms: [
      { label: "独立", value: "خ" },
      { label: "词首", value: "خـ" },
      { label: "词中", value: "ـخـ" },
      { label: "词尾", value: "ـخ" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "发音较难，先听真人音频；不要用中文强行精确对应。",
    writingHint: "弯形主体上方一个点，点不能放到下方。",
    example: "خ 和 ج、چ 同组学习，重点看点在上面。"
  },
  dal: {
    id: "dal",
    letter: "د",
    latin: "d",
    type: "辅音",
    cue: "短形，无点",
    forms: [
      { label: "独立", value: "د" },
      { label: "词首", value: "د" },
      { label: "词中", value: "ـد" },
      { label: "词尾", value: "ـد" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "可先接近理解为 d；正式版以真人音频为准。",
    writingHint: "重点看短形轮廓，以及后面不继续连接。",
    example: "这一组要记住：看到断开不一定是写错。"
  },
  re: {
    id: "re",
    letter: "ر",
    latin: "r",
    type: "辅音",
    cue: "弧形，无点",
    forms: [
      { label: "独立", value: "ر" },
      { label: "词首", value: "ر" },
      { label: "词中", value: "ـر" },
      { label: "词尾", value: "ـر" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "可先接近理解为 r；正式版以真人音频为准。",
    writingHint: "用弧形轮廓和 د 区分。",
    example: "ر 后面通常不继续连接，所以后面的字母会重新开始。"
  },
  ze: {
    id: "ze",
    letter: "ز",
    latin: "z",
    type: "辅音",
    cue: "弧形，上方一个点",
    forms: [
      { label: "独立", value: "ز" },
      { label: "词首", value: "ز" },
      { label: "词中", value: "ـز" },
      { label: "词尾", value: "ـز" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "可先接近理解为 z；正式版以真人音频为准。",
    writingHint: "先看 ر 的弧形，再加上方一点。",
    example: "ز 和 ر 很像，关键是上方一个点。"
  },
  zhe: {
    id: "zhe",
    letter: "ژ",
    latin: "zh",
    type: "辅音",
    cue: "弧形，上方三个点",
    forms: [
      { label: "独立", value: "ژ" },
      { label: "词首", value: "ژ" },
      { label: "词中", value: "ـژ" },
      { label: "词尾", value: "ـژ" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "可先接近理解为 zh；正式版以真人音频为准。",
    writingHint: "和 ز 同类，关键是上方三个点。",
    example: "ژ 和 ز 放在一起学，点的数量是关键。"
  },
  sin: {
    id: "sin",
    letter: "س",
    latin: "s",
    type: "辅音",
    cue: "连续齿形，无点",
    forms: [
      { label: "独立", value: "س" },
      { label: "词首", value: "سـ" },
      { label: "词中", value: "ـسـ" },
      { label: "词尾", value: "ـس" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 s；正式版以真人音频为准。",
    writingHint: "注意连续齿形，不要写成一条直线。",
    example: "س 没有点，ش 有上方三个点。"
  },
  shin: {
    id: "shin",
    letter: "ش",
    latin: "sh",
    type: "辅音",
    cue: "连续齿形，上方三个点",
    forms: [
      { label: "独立", value: "ش" },
      { label: "词首", value: "شـ" },
      { label: "词中", value: "ـشـ" },
      { label: "词尾", value: "ـش" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 sh；正式版以真人音频为准。",
    writingHint: "先写齿形，再确认上方三个点。",
    example: "ش 和 س 的主体相似，三点决定身份。"
  },
  ghayn: {
    id: "ghayn",
    letter: "غ",
    latin: "gh",
    type: "辅音",
    cue: "圆形，上方一个点",
    forms: [
      { label: "独立", value: "غ" },
      { label: "词首", value: "غـ" },
      { label: "词中", value: "ـغـ" },
      { label: "词尾", value: "ـغ" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "发音较难，第一单元先认形，正式版以真人音频为准。",
    writingHint: "注意圆形结构和上方一点。",
    example: "غ、ف、ق 都有圆形感，先慢慢区分轮廓。"
  },
  fe: {
    id: "fe",
    letter: "ف",
    latin: "f",
    type: "辅音",
    cue: "较小圆形，上方一个点",
    forms: [
      { label: "独立", value: "ف" },
      { label: "词首", value: "فـ" },
      { label: "词中", value: "ـفـ" },
      { label: "词尾", value: "ـف" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 f；正式版以真人音频为准。",
    writingHint: "上方一点和圆形轮廓都要看。",
    example: "ف 和 ق 可通过点数、整体大小和形态一起区分。"
  },
  qaf: {
    id: "qaf",
    letter: "ق",
    latin: "q",
    type: "辅音",
    cue: "圆形，上方两个点",
    forms: [
      { label: "独立", value: "ق" },
      { label: "词首", value: "قـ" },
      { label: "词中", value: "ـقـ" },
      { label: "词尾", value: "ـق" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "发音较难，第一单元先认形，正式版以真人音频为准。",
    writingHint: "注意上方两个点和圆形收笔。",
    example: "ق 的上方两个点是这一组里的重要线索。"
  },
  kaf: {
    id: "kaf",
    letter: "ك",
    latin: "k",
    type: "辅音",
    cue: "k 系基础形",
    forms: [
      { label: "独立", value: "ك" },
      { label: "词首", value: "كـ" },
      { label: "词中", value: "ـكـ" },
      { label: "词尾", value: "ـك" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 k；正式版以真人音频为准。",
    writingHint: "先认识 k 系基础形，再和 گ、ڭ 比较。",
    example: "ك 是这一组的基础参照。"
  },
  gaf: {
    id: "gaf",
    letter: "گ",
    latin: "g",
    type: "辅音",
    cue: "k 系加线形",
    forms: [
      { label: "独立", value: "گ" },
      { label: "词首", value: "گـ" },
      { label: "词中", value: "ـگـ" },
      { label: "词尾", value: "ـگ" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 g；正式版以真人音频为准。",
    writingHint: "和 ك 相近，重点看多出的标记。",
    example: "گ 和 ك 相似，所以放在一组比较。"
  },
  ng: {
    id: "ng",
    letter: "ڭ",
    latin: "ng",
    type: "辅音",
    cue: "k 系鼻音形",
    forms: [
      { label: "独立", value: "ڭ" },
      { label: "词首", value: "ڭـ" },
      { label: "词中", value: "ـڭـ" },
      { label: "词尾", value: "ـڭ" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "ng 音需要多听真人音频，第一单元先认字母。",
    writingHint: "和 ك、گ 形态相近，注意专属标记。",
    example: "ڭ 对新手比较陌生，先把它放在 k 系里认形。"
  },
  lam: {
    id: "lam",
    letter: "ل",
    latin: "l",
    type: "辅音",
    cue: "无点竖形",
    forms: [
      { label: "独立", value: "ل" },
      { label: "词首", value: "لـ" },
      { label: "词中", value: "ـلـ" },
      { label: "词尾", value: "ـل" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 l；正式版以真人音频为准。",
    writingHint: "注意竖线高度和下方收笔。",
    example: "ل、م、ھ 都没有点，先看整体轮廓。"
  },
  mim: {
    id: "mim",
    letter: "م",
    latin: "m",
    type: "辅音",
    cue: "无点圆形",
    forms: [
      { label: "独立", value: "م" },
      { label: "词首", value: "مـ" },
      { label: "词中", value: "ـمـ" },
      { label: "词尾", value: "ـم" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 m；正式版以真人音频为准。",
    writingHint: "注意圆形部分和连接线的位置。",
    example: "م 的明显圆形可以帮助它和 ل、ھ 区分。"
  },
  he: {
    id: "he",
    letter: "ھ",
    latin: "h",
    type: "辅音",
    cue: "无点开口形",
    forms: [
      { label: "独立", value: "ھ" },
      { label: "词首", value: "ھـ" },
      { label: "词中", value: "ـھـ" },
      { label: "词尾", value: "ـھ" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 h；正式版以真人音频为准。",
    writingHint: "先看开口形和连接形，不要和 م 的圆形混淆。",
    example: "ھ 无点，但轮廓和 ل、م 不一样。"
  },
  waw: {
    id: "waw",
    letter: "ۋ",
    latin: "w / v",
    type: "辅音",
    cue: "圆形，后面通常不继续连接",
    forms: [
      { label: "独立", value: "ۋ" },
      { label: "词首", value: "ۋ" },
      { label: "词中", value: "ـۋ" },
      { label: "词尾", value: "ـۋ" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "可先接近理解为 w/v；正式版以真人音频为准。",
    writingHint: "注意它后面通常不继续连接。",
    example: "ۋ 和 ي 都在后段常见，先区分连接规则。"
  },
  ye: {
    id: "ye",
    letter: "ي",
    latin: "y",
    type: "辅音",
    cue: "下方两个点，可连接",
    forms: [
      { label: "独立", value: "ي" },
      { label: "词首", value: "يـ" },
      { label: "词中", value: "ـيـ" },
      { label: "词尾", value: "ـي" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为 y；正式版以真人音频为准。",
    writingHint: "注意下方两个点和可连接形。",
    example: "ي 后续还会和 ئى 继续对比。"
  },
  aa: {
    id: "aa",
    letter: "ئا",
    latin: "a",
    type: "元音",
    cue: "ئ + ا",
    forms: [
      { label: "独立", value: "ئا" },
      { label: "词首", value: "ئا" },
      { label: "词中", value: "ـا" },
      { label: "词尾", value: "ـا" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "先接近理解为开口 a；正式版以真人音频为准。",
    writingHint: "词首元音要带 ئ；ئ 是元音承托，不单独练。",
    example: "元音组统一认识 ئ 和元音符号。"
  },
  ae: {
    id: "ae",
    letter: "ئە",
    latin: "e",
    type: "元音",
    cue: "ئ + ە",
    forms: [
      { label: "独立", value: "ئە" },
      { label: "词首", value: "ئە" },
      { label: "词中", value: "ـە" },
      { label: "词尾", value: "ـە" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "先接近理解为 e；正式版以真人音频为准。",
    writingHint: "词首元音要带 ئ；重点看 ە 和 ا 的差别。",
    example: "ئە 和 ئا 都是词首元音入口，形态符号不同。"
  },
  o: {
    id: "o",
    letter: "ئو",
    latin: "o",
    type: "元音",
    cue: "ئ + و",
    forms: [
      { label: "独立", value: "ئو" },
      { label: "词首", value: "ئو" },
      { label: "词中", value: "ـو" },
      { label: "词尾", value: "ـو" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "圆唇元音，正式版以真人音频为准。",
    writingHint: "词首元音要带 ئ；先看 ئ 后面的 و。",
    example: "ئو、ئۇ、ئۆ、ئۈ 一起听和认。"
  },
  u: {
    id: "u",
    letter: "ئۇ",
    latin: "u",
    type: "元音",
    cue: "ئ + ۇ",
    forms: [
      { label: "独立", value: "ئۇ" },
      { label: "词首", value: "ئۇ" },
      { label: "词中", value: "ـۇ" },
      { label: "词尾", value: "ـۇ" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "圆唇元音，正式版以真人音频为准。",
    writingHint: "词首元音要带 ئ；先看 ئ 后面的 ۇ。",
    example: "ئۇ 和 ئو 视觉接近，要配音频慢慢区分。"
  },
  oe: {
    id: "oe",
    letter: "ئۆ",
    latin: "ö",
    type: "元音",
    cue: "ئ + ۆ",
    forms: [
      { label: "独立", value: "ئۆ" },
      { label: "词首", value: "ئۆ" },
      { label: "词中", value: "ـۆ" },
      { label: "词尾", value: "ـۆ" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "圆唇元音，正式版以真人音频为准。",
    writingHint: "词首元音要带 ئ；先看 ئ 后面的 ۆ。",
    example: "ئۆ 和 ئۈ 都要配合真人音频学习。"
  },
  ue: {
    id: "ue",
    letter: "ئۈ",
    latin: "ü",
    type: "元音",
    cue: "ئ + ۈ",
    forms: [
      { label: "独立", value: "ئۈ" },
      { label: "词首", value: "ئۈ" },
      { label: "词中", value: "ـۈ" },
      { label: "词尾", value: "ـۈ" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "圆唇元音，正式版以真人音频为准。",
    writingHint: "词首元音要带 ئ；先看 ئ 后面的 ۈ。",
    example: "ئۈ 和 ئۇ 视觉接近，先认符号，再听音。"
  },
  ee: {
    id: "ee",
    letter: "ئې",
    latin: "ë",
    type: "元音",
    cue: "ئ + ې",
    forms: [
      { label: "独立", value: "ئې" },
      { label: "词首", value: "ئېـ" },
      { label: "词中", value: "ـېـ" },
      { label: "词尾", value: "ـې" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "正式版以真人音频为准。",
    writingHint: "词首元音要带 ئ；先看 ئ 后面的 ې。",
    example: "ئې 放在元音组里统一学习。"
  },
  ii: {
    id: "ii",
    letter: "ئى",
    latin: "i",
    type: "元音",
    cue: "ئ + ى",
    forms: [
      { label: "独立", value: "ئى" },
      { label: "词首", value: "ئىـ" },
      { label: "词中", value: "ـىـ" },
      { label: "词尾", value: "ـى" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "正式版以真人音频为准。",
    writingHint: "词首元音要带 ئ；ئى 是元音入口，ي 是辅音。",
    example: "ئى 和 ي 很容易混，第一单元先认身份。"
  }
};

const letterFormExamples = {
  be: [
    { label: "独立", form: "ب", word: "ب", latin: "b", meaning: "单独写" },
    { label: "词首", form: "بـ", word: "بەش", latin: "besh", meaning: "五" },
    { label: "词中", form: "ـبـ", word: "پۇتبول", latin: "putbol", meaning: "足球" },
    { label: "词尾", form: "ـب", word: "قەلب", latin: "qelb", meaning: "心、内心" }
  ],
  pe: [
    { label: "独立", form: "پ", word: "پ", latin: "p", meaning: "单独写" },
    { label: "词首", form: "پـ", word: "پارتا", latin: "parta", meaning: "课桌" },
    { label: "词中", form: "ـپـ", word: "قالپاق", latin: "qalpaq", meaning: "帽子" },
    { label: "词尾", form: "ـپ", word: "كېلىپ", latin: "këlip", meaning: "来后、来到" }
  ],
  te: [
    { label: "独立", form: "ت", word: "ت", latin: "t", meaning: "单独写" },
    { label: "词首", form: "تـ", word: "تاۋۇز", latin: "tawuz", meaning: "西瓜" },
    { label: "词中", form: "ـتـ", word: "خالتا", latin: "xalta", meaning: "袋子" },
    { label: "词尾", form: "ـت", word: "ۋاقىت", latin: "waqit", meaning: "时间" }
  ],
  nun: [
    { label: "独立", form: "ن", word: "ن", latin: "n", meaning: "单独写" },
    { label: "词首", form: "نـ", word: "نان", latin: "nan", meaning: "馕" },
    { label: "词中", form: "ـنـ", word: "ئەينەك", latin: "eynek", meaning: "玻璃、眼镜" },
    { label: "词尾", form: "ـن", word: "تىيىن", latin: "tiyin", meaning: "松鼠；分" }
  ],
  jim: [
    { label: "独立", form: "ج", word: "ج", latin: "j", meaning: "单独写" },
    { label: "词首", form: "جـ", word: "جۈمە", latin: "jüme", meaning: "星期五" },
    { label: "词中", form: "ـجـ", word: "بادامجان", latin: "badamjan", meaning: "茄子" },
    { label: "词尾", form: "ـج", word: "پەنج", latin: "penj", meaning: "五、波斯语借词" }
  ],
  che: [
    { label: "独立", form: "چ", word: "چ", latin: "ch", meaning: "单独写" },
    { label: "词首", form: "چـ", word: "چاچ", latin: "chach", meaning: "头发" },
    { label: "词中", form: "ـچـ", word: "ئىچىش", latin: "ichish", meaning: "喝" },
    { label: "词尾", form: "ـچ", word: "ساندۋىچ", latin: "sandwich", meaning: "三明治" }
  ],
  khe: [
    { label: "独立", form: "خ", word: "خ", latin: "x", meaning: "单独写" },
    { label: "词首", form: "خـ", word: "خوجايىن", latin: "xojayin", meaning: "老板、主人" },
    { label: "词中", form: "ـخـ", word: "ئاشخانا", latin: "ashxana", meaning: "厨房、餐厅" },
    { label: "词尾", form: "ـخ", word: "دەرەخ", latin: "derex", meaning: "树" }
  ],
  dal: [
    { label: "独立", form: "د", word: "د", latin: "d", meaning: "单独写" },
    { label: "词首", form: "د", word: "دادا", latin: "dada", meaning: "爸爸" },
    { label: "词中", form: "ـد", word: "چايدان", latin: "chaydan", meaning: "茶壶" },
    { label: "词尾", form: "ـد", word: "ئەھد", latin: "ehd", meaning: "誓约、承诺" }
  ],
  re: [
    { label: "独立", form: "ر", word: "ر", latin: "r", meaning: "单独写" },
    { label: "词首", form: "ر", word: "رەڭ", latin: "reng", meaning: "颜色" },
    { label: "词中", form: "ـر", word: "بىرلىك", latin: "birlik", meaning: "团结" },
    { label: "词尾", form: "ـر", word: "شىر", latin: "shir", meaning: "狮子" }
  ],
  ze: [
    { label: "独立", form: "ز", word: "ز", latin: "z", meaning: "单独写" },
    { label: "词首", form: "ز", word: "زوق", latin: "zoq", meaning: "兴趣、兴致" },
    { label: "词中", form: "ـز", word: "سىزنىڭ", latin: "sizning", meaning: "您的、你们的" },
    { label: "词尾", form: "ـز", word: "قىز", latin: "qiz", meaning: "女孩" }
  ],
  zhe: [
    { label: "独立", form: "ژ", word: "ژ", latin: "zh", meaning: "单独写" },
    { label: "词首", form: "ژ", word: "ژۇرنال", latin: "zhurnal", meaning: "杂志" },
    { label: "词中", form: "ـژ", word: "پىژغىرىم", latin: "pizhghirim", meaning: "炎热、灼热" },
    { label: "词尾", form: "ـژ", word: "پارىژ", latin: "parizh", meaning: "巴黎" }
  ],
  sin: [
    { label: "独立", form: "س", word: "س", latin: "s", meaning: "单独写" },
    { label: "词首", form: "سـ", word: "سىز", latin: "siz", meaning: "您、你们" },
    { label: "词中", form: "ـسـ", word: "سامساق", latin: "samsaq", meaning: "大蒜" },
    { label: "词尾", form: "ـس", word: "قالتىس", latin: "qaltis", meaning: "很棒" }
  ],
  shin: [
    { label: "独立", form: "ش", word: "ش", latin: "sh", meaning: "单独写" },
    { label: "词首", form: "شـ", word: "شار", latin: "shar", meaning: "气球" },
    { label: "词中", form: "ـشـ", word: "ئىشچى", latin: "ishchi", meaning: "工人" },
    { label: "词尾", form: "ـش", word: "تاش", latin: "tash", meaning: "石头" }
  ],
  ghayn: [
    { label: "独立", form: "غ", word: "غ", latin: "gh", meaning: "单独写" },
    { label: "词首", form: "غـ", word: "غاز", latin: "ghaz", meaning: "鹅" },
    { label: "词中", form: "ـغـ", word: "يامغۇر", latin: "yamghur", meaning: "雨" },
    { label: "词尾", form: "ـغ", word: "ئاياغ", latin: "ayagh", meaning: "鞋" }
  ],
  fe: [
    { label: "独立", form: "ف", word: "ف", latin: "f", meaning: "单独写" },
    { label: "词首", form: "فـ", word: "فامىلە", latin: "famile", meaning: "姓氏" },
    { label: "词中", form: "ـفـ", word: "ئاسفالت", latin: "asfalt", meaning: "沥青路" },
    { label: "词尾", form: "ـف", word: "گولف", latin: "golf", meaning: "高尔夫" }
  ],
  qaf: [
    { label: "独立", form: "ق", word: "ق", latin: "q", meaning: "单独写" },
    { label: "词首", form: "قـ", word: "قول", latin: "qol", meaning: "手" },
    { label: "词中", form: "ـقـ", word: "قەشقەر", latin: "qeshqer", meaning: "喀什" },
    { label: "词尾", form: "ـق", word: "ئاق", latin: "aq", meaning: "白色" }
  ],
  kaf: [
    { label: "独立", form: "ك", word: "ك", latin: "k", meaning: "单独写" },
    { label: "词首", form: "كـ", word: "كۆك", latin: "kök", meaning: "蓝色、天空" },
    { label: "词中", form: "ـكـ", word: "ئىككى", latin: "ikki", meaning: "二" },
    { label: "词尾", form: "ـك", word: "ئىشىك", latin: "ishik", meaning: "门" }
  ],
  gaf: [
    { label: "独立", form: "گ", word: "گ", latin: "g", meaning: "单独写" },
    { label: "词首", form: "گـ", word: "گىلەم", latin: "gilem", meaning: "地毯" },
    { label: "词中", form: "ـگـ", word: "ئۈلگە", latin: "ülge", meaning: "榜样" },
    { label: "词尾", form: "ـگ", word: "لېيپزىگ", latin: "leyipzig", meaning: "莱比锡" }
  ],
  ng: [
    { label: "独立", form: "ڭ", word: "ڭ", latin: "ng", meaning: "单独写" },
    { label: "词首", form: "ڭـ", noteType: "rule", noteTitle: "不作词首", note: "现代维语通常不这样开头" },
    { label: "词中", form: "ـڭـ", word: "يىڭنە", latin: "yingne", meaning: "针" },
    { label: "词尾", form: "ـڭ", word: "مىڭ", latin: "ming", meaning: "千" }
  ],
  lam: [
    { label: "独立", form: "ل", word: "ل", latin: "l", meaning: "单独写" },
    { label: "词首", form: "لـ", word: "لازا", latin: "laza", meaning: "辣椒" },
    { label: "词中", form: "ـلـ", word: "بىلىم", latin: "bilim", meaning: "知识" },
    { label: "词尾", form: "ـل", word: "كۆل", latin: "köl", meaning: "湖" }
  ],
  mim: [
    { label: "独立", form: "م", word: "م", latin: "m", meaning: "单独写" },
    { label: "词首", form: "مـ", word: "مۈشۈك", latin: "müshük", meaning: "猫" },
    { label: "词中", form: "ـمـ", word: "مايمۇن", latin: "maymun", meaning: "猴子" },
    { label: "词尾", form: "ـم", word: "قەلەم", latin: "qelem", meaning: "笔" }
  ],
  he: [
    { label: "独立", form: "ھ", word: "ھ", latin: "h", meaning: "单独写" },
    { label: "词首", form: "ھـ", word: "ھەرە", latin: "here", meaning: "蜜蜂" },
    { label: "词中", form: "ـھـ", word: "دېھقان", latin: "dëhqan", meaning: "农民" },
    { label: "词尾", form: "ـھ", word: "ئابدۇللاھ", latin: "abdullah", meaning: "阿卜杜拉" }
  ],
  waw: [
    { label: "独立", form: "ۋ", word: "ۋ", latin: "w", meaning: "单独写" },
    { label: "词首", form: "ۋ", word: "ۋەتەن", latin: "weten", meaning: "家园、祖国" },
    { label: "词中", form: "ـۋ", word: "مېۋە", latin: "mëwe", meaning: "水果" },
    { label: "词尾", form: "ـۋ", word: "ئوۋ", latin: "ow", meaning: "狩猎、打猎" }
  ],
  ye: [
    { label: "独立", form: "ي", word: "ي", latin: "y", meaning: "单独写" },
    { label: "词首", form: "يـ", word: "يىل", latin: "yil", meaning: "年" },
    { label: "词中", form: "ـيـ", word: "كومپيۇتېر", latin: "kompyutër", meaning: "电脑" },
    { label: "词尾", form: "ـي", word: "قوي", latin: "qoy", meaning: "羊" }
  ],
  aa: [
    { label: "独立", form: "ئا", word: "ئا", latin: "a", meaning: "ئ + ا" },
    { label: "词首", form: "ئا", word: "ئانا", latin: "ana", meaning: "妈妈" },
    { label: "词中", form: "ـا", word: "قارا", latin: "qara", meaning: "黑色" },
    { label: "词尾", form: "ـا", word: "ئالما", latin: "alma", meaning: "苹果" }
  ],
  ae: [
    { label: "独立", form: "ئە", word: "ئە", latin: "e", meaning: "ئ + ە" },
    { label: "词首", form: "ئە", word: "ئەدەبىيات", latin: "edebiyat", meaning: "文学" },
    { label: "词中", form: "ـە", word: "مەن", latin: "men", meaning: "我" },
    { label: "词尾", form: "ـە", word: "ئائىلە", latin: "aile", meaning: "家庭" }
  ],
  o: [
    { label: "独立", form: "ئو", word: "ئو", latin: "o", meaning: "ئ + و" },
    { label: "词首", form: "ئو", word: "ئوت", latin: "ot", meaning: "火" },
    { label: "词中", form: "ـو", word: "قوغۇن", latin: "qoghun", meaning: "甜瓜" },
    { label: "词尾", form: "ـو", word: "كىنو", latin: "kino", meaning: "电影" }
  ],
  u: [
    { label: "独立", form: "ئۇ", word: "ئۇ", latin: "u", meaning: "ئ + ۇ" },
    { label: "词首", form: "ئۇ", word: "ئۇيغۇر", latin: "uyghur", meaning: "维吾尔" },
    { label: "词中", form: "ـۇ", word: "پۇل", latin: "pul", meaning: "钱" },
    { label: "词尾", form: "ـۇ", word: "سۇ", latin: "su", meaning: "水" }
  ],
  oe: [
    { label: "独立", form: "ئۆ", word: "ئۆ", latin: "ö", meaning: "ئ + ۆ" },
    { label: "词首", form: "ئۆ", word: "ئۆي", latin: "öy", meaning: "家" },
    { label: "词中", form: "ـۆ", word: "تۆگە", latin: "töge", meaning: "骆驼" },
    { label: "词尾", form: "ـۆ", noteType: "rare", noteTitle: "词尾少见", note: "入门常用词里较少见，先掌握字形" }
  ],
  ue: [
    { label: "独立", form: "ئۈ", word: "ئۈ", latin: "ü", meaning: "ئ + ۈ" },
    { label: "词首", form: "ئۈ", word: "ئۈمىد", latin: "ümid", meaning: "希望" },
    { label: "词中", form: "ـۈ", word: "گۈل", latin: "gül", meaning: "花" },
    { label: "词尾", form: "ـۈ", noteType: "rare", noteTitle: "词尾少见", note: "入门常用词里较少见，先掌握字形。" }
  ],
  ee: [
    { label: "独立", form: "ئې", word: "ئې", latin: "ë", meaning: "ئ + ې" },
    { label: "词首", form: "ئېـ", word: "ئېتىز", latin: "ëtiz", meaning: "田地" },
    { label: "词中", form: "ـېـ", word: "تېز", latin: "tëz", meaning: "快" },
    { label: "词尾", form: "ـې", word: "نې", latin: "në", meaning: "什么、哪" }
  ],
  ii: [
    { label: "独立", form: "ئى", word: "ئى", latin: "i", meaning: "ئ + ى" },
    { label: "词首", form: "ئىـ", word: "ئىز", latin: "iz", meaning: "足迹" },
    { label: "词中", form: "ـىـ", word: "چىرايلىق", latin: "chirayliq", meaning: "漂亮" },
    { label: "词尾", form: "ـى", word: "قايسى", latin: "qaysi", meaning: "哪一个" }
  ]
};

const oldLetterFormExamples = letterFormExamples;
const nonForwardLetterIds = new Set(["dal", "re", "ze", "zhe", "waw"]);
const carrierVowelForms = {
  aa: { base: "ا", isolated: "ئا" },
  ae: { base: "ە", isolated: "ئە" },
  o: { base: "و", isolated: "ئو" },
  u: { base: "ۇ", isolated: "ئۇ" },
  oe: { base: "ۆ", isolated: "ئۆ" },
  ue: { base: "ۈ", isolated: "ئۈ" }
};
const extendedVowelForms = {
  ee: { base: "ې", isolated: "ئې" },
  ii: { base: "ى", isolated: "ئى" }
};

function oldExample(letterId, label) {
  return oldLetterFormExamples[letterId]?.find((example) => example.label === label);
}

function formOnlyExample(label, form, meaning = "字形") {
  return { label, form, word: form.replaceAll("ـ", "") || form, meaning };
}

function exampleFromOld(letterId, label, form, oldLabel) {
  const source = oldExample(letterId, oldLabel);
  if (!source || source.note) {
    return formOnlyExample(label, form);
  }

  return {
    label,
    form,
    word: source.word,
    latin: source.latin,
    meaning: source.meaning
  };
}

function simpleCarrierExample(label, form) {
  return formOnlyExample(label, form, "简单独立字形");
}

const sourceFormExampleOverrides = {
  aa: {
    "独立式": { word: "ئانا", latin: "ana", meaning: "妈妈" },
    "简单独立式": { word: "قارا", latin: "qara", meaning: "黑色" },
    "前连式": { word: "ئالما", latin: "alma", meaning: "苹果" },
    "隔音前连式": { word: "خەلقئارا", latin: "xelq'ara", meaning: "国际" }
  },
  ae: {
    "独立式": { word: "ئەدەبىيات", latin: "edebiyat", meaning: "文学" },
    "简单独立式": { word: "رەسىم", latin: "resim", meaning: "图片" },
    "前连式": { word: "مەن", latin: "men", meaning: "我" },
    "隔音前连式": { word: "مەشئەل", latin: "mesh'el", meaning: "火炬" }
  },
  be: {
    "独立式": { word: "كىتاب", latin: "kitab", meaning: "书" },
    "后连式": { word: "بەش", latin: "besh", meaning: "五" },
    "双连式": { word: "پۇتبول", latin: "putbol", meaning: "足球" },
    "前连式": { word: "قەلب", latin: "qelb", meaning: "心" }
  },
  pe: {
    "独立式": { word: "كۆپ", latin: "köp", meaning: "多" },
    "后连式": { word: "پارتا", latin: "parta", meaning: "课桌" },
    "双连式": { word: "قالپاق", latin: "qalpaq", meaning: "帽子" },
    "前连式": { word: "يىپ", latin: "yip", meaning: "线" }
  },
  te: {
    "独立式": { word: "ئات", latin: "at", meaning: "马" },
    "后连式": { word: "تاۋۇز", latin: "tawuz", meaning: "西瓜" },
    "双连式": { word: "خالتا", latin: "xalta", meaning: "袋子" },
    "前连式": { word: "ئىت", latin: "it", meaning: "狗" }
  },
  nun: {
    "独立式": { word: "نان", latin: "nan", meaning: "馕" },
    "后连式": { word: "بانان", latin: "banan", meaning: "香蕉" },
    "双连式": { word: "ئەينەك", latin: "eynek", meaning: "镜子" },
    "前连式": { word: "تىيىن", latin: "tiyin", meaning: "松鼠" }
  },
  jim: {
    "独立式": { word: "تاج", latin: "taj", meaning: "皇冠" },
    "后连式": { word: "جۈمە", latin: "jüme", meaning: "星期五" },
    "双连式": { word: "بۆلجۈرگەن", latin: "böljürgen", meaning: "草莓" },
    "前连式": { word: "ئانكورېج", latin: "ankorëj", meaning: "安克雷奇" }
  },
  che: {
    "独立式": { word: "چاچ", latin: "chach", meaning: "头发" },
    "后连式": { word: "چارچاش", latin: "charchash", meaning: "疲劳" },
    "双连式": { word: "پايچىك", latin: "paychik", meaning: "股东" },
    "前连式": { word: "ساندۋىچ", latin: "sandwich", meaning: "三明治" }
  },
  khe: {
    "独立式": { word: "دەرەخ", latin: "derex", meaning: "树" },
    "后连式": { word: "خوجايىن", latin: "xojayin", meaning: "老板" },
    "双连式": { word: "ئاشخانا", latin: "ashxana", meaning: "饭馆" },
    "前连式": { word: "بىخ", latin: "bix", meaning: "芽" }
  },
  dal: {
    "独立式": { word: "دادا", latin: "dada", meaning: "爸爸" },
    "前连式": { word: "چايدان", latin: "chaydan", meaning: "保温瓶" }
  },
  re: {
    "独立式": { word: "رەڭ", latin: "reng", meaning: "颜色" },
    "前连式": { word: "شىر", latin: "shir", meaning: "狮子" }
  },
  ze: {
    "独立式": { word: "كۆز", latin: "köz", meaning: "眼睛" },
    "前连式": { word: "قىز", latin: "qiz", meaning: "女孩" }
  },
  zhe: {
    "独立式": { word: "ژۇرنال", latin: "zhurnal", meaning: "杂志" },
    "前连式": { word: "پارىژ", latin: "parizh", meaning: "巴黎" }
  },
  sin: {
    "独立式": { word: "يولۋاس", latin: "yolwas", meaning: "老虎" },
    "后连式": { word: "سىز", latin: "siz", meaning: "你、您" },
    "双连式": { word: "سامساق", latin: "samsaq", meaning: "大蒜" },
    "前连式": { word: "قالتىس", latin: "qaltis", meaning: "很棒" }
  },
  shin: {
    "独立式": { word: "تاش", latin: "tash", meaning: "石头" },
    "后连式": { word: "شار", latin: "shar", meaning: "气球" },
    "双连式": { word: "ئىشچى", latin: "ishchi", meaning: "工人" },
    "前连式": { word: "چىش", latin: "chish", meaning: "牙" }
  },
  ghayn: {
    "独立式": { word: "ئاياغ", latin: "ayagh", meaning: "鞋" },
    "后连式": { word: "غاز", latin: "ghaz", meaning: "鹅" },
    "双连式": { word: "يامغۇر", latin: "yamghur", meaning: "雨" },
    "前连式": { word: "تىغ", latin: "tigh", meaning: "刀片" }
  },
  fe: {
    "独立式": { word: "تېلېگراف", latin: "tëlëgraf", meaning: "电信" },
    "后连式": { word: "فامىلە", latin: "famile", meaning: "姓" },
    "双连式": { word: "ئاسفالت", latin: "asfalt", meaning: "沥青" },
    "前连式": { word: "گولف", latin: "golf", meaning: "高尔夫" }
  },
  qaf: {
    "独立式": { word: "ئاق", latin: "aq", meaning: "白色" },
    "后连式": { word: "قول", latin: "qol", meaning: "手" },
    "双连式": { word: "قەشقەر", latin: "qeshqer", meaning: "喀什" },
    "前连式": { word: "ئېيىق", latin: "ëyiq", meaning: "熊" }
  },
  kaf: {
    "独立式": { word: "كۆك", latin: "kök", meaning: "蓝色" },
    "后连式": { word: "كابىنكا", latin: "kabinka", meaning: "舱" },
    "双连式": { word: "ئىككى", latin: "ikki", meaning: "二" },
    "前连式": { word: "ئىشىك", latin: "ishik", meaning: "门" }
  },
  gaf: {
    "独立式": { word: "بىئولوگ", latin: "bi'olog", meaning: "生物学家" },
    "后连式": { word: "گىلەم", latin: "gilem", meaning: "地毯" },
    "双连式": { word: "ئۈلگە", latin: "ülge", meaning: "榜样" },
    "前连式": { word: "لېيپزىگ", latin: "lëypzig", meaning: "莱比锡" }
  },
  ng: {
    "独立式": { word: "يەڭ", latin: "yeng", meaning: "袖子" },
    "后连式": { word: "ياڭاق", latin: "yangaq", meaning: "核桃" },
    "双连式": { word: "يىڭنە", latin: "yingne", meaning: "针" },
    "前连式": { word: "مىڭ", latin: "ming", meaning: "千" }
  },
  lam: {
    "独立式": { word: "كۆل", latin: "köl", meaning: "湖" },
    "后连式": { word: "خەلق", latin: "xelq", meaning: "人民" },
    "双连式": { word: "بىلىم", latin: "bilim", meaning: "知识" },
    "前连式": { word: "پىل", latin: "pil", meaning: "大象" }
  },
  mim: {
    "独立式": { word: "قەلەم", latin: "qelem", meaning: "笔" },
    "后连式": { word: "مۈشۈك", latin: "müshük", meaning: "猫" },
    "双连式": { word: "مايمۇن", latin: "maymun", meaning: "猴子" },
    "前连式": { word: "تارىم", latin: "tarim", meaning: "塔里木" }
  },
  he: {
    "独立式": { word: "ئابدۇللاھ", latin: "abdullah", meaning: "阿卜杜拉" },
    "后连式": { word: "ھەرە", latin: "here", meaning: "蜜蜂" },
    "双连式": { word: "دېھقان", latin: "dëhqan", meaning: "农民" },
    "前连式": { word: "تەنبىھ", latin: "tenbih", meaning: "训诫" }
  },
  o: {
    "独立式": { word: "ئوت", latin: "ot", meaning: "火" },
    "简单独立式": { word: "دورا", meaning: "药" },
    "前连式": { word: "قوغۇن", latin: "qoghun", meaning: "甜瓜" },
    "隔音前连式": { word: "گېئولوگىيە", meaning: "地质学" }
  },
  u: {
    "独立式": { word: "ئۇيغۇر", latin: "uyghur", meaning: "维吾尔" },
    "简单独立式": { word: "دۇمباق", meaning: "鼓" },
    "前连式": { word: "پۇل", latin: "pul", meaning: "钱" },
    "隔音前连式": { word: "مەسئۇلىيەت", meaning: "责任" }
  },
  oe: {
    "独立式": { word: "ئۆي", latin: "öy", meaning: "家" },
    "简单独立式": { word: "دۆلەت", latin: "dölet", meaning: "国家" },
    "前连式": { word: "تۆگە", latin: "töge", meaning: "骆驼" },
    "隔音前连式": { word: "قىزىلئۆڭگەچ", meaning: "食管" }
  },
  ue: {
    "独立式": { word: "ئۈمىد", latin: "ümid", meaning: "希望" },
    "简单独立式": { word: "ئۈزۈم", latin: "üzüm", meaning: "葡萄" },
    "前连式": { word: "گۈل", latin: "gül", meaning: "花" },
    "隔音前连式": { word: "نائۈمىد", meaning: "无望" }
  },
  waw: {
    "独立式": { word: "ۋەتەن", latin: "weten", meaning: "祖国" },
    "前连式": { word: "مېۋە", latin: "mëwe", meaning: "水果" }
  },
  ee: {
    "独立式": { word: "ئې چيەنچيۇ", latin: "ë cyencyu", meaning: "鄂千秋" },
    "简单独立式": { word: "چېڭدې", latin: "chëngdë", meaning: "承德" },
    "后连式": { word: "ئېتىز", latin: "ëtiz", meaning: "田地" },
    "简单后连式": { word: "دېڭىز", latin: "dëngiz", meaning: "海" },
    "双连式": { word: "تېز", latin: "tëz", meaning: "快" },
    "隔音双连式": { word: "مۈشۈكئېيىق", meaning: "熊猫" },
    "前连式": { word: "چاڭجياجې", latin: "jangjyajë", meaning: "张家界" },
    "隔音前连式": { word: "چاڭئې", meaning: "嫦娥" }
  },
  ii: {
    "独立式": { word: "ئى نائومى", latin: "i na'omi", meaning: "井尚美" },
    "简单独立式": { word: "مالاۋى", meaning: "马拉维" },
    "后连式": { word: "ئىز", latin: "iz", meaning: "痕迹" },
    "简单后连式": { word: "پىڭۋىن", meaning: "企鹅" },
    "双连式": { word: "چىرايلىق", latin: "chirayliq", meaning: "美丽" },
    "隔音双连式": { word: "پېئىل", meaning: "动词" },
    "前连式": { word: "قايسى", latin: "qaysi", meaning: "哪个" },
    "隔音前连式": { word: "مەنئى", meaning: "禁止" }
  },
  ye: {
    "独立式": { word: "قوي", latin: "qoy", meaning: "羊" },
    "后连式": { word: "يىل", latin: "yil", meaning: "年" },
    "双连式": { word: "كومپيۇتېر", latin: "kompyutër", meaning: "电脑" },
    "前连式": { word: "ناترىي", latin: "natriy", meaning: "钠" }
  }
};

function standardJoinedForms(letterId, letter) {
  return [
    { label: "独立式", value: letter.letter, oldLabel: "独立" },
    { label: "后连式", value: oldExample(letterId, "词首")?.form || `${letter.letter}ـ`, oldLabel: "词首" },
    { label: "双连式", value: oldExample(letterId, "词中")?.form || `ـ${letter.letter}ـ`, oldLabel: "词中" },
    { label: "前连式", value: oldExample(letterId, "词尾")?.form || `ـ${letter.letter}`, oldLabel: "词尾" }
  ];
}

function nonForwardForms(letterId, letter) {
  return [
    { label: "独立式", value: letter.letter, oldLabel: "词首" },
    { label: "前连式", value: oldExample(letterId, "词尾")?.form || oldExample(letterId, "词中")?.form || `ـ${letter.letter}`, oldLabel: "词尾" }
  ];
}

function carrierForms(letterId, spec) {
  return [
    { label: "独立式", value: spec.isolated, oldLabel: "词首" },
    { label: "简单独立式", value: spec.base, simple: true },
    { label: "前连式", value: oldExample(letterId, "词中")?.form || `ـ${spec.base}`, oldLabel: "词中" },
    { label: "隔音前连式", value: `ـ${spec.isolated}`, formOnlyMeaning: "隔音前连字形" }
  ];
}

function extendedForms(letterId, spec) {
  return [
    { label: "独立式", value: spec.isolated, oldLabel: "词首" },
    { label: "简单独立式", value: spec.base, simple: true },
    { label: "后连式", value: `${spec.isolated}ـ`, oldLabel: "词首" },
    { label: "简单后连式", value: `${spec.base}ـ`, formOnlyMeaning: "简单后连字形" },
    { label: "双连式", value: `ـ${spec.base}ـ`, oldLabel: "词中" },
    { label: "隔音双连式", value: `ـئ${spec.base}ـ`, oldLabel: "词中" },
    { label: "前连式", value: `ـ${spec.base}`, oldLabel: "词尾" },
    { label: "隔音前连式", value: `ـ${spec.isolated}`, formOnlyMeaning: "隔音前连字形" }
  ];
}

function completeFormsForLetter(letterId, letter) {
  if (extendedVowelForms[letterId]) return extendedForms(letterId, extendedVowelForms[letterId]);
  if (carrierVowelForms[letterId]) return carrierForms(letterId, carrierVowelForms[letterId]);
  if (nonForwardLetterIds.has(letterId)) return nonForwardForms(letterId, letter);
  return standardJoinedForms(letterId, letter);
}

const formIdByLabel = {
  "独立式": "isolated",
  "简单独立式": "simple-isolated",
  "后连式": "right-joined",
  "简单后连式": "simple-right-joined",
  "双连式": "dual-joined",
  "隔音双连式": "hamza-dual-joined",
  "前连式": "left-joined",
  "隔音前连式": "hamza-left-joined"
};

for (const [letterId, letter] of Object.entries(letterDetails)) {
  const forms = completeFormsForLetter(letterId, letter);
  letter.forms = forms.map(({ label, value }) => ({ id: formIdByLabel[label], label, value }));
  letterFormExamples[letterId] = forms.map((form) => ({
    id: `${letterId}:${formIdByLabel[form.label]}`,
    ...(form.simple
      ? simpleCarrierExample(form.label, form.value)
      : form.formOnlyMeaning
        ? formOnlyExample(form.label, form.value, form.formOnlyMeaning)
        : exampleFromOld(letterId, form.label, form.value, form.oldLabel))
  }));
}

for (const [letterId, overrides] of Object.entries(sourceFormExampleOverrides)) {
  letterFormExamples[letterId] = letterFormExamples[letterId].map((example) => {
    const override = overrides[example.label];
    const replacesWordWithoutLatin =
      override?.word && override.word !== example.word && !Object.prototype.hasOwnProperty.call(override, "latin");

    return {
      ...example,
      ...override,
      ...(replacesWordWithoutLatin ? { latin: "" } : {})
    };
  });
}

const nonForwardFormCharacters = new Set(["ئ", "ا", "ە", "د", "ر", "ز", "ژ", "و", "ۇ", "ۆ", "ۈ", "ۋ"]);
const knownFormCharacters = new Set(
  Object.values(letterDetails).flatMap((letter) => [...letter.letter])
);
const targetConnectionsByLabel = {
  "独立式": [false, false],
  "简单独立式": [false, false],
  "后连式": [false, true],
  "简单后连式": [false, true],
  "双连式": [true, true],
  "前连式": [true, false]
};

function formCharacterConnectsForward(character) {
  return knownFormCharacters.has(character) && !nonForwardFormCharacters.has(character);
}

function formCharacterAcceptsConnection(character) {
  return knownFormCharacters.has(character) && character !== "ئ";
}

function targetOccurrences(word, target) {
  const starts = [];
  let searchFrom = 0;

  while (searchFrom <= word.length - target.length) {
    const start = word.indexOf(target, searchFrom);
    if (start === -1) break;
    starts.push(start);
    searchFrom = start + target.length;
  }

  return starts;
}

function targetConnections(word, target, start) {
  const end = start + target.length;
  const previous = start > 0 ? word[start - 1] : "";
  const next = end < word.length ? word[end] : "";

  return [
    Boolean(previous) &&
      formCharacterConnectsForward(previous) &&
      formCharacterAcceptsConnection(target[0]),
    Boolean(next) &&
      formCharacterConnectsForward(target[target.length - 1]) &&
      formCharacterAcceptsConnection(next)
  ];
}

function locateFormExampleTarget(example) {
  if (example.note || !example.word) return example;

  const target = example.form.replaceAll("ـ", "");
  const starts = targetOccurrences(example.word, target);
  if (starts.length === 0) return example;

  const desiredConnections = targetConnectionsByLabel[example.label];
  const eligibleStarts = starts.filter((start) => {
    if (example.label.startsWith("简单") && start > 0 && example.word[start - 1] === "ئ") {
      return false;
    }
    if (!desiredConnections) return true;

    const actualConnections = targetConnections(example.word, target, start);
    return (
      actualConnections[0] === desiredConnections[0] &&
      actualConnections[1] === desiredConnections[1]
    );
  });
  const targetStart = eligibleStarts[0] ?? starts[0];

  return {
    ...example,
    targetStart,
    targetLength: target.length
  };
}

for (const [letterId, formExamples] of Object.entries(letterFormExamples)) {
  letterFormExamples[letterId] = formExamples.map(locateFormExampleTarget);
}

for (const [letterId, formExamples] of Object.entries(letterFormExamples)) {
  letterDetails[letterId].formExamples = formExamples;
}

for (const letter of Object.values(letterDetails)) {
  if (letter.type !== "辅音") continue;

  if (!letter.soundHint.includes("辅音不能单独成音节")) {
    letter.soundHint = `${letter.soundHint} 辅音不能单独成音节，练读时要和元音一起听。`;
  }

  const isolatedExample = letter.formExamples?.find((example) => example.label === "独立式");
  if (isolatedExample?.meaning === "单独写") {
    isolatedExample.meaning = "独立字形，不单独成音节";
  }
}

function letters(ids) {
  return ids.map((id) => letterDetails[id]);
}

const alphabetGroups = [
  { id: "vowels-basic", title: "ئا / ئە", letters: letters(["aa", "ae"]), goal: "先认识最基础的词首元音入口", status: "可学习" },
  { id: "dot-bone", title: "ب / پ / ت", letters: letters(["be", "pe", "te"]), goal: "同类主体，点多点少都放一起比较", status: "当前" },
  { id: "curved", title: "ج / چ / خ", letters: letters(["jim", "che", "khe"]), goal: "相似弯形，重点看点在上方还是下方", status: "可学习" },
  { id: "breakers", title: "د / ر / ز / ژ", letters: letters(["dal", "re", "ze", "zhe"]), goal: "理解这些字母后面通常不继续连接", status: "可学习" },
  { id: "teeth", title: "س / ش", letters: letters(["sin", "shin"]), goal: "区分无点齿形和三点齿形", status: "可学习" },
  { id: "round-dots", title: "غ / ف / ق", letters: letters(["ghayn", "fe", "qaf"]), goal: "先认形，发音以真人音频为准", status: "可学习" },
  { id: "k-family", title: "ك / گ / ڭ", letters: letters(["kaf", "gaf", "ng"]), goal: "区分 k、g、ng 的形态", status: "可学习" },
  { id: "no-dot", title: "ل / م", letters: letters(["lam", "mim"]), goal: "用整体轮廓区分无点字母", status: "可学习" },
  { id: "nun-he", title: "ن / ھ", letters: letters(["nun", "he"]), goal: "按总表顺序认识 n 和 h", status: "可学习" },
  { id: "vowels-round", title: "ئو / ئۇ / ئۆ / ئۈ", letters: letters(["o", "u", "oe", "ue"]), goal: "圆唇元音放在一起听和认", status: "可学习" },
  { id: "tail", title: "ۋ / ئې / ئى / ي", letters: letters(["waw", "ee", "ii", "ye"]), goal: "按总表顺序区分后段常见字母", status: "可学习" }
];

const alphabetAudioItems = [
  { letterId: "be", file: "human_letter_01_b.webm" },
  { letterId: "pe", file: "human_letter_02_p.webm" },
  { letterId: "te", file: "human_letter_03_t.webm" },
  { letterId: "nun", file: "human_letter_04_n.webm" },
  { letterId: "jim", file: "human_letter_05_j.webm" },
  { letterId: "che", file: "human_letter_06_ch.webm" },
  { letterId: "khe", file: "human_letter_07_x.webm" },
  { letterId: "dal", file: "human_letter_08_d.webm" },
  { letterId: "re", file: "human_letter_09_r.webm" },
  { letterId: "ze", file: "human_letter_10_z.webm" },
  { letterId: "zhe", file: "human_letter_11_zh.webm" },
  { letterId: "sin", file: "human_letter_12_s.webm" },
  { letterId: "shin", file: "human_letter_13_sh.webm" },
  { letterId: "ghayn", file: "human_letter_14_gh.webm" },
  { letterId: "fe", file: "human_letter_15_f.webm" },
  { letterId: "qaf", file: "human_letter_16_q.webm" },
  { letterId: "kaf", file: "human_letter_17_k.webm" },
  { letterId: "gaf", file: "human_letter_18_g.webm" },
  { letterId: "ng", file: "human_letter_19_ng.webm" },
  { letterId: "lam", file: "human_letter_20_l.webm" },
  { letterId: "mim", file: "human_letter_21_m.webm" },
  { letterId: "he", file: "human_letter_22_h.webm" },
  { letterId: "waw", file: "human_letter_23_w_v.webm" },
  { letterId: "ye", file: "human_letter_24_y.webm" },
  { letterId: "aa", file: "human_letter_25_a.webm" },
  { letterId: "ae", file: "human_letter_26_e.webm" },
  { letterId: "o", file: "human_letter_27_o.webm" },
  { letterId: "u", file: "human_letter_28_u.webm" },
  { letterId: "oe", file: "human_letter_29_oe.webm" },
  { letterId: "ue", file: "human_letter_30_ue.webm" },
  { letterId: "ee", file: "human_letter_31_ee.webm" },
  { letterId: "ii", file: "human_letter_32_i.webm" }
].map((item) => ({
  ...item,
  playable: true,
  statusLabel: "真人音频",
  outputPath: `./assets/audio/human/alphabet/${item.file}`
}));

  window.ANA_TILIM_ALPHABET = {
    alphabetLetters,
    letterDetails,
    alphabetGroups,
    alphabetAudioItems
  };
})();
