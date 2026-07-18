(() => {
const practiceGroups = [
  {
    id: "listening-loop",
    kind: "practice",
    mode: "listen",
    title: "听音辨认",
    letters: ["ب", "با", "مەن"],
    goal: "用 AI 临时音频练辨认，真人音频上线后直接替换",
    status: "已开放",
    items: [
      {
        id: "practice-listen-be",
        type: "字母",
        value: "ب",
        latin: "b",
        label: "第一单元字母",
        hint: "下方一个点。当前用 AI 临时音频练听音，真人音频待录制。",
        parts: ["ب"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-listen-ba",
        type: "组合",
        value: "با",
        latin: "ba",
        label: "第二单元组合",
        hint: "由 ب 和 ا 连成，先听成一个整体。",
        parts: ["ب", "ا"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-listen-men",
        type: "词形",
        value: "مەن",
        latin: "men",
        label: "第三单元候选词",
        hint: "第三单元词义仍待审校，本题只练词形辨认。",
        parts: ["م", "ە", "ن"],
        audioStatus: "AI 临时音频，真人音频待录制"
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
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-repeat-na",
        type: "组合",
        value: "نا",
        latin: "na",
        label: "第二单元组合",
        hint: "先读 ن，再接 ا，保持从右到左看词形。",
        parts: ["ن", "ا"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-repeat-rahmat",
        type: "词形",
        value: "رەھمەت",
        latin: "rehmet",
        label: "第三单元候选词",
        hint: "中文含义仍待审校，先练 رەھمەت 的词形和转写。",
        parts: ["رە", "ھمەت"],
        audioStatus: "AI 临时音频，真人音频待录制"
      }
    ]
  },
  {
    id: "writing-loop",
    kind: "practice",
    mode: "write",
    title: "书写、键盘",
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
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-write-man",
        type: "组合",
        value: "مان",
        latin: "man",
        label: "第二单元三字母慢读",
        hint: "م + ا + ن，注意 ا 后面的连接变化。",
        parts: ["م", "ا", "ن"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-write-ana",
        type: "词形",
        value: "ئانا",
        latin: "ana",
        label: "第三单元候选称呼",
        hint: "家庭称呼不设唯一答案，先练 ئانا 的词形。",
        parts: ["ئا", "ن", "ا"],
        audioStatus: "AI 临时音频，真人音频待录制"
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
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-review-siz",
        type: "词形",
        value: "سىز",
        latin: "siz",
        label: "第三单元候选人称",
        hint: "和 سەن 同组比较，但不在这里考礼貌等级。",
        parts: ["س", "ى", "ز"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-review-five",
        type: "词形",
        value: "بەش",
        latin: "besh",
        label: "第三单元候选数字",
        hint: "数字词义仍待审校确认，先做词形回看。",
        parts: ["ب", "ە", "ش"],
        audioStatus: "AI 临时音频，真人音频待录制"
      }
    ]
  }
];

  window.ANA_TILIM_PRACTICE = {
    practiceGroups
  };
})();
