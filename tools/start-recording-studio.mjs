#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRecordingStudioServer } from "./recording-studio/server.mjs";

const LOOPBACK_HOST = "127.0.0.1";
const DEFAULT_PORT = 4175;

function argumentError() {
  return new Error("启动参数无效：只支持 --port 0 到 65535，以及 --no-open。");
}

function parseArguments(args) {
  if (!Array.isArray(args)) throw argumentError();
  let port = DEFAULT_PORT;
  let noOpen = false;
  let sawPort = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--no-open") {
      if (noOpen) throw argumentError();
      noOpen = true;
      continue;
    }
    if (argument === "--port") {
      if (sawPort) throw argumentError();
      const value = args[index + 1];
      if (typeof value !== "string" || !/^\d+$/.test(value)) throw argumentError();
      port = Number(value);
      if (!Number.isSafeInteger(port) || port > 65535) throw argumentError();
      sawPort = true;
      index += 1;
      continue;
    }
    throw argumentError();
  }
  return { port, noOpen };
}

function localUrl(server) {
  const address = server.address;
  if (!address || address.address !== LOOPBACK_HOST || !Number.isInteger(address.port)) throw new Error("无法启动本地录音工作台。");
  return `http://${LOOPBACK_HOST}:${address.port}`;
}

export async function main(args = process.argv.slice(2), dependencies = {}) {
  const options = parseArguments(args);
  const createServer = dependencies.createServer || createRecordingStudioServer;
  const open = dependencies.open || spawn;
  const processApi = dependencies.processApi || process;
  const writeLine = dependencies.writeLine || ((line) => console.log(line));
  const projectRoot = dependencies.projectRoot || path.resolve(import.meta.dirname, "..");
  const workspaceRoot = dependencies.workspaceRoot || path.join(projectRoot, "recording-workspace");
  const server = await createServer({ projectRoot, workspaceRoot, host: LOOPBACK_HOST, port: options.port });
  const url = localUrl(server);
  let closed = false;
  let closing;
  let signalResult;
  let removeListeners = () => {};

  async function close() {
    if (!closing) {
      closing = Promise.resolve()
        .then(() => server.close())
        .then(() => { closed = true; })
        .finally(removeListeners);
    }
    await closing;
    return { exitCode: 0 };
  }

  async function shutdown() {
    if (!signalResult) {
      signalResult = close().then((result) => {
        processApi.exitCode = result.exitCode;
        return result;
      }, () => {
        processApi.exitCode = 1;
        return { exitCode: 1 };
      });
    }
    return signalResult;
  }

  const onSignal = () => shutdown();
  processApi.on("SIGINT", onSignal);
  processApi.on("SIGTERM", onSignal);
  removeListeners = () => {
    processApi.off("SIGINT", onSignal);
    processApi.off("SIGTERM", onSignal);
  };

  writeLine(`本地录音工作台已启动：${url}`);
  if (!options.noOpen) {
    try {
      const child = open("open", ["-a", "Google Chrome", url], { stdio: "ignore" });
      child.on("error", () => writeLine(`无法自动打开 Chrome，请手动打开：${url}`));
      child.unref?.();
    } catch {
      writeLine(`无法自动打开 Chrome，请手动打开：${url}`);
    }
  }

  return Object.freeze({
    server,
    url,
    get closed() { return closed; },
    close,
    shutdown
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
