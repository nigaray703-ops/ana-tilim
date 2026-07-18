const course = {
  letter: "ب",
  forms: [
    { label: "独立", value: "ب" },
    { label: "词首", value: "بـ" },
    { label: "词中", value: "ـبـ" },
    { label: "词尾", value: "ـب" }
  ],
  word: "ب",
  meaning: "下方一个点",
  transliteration: "b",
  theme: "第一单元 / 认识字母"
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
  { title: "ب / پ / ت / ن", letters: ["ب", "پ", "ت", "ن"], goal: "同类主体，点多点少都放一起比较", status: "当前" },
  { title: "ج / چ / خ", letters: ["ج", "چ", "خ"], goal: "相似弯形，重点看点在上方还是下方", status: "下一组" },
  { title: "د / ر / ز / ژ", letters: ["د", "ر", "ز", "ژ"], goal: "理解这些字母后面通常不继续连接", status: "待学习" },
  { title: "س / ش", letters: ["س", "ش"], goal: "区分无点齿形和三点齿形", status: "待学习" },
  { title: "غ / ف / ق", letters: ["غ", "ف", "ق"], goal: "先认形，发音以真人音频为准", status: "待学习" },
  { title: "ك / گ / ڭ", letters: ["ك", "گ", "ڭ"], goal: "区分 k、g、ng 的形态", status: "待学习" },
  { title: "ل / م / ھ", letters: ["ل", "م", "ھ"], goal: "用整体轮廓区分无点字母", status: "待学习" },
  { title: "ۋ / ي", letters: ["ۋ", "ي"], goal: "区分不后连的 ۋ 和可连接的 ي", status: "待学习" },
  { title: "元音组", letters: ["ئا", "ئە", "ئو", "ئۇ", "ئۆ", "ئۈ", "ئې", "ئى"], goal: "统一认识 ئ 和元音符号", status: "待学习" }
];

const learningUnits = [
  {
    id: "letters",
    title: "第一单元：认识字母",
    subtitle: "32 个字母 / 相似分组",
    status: "进行中",
    description: "先按截图顺序认识全部字母，学习时把看起来相似、容易混的字母放在一组。",
    bullets: ["认识字母形状", "区分点位和点数", "看四种形态", "练单字母键盘输入"],
    groups: alphabetGroups,
    actionTarget: "letter"
  },
  {
    id: "combos",
    title: "第二单元：组合与词组入门",
    subtitle: "字母连起来 / 简单词组",
    status: "下一单元",
    description: "认识字母之后，再开始两字母组合、三字母组合和最基础词组。",
    bullets: ["两字母组合", "三字母组合", "听音选择", "键盘输入"],
    groups: [
      { title: "开口组合", letters: ["با", "ما", "نا"], goal: "先看辅音接元音", status: "预告" },
      { title: "简单词组", letters: ["待审校"], goal: "审校后再放正式词义和答案", status: "预告" }
    ],
    actionTarget: "picture"
  },
  {
    id: "basic-phrases",
    title: "第三单元：基础词组与主题词",
    subtitle: "问候 / 称呼 / 日常物品",
    status: "规划中",
    description: "从这里开始进入真正的日常表达，家庭 / 基础称呼也放到这里或第二单元后半。",
    bullets: ["标准语主词", "中文含义", "变体备注", "可接受答案"],
    groups: [
      { title: "问候", letters: ["待审校"], goal: "先做最常用表达", status: "规划中" },
      { title: "家庭 / 基础称呼", letters: ["待审校"], goal: "标准说法和地区变体分开", status: "规划中" }
    ],
    actionTarget: "library"
  },
  {
    id: "practice",
    title: "第四单元：听说与书写强化",
    subtitle: "真人音频 / 描摹 / 复习",
    status: "规划中",
    description: "把字母、组合和词组变成能听、能写、能输入的能力。",
    bullets: ["真人音频", "慢速播放", "描摹练习", "错题复习"],
    groups: [
      { title: "听音选择", letters: ["听"], goal: "真人音频上线后启用", status: "规划中" },
      { title: "书写复习", letters: ["写"], goal: "先描摹，再逐步检查", status: "规划中" }
    ],
    actionTarget: "writing"
  }
];

const firstGroupLetters = [
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
    example: "和 پ、ت、ن 放在一起看时，ب 的关键是下方一个点。"
  },
  {
    id: "pe",
    letter: "پ",
    latin: "p",
    type: "辅音",
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
  {
    id: "te",
    letter: "ت",
    latin: "t",
    type: "辅音",
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
  {
    id: "nun",
    letter: "ن",
    latin: "n",
    type: "辅音",
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
  }
];

const pictureChoices = [
  { id: "be", title: "下方一个点", uyghur: "ب", art: "ب", correct: true },
  { id: "pe", title: "下方三个点", uyghur: "پ", art: "پ", correct: false },
  { id: "te", title: "上方两个点", uyghur: "ت", art: "ت", correct: false },
  { id: "nun", title: "上方一个点", uyghur: "ن", art: "ن", correct: false }
];

const listeningChoices = [
  { id: "be", title: "ب", meta: "字母 / b", correct: true },
  { id: "pe", title: "پ", meta: "字母 / p", correct: false },
  { id: "te", title: "ت", meta: "字母 / t", correct: false }
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
  selectedUnitId: "letters",
  showGuide: true,
  favorite: false
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;

function currentLetter() {
  return firstGroupLetters.find((letter) => letter.id === state.currentLetterId) || firstGroupLetters[0];
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
  return screen(
    `
      ${topBar("早上好", "今天继续 8 分钟就很好")}

      <section class="stack wide-gap">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">今日进度</p>
              <h2 class="section-title">第一单元 · 认识字母</h2>
            </div>
            <span class="step-state">52%</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style="--value: 52%"></div>
          </div>
          <p class="caption">继续学习 ب、پ、ت、ن；先把相似字母放在一起认，第二单元再加入词组。</p>
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
              <strong>学字母</strong><span>当前课 ب پ ت ن</span>
            </button>
            <button class="quick-button" data-action="go" data-target="writing" type="button">
              <strong>练书写</strong><span>描摹 ب</span>
            </button>
            <button class="quick-button" data-action="go" data-target="listening" type="button">
              <strong>听发音</strong><span>辨认字母</span>
            </button>
            <button class="quick-button" data-action="go" data-target="keyboard" type="button">
              <strong>键盘训练</strong><span>输入 ب</span>
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
              <h2 class="section-title">${unit.description}</h2>
            </div>
            <span class="step-state">${unit.status}</span>
          </div>
          <div class="chip-row">
            ${unit.bullets.map((point) => `<span class="chip">${point}</span>`).join("")}
          </div>
        </article>

        <div class="path-list">
          ${unit.groups
            .map(
              (group) => `
                <article class="group-card">
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
                </article>
              `
            )
            .join("")}
        </div>

        <button class="primary-button" data-action="go" data-target="${unit.actionTarget}" type="button">
          进入这个单元
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
        "第一单元：ب、پ、ت、ن",
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
          <p class="caption">点位对比</p>
          <div class="section-row">
            <strong class="uyghur word-big">${course.word}</strong>
            <div>
              <strong>先认字母，不急着学词组</strong>
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
      ${topBar("点位辨认", "先看相似字母，不急着学词义")}
      <section class="stack">
        <article class="card">
          <p class="caption">选择正确字母</p>
          <h2 class="section-title">
            哪一个是 <span class="uyghur">${course.word}</span>：下方一个点？
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
                  ? "答对了。ب 的关键是下方一个点。"
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
  const hasPicked = Boolean(state.selectedListening);
  const picked = listeningChoices.find((choice) => choice.id === state.selectedListening);

  return screen(
    `
      ${topBar("听音选择", "听标准音后选择字母")}
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
  const isCorrect = state.keyboardValue === course.word;
  const hasInput = state.keyboardValue.length > 0;

  return screen(
    `
      ${topBar("键盘输入", "用内置键盘输入维吾尔语")}
      <section class="stack">
        <article class="card">
          <p class="caption">请输入这个字母</p>
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
                  : "继续输入，目标字母是 ب。"
              }</div>`
            : `<div class="feedback">提示：点击 ب。</div>`
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
            第一单元 <span class="uyghur">ب پ ت ن</span>
          </h2>
          <p class="muted">你看了当前相似组字母、描摹了 ب、完成点位辨认，并用键盘输入了 ب。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>4</strong><span>字母</span></div>
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

function renderLibrary() {
  return screen(
    `
      ${topBar("字母库", "先作为字母库示意")}
      <section class="stack">
        ${firstGroupLetters
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
  return screen(
    `
      ${topBar("我的", "本地学习记录示意")}
      <section class="stack">
        <article class="card">
          <h2 class="section-title">Ana Tilim 学习者</h2>
          <p class="muted">第一版不需要登录，进度保存在本地。这个页面先展示未来个人中心的样子。</p>
        </article>
        <div class="profile-row"><strong>已学字母</strong><span>4 / 32</span></div>
        <div class="profile-row"><strong>下一单元</strong><span>组合 / 词组</span></div>
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

  if (action === "open-unit") {
    state.selectedUnitId = button.dataset.id;
    goTo("unit");
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
    if (button.dataset.target) {
      state.screen = button.dataset.target;
    }
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
