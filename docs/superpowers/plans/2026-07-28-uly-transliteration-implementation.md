# Ana Tilim ULY 注音实施计划

日期：2026-07-28  
设计依据：`docs/superpowers/specs/2026-07-28-uly-transliteration-design.md`  
视觉依据：用户选择的方案 1（维吾尔文 → 小号 ULY → 中文）

## 工作约束

- 继续使用当前 `codex/ana-tilim-prototype` 分支和现有未提交工作区。
- 只修改 ULY 注音、显示设置、对应测试和 QA 证据；不重命名或移动音频文件。
- 当前工作区包含用户既有修改，不执行重置、清理、批量暂存或提交。
- 每个实现步骤先写失败测试，再写最小实现，随后运行相关测试。

## 任务 1：建立 ULY 转写与课程数据补全层

**文件**

- 新建：`prototype/uly-transliteration.js`
- 修改：`prototype/course-data.js`
- 修改：`prototype/index.html`
- 新建：`tests/uly-transliteration.test.mjs`
- 修改：`scripts/check-project.mjs`

**失败测试**

1. 覆盖核心字母：`خ → x`、`چ → ch`、`ش → sh`、`غ → gh`、`ڭ → ng`、`ې → ë`、`ۆ → ö`、`ۈ → ü`。
2. 覆盖隔音规则：
   - `ئالما → alma`
   - `ئائىلە → a'ile`
   - `خەلقئارا → xelq'ara`
3. 覆盖词组与标点：
   - `سۇس كۆك → sus kök`
   - 阿拉伯逗号和问号转换为拉丁标点。
4. 覆盖句首大写，但不改变词中变音字母。
5. 覆盖课程补全函数，确保现有对象获得 `latin`，同时不改变 `audio`、`outputPath` 或音频 ID。

**最小实现**

- 以 IIFE 暴露 `window.ANA_TILIM_ULY`。
- 提供：
  - `transliterateUyghur(value, options)`
  - `normalizeCourseTransliterations(course)`
- `course-data.js` 聚合数据后调用补全函数。
- `index.html` 在课程数据前加载转写模块。
- `scripts/check-project.mjs` 增加语法检查和单元测试。

**验证**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/uly-transliteration.test.mjs
```

## 任务 2：全量校对课程 ULY 数据

**文件**

- 修改：`tests/course-data-integrity.test.mjs`
- 必要时修改：`prototype/uly-transliteration.js`
- 必要时修改：`prototype/course-data/alphabet-data.js`
- 必要时修改：`prototype/course-data/combo-data.js`
- 必要时修改：`prototype/course-data/vocab-data.js`
- 必要时修改：`prototype/course-data/reading-data.js`

**失败测试**

1. 所有 32 个字母、34 个组合、209 个主题词汇和 164 条阅读内容都有非空 ULY。
2. 所有字母位置例词，包括原先缺失的 12 个不重复词，都有非空 ULY。
3. 验证已知高风险词：
   - `ئائىلە → a'ile`
   - `ئەسسالامۇ ئەلەيكۇم → essalamu eleykum`
   - `مېۋە → mëwe`
   - `سائەت → sa'et`
   - `خەلقئارا → xelq'ara`
4. 验证所有 ULY 只包含允许的拉丁字母、`ë/ö/ü`、空格、连字符、撇号和拉丁标点。
5. 验证课程补全前后的音频目标集合完全一致。

**最小实现**

- 自动生成规则覆盖常规词和句子。
- 只有确有标准拼写依据的借词、人名或缩写才进入显式例外表。
- 不保留与 ULY 正字法冲突的旧拉丁值。

**验证**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/course-data-integrity.test.mjs
```

## 任务 3：加入全局“显示拉丁转写”设置

**文件**

- 修改：`prototype/app.js`
- 修改：`tests/unit-learning-experience.test.mjs`

**失败测试**

1. `normalizePreferences(null)` 默认返回 `showLatin: true`。
2. 合法布尔值可恢复；无效值回退为 `true`。
3. “我的 → 设置 → 学习偏好”显示“显示拉丁转写”开关。
4. 点击开关后保存设置、重新渲染并更新 `app.dataset.showLatin`。
5. 刷新恢复后保持用户选择。

**最小实现**

- 在 `DEFAULT_PREFERENCES`、`normalizePreferences`、`applyPreferencesToRoot`、设置面板和点击处理器中接入 `showLatin`。
- 新增统一渲染助手，只在设置开启且值非空时输出 ULY；关闭时不输出占位元素。

**验证**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

## 任务 4：按方案 1 接入字母、组合、词汇与阅读界面

**文件**

- 修改：`prototype/app.js`
- 修改：`prototype/styles.css`
- 修改：`tests/unit-learning-experience.test.mjs`
- 修改：`tests/full-content-render.test.mjs`

**失败测试**

1. 字母焦点区、字母选择条和位置例词显示受控 ULY。
2. 基础组合焦点区和选择条显示受控 ULY。
3. 主题词汇按“维吾尔文 → ULY → 中文”显示。
4. 语法、对话、故事、名言和谚语均按“维吾尔文 → ULY → 中文”显示。
5. ULY 元素具有 `dir="ltr"` 和独立双向文本处理。
6. 关闭设置后不渲染 ULY 元素，也不保留空行。
7. 作答前的字母辨认、读音选择、听写和键盘选项不新增 ULY、拆分或中文答案提示。
8. 完整 464 个渲染状态继续通过。

**最小实现**

- 复用统一渲染助手，避免每个页面自行判断。
- 新增 `.latin-transliteration` 及场景类：
  - 例词约 14px；
  - `--ink-soft`；
  - 常规字重；
  - `direction: ltr`；
  - 自然换行。
- 维吾尔文、红色目标字母和中文层级保持现状。

**验证**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs
```

## 任务 5：完整回归与浏览器视觉 QA

**文件**

- 新建或更新：`design-qa.md`
- 保存截图：`artifacts/uly-transliteration/`

**回归**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
```

**浏览器核对**

1. 使用当前项目的应用内浏览器。
2. 核对字母 `خ`：
   - 焦点注音为 `x`；
   - 位置例词出现 ULY；
   - 设置关闭后 ULY 完整消失。
3. 核对一个主题词汇页面和一个长阅读句子页面。
4. 核对桌面视口和 390px 手机视口，确认无裁切、横向溢出或异常空白。
5. 检查设置开关可操作、刷新后保持、练习选项不泄题。
6. 检查控制台错误。
7. 将所选方案图与实现截图置于同一比较图中，按字体、间距、颜色、内容和响应式进行比较。
8. 如有 P0/P1/P2 问题，修复后以相同视口重截并重新比较；最终 `design-qa.md` 必须写明 `final result: passed`。

## 完成条件

- 设计文档状态为“用户已确认”。
- 新增测试先失败、实现后通过。
- 全部 ULY 数据完整且通过高风险词断言。
- 显示开关默认开启、可持久化且覆盖所有学习内容。
- 未作答练习不泄露答案。
- 音频文件、音频 ID 和播放路径未改变。
- `scripts/check-project.mjs` 全部通过。
- 浏览器桌面与手机视觉 QA 通过。
