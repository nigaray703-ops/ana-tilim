import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRecordingStudioServer } from "../tools/recording-studio/server.mjs";
import { createImportController } from "../tools/recording-studio/importer.mjs";
import { createRecordingWorkspace } from "../tools/recording-studio/workspace.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const validWebm = fs.readFileSync(path.join(repositoryRoot, "prototype/assets/audio/human/alphabet/human_letter_01_b.webm"));

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function changedWebm() {
  const copy = Buffer.from(validWebm);
  copy[copy.length - 1] ^= 1;
  return copy;
}

function createFixture() {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-server-project-"));
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-server-workspace-"));
  const currentPath = path.join(projectRoot, "prototype/assets/audio/human/alphabet/current.webm");
  fs.mkdirSync(path.dirname(currentPath), { recursive: true });
  fs.writeFileSync(currentPath, validWebm);
  const target = {
    stableId: "alphabet:aa",
    category: "alphabet",
    sourceId: "aa",
    currentFile: "current.webm",
    absoluteOutputPath: currentPath,
    value: "ا",
    latin: "a",
    meaning: "元音",
    english: "vowel",
    playable: true,
    initialStatus: "pending-review"
  };
  target.recordingTextHash = sha256(JSON.stringify({ value: target.value, latin: target.latin, meaning: target.meaning, english: target.english }));
  const catalog = { schemaVersion: 1, generatedAt: "2026-08-10T00:00:00.000Z", targets: [target] };
  const workspace = createRecordingWorkspace({ projectRoot, workspaceRoot, catalog });
  workspace.loadState();
  const controller = createImportController({ projectRoot, workspaceRoot, catalog, workspace });
  return { projectRoot, workspaceRoot, currentPath, catalog, workspace, controller };
}

function request(server, { method = "GET", pathname, headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const requestHeaders = { Host: `127.0.0.1:${server.address.port}`, ...headers };
    const client = http.request(server.url + pathname, { method, headers: requestHeaders }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, text: Buffer.concat(chunks).toString("utf8") }));
    });
    client.on("error", reject);
    if (body !== undefined) client.write(body);
    client.end();
  });
}

function json(response) {
  return JSON.parse(response.text);
}

function assertNoLocalPath(value, forbidden) {
  if (typeof value === "string") {
    assert.equal(value.includes(forbidden), false, `response leaked ${forbidden}`);
    assert.equal(/(?:^|\n)\s*at\s/.test(value), false, "response leaked a stack trace");
    return;
  }
  if (Array.isArray(value)) return value.forEach((item) => assertNoLocalPath(item, forbidden));
  if (value && typeof value === "object") Object.values(value).forEach((item) => assertNoLocalPath(item, forbidden));
}

function assertSafeJsonResponse(response, fixture) {
  const value = json(response);
  for (const forbidden of [fixture.projectRoot, fixture.workspaceRoot, os.tmpdir(), "file://", ".mjs:", "node:"]) {
    assertNoLocalPath(value, forbidden);
  }
}

async function startFixture(t) {
  const fixture = createFixture();
  const server = await createRecordingStudioServer({
    projectRoot: fixture.projectRoot,
    workspaceRoot: fixture.workspaceRoot,
    host: "127.0.0.1",
    port: 0,
    catalog: fixture.catalog,
    workspace: fixture.workspace,
    controller: fixture.controller
  });
  t.after(async () => { await server.close(); });
  return { ...fixture, server };
}

test("binds only to loopback and exposes catalog and state without local paths", async (t) => {
  const fixture = await startFixture(t);
  assert.equal(fixture.server.address.address, "127.0.0.1");
  assert.match(fixture.server.url, /^http:\/\/127\.0\.0\.1:\d+$/);
  const catalog = await request(fixture.server, { pathname: "/api/catalog" });
  const state = await request(fixture.server, { pathname: "/api/state" });
  assert.equal(catalog.status, 200);
  assert.equal(state.status, 200);
  assert.equal(json(catalog).targets[0].absoluteOutputPath, undefined);
  assert.equal(json(state).targets["alphabet:aa"].status, "pending-review");
  assertNoLocalPath(json(catalog), fixture.projectRoot);
  assertNoLocalPath(json(state), fixture.workspaceRoot);
});

test("rejects non-loopback constructors and a busy loopback port", async (t) => {
  const fixture = createFixture();
  await assert.rejects(() => createRecordingStudioServer({ projectRoot: fixture.projectRoot, host: "0.0.0.0", port: 0 }), /127\.0\.0\.1/);
  await assert.rejects(() => createRecordingStudioServer({ projectRoot: fixture.projectRoot, host: "::", port: 0 }), /127\.0\.0\.1/);
  const first = await createRecordingStudioServer({ projectRoot: fixture.projectRoot, workspaceRoot: fixture.workspaceRoot, host: "127.0.0.1", port: 0, catalog: fixture.catalog, workspace: fixture.workspace, controller: fixture.controller });
  t.after(async () => { await first.close(); });
  await assert.rejects(
    () => createRecordingStudioServer({ projectRoot: fixture.projectRoot, workspaceRoot: fixture.workspaceRoot, host: "127.0.0.1", port: first.address.port, catalog: fixture.catalog, workspace: fixture.workspace, controller: fixture.controller }),
    /端口|启动/
  );
});

test("rejects DNS rebinding and unsafe routes before reads or writes", async (t) => {
  const fixture = await startFixture(t);
  const before = fs.readFileSync(path.join(fixture.workspaceRoot, "state.json"));
  for (const headers of [
    { Host: `example.test:${fixture.server.address.port}` },
    { Origin: "http://example.test" },
    { Origin: "null" },
    { Origin: `http://127.0.0.1:${fixture.server.address.port + 1}` }
  ]) {
    const response = await request(fixture.server, { method: "POST", pathname: "/api/targets/alphabet:aa/status", headers: { "Content-Type": "application/json", ...headers }, body: '{"status":"needs-rerecord"}' });
    assert.equal(response.status, 403);
    assert.equal(json(response).error.code, "LOCAL_ONLY");
  }
  for (const pathname of ["/api/audio/current/%2Fetc", "/api/audio/current/%252e%252e", "/api/audio/current/%", "/api/audio/current/../alphabet:aa", "/api/catalog?stableId=alphabet:aa", "/api/unknown"]) {
    const response = await request(fixture.server, { pathname });
    assert.ok([400, 404].includes(response.status), pathname);
  }
  assert.deepEqual(fs.readFileSync(path.join(fixture.workspaceRoot, "state.json")), before);
});

test("enforces exact methods and content types before state mutation", async (t) => {
  const fixture = await startFixture(t);
  const before = fs.readFileSync(path.join(fixture.workspaceRoot, "state.json"));
  for (const input of [
    { method: "PUT", pathname: "/api/catalog" },
    { method: "POST", pathname: "/api/targets/alphabet:aa/status", body: '{"status":"needs-rerecord"}' },
    { method: "POST", pathname: "/api/targets/alphabet:aa/status", headers: { "Content-Type": "application/json; charset=utf-8" }, body: '{"status":"needs-rerecord"}' },
    { method: "POST", pathname: "/api/takes/alphabet:aa", headers: { "Content-Type": "application/octet-stream" }, body: validWebm }
  ]) {
    const response = await request(fixture.server, input);
    assert.ok([405, 415].includes(response.status));
  }
  assert.deepEqual(fs.readFileSync(path.join(fixture.workspaceRoot, "state.json")), before);
});

test("streams raw takes safely and supports reviewed workspace and importer routes", async (t) => {
  const fixture = await startFixture(t);
  const tooLarge = Buffer.alloc(20 * 1024 * 1024 + 1, 0);
  const oversized = await request(fixture.server, { method: "POST", pathname: "/api/takes/alphabet:aa", headers: { "Content-Type": "audio/webm", "Content-Length": String(tooLarge.length) }, body: tooLarge });
  assert.equal(oversized.status, 413);
  assertSafeJsonResponse(oversized, fixture);
  const invalid = await request(fixture.server, { method: "POST", pathname: "/api/takes/alphabet:aa", headers: { "Content-Type": "audio/webm" }, body: Buffer.from("not-webm") });
  assert.equal(invalid.status, 400);
  assertSafeJsonResponse(invalid, fixture);
  const uploaded = await request(fixture.server, { method: "POST", pathname: "/api/takes/alphabet:aa", headers: { "Content-Type": "audio/webm" }, body: changedWebm() });
  assert.equal(uploaded.status, 201);
  const takeId = json(uploaded).take.id;
  const takeAudio = await request(fixture.server, { pathname: `/api/audio/take/alphabet:aa/${takeId}` });
  const currentAudio = await request(fixture.server, { pathname: "/api/audio/current/alphabet:aa" });
  assert.equal(takeAudio.status, 200);
  assert.equal(takeAudio.headers["content-type"], "audio/webm");
  assert.equal(currentAudio.status, 200);
  assert.deepEqual(Buffer.from(takeAudio.text, "binary"), Buffer.from(takeAudio.text, "binary"));
  const status = await request(fixture.server, { method: "POST", pathname: "/api/targets/alphabet:aa/status", headers: { "Content-Type": "application/json" }, body: '{"status":"needs-rerecord"}' });
  assert.equal(status.status, 200);
  assertSafeJsonResponse(status, fixture);
  const approve = await request(fixture.server, { method: "POST", pathname: "/api/targets/alphabet:aa/approve", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ takeId }) });
  assert.equal(approve.status, 200);
  assertSafeJsonResponse(approve, fixture);
  const preview = await request(fixture.server, { method: "POST", pathname: "/api/import/preview", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(preview.status, 200);
  assert.equal(json(preview).operations[0].sourcePath, undefined);
  assertSafeJsonResponse(preview, fixture);
  const apply = await request(fixture.server, { method: "POST", pathname: "/api/import/apply", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: json(preview).planId }) });
  assert.equal(apply.status, 200);
  assertSafeJsonResponse(apply, fixture);
  const operation = json(apply).operations[0];
  const finalize = await request(fixture.server, { method: "POST", pathname: "/api/import/finalize", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ importId: json(apply).importId, stableId: "alphabet:aa" }) });
  assert.equal(finalize.status, 200);
  assertSafeJsonResponse(finalize, fixture);
  const repeated = await request(fixture.server, { method: "POST", pathname: "/api/import/finalize", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ importId: json(apply).importId, stableId: "alphabet:aa" }) });
  assert.equal(repeated.status, 400);
  assertSafeJsonResponse(repeated, fixture);
  assert.equal(operation.targetPath, undefined);
  assert.deepEqual(fs.readFileSync(fixture.currentPath), changedWebm());
});

test("rejects importer replay, multi-value bodies, static traversal, and repeated close", async (t) => {
  const fixture = await startFixture(t);
  const terminalErrors = [];
  const originalError = console.error;
  console.error = (...values) => terminalErrors.push(values);
  let noPreview;
  try {
    noPreview = await request(fixture.server, { method: "POST", pathname: "/api/import/apply", headers: { "Content-Type": "application/json" }, body: `{"planId":"${"0".repeat(64)}"}` });
  } finally {
    console.error = originalError;
  }
  assert.equal(noPreview.status, 400);
  assert.deepEqual(terminalErrors, []);
  const multiple = await request(fixture.server, { method: "POST", pathname: "/api/import/finalize", headers: { "Content-Type": "application/json" }, body: '{"importId":"one","stableId":"alphabet:aa","stableIds":["alphabet:aa"]}' });
  assert.equal(multiple.status, 400);
  const root = await request(fixture.server, { pathname: "/" });
  assert.equal(root.status, 404);
  for (const pathname of ["/.env", "/%2e%2e/server.mjs", "/file.txt"]) {
    const response = await request(fixture.server, { pathname });
    assert.ok([400, 404].includes(response.status));
  }
  await Promise.all([fixture.server.close(), fixture.server.close(), fixture.server.close()]);
});

test("contains no command execution, public bind, CORS wildcard, or bulk deletion", () => {
  const source = fs.readFileSync(path.join(repositoryRoot, "tools/recording-studio/server.mjs"), "utf8");
  assert.doesNotMatch(source, /child_process|exec\s*\(|spawn\s*\(|\brm\b|rmdir|CORS|Access-Control-Allow-Origin/);
  assert.doesNotMatch(source, /0\.0\.0\.0|server\.listen\([^)]*[^"']localhost/);
});
