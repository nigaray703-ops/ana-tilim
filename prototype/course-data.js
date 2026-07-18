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
    writingHint: "先认识 ئ 和 ا 的组合，不急着讲完 ئ 的所有用法。",
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
    writingHint: "重点看它和 ئا 的差别。",
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
    writingHint: "先看 ئ 后面的 و。",
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
    writingHint: "先看 ئ 后面的 ۇ。",
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
    writingHint: "先看 ئ 后面的 ۆ。",
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
    writingHint: "先看 ئ 后面的 ۈ。",
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
      { label: "词首", value: "ئې" },
      { label: "词中", value: "ـې" },
      { label: "词尾", value: "ـې" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "正式版以真人音频为准。",
    writingHint: "先看 ئ 后面的 ې。",
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
      { label: "词首", value: "ئى" },
      { label: "词中", value: "ـى" },
      { label: "词尾", value: "ـى" }
    ],
    connection: "可以接收前面连接，但后面通常不继续连接。",
    soundHint: "正式版以真人音频为准。",
    writingHint: "要和 ي 继续对比：ئى 是元音入口，ي 是辅音。",
    example: "ئى 和 ي 很容易混，第一单元先认身份。"
  }
};

function letters(ids) {
  return ids.map((id) => letterDetails[id]);
}

const alphabetGroups = [
  { id: "dot-bone", title: "ب / پ / ت / ن", letters: letters(["be", "pe", "te", "nun"]), goal: "同类主体，点多点少都放一起比较", status: "当前" },
  { id: "curved", title: "ج / چ / خ", letters: letters(["jim", "che", "khe"]), goal: "相似弯形，重点看点在上方还是下方", status: "可学习" },
  { id: "breakers", title: "د / ر / ز / ژ", letters: letters(["dal", "re", "ze", "zhe"]), goal: "理解这些字母后面通常不继续连接", status: "可学习" },
  { id: "teeth", title: "س / ش", letters: letters(["sin", "shin"]), goal: "区分无点齿形和三点齿形", status: "可学习" },
  { id: "round-dots", title: "غ / ف / ق", letters: letters(["ghayn", "fe", "qaf"]), goal: "先认形，发音以真人音频为准", status: "可学习" },
  { id: "k-family", title: "ك / گ / ڭ", letters: letters(["kaf", "gaf", "ng"]), goal: "区分 k、g、ng 的形态", status: "可学习" },
  { id: "no-dot", title: "ل / م / ھ", letters: letters(["lam", "mim", "he"]), goal: "用整体轮廓区分无点字母", status: "可学习" },
  { id: "tail", title: "ۋ / ي", letters: letters(["waw", "ye"]), goal: "区分不后连的 ۋ 和可连接的 ي", status: "可学习" },
  { id: "vowels-basic", title: "元音 1：ئا / ئە", letters: letters(["aa", "ae"]), goal: "先认识最基础的词首元音入口", status: "可学习" },
  { id: "vowels-round", title: "元音 2：ئو / ئۇ / ئۆ / ئۈ", letters: letters(["o", "u", "oe", "ue"]), goal: "圆唇元音放在一起听和认", status: "可学习" },
  { id: "vowels-final", title: "元音 3：ئې / ئى", letters: letters(["ee", "ii"]), goal: "后段元音和 ي 继续区分", status: "可学习" }
];

const alphabetAudioItems = [
  { letterId: "be", file: "ai_temp_letter_01_b.mp3" },
  { letterId: "pe", file: "ai_temp_letter_02_p.mp3" },
  { letterId: "te", file: "ai_temp_letter_03_t.mp3" },
  { letterId: "nun", file: "ai_temp_letter_04_n.mp3" },
  { letterId: "jim", file: "ai_temp_letter_05_j.mp3" },
  { letterId: "che", file: "ai_temp_letter_06_ch.mp3" },
  { letterId: "khe", file: "ai_temp_letter_07_x.mp3" },
  { letterId: "dal", file: "ai_temp_letter_08_d.mp3" },
  { letterId: "re", file: "ai_temp_letter_09_r.mp3" },
  { letterId: "ze", file: "ai_temp_letter_10_z.mp3" },
  { letterId: "zhe", file: "ai_temp_letter_11_zh.mp3" },
  { letterId: "sin", file: "ai_temp_letter_12_s.mp3" },
  { letterId: "shin", file: "ai_temp_letter_13_sh.mp3" },
  { letterId: "ghayn", file: "ai_temp_letter_14_gh.mp3" },
  { letterId: "fe", file: "ai_temp_letter_15_f.mp3" },
  { letterId: "qaf", file: "ai_temp_letter_16_q.mp3" },
  { letterId: "kaf", file: "ai_temp_letter_17_k.mp3" },
  { letterId: "gaf", file: "ai_temp_letter_18_g.mp3" },
  { letterId: "ng", file: "ai_temp_letter_19_ng.mp3" },
  { letterId: "lam", file: "ai_temp_letter_20_l.mp3" },
  { letterId: "mim", file: "ai_temp_letter_21_m.mp3" },
  { letterId: "he", file: "ai_temp_letter_22_h.mp3" },
  { letterId: "waw", file: "ai_temp_letter_23_w_v.mp3" },
  { letterId: "ye", file: "ai_temp_letter_24_y.mp3" },
  { letterId: "aa", file: "ai_temp_letter_25_a.mp3" },
  { letterId: "ae", file: "ai_temp_letter_26_e.mp3" },
  { letterId: "o", file: "ai_temp_letter_27_o.mp3" },
  { letterId: "u", file: "ai_temp_letter_28_u.mp3" },
  { letterId: "oe", file: "ai_temp_letter_29_oe.mp3" },
  { letterId: "ue", file: "ai_temp_letter_30_ue.mp3" },
  { letterId: "ee", file: "ai_temp_letter_31_ee.mp3" },
  { letterId: "ii", file: "ai_temp_letter_32_i.mp3" }
].map((item) => ({
  ...item,
  statusLabel: "AI 临时音频",
  outputPath: `./assets/audio/ai-temp/alphabet/${item.file}`
}));

  window.ANA_TILIM_COURSE = {
    alphabetLetters,
    letterDetails,
    alphabetGroups,
    alphabetAudioItems
  };
})();
