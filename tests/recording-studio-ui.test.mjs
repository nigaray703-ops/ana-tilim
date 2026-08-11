import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const appPath = path.join(repositoryRoot, "tools/recording-studio/public/app.js");

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.attributes = new Map();
    this.dataset = {};
    this.className = "";
    this.hidden = false;
    this.disabled = false;
    this.value = "";
    this.type = "";
    this.textContent = "";
    this.listeners = new Map();
    this.classList = { toggle: () => {} };
  }

  set id(value) { this.setAttribute("id", value); this.ownerDocument.elements.set(String(value), this); }
  get id() { return this.getAttribute("id") || ""; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) || null; }
  removeAttribute(name) { this.attributes.delete(name); }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = nodes; this.textContent = ""; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  async trigger(name, value = {}) { return this.listeners.get(name)?.({ target: this, preventDefault() {}, ...value }); }
  click() { return this.trigger("click"); }
  focus() { this.ownerDocument.activeElement = this; }
}

class FakeDocument {
  constructor() { this.elements = new Map(); this.activeElement = null; }
  createElement(tag) { return new FakeElement(tag, this); }
  getElementById(id) { return this.elements.get(id) || null; }
  register(id, tag = "div") { const element = this.createElement(tag); element.id = id; this.elements.set(id, element); return element; }
}

function fixtureTarget(stableId, overrides = {}) {
  return {
    stableId,
    category: "alphabet",
    value: "ا",
    latin: "a",
    meaning: "元音",
    english: "vowel",
    currentFile: "current.webm",
    playable: true,
    initialStatus: "pending-review",
    recordingTextHash: "a".repeat(64),
    ...overrides
  };
}

function fixtureState(targets) {
  return {
    schemaVersion: 1,
    updatedAt: "2026-08-10T00:00:00.000Z",
    targets: Object.fromEntries(targets.map((target) => [target.stableId, {
      status: target.initialStatus,
      approvedTakeId: null,
      recordingTextHash: target.recordingTextHash,
      takes: []
    }]))
  };
}

function createHarness({ catalogTargets, state = fixtureState(catalogTargets), routes = {}, mediaDevices, MediaRecorder } = {}) {
  const document = new FakeDocument();
  for (const [id, tag] of [["target-search", "input"], ["category-filter", "select"], ["status-filter", "select"], ["status-cards", "div"], ["target-list", "div"], ["target-detail", "article"], ["import-panel", "section"], ["preview-import", "button"], ["import-plan", "div"], ["apply-import", "button"], ["studio-status", "div"], ["studio-alert", "div"], ["audit-summary", "p"]]) document.register(id, tag);
  const calls = [];
  const windowListeners = new Map();
  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    const route = routes[url];
    const body = typeof route === "function" ? await route({ url, options, calls }) : route ?? (url === "/api/catalog" ? { targets: catalogTargets } : url === "/api/state" ? state : null);
    if (body instanceof Error) throw body;
    if (body?.response) return body.response;
    return { ok: true, status: 200, async json() { return body; } };
  };
  const context = vm.createContext({
    Blob: class { constructor(parts, options) { this.parts = parts; this.type = options?.type; this.size = parts.reduce((size, part) => size + (part.size || part.length || 0), 0); } },
    URL: { createObjectURL: () => "blob:preview", revokeObjectURL() {} },
    Audio: class { constructor() { this.listeners = new Map(); this.src = ""; } addEventListener(name, listener) { this.listeners.set(name, listener); } play() { this.listeners.get("play")?.(); return Promise.resolve(); } },
    MediaRecorder: MediaRecorder || class { static isTypeSupported(type) { return type === "audio/webm"; } },
    TextEncoder,
    document,
    fetch,
    navigator: { mediaDevices: mediaDevices || { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } },
    location: { reload() {} },
    setTimeout,
    clearTimeout,
    addEventListener(name, listener) { windowListeners.set(name, listener); },
    encodeURIComponent,
    console
  });
  vm.runInContext("globalThis.MediaRecorder = MediaRecorder", context);
  const source = fs.readFileSync(appPath, "utf8");
  vm.runInContext(source, context, { filename: appPath });
  return { document, calls, context, windowListeners };
}

function descendants(node, predicate, found = []) {
  if (predicate(node)) found.push(node);
  for (const child of node.children || []) descendants(child, predicate, found);
  return found;
}

function buttonByText(document, label) {
  return descendants(document.getElementById("target-detail"), (element) => element.tagName === "BUTTON" && element.textContent === label)[0]
    || descendants(document.getElementById("import-panel"), (element) => element.tagName === "BUTTON" && element.textContent === label)[0]
    || descendants(document.getElementById("status-cards"), (element) => element.tagName === "BUTTON" && element.textContent.includes(label))[0]
    || document.getElementById(label);
}

test("recording studio app loads the real API and renders the exact audit baseline", async () => {
  const targets = [
    ...Array.from({ length: 524 }, (_, index) => fixtureTarget(`alphabet:pending-${index}`)),
    ...Array.from({ length: 27 }, (_, index) => fixtureTarget(`reading:new-${index}`, {
      category: "reading",
      playable: false,
      initialStatus: "pending"
    })),
    fixtureTarget("alphabet:zhe", { initialStatus: "needs-rerecord" }),
    fixtureTarget("vocab:korushkunche", { category: "vocab", initialStatus: "needs-rerecord" })
  ];
  const { context, document } = createHarness({ catalogTargets: targets });
  await context.recordingStudio.ready;
  assert.match(document.getElementById("audit-summary").textContent, /553/);
  assert.match(document.getElementById("audit-summary").textContent, /待审核已有音频 524/);
  assert.match(document.getElementById("audit-summary").textContent, /需要新录制 27/);
  assert.match(document.getElementById("audit-summary").textContent, /需要重新录制 2/);
  assert.deepEqual(
    document.getElementById("status-filter").children.map((option) => option.textContent),
    ["全部状态", "待审核已有音频", "需要新录制", "需要重新录制", "已录制待采用", "已确认"]
  );
  assert.deepEqual(
    document.getElementById("status-cards").children.map((card) => card.textContent),
    ["待审核已有音频 524", "需要新录制 27", "需要重新录制 2", "已录制待采用 0", "已确认 0"]
  );
  assert.equal(document.getElementById("target-list").children.length, 553);
  assert.equal(document.getElementById("target-list").children[0].getAttribute("aria-current"), "true");
});

test("status cards separate new recordings from rerecords and combine with existing filters without mutation", async () => {
  const targets = [
    fixtureTarget("alphabet:aa"),
    fixtureTarget("alphabet:zhe", { initialStatus: "needs-rerecord" }),
    fixtureTarget("vocab:korushkunche", { category: "vocab", value: "كۆرۈشكىچە", latin: "körüşkiche", initialStatus: "needs-rerecord" })
  ];
  const { context, document, calls } = createHarness({ catalogTargets: targets });
  await context.recordingStudio.ready;

  document.getElementById("category-filter").value = "vocab";
  await document.getElementById("category-filter").trigger("change");
  document.getElementById("target-search").value = "korushkunche";
  await document.getElementById("target-search").trigger("input");
  await buttonByText(document, "需要重新录制").click();

  assert.equal(context.recordingStudio.model.status, "needs-rerecord");
  assert.equal(document.getElementById("target-list").children.length, 1);
  assert.equal(document.getElementById("target-list").children[0].id, "target-vocab%3Akorushkunche");
  assert.equal(buttonByText(document, "需要重新录制").getAttribute("aria-pressed"), "true");

  await buttonByText(document, "需要重新录制").click();
  assert.equal(context.recordingStudio.model.status, "all");
  assert.equal(calls.some((call) => call.url.startsWith("/api/targets/")), false);
});

test("a first-time recording target explains the missing current audio and never exposes current-audio audit actions", async () => {
  const target = fixtureTarget("reading:new-grammar-1", {
    category: "reading",
    value: "مەن كىتاب ئوقۇيمەن.",
    latin: "Men kitab oquymen.",
    playable: false,
    initialStatus: "pending"
  });
  const { context, document } = createHarness({ catalogTargets: [target] });
  await context.recordingStudio.ready;
  const detail = document.getElementById("target-detail");

  assert.equal(descendants(detail, (element) => element.tagName === "AUDIO").length, 0);
  assert.equal(buttonByText(document, "当前音频正确"), null);
  assert.equal(buttonByText(document, "需要重录"), null);
  assert.ok(buttonByText(document, "开始录音"));
  assert.equal(
    descendants(detail, (element) => element.textContent === "这是新增内容，需要首次录制。").length,
    1
  );
});

test("recording studio source keeps the local-only, one-target import safety contract", () => {
  const source = fs.readFileSync(appPath, "utf8");
  assert.match(source, /audio\/webm/);
  assert.match(source, /\/api\/import\/finalize/);
  assert.doesNotMatch(source, /全部删除|bulk.*finalize|stableIds/i);
  assert.match(source, /确认新版并删除这一条旧版备份/);
});

test("target rows retain native button semantics for keyboard operation", () => {
  const source = fs.readFileSync(appPath, "utf8");
  assert.doesNotMatch(source, /setAttribute\("role", "listitem"\)/);
});

test("finalization waits for successful production playback and failed uploads keep an auditionable preview", () => {
  const source = fs.readFileSync(appPath, "utf8");
  assert.match(source, /addEventListener\("playing"/);
  assert.doesNotMatch(source, /addEventListener\("play"/);
  assert.match(source, /录音试听/);
  assert.match(source, /URL\.createObjectURL\(pending\.blob\)/);
});

test("the static shell has one polite status region and supports the required light responsive system", () => {
  const html = fs.readFileSync(path.join(repositoryRoot, "tools/recording-studio/public/index.html"), "utf8");
  const css = fs.readFileSync(path.join(repositoryRoot, "tools/recording-studio/public/styles.css"), "utf8");
  assert.equal((html.match(/aria-live="polite"/g) || []).length, 1);
  assert.match(css, /background: #ffffff/);
  assert.match(css, /grid-template-columns: minmax\(280px/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /overflow-x: hidden/);
});

test("a repeated import clears production-play authorization until that exact replacement starts", async () => {
  const target = fixtureTarget("alphabet:aa");
  let applyNumber = 0;
  const { context, document, calls } = createHarness({
    catalogTargets: [target],
    routes: {
      "/api/import/preview": { planId: "plan-a", operations: [{ stableId: target.stableId, currentSha256: "old", replacementSha256: "new", targetExisted: true }] },
      "/api/import/apply": () => ({ importId: `import-${++applyNumber}`, operations: [{ stableId: target.stableId, replacementSha256: "new", targetExisted: true }] })
    }
  });
  await context.recordingStudio.ready;
  await document.getElementById("preview-import").click();
  await document.getElementById("apply-import").click();
  const current = descendants(document.getElementById("target-detail"), (element) => element.tagName === "AUDIO")[0];
  await current.trigger("playing");
  assert.ok(buttonByText(document, "确认新版并删除这一条旧版备份"));
  await document.getElementById("preview-import").click();
  await document.getElementById("apply-import").click();
  assert.equal(buttonByText(document, "确认新版并删除这一条旧版备份"), null);
  const currentAfterReapply = descendants(document.getElementById("target-detail"), (element) => element.tagName === "AUDIO")[0];
  await currentAfterReapply.trigger("playing");
  await buttonByText(document, "确认新版并删除这一条旧版备份").click();
  const finalize = calls.find((call) => call.url === "/api/import/finalize");
  assert.deepEqual(JSON.parse(finalize.options.body), { importId: "import-2", stableId: "alphabet:aa" });
});

test("apply failure clears its preview and mutation restore focus only after the final render", async () => {
  const target = fixtureTarget("alphabet:aa");
  const failed = { response: { ok: false, status: 400, async json() { return { error: { message: "计划已过期" } }; } } };
  const { context, document } = createHarness({
    catalogTargets: [target],
    routes: {
      "/api/import/preview": { planId: "plan-a", operations: [{ stableId: target.stableId, targetExisted: true }] },
      "/api/import/apply": failed,
      "/api/targets/alphabet%3Aaa/status": { target: {} }
    }
  });
  await context.recordingStudio.ready;
  await document.getElementById("preview-import").click();
  await document.getElementById("apply-import").click();
  assert.equal(context.recordingStudio.model.previewPlan, null);
  assert.equal(document.getElementById("apply-import").disabled, true);
  await buttonByText(document, "需要重录").click();
  assert.equal(document.activeElement.id, "target-alphabet%3Aaa");
});

test("upload, finalization, and recording failures restore focus after their final render", async () => {
  const target = fixtureTarget("alphabet:aa");
  const failed = { response: { ok: false, status: 400, async json() { return { error: { message: "失败" } }; } } };
  const { context, document } = createHarness({
    catalogTargets: [target],
    routes: { "/api/takes/alphabet%3Aaa": failed, "/api/import/finalize": failed },
    mediaDevices: { getUserMedia: async () => { throw new Error("denied"); } }
  });
  await context.recordingStudio.ready;
  context.recordingStudio.model.pendingUpload = { stableId: target.stableId, blob: new context.Blob([Buffer.from("take")], { type: "audio/webm" }) };
  await context.recordingStudio.uploadPending();
  assert.equal(document.activeElement.id, "target-alphabet%3Aaa");
  await context.recordingStudio.startRecording();
  assert.equal(document.activeElement.id, "target-alphabet%3Aaa");
  context.recordingStudio.model.imported.set(target.stableId, { id: "import-1", replacementSha256: "new", hasBackup: true });
  context.recordingStudio.model.playedProduction.set(target.stableId, { importId: "import-1", replacementSha256: "new" });
  await context.recordingStudio.refresh();
  await buttonByText(document, "确认新版并删除这一条旧版备份").click();
  assert.equal(document.activeElement.id, "target-alphabet%3Aaa");
});

test("a failed take upload preserves its exact blob and immutable target until its retry succeeds", async () => {
  const first = fixtureTarget("alphabet:aa");
  const second = fixtureTarget("alphabet:be", { value: "ب" });
  let attempts = 0;
  let microphoneCalls = 0;
  const { context, document, calls } = createHarness({
    catalogTargets: [first, second],
    routes: {
      "/api/takes/alphabet%3Aaa": ({ options }) => {
        attempts += 1;
        return attempts === 1
          ? { response: { ok: false, status: 400, async json() { return { error: { message: "网络失败" } }; } } }
          : { take: { id: "take-a" }, received: options.body };
      }
    },
    mediaDevices: { getUserMedia: async () => { microphoneCalls += 1; return { getTracks: () => [{ stop() {} }] }; } }
  });
  await context.recordingStudio.ready;
  const blob = new context.Blob([Buffer.from("first-take")], { type: "audio/webm" });
  context.recordingStudio.model.pendingUpload = { stableId: first.stableId, blob };
  await context.recordingStudio.uploadPending();
  await document.getElementById("target-alphabet%3Abe").click();
  await context.recordingStudio.startRecording();
  assert.equal(context.recordingStudio.model.selectedStableId, first.stableId);
  assert.equal(context.recordingStudio.model.pendingUpload.blob, blob);
  assert.equal(microphoneCalls, 0);
  await context.recordingStudio.uploadPending();
  const uploads = calls.filter((call) => call.url === "/api/takes/alphabet%3Aaa");
  assert.equal(uploads.length, 2);
  assert.equal(uploads[1].options.body, blob);
  assert.equal(context.recordingStudio.model.pendingUpload, null);
});

test("import preview renders full hashes, exact safe destination, and text-hash verification", async () => {
  const target = fixtureTarget("alphabet:aa", { currentFile: "human_letter_01_a.webm" });
  const oldHash = "a".repeat(64);
  const newHash = "b".repeat(64);
  const { context, document } = createHarness({
    catalogTargets: [target],
    routes: {
      "/api/import/preview": { planId: "plan-a", operations: [{ stableId: target.stableId, currentSha256: oldHash, replacementSha256: newHash, recordingTextHash: target.recordingTextHash, targetExisted: true, targetFilename: target.currentFile, backupDescriptor: "backups/<本次导入批次>/alphabet/human_letter_01_a.webm" }] }
    }
  });
  await context.recordingStudio.ready;
  await document.getElementById("preview-import").click();
  const detail = document.getElementById("import-plan").children[0].textContent;
  assert.match(detail, new RegExp(oldHash));
  assert.match(detail, new RegExp(newHash));
  assert.match(detail, /human_letter_01_a\.webm/);
  assert.match(detail, /backups\/<本次导入批次>\/alphabet\/human_letter_01_a\.webm/);
  assert.match(detail, /录音文本哈希已核对，无变更/);
  assert.match(document.getElementById("apply-import").textContent, /1/);
});

test("a real recorder uploads audio/webm for its original target and always releases microphone tracks", async () => {
  const first = fixtureTarget("alphabet:aa");
  const second = fixtureTarget("alphabet:be", { value: "ب" });
  let stopped = 0;
  const { context, document, calls } = createHarness({
    catalogTargets: [first, second],
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() { stopped += 1; } }] }) }
  });
  vm.runInContext(`globalThis.__recorders = []; globalThis.MediaRecorder = class {
    static isTypeSupported(type) { return type === "audio/webm;codecs=opus"; }
    constructor(stream, options) { this.stream = stream; this.options = options; this.state = "inactive"; this.listeners = new Map(); globalThis.__recorders.push(this); }
    addEventListener(name, listener) { this.listeners.set(name, listener); }
    start() { this.state = "recording"; }
    stop() { this.state = "inactive"; return this.listeners.get("stop")?.(); }
    emit(name, event) { return this.listeners.get(name)?.(event); }
  }`, context);
  await context.recordingStudio.ready;
  await context.recordingStudio.startRecording();
  assert.equal(context.__recorders.length, 1, document.getElementById("studio-status").textContent);
  assert.equal(context.__recorders[0].options.mimeType, "audio/webm;codecs=opus");
  await document.getElementById("target-alphabet%3Abe").click();
  assert.equal(context.recordingStudio.model.selectedStableId, first.stableId);
  await context.__recorders[0].emit("dataavailable", { data: new context.Blob([Buffer.from("audio")], { type: "audio/webm" }) });
  await context.recordingStudio.stopRecording();
  await context.__recorders[0].emit("stop");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const upload = calls.find((call) => call.url === "/api/takes/alphabet%3Aaa");
  assert.ok(upload, JSON.stringify(calls.map((call) => call.url)));
  assert.equal(upload.options.headers["Content-Type"], "audio/webm");
  assert.equal(upload.options.body.type, "audio/webm;codecs=opus");
  assert.ok(stopped > 0);

  await context.recordingStudio.startRecording();
  await context.__recorders[1].emit("error");
  await context.__recorders[1].emit("stop");
  assert.equal(calls.filter((call) => call.url.startsWith("/api/takes/")).length, 1);
  assert.ok(stopped > 1);
});

test("empty recording and beforeunload both release tracks without an upload", async () => {
  const target = fixtureTarget("alphabet:aa");
  let stopped = 0;
  const { context, calls, windowListeners } = createHarness({ catalogTargets: [target], mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() { stopped += 1; } }] }) } });
  vm.runInContext(`globalThis.__recorders = []; globalThis.MediaRecorder = class {
    static isTypeSupported(type) { return type === "audio/webm"; }
    constructor(stream) { this.stream = stream; this.state = "inactive"; this.listeners = new Map(); globalThis.__recorders.push(this); }
    addEventListener(name, listener) { this.listeners.set(name, listener); }
    start() { this.state = "recording"; }
    stop() { this.state = "inactive"; return this.listeners.get("stop")?.(); }
    emit(name, event) { return this.listeners.get(name)?.(event); }
  }`, context);
  await context.recordingStudio.ready;
  await context.recordingStudio.startRecording();
  await context.__recorders[0].emit("stop");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(calls.some((call) => call.url.startsWith("/api/takes/")), false);
  assert.ok(stopped > 0);
  await context.recordingStudio.startRecording();
  windowListeners.get("beforeunload")();
  assert.ok(stopped > 1);
});

test("busy duplicate actions make one request and a new target import never offers finalization", async () => {
  const target = fixtureTarget("alphabet:aa");
  let resolveStatus;
  const pendingStatus = new Promise((resolve) => { resolveStatus = resolve; });
  const { context, document, calls } = createHarness({
    catalogTargets: [target],
    routes: {
      "/api/targets/alphabet%3Aaa/status": async () => { await pendingStatus; return { target: {} }; },
      "/api/import/preview": { planId: "plan-a", operations: [{ stableId: target.stableId, currentSha256: "old", replacementSha256: "new", targetExisted: false, targetFilename: target.currentFile, recordingTextHash: target.recordingTextHash }] },
      "/api/import/apply": { importId: "import-new", operations: [{ stableId: target.stableId, replacementSha256: "new", targetExisted: false }] }
    }
  });
  await context.recordingStudio.ready;
  const first = buttonByText(document, "需要重录").click();
  const second = buttonByText(document, "需要重录").click();
  resolveStatus();
  await Promise.all([first, second]);
  assert.equal(calls.filter((call) => call.url === "/api/targets/alphabet%3Aaa/status").length, 1);
  await document.getElementById("preview-import").click();
  await document.getElementById("apply-import").click();
  const current = descendants(document.getElementById("target-detail"), (element) => element.tagName === "AUDIO")[0];
  await current.trigger("playing");
  assert.equal(buttonByText(document, "确认新版并删除这一条旧版备份"), null);
});

test("searches every target field, combines filters, and one-target audit mutations never import", async () => {
  const targets = [
    fixtureTarget("alphabet:stable-id", { value: "ئۇيغۇر", latin: "uly-key", meaning: "中文关键字", english: "english-key", initialStatus: "pending-review" }),
    fixtureTarget("vocab:other", { category: "vocab", value: "别的", initialStatus: "needs-rerecord", takes: [{ id: "take-one", createdAt: "2026-08-10T00:00:00.000Z", durationMs: 1, size: 1 }] })
  ];
  const state = fixtureState(targets);
  state.targets["vocab:other"].takes = [{ id: "take-one", createdAt: "2026-08-10T00:00:00.000Z", durationMs: 1, size: 1 }];
  const { context, document, calls } = createHarness({ catalogTargets: targets, state });
  await context.recordingStudio.ready;
  for (const query of ["stable-id", "ئۇيغۇر", "uly-key", "中文关键字", "english-key"]) {
    document.getElementById("target-search").value = query;
    await document.getElementById("target-search").trigger("input");
    assert.equal(document.getElementById("target-list").children.length, 1, query);
  }
  document.getElementById("target-search").value = "";
  await document.getElementById("target-search").trigger("input");
  document.getElementById("category-filter").value = "vocab";
  await document.getElementById("category-filter").trigger("change");
  document.getElementById("status-filter").value = "needs-rerecord";
  await document.getElementById("status-filter").trigger("change");
  assert.equal(document.getElementById("target-list").children.length, 1);
  await document.getElementById("target-vocab%3Aother").click();
  await buttonByText(document, "当前音频正确").click();
  await buttonByText(document, "需要重录").click();
  await buttonByText(document, "批准这条 take").click();
  const endpoints = calls.filter((call) => call.url.startsWith("/api/targets/")).map((call) => call.url);
  assert.deepEqual(endpoints, ["/api/targets/vocab%3Aother/approve-current", "/api/targets/vocab%3Aother/status", "/api/targets/vocab%3Aother/approve"]);
  assert.equal(calls.some((call) => call.url.startsWith("/api/import/")), false);
});
