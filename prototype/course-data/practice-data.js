(() => {
  const alphabetData = window.ANA_TILIM_ALPHABET || {};
  const alphabetLetters = alphabetData.alphabetLetters || [];
  const letterDetails = alphabetData.letterDetails || {};
  const detailsByShape = Object.fromEntries(
    Object.values(letterDetails).map((letter) => [`${letter.letter}|${letter.latin}`, letter])
  );
  const orderedLetters = alphabetLetters
    .map((letter) => detailsByShape[`${letter.letter}|${letter.latin}`])
    .filter(Boolean);

  function practiceItemForLetter(prefix, letter, options = {}) {
    return {
      id: `practice-${prefix}-${letter.id}`,
      letterId: letter.id,
      type: letter.type === "元音" ? "元音" : "字母",
      value: letter.letter,
      latin: letter.latin,
      label: options.label || `${letter.type}字母`,
      hint: options.hint(letter),
      parts: [letter.letter],
      audioStatus: "复用字母真人音频"
    };
  }

  function fullAlphabetPracticeGroup({ id, mode, title, goal, label, hint }) {
    return {
      id,
      kind: "practice",
      mode,
      title,
      letters: orderedLetters.map((letter) => letter.letter),
      goal,
      status: "已开放",
      items: orderedLetters.map((letter) =>
        practiceItemForLetter(mode, letter, {
          label,
          hint
        })
      )
    };
  }

const practiceGroups = [
  fullAlphabetPracticeGroup({
    id: "listening-loop",
    mode: "listen",
    title: "听音辨认",
    goal: "听音后，从 32 个字母里选择正确字母",
    label: "听音字母",
    hint: (letter) => `${letter.letter}，${letter.latin}。${letter.soundHint || letter.cue}`
  }),
  fullAlphabetPracticeGroup({
    id: "repeat-loop",
    mode: "repeat",
    title: "跟读练习",
    goal: "按标准字母顺序跟读 32 个字母",
    label: "跟读字母",
    hint: (letter) => `${letter.letter}，${letter.latin}。${letter.soundHint}`
  }),
  fullAlphabetPracticeGroup({
    id: "writing-loop",
    mode: "write",
    title: "书写",
    goal: "在手写板练 32 个字母的形状和点位",
    label: "书写字母",
    hint: (letter) => letter.writingHint
  }),
  fullAlphabetPracticeGroup({
    id: "keyboard-loop",
    mode: "keyboard",
    title: "键盘",
    goal: "逐个输入 32 个字母，熟悉键盘位置",
    label: "键盘字母",
    hint: (letter) => `只输入 ${letter.letter}，先熟悉键盘位置，再进入组合输入。`
  }),
  {
    id: "review-loop",
    kind: "practice",
    mode: "review",
    title: "错题复习",
    letters: [],
    goal: "练习中答错的字母会自动进入这里",
    status: "自动累计",
    items: []
  }
];

  window.ANA_TILIM_PRACTICE = {
    practiceGroups
  };
})();
