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

const alphabetAudioByLetterId = Object.fromEntries(alphabetAudioItems.map((item) => [item.letterId, item]));

const comboGroups = [
  {
    id: "open-a",
    kind: "combo",
    title: "开口组合：ا",
    letters: ["با", "پا", "تا", "نا", "لا", "ما"],
    goal: "先把熟悉辅音接到 ا 后面，慢慢看连接变化",
    status: "当前",
    items: [
      { id: "ba", value: "با", latin: "ba", type: "两字母组合", parts: ["ب", "ا"], prompt: "ba", rule: "从右往左看：ب 接 ا，形成 ba。", hint: "ب 在词首会接住后面的 ا。", review: "组合练习，不作为正式词义。" },
      { id: "pa", value: "پا", latin: "pa", type: "两字母组合", parts: ["پ", "ا"], prompt: "pa", rule: "پ 和 ا 连起来读 pa。", hint: "注意 پ 的下方三个点。", review: "组合练习，不作为正式词义。" },
      { id: "ta", value: "تا", latin: "ta", type: "两字母组合", parts: ["ت", "ا"], prompt: "ta", rule: "ت 接 ا，读作 ta。", hint: "ت 的上方两个点要保留。", review: "组合练习，不作为正式词义。" },
      { id: "na", value: "نا", latin: "na", type: "两字母组合", parts: ["ن", "ا"], prompt: "na", rule: "ن 接 ا，读作 na。", hint: "ن 的上方一个点要保留。", review: "组合练习，不作为正式词义。" },
      { id: "la", value: "لا", latin: "la", type: "两字母组合", parts: ["ل", "ا"], prompt: "la", rule: "ل 接 ا，读作 la。", hint: "先熟悉 ل 和 ا 的连接样子。", review: "组合练习，不作为正式词义。" },
      { id: "ma", value: "ما", latin: "ma", type: "两字母组合", parts: ["م", "ا"], prompt: "ma", rule: "م 接 ا，读作 ma。", hint: "م 的圆形部分会压缩成连接形。", review: "组合练习，不作为正式词义。" }
    ]
  },
  {
    id: "soft-e",
    kind: "combo",
    title: "轻声组合：ە",
    letters: ["بە", "پە", "تە", "نە", "لە", "مە"],
    goal: "把同一批辅音换成 ە，比较结尾符号变化",
    status: "可学习",
    items: [
      { id: "be-e", value: "بە", latin: "be", type: "两字母组合", parts: ["ب", "ە"], prompt: "be", rule: "ب 接 ە，形成 be。", hint: "和 با 对比，最后一个符号不同。", review: "组合练习，不作为正式词义。" },
      { id: "pe-e", value: "پە", latin: "pe", type: "两字母组合", parts: ["پ", "ە"], prompt: "pe", rule: "پ 接 ە，形成 pe。", hint: "先看 پ 的三个点，再看 ە。", review: "组合练习，不作为正式词义。" },
      { id: "te-e", value: "تە", latin: "te", type: "两字母组合", parts: ["ت", "ە"], prompt: "te", rule: "ت 接 ە，形成 te。", hint: "和 تا 对比，结尾从 ا 换成 ە。", review: "组合练习，不作为正式词义。" },
      { id: "ne-e", value: "نە", latin: "ne", type: "两字母组合", parts: ["ن", "ە"], prompt: "ne", rule: "ن 接 ە，形成 ne。", hint: "ن 的上方一点是识别关键。", review: "组合练习，不作为正式词义。" },
      { id: "le-e", value: "لە", latin: "le", type: "两字母组合", parts: ["ل", "ە"], prompt: "le", rule: "ل 接 ە，形成 le。", hint: "和 لا 放在一起看差异。", review: "组合练习，不作为正式词义。" },
      { id: "me-e", value: "مە", latin: "me", type: "两字母组合", parts: ["م", "ە"], prompt: "me", rule: "م 接 ە，形成 me。", hint: "م 的连接形和结尾 ە 一起看。", review: "组合练习，不作为正式词义。" }
    ]
  },
  {
    id: "three-step",
    kind: "combo",
    title: "三字母慢读",
    letters: ["بال", "مان", "نان", "تال"],
    goal: "从两字母过渡到三字母，只练拆分和输入",
    status: "可学习",
    items: [
      { id: "bal", value: "بال", latin: "bal", type: "三字母组合", parts: ["ب", "ا", "ل"], prompt: "bal", rule: "先读 با，再接 ل。", hint: "先不要急着背词义，只看三个字母连起来。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "man", value: "مان", latin: "man", type: "三字母组合", parts: ["م", "ا", "ن"], prompt: "man", rule: "先读 ما，再接 ن。", hint: "观察 م 的词首形和 ن 的词尾形。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "nan", value: "نان", latin: "nan", type: "三字母组合", parts: ["ن", "ا", "ن"], prompt: "nan", rule: "先读 نا，再接 ن。", hint: "同一个 ن 在开头和结尾形态不同。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "tal", value: "تال", latin: "tal", type: "三字母组合", parts: ["ت", "ا", "ل"], prompt: "tal", rule: "先读 تا，再接 ل。", hint: "观察 ت 的点和最后 ل 的位置。", review: "组合练习；如作为词汇使用，需要审校。" }
    ]
  },
  {
    id: "phrase-preview",
    kind: "combo",
    title: "基础称呼预览",
    letters: ["ئانا", "ئاپا", "ئاتا", "دادا"],
    goal: "只做词形预览：主词、变体和含义都要等待母语者审校",
    status: "待审校",
    items: [
      { id: "ana-word", value: "ئانا", latin: "ana", type: "基础称呼预览", parts: ["ئا", "ن", "ا"], prompt: "ana", meaning: "妈妈 / 母亲", rule: "从 ئا 开始，再接 ن 和 ا。", hint: "先把它当作词形预览，不作为唯一答案。", review: "标准主词待母语者审校。" },
      { id: "apa-word", value: "ئاپا", latin: "apa", type: "基础称呼预览", parts: ["ئا", "پ", "ا"], prompt: "apa", meaning: "妈妈 / 家庭称呼变体", rule: "从 ئا 开始，再接 پ 和 ا。", hint: "用户已提醒它可能也表示妈妈；正式身份需审校。", review: "变体/口语身份待母语者审校，不直接作为考核唯一答案。" },
      { id: "ata-word", value: "ئاتا", latin: "ata", type: "基础称呼预览", parts: ["ئا", "ت", "ا"], prompt: "ata", meaning: "爸爸 / 父亲", rule: "从 ئا 开始，再接 ت 和 ا。", hint: "先认词形，正式标准答案需审校。", review: "标准主词待母语者审校。" },
      { id: "dada-word", value: "دادا", latin: "dada", type: "基础称呼预览", parts: ["د", "ا", "د", "ا"], prompt: "dada", meaning: "爸爸 / 家庭称呼变体", rule: "د 后面通常不继续连接，所以中间会看到断开。", hint: "用户已提醒它可能也表示爸爸；正式身份需审校。", review: "变体/口语身份待母语者审校，不直接作为考核唯一答案。" }
    ]
  }
];

const vocabGroups = [
  {
    id: "greetings",
    kind: "vocab",
    title: "问候",
    letters: ["ياخشىمۇسىز", "رەھمەت", "خوش", "ئەسسالامۇ ئەلەيكۇم"],
    goal: "先认识最常见的问候和礼貌词形，中文只做预览",
    status: "待审校",
    items: [
      {
        id: "yaxshimusiz",
        value: "ياخشىمۇسىز",
        latin: "yaxshimusiz",
        meaning: "你好 / 你好吗",
        theme: "问候",
        parts: ["ياخشى", "مۇ", "سىز"],
        standardNote: "候选标准问候词形，需母语者确认使用场景。",
        variantNote: "可能兼有问候和询问状态用法，语境待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "暂不考中文含义，只做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "词形较长，先分成 ياخشى / مۇ / سىز 三块看。"
      },
      {
        id: "rahmat",
        value: "رەھمەت",
        latin: "rehmet",
        meaning: "谢谢",
        theme: "问候",
        parts: ["رە", "ھمەت"],
        standardNote: "候选礼貌词，需确认标准转写和发音。",
        variantNote: "口语发音和转写可能有差异，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "暂不考中文含义，只做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "先看 ر 和 ھ，再整体记住词形。"
      },
      {
        id: "xosh",
        value: "خوش",
        latin: "xosh",
        meaning: "再见 / 告别",
        theme: "问候",
        parts: ["خ", "و", "ش"],
        standardNote: "候选告别词，需确认使用范围。",
        variantNote: "不同资料可能写作或转写略有差异，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "暂不考中文含义，只做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "这个词短，适合练 خ / و / ش 的连续识别。"
      },
      {
        id: "assalamu",
        value: "ئەسسالامۇ ئەلەيكۇم",
        latin: "assalamu alaykum",
        meaning: "问候语 / 愿平安",
        theme: "问候",
        parts: ["ئەسسالامۇ", "ئەلەيكۇم"],
        standardNote: "候选礼貌问候，需确认教学说明和场景。",
        variantNote: "宗教/文化语境需单独说明，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "暂不考中文含义，只做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "先把它看成两个词，不急着一次背完整。"
      }
    ]
  },
  {
    id: "pronouns",
    kind: "vocab",
    title: "我 / 你 / 他",
    letters: ["مەن", "سىز", "سەن", "ئۇ", "بىز"],
    goal: "认识最基础人称词形，并把礼貌和亲近说法分开",
    status: "待审校",
    items: [
      {
        id: "men",
        value: "مەن",
        latin: "men",
        meaning: "我",
        theme: "我 / 你 / 他",
        parts: ["م", "ە", "ن"],
        standardNote: "候选标准人称词。",
        variantNote: "暂无变体备注，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认，不考语法变化。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "短词，适合练 م 和 ن。"
      },
      {
        id: "siz",
        value: "سىز",
        latin: "siz",
        meaning: "你 / 您",
        theme: "我 / 你 / 他",
        parts: ["س", "ى", "ز"],
        standardNote: "候选礼貌/正式第二人称。",
        variantNote: "和 سەن 的关系要在正式词条里说明。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认，不考礼貌等级。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "和 سەن 同组比较，但不要混成一个答案。"
      },
      {
        id: "sen",
        value: "سەن",
        latin: "sen",
        meaning: "你",
        theme: "我 / 你 / 他",
        parts: ["س", "ە", "ن"],
        standardNote: "候选亲近/非正式第二人称。",
        variantNote: "使用场景和礼貌程度需母语者确认。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认，不考礼貌等级。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "和 سىز 的区别先看中间和结尾字母。"
      },
      {
        id: "u-pronoun",
        value: "ئۇ",
        latin: "u",
        meaning: "他 / 她 / 它",
        theme: "我 / 你 / 他",
        parts: ["ئ", "ۇ"],
        standardNote: "候选第三人称词。",
        variantNote: "中文他/她/它的区分不能直接套入维吾尔语，待审校说明。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认，不考语法变化。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "这是短词，但也和元音 ئۇ 视觉相关。"
      },
      {
        id: "biz",
        value: "بىز",
        latin: "biz",
        meaning: "我们",
        theme: "我 / 你 / 他",
        parts: ["ب", "ى", "ز"],
        standardNote: "候选第一人称复数。",
        variantNote: "暂无变体备注，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认，不考语法变化。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "和 سىز 一起看，注意开头字母不同。"
      }
    ]
  },
  {
    id: "family",
    kind: "vocab",
    title: "家庭 / 基础称呼",
    letters: ["ئانا", "ئاپا", "ئاتا", "دادا"],
    goal: "把标准主词和家庭口语变体分开记录，不设唯一答案",
    status: "待审校",
    items: [
      {
        id: "ana-family",
        value: "ئانا",
        latin: "ana",
        meaning: "妈妈 / 母亲",
        theme: "家庭 / 基础称呼",
        parts: ["ئا", "ن", "ا"],
        standardNote: "候选标准主词，需确认。",
        variantNote: "和 ئاپا 的关系需母语者确认。",
        acceptableAnswer: "正式考核前不设唯一答案。",
        testPolicy: "只练词形，不考标准/变体判断。",
        reviewStatus: "待母语者审校",
        sourceNote: "来自第二单元预览和用户提醒，进入审校队列。",
        tip: "先记词形，不急着排除 ئاپا。"
      },
      {
        id: "apa-family",
        value: "ئاپا",
        latin: "apa",
        meaning: "妈妈 / 家庭称呼变体",
        theme: "家庭 / 基础称呼",
        parts: ["ئا", "پ", "ا"],
        standardNote: "可能为家庭/口语称呼，需确认。",
        variantNote: "用户已提醒它也可表示妈妈。",
        acceptableAnswer: "正式考核前不设唯一答案。",
        testPolicy: "只练词形，不考标准/变体判断。",
        reviewStatus: "待母语者审校",
        sourceNote: "来自第二单元预览和用户提醒，进入审校队列。",
        tip: "和 ئانا 比较：中间是 پ。"
      },
      {
        id: "ata-family",
        value: "ئاتا",
        latin: "ata",
        meaning: "爸爸 / 父亲",
        theme: "家庭 / 基础称呼",
        parts: ["ئا", "ت", "ا"],
        standardNote: "候选标准主词，需确认。",
        variantNote: "和 دادا 的关系需母语者确认。",
        acceptableAnswer: "正式考核前不设唯一答案。",
        testPolicy: "只练词形，不考标准/变体判断。",
        reviewStatus: "待母语者审校",
        sourceNote: "来自第二单元预览和用户提醒，进入审校队列。",
        tip: "和 ئانا 结构相似，中间字母不同。"
      },
      {
        id: "dada-family",
        value: "دادا",
        latin: "dada",
        meaning: "爸爸 / 家庭称呼变体",
        theme: "家庭 / 基础称呼",
        parts: ["د", "ا", "د", "ا"],
        standardNote: "可能为家庭/口语称呼，需确认。",
        variantNote: "用户已提醒它也可表示爸爸。",
        acceptableAnswer: "正式考核前不设唯一答案。",
        testPolicy: "只练词形，不考标准/变体判断。",
        reviewStatus: "待母语者审校",
        sourceNote: "来自第二单元预览和用户提醒，进入审校队列。",
        tip: "د 后面通常不继续连接，所以词形里会看到断开。"
      }
    ]
  },
  {
    id: "numbers",
    kind: "vocab",
    title: "数字 1-5",
    letters: ["بىر", "ئىككى", "ئۈچ", "تۆت", "بەش"],
    goal: "先认识 1 到 5 的词形，后续再做数字专项",
    status: "待审校",
    items: [
      {
        id: "one",
        value: "بىر",
        latin: "bir",
        meaning: "一",
        theme: "数字 1-5",
        parts: ["ب", "ى", "ر"],
        standardNote: "候选数字词。",
        variantNote: "暂无变体备注，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "短词，注意 ر 后不继续连接。"
      },
      {
        id: "two",
        value: "ئىككى",
        latin: "ikki",
        meaning: "二",
        theme: "数字 1-5",
        parts: ["ئى", "ك", "كى"],
        standardNote: "候选数字词。",
        variantNote: "暂无变体备注，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "ك 系字母出现两次，适合复习连接。"
      },
      {
        id: "three",
        value: "ئۈچ",
        latin: "üch",
        meaning: "三",
        theme: "数字 1-5",
        parts: ["ئۈ", "چ"],
        standardNote: "候选数字词。",
        variantNote: "暂无变体备注，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "复习元音 ئۈ 和字母 چ。"
      },
      {
        id: "four",
        value: "تۆت",
        latin: "töt",
        meaning: "四",
        theme: "数字 1-5",
        parts: ["ت", "ۆ", "ت"],
        standardNote: "候选数字词。",
        variantNote: "暂无变体备注，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "同一个 ت 出现在开头和结尾。"
      },
      {
        id: "five",
        value: "بەش",
        latin: "besh",
        meaning: "五",
        theme: "数字 1-5",
        parts: ["ب", "ە", "ش"],
        standardNote: "候选数字词。",
        variantNote: "暂无变体备注，待审校。",
        acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
        testPolicy: "可做词形辨认和输入。",
        reviewStatus: "待母语者审校",
        sourceNote: "参考公开学习资料，进入项目审校队列。",
        tip: "复习 ب 和 ش。"
      }
    ]
  }
];

const practiceGroups = [
  {
    id: "listening-loop",
    kind: "practice",
    mode: "listen",
    title: "听音辨认",
    letters: ["ب", "با", "مەن"],
    goal: "用音频占位练辨认，真实音频上线后直接替换",
    status: "已开放",
    items: [
      {
        id: "practice-listen-be",
        type: "字母",
        value: "ب",
        latin: "b",
        label: "第一单元字母",
        hint: "下方一个点。当前用转写提示模拟听音，真人音频待录制。",
        parts: ["ب"],
        audioStatus: "真人音频待录制"
      },
      {
        id: "practice-listen-ba",
        type: "组合",
        value: "با",
        latin: "ba",
        label: "第二单元组合",
        hint: "由 ب 和 ا 连成，先听成一个整体。",
        parts: ["ب", "ا"],
        audioStatus: "真人音频待录制"
      },
      {
        id: "practice-listen-men",
        type: "词形",
        value: "مەن",
        latin: "men",
        label: "第三单元候选词",
        hint: "第三单元词义仍待审校，本题只练词形辨认。",
        parts: ["م", "ە", "ن"],
        audioStatus: "真人音频待录制"
      }
    ]
  },
  {
    id: "repeat-loop",
    kind: "practice",
    mode: "repeat",
    title: "跟读练习",
    letters: ["ئا", "نا", "رەھمەت"],
    goal: "看词形和转写提示，完成一轮跟读确认",
    status: "已开放",
    items: [
      {
        id: "practice-repeat-aa",
        type: "元音",
        value: "ئا",
        latin: "a",
        label: "第一单元元音",
        hint: "先看 ئ 和 ا 的组合，再跟读开口音提示。",
        parts: ["ئ", "ا"],
        audioStatus: "真人音频待录制"
      },
      {
        id: "practice-repeat-na",
        type: "组合",
        value: "نا",
        latin: "na",
        label: "第二单元组合",
        hint: "先读 ن，再接 ا，保持从右到左看词形。",
        parts: ["ن", "ا"],
        audioStatus: "真人音频待录制"
      },
      {
        id: "practice-repeat-rahmat",
        type: "词形",
        value: "رەھمەت",
        latin: "rehmet",
        label: "第三单元候选词",
        hint: "中文含义仍待审校，先练 رەھمەت 的词形和转写。",
        parts: ["رە", "ھمەت"],
        audioStatus: "真人音频待录制"
      }
    ]
  },
  {
    id: "writing-loop",
    kind: "practice",
    mode: "write",
    title: "书写 / 键盘",
    letters: ["ن", "مان", "ئانا"],
    goal: "先描摹，再用键盘输入同一个目标",
    status: "已开放",
    items: [
      {
        id: "practice-write-nun",
        type: "字母",
        value: "ن",
        latin: "n",
        label: "第一单元字母",
        hint: "上方一个点，和 ت 放在一起复习。",
        parts: ["ن"],
        audioStatus: "真人音频待录制"
      },
      {
        id: "practice-write-man",
        type: "组合",
        value: "مان",
        latin: "man",
        label: "第二单元三字母慢读",
        hint: "م + ا + ن，注意 ا 后面的连接变化。",
        parts: ["م", "ا", "ن"],
        audioStatus: "真人音频待录制"
      },
      {
        id: "practice-write-ana",
        type: "词形",
        value: "ئانا",
        latin: "ana",
        label: "第三单元候选称呼",
        hint: "家庭称呼不设唯一答案，先练 ئانا 的词形。",
        parts: ["ئا", "ن", "ا"],
        audioStatus: "真人音频待录制"
      }
    ]
  },
  {
    id: "review-loop",
    kind: "practice",
    mode: "review",
    title: "错题复习",
    letters: ["س", "سىز", "بەش"],
    goal: "把本轮结果整理成复习卡，后续接错题记录",
    status: "已开放",
    items: [
      {
        id: "practice-review-sin",
        type: "字母",
        value: "س",
        latin: "s",
        label: "第一单元易混字母",
        hint: "和 ش 对比，先看有没有上方三点。",
        parts: ["س"],
        audioStatus: "真人音频待录制"
      },
      {
        id: "practice-review-siz",
        type: "词形",
        value: "سىز",
        latin: "siz",
        label: "第三单元候选人称",
        hint: "和 سەن 同组比较，但不在这里考礼貌等级。",
        parts: ["س", "ى", "ز"],
        audioStatus: "真人音频待录制"
      },
      {
        id: "practice-review-five",
        type: "词形",
        value: "بەش",
        latin: "besh",
        label: "第三单元候选数字",
        hint: "数字词义仍待审校确认，先做词形回看。",
        parts: ["ب", "ە", "ش"],
        audioStatus: "真人音频待录制"
      }
    ]
  }
];

const learningUnits = [
  {
    id: "letters",
    title: "第一单元：认识字母",
    subtitle: "32 个字母 / 相似分组",
    status: "已完成",
    description: "先按截图顺序认识全部字母，学习时把看起来相似、容易混的字母放在一组。",
    bullets: ["认识字母形状", "区分点位和点数", "看四种形态", "练单字母键盘输入"],
    groups: alphabetGroups,
    actionTarget: "letter"
  },
  {
    id: "combos",
    title: "第二单元：组合与词组入门",
    subtitle: "字母连起来 / 词形预览",
    status: "已完成",
    description: "先做两字母和三字母组合，再加入少量基础称呼词形预览；含义和变体都标记为待母语者审校。",
    bullets: ["两字母组合", "三字母慢读", "词形预览", "键盘输入"],
    groups: comboGroups,
    actionTarget: "combo"
  },
  {
    id: "basic-phrases",
    title: "第三单元：基础词组与主题词",
    subtitle: "问候 / 人称 / 称呼 / 数字",
    status: "已完成",
    description: "进入真实词义前，先建立审校表：词形、中文预览、标准主词、变体和可考状态分开。",
    bullets: ["词库审校", "主题分组", "词形辨认", "键盘输入"],
    groups: vocabGroups,
    actionTarget: "vocab"
  },
  {
    id: "practice",
    title: "第四单元：听说与书写强化",
    subtitle: "听音 / 跟读 / 书写 / 复习",
    status: "进行中",
    description: "不加新词，把第一到三单元内容变成能听、能说、能写、能输入的复习闭环。",
    bullets: ["音频占位", "跟读确认", "描摹输入", "复习结果"],
    groups: practiceGroups,
    actionTarget: "writing"
  }
];

const reviewStatusOptions = [
  { id: "pending", label: "待审校", tone: "pending" },
  { id: "approved", label: "通过", tone: "good" },
  { id: "needs-edit", label: "需修改", tone: "bad" },
  { id: "display-only", label: "只展示不考核", tone: "warn" },
  { id: "variant", label: "变体保留", tone: "warn" },
  { id: "second-review", label: "待二审", tone: "pending" }
];

const audioStatusOptions = [
  { id: "audio-pending", label: "真人音频待录制" },
  { id: "audio-ai-temp", label: "AI 临时音频" },
  { id: "audio-recorded", label: "真人音频已录制" },
  { id: "audio-connected", label: "真人音频已接入" },
  { id: "audio-rerecord", label: "需重新录制" }
];

const reviewFilters = [
  { id: "all", label: "全部" },
  { id: "pending", label: "待审校" },
  { id: "needs-edit", label: "需修改" },
  { id: "display-only", label: "只展示不考核" },
  { id: "variant", label: "变体保留" },
  { id: "family", label: "家庭重点" },
  { id: "audio-pending", label: "音频待录" },
  { id: "audio-ai-temp", label: "AI 音频" },
  { id: "audio-rerecord", label: "需重录" }
];

const reviewBaseItems = [
  ...alphabetLetters.map((item, index) => ({
    id: `letter-${index + 1}`,
    unit: "第一单元",
    kind: item.type,
    theme: "认识字母",
    value: item.letter,
    latin: item.latin,
    meaning: "字母",
    reviewStatus: "pending",
    examPolicy: "可练字母辨认；发音提示需审校后再进入正式听音题。",
    audioStatus: "audio-pending",
    priority: false,
    question: "字母顺序、转写、发音提示和连接说明是否适合标准维吾尔语？"
  })),
  ...comboGroups.flatMap((group) =>
    group.items.map((item) => {
      const isFamily = group.id === "phrase-preview";
      return {
        id: `combo-${item.id}`,
        unit: "第二单元",
        kind: item.type,
        theme: group.title,
        value: item.value,
        latin: item.latin,
        meaning: item.meaning || "组合练习",
        reviewStatus: isFamily ? "pending" : "display-only",
        examPolicy: isFamily ? "正式考核前不设唯一答案。" : "只做组合、拆分和输入；不考词义。",
        audioStatus: "audio-pending",
        priority: isFamily,
        question: isFamily ? "请确认标准主词、家庭口语、地区说法和可接受答案。" : "请确认组合是否适合新手练习，是否保持只展示不考核。"
      };
    })
  ),
  ...vocabGroups.flatMap((group) =>
    group.items.map((item) => {
      const isFamily = group.id === "family";
      const isVariant = ["apa-family", "dada-family"].includes(item.id);
      return {
        id: `vocab-${item.id}`,
        unit: "第三单元",
        kind: "候选词条",
        theme: group.title,
        value: item.value,
        latin: item.latin,
        meaning: item.meaning,
        reviewStatus: isVariant ? "variant" : "pending",
        examPolicy: item.testPolicy,
        audioStatus: "audio-pending",
        priority: isFamily,
        question: isFamily ? "家庭称呼必须确认标准主词、变体身份和是否可作为答案。" : `${item.standardNote} ${item.variantNote}`
      };
    })
  ),
  ...practiceGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: `practice-${item.id}`,
      unit: "第四单元",
      kind: item.type,
      theme: group.title,
      value: item.value,
      latin: item.latin,
      meaning: item.label,
      reviewStatus: "display-only",
      examPolicy: "第四单元只复用前面内容做流程练习，不新增词义考核。",
      audioStatus: "audio-pending",
      priority: item.value === "ئانا" || item.value === "سىز",
      question: item.hint
    }))
  )
];

const keyboardRows = [
  ["ق", "و", "ې", "ر", "ت"],
  ["ي", "ۇ", "ڭ", "ا", "س"],
  ["د", "ف", "گ", "ھ", "ج"],
  ["ك", "ل", "ز", "خ", "ب"]
];

const state = {
  screen: "welcome",
  selectedPicture: "",
  selectedListening: "",
  keyboardValue: "",
  currentLetterId: "be",
  selectedGroupId: "dot-bone",
  currentComboItemId: "ba",
  selectedComboGroupId: "open-a",
  currentVocabItemId: "yaxshimusiz",
  selectedVocabGroupId: "greetings",
  currentPracticeItemId: "practice-listen-be",
  selectedPracticeGroupId: "listening-loop",
  practiceSpoken: false,
  selectedReviewItemId: "vocab-ana-family",
  reviewFilter: "all",
  reviewOverrides: {},
  selectedUnitId: "letters",
  showGuide: true,
  favorite: false
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;
let activeAudio = null;

function currentLetter() {
  return currentGroupLetters().find((letter) => letter.id === state.currentLetterId) || currentGroupLetters()[0];
}

function currentLetterAudio() {
  return alphabetAudioByLetterId[currentLetter().id] || null;
}

function currentGroup() {
  return alphabetGroups.find((group) => group.id === state.selectedGroupId) || alphabetGroups[0];
}

function currentGroupLetters() {
  return currentGroup().letters;
}

function allUnitOneLetters() {
  return alphabetGroups.flatMap((group) => group.letters);
}

function groupForLetter(letterId) {
  return alphabetGroups.find((group) => group.letters.some((letter) => letter.id === letterId));
}

function currentComboGroup() {
  return comboGroups.find((group) => group.id === state.selectedComboGroupId) || comboGroups[0];
}

function currentComboItems() {
  return currentComboGroup().items;
}

function currentComboItem() {
  return currentComboItems().find((item) => item.id === state.currentComboItemId) || currentComboItems()[0];
}

function comboGroupForItem(itemId) {
  return comboGroups.find((group) => group.items.some((item) => item.id === itemId));
}

function allComboItems() {
  return comboGroups.flatMap((group) => group.items);
}

function currentVocabGroup() {
  return vocabGroups.find((group) => group.id === state.selectedVocabGroupId) || vocabGroups[0];
}

function currentVocabItems() {
  return currentVocabGroup().items;
}

function currentVocabItem() {
  return currentVocabItems().find((item) => item.id === state.currentVocabItemId) || currentVocabItems()[0];
}

function vocabGroupForItem(itemId) {
  return vocabGroups.find((group) => group.items.some((item) => item.id === itemId));
}

function allVocabItems() {
  return vocabGroups.flatMap((group) => group.items);
}

function currentPracticeGroup() {
  return practiceGroups.find((group) => group.id === state.selectedPracticeGroupId) || practiceGroups[0];
}

function currentPracticeItems() {
  return currentPracticeGroup().items;
}

function currentPracticeItem() {
  return currentPracticeItems().find((item) => item.id === state.currentPracticeItemId) || currentPracticeItems()[0];
}

function practiceGroupForItem(itemId) {
  return practiceGroups.find((group) => group.items.some((item) => item.id === itemId));
}

function allPracticeItems() {
  return practiceGroups.flatMap((group) => group.items);
}

function reviewStatusById(statusId) {
  return reviewStatusOptions.find((item) => item.id === statusId) || reviewStatusOptions[0];
}

function audioStatusById(statusId) {
  return audioStatusOptions.find((item) => item.id === statusId) || audioStatusOptions[0];
}

function reviewItemsWithOverrides() {
  return reviewBaseItems.map((item) => ({
    ...item,
    ...(state.reviewOverrides[item.id] || {})
  }));
}

function filteredReviewItems() {
  const items = reviewItemsWithOverrides();

  if (state.reviewFilter === "all") {
    return items;
  }

  if (state.reviewFilter === "family") {
    return items.filter((item) => item.priority);
  }

  if (state.reviewFilter.startsWith("audio-")) {
    return items.filter((item) => item.audioStatus === state.reviewFilter);
  }

  return items.filter((item) => item.reviewStatus === state.reviewFilter);
}

function currentReviewItem() {
  const items = reviewItemsWithOverrides();
  return items.find((item) => item.id === state.selectedReviewItemId) || items[0];
}

function reviewCounts() {
  const items = reviewItemsWithOverrides();

  return {
    total: items.length,
    pending: items.filter((item) => item.reviewStatus === "pending").length,
    needsEdit: items.filter((item) => item.reviewStatus === "needs-edit").length,
    family: items.filter((item) => item.priority).length,
    audioPending: items.filter((item) => item.audioStatus === "audio-pending").length,
    aiTemp: items.filter((item) => item.audioStatus === "audio-ai-temp").length,
    needsRerecord: items.filter((item) => item.audioStatus === "audio-rerecord").length
  };
}

function updateReviewItem(itemId, patch) {
  state.reviewOverrides[itemId] = {
    ...(state.reviewOverrides[itemId] || {}),
    ...patch
  };
}

function resetPracticeState() {
  state.selectedPicture = "";
  state.selectedListening = "";
  state.keyboardValue = "";
}

function resetComboPracticeState() {
  resetPracticeState();
}

function resetVocabPracticeState() {
  resetPracticeState();
}

function resetPracticeSessionState() {
  resetPracticeState();
  state.practiceSpoken = false;
}

function currentUnit() {
  return learningUnits.find((unit) => unit.id === state.selectedUnitId) || learningUnits[0];
}

function render() {
  const screens = {
    welcome: renderWelcome,
    home: renderHome,
    learn: renderLearnPath,
    unit: renderUnitDetail,
    letter: renderGroupLesson,
    group: renderGroupLesson,
    writing: renderPracticeHub,
    letterWriting: renderLetterWriting,
    picture: renderPicturePractice,
    listening: renderListeningPractice,
    keyboard: renderKeyboardPractice,
    complete: renderComplete,
    combo: renderComboLesson,
    comboRecognition: renderComboRecognition,
    comboKeyboard: renderComboKeyboard,
    comboComplete: renderComboComplete,
    vocab: renderVocabLesson,
    vocabRecognition: renderVocabRecognition,
    vocabKeyboard: renderVocabKeyboard,
    vocabComplete: renderVocabComplete,
    practiceSession: renderPracticeSession,
    practiceComplete: renderPracticeComplete,
    review: renderReviewDashboard,
    library: renderLibrary,
    profile: renderProfile
  };

  const screenRenderer = screens[state.screen] || renderHome;
  app.innerHTML = screenRenderer();
}

function screen(content, active = "home") {
  return `
    <div class="view">
      ${content}
      ${bottomNav(active)}
    </div>
  `;
}

function topBar(title, subtitle, action = "", leading = "") {
  return `
    <header class="top-row">
      ${leading}
      <div class="brand-lockup">
        <img class="brand-mark" src="./assets/logo.png" alt="Ana Tilim logo" />
        <div>
          <h1 class="brand-name">${title}</h1>
          <p class="brand-subtitle">${subtitle}</p>
        </div>
      </div>
      ${action}
    </header>
  `;
}

function bottomNav(active) {
  const items = [
    ["home", "首页", iconHome()],
    ["learn", "学习", iconBook()],
    ["writing", "书写", iconPen()],
    ["library", "字母", iconLibrary()],
    ["profile", "我的", iconUser()]
  ];

  return `
    <nav class="bottom-nav" aria-label="主导航">
      ${items
        .map(
          ([target, label, icon]) => `
            <button
              class="nav-button ${active === target ? "active" : ""}"
              data-action="go"
              data-target="${target}"
              type="button"
            >
              <span class="nav-icon" aria-hidden="true">${icon}</span>
              ${label}
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function iconHome() {
  return `<svg viewBox="0 0 24 24"><path d="M4 10.8 12 4l8 6.8"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M10 20v-5h4v5"/></svg>`;
}

function iconBook() {
  return `<svg viewBox="0 0 24 24"><path d="M5 5.5c2.2-.9 4.4-.7 7 1v13c-2.6-1.7-4.8-1.9-7-1z"/><path d="M12 6.5c2.6-1.7 4.8-1.9 7-1v12.5c-2.2-.9-4.4-.7-7 1"/></svg>`;
}

function iconPen() {
  return `<svg viewBox="0 0 24 24"><path d="m4 20 4.5-1 10-10a2.2 2.2 0 0 0-3.1-3.1l-10 10z"/><path d="m14 7 3 3"/><path d="M4 20h6"/></svg>`;
}

function iconLibrary() {
  return `<svg viewBox="0 0 24 24"><path d="M5 5h12a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H19"/><path d="M9 8h6"/></svg>`;
}

function iconUser() {
  return `<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`;
}

function renderWelcome() {
  return `
    <div class="hero view without-nav">
      <div>
        <img class="hero-logo" src="./assets/logo.png" alt="Ana Tilim logo" />
        <h1>Ana Tilim</h1>
        <div class="uyghur uyghur-title">ئانا تىلىم</div>
        <p class="hero-copy">
          从字母、发音、书写到键盘输入，一步一步学会自己的母语。
        </p>
        <button class="primary-button" data-action="go" data-target="home" type="button">
          开始学习
        </button>
      </div>
    </div>
  `;
}

function renderHome() {
  const counts = reviewCounts();

  return screen(
    `
      ${topBar("早上好", "今天继续 8 分钟就很好")}

      <section class="stack wide-gap">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">今日进度</p>
              <h2 class="section-title">第四单元 · 听说与书写</h2>
            </div>
            <span class="step-state">进行中</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style="--value: 30%"></div>
          </div>
          <p class="caption">不加新词，先把字母、组合和候选词形放进听音、跟读、书写和复习闭环。</p>
          <button class="primary-button" data-action="go" data-target="writing" type="button">
            继续学习
          </button>
        </article>

        <div class="metric-grid" aria-label="今日学习概览">
          <div class="metric"><strong>3</strong><span>连续天数</span></div>
          <div class="metric"><strong>${practiceGroups.length}</strong><span>训练组</span></div>
          <div class="metric"><strong>${counts.pending}</strong><span>待审校</span></div>
        </div>

        <section>
          <div class="section-row">
            <h2 class="section-title">快速入口</h2>
            <button class="ghost-button" data-action="toast" type="button">设置目标</button>
          </div>
          <div class="quick-grid">
            <button class="quick-button" data-action="go" data-target="writing" type="button">
              <strong>练听说写</strong><span>第四单元</span>
            </button>
            <button class="quick-button" data-action="open-practice-group" data-id="listening-loop" type="button">
              <strong>听音辨认</strong><span>音频占位</span>
            </button>
            <button class="quick-button" data-action="open-practice-group" data-id="repeat-loop" type="button">
              <strong>跟读练习</strong><span>先点完成</span>
            </button>
            <button class="quick-button" data-action="open-practice-group" data-id="writing-loop" type="button">
              <strong>书写输入</strong><span>描摹 + 键盘</span>
            </button>
            <button class="quick-button" data-action="go" data-target="review" type="button">
              <strong>审校看板</strong><span>回填状态</span>
            </button>
            <button class="quick-button" data-action="go" data-target="profile" type="button">
              <strong>项目状态</strong><span>我的页面</span>
            </button>
          </div>
        </section>
      </section>
    `,
    "home"
  );
}

function renderLearnPath() {
  return screen(
    `
      ${topBar("学习单元", "先认识字母，再进入组合 / 词组")}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">完整阶段</p>
              <h2 class="screen-title">${alphabetLetters.length} 个字母</h2>
            </div>
            <span class="step-state">待审校</span>
          </div>
          <p class="muted">Ana Tilim 按截图顺序展示字母，学习时把相似字母放在一起。第二单元开始加入组合 / 词组。</p>
          <div class="alphabet-strip" aria-label="完整字母目录">
            ${alphabetLetters
              .map(
                (item, index) => `
                  <span class="letter-pill ${["ب", "پ", "ت", "ن"].includes(item.letter) ? "active" : ""}">
                    <span class="uyghur">${item.letter}</span>
                    <small>${item.latin}</small>
                  </span>
                `
              )
              .join("")}
          </div>
        </article>

        <div class="path-list">
          ${learningUnits
            .map(
              (unit, index) => `
                <button class="lesson-step" data-action="open-unit" data-id="${unit.id}" type="button">
                  <span class="step-number">${index + 1}</span>
                  <span>
                    <strong>${unit.title}</strong>
                    <span class="caption">${unit.subtitle}</span>
                  </span>
                  <span class="step-state">${unit.status}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </section>
    `,
    "learn"
  );
}

function renderLetterPills(items, activeId = "") {
  return items
    .map((item) => {
      const letter = typeof item === "string" ? item : item.letter;
      const latin = typeof item === "string" ? "" : item.latin;
      const id = typeof item === "string" ? "" : item.id;

      return `
        <span class="letter-pill ${id && id === activeId ? "active" : ""}">
          <span class="uyghur">${letter}</span>
          ${latin ? `<small>${latin}</small>` : ""}
        </span>
      `;
    })
    .join("");
}

function renderGroupCard(group) {
  const action = group.kind === "practice" ? "open-practice-group" : group.kind === "vocab" ? "open-vocab-group" : group.kind === "combo" ? "open-combo-group" : "open-group";
  const cardContent = `
    <div class="section-row">
      <strong>${group.title}</strong>
      <span class="step-state">${group.status}</span>
    </div>
    <p class="caption">${group.goal}</p>
    <div class="alphabet-strip compact">
      ${renderLetterPills(group.letters)}
    </div>
  `;

  if (!group.id) {
    return `<article class="group-card">${cardContent}</article>`;
  }

  return `
    <button
      class="group-card group-card-button"
      data-action="${action}"
      data-id="${group.id}"
      type="button"
    >
      ${cardContent}
    </button>
  `;
}

function renderUnitDetail() {
  const unit = currentUnit();

  return screen(
    `
      ${topBar(
        unit.title,
        unit.subtitle,
        "",
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">单元目标</p>
              <h2 class="section-title unit-goal-text">${unit.description}</h2>
            </div>
            <span class="step-state">${unit.status}</span>
          </div>
          <div class="chip-row unit-goal-points">
            ${unit.bullets.map((point) => `<span class="chip">${point}</span>`).join("")}
          </div>
        </article>

        <div class="path-list">
          ${unit.groups.map((group) => renderGroupCard(group)).join("")}
        </div>

        <button class="primary-button" data-action="go" data-target="${unit.actionTarget}" type="button">
          进入这个单元
        </button>
      </section>
    `,
    "learn"
  );
}

function renderGroupLesson() {
  const group = currentGroup();
  const letter = currentLetter();
  const audio = currentLetterAudio();

  return screen(
    `
      ${topBar(
        group.title,
        "第一单元：认识字母",
        `<button class="icon-button" data-action="toggle-favorite" type="button" aria-label="收藏">${state.favorite ? "★" : "☆"}</button>`,
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">本组目标</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${group.status}</span>
          </div>
          <div class="chip-row unit-goal-points">
            <span class="chip">先认整体形状</span>
            <span class="chip">再看点位和点数</span>
            <span class="chip">比较四种写法</span>
            <span class="chip">只练单个字母</span>
          </div>
        </article>

        <div class="alphabet-strip compact">
          ${currentGroupLetters()
            .map(
              (item) => `
                <button
                  class="letter-pill button-pill ${item.id === letter.id ? "active" : ""}"
                  data-action="select-letter"
                  data-id="${item.id}"
                  type="button"
                >
                  <span class="uyghur">${item.letter}</span>
                  <small>${item.latin}</small>
                </button>
              `
            )
            .join("")}
        </div>

        <div class="letter-focus">
          <div>
            <div class="uyghur letter-big">${letter.letter}</div>
            <p class="caption">${letter.type} / ${letter.latin}</p>
          </div>
        </div>
        <div class="audio-strip">
          <button
            class="play-dot"
            data-action="play-audio"
            data-audio-src="${audio ? audio.outputPath : ""}"
            data-audio-label="${letter.letter}"
            type="button"
            aria-label="播放发音"
          >听</button>
          <div>
            <strong>发音提示</strong>
            <p class="caption">${audio ? `${audio.statusLabel}：${audio.file}。` : ""}${letter.soundHint}</p>
          </div>
        </div>
        <div class="form-grid">
          ${letter.forms
            .map(
              (form) => `
                <div class="form-cell">
                  <span>${form.label}</span>
                  <strong class="uyghur">${form.value}</strong>
                </div>
              `
            )
            .join("")}
        </div>
        <article class="card">
          <p class="caption">学习小点</p>
          <div class="lesson-point-list">
            <div class="lesson-point">
              <strong>认形</strong>
              <span>${letter.cue}</span>
            </div>
            <div class="lesson-point">
              <strong>连接</strong>
              <span>${letter.connection}</span>
            </div>
            <div class="lesson-point">
              <strong>书写</strong>
              <span>${letter.writingHint}</span>
            </div>
          </div>
        </article>
        <article class="card">
          <p class="caption">点位对比</p>
          <div class="section-row">
            <strong class="uyghur word-big">${letter.letter}</strong>
            <div>
              <strong>先认字母，不急着学词组</strong>
              <p class="caption">${letter.example}</p>
            </div>
          </div>
        </article>
        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="letterWriting" type="button">
            描摹
          </button>
          <button class="secondary-button" data-action="go" data-target="picture" type="button">
            辨认
          </button>
          <button class="secondary-button" data-action="go" data-target="listening" type="button">
            听音
          </button>
          <button class="primary-button" data-action="go" data-target="keyboard" type="button">
            键盘
          </button>
        </div>
      </section>
    `,
    "learn"
  );
}

function renderLetterWriting() {
  const letter = currentLetter();

  return screen(
    `
      ${topBar(
        "书写练习",
        "先描摹，再自己写",
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">目标字母</p>
              <h2 class="section-title">描摹 <span class="uyghur">${letter.letter}</span></h2>
            </div>
            <button class="ghost-button" data-action="toggle-guide" type="button">
              ${state.showGuide ? "隐藏参考" : "显示参考"}
            </button>
          </div>
        </article>
        <div class="drawing-pad ${state.showGuide ? "" : "hide-guide"}" aria-label="书写画布示意">
          <span class="uyghur guide">${letter.letter}</span>
          <span class="stroke-line" aria-hidden="true"></span>
        </div>
        <div class="tool-row">
          <button class="secondary-button" data-action="toast" type="button">撤销</button>
          <button class="secondary-button" data-action="toast" type="button">清除</button>
          <button class="secondary-button" data-action="toast" type="button">重做</button>
        </div>
        <div class="feedback">
          ${letter.writingHint}
        </div>
        <button class="primary-button" data-action="go" data-target="picture" type="button">
          完成描摹
        </button>
      </section>
    `,
    "writing"
  );
}

function renderPicturePractice() {
  const letter = currentLetter();
  const choices = currentGroupLetters();
  const hasPicked = Boolean(state.selectedPicture);
  const picked = choices.find((choice) => choice.id === state.selectedPicture);
  const isCorrect = picked && picked.id === letter.id;

  return screen(
    `
      ${topBar(
        "点位辨认",
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">选择正确字母</p>
          <h2 class="section-title">
            哪一个符合：${letter.cue}？
          </h2>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedPicture === choice.id;
              const correctChoice = choice.id === letter.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-picture"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${choice.letter}</span>
                  <span>
                    <strong>${choice.cue}</strong>
                    <span class="caption">${choice.type} / ${choice.latin}</span>
                  </span>
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再想想") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? `答对了。${letter.letter} 的关键是 ${letter.cue}。`
                  : "这个不是目标字母。正式版会把错误放入复习。"
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="listening" type="button">
          继续听力
        </button>
      </section>
    `,
    "learn"
  );
}

function renderListeningPractice() {
  const letter = currentLetter();
  const audio = currentLetterAudio();
  const choices = currentGroupLetters();
  const hasPicked = Boolean(state.selectedListening);
  const picked = choices.find((choice) => choice.id === state.selectedListening);
  const isCorrect = picked && picked.id === letter.id;

  return screen(
    `
      ${topBar(
        "听音选择",
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <div class="audio-strip">
          <button
            class="play-dot"
            data-action="play-audio"
            data-audio-src="${audio ? audio.outputPath : ""}"
            data-audio-label="${letter.letter}"
            type="button"
            aria-label="播放发音"
          >听</button>
          <div>
            <strong>播放：${letter.latin}</strong>
            <p class="caption">${audio ? `${audio.statusLabel}。` : ""}${letter.soundHint}</p>
          </div>
        </div>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedListening === choice.id;
              const correctChoice = choice.id === letter.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-listening"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${choice.letter}</span>
                  <span>
                    <strong class="uyghur">${choice.letter}</strong>
                    <span class="caption">字母 / ${choice.latin}</span>
                  </span>
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再听") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "听对了。下一步用键盘输入这个字母。"
                  : "这个读音不对应目标字母。可以再点播放按钮听一次。"
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="keyboard" type="button">
          继续键盘
        </button>
      </section>
    `,
    "learn"
  );
}

function renderKeyboardPractice() {
  const letter = currentLetter();
  const isCorrect = state.keyboardValue === letter.letter;
  const hasInput = state.keyboardValue.length > 0;

  return screen(
    `
      ${topBar(
        "键盘输入",
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">请输入这个字母</p>
          <div class="section-row">
            <strong class="uyghur">${letter.letter}</strong>
            <span class="caption">${letter.latin}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="维吾尔语输入框"
          readonly
          dir="rtl"
        />
        <div class="practice-key-row" aria-label="本组字母快捷键">
          ${currentGroupLetters()
            .map(
              (item) => `
                <button class="key-button uyghur" data-action="key" data-key="${item.letter}" type="button">
                  ${item.letter}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="keyboard-grid" aria-label="维吾尔语虚拟键盘">
          ${keyboardRows
            .flat()
            .map(
              (key) => `
                <button class="key-button uyghur" data-action="key" data-key="${key}" type="button">
                  ${key}
                </button>
              `
            )
            .join("")}
          <button class="key-button utility" data-action="backspace" type="button">删除</button>
          <button class="key-button utility" data-action="clear-input" type="button">清空</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "输入正确。你已经完成这条学习闭环。"
                  : `继续输入，目标字母是 ${letter.letter}。`
              }</div>`
            : `<div class="feedback">提示：点击 <span class="uyghur">${letter.letter}</span>。</div>`
        }
        <button class="primary-button" data-action="go" data-target="complete" type="button">
          完成课程
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComplete() {
  const group = currentGroup();
  const letter = currentLetter();
  const groupLetters = group.letters.map((item) => item.letter).join(" ");

  return screen(
    `
      ${topBar("课程完成", "第一条学习闭环走通了")}
      <section class="stack">
        <article class="card">
          <p class="caption">本次学会</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupLetters}</span>
          </h2>
          <p class="muted">你看了当前相似组字母、描摹了 ${letter.letter}、完成辨认，并用键盘输入了 ${letter.letter}。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.letters.length}</strong><span>字母</span></div>
          <div class="metric"><strong>1</strong><span>辨认</span></div>
          <div class="metric"><strong>0</strong><span>错题</span></div>
        </div>
        <button class="primary-button" data-action="go" data-target="learn" type="button">
          再看学习路径
        </button>
        <button class="secondary-button" data-action="go" data-target="home" type="button">
          回到首页
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComboSelector(items, activeId) {
  return items
    .map(
      (item) => `
        <button
          class="letter-pill button-pill ${item.id === activeId ? "active" : ""}"
          data-action="select-combo"
          data-id="${item.id}"
          type="button"
        >
          <span class="uyghur">${item.value}</span>
          <small>${item.latin}</small>
        </button>
      `
    )
    .join("");
}

function renderComboParts(item) {
  return item.parts
    .map(
      (part, index) => `
        <span class="combo-part">
          <strong class="uyghur">${part}</strong>
          <small>${index + 1}</small>
        </span>
      `
    )
    .join("");
}

function renderComboLesson() {
  const group = currentComboGroup();
  const item = currentComboItem();

  return screen(
    `
      ${topBar(
        group.title,
        "第二单元：组合与词组入门",
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">本组目标</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${group.status}</span>
          </div>
          <div class="chip-row unit-goal-points">
            <span class="chip">从右往左读</span>
            <span class="chip">先拆开再合上</span>
            <span class="chip">只少量词形预览</span>
            <span class="chip">词义待审校</span>
          </div>
        </article>

        <div class="alphabet-strip compact">
          ${renderComboSelector(group.items, item.id)}
        </div>

        <div class="letter-focus">
          <div>
            <div class="uyghur letter-big combo-big">${item.value}</div>
            <p class="caption">${item.type} / ${item.latin}</p>
          </div>
        </div>

        <article class="card">
          <p class="caption">拆开看</p>
          <div class="combo-parts" aria-label="组合拆分">
            ${renderComboParts(item)}
          </div>
          <p class="muted">${item.rule}</p>
        </article>

        ${
          item.meaning
            ? `<article class="card review-card">
                <p class="caption">词义预览</p>
                <h2 class="section-title">${item.meaning}</h2>
                <p class="muted">${item.review}</p>
              </article>`
            : ""
        }

        <article class="card">
          <p class="caption">学习小点</p>
          <div class="lesson-point-list">
            <div class="lesson-point">
              <strong>怎么读</strong>
              <span>先用 ${item.latin} 做过渡提示，正式发音以后接真人音频。</span>
            </div>
            <div class="lesson-point">
              <strong>怎么看</strong>
              <span>${item.hint}</span>
            </div>
            <div class="lesson-point">
              <strong>审校状态</strong>
              <span>${item.review}</span>
            </div>
          </div>
        </article>

        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="comboRecognition" type="button">
            辨认
          </button>
          <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
            键盘
          </button>
        </div>
      </section>
    `,
    "learn"
  );
}

function renderComboRecognition() {
  const group = currentComboGroup();
  const item = currentComboItem();
  const choices = currentComboItems();
  const hasPicked = Boolean(state.selectedPicture);
  const picked = choices.find((choice) => choice.id === state.selectedPicture);
  const isCorrect = picked && picked.id === item.id;
  const prompt = item.meaning
    ? `请选择 ${item.latin} 的词形（${item.meaning}：待审校）`
    : `哪一个读作 ${item.prompt}？`;

  return screen(
    `
      ${topBar(
        "组合辨认",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">选择正确组合</p>
          <h2 class="section-title">${prompt}</h2>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedPicture === choice.id;
              const correctChoice = choice.id === item.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-combo"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${choice.value}</span>
                  <span>
                    <strong>${choice.latin}</strong>
                    <span class="caption">${choice.meaning ? `${choice.meaning} / 待审校` : choice.type}</span>
                  </span>
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再想想") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? `答对了。${item.value} 现在只作为 ${item.type} 学习。`
                  : "这个不是当前目标。先看转写提示，再回到组合。"
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
          继续键盘
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComboKeyboard() {
  const group = currentComboGroup();
  const item = currentComboItem();
  const isCorrect = state.keyboardValue === item.value;
  const hasInput = state.keyboardValue.length > 0;

  return screen(
    `
      ${topBar(
        "组合键盘",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">请输入这个组合</p>
          <div class="section-row">
            <strong class="uyghur">${item.value}</strong>
            <span class="caption">${item.latin}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="维吾尔语组合输入框"
          readonly
          dir="rtl"
        />
        <div class="practice-key-row" aria-label="本组组合快捷键">
          ${group.items
            .map(
              (choice) => `
                <button class="key-button uyghur" data-action="key" data-key="${choice.value}" type="button">
                  ${choice.value}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="practice-key-row" aria-label="当前组合拆分键">
          ${item.parts
            .map(
              (part) => `
                <button class="key-button uyghur" data-action="key" data-key="${part}" type="button">
                  ${part}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="keyboard-grid" aria-label="维吾尔语虚拟键盘">
          ${keyboardRows
            .flat()
            .map(
              (key) => `
                <button class="key-button uyghur" data-action="key" data-key="${key}" type="button">
                  ${key}
                </button>
              `
            )
            .join("")}
          <button class="key-button utility" data-action="backspace" type="button">删除</button>
          <button class="key-button utility" data-action="clear-input" type="button">清空</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "输入正确。你已经完成这组组合练习。"
                  : `继续输入，目标组合是 ${item.value}。`
              }</div>`
            : `<div class="feedback">提示：可以直接点击 <span class="uyghur">${item.value}</span>，也可以按拆分键慢慢输入。</div>`
        }
        <button class="primary-button" data-action="go" data-target="comboComplete" type="button">
          完成这一组
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComboComplete() {
  const group = currentComboGroup();
  const item = currentComboItem();
  const groupValues = group.items.map((choice) => choice.value).join(" ");

  return screen(
    `
      ${topBar("第二单元完成", group.title)}
      <section class="stack">
        <article class="card">
          <p class="caption">本次练习</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupValues}</span>
          </h2>
          <p class="muted">你拆分并输入了 ${item.value}。如果这一组有词义，它仍然需要母语者审校后才能进入正式考核。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>组合</span></div>
          <div class="metric"><strong>1</strong><span>输入</span></div>
          <div class="metric"><strong>审校</strong><span>词义</span></div>
        </div>
        <button class="primary-button" data-action="go" data-target="unit" type="button">
          回到第二单元
        </button>
        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          学习路径
        </button>
      </section>
    `,
    "learn"
  );
}

function renderVocabSelector(items, activeId) {
  return items
    .map(
      (item) => `
        <button
          class="letter-pill button-pill ${item.id === activeId ? "active" : ""}"
          data-action="select-vocab"
          data-id="${item.id}"
          type="button"
        >
          <span class="uyghur">${item.value}</span>
          <small>${item.latin}</small>
        </button>
      `
    )
    .join("");
}

function renderAuditRows(item) {
  const rows = [
    ["审校状态", item.reviewStatus],
    ["标准主词", item.standardNote],
    ["变体备注", item.variantNote],
    ["可接受答案", item.acceptableAnswer],
    ["考核方式", item.testPolicy],
    ["来源备注", item.sourceNote]
  ];

  return rows
    .map(
      ([label, value]) => `
        <div class="audit-row">
          <strong>${label}</strong>
          <span>${value}</span>
        </div>
      `
    )
    .join("");
}

function renderVocabLesson() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const longWordClass = item.value.length > 8 ? "long-text" : "";

  return screen(
    `
      ${topBar(
        group.title,
        "第三单元：基础词组与主题词",
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card review-card">
          <div class="section-row">
            <div>
              <p class="caption">审校优先</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${group.status}</span>
          </div>
          <p class="muted">本单元先练词形和输入，中文含义只是预览。正式答案要等母语者审校后再锁定。</p>
        </article>

        <div class="alphabet-strip compact">
          ${renderVocabSelector(group.items, item.id)}
        </div>

        <div class="letter-focus">
          <div>
            <div class="uyghur letter-big vocab-big ${longWordClass}">${item.value}</div>
            <p class="caption">${item.theme} / ${item.latin}</p>
          </div>
        </div>

        <article class="card">
          <p class="caption">中文预览</p>
          <h2 class="section-title">${item.meaning}</h2>
          <p class="muted">${item.tip}</p>
        </article>

        <article class="card">
          <p class="caption">拆开看</p>
          <div class="combo-parts" aria-label="词形拆分">
            ${renderComboParts(item)}
          </div>
        </article>

        <article class="card">
          <p class="caption">词库审校字段</p>
          <div class="audit-grid">
            ${renderAuditRows(item)}
          </div>
        </article>

        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="vocabRecognition" type="button">
            辨认
          </button>
          <button class="primary-button" data-action="go" data-target="vocabKeyboard" type="button">
            键盘
          </button>
        </div>
      </section>
    `,
    "learn"
  );
}

function renderVocabRecognition() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const choices = currentVocabItems();
  const hasPicked = Boolean(state.selectedPicture);
  const picked = choices.find((choice) => choice.id === state.selectedPicture);
  const isCorrect = picked && picked.id === item.id;

  return screen(
    `
      ${topBar(
        "词形辨认",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="vocab" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">选择正确词形</p>
          <h2 class="section-title">请选择 ${item.latin} 的词形</h2>
          <p class="muted">中文预览：${item.meaning}。${item.reviewStatus}，本题只确认词形。</p>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedPicture === choice.id;
              const correctChoice = choice.id === item.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card vocab-choice ${resultClass}"
                  data-action="pick-vocab"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art choice-art-wide uyghur">${choice.value}</span>
                  <span>
                    <strong>${choice.latin}</strong>
                    <span class="caption">${choice.meaning} / ${choice.reviewStatus}</span>
                  </span>
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再想想") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? `答对了。这里确认的是 ${item.value} 的词形，不是最终词义审校。`
                  : "这个不是当前目标词形。正式版会把易混词放入复习。"
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="vocabKeyboard" type="button">
          继续键盘
        </button>
      </section>
    `,
    "learn"
  );
}

function renderVocabKeyboard() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const isCorrect = state.keyboardValue === item.value;
  const hasInput = state.keyboardValue.length > 0;

  return screen(
    `
      ${topBar(
        "词形键盘",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="vocab" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">请输入这个词形</p>
          <div class="section-row">
            <strong class="uyghur">${item.value}</strong>
            <span class="caption">${item.reviewStatus}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="维吾尔语词形输入框"
          readonly
          dir="rtl"
        />
        <div class="practice-key-row" aria-label="本组词形快捷键">
          ${group.items
            .map(
              (choice) => `
                <button class="key-button uyghur" data-action="key" data-key="${choice.value}" type="button">
                  ${choice.value}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="practice-key-row" aria-label="当前词形拆分键">
          ${item.parts
            .map(
              (part) => `
                <button class="key-button uyghur" data-action="key" data-key="${part}" type="button">
                  ${part}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="tool-row">
          <button class="secondary-button" data-action="backspace" type="button">删除</button>
          <button class="secondary-button" data-action="clear-input" type="button">清空</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "输入正确。这个词形已完成本轮练习。"
                  : `继续输入，目标词形是 ${item.value}。`
              }</div>`
            : `<div class="feedback">提示：可以直接点击 <span class="uyghur">${item.value}</span>，也可以按拆分键慢慢输入。</div>`
        }
        <button class="primary-button" data-action="go" data-target="vocabComplete" type="button">
          完成这一组
        </button>
      </section>
    `,
    "learn"
  );
}

function renderVocabComplete() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const groupValues = group.items.map((choice) => choice.value).join(" ");

  return screen(
    `
      ${topBar("第三单元完成", group.title)}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">本次练习</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupValues}</span>
          </h2>
          <p class="muted">你辨认并输入了 ${item.value}。这个单元仍是审校前词库，后续要由母语者确认标准主词、变体和可考答案。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>词形</span></div>
          <div class="metric"><strong>1</strong><span>输入</span></div>
          <div class="metric"><strong>审校</strong><span>含义</span></div>
        </div>
        <button class="primary-button" data-action="go" data-target="unit" type="button">
          回到第三单元
        </button>
        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          学习路径
        </button>
      </section>
    `,
    "learn"
  );
}

function renderPracticeSelector(items, activeId) {
  return items
    .map(
      (item) => `
        <button
          class="letter-pill button-pill ${item.id === activeId ? "active" : ""}"
          data-action="select-practice"
          data-id="${item.id}"
          type="button"
        >
          <span class="uyghur">${item.value}</span>
          <small>${item.latin}</small>
        </button>
      `
    )
    .join("");
}

function renderPracticeChoices(group, item) {
  const hasPicked = Boolean(state.selectedListening);
  const picked = group.items.find((choice) => choice.id === state.selectedListening);
  const isCorrect = picked && picked.id === item.id;

  return `
    <div class="choice-grid">
      ${group.items
        .map((choice) => {
          const selected = state.selectedListening === choice.id;
          const correctChoice = choice.id === item.id;
          const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
          return `
            <button
              class="choice-card vocab-choice ${resultClass}"
              data-action="pick-practice"
              data-id="${choice.id}"
              type="button"
            >
              <span class="choice-art choice-art-wide uyghur">${choice.value}</span>
              <span>
                <strong>${choice.label}</strong>
                <span class="caption">${choice.type} / ${choice.latin}</span>
              </span>
              <span class="step-state">${selected ? (correctChoice ? "正确" : "再听") : "选择"}</span>
            </button>
          `;
        })
        .join("")}
    </div>
    ${
      hasPicked
        ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
            isCorrect
              ? `辨认正确。本轮确认的是 ${item.value} 的词形。`
              : "这个不是当前目标。真实音频上线后，这里会进入错题复习。"
          }</div>`
        : ""
    }
  `;
}

function renderPracticeModeCard(group, item) {
  if (group.mode === "listen") {
    return `
      <article class="card practice-mode-card">
        <div class="audio-strip">
          <button class="play-dot" data-action="toast" type="button" aria-label="播放发音">听</button>
          <div>
            <strong>播放提示：${item.latin}</strong>
            <p class="caption">${item.audioStatus}。现在先用转写提示模拟听音流程。</p>
          </div>
        </div>
        <p class="muted">${item.hint}</p>
      </article>
      ${renderPracticeChoices(group, item)}
    `;
  }

  if (group.mode === "repeat") {
    return `
      <article class="card practice-mode-card">
        <p class="caption">跟读步骤</p>
        <div class="lesson-point-list">
          <div class="lesson-point"><strong>看词形</strong><span class="uyghur">${item.value}</span></div>
          <div class="lesson-point"><strong>看提示</strong><span>${item.latin} / ${item.hint}</span></div>
          <div class="lesson-point"><strong>轻声跟读</strong><span>${item.audioStatus}，正式版会替换成真人音频。</span></div>
        </div>
      </article>
      <button class="primary-button" data-action="mark-repeat" type="button">
        我已跟读
      </button>
      <div class="feedback ${state.practiceSpoken ? "good" : ""}">
        ${state.practiceSpoken ? "已记录本轮跟读。现在可以查看结果。" : "跟读不评分，先建立练习习惯。"}
      </div>
    `;
  }

  if (group.mode === "write") {
    const inputKeys = [item.value, ...item.parts].filter((key, index, keys) => key && keys.indexOf(key) === index);
    const isCorrect = state.keyboardValue === item.value;
    const hasInput = state.keyboardValue.length > 0;

    return `
      <article class="card practice-mode-card">
        <p class="caption">先描摹，再输入</p>
        <div class="practice-drawing-pad ${state.showGuide ? "" : "hide-guide"}" aria-label="第四单元书写画布示意">
          <span class="uyghur guide">${item.value}</span>
        </div>
        <button class="ghost-button" data-action="toggle-guide" type="button">
          ${state.showGuide ? "隐藏参考" : "显示参考"}
        </button>
      </article>
      <input
        class="rtl-input uyghur"
        value="${state.keyboardValue}"
        aria-label="第四单元维吾尔语输入框"
        readonly
        dir="rtl"
      />
      <div class="practice-key-row" aria-label="当前复习项快捷键">
        ${inputKeys
          .map(
            (key) => `
              <button class="key-button uyghur" data-action="key" data-key="${key}" type="button">
                ${key}
              </button>
            `
          )
          .join("")}
      </div>
      <div class="keyboard-grid" aria-label="维吾尔语虚拟键盘">
        ${keyboardRows
          .flat()
          .map(
            (key) => `
              <button class="key-button uyghur" data-action="key" data-key="${key}" type="button">
                ${key}
              </button>
            `
          )
          .join("")}
        <button class="key-button utility" data-action="backspace" type="button">删除</button>
        <button class="key-button utility" data-action="clear-input" type="button">清空</button>
      </div>
      ${
        hasInput
          ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
              isCorrect ? "输入正确。本轮书写和键盘练习完成。" : `继续输入，目标是 ${item.value}。`
            }</div>`
          : `<div class="feedback">提示：可以先点完整词形 <span class="uyghur">${item.value}</span>，再逐步练拆分键。</div>`
      }
    `;
  }

  return `
    <article class="card practice-mode-card">
      <p class="caption">本组复习卡</p>
      <div class="practice-review-list">
        ${group.items
          .map(
            (choice) => `
              <button
                class="practice-review-item ${choice.id === item.id ? "active" : ""}"
                data-action="select-practice"
                data-id="${choice.id}"
                type="button"
              >
                <span class="uyghur">${choice.value}</span>
                <span>
                  <strong>${choice.label}</strong>
                  <small>${choice.hint}</small>
                </span>
              </button>
            `
          )
          .join("")}
      </div>
    </article>
    <div class="feedback">错题功能先做结构：以后听音、跟读和键盘里的错误会自动进入这里。</div>
  `;
}

function renderPracticeHub() {
  return screen(
    `
      ${topBar("听说与书写强化", "第四单元：复习闭环")}
      <section class="stack">
        <article class="card review-card">
          <div class="section-row">
            <div>
              <p class="caption">本单元原则</p>
              <h2 class="section-title unit-goal-text">不加新词，只复习第一到三单元已经出现过的内容。</h2>
            </div>
            <span class="step-state">进行中</span>
          </div>
          <p class="muted">真实音频还没录制，所以听音和跟读先做流程；第三单元词义继续保持待母语者审校。</p>
        </article>

        <div class="metric-grid" aria-label="第四单元概览">
          <div class="metric"><strong>${practiceGroups.length}</strong><span>训练组</span></div>
          <div class="metric"><strong>${allPracticeItems().length}</strong><span>复习项</span></div>
          <div class="metric"><strong>待录</strong><span>音频</span></div>
        </div>

        <div class="path-list">
          ${practiceGroups.map((group) => renderGroupCard(group)).join("")}
        </div>

        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          查看学习路径
        </button>
      </section>
    `,
    "writing"
  );
}

function renderPracticeSession() {
  const group = currentPracticeGroup();
  const item = currentPracticeItem();
  const longWordClass = item.value.length > 6 ? "long-text" : "";

  return screen(
    `
      ${topBar(
        group.title,
        "第四单元：听说与书写强化",
        "",
        `<button class="back-button" data-action="go" data-target="writing" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">${item.label}</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${group.status}</span>
          </div>
        </article>

        <div class="alphabet-strip compact">
          ${renderPracticeSelector(group.items, item.id)}
        </div>

        <div class="letter-focus practice-target-card">
          <div>
            <div class="uyghur letter-big practice-big ${longWordClass}">${item.value}</div>
            <p class="caption">${item.type} / ${item.latin}</p>
          </div>
        </div>

        ${renderPracticeModeCard(group, item)}

        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="writing" type="button">
            练习中心
          </button>
          <button class="primary-button" data-action="go" data-target="practiceComplete" type="button">
            查看结果
          </button>
        </div>
      </section>
    `,
    "writing"
  );
}

function renderPracticeComplete() {
  const group = currentPracticeGroup();
  const item = currentPracticeItem();
  const listened = group.mode === "listen" ? (state.selectedListening === item.id ? "已辨认" : "未选择") : "可选";
  const repeated = group.mode === "repeat" ? (state.practiceSpoken ? "已跟读" : "未跟读") : "可选";
  const typed = group.mode === "write" ? (state.keyboardValue === item.value ? "已输入" : "未完成") : "可选";

  return screen(
    `
      ${topBar("复习结果", group.title)}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">本轮目标</p>
          <h2 class="screen-title"><span class="uyghur">${item.value}</span></h2>
          <p class="muted">本页只记录练习流程，不确认第三单元词义是否最终正确。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>本组项目</span></div>
          <div class="metric"><strong>待录</strong><span>音频</span></div>
          <div class="metric"><strong>复习</strong><span>状态</span></div>
        </div>
        <article class="card">
          <p class="caption">练习记录</p>
          <div class="audit-grid">
            <div class="audit-row"><strong>听音</strong><span>${listened}</span></div>
            <div class="audit-row"><strong>跟读</strong><span>${repeated}</span></div>
            <div class="audit-row"><strong>键盘</strong><span>${typed}</span></div>
            <div class="audit-row"><strong>备注</strong><span>${item.audioStatus}；正式版会接入错题和音频文件。</span></div>
          </div>
        </article>
        <button class="primary-button" data-action="go" data-target="writing" type="button">
          回到第四单元
        </button>
        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          学习路径
        </button>
      </section>
    `,
    "writing"
  );
}

function renderReviewStatusBadge(statusId) {
  const status = reviewStatusById(statusId);
  return `<span class="review-badge ${status.tone}">${status.label}</span>`;
}

function renderReviewDashboard() {
  const counts = reviewCounts();
  const selected = currentReviewItem();
  const filtered = filteredReviewItems();
  const selectedStatus = reviewStatusById(selected.reviewStatus);
  const selectedAudio = audioStatusById(selected.audioStatus);

  return screen(
    `
      ${topBar(
        "审校看板",
        "回填 / 音频 / 重点项",
        "",
        `<button class="back-button" data-action="go" data-target="home" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card review-card">
          <div class="section-row">
            <div>
              <p class="caption">本地回填流程</p>
              <h2 class="section-title unit-goal-text">先看哪些内容待审校，再把母语者反馈回填成统一状态。</h2>
            </div>
            <span class="step-state">草稿</span>
          </div>
          <p class="muted">这里的点击结果只保存在当前原型状态里。正式回填仍然要同步到审校表和课程文件。</p>
        </article>

        <div class="metric-grid review-metrics" aria-label="审校概览">
          <div class="metric"><strong>${counts.pending}</strong><span>待审校</span></div>
          <div class="metric"><strong>${counts.needsEdit}</strong><span>需修改</span></div>
          <div class="metric"><strong>${counts.family}</strong><span>家庭重点</span></div>
          <div class="metric"><strong>${counts.aiTemp}</strong><span>AI 临时</span></div>
          <div class="metric"><strong>${counts.audioPending}</strong><span>音频待录</span></div>
          <div class="metric"><strong>${counts.needsRerecord}</strong><span>需重录</span></div>
        </div>

        <div class="review-filter-row" aria-label="审校筛选">
          ${reviewFilters
            .map(
              (filter) => `
                <button
                  class="review-filter ${state.reviewFilter === filter.id ? "active" : ""}"
                  data-action="set-review-filter"
                  data-id="${filter.id}"
                  type="button"
                >
                  ${filter.label}
                </button>
              `
            )
            .join("")}
        </div>

        <article class="card ${selected.priority ? "priority-review-card" : ""}">
          <div class="section-row">
            <div>
              <p class="caption">${selected.unit} / ${selected.kind} / ${selected.theme}</p>
              <h2 class="screen-title review-word"><span class="uyghur">${selected.value}</span></h2>
              <p class="caption">${selected.latin} / ${selected.meaning}</p>
            </div>
            ${renderReviewStatusBadge(selected.reviewStatus)}
          </div>
          <div class="audit-grid">
            <div class="audit-row"><strong>审校问题</strong><span>${selected.question}</span></div>
            <div class="audit-row"><strong>考核方式</strong><span>${selected.examPolicy}</span></div>
            <div class="audit-row"><strong>音频状态</strong><span>${selectedAudio.label}</span></div>
            <div class="audit-row"><strong>重点标记</strong><span>${selected.priority ? "家庭 / 基础称呼重点项：不设唯一答案" : "普通审校项"}</span></div>
          </div>
        </article>

        <article class="card">
          <p class="caption">回填审校结果</p>
          <div class="status-control-grid">
            ${reviewStatusOptions
              .map(
                (status) => `
                  <button
                    class="status-control ${selected.reviewStatus === status.id ? "active" : ""} ${status.tone}"
                    data-action="apply-review-status"
                    data-id="${status.id}"
                    type="button"
                  >
                    ${status.label}
                  </button>
                `
              )
              .join("")}
          </div>
        </article>

        <article class="card">
          <p class="caption">回填音频状态</p>
          <div class="status-control-grid audio-controls">
            ${audioStatusOptions
              .map(
                (status) => `
                  <button
                    class="status-control ${selected.audioStatus === status.id ? "active" : ""}"
                    data-action="apply-audio-status"
                    data-id="${status.id}"
                    type="button"
                  >
                    ${status.label}
                  </button>
                `
              )
              .join("")}
          </div>
        </article>

        <section class="stack">
          <div class="section-row">
            <h2 class="section-title">审校项目</h2>
            <span class="caption">${filtered.length} / ${counts.total}</span>
          </div>
          <div class="review-item-list">
            ${filtered
              .map(
                (item) => `
                  <button
                    class="review-item ${item.id === selected.id ? "active" : ""} ${item.priority ? "priority" : ""}"
                    data-action="select-review-item"
                    data-id="${item.id}"
                    type="button"
                  >
                    <span class="uyghur">${item.value}</span>
                    <span>
                      <strong>${item.unit} · ${item.theme}</strong>
                      <small>${item.latin} / ${item.meaning}</small>
                    </span>
                    ${renderReviewStatusBadge(item.reviewStatus)}
                  </button>
                `
              )
              .join("")}
          </div>
        </section>
      </section>
    `,
    "profile"
  );
}

function renderLibrary() {
  return screen(
    `
      ${topBar("字母库", "第一单元全部字母")}
      <section class="stack">
        ${allUnitOneLetters()
          .map(
            (letter) => `
              <div class="word-row">
                <span>
                  <strong class="uyghur">${letter.letter}</strong>
                  <span class="caption">${letter.type} / ${letter.latin} / 待审校</span>
                </span>
                <button
                  class="ghost-button"
                  data-action="select-letter"
                  data-id="${letter.id}"
                  data-target="letter"
                  type="button"
                >
                  学习
                </button>
              </div>
            `
          )
          .join("")}
      </section>
    `,
    "library"
  );
}

function renderProfile() {
  const counts = reviewCounts();

  return screen(
    `
      ${topBar("我的", "本地学习记录示意")}
      <section class="stack">
        <article class="card">
          <h2 class="section-title">Ana Tilim 学习者</h2>
          <p class="muted">第一版不需要登录，进度保存在本地。这个页面先展示未来个人中心的样子。</p>
        </article>
        <div class="profile-row"><strong>已开放字母</strong><span>32 / 32</span></div>
        <div class="profile-row"><strong>已开放组合</strong><span>${allComboItems().length}</span></div>
        <div class="profile-row"><strong>候选词库</strong><span>${allVocabItems().length}</span></div>
        <div class="profile-row"><strong>强化训练</strong><span>${allPracticeItems().length}</span></div>
        <div class="profile-row"><strong>待审校</strong><span>${counts.pending}</span></div>
        <div class="profile-row"><strong>AI 临时音频</strong><span>${counts.aiTemp}</span></div>
        <div class="profile-row"><strong>音频待录</strong><span>${counts.audioPending}</span></div>
        <div class="profile-row"><strong>下一步</strong><span>真人音频</span></div>
        <div class="profile-row"><strong>连续学习</strong><span>3 天</span></div>
        <button class="primary-button" data-action="go" data-target="review" type="button">审校看板</button>
        <button class="secondary-button" data-action="toast" type="button">学习提醒</button>
      </section>
    `,
    "profile"
  );
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function playAudio(src, label) {
  if (!src) {
    showToast("这个字母还没有音频文件");
    return;
  }

  if (activeAudio && typeof activeAudio.pause === "function") {
    activeAudio.pause();
  }

  activeAudio = new Audio(src);
  activeAudio
    .play()
    .then(() => {
      showToast(`${label || "字母"}：AI 临时音频`);
    })
    .catch(() => {
      showToast("音频文件还没生成或浏览器暂时不能播放");
    });
}

function goTo(target) {
  state.screen = target;
  render();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (action === "go") {
    const target = button.dataset.target;
    if (target === "combo") {
      state.selectedUnitId = "combos";
    }
    if (target === "vocab") {
      state.selectedUnitId = "basic-phrases";
    }
    if (target === "writing") {
      state.selectedUnitId = "practice";
    }
    if (["picture", "listening", "keyboard", "comboRecognition", "comboKeyboard", "vocabRecognition", "vocabKeyboard", "letterWriting"].includes(target)) {
      resetPracticeState();
    }
    goTo(target);
    return;
  }

  if (action === "open-unit") {
    state.selectedUnitId = button.dataset.id;
    goTo("unit");
    return;
  }

  if (action === "open-group") {
    const group = alphabetGroups.find((item) => item.id === button.dataset.id) || alphabetGroups[0];
    state.selectedUnitId = "letters";
    state.selectedGroupId = group.id;
    state.currentLetterId = group.letters[0].id;
    resetPracticeState();
    goTo("group");
    return;
  }

  if (action === "open-combo-group") {
    const group = comboGroups.find((item) => item.id === button.dataset.id) || comboGroups[0];
    state.selectedUnitId = "combos";
    state.selectedComboGroupId = group.id;
    state.currentComboItemId = group.items[0].id;
    resetComboPracticeState();
    goTo("combo");
    return;
  }

  if (action === "open-vocab-group") {
    const group = vocabGroups.find((item) => item.id === button.dataset.id) || vocabGroups[0];
    state.selectedUnitId = "basic-phrases";
    state.selectedVocabGroupId = group.id;
    state.currentVocabItemId = group.items[0].id;
    resetVocabPracticeState();
    goTo("vocab");
    return;
  }

  if (action === "open-practice-group") {
    const group = practiceGroups.find((item) => item.id === button.dataset.id) || practiceGroups[0];
    state.selectedUnitId = "practice";
    state.selectedPracticeGroupId = group.id;
    state.currentPracticeItemId = group.items[0].id;
    resetPracticeSessionState();
    goTo("practiceSession");
    return;
  }

  if (action === "pick-picture") {
    state.selectedPicture = button.dataset.id;
    render();
    return;
  }

  if (action === "pick-listening") {
    state.selectedListening = button.dataset.id;
    render();
    return;
  }

  if (action === "pick-combo") {
    state.selectedPicture = button.dataset.id;
    render();
    return;
  }

  if (action === "pick-vocab") {
    state.selectedPicture = button.dataset.id;
    render();
    return;
  }

  if (action === "pick-practice") {
    state.selectedListening = button.dataset.id;
    render();
    return;
  }

  if (action === "set-review-filter") {
    state.reviewFilter = button.dataset.id;
    const firstFilteredItem = filteredReviewItems()[0];
    if (firstFilteredItem) {
      state.selectedReviewItemId = firstFilteredItem.id;
    }
    render();
    return;
  }

  if (action === "select-letter") {
    const group = groupForLetter(button.dataset.id);
    if (group) {
      state.selectedGroupId = group.id;
    }
    state.currentLetterId = button.dataset.id;
    resetPracticeState();
    if (button.dataset.target) {
      state.screen = button.dataset.target;
    }
    render();
    return;
  }

  if (action === "select-combo") {
    const group = comboGroupForItem(button.dataset.id);
    if (group) {
      state.selectedComboGroupId = group.id;
    }
    state.currentComboItemId = button.dataset.id;
    resetComboPracticeState();
    render();
    return;
  }

  if (action === "select-vocab") {
    const group = vocabGroupForItem(button.dataset.id);
    if (group) {
      state.selectedVocabGroupId = group.id;
    }
    state.currentVocabItemId = button.dataset.id;
    resetVocabPracticeState();
    render();
    return;
  }

  if (action === "select-practice") {
    const group = practiceGroupForItem(button.dataset.id);
    if (group) {
      state.selectedPracticeGroupId = group.id;
    }
    state.currentPracticeItemId = button.dataset.id;
    resetPracticeSessionState();
    render();
    return;
  }

  if (action === "select-review-item") {
    state.selectedReviewItemId = button.dataset.id;
    render();
    return;
  }

  if (action === "apply-review-status") {
    updateReviewItem(state.selectedReviewItemId, { reviewStatus: button.dataset.id });
    render();
    return;
  }

  if (action === "apply-audio-status") {
    updateReviewItem(state.selectedReviewItemId, { audioStatus: button.dataset.id });
    render();
    return;
  }

  if (action === "mark-repeat") {
    state.practiceSpoken = true;
    render();
    return;
  }

  if (action === "key") {
    state.keyboardValue += button.dataset.key;
    render();
    return;
  }

  if (action === "backspace") {
    state.keyboardValue = state.keyboardValue.slice(0, -1);
    render();
    return;
  }

  if (action === "clear-input") {
    state.keyboardValue = "";
    render();
    return;
  }

  if (action === "toggle-guide") {
    state.showGuide = !state.showGuide;
    render();
    return;
  }

  if (action === "toggle-favorite") {
    state.favorite = !state.favorite;
    render();
    showToast(state.favorite ? "已加入收藏" : "已取消收藏");
    return;
  }

  if (action === "play-audio") {
    playAudio(button.dataset.audioSrc, button.dataset.audioLabel);
    return;
  }

  if (action === "toast") {
    showToast("这个功能会在正式版加入");
  }
});

render();
