(() => {
  const vowelLetterIds = Object.freeze(["aa", "ae", "o", "u", "oe", "ue", "ee", "ii"]);
  const consonantLetterIds = Object.freeze([
    "be", "pe", "te", "jim", "che", "khe", "dal", "re", "ze", "zhe", "sin", "shin",
    "ghayn", "fe", "qaf", "kaf", "gaf", "ng", "lam", "mim", "nun", "he", "waw", "ye"
  ]);
  const vowelComparisons = Object.freeze([
    Object.freeze({ id: "a-e", letterIds: Object.freeze(["aa", "ae"]), focus: "开口位置与字形符号" }),
    Object.freeze({ id: "o-u", letterIds: Object.freeze(["o", "u"]), focus: "圆唇字形符号" }),
    Object.freeze({ id: "oe-ue", letterIds: Object.freeze(["oe", "ue"]), focus: "ö 与 ü 的 ULY 符号和真人音频" }),
    Object.freeze({ id: "ee-ii", letterIds: Object.freeze(["ee", "ii"]), focus: "ë 与 i 的字形和真人音频" })
  ]);
  const unit = Object.freeze({
    id: "latin-keyboard-writing",
    name: "拉丁键盘与字母书写强化",
    subtitle: "普通 QWERTY、元辅音分类与 ULY 默写",
    description: "先认识普通拉丁键位，再按元音和辅音整理字母，最后看拉丁提示练习维吾尔字母书写。",
    bullets: Object.freeze(["普通 QWERTY", "8 个元音", "24 个辅音", "拉丁提示默写", "真实字母形式"])
  });

  window.ANA_TILIM_LATIN_WRITING = Object.freeze({
    unit,
    vowelLetterIds,
    consonantLetterIds,
    vowelComparisons
  });
})();
