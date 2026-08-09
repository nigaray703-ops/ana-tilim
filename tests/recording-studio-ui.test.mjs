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
  for (const [id, tag] of [["target-search", "input"], ["category-filter", "select"], ["status-filter", "select"], ["target-list", "div"], ["target-detail", "article"], ["import-panel", "section"], ["preview-import", "button"], ["import-plan", "div"], ["apply-import", "button"], ["studio-status", "div"], ["studio-alert", "div"], ["audit-summary", "p"]]) document.register(id, tag);
  const calls = [];
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
    addEventListener() {},
    encodeURIComponent,
    console
  });
  const source = fs.readFileSync(appPath, "utf8");
  vm.runInContext(source, context, { filename: appPath });
  return { document, calls, context };
}

function descendants(node, predicate, found = []) {
  if (predicate(node)) found.push(node);
  for (const child of node.children || []) descendants(child, predicate, found);
  return found;
}

function buttonByText(document, label) {
  return descendants(document.getElementById("target-detail"), (element) => element.tagName === "BUTTON" && element.textContent === label)[0]
    || descendants(document.getElementById("import-panel"), (element) => element.tagName === "BUTTON" && element.textContent === label)[0]
    || document.getElementById(label);
}

test("recording studio app loads the real API and renders the exact audit baseline", async () => {
  const targets = [
    ...Array.from({ length: 525 }, (_, index) => fixtureTarget(`alphabet:pending-${index}`)),
    fixtureTarget("alphabet:zhe", { initialStatus: "needs-rerecord" }),
    fixtureTarget("vocab:korushkunche", { category: "vocab", initialStatus: "needs-rerecord" })
  ];
  const { context, document } = createHarness({ catalogTargets: targets });
  await context.recordingStudio.ready;
  assert.match(document.getElementById("audit-summary").textContent, /527/);
  assert.match(document.getElementById("audit-summary").textContent, /待审听 525/);
  assert.match(document.getElementById("audit-summary").textContent, /需要重录 2/);
  assert.equal(document.getElementById("target-list").children.length, 527);
  assert.equal(document.getElementById("target-list").children[0].getAttribute("aria-current"), "true");
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
