<p align="center">
  <img src="./prototype/assets/logo.png" alt="Ana Tilim logo" width="180" />
</p>

<h1 align="center">Ana Tilim · ئانا تىلىم</h1>

<p align="center">
  A mobile-first Uyghur language learning experience with human audio, guided
  practice, offline progress, and optional cloud sync.
</p>

<p align="center">
  面向中文用户和希望系统学习维吾尔语的学习者，结合真人发音、字母与词汇课程、
  听写练习、离线进度和可选云端同步。
</p>

<p align="center">
  <a href="https://ana-tilim.vercel.app/"><strong>Open the live website / 打开在线网站</strong></a>
  ·
  <a href="https://github.com/nigaray703-ops/ana-tilim">GitHub repository / GitHub 仓库</a>
</p>

## About / 项目介绍

Ana Tilim means “My Mother Tongue.” The project is designed for people learning
Uyghur from the beginning as well as speakers who want to strengthen their
reading, writing, spelling, and keyboard skills.

Ana Tilim 意为“我的母语”。项目既适合从零开始学习维吾尔语的人，也适合会说、
但希望加强识字、书写、拼写和键盘输入能力的学习者。

The learning path connects letter recognition, pronunciation, vocabulary,
listening, reading, writing, and practical use instead of treating them as
isolated exercises.

学习路线把字母识别、发音、词汇、听力、阅读、书写和实际使用连接起来，而不是把它们
拆成互不相关的练习。

## What is included / 已实现内容

- Uyghur alphabet forms, joining behavior, pronunciation guidance, and ULY
  transliteration<br>
  维吾尔文字母形态、连接规则、发音提示和 ULY 拉丁转写
- Vocabulary, combinations, reading material, grammar examples, proverbs,
  quotations, and short stories<br>
  词汇、组合、阅读材料、语法示例、谚语、名人名言和短文
- Bundled human-recorded audio for letters, vocabulary, examples, and reading
  content<br>
  为字母、词汇、例句和阅读内容配套的真人录音
- Listening, dictation, matching, review, and learning-progress activities<br>
  听力、听写、配对、复习和学习进度练习
- Mobile-first interface with right-to-left script support<br>
  手机优先界面及从右到左文字支持
- Browser-based offline progress and backup/restore tools<br>
  浏览器离线学习进度及备份、恢复工具
- Local learning for guests and UID-scoped cloud synchronization after Google
  sign-in<br>
  游客可本地学习；Google 登录后可进行按用户 UID 隔离的云同步
- A re-recording queue for language and audio review<br>
  面向语言审校和音频重录的任务清单

## Language behavior / 语言行为

- Chinese-language systems initially use Chinese; every non-Chinese system
  initially uses English.<br>
  系统语言为中文时初始显示中文；所有非中文系统初始显示英文。
- Learners can switch manually with the compact control in the Home header or
  the full language control in Profile.<br>
  学习者可通过首页顶栏的紧凑切换器，或 Profile 页面的完整语言控件手动切换。
- A manual choice is saved locally and, for Google users, synchronized as an
  account preference.<br>
  手动选择会保存在本地；Google 用户的选择还会作为账户偏好同步。
- Uyghur learning content and audio are shared by Chinese and English modes.<br>
  中文和英文模式共用同一套维吾尔语学习内容和音频。
- All learning translations are bundled locally; no live translation service is
  used.<br>
  所有学习翻译均随项目保存在本地，不使用实时翻译服务。
- Additional interface languages remain future work.<br>
  其他界面语言仍属于未来工作。

## Try it online / 在线体验

The verified public deployment is available at:

已验证的公开网站：

**[https://ana-tilim.vercel.app/](https://ana-tilim.vercel.app/)**

The site is the current mobile-first web prototype. It can be used in a desktop
or mobile browser.

当前上线的是手机优先 Web 原型，可通过电脑或手机浏览器访问。

## Run locally / 本地运行

This is a static HTML, CSS, and JavaScript prototype. Serve it over HTTP so
browser modules, audio, and storage behavior work correctly.

这是一个静态 HTML、CSS 和 JavaScript 原型。请通过本地 HTTP 服务打开，以保证浏览器
模块、音频和存储功能正常运行。

```bash
git clone https://github.com/nigaray703-ops/ana-tilim.git
cd ana-tilim/prototype
python3 -m http.server 4173
```

Then open [http://localhost:4173/](http://localhost:4173/).

运行后打开 [http://localhost:4173/](http://localhost:4173/)。

The Supabase client library is loaded from jsDelivr. Guests can use local
learning features without signing in; Google sign-in and UID-scoped cloud
synchronization require an internet connection.

Supabase 客户端库通过 jsDelivr 加载。游客无需登录即可使用本地学习功能；
Google 登录和按用户 UID 隔离的云同步需要联网。

## Verification / 项目检查

From the repository root, run:

在仓库根目录运行：

```bash
node scripts/check-project.mjs
```

The check runner validates JavaScript syntax, ULY transliteration, course-data
integrity, learning interactions, human-audio manifests and files, cloud-sync
behavior, the Supabase schema, the re-recording queue, full-content rendering,
and Git whitespace.

检查脚本会验证 JavaScript 语法、ULY 转写、课程数据完整性、学习交互、真人音频文件与
清单、云同步行为、Supabase 数据库结构、重录队列、完整内容渲染及 Git 空白字符。

## Repository structure / 项目结构

```text
prototype/                  Web prototype and application assets
  assets/audio/human/       Bundled human-recorded audio
  course-data/              Alphabet, vocabulary, practice, and reading data
  index.html                Prototype entry point
tests/                      Project verification scripts
scripts/check-project.mjs   Complete project check runner
tools/                      Content and audio import utilities
课程/                       Course authoring and review documents
审校与音频准备包/           Language review and recording workflow
资料/                       Original product notes and source material
docs/superpowers/           Design specifications and implementation plans
```

## Data and privacy / 数据与隐私

The source repository is public. The bundled human-language recordings,
curriculum documents, design records, and application source can be downloaded
by anyone.

本仓库为公开仓库。仓库内的真人语言录音、课程文档、设计记录和应用源码均可被任何人
查看和下载。

Learning state is stored locally in the learner's browser by default, so guests
can learn without signing in. After Google sign-in, a snapshot can be
synchronized to Supabase under that learner's authenticated UID. The included
browser configuration uses a publishable client key; access control is enforced
by the included Row Level Security schema.

学习数据默认保存在学习者自己的浏览器中，游客无需登录即可学习。Google 登录后，
学习快照可同步到 Supabase，并按已认证用户的 UID 隔离。网页中使用的是可公开的客户端配置，
数据访问边界由仓库内的 Row Level Security 数据库规则控制。

Do not add service-role keys, database passwords, private API keys, or real user
exports to this repository.

请勿把 service-role 密钥、数据库密码、私有 API 密钥或真实用户导出数据提交到本仓库。

## Current status / 当前状态

Ana Tilim is a working mobile-first web prototype with a verified Vercel
deployment. It is not currently a native iOS or Android application, and the
repository does not claim production-readiness.

Ana Tilim 当前是一个可运行、已部署到 Vercel 的手机优先 Web 原型。它目前不是原生
iOS 或 Android 应用，本仓库也不宣称已经达到正式生产版本标准。

No open-source license is currently included. Public repository visibility does
not by itself grant permission to reuse the curriculum or human recordings.

仓库目前没有附带开源许可证。仓库公开并不自动代表课程内容或真人录音可被自由复用。

## Contributing / 内容审校与贡献

Language, curriculum, or audio corrections should follow the review and
recording workflow in [`审校与音频准备包/`](./审校与音频准备包/). Course-data editing
guidance is available in [`课程/00-课程数据编辑与审校说明.md`](./课程/00-课程数据编辑与审校说明.md).

语言、课程或音频修正请参考
[`审校与音频准备包/`](./审校与音频准备包/) 中的审校与录音流程；课程数据编辑规则见
[`课程/00-课程数据编辑与审校说明.md`](./课程/00-课程数据编辑与审校说明.md)。
