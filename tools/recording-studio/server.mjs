#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildRecordingCatalog } from "./catalog.mjs";
import { createImportController } from "./importer.mjs";
import { createRecordingWorkspace } from "./workspace.mjs";
import { LOUDNESS_STANDARD } from "../lib/audio-loudness.mjs";
import { validateWebmBuffer } from "../lib/webm-audio.mjs";

const LOOPBACK_HOST = "127.0.0.1";
const MAX_JSON_BYTES = 64 * 1024;
const MAX_TAKE_BYTES = 20 * 1024 * 1024;
const STATIC_EXTENSIONS = new Set([".html", ".css", ".js", ".svg"]);
const MANUAL_STATUSES = new Set(["needs-rerecord", "pending-review", "pending"]);

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function fail(status, code, message) {
  throw new ApiError(status, code, message);
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function safeError(error) {
  if (error instanceof ApiError) return error;
  if (error instanceof SyntaxError) return new ApiError(400, "INVALID_JSON", "请求内容不是有效的 JSON。");
  return new ApiError(400, "INVALID_REQUEST", "请求无效，请检查录音工作台操作。");
}

function jsonResponse(response, status, value) {
  const body = Buffer.from(`${JSON.stringify(value)}\n`);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(body.length),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(body);
}

function errorResponse(response, error) {
  jsonResponse(response, error.status, { error: { code: error.code, message: error.message } });
}

function assertExactKeys(body, keys) {
  if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "INVALID_JSON", "JSON 请求内容必须是对象。");
  const actual = Object.keys(body).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(400, "INVALID_REQUEST", "请求字段不正确。");
}

function bodyLimitFromHeader(request, maxBytes) {
  const value = request.headers["content-length"];
  if (value === undefined) return;
  if (typeof value !== "string" || !/^(0|[1-9]\d*)$/.test(value)) fail(400, "INVALID_LENGTH", "请求长度无效。");
  if (Number(value) > maxBytes) fail(413, "BODY_TOO_LARGE", "请求内容过大。");
}

async function readBody(request, maxBytes) {
  bodyLimitFromHeader(request, maxBytes);
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maxBytes) fail(413, "BODY_TOO_LARGE", "请求内容过大。");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length);
}

async function readJson(request) {
  if (request.headers["content-type"] !== "application/json") fail(415, "UNSUPPORTED_MEDIA_TYPE", "JSON 请求必须使用 application/json。 ");
  const body = await readBody(request, MAX_JSON_BYTES);
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    fail(400, "INVALID_JSON", "请求内容不是有效的 JSON。");
  }
}

function decodeSegment(value) {
  if (!value || value === "." || value === ".." || value.includes("\\") || /%2f|%5c|%25/i.test(value)) fail(400, "INVALID_PATH", "请求路径无效。");
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    fail(400, "INVALID_PATH", "请求路径无效。");
  }
  if (!decoded || decoded === "." || decoded === ".." || decoded.includes("/") || decoded.includes("\\") || decoded.includes("%")) fail(400, "INVALID_PATH", "请求路径无效。");
  return decoded;
}

function parseRequestPath(request) {
  const raw = request.url || "/";
  if (!raw.startsWith("/") || raw.includes("?") || raw.includes("#") || raw.includes("\\") || /%2f|%5c|%25/i.test(raw)) fail(400, "INVALID_PATH", "请求路径无效。");
  if (raw === "/") return [];
  return raw.split("/").slice(1).map(decodeSegment);
}

function assertLocalRequest(request, port) {
  const host = request.headers.host;
  const permittedHosts = new Set([`${LOOPBACK_HOST}:${port}`, `localhost:${port}`]);
  if (typeof host !== "string" || !permittedHosts.has(host)) fail(403, "LOCAL_ONLY", "仅允许本机录音工作台访问。");
  const origin = request.headers.origin;
  if (origin === undefined) return;
  if (typeof origin !== "string") fail(403, "LOCAL_ONLY", "仅允许本机录音工作台访问。");
  const permittedOrigins = new Set([`http://${LOOPBACK_HOST}:${port}`, `http://localhost:${port}`]);
  if (!permittedOrigins.has(origin)) fail(403, "LOCAL_ONLY", "仅允许本机录音工作台访问。");
}

function publicCatalog(catalog) {
  return {
    schemaVersion: catalog.schemaVersion,
    generatedAt: catalog.generatedAt,
    targets: catalog.targets.map(({ absoluteOutputPath, ...target }) => target)
  };
}

function publicPlan(plan, catalogById) {
  return {
    planId: plan.planId,
    createdAt: plan.createdAt,
    loudnessStandard: {
      version: LOUDNESS_STANDARD.version,
      integratedLufs: LOUDNESS_STANDARD.integratedLufs,
      truePeakDbtp: LOUDNESS_STANDARD.truePeakDbtp,
      lraLu: LOUDNESS_STANDARD.lraLu
    },
    operations: plan.operations.map(({ sourcePath, targetPath, ...operation }) => {
      const target = catalogById.get(operation.stableId);
      return {
        ...operation,
        targetFilename: target.currentFile,
        backupDescriptor: operation.targetExisted ? `backups/<本次导入批次>/${target.category}/${target.currentFile}` : null
      };
    })
  };
}

function publicImport(result) {
  return {
    schemaVersion: result.schemaVersion,
    status: result.status,
    importId: result.importId,
    planId: result.planId,
    completedAt: result.completedAt,
    operations: result.operations.map(({ sourcePath, targetPath, backupPath, ...operation }) => operation)
  };
}

function publicFinalization(result) {
  return {
    schemaVersion: result.schemaVersion,
    importId: result.importId,
    stableId: result.stableId,
    finalizedAt: result.finalizedAt,
    replacementSha256: result.replacementSha256,
    backupSha256: result.backupSha256,
    finalized: true
  };
}

function assertCurrentAudioPath(projectRoot, target) {
  const audioRoot = path.resolve(projectRoot, "prototype/assets/audio/human");
  const currentPath = path.resolve(target.absoluteOutputPath);
  if (!isInside(audioRoot, currentPath)) fail(404, "NOT_FOUND", "录音文件不存在。");
  let current = audioRoot;
  try {
    if (fs.lstatSync(current).isSymbolicLink()) fail(404, "NOT_FOUND", "录音文件不存在。");
    for (const segment of path.relative(audioRoot, currentPath).split(path.sep)) {
      if (!segment) continue;
      current = path.join(current, segment);
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) fail(404, "NOT_FOUND", "录音文件不存在。");
    }
    if (!fs.lstatSync(currentPath).isFile()) fail(404, "NOT_FOUND", "录音文件不存在。");
    if (!isInside(fs.realpathSync(audioRoot), fs.realpathSync(currentPath))) fail(404, "NOT_FOUND", "录音文件不存在。");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    fail(404, "NOT_FOUND", "录音文件不存在。");
  }
  return currentPath;
}

function sendAudio(response, audioPath) {
  const buffer = fs.readFileSync(audioPath);
  validateWebmBuffer(buffer);
  response.writeHead(200, {
    "Content-Type": "audio/webm",
    "Content-Length": String(buffer.length),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(buffer);
}

function serveStatic(response, segments, staticRoot) {
  if (segments.some((segment) => !segment || segment.startsWith(".") || segment.includes("." ) && segment.split(".").some((part) => part === ""))) fail(404, "NOT_FOUND", "页面不存在。");
  const requested = segments.length === 0 ? "index.html" : segments.join(path.sep);
  const extension = path.extname(requested);
  if (!STATIC_EXTENSIONS.has(extension)) fail(404, "NOT_FOUND", "页面不存在。");
  if (!fs.existsSync(staticRoot)) fail(404, "NOT_FOUND", "页面不存在。");
  const rootStat = fs.lstatSync(staticRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) fail(404, "NOT_FOUND", "页面不存在。");
  const filePath = path.resolve(staticRoot, requested);
  if (!isInside(staticRoot, filePath)) fail(404, "NOT_FOUND", "页面不存在。");
  let current = staticRoot;
  for (const segment of requested.split(path.sep)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) fail(404, "NOT_FOUND", "页面不存在。");
    if (fs.lstatSync(current).isSymbolicLink()) fail(404, "NOT_FOUND", "页面不存在。");
  }
  const buffer = fs.readFileSync(filePath);
  const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
  response.writeHead(200, { "Content-Type": contentTypes[extension], "Content-Length": String(buffer.length), "X-Content-Type-Options": "nosniff" });
  response.end(buffer);
}

export async function createRecordingStudioServer({
  projectRoot,
  workspaceRoot = path.join(projectRoot, "recording-workspace"),
  host = LOOPBACK_HOST,
  port = 4175,
  openBrowser = false,
  catalog: providedCatalog,
  workspace: providedWorkspace,
  controller: providedController
}) {
  assert.equal(host, LOOPBACK_HOST, "录音工作台只能监听 127.0.0.1");
  assert.equal(openBrowser, false, "录音工作台不会自动打开浏览器");
  assert.ok(Number.isInteger(port) && port >= 0 && port <= 65535, "录音工作台端口无效");
  assert.equal(typeof projectRoot, "string", "projectRoot is required");
  const normalizedProjectRoot = path.resolve(projectRoot);
  const injected = [providedCatalog, providedWorkspace, providedController];
  assert.ok(injected.every(Boolean) || injected.every((item) => item === undefined), "录音工作台测试依赖必须完整提供");
  const catalog = providedCatalog || buildRecordingCatalog({ projectRoot: normalizedProjectRoot });
  const workspace = providedWorkspace || createRecordingWorkspace({ projectRoot: normalizedProjectRoot, workspaceRoot, catalog });
  const controller = providedController || createImportController({ projectRoot: normalizedProjectRoot, workspaceRoot, catalog, workspace });
  const catalogById = new Map(catalog.targets.map((target) => [target.stableId, target]));
  const staticRoot = path.join(normalizedProjectRoot, "tools/recording-studio/public");
  let boundAddress;
  let closing;

  function requireTarget(stableId) {
    const target = catalogById.get(stableId);
    if (!target) fail(404, "UNKNOWN_TARGET", "录音目标不存在。");
    return target;
  }

  async function route(request, response) {
    assertLocalRequest(request, boundAddress.port);
    const segments = parseRequestPath(request);
    const method = request.method || "GET";
    if (segments[0] !== "api") {
      if (method !== "GET") fail(405, "METHOD_NOT_ALLOWED", "请求方法不允许。");
      return serveStatic(response, segments, staticRoot);
    }
    if (method === "GET" && segments.length === 2 && segments[1] === "catalog") return jsonResponse(response, 200, publicCatalog(catalog));
    if (method === "GET" && segments.length === 2 && segments[1] === "state") return jsonResponse(response, 200, workspace.loadState());
    if (method === "GET" && segments.length === 4 && segments[1] === "audio" && segments[2] === "current") return sendAudio(response, assertCurrentAudioPath(normalizedProjectRoot, requireTarget(segments[3])));
    if (method === "GET" && segments.length === 5 && segments[1] === "audio" && segments[2] === "take") return sendAudio(response, workspace.getTakePath({ stableId: requireTarget(segments[3]).stableId, takeId: segments[4] }));
    if (method === "POST" && segments.length === 3 && segments[1] === "takes") {
      const target = requireTarget(segments[2]);
      if (request.headers["content-type"] !== "audio/webm") fail(415, "UNSUPPORTED_MEDIA_TYPE", "录音上传必须使用 audio/webm。");
      const buffer = await readBody(request, MAX_TAKE_BYTES);
      try {
        const take = workspace.saveTake({ stableId: target.stableId, buffer });
        return jsonResponse(response, 201, { take });
      } catch (error) {
        if (error instanceof ApiError) throw error;
        fail(400, "INVALID_RECORDING", "录音文件无效，请重新录制。");
      }
    }
    if (method === "POST" && segments.length === 4 && segments[1] === "targets" && segments[3] === "status") {
      const body = await readJson(request);
      assertExactKeys(body, ["status"]);
      if (!MANUAL_STATUSES.has(body.status)) fail(400, "INVALID_STATUS", "录音状态无效。");
      return jsonResponse(response, 200, { target: workspace.setTargetStatus({ stableId: requireTarget(segments[2]).stableId, status: body.status }) });
    }
    if (method === "POST" && segments.length === 4 && segments[1] === "targets" && segments[3] === "approve") {
      const body = await readJson(request);
      assertExactKeys(body, ["takeId"]);
      if (typeof body.takeId !== "string") fail(400, "INVALID_TAKE", "录音编号无效。");
      return jsonResponse(response, 200, { target: workspace.approveTake({ stableId: requireTarget(segments[2]).stableId, takeId: body.takeId }) });
    }
    if (method === "POST" && segments.length === 4 && segments[1] === "targets" && segments[3] === "approve-current") {
      const body = await readJson(request);
      assertExactKeys(body, []);
      return jsonResponse(response, 200, { target: workspace.markCurrentApproved({ stableId: requireTarget(segments[2]).stableId }) });
    }
    if (method === "POST" && segments.length === 3 && segments[1] === "import" && segments[2] === "preview") {
      const body = await readJson(request);
      assertExactKeys(body, []);
      return jsonResponse(response, 200, publicPlan(controller.previewImport(), catalogById));
    }
    if (method === "POST" && segments.length === 3 && segments[1] === "import" && segments[2] === "apply") {
      const body = await readJson(request);
      assertExactKeys(body, ["planId"]);
      if (typeof body.planId !== "string") fail(400, "INVALID_PLAN", "导入计划无效。");
      return jsonResponse(response, 200, publicImport(controller.applyImport({ planId: body.planId })));
    }
    if (method === "POST" && segments.length === 3 && segments[1] === "import" && segments[2] === "finalize") {
      const body = await readJson(request);
      assertExactKeys(body, ["importId", "stableId"]);
      if (typeof body.importId !== "string" || typeof body.stableId !== "string") fail(400, "INVALID_IMPORT", "导入确认参数无效。");
      requireTarget(body.stableId);
      return jsonResponse(response, 200, publicFinalization(controller.finalizeReplacement({ importId: body.importId, stableId: body.stableId })));
    }
    if (["GET", "POST"].includes(method)) fail(404, "NOT_FOUND", "请求地址不存在。");
    fail(405, "METHOD_NOT_ALLOWED", "请求方法不允许。");
  }

  const server = http.createServer((request, response) => {
    route(request, response).catch((error) => {
      const safe = safeError(error);
      if (!(error instanceof ApiError) && error?.name !== "AssertionError") console.error(`录音工作台请求失败：${safe.code}`);
      if (!response.headersSent) errorResponse(response, safe);
      else response.destroy();
    });
  });

  try {
    await new Promise((resolve, reject) => {
      const onError = (error) => { server.off("listening", onListening); reject(error); };
      const onListening = () => { server.off("error", onError); resolve(); };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen({ host: LOOPBACK_HOST, port });
    });
  } catch (error) {
    const message = error?.code === "EADDRINUSE" ? "无法启动本地录音工作台：端口已被占用。" : "无法启动本地录音工作台。";
    throw new Error(message);
  }
  boundAddress = server.address();
  assert.ok(boundAddress && typeof boundAddress === "object" && boundAddress.address === LOOPBACK_HOST, "录音工作台必须绑定到 127.0.0.1");
  const address = Object.freeze({ address: boundAddress.address, family: boundAddress.family, port: boundAddress.port });
  return Object.freeze({
    url: `http://${LOOPBACK_HOST}:${address.port}`,
    address,
    close() {
      if (!closing) closing = new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())).catch((error) => error?.code === "ERR_SERVER_NOT_RUNNING" ? undefined : Promise.reject(error));
      return closing;
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createRecordingStudioServer({ projectRoot: path.resolve(import.meta.dirname, "../..") }).then((server) => {
    console.log(`本地录音工作台已启动：${server.url}`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
