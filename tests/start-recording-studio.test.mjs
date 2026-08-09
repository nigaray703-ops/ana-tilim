import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main } from "../tools/start-recording-studio.mjs";
import { buildRecordingCatalog } from "../tools/recording-studio/catalog.mjs";
import { createRecordingWorkspace } from "../tools/recording-studio/workspace.mjs";

function createProcessHarness() {
  const listeners = new Map();
  return {
    listeners,
    on(event, listener) { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(listener); return this; },
    off(event, listener) { const handlers = listeners.get(event); handlers?.delete(listener); if (handlers?.size === 0) listeners.delete(event); return this; },
    emit(event) { const results = [...(listeners.get(event) || [])].map((listener) => listener()); return results.length <= 1 ? results[0] : Promise.all(results); },
    exitCode: undefined
  };
}

function createServer({ port = 4175, close } = {}) {
  return {
    address: { address: "127.0.0.1", family: "IPv4", port },
    close: close || (async () => {})
  };
}

function createDependencies(overrides = {}) {
  const lines = [];
  const processApi = createProcessHarness();
  return {
    createServer: async (options) => createServer({ port: options.port }),
    open: () => ({ on() {}, unref() {} }),
    processApi,
    writeLine: (line) => lines.push(line),
    projectRoot: path.resolve(import.meta.dirname, ".."),
    ...overrides,
    lines
  };
}

test("starts loopback-only on an ephemeral port and skips Chrome with --no-open", async () => {
  const calls = [];
  const dependencies = createDependencies({
    createServer: async (options) => { calls.push(options); return createServer({ port: 49991 }); },
    open: () => { throw new Error("--no-open must not open Chrome"); }
  });

  const running = await main(["--no-open", "--port", "0"], dependencies);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].host, "127.0.0.1");
  assert.equal(calls[0].port, 0);
  assert.equal(running.url, "http://127.0.0.1:49991");
  assert.deepEqual(dependencies.lines, ["本地录音工作台已启动：http://127.0.0.1:49991"]);
  await running.close();
});

test("opens Chrome only after listening with the exact argv and leaves the server running on open failure", async () => {
  const events = new Map();
  const openCalls = [];
  const dependencies = createDependencies({
    createServer: async () => createServer({ port: 4175 }),
    open(command, args, options) {
      openCalls.push({ command, args, options });
      return { on(event, listener) { events.set(event, listener); }, unref() {} };
    }
  });

  const running = await main([], dependencies);
  assert.deepEqual(openCalls, [{ command: "open", args: ["-a", "Google Chrome", "http://127.0.0.1:4175"], options: { stdio: "ignore" } }]);
  events.get("error")(new Error("Chrome unavailable"));
  assert.equal(running.closed, false);
  assert.deepEqual(dependencies.lines, [
    "本地录音工作台已启动：http://127.0.0.1:4175",
    "无法自动打开 Chrome，请手动打开：http://127.0.0.1:4175"
  ]);
  await running.close();
});

test("rejects unsafe launcher arguments before starting a server", async () => {
  for (const args of [["--port"], ["--port", "1.5"], ["--port", "-1"], ["--port", "65536"], ["--port", "1", "--port", "2"], ["--host", "0.0.0.0"], ["--unknown"]]) {
    const dependencies = createDependencies({ createServer: () => { throw new Error("must not start"); } });
    await assert.rejects(() => main(args, dependencies), /启动参数无效/);
    assert.deepEqual(dependencies.lines, []);
  }
});

test("does not hide a busy-port or startup failure behind another port", async () => {
  const dependencies = createDependencies({
    createServer: async () => { throw new Error("无法启动本地录音工作台：端口已被占用。"); }
  });
  await assert.rejects(() => main(["--no-open", "--port", "4175"], dependencies), /端口已被占用/);
  assert.deepEqual(dependencies.lines, []);
});

test("SIGINT and SIGTERM close once, remove only registered listeners, and preserve workspace files", async () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-launcher-workspace-"));
  const statePath = path.join(workspaceRoot, "state.json");
  fs.writeFileSync(statePath, '{"draft":"keep"}\n');
  let closeCalls = 0;
  const dependencies = createDependencies({
    createServer: async () => createServer({ port: 4175, close: async () => { closeCalls += 1; } })
  });
  const unrelatedSignalListener = () => "keep";
  dependencies.processApi.on("SIGINT", unrelatedSignalListener);

  const running = await main(["--no-open"], dependencies);
  const signalResults = await dependencies.processApi.emit("SIGINT");
  const first = signalResults.find((result) => result?.exitCode !== undefined);

  assert.equal(first.exitCode, 0);
  assert.equal(closeCalls, 1);
  assert.deepEqual([...dependencies.processApi.listeners.get("SIGINT")], [unrelatedSignalListener]);
  assert.equal(dependencies.processApi.listeners.has("SIGTERM"), false);
  assert.equal(fs.readFileSync(statePath, "utf8"), '{"draft":"keep"}\n');
  assert.equal(dependencies.processApi.exitCode, 0);
  await running.close();

  const termDependencies = createDependencies({
    createServer: async () => createServer({ port: 4175, close: async () => { closeCalls += 1; } })
  });
  await main(["--no-open"], termDependencies);
  const second = await termDependencies.processApi.emit("SIGTERM");
  assert.equal(second.exitCode, 0);
  assert.equal(closeCalls, 2);
  assert.equal(termDependencies.processApi.listeners.size, 0);
});

test("a failed server close still removes launcher signal listeners and returns a deterministic failure", async () => {
  const dependencies = createDependencies({
    createServer: async () => createServer({ port: 4175, close: async () => { throw new Error("injected close failure"); } })
  });
  const running = await main(["--no-open"], dependencies);

  const result = await dependencies.processApi.emit("SIGINT");

  assert.deepEqual(result, { exitCode: 1 });
  assert.equal(dependencies.processApi.listeners.size, 0);
  await assert.rejects(() => running.close(), /injected close failure/);
});

test("a restarted studio sees the same target state and both takes", async () => {
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-launcher-restart-"));
  const catalog = buildRecordingCatalog({ projectRoot });
  const firstDependencies = createDependencies({ projectRoot, workspaceRoot });
  const first = await main(["--no-open", "--port", "0"], firstDependencies);
  const workspace = createRecordingWorkspace({ projectRoot, workspaceRoot, catalog });
  const target = workspace.loadState().targets["alphabet:aa"];
  const audioPath = catalog.targets.find((item) => item.stableId === "alphabet:aa").absoluteOutputPath;
  const audio = fs.readFileSync(audioPath);
  workspace.saveTake({ stableId: "alphabet:aa", buffer: audio, createdAt: "2026-08-10T01:00:00.000Z" });
  workspace.saveTake({ stableId: "alphabet:aa", buffer: audio, createdAt: "2026-08-10T01:01:00.000Z" });
  workspace.markCurrentApproved({ stableId: "alphabet:aa" });
  await first.close();

  const second = await main(["--no-open", "--port", "0"], createDependencies({ projectRoot, workspaceRoot }));
  const restored = createRecordingWorkspace({ projectRoot, workspaceRoot, catalog }).loadState().targets["alphabet:aa"];
  assert.equal(target.status, "pending-review");
  assert.equal(restored.status, "approved-current");
  assert.equal(restored.takes.length, 2);
  await second.close();
});

test("launcher source never enables shell execution, public binding, or deletion", () => {
  const source = fs.readFileSync(path.resolve(import.meta.dirname, "../tools/start-recording-studio.mjs"), "utf8");
  const ignored = fs.readFileSync(path.resolve(import.meta.dirname, "../.gitignore"), "utf8");
  assert.doesNotMatch(source, /shell\s*:\s*true|\bexec(?:File)?\s*\(|0\.0\.0\.0|rm\s+-rf|rmdir|unlinkSync|readdirSync\([^)]*\).*unlink/i);
  assert.match(source, /open\("open", \["-a", "Google Chrome", url\], \{ stdio: "ignore" \}\)/);
  assert.match(ignored, /^\/recording-workspace\/$/m);
});

test("direct-run argument failures use a concise nonzero Chinese result without local paths or stacks", () => {
  const launcherPath = path.resolve(import.meta.dirname, "../tools/start-recording-studio.mjs");
  const result = spawnSync(process.execPath, [launcherPath, "--host", "0.0.0.0"], { encoding: "utf8" });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /启动参数无效/);
  assert.doesNotMatch(result.stderr, /Error:|at .*start-recording-studio|\/(Users|private)\//);
});
