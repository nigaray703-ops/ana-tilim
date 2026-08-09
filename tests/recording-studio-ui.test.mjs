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

  set id(value) { this.setAttribute("id", value); }
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

function createHarness({ catalogTargets, state = fixtureState(catalogTargets), routes = {} } = {}) {
  const document = new FakeDocument();
  for (const [id, tag] of [["target-search", "input"], ["category-filter", "select"], ["status-filter", "select"], ["target-list", "div"], ["target-detail", "article"], ["import-panel", "section"], ["preview-import", "button"], ["import-plan", "div"], ["apply-import", "button"], ["studio-status", "div"], ["studio-alert", "div"], ["audit-summary", "p"]]) document.register(id, tag);
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    const route = routes[url];
    const body = route ?? (url === "/api/catalog" ? { targets: catalogTargets } : url === "/api/state" ? state : null);
    if (body instanceof Error) throw body;
    return { ok: true, status: 200, async json() { return body; } };
  };
  const context = vm.createContext({
    Blob: class { constructor(parts, options) { this.parts = parts; this.type = options?.type; this.size = parts.reduce((size, part) => size + (part.size || part.length || 0), 0); } },
    URL: { createObjectURL: () => "blob:preview", revokeObjectURL() {} },
    Audio: class { constructor() { this.listeners = new Map(); this.src = ""; } addEventListener(name, listener) { this.listeners.set(name, listener); } play() { this.listeners.get("play")?.(); return Promise.resolve(); } },
    MediaRecorder: class { static isTypeSupported(type) { return type === "audio/webm"; } },
    TextEncoder,
    document,
    fetch,
    navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } },
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
