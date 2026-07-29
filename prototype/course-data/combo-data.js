(() => {
const comboGroups = [
  {
    id: "open-a",
    kind: "combo",
    title: "开口组合：ا",
    letters: ["با", "پا", "تا", "نا", "لا", "ما", "سا", "شا", "قا", "كا"],
    goal: "先把熟悉辅音接到 ا 后面，慢慢看连接变化",
    status: "当前",
    items: [
      { id: "ba", value: "با", latin: "ba", type: "两字母组合", parts: ["ب", "ا"], prompt: "ba", rule: "从右往左看：ب 接 ا，形成 ba。", hint: "ب 在词首会接住后面的 ا。", review: "组合练习，不作为正式词义。" },
      { id: "pa", value: "پا", latin: "pa", type: "两字母组合", parts: ["پ", "ا"], prompt: "pa", rule: "پ 和 ا 连起来读 pa。", hint: "注意 پ 的下方三个点。", review: "组合练习，不作为正式词义。" },
      { id: "ta", value: "تا", latin: "ta", type: "两字母组合", parts: ["ت", "ا"], prompt: "ta", rule: "ت 接 ا，读作 ta。", hint: "ت 的上方两个点要保留。", review: "组合练习，不作为正式词义。" },
      { id: "na", value: "نا", latin: "na", type: "两字母组合", parts: ["ن", "ا"], prompt: "na", rule: "ن 接 ا，读作 na。", hint: "ن 的上方一个点要保留。", review: "组合练习，不作为正式词义。" },
      { id: "la", value: "لا", latin: "la", type: "两字母组合", parts: ["ل", "ا"], prompt: "la", rule: "ل 接 ا，读作 la。", hint: "先熟悉 ل 和 ا 的连接样子。", review: "组合练习，不作为正式词义。" },
      { id: "ma", value: "ما", latin: "ma", type: "两字母组合", parts: ["م", "ا"], prompt: "ma", rule: "م 接 ا，读作 ma。", hint: "م 的圆形部分会压缩成连接形。", review: "组合练习，不作为正式词义。" },
      { id: "sa", value: "سا", latin: "sa", type: "两字母组合", parts: ["س", "ا"], prompt: "sa", rule: "س 接 ا，读作 sa。", hint: "س 是齿形字母，接 ا 时前面保持连接线。", review: "组合练习，不作为正式词义。" },
      { id: "sha", value: "شا", latin: "sha", type: "两字母组合", parts: ["ش", "ا"], prompt: "sha", rule: "ش 接 ا，读作 sha。", hint: "和 سا 对比，ش 的上方三点要保留。", review: "组合练习，不作为正式词义。" },
      { id: "qa", value: "قا", latin: "qa", type: "两字母组合", parts: ["ق", "ا"], prompt: "qa", rule: "ق 接 ا，读作 qa。", hint: "ق 的圆形压缩成连接形，再接 ا。", review: "组合练习，不作为正式词义。" },
      { id: "ka", value: "كا", latin: "ka", type: "两字母组合", parts: ["ك", "ا"], prompt: "ka", rule: "ك 接 ا，读作 ka。", hint: "ك 的连接形和 ا 放在一起看。", review: "组合练习，不作为正式词义。" }
    ]
  },
  {
    id: "soft-e",
    kind: "combo",
    title: "轻声组合：ە",
    letters: ["بە", "پە", "تە", "نە", "لە", "مە", "سە", "شە", "قە", "كە"],
    goal: "把同一批辅音换成 ە，比较结尾符号变化",
    status: "可学习",
    items: [
      { id: "be-e", value: "بە", latin: "be", type: "两字母组合", parts: ["ب", "ە"], prompt: "be", rule: "ب 接 ە，形成 be。", hint: "和 با 对比，最后一个符号不同。", review: "组合练习，不作为正式词义。" },
      { id: "pe-e", value: "پە", latin: "pe", type: "两字母组合", parts: ["پ", "ە"], prompt: "pe", rule: "پ 接 ە，形成 pe。", hint: "先看 پ 的三个点，再看 ە。", review: "组合练习，不作为正式词义。" },
      { id: "te-e", value: "تە", latin: "te", type: "两字母组合", parts: ["ت", "ە"], prompt: "te", rule: "ت 接 ە，形成 te。", hint: "和 تا 对比，结尾从 ا 换成 ە。", review: "组合练习，不作为正式词义。" },
      { id: "ne-e", value: "نە", latin: "ne", type: "两字母组合", parts: ["ن", "ە"], prompt: "ne", rule: "ن 接 ە，形成 ne。", hint: "ن 的上方一点是识别关键。", review: "组合练习，不作为正式词义。" },
      { id: "le-e", value: "لە", latin: "le", type: "两字母组合", parts: ["ل", "ە"], prompt: "le", rule: "ل 接 ە，形成 le。", hint: "和 لا 放在一起看差异。", review: "组合练习，不作为正式词义。" },
      { id: "me-e", value: "مە", latin: "me", type: "两字母组合", parts: ["م", "ە"], prompt: "me", rule: "م 接 ە，形成 me。", hint: "م 的连接形和结尾 ە 一起看。", review: "组合练习，不作为正式词义。" },
      { id: "se-e", value: "سە", latin: "se", type: "两字母组合", parts: ["س", "ە"], prompt: "se", rule: "س 接 ە，形成 se。", hint: "同一个 س 接不同元音，末尾符号会变。", review: "组合练习，不作为正式词义。" },
      { id: "she-e", value: "شە", latin: "she", type: "两字母组合", parts: ["ش", "ە"], prompt: "she", rule: "ش 接 ە，形成 she。", hint: "和 سە 对比，只差上方三点。", review: "组合练习，不作为正式词义。" },
      { id: "qe-e", value: "قە", latin: "qe", type: "两字母组合", parts: ["ق", "ە"], prompt: "qe", rule: "ق 接 ە，形成 qe。", hint: "ق 的连接形后面接 ە。", review: "组合练习，不作为正式词义。" },
      { id: "ke-e", value: "كە", latin: "ke", type: "两字母组合", parts: ["ك", "ە"], prompt: "ke", rule: "ك 接 ە，形成 ke。", hint: "ك 的后连式接 ە。", review: "组合练习，不作为正式词义。" }
    ]
  },
  {
    id: "three-step",
    kind: "combo",
    title: "连续连接：三字母",
    letters: ["بال", "مان", "نان", "تال", "بەل", "كەل", "مەن", "سەن"],
    goal: "从两字母过渡到三字母，重点看每个字母在词里的写法",
    status: "可学习",
    items: [
      { id: "bal", value: "بال", latin: "bal", type: "三字母组合", parts: ["ب", "ا", "ل"], prompt: "bal", rule: "先读 با，再接 ل。", hint: "先不要急着背词义，只看三个字母连起来。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "man", value: "مان", latin: "man", type: "三字母组合", parts: ["م", "ا", "ن"], prompt: "man", rule: "先读 ما，再接 ن。", hint: "观察 م 的词首形和 ن 的词尾形。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "nan", value: "نان", latin: "nan", type: "三字母组合", parts: ["ن", "ا", "ن"], prompt: "nan", rule: "先读 نا，再接 ن。", hint: "同一个 ن 在开头和结尾形态不同。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "tal", value: "تال", latin: "tal", type: "三字母组合", parts: ["ت", "ا", "ل"], prompt: "tal", rule: "先读 تا，再接 ل。", hint: "观察 ت 的点和最后 ل 的位置。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "bel", value: "بەل", latin: "bel", type: "三字母组合", parts: ["ب", "ە", "ل"], prompt: "bel", rule: "ب 接 ە，ە 后面不继续连接，所以 ل 重新开始。", hint: "重点看 ە 后面的断开。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "kel", value: "كەل", latin: "kel", type: "三字母组合", parts: ["ك", "ە", "ل"], prompt: "kel", rule: "ك 接 ە，ە 后面断开，再写 ل。", hint: "同样是 ە 导致后面重新开始。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "men-combo", value: "مەن", latin: "men", type: "三字母组合", parts: ["م", "ە", "ن"], prompt: "men", rule: "م 接 ە，ە 后面断开，再写 ن。", hint: "这个词形以后会在词汇里继续出现。", review: "组合练习；如作为词汇使用，需要审校。" },
      { id: "sen-combo", value: "سەن", latin: "sen", type: "三字母组合", parts: ["س", "ە", "ن"], prompt: "sen", rule: "س 接 ە，ە 后面断开，再写 ن。", hint: "和 مەن 对比，开头字母不同。", review: "组合练习；如作为词汇使用，需要审校。" }
    ]
  },
  {
    id: "connection-breaks",
    kind: "combo",
    title: "连接会断开的字母",
    letters: ["دادا", "رەڭ", "قىز", "ۋەتەن", "مېۋە", "تۆگە"],
    goal: "专门看 د、ر、ز、ۋ 和元音类字母后面为什么会断开",
    status: "可学习",
    items: [
      { id: "dada-connection", value: "دادا", latin: "dada", type: "断开连接词形", parts: ["د", "ا", "د", "ا"], prompt: "dada", meaning: "爸爸、家庭称呼变体", rule: "د 和 ا 后面都不继续连接，所以能看到中间断开。", hint: "这个例子很适合看“不接后面”的规则。", review: "变体/口语身份待母语者审校。" },
      { id: "reng-connection", value: "رەڭ", latin: "reng", type: "断开连接词形", parts: ["ر", "ە", "ڭ"], prompt: "reng", meaning: "颜色", rule: "ر 后面不继续连接，ە 后面也不继续连接，所以 ڭ 重新开始。", hint: "连续看到两个会断开的字母。", review: "词形示例，正式考核前待审校。" },
      { id: "qiz-connection", value: "قىز", latin: "qiz", type: "断开连接词形", parts: ["ق", "ى", "ز"], prompt: "qiz", meaning: "女孩", rule: "ق 接 ى，ى 后面不继续连接，最后写 ز。", hint: "看 ى 的前连式和 ز 的独立形。", review: "词形示例，正式考核前待审校。" },
      { id: "weten-connection", value: "ۋەتەن", latin: "weten", type: "断开连接词形", parts: ["ۋ", "ە", "ت", "ە", "ن"], prompt: "weten", meaning: "家园、祖国", rule: "ۋ 和 ە 都容易让后面的字母重新开始。", hint: "先找出哪里断开，再看 ت 和 ن。", review: "词形示例，正式考核前待审校。" },
      { id: "mewe-connection", value: "مېۋە", latin: "mewe", type: "断开连接词形", parts: ["م", "ې", "ۋ", "ە"], prompt: "mewe", meaning: "水果", rule: "م 接 ې，ې 后面断开；ۋ 后面也不继续连接。", hint: "这个例子同时练 ې 和 ۋ。", review: "词形示例，正式考核前待审校。" },
      { id: "toge-connection", value: "تۆگە", latin: "töge", type: "断开连接词形", parts: ["ت", "ۆ", "گ", "ە"], prompt: "töge", meaning: "骆驼", rule: "ت 接 ۆ，ۆ 后面断开，再从 گ 开始。", hint: "看圆唇元音 ۆ 的断开作用。", review: "词形示例，正式考核前待审校。" }
    ]
  }
];

  window.ANA_TILIM_COMBOS = {
    comboGroups
  };
})();
