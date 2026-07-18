const course = {
  letter: "ب",
  forms: [
    { label: "独立", value: "ب" },
    { label: "词首", value: "بـ" },
    { label: "词中", value: "ـبـ" },
    { label: "词尾", value: "ـب" }
  ],
  word: "بالا",
  meaning: "孩子",
  transliteration: "bala",
  theme: "家庭 / 基础称呼"
};

const pictureChoices = [
  { id: "child", title: "孩子", uyghur: "بالا", art: "بالا", correct: true },
  { id: "bread", title: "面包", uyghur: "نان", art: "نان", correct: false },
  { id: "water", title: "水", uyghur: "سۇ", art: "سۇ", correct: false }
];

const listeningChoices = [
  { id: "bala", title: "بالا", meta: "孩子 / bala", correct: true },
  { id: "ana", title: "ئانا", meta: "母亲 / ana", correct: false },
  { id: "ata", title: "ئاتا", meta: "父亲 / ata", correct: false }
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
  showGuide: true,
  favorite: false
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;

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
    ["library", "词库", iconLibrary()],
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
              <h2 class="section-title">MVP-0 第一课</h2>
            </div>
            <span class="step-state">52%</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style="--value: 52%"></div>
          </div>
          <p class="caption">继续学习字母 ب 和单词 بالا。</p>
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
              <strong>学字母</strong><span>看四种形态</span>
            </button>
            <button class="quick-button" data-action="go" data-target="writing" type="button">
              <strong>练书写</strong><span>描摹 ب</span>
            </button>
            <button class="quick-button" data-action="go" data-target="listening" type="button">
              <strong>听发音</strong><span>选择正确词</span>
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
    ["1", "认识字母", "查看 ب 的四种形态", "letter", "进行中"],
    ["2", "描摹书写", "手指跟着参考字写", "writing", "下一步"],
    ["3", "图片词汇", "把 بالا 和含义配对", "picture", "练习"],
    ["4", "听力选择", "听标准音后选词", "listening", "练习"],
    ["5", "键盘输入", "用维吾尔语键盘输入", "keyboard", "练习"]
  ];

  return screen(
    `
      ${topBar("学习路径", course.theme)}
      <section class="stack">
        <article class="card">
          <p class="caption">本课目标</p>
          <h2 class="screen-title">学会字母 <span class="uyghur">${course.letter}</span></h2>
          <p class="muted">完成后，你会看到字母形态、写一次、认一个词，并用键盘输入。</p>
        </article>
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
          开始第一课
        </button>
      </section>
    `,
    "learn"
  );
}

function renderLetter() {
  return screen(
    `
      ${topBar(
        "字母学习",
        "认识独立、词首、词中、词尾",
        `<button class="icon-button" data-action="toggle-favorite" type="button" aria-label="收藏">${state.favorite ? "★" : "☆"}</button>`
      )}
      <section class="stack">
        <div class="letter-focus">
          <div class="uyghur letter-big">${course.letter}</div>
        </div>
        <div class="audio-strip">
          <button class="play-dot" data-action="toast" type="button" aria-label="播放发音">听</button>
          <div>
            <strong>发音练习</strong>
            <p class="caption">正式版会播放真人音频。原型先用按钮表示播放。</p>
          </div>
        </div>
        <div class="form-grid">
          ${course.forms
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
          <p class="caption">示例词</p>
          <div class="section-row">
            <strong class="uyghur word-big">${course.word}</strong>
            <div>
              <strong>${course.meaning}</strong>
              <p class="caption">${course.transliteration}</p>
            </div>
          </div>
        </article>
        <button class="primary-button" data-action="go" data-target="writing" type="button">
          继续书写
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
          第一版先做轨迹描摹和自我检查，不做精准手写识别。
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
      ${topBar("图片词汇", "看图认识示例词")}
      <section class="stack">
        <article class="card">
          <p class="caption">选择正确图片</p>
          <h2 class="section-title">
            哪一个是 <span class="uyghur">${course.word}</span>？
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
                  ? "答对了。بالا 在这里表示孩子。"
                  : "这个不是目标词。原型会保留你的选择，正式版会进入错题复习。"
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
      ${topBar("听音选择", "听标准音后选择词")}
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
                  ? "听对了。下一步用键盘输入这个词。"
                  : "这个读音不对应目标词。可以再点播放按钮听一次。"
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
          <p class="caption">请输入这个词</p>
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
                  : "继续输入，目标词是 بالا。"
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
            <span class="uyghur">${course.letter}</span> 和 <span class="uyghur">${course.word}</span>
          </h2>
          <p class="muted">你看了字母形态、描摹了一次、完成选择题，并用键盘输入了目标词。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>1</strong><span>字母</span></div>
          <div class="metric"><strong>1</strong><span>单词</span></div>
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
      ${topBar("词库", "第一批课程词")}
      <section class="stack">
        <div class="word-row">
          <span>
            <strong class="uyghur">${course.word}</strong>
            <span class="caption">${course.meaning} / ${course.transliteration}</span>
          </span>
          <button class="ghost-button" data-action="toggle-favorite" type="button">
            ${state.favorite ? "已收藏" : "收藏"}
          </button>
        </div>
        <div class="word-row">
          <span>
            <strong class="uyghur">ئانا</strong>
            <span class="caption">母亲 / ana</span>
          </span>
          <button class="ghost-button" data-action="toast" type="button">预览</button>
        </div>
        <div class="word-row">
          <span>
            <strong class="uyghur">ئاتا</strong>
            <span class="caption">父亲 / ata</span>
          </span>
          <button class="ghost-button" data-action="toast" type="button">预览</button>
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
        <div class="profile-row"><strong>已学字母</strong><span>1 / 32</span></div>
        <div class="profile-row"><strong>已学单词</strong><span>1 / 10</span></div>
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
