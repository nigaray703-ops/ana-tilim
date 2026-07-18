const course = {
  letter: "ب",
  forms: [
    { label: "独立", value: "ب" },
    { label: "词首", value: "بـ" },
    { label: "词中", value: "ـبـ" },
    { label: "词尾", value: "ـب" }
  ],
  word: "بالا",
  meaning: "字母组合示例",
  transliteration: "bala",
  theme: "字母基础 / 第一组"
};

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

const alphabetGroups = [
  { title: "入门概念", letters: ["RTL", "形态", "点位"], goal: "先知道字母为什么会变形", status: "已开始" },
  { title: "第一组：最小闭环", letters: ["ئا", "ب", "ل"], goal: "先学 1 个元音入口和 2 个简单辅音", status: "进行中" },
  { title: "第二组：高频简单辅音", letters: ["م", "ن", "ت", "س"], goal: "继续熟悉点位和常见连接", status: "排队中" },
  { title: "第三组：点位和形近字", letters: ["پ", "ج", "چ", "ش"], goal: "重点区分点的数量和位置", status: "排队中" },
  { title: "第四组：断开连接字母", letters: ["د", "ر", "ز", "ژ"], goal: "理解哪些字母后面不继续连接", status: "排队中" },
  { title: "第五组：较难发音", letters: ["خ", "غ", "ق", "ك", "گ", "ڭ"], goal: "谨慎处理较难发音", status: "排队中" },
  { title: "第六组：剩余常用辅音", letters: ["ف", "ھ", "ۋ", "ي"], goal: "完成主要辅音认识", status: "排队中" },
  { title: "元音专项", letters: ["ئە", "ئې", "ئى", "ئو", "ئۇ", "ئۆ", "ئۈ"], goal: "系统学习元音和 ئ 的作用", status: "排队中" }
];

const firstGroupLetters = [
  {
    id: "aa",
    letter: "ئا",
    latin: "a",
    type: "元音入口",
    forms: [
      { label: "独立", value: "ئا" },
      { label: "词首", value: "ئا" },
      { label: "词中", value: "ـا" },
      { label: "词尾", value: "ـا" }
    ],
    connection: "可以接收前一个字母的连接，但后面通常不继续连接，所以会造成视觉断开。",
    soundHint: "先接近理解为汉语“啊”的开口音；正式版以真人音频为准。",
    writingHint: "先认识 ئ 和 ا 的组合，不急着讲完 ئ 的所有用法。",
    example: "在 بالا 中，ا 后面不继续连接，后面的 ل 会重新开始。"
  },
  {
    id: "be",
    letter: "ب",
    latin: "b",
    type: "辅音",
    forms: [
      { label: "独立", value: "ب" },
      { label: "词首", value: "بـ" },
      { label: "词中", value: "ـبـ" },
      { label: "词尾", value: "ـب" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为英语 b 或汉语拼音里不送气的 b。",
    writingHint: "主体像平稳的弧线，点在下方；第一版描摹先从 ب 开始。",
    example: "在 با 中，ب 用词首形连接到后面的 ا。"
  },
  {
    id: "lam",
    letter: "ل",
    latin: "l",
    type: "辅音",
    forms: [
      { label: "独立", value: "ل" },
      { label: "词首", value: "لـ" },
      { label: "词中", value: "ـلـ" },
      { label: "词尾", value: "ـل" }
    ],
    connection: "可以连接后面的字母，也可以接收前一个字母的连接。",
    soundHint: "可先接近理解为英语 l；正式版以真人音频为准。",
    writingHint: "注意竖线高度和下方收笔，连接形要贴近同一基线。",
    example: "在 لا 中，ل 连接到后面的 ا，但 ا 后面不继续连接。"
  }
];

const pictureChoices = [
  { id: "bala", title: "正确组合", uyghur: "بالا", art: "بالا", correct: true },
  { id: "bal", title: "少了最后 ا", uyghur: "بال", art: "بال", correct: false },
  { id: "la", title: "只有后半段", uyghur: "لا", art: "لا", correct: false }
];

const listeningChoices = [
  { id: "bala", title: "بالا", meta: "组合 / bala", correct: true },
  { id: "ba", title: "با", meta: "前半段 / ba", correct: false },
  { id: "la", title: "لا", meta: "后半段 / la", correct: false }
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
  currentLetterId: "aa",
  showGuide: true,
  favorite: false
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;

function currentLetter() {
  return firstGroupLetters.find((letter) => letter.id === state.currentLetterId) || firstGroupLetters[0];
}

function render() {
  const screens = {
    welcome: renderWelcome,
    home: renderHome,
    learn: renderLearnPath,
    letter: renderLetter,
    writing: renderWriting,
    picture: renderPicturePractice,
    listening: renderListeningPractice,
    keyboard: renderKeyboardPractice,
    complete: renderComplete,
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

function topBar(title, subtitle, action = "") {
  return `
    <header class="top-row">
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
  return screen(
    `
      ${topBar("早上好", "今天继续 8 分钟就很好")}

      <section class="stack wide-gap">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">今日进度</p>
              <h2 class="section-title">字母基础 · 第一组</h2>
            </div>
            <span class="step-state">52%</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style="--value: 52%"></div>
          </div>
          <p class="caption">继续学习 ئا、ب、ل；先打好字母基础，再进入词汇主题。</p>
          <button class="primary-button" data-action="go" data-target="learn" type="button">
            继续学习
          </button>
        </article>

        <div class="metric-grid" aria-label="今日学习概览">
          <div class="metric"><strong>3</strong><span>连续天数</span></div>
          <div class="metric"><strong>1</strong><span>新字母</span></div>
          <div class="metric"><strong>4</strong><span>待复习</span></div>
        </div>

        <section>
          <div class="section-row">
            <h2 class="section-title">快速入口</h2>
            <button class="ghost-button" data-action="toast" type="button">设置目标</button>
          </div>
          <div class="quick-grid">
            <button class="quick-button" data-action="go" data-target="letter" type="button">
              <strong>学字母</strong><span>第一组 ئا ب ل</span>
            </button>
            <button class="quick-button" data-action="go" data-target="writing" type="button">
              <strong>练书写</strong><span>描摹 ب</span>
            </button>
            <button class="quick-button" data-action="go" data-target="listening" type="button">
              <strong>听发音</strong><span>辨认组合</span>
            </button>
            <button class="quick-button" data-action="go" data-target="keyboard" type="button">
              <strong>键盘训练</strong><span>输入 بالا</span>
            </button>
          </div>
        </section>
      </section>
    `,
    "home"
  );
}

function renderLearnPath() {
  const steps = [
    ["1", "认识第一组", "切换 ئا、ب、ل，查看形态和连接", "letter", "进行中"],
    ["2", "描摹书写", "先用 ب 演示主体和点位", "writing", "下一步"],
    ["3", "组合辨认", "观察 بالا 的字母连接", "picture", "练习"],
    ["4", "听音选择", "听组合音，选择正确写法", "listening", "练习"],
    ["5", "键盘输入", "用维吾尔语键盘输入 بالا", "keyboard", "练习"]
  ];

  return screen(
    `
      ${topBar("字母基础路线", "先字母，再词汇，再句子")}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">完整阶段</p>
              <h2 class="screen-title">${alphabetLetters.length} 个字母</h2>
            </div>
            <span class="step-state">待审校</span>
          </div>
          <p class="muted">Ana Tilim 先从标准维吾尔语字母开始。家庭 / 基础称呼会在字母阶段后单独进入。</p>
          <div class="alphabet-strip" aria-label="完整字母目录">
            ${alphabetLetters
              .map(
                (item, index) => `
                  <span class="letter-pill ${index < 3 ? "active" : ""}">
                    <span class="uyghur">${item.letter}</span>
                    <small>${item.latin}</small>
                  </span>
                `
              )
              .join("")}
          </div>
        </article>

        <article class="group-card">
          <div>
            <p class="caption">当前组</p>
            <h2 class="section-title">第一组：最小闭环</h2>
            <p class="muted">先学 ئا、ب、ل，理解元音入口、点位、连接和键盘输入。</p>
          </div>
          <div class="alphabet-strip compact">
            ${firstGroupLetters
              .map(
                (item) => `
                  <button
                    class="letter-pill button-pill"
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
          <button class="primary-button" data-action="go" data-target="letter" type="button">
            开始第一组
          </button>
        </article>

        <div class="path-list">
          ${alphabetGroups
            .slice(2)
            .map(
              (group) => `
                <div class="group-card locked">
                  <div>
                    <div class="section-row">
                      <strong>${group.title}</strong>
                      <span class="step-state">${group.status}</span>
                    </div>
                    <p class="caption">${group.goal}</p>
                    <div class="alphabet-strip compact">
                      ${group.letters
                        .map((letter) => `<span class="letter-pill"><span class="uyghur">${letter}</span></span>`)
                        .join("")}
                    </div>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>

        <div class="path-list">
          ${steps
            .map(
              ([number, title, desc, target, status]) => `
                <button class="lesson-step" data-action="go" data-target="${target}" type="button">
                  <span class="step-number">${number}</span>
                  <span>
                    <strong>${title}</strong>
                    <span class="caption">${desc}</span>
                  </span>
                  <span class="step-state">${status}</span>
                </button>
              `
            )
            .join("")}
        </div>
        <button class="primary-button" data-action="go" data-target="letter" type="button">
          进入字母页
        </button>
      </section>
    `,
    "learn"
  );
}

function renderLetter() {
  const letter = currentLetter();

  return screen(
    `
      ${topBar(
        "字母学习",
        "第一组：ئا、ب、ل",
        `<button class="icon-button" data-action="toggle-favorite" type="button" aria-label="收藏">${state.favorite ? "★" : "☆"}</button>`
      )}
      <section class="stack">
        <div class="alphabet-strip compact">
          ${firstGroupLetters
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
          <button class="play-dot" data-action="toast" type="button" aria-label="播放发音">听</button>
          <div>
            <strong>发音提示</strong>
            <p class="caption">${letter.soundHint}</p>
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
          <p class="caption">连接规则</p>
          <h2 class="section-title">${letter.connection}</h2>
        </article>
        <article class="card">
          <p class="caption">书写提示</p>
          <p class="muted">${letter.writingHint}</p>
        </article>
        <article class="card">
          <p class="caption">组合观察</p>
          <div class="section-row">
            <strong class="uyghur word-big">${course.word}</strong>
            <div>
              <strong>不是正式词汇课</strong>
              <p class="caption">${letter.example}</p>
            </div>
          </div>
        </article>
        <button class="primary-button" data-action="go" data-target="writing" type="button">
          继续：描摹 ب
        </button>
      </section>
    `,
    "learn"
  );
}

function renderWriting() {
  return screen(
    `
      ${topBar("书写练习", "先描摹，再自己写")}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">目标字母</p>
              <h2 class="section-title">描摹 <span class="uyghur">${course.letter}</span></h2>
            </div>
            <button class="ghost-button" data-action="toggle-guide" type="button">
              ${state.showGuide ? "隐藏参考" : "显示参考"}
            </button>
          </div>
        </article>
        <div class="drawing-pad ${state.showGuide ? "" : "hide-guide"}" aria-label="书写画布示意">
          <span class="uyghur guide">${course.letter}</span>
          <span class="stroke-line" aria-hidden="true"></span>
        </div>
        <div class="tool-row">
          <button class="secondary-button" data-action="toast" type="button">撤销</button>
          <button class="secondary-button" data-action="toast" type="button">清除</button>
          <button class="secondary-button" data-action="toast" type="button">重做</button>
        </div>
        <div class="feedback">
          第一版先用 ب 演示主体弧线和下方点位；后续再扩展 ئا、ل 和更多字母。
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
  const hasPicked = Boolean(state.selectedPicture);
  const picked = pictureChoices.find((choice) => choice.id === state.selectedPicture);

  return screen(
    `
      ${topBar("组合辨认", "先看字母组合，不急着学词义")}
      <section class="stack">
        <article class="card">
          <p class="caption">选择正确组合</p>
          <h2 class="section-title">
            哪一个完整写成 <span class="uyghur">${course.word}</span>？
          </h2>
        </article>
        <div class="choice-grid">
          ${pictureChoices
            .map((choice) => {
              const selected = state.selectedPicture === choice.id;
              const resultClass = selected ? (choice.correct ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-picture"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${choice.art}</span>
                  <span>
                    <strong>${choice.title}</strong>
                    <span class="caption uyghur">${choice.uyghur}</span>
                  </span>
                  <span class="step-state">${selected ? (choice.correct ? "正确" : "再想想") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${picked.correct ? "good" : "bad"}">${
                picked.correct
                  ? "答对了。这里先把 بالا 当作字母组合观察。"
                  : "这个不是目标组合。正式版会把错误放入复习。"
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
  const hasPicked = Boolean(state.selectedListening);
  const picked = listeningChoices.find((choice) => choice.id === state.selectedListening);

  return screen(
    `
      ${topBar("听音选择", "听标准音后选择组合")}
      <section class="stack">
        <div class="audio-strip">
          <button class="play-dot" data-action="toast" type="button" aria-label="播放发音">听</button>
          <div>
            <strong>播放：${course.transliteration}</strong>
            <p class="caption">正式版会播放真人音频，可慢速和循环。</p>
          </div>
        </div>
        <div class="choice-grid">
          ${listeningChoices
            .map((choice) => {
              const selected = state.selectedListening === choice.id;
              const resultClass = selected ? (choice.correct ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-listening"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${choice.title}</span>
                  <span>
                    <strong class="uyghur">${choice.title}</strong>
                    <span class="caption">${choice.meta}</span>
                  </span>
                  <span class="step-state">${selected ? (choice.correct ? "正确" : "再听") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${picked.correct ? "good" : "bad"}">${
                picked.correct
                  ? "听对了。下一步用键盘输入这个组合。"
                  : "这个读音不对应目标组合。可以再点播放按钮听一次。"
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
  const isCorrect = state.keyboardValue === course.word;
  const hasInput = state.keyboardValue.length > 0;

  return screen(
    `
      ${topBar("键盘输入", "用内置键盘输入维吾尔语")}
      <section class="stack">
        <article class="card">
          <p class="caption">请输入这个组合</p>
          <div class="section-row">
            <strong>${course.meaning}</strong>
            <span class="caption">${course.transliteration}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="维吾尔语输入框"
          readonly
          dir="rtl"
        />
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
                  : "继续输入，目标组合是 بالا。"
              }</div>`
            : `<div class="feedback">提示：依次点击 ب、ا、ل、ا。</div>`
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
  return screen(
    `
      ${topBar("课程完成", "第一条学习闭环走通了")}
      <section class="stack">
        <article class="card">
          <p class="caption">本次学会</p>
          <h2 class="screen-title">
            第一组 <span class="uyghur">ئا ب ل</span>
          </h2>
          <p class="muted">你看了第一组字母形态、描摹了 ب、完成组合辨认，并用键盘输入了 بالا。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>3</strong><span>字母</span></div>
          <div class="metric"><strong>1</strong><span>组合</span></div>
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

function renderLibrary() {
  return screen(
    `
      ${topBar("字母库", "先作为字母库示意")}
      <section class="stack">
        <div class="word-row">
          <span>
            <strong class="uyghur">ئا</strong>
            <span class="caption">元音入口 / a / 待审校</span>
          </span>
          <button class="ghost-button" data-action="toggle-favorite" type="button">
            ${state.favorite ? "已收藏" : "收藏"}
          </button>
        </div>
        <div class="word-row">
          <span>
            <strong class="uyghur">ب</strong>
            <span class="caption">辅音 / b / 待审校</span>
          </span>
          <button class="ghost-button" data-action="go" data-target="letter" type="button">学习</button>
        </div>
        <div class="word-row">
          <span>
            <strong class="uyghur">ل</strong>
            <span class="caption">辅音 / l / 待审校</span>
          </span>
          <button class="ghost-button" data-action="go" data-target="letter" type="button">学习</button>
        </div>
      </section>
    `,
    "library"
  );
}

function renderProfile() {
  return screen(
    `
      ${topBar("我的", "本地学习记录示意")}
      <section class="stack">
        <article class="card">
          <h2 class="section-title">Ana Tilim 学习者</h2>
          <p class="muted">第一版不需要登录，进度保存在本地。这个页面先展示未来个人中心的样子。</p>
        </article>
        <div class="profile-row"><strong>已学字母</strong><span>3 / 32</span></div>
        <div class="profile-row"><strong>已学组合</strong><span>1 / 1</span></div>
        <div class="profile-row"><strong>连续学习</strong><span>3 天</span></div>
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
    goTo(button.dataset.target);
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

  if (action === "select-letter") {
    state.currentLetterId = button.dataset.id;
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

  if (action === "toast") {
    showToast("这个功能会在正式版加入");
  }
});

render();
