import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const pagePath = "prototype/re-record-audio.html";
const scriptPath = "prototype/re-record-audio.js";
const targets = [
  ["سا", "sa", "rerecord_voice_combo_sa.webm"], ["شا", "sha", "rerecord_voice_combo_sha.webm"],
  ["قا", "qa", "rerecord_voice_combo_qa.webm"], ["كا", "ka", "rerecord_voice_combo_ka.webm"],
  ["سە", "se", "rerecord_voice_combo_se_e.webm"], ["شە", "she", "rerecord_voice_combo_she_e.webm"],
  ["قە", "qe", "rerecord_voice_combo_qe_e.webm"], ["كە", "ke", "rerecord_voice_combo_ke_e.webm"],
  ["نېمە", "nëme · 什么", "rerecord_voice_vocab_nime.webm"],
  ["سىڭىل", "singil · 妹妹", "rerecord_voice_vocab_singil_family.webm"],
  ["دېڭىز", "dëngiz · 海", "rerecord_voice_form_example_1bieeo2.webm"],
  ["ئۈستەل", "üstel · 桌子", "rerecord_voice_vocab_stol_home.webm"],
  ["سۇس كۆك", "sus kök · 浅蓝色", "rerecord_voice_vocab_sus_kok_color.webm"],
  ["ئىچىش", "ichish · 喝", "rerecord_voice_vocab_ichish_action.webm"]
];

const page = fs.readFileSync(pagePath, "utf8");
const script = fs.readFileSync(scriptPath, "utf8");
const contract = `${page}\n${script}`;
for (const [value, label, filename] of targets) {
  assert.ok(contract.includes(value), `${value} should be present in the queue contract`);
  assert.ok(contract.includes(label), `${label} should be present in the queue contract`);
  assert.ok(contract.includes(filename), `${filename} should be present in the queue contract`);
}
for (const id of ["start-recording", "stop-recording", "recording-preview", "download-recording", "next-incomplete", "target-list", "queue-progress"]) {
  assert.match(page, new RegExp(`id="${id}"`), `the page should provide ${id}`);
}
assert.doesNotMatch(page, /bottom-nav|recording-dashboard/i, "the utility should not restore learner navigation or a recording dashboard");

function element(id = "") {
  const listeners = new Map();
  return {
    id, attributes: new Map(), children: [], classList: { add() {}, remove() {}, toggle() {} }, dataset: {}, disabled: false, download: "", hidden: false, href: "", src: "", textContent: "",
    addEventListener(type, listener) { listeners.set(type, listener); },
    append(...items) { this.children.push(...items); },
    click() { listeners.get("click")?.({ preventDefault() {} }); },
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
  };
}

function stream() {
  const track = { stopped: false, stop() { this.stopped = true; } };
  return { track, value: { getTracks: () => [track] } };
}

function harness(getUserMedia) {
  const ids = ["target-value", "target-label", "queue-progress", "completed-count", "target-list", "start-recording", "stop-recording", "recording-status", "recording-preview", "download-recording", "next-incomplete"];
  const elements = new Map(ids.map((id) => [id, element(id)]));
  const recorders = [];
  const urls = [];
  const revoked = [];
  class MediaRecorder {
    static isTypeSupported(type) { return type === "audio/webm;codecs=opus" || type === "audio/webm"; }
    constructor(input, options) { this.stream = input; this.mimeType = options?.mimeType || ""; this.state = "inactive"; this.events = new Map(); recorders.push(this); }
    addEventListener(type, listener) { this.events.set(type, listener); }
    emit(type, event = {}) { this.events.get(type)?.(event); }
    start() { this.state = "recording"; }
    stop() { this.state = "inactive"; }
  }
  class Blob { constructor(parts) { this.size = parts.reduce((sum, part) => sum + (part?.size ?? 0), 0); } }
  const context = {
    Blob, MediaRecorder, console,
    URL: { createObjectURL(blob) { assert.ok(blob.size > 0); const url = `blob:preview-${urls.length + 1}`; urls.push(url); return url; }, revokeObjectURL(url) { revoked.push(url); } },
    document: { createElement() { return element(); }, getElementById(id) { return elements.get(id) || null; } },
    navigator: { mediaDevices: { getUserMedia } }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(script, context, { filename: scriptPath });
  return { elements, recorders, revoked };
}

async function settle() { await Promise.resolve(); await Promise.resolve(); }

{
  const one = stream();
  const two = stream();
  const streams = [one.value, two.value];
  const test = harness(async (constraints) => {
    assert.equal(constraints.audio, true, "recording should request microphone audio");
    assert.deepEqual(Object.keys(constraints), ["audio"], "recording should request microphone audio only");
    return streams.shift();
  });
  const { elements, recorders } = test;
  const list = elements.get("target-list");
  assert.deepEqual(list.children.map((item) => item.textContent), targets.map(([value]) => value), "all 14 targets should be reachable in stable specified order");
  assert.equal(elements.get("target-value").textContent, "سا");
  assert.equal(elements.get("target-label").textContent, "sa");
  assert.match(elements.get("queue-progress").textContent, /1\s*\/\s*14/);

  elements.get("start-recording").click(); await settle();
  assert.equal(recorders[0].mimeType, "audio/webm;codecs=opus", "recording should use supported WebM");
  recorders[0].emit("dataavailable", { data: { size: 40 } }); elements.get("stop-recording").click(); recorders[0].emit("stop");
  assert.equal(one.track.stopped, true, "stop should release every microphone track");
  assert.equal(elements.get("download-recording").download, "rerecord_voice_combo_sa.webm", "download should use active exact filename");

  elements.get("start-recording").click(); await settle();
  assert.deepEqual(test.revoked, ["blob:preview-1"], "a second take should revoke its prior preview");
  recorders[1].emit("dataavailable", { data: { size: 36 } }); elements.get("stop-recording").click(); recorders[1].emit("stop");
  elements.get("download-recording").click();
  assert.match(elements.get("completed-count").textContent, /1\s*\/\s*14/, "download should mark only active target complete in session");
  assert.equal(elements.get("next-incomplete").hidden, false, "download should enable next-incomplete action");

  list.children[13].click();
  assert.deepEqual(test.revoked, ["blob:preview-1", "blob:preview-2"], "target switching should revoke previous preview");
  assert.equal(elements.get("target-value").textContent, "ئىچىش");
  assert.equal(elements.get("target-label").textContent, "ichish · 喝");
  assert.match(elements.get("queue-progress").textContent, /14\s*\/\s*14/);
  assert.equal(elements.get("download-recording").hidden, true, "switching should not carry a previous take across");
  elements.get("next-incomplete").click();
  assert.equal(elements.get("target-value").textContent, "شا", "next incomplete should find the next unfinished target");
}

{
  const one = stream();
  const two = stream();
  const streams = [one.value, two.value];
  const test = harness(async () => streams.shift());
  const { elements, recorders } = test;
  const list = elements.get("target-list");

  elements.get("start-recording").click(); await settle();
  recorders[0].emit("dataavailable", { data: { size: 40 } });
  elements.get("stop-recording").click();
  list.children[1].click();
  assert.equal(elements.get("target-value").textContent, "سا", "target switching should be rejected while the previous take is finalizing");
  assert.match(elements.get("recording-status").textContent, /生成试听/, "finalizing should keep a clear status while waiting for stop");
  recorders[0].emit("stop");
  assert.equal(one.track.stopped, true, "finalizing should release the previous take's microphone tracks");
  assert.equal(elements.get("download-recording").download, "rerecord_voice_combo_sa.webm", "a finalizing take should keep its immutable target filename");
  elements.get("download-recording").click();
  assert.match(elements.get("completed-count").textContent, /1\s*\/\s*14/, "a finalizing take should only complete its original target");

  list.children[1].click();
  assert.equal(elements.get("target-value").textContent, "شا", "target switching should work after finalization");
  elements.get("start-recording").click(); await settle();
  recorders[1].emit("dataavailable", { data: { size: 36 } });
  elements.get("stop-recording").click(); recorders[1].emit("stop");
  assert.equal(elements.get("download-recording").download, "rerecord_voice_combo_sha.webm", "a switched target should download with its own exact filename");
  elements.get("download-recording").click();
  assert.match(elements.get("completed-count").textContent, /2\s*\/\s*14/, "a switched target should complete only itself");
}

{
  const recorded = stream();
  const test = harness(async () => recorded.value);
  test.elements.get("start-recording").click(); await settle(); test.recorders[0].emit("error");
  assert.equal(recorded.track.stopped, true, "recorder errors should release acquired microphone tracks");
  assert.equal(test.elements.get("start-recording").disabled, false, "recorder errors should restore the idle start control");
  assert.equal(test.elements.get("stop-recording").disabled, true, "recorder errors should restore the idle stop control");
  assert.match(test.elements.get("recording-status").textContent, /录音出现错误/, "recorder errors should show a clear Chinese error");
  assert.equal(test.elements.get("download-recording").hidden, true, "recorder errors should leave download disabled");
}

{
  const test = harness(async () => Promise.reject(new Error("denied")));
  test.elements.get("start-recording").click(); await settle();
  assert.match(test.elements.get("recording-status").textContent, /麦克风/, "denied access should show a clear Chinese error");
  assert.equal(test.elements.get("download-recording").hidden, true, "denied access should leave download disabled");
}

console.log("14-item re-recording queue behavior tests passed.");
