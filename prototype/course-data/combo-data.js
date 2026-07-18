(() => {
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
      { id: "ana-word", value: "ئانا", latin: "ana", type: "基础称呼预览", parts: ["ئا", "ن", "ا"], prompt: "ana", meaning: "妈妈、母亲", rule: "从 ئا 开始，再接 ن 和 ا。", hint: "先把它当作词形预览，不作为唯一答案。", review: "标准主词待母语者审校。" },
      { id: "apa-word", value: "ئاپا", latin: "apa", type: "基础称呼预览", parts: ["ئا", "پ", "ا"], prompt: "apa", meaning: "妈妈、家庭称呼变体", rule: "从 ئا 开始，再接 پ 和 ا。", hint: "用户已提醒它可能也表示妈妈；正式身份需审校。", review: "变体/口语身份待母语者审校，不直接作为考核唯一答案。" },
      { id: "ata-word", value: "ئاتا", latin: "ata", type: "基础称呼预览", parts: ["ئا", "ت", "ا"], prompt: "ata", meaning: "爸爸、父亲", rule: "从 ئا 开始，再接 ت 和 ا。", hint: "先认词形，正式标准答案需审校。", review: "标准主词待母语者审校。" },
      { id: "dada-word", value: "دادا", latin: "dada", type: "基础称呼预览", parts: ["د", "ا", "د", "ا"], prompt: "dada", meaning: "爸爸、家庭称呼变体", rule: "د 后面通常不继续连接，所以中间会看到断开。", hint: "用户已提醒它可能也表示爸爸；正式身份需审校。", review: "变体/口语身份待母语者审校，不直接作为考核唯一答案。" }
    ]
  }
];

  window.ANA_TILIM_COMBOS = {
    comboGroups
  };
})();
