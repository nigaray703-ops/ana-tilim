import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const feedbackPath = "prototype/feedback.js";
assert.ok(fs.existsSync(feedbackPath), "the private feedback service module should exist");

const context = { console, window: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(feedbackPath, "utf8"), context, { filename: feedbackPath });

const feedbackApi = context.window.ANA_TILIM_FEEDBACK;
assert.ok(feedbackApi, "feedback.js should expose ANA_TILIM_FEEDBACK");
assert.deepEqual(Array.from(feedbackApi.CATEGORIES), ["content", "audio", "display", "account", "other"]);
assert.deepEqual(Array.from(feedbackApi.STATUSES), ["new", "reviewed", "resolved"]);

const normalized = feedbackApi.validateFeedback({
  category: " display ",
  message: "  字母和中文说明有重叠，需要调整间距。  ",
  contact: "  learner@example.com  "
});
assert.deepEqual(JSON.parse(JSON.stringify(normalized)), {
  category: "display",
  message: "字母和中文说明有重叠，需要调整间距。",
  contact: "learner@example.com"
});
assert.throws(() => feedbackApi.validateFeedback({ category: "unknown", message: "这是足够长的反馈内容。" }), /请选择有效的反馈类型/);
assert.throws(() => feedbackApi.validateFeedback({ category: "content", message: "太短" }), /至少填写 10 个字/);
assert.throws(() => feedbackApi.validateFeedback({ category: "content", message: "字".repeat(2001) }), /不能超过 2000 个字/);
assert.throws(() => feedbackApi.validateFeedback({ category: "content", message: "这是足够长的反馈内容。", contact: "x".repeat(121) }), /联系方式不能超过 120 个字/);
assert.throws(
  () => feedbackApi.validateFeedback({ category: "content", message: "这是足够长的反馈内容。", attachment: { name: "proof.png" } }),
  /暂不支持附件/
);

const calls = [];
const records = [
  { id: "feedback-1", category: "display", message: "字母显示有重叠。", contact: "", edition: "cn", status: "new", created_at: "2026-08-10T00:00:00.000Z" }
];
const fakeSupabase = {
  from(table) {
    assert.equal(table, "user_feedback");
    return {
      async insert(payload) {
        calls.push(["insert", payload]);
        return { error: null };
      },
      select(columns) {
        calls.push(["select", columns]);
        return {
          order(column, options) {
            calls.push(["order", column, options]);
            return {
              async limit(value) {
                calls.push(["limit", value]);
                return { data: records, error: null };
              }
            };
          }
        };
      },
      update(payload) {
        calls.push(["update", payload]);
        return {
          async eq(column, value) {
            calls.push(["eq", column, value]);
            return { error: null };
          }
        };
      }
    };
  },
  async rpc(name) {
    calls.push(["rpc", name]);
    return { data: true, error: null };
  }
};

const client = feedbackApi.createFeedbackClient({
  supabaseClient: fakeSupabase,
  edition: "cn",
  appVersion: "20260810-feedback"
});
await client.submit({ category: "display", message: "  字母显示有重叠，需要修复。  ", contact: "" });
assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), ["insert", {
  category: "display",
  message: "字母显示有重叠，需要修复。",
  contact: "",
  edition: "cn",
  app_version: "20260810-feedback"
}]);
assert.equal(await client.isAdmin(), true, "the UI should ask the server-side UID gate instead of exposing an owner email");
assert.deepEqual(JSON.parse(JSON.stringify(await client.list())), records);
await client.updateStatus("feedback-1", "resolved");
assert.ok(calls.some((call) => call[0] === "update" && call[1].status === "resolved"));
assert.ok(calls.some((call) => call[0] === "eq" && call[1] === "id" && call[2] === "feedback-1"));
await assert.rejects(() => client.updateStatus("feedback-1", "deleted"), /无效的反馈状态/);

const unavailable = feedbackApi.createFeedbackClient({ edition: "global", appVersion: "test" });
await assert.rejects(() => unavailable.submit({ category: "other", message: "这是一条足够长的匿名反馈。" }), /反馈服务尚未连接/);
await assert.rejects(() => unavailable.list(), /反馈服务尚未连接/);

console.log("anonymous feedback service checks passed");
