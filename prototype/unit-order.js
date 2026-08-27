(() => {
  const ORDERED_IDS = Object.freeze([
    "letters", "latin-keyboard-writing", "combos", "syllable-training",
    "basic-phrases", "grammar-basics", "sentence-patterns", "dialogue-theater",
    "short-stories", "uyghur-proverbs", "famous-quotes", "afanti-stories"
  ]);
  const UNIT_NAMES = Object.freeze({
    letters: "认识字母",
    "latin-keyboard-writing": "拉丁键盘与字母书写强化",
    combos: "基础组合",
    "syllable-training": "拼读与音节训练营",
    "basic-phrases": "日常用语与词汇",
    "grammar-basics": "语法入门",
    "sentence-patterns": "基础句型",
    "dialogue-theater": "对话小剧场",
    "short-stories": "小故事",
    "uyghur-proverbs": "维吾尔语谚语与智慧短句",
    "famous-quotes": "文化人物主题学习句",
    "afanti-stories": "阿凡提小故事"
  });
  const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

  function buildVisibleUnits(catalog, config = {}) {
    const byId = new Map(catalog.map((unit) => [unit.id, unit]));
    const hidden = new Set(config.hiddenUnitIds || []);
    return ORDERED_IDS.filter((id) => byId.has(id) && !hidden.has(id)).map((id, index) => ({
      ...byId.get(id),
      title: `第${NUMERALS[index]}单元：${UNIT_NAMES[id]}`
    }));
  }

  function nextUnitId(currentId, visibleUnits) {
    const index = visibleUnits.findIndex((unit) => unit.id === currentId);
    return index >= 0 ? visibleUnits[index + 1]?.id || null : null;
  }

  window.ANA_TILIM_UNIT_ORDER = Object.freeze({ ORDERED_IDS, UNIT_NAMES, buildVisibleUnits, nextUnitId });
})();
